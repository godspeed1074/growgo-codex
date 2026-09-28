import {
  HttpsError,
  onCall,
  type CallableRequest
} from "firebase-functions/v2/https";
import { Timestamp, type DocumentData } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import { requireAdminAccount, type AdminAccount } from "../domain/admin/adminAccounts";
import { getPlayerSessionDocumentRef, requireActiveDeviceSessionIfEnabled } from "../domain/players/activeDeviceSession";
import {
  getPlayerModerationRef,
  PLAYER_MODERATION_SCHEMA_VERSION,
  readStoredPlayerRestriction,
  type PlayerRestrictionStatus
} from "../domain/players/playerModeration";
import { getPlayerDocumentRef, readStoredPlayerDocument } from "../domain/players/playerStore";
import {
  inventoryItemIds,
  MARKET_INVENTORY_SCHEMA_VERSION,
  MARKET_MAX_ITEM_QUANTITY,
  readMarketInventory
} from "../domain/market/marketCatalog";
import { avatarNameKey } from "./completePlayerProfile";
import { getAdminFirestore } from "../firebaseAdmin";
import { getPlayerPublicCodeRef, normalizePlayerPublicCode } from "../domain/social/playerPublicCodes";
import { requireDevelopmentBackendCapabilityAccess } from "../security/developmentBackendCapabilityGuard";
import { requireAppCheckIfEnabled, requireAuthenticated } from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import { asObject, assertAllowedKeys, requireString } from "../validation/requestValidation";

const PLAYER_INVENTORIES_COLLECTION = "playerMarketInventories" as const;
const PLAYER_ADMIN_HISTORY_SUBCOLLECTION = "adminHistory" as const;
const PLAYER_MODERATION_HISTORY_SUBCOLLECTION = "history" as const;
const MODERATION_EMAIL_QUEUE_COLLECTION = "moderationEmailQueue" as const;
const MAX_PROFILE_HISTORY = 30;
const MAX_ADJUSTMENT_QUANTITY = 10_000;
const MAX_PLAYER_COIN_BALANCE = 1_000_000_000;

type AdminAdjustmentDirection = "grant" | "remove";
type AdminModerationAction = "warning" | "suspend" | "ban" | "clear-restriction";

interface SecuredAdminActor {
  uid: string;
  role: AdminAccount["role"];
  name: string;
}

function inventoryRef(uid: string) {
  return getAdminFirestore().collection(PLAYER_INVENTORIES_COLLECTION).doc(uid);
}

async function requireSecuredAdminActor(
  request: CallableRequest<unknown>,
  allowedKeys: readonly string[]
): Promise<{ payload: Record<string, unknown>; actor: SecuredAdminActor }> {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });
  const payload = asObject(request.data, "Player tools request");
  assertAllowedKeys(payload, allowedKeys, "Player tools request");
  await requireActiveDeviceSessionIfEnabled({
    uid: authContext.uid,
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined
  });
  const account = await requireAdminAccount(authContext.uid);
  const playerSnapshot = await getPlayerDocumentRef(authContext.uid).get();
  const player = playerSnapshot.exists ? readStoredPlayerDocument(playerSnapshot.data()) : null;
  return {
    payload,
    actor: {
      uid: authContext.uid,
      role: account.role,
      name: player?.displayName ?? "GrowGo Admin"
    }
  };
}

export async function searchAdminPlayerHandler(request: CallableRequest<unknown>) {
  const { payload, actor } = await requireSecuredAdminActor(request, ["deviceId", "query"]);
  const query = requireString(payload.query, "query", 3, 40).trim();
  const uid = await resolvePlayerUidForExactLookup(query);
  if (!uid) throw new HttpsError("not-found", "No GrowGo player matched that exact name or code.");
  return {
    ok: true,
    player: await buildAdminPlayerProfile(uid, actor.role === "owner")
  };
}

export async function adjustAdminPlayerInventoryHandler(request: CallableRequest<unknown>) {
  const { payload, actor } = await requireSecuredAdminActor(request, [
    "deviceId", "targetUid", "itemId", "direction", "quantity", "note"
  ]);
  const targetUid = requireString(payload.targetUid, "targetUid", 8, 128);
  const itemId = requireAdminInventoryItem(payload.itemId);
  const direction = requireAdjustmentDirection(payload.direction);
  const quantity = requirePositiveInteger(payload.quantity, "quantity", MAX_ADJUSTMENT_QUANTITY);
  const note = optionalText(payload.note, 300);
  const db = getAdminFirestore();
  const targetRef = getPlayerDocumentRef(targetUid);
  const targetInventoryRef = inventoryRef(targetUid);
  const historyRef = targetRef.collection(PLAYER_ADMIN_HISTORY_SUBCOLLECTION).doc();
  const now = Timestamp.now();

  const result = await db.runTransaction(async (transaction) => {
    const [playerSnapshot, inventorySnapshot] = await Promise.all([
      transaction.get(targetRef),
      transaction.get(targetInventoryRef)
    ]);
    if (!playerSnapshot.exists) throw new HttpsError("not-found", "That player profile could not be found.");
    const player = readStoredPlayerDocument(playerSnapshot.data());
    if (!player.profileComplete || !player.displayName) {
      throw new HttpsError("failed-precondition", "That GrowGo account does not have a completed player profile.");
    }

    let previousQuantity: number;
    let nextQuantity: number;
    if (itemId === "coins") {
      previousQuantity = player.coins;
      nextQuantity = direction === "grant"
        ? Math.min(MAX_PLAYER_COIN_BALANCE, previousQuantity + quantity)
        : Math.max(0, previousQuantity - quantity);
      transaction.update(targetRef, { coins: nextQuantity, updatedAt: now });
    } else {
      const inventory = readMarketInventory(inventorySnapshot.data());
      previousQuantity = Number(inventory[itemId] || 0);
      nextQuantity = direction === "grant"
        ? Math.min(MARKET_MAX_ITEM_QUANTITY, previousQuantity + quantity)
        : Math.max(0, previousQuantity - quantity);
      const nextInventory = { ...inventory, [itemId]: nextQuantity };
      transaction.set(targetInventoryRef, {
        schemaVersion: MARKET_INVENTORY_SCHEMA_VERSION,
        items: nextInventory,
        updatedAt: now
      }, { merge: true });
    }

    transaction.set(historyRef, {
      schemaVersion: 1,
      kind: "inventory-adjustment",
      actorUid: actor.uid,
      actorName: actor.name,
      itemId,
      direction,
      requestedQuantity: quantity,
      previousQuantity,
      nextQuantity,
      ...(note ? { note } : {}),
      createdAt: now
    });

    return { playerName: player.displayName, previousQuantity, nextQuantity };
  });

  return {
    ok: true,
    adjustment: {
      itemId,
      direction,
      requestedQuantity: quantity,
      ...result
    }
  };
}

export async function moderateAdminPlayerHandler(request: CallableRequest<unknown>) {
  const { payload, actor } = await requireSecuredAdminActor(request, [
    "deviceId", "targetUid", "action", "reason", "suspendedUntil"
  ]);
  const targetUid = requireString(payload.targetUid, "targetUid", 8, 128);
  const action = requireModerationAction(payload.action);
  const reason = requireString(payload.reason, "reason", 3, 1_000).trim();
  const suspendedUntil = action === "suspend"
    ? requireFutureSuspensionEnd(payload.suspendedUntil)
    : null;
  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(targetUid);
  const moderationRef = getPlayerModerationRef(targetUid);
  const sessionRef = getPlayerSessionDocumentRef(targetUid);
  const historyRef = moderationRef.collection(PLAYER_MODERATION_HISTORY_SUBCOLLECTION).doc();
  const now = Timestamp.now();

  const result = await db.runTransaction(async (transaction) => {
    const [playerSnapshot, moderationSnapshot] = await Promise.all([
      transaction.get(playerRef),
      transaction.get(moderationRef)
    ]);
    if (!playerSnapshot.exists) throw new HttpsError("not-found", "That player profile could not be found.");
    const player = readStoredPlayerDocument(playerSnapshot.data());
    if (!player.profileComplete || !player.displayName) {
      throw new HttpsError("failed-precondition", "That GrowGo account does not have a completed player profile.");
    }
    const existing = readStoredPlayerRestriction(moderationSnapshot.data());
    const nextStatus = getNextRestrictionStatus(action, existing.status);
    const nextSuspendedUntil = action === "suspend"
      ? suspendedUntil
      : action === "clear-restriction"
        ? null
        : existing.suspendedUntil;
    const nextReason = action === "warning" ? existing.reason : reason;

    transaction.set(moderationRef, {
      schemaVersion: PLAYER_MODERATION_SCHEMA_VERSION,
      uid: targetUid,
      status: nextStatus,
      reason: nextReason,
      suspendedUntil: nextSuspendedUntil ? Timestamp.fromDate(nextSuspendedUntil) : null,
      updatedAt: now,
      lastAction: action,
      lastActionByUid: actor.uid,
      lastActionByName: actor.name
    }, { merge: true });
    transaction.set(historyRef, {
      schemaVersion: 1,
      action,
      actorUid: actor.uid,
      actorName: actor.name,
      reason,
      previousStatus: existing.status,
      nextStatus,
      suspendedUntil: nextSuspendedUntil ? Timestamp.fromDate(nextSuspendedUntil) : null,
      createdAt: now
    });

    // Firebase email delivery is deliberately decoupled from enforcement. A
    // configured mail worker can send this queued notice without ever holding
    // up the staff action or exposing email data to the client.
    if (action === "suspend" || action === "ban") {
      transaction.set(db.collection(MODERATION_EMAIL_QUEUE_COLLECTION).doc(), {
        schemaVersion: 1,
        targetUid,
        playerName: player.displayName,
        type: action,
        reason,
        suspendedUntil: nextSuspendedUntil ? Timestamp.fromDate(nextSuspendedUntil) : null,
        status: "pending-mail-provider",
        createdAt: now
      });
      // Remove the active device token record in the same transaction. The
      // account-status gate also blocks every future secure action.
      transaction.delete(sessionRef);
    }

    return { playerName: player.displayName, status: nextStatus, suspendedUntil: nextSuspendedUntil };
  });

  return {
    ok: true,
    moderation: {
      action,
      reason,
      ...result,
      emailNotice: action === "suspend" || action === "ban" ? "queued" : "not-needed"
    }
  };
}

async function resolvePlayerUidForExactLookup(query: string): Promise<string | null> {
  const publicCode = normalizePlayerPublicCode(query);
  if (publicCode) {
    const codeSnapshot = await getPlayerPublicCodeRef(publicCode).get();
    return typeof codeSnapshot.data()?.uid === "string" ? codeSnapshot.data()?.uid : null;
  }
  const nameSnapshot = await getAdminFirestore().collection("playerNames").doc(avatarNameKey(query)).get();
  return typeof nameSnapshot.data()?.uid === "string" ? nameSnapshot.data()?.uid : null;
}

async function buildAdminPlayerProfile(uid: string, includeFinancials: boolean) {
  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(uid);
  const moderationRef = getPlayerModerationRef(uid);
  const [playerSnapshot, inventorySnapshot, moderationSnapshot, adjustmentHistorySnapshot, moderationHistorySnapshot] = await Promise.all([
    playerRef.get(),
    inventoryRef(uid).get(),
    moderationRef.get(),
    playerRef.collection(PLAYER_ADMIN_HISTORY_SUBCOLLECTION).orderBy("createdAt", "desc").limit(MAX_PROFILE_HISTORY).get(),
    moderationRef.collection(PLAYER_MODERATION_HISTORY_SUBCOLLECTION).orderBy("createdAt", "desc").limit(MAX_PROFILE_HISTORY).get()
  ]);
  if (!playerSnapshot.exists) throw new HttpsError("not-found", "That player profile could not be found.");
  const player = readStoredPlayerDocument(playerSnapshot.data());
  if (!player.profileComplete || !player.displayName) throw new HttpsError("not-found", "That player profile could not be found.");
  const restriction = readStoredPlayerRestriction(moderationSnapshot.data());
  const inventory = readMarketInventory(inventorySnapshot.data());

  return {
    uid,
    displayName: player.displayName,
    publicCode: player.publicCode,
    avatarUrl: player.avatarUrl,
    region: player.region,
    country: player.country,
    state: player.state,
    gender: player.gender,
    level: player.level,
    xp: player.xp,
    craftingLevel: player.craftingLevel,
    craftingXp: player.craftingXp,
    coins: player.coins,
    createdAt: player.createdAt.toISOString(),
    lastLoginAt: player.lastLoginAt.toISOString(),
    activeBuff: player.activeBuff
      ? { itemId: player.activeBuff.sourceItemId, expiresAt: player.activeBuff.expiresAt.toISOString() }
      : null,
    restriction: {
      status: restriction.status,
      reason: restriction.reason,
      suspendedUntil: restriction.suspendedUntil?.toISOString() ?? null
    },
    inventory: Object.entries(inventory)
      .map(([itemId, quantity]) => ({ itemId, quantity }))
      .sort((left, right) => left.itemId.localeCompare(right.itemId)),
    finance: includeFinancials
      ? { moneySpentStatus: "not-connected", moneySpentAud: null }
      : { moneySpentStatus: "restricted" },
    adjustmentHistory: adjustmentHistorySnapshot.docs.map((snapshot) => serializeHistory(snapshot.id, snapshot.data())),
    moderationHistory: moderationHistorySnapshot.docs.map((snapshot) => serializeHistory(snapshot.id, snapshot.data()))
  };
}

function serializeHistory(id: string, data: DocumentData) {
  return {
    id,
    action: typeof data.action === "string" ? data.action : typeof data.kind === "string" ? data.kind : "activity",
    actorName: typeof data.actorName === "string" ? data.actorName : "GrowGo Admin",
    reason: typeof data.reason === "string" ? data.reason : typeof data.note === "string" ? data.note : null,
    itemId: typeof data.itemId === "string" ? data.itemId : null,
    direction: typeof data.direction === "string" ? data.direction : null,
    previousQuantity: Number.isSafeInteger(data.previousQuantity) ? data.previousQuantity : null,
    nextQuantity: Number.isSafeInteger(data.nextQuantity) ? data.nextQuantity : null,
    previousStatus: typeof data.previousStatus === "string" ? data.previousStatus : null,
    nextStatus: typeof data.nextStatus === "string" ? data.nextStatus : null,
    suspendedUntil: data.suspendedUntil instanceof Timestamp ? data.suspendedUntil.toDate().toISOString() : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null
  };
}

function requireAdminInventoryItem(value: unknown): "coins" | (typeof inventoryItemIds)[number] {
  if (value === "coins") return "coins";
  if (typeof value === "string" && inventoryItemIds.includes(value as (typeof inventoryItemIds)[number])) {
    return value as (typeof inventoryItemIds)[number];
  }
  throw new HttpsError("invalid-argument", "Choose a valid GrowGo item.");
}

function requireAdjustmentDirection(value: unknown): AdminAdjustmentDirection {
  if (value === "grant" || value === "remove") return value;
  throw new HttpsError("invalid-argument", "Choose whether to grant or remove the item.");
}

function requireModerationAction(value: unknown): AdminModerationAction {
  if (value === "warning" || value === "suspend" || value === "ban" || value === "clear-restriction") return value;
  throw new HttpsError("invalid-argument", "Choose a valid moderation action.");
}

function getNextRestrictionStatus(action: AdminModerationAction, existing: PlayerRestrictionStatus): PlayerRestrictionStatus {
  if (action === "suspend") return "suspended";
  if (action === "ban") return "banned";
  if (action === "clear-restriction") return "active";
  return existing;
}

function requirePositiveInteger(value: unknown, label: string, maximum: number): number {
  if (!Number.isSafeInteger(value) || Number(value) < 1 || Number(value) > maximum) {
    throw new HttpsError("invalid-argument", `${label} must be a whole number between 1 and ${maximum}.`);
  }
  return Number(value);
}

function requireFutureSuspensionEnd(value: unknown): Date {
  if (typeof value !== "string") throw new HttpsError("invalid-argument", "Choose when the suspension ends.");
  const date = new Date(value);
  const now = Date.now();
  const maximum = now + 366 * 24 * 60 * 60 * 1000;
  if (!Number.isFinite(date.getTime()) || date.getTime() <= now + 60_000 || date.getTime() > maximum) {
    throw new HttpsError("invalid-argument", "Choose a suspension end within the next year.");
  }
  return date;
}

function optionalText(value: unknown, maximum: number): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.trim().length > maximum) {
    throw new HttpsError("invalid-argument", "The optional note is too long.");
  }
  return value.trim() || null;
}

export const searchAdminPlayer = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  searchAdminPlayerHandler
);

export const adjustAdminPlayerInventory = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  adjustAdminPlayerInventoryHandler
);

export const moderateAdminPlayer = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  moderateAdminPlayerHandler
);
