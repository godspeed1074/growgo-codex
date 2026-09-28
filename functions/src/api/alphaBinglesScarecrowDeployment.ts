import {
  HttpsError,
  onCall,
  type CallableRequest
} from "firebase-functions/v2/https";
import { Timestamp, type DocumentData } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import {
  requireDevelopmentBackendOperationalSafeguardAccess
} from "../config/developmentBackendOperationalSafeguards";
import {
  requireActiveDeviceSessionIfEnabled,
  verifyActiveDeviceSessionIfEnabled
} from "../domain/players/activeDeviceSession";
import {
  getPlayerDocumentRef,
  readStoredPlayerDocument
} from "../domain/players/playerStore";
import { getPlayerPublicCodeRef } from "../domain/social/playerPublicCodes";
import { calculateHaversineDistanceMetres } from "../domain/pins/canonicalPinGenerator";
import { readMarketInventory } from "../domain/market/marketCatalog";
import { getAdminFirestore } from "../firebaseAdmin";
import { markMapDirectoryChanged, readMapViewport, readScarecrowsInViewport } from "../domain/world/mapDirectoryReads";
import { readOptimizationEnabled } from "../infrastructure/sharedReadCache";
import {
  requireDevelopmentBackendCapabilityAccess
} from "../security/developmentBackendCapabilityGuard";
import {
  requireAppCheckIfEnabled,
  requireAuthenticated
} from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import {
  asObject,
  assertAllowedKeys,
  requireFiniteNumber
} from "../validation/requestValidation";

const ACTIVE_SCARECROWS_COLLECTION = "worldScarecrows" as const;
const BINGLES_SCARECROW_ITEM_ID = "bingles_scarecrow" as const;
const PAPER_SCARECROW_SKIN_ITEM_ID = "paper_scarecrow_skin" as const;
const BINGLES_SCARECROW_MINIMUM_SPACING_METRES = 304.8;
const BINGLES_BIRD_ALERT_RADIUS_METRES = 300;
const MAX_ACTIVE_SCARECROWS_RETURNED = 200;
const BINGLES_SCARECROW_SKIN_IDS = ["classic", "paper"] as const;

type BinglesScarecrowSkinId = (typeof BINGLES_SCARECROW_SKIN_IDS)[number];

interface BinglesScarecrowAlertFriend {
  id: string;
  name: string;
}

interface DeployBinglesScarecrowRequest {
  latitude: number;
  longitude: number;
  deviceId: string | undefined;
}

interface SafeBinglesScarecrow {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatarUrl: string | null;
  latitude: number;
  longitude: number;
  skinId: BinglesScarecrowSkinId;
  birdLandingAlertsEnabled: boolean;
  birdAlertRadiusMetres: number;
  sharedAlertFriend: BinglesScarecrowAlertFriend | null;
  createdAt: string;
}

interface UpdateBinglesScarecrowSettingsRequest {
  deviceId: string | undefined;
  skinId: BinglesScarecrowSkinId;
  birdLandingAlertsEnabled: boolean;
  sharedAlertFriend: BinglesScarecrowAlertFriend | null;
}

function validateDeployRequest(request: CallableRequest<unknown>): DeployBinglesScarecrowRequest {
  const payload = asObject(request.data, "deployAlphaBinglesScarecrow payload");
  assertAllowedKeys(
    payload,
    ["latitude", "longitude", "deviceId"],
    "deployAlphaBinglesScarecrow payload"
  );

  return {
    latitude: requireFiniteNumber(payload.latitude, "latitude", -90, 90),
    longitude: requireFiniteNumber(payload.longitude, "longitude", -180, 180),
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined
  };
}

function readBinglesScarecrowSkinId(value: unknown): BinglesScarecrowSkinId {
  if (typeof value !== "string" || !BINGLES_SCARECROW_SKIN_IDS.includes(value as BinglesScarecrowSkinId)) {
    throw new HttpsError("invalid-argument", "Choose a valid Bingles skin.");
  }

  return value as BinglesScarecrowSkinId;
}

function readBinglesScarecrowAlertFriend(value: unknown): BinglesScarecrowAlertFriend | null {
  if (value === null || typeof value === "undefined") return null;

  const friend = asObject(value, "sharedAlertFriend");
  assertAllowedKeys(friend, ["id", "name"], "sharedAlertFriend");
  const id = typeof friend.id === "string" ? friend.id.trim().toUpperCase() : "";
  const name = typeof friend.name === "string" ? friend.name.trim() : "";
  if (!/^GG[A-Z0-9]{6}$/.test(id) || name.length < 1 || name.length > 24) {
    throw new HttpsError("invalid-argument", "Choose a valid GrowGo friend.");
  }

  return { id, name };
}

function validateSettingsRequest(
  request: CallableRequest<unknown>
): UpdateBinglesScarecrowSettingsRequest {
  const payload = asObject(request.data, "updateAlphaBinglesScarecrowSettings payload");
  assertAllowedKeys(
    payload,
    ["deviceId", "skinId", "birdLandingAlertsEnabled", "sharedAlertFriend"],
    "updateAlphaBinglesScarecrowSettings payload"
  );
  if (typeof payload.birdLandingAlertsEnabled !== "boolean") {
    throw new HttpsError("invalid-argument", "birdLandingAlertsEnabled must be true or false.");
  }

  return {
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined,
    skinId: readBinglesScarecrowSkinId(payload.skinId),
    birdLandingAlertsEnabled: payload.birdLandingAlertsEnabled,
    sharedAlertFriend: readBinglesScarecrowAlertFriend(payload.sharedAlertFriend)
  };
}

function readSafeBinglesScarecrow(
  id: string,
  data: DocumentData | undefined
): SafeBinglesScarecrow | null {
  if (!data || data.schemaVersion !== 1 || data.status !== "active" || data.itemId !== BINGLES_SCARECROW_ITEM_ID) {
    return null;
  }

  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt : null;
  if (
    typeof data.ownerId !== "string" ||
    typeof data.ownerName !== "string" ||
    !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
    !createdAt
  ) {
    return null;
  }

  return {
    id,
    ownerId: data.ownerId,
    ownerName: data.ownerName,
    ownerAvatarUrl: typeof data.ownerAvatarUrl === "string" ? data.ownerAvatarUrl : null,
    latitude,
    longitude,
    skinId: BINGLES_SCARECROW_SKIN_IDS.includes(data.skinId)
      ? data.skinId
      : "classic",
    birdLandingAlertsEnabled: data.birdLandingAlertsEnabled === true,
    birdAlertRadiusMetres: BINGLES_BIRD_ALERT_RADIUS_METRES,
    sharedAlertFriend: (() => {
      try {
        return readBinglesScarecrowAlertFriend(data.sharedAlertFriend);
      } catch {
        return null;
      }
    })(),
    createdAt: createdAt.toDate().toISOString()
  };
}

/**
 * Alpha placement for the one animated Bingles scarecrow. One granted item
 * permits one permanent placement; the dedicated document keeps the test
 * visible to every signed-in player without exposing inventory writes to the
 * browser.
 */
export async function deployAlphaBinglesScarecrowHandler(request: CallableRequest<unknown>) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });
  requireDevelopmentBackendOperationalSafeguardAccess({
    operation: "player_snapshot",
    uid: authContext.uid
  });

  const input = validateDeployRequest(request);
  await requireActiveDeviceSessionIfEnabled({
    uid: authContext.uid,
    deviceId: input.deviceId
  });

  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(authContext.uid);
  const inventoryRef = db.collection("playerMarketInventories").doc(authContext.uid);
  const scarecrowRef = db.collection(ACTIVE_SCARECROWS_COLLECTION).doc(authContext.uid);

  return db.runTransaction(async (transaction) => {
    const [playerSnapshot, inventorySnapshot, ownScarecrowSnapshot, allScarecrowsSnapshot] = await Promise.all([
      transaction.get(playerRef),
      transaction.get(inventoryRef),
      transaction.get(scarecrowRef),
      transaction.get(db.collection(ACTIVE_SCARECROWS_COLLECTION).where("status", "==", "active"))
    ]);

    if (!playerSnapshot.exists) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before deploying a scarecrow.");
    }
    const player = readStoredPlayerDocument(playerSnapshot.data());
    if (!player.profileComplete) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before deploying a scarecrow.");
    }

    const inventory = readMarketInventory(inventorySnapshot.data());
    if (inventory[BINGLES_SCARECROW_ITEM_ID] < 1) {
      throw new HttpsError("failed-precondition", "You do not have a Bingles Scarecrow to deploy.");
    }

    if (readSafeBinglesScarecrow(scarecrowRef.id, ownScarecrowSnapshot.data())) {
      throw new HttpsError("already-exists", "Your Bingles Scarecrow is already deployed.");
    }

    for (const snapshot of allScarecrowsSnapshot.docs) {
      const existing = readSafeBinglesScarecrow(snapshot.id, snapshot.data());
      if (!existing) continue;

      const distance = calculateHaversineDistanceMetres(
        { latitude: input.latitude, longitude: input.longitude },
        { latitude: existing.latitude, longitude: existing.longitude }
      );
      if (distance < BINGLES_SCARECROW_MINIMUM_SPACING_METRES) {
        throw new HttpsError(
          "failed-precondition",
          "Another scarecrow is too close. Choose a spot at least 1,000 feet away."
        );
      }
    }

    const now = Timestamp.now();
    const record = {
      schemaVersion: 1,
      status: "active",
      itemId: BINGLES_SCARECROW_ITEM_ID,
      ownerId: authContext.uid,
      ownerName: player.displayName || "GrowGo player",
      ownerAvatarUrl: player.avatarUrl || null,
      latitude: input.latitude,
      longitude: input.longitude,
      skinId: "classic" as BinglesScarecrowSkinId,
      birdLandingAlertsEnabled: false,
      birdAlertRadiusMetres: BINGLES_BIRD_ALERT_RADIUS_METRES,
      sharedAlertFriend: null,
      createdAt: now,
      updatedAt: now
    };
    transaction.set(scarecrowRef, record);
    markMapDirectoryChanged(transaction, db, "bingles");

    return {
      ok: true,
      scarecrow: {
        id: scarecrowRef.id,
        ownerId: record.ownerId,
        ownerName: record.ownerName,
        ownerAvatarUrl: record.ownerAvatarUrl,
        latitude: record.latitude,
        longitude: record.longitude,
        skinId: record.skinId,
        birdLandingAlertsEnabled: record.birdLandingAlertsEnabled,
        birdAlertRadiusMetres: record.birdAlertRadiusMetres,
        sharedAlertFriend: record.sharedAlertFriend,
        createdAt: now.toDate().toISOString()
      } satisfies SafeBinglesScarecrow
    };
  });
}

export async function getActiveBinglesScarecrowsHandler(request: CallableRequest<unknown>) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });
  requireDevelopmentBackendOperationalSafeguardAccess({
    operation: "player_snapshot",
    uid: authContext.uid
  });

  const payload = asObject(request.data, "getActiveBinglesScarecrows payload");
  assertAllowedKeys(payload, ["deviceId", "viewport"], "getActiveBinglesScarecrows payload");
  const viewport = readMapViewport(payload.viewport);
  await verifyActiveDeviceSessionIfEnabled({
    uid: authContext.uid,
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined
  });

  const db = getAdminFirestore();
  const playerSnapshot = await getPlayerDocumentRef(authContext.uid).get();
  if (!playerSnapshot.exists || !readStoredPlayerDocument(playerSnapshot.data()).profileComplete) {
    throw new HttpsError("failed-precondition", "Create your GrowGo profile before viewing scarecrows.");
  }

  const activeSnapshots = await readScarecrowsInViewport(db,
    readOptimizationEnabled("BINGLES") ? viewport : null, MAX_ACTIVE_SCARECROWS_RETURNED);
  const scarecrows = activeSnapshots
    .map((snapshot) => readSafeBinglesScarecrow(snapshot.id, snapshot.data()))
    .filter((scarecrow): scarecrow is SafeBinglesScarecrow => Boolean(scarecrow));

  return { ok: true, scarecrows, changeSignals: readOptimizationEnabled("BINGLES") };
}

/**
 * Owner-only settings for a deployed Bingles scarecrow. Bird landing alerts
 * are deliberately limited to the fixed 300 m detection radius; no capture,
 * tap, or unrelated activity will create a Bingles alert.
 */
export async function updateAlphaBinglesScarecrowSettingsHandler(
  request: CallableRequest<unknown>
) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });
  requireDevelopmentBackendOperationalSafeguardAccess({
    operation: "player_snapshot",
    uid: authContext.uid
  });

  const input = validateSettingsRequest(request);
  await requireActiveDeviceSessionIfEnabled({
    uid: authContext.uid,
    deviceId: input.deviceId
  });

  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(authContext.uid);
  const inventoryRef = db.collection("playerMarketInventories").doc(authContext.uid);
  const scarecrowRef = db.collection(ACTIVE_SCARECROWS_COLLECTION).doc(authContext.uid);

  return db.runTransaction(async (transaction) => {
    const [playerSnapshot, inventorySnapshot, scarecrowSnapshot] = await Promise.all([
      transaction.get(playerRef),
      transaction.get(inventoryRef),
      transaction.get(scarecrowRef)
    ]);
    const player = playerSnapshot.exists ? readStoredPlayerDocument(playerSnapshot.data()) : null;
    const scarecrow = readSafeBinglesScarecrow(scarecrowRef.id, scarecrowSnapshot.data());

    if (!player?.profileComplete || !scarecrow || scarecrow.ownerId !== authContext.uid) {
      throw new HttpsError("failed-precondition", "Deploy your Bingles Scarecrow before changing its settings.");
    }

    const inventory = readMarketInventory(inventorySnapshot.data());
    if (input.skinId === "paper" && inventory[PAPER_SCARECROW_SKIN_ITEM_ID] < 1) {
      throw new HttpsError("failed-precondition", "You need the Paper Scarecrow Skin before equipping it.");
    }

    let sharedAlertFriend = input.sharedAlertFriend;
    if (sharedAlertFriend) {
      const codeSnapshot = await transaction.get(getPlayerPublicCodeRef(sharedAlertFriend.id));
      const friendUid = typeof codeSnapshot.data()?.uid === "string" ? codeSnapshot.data()?.uid : "";
      const friendSnapshot = friendUid
        ? await transaction.get(db.collection("playerSocial").doc(authContext.uid).collection("friends").doc(friendUid))
        : null;
      const storedCode = typeof friendSnapshot?.data()?.publicCode === "string"
        ? friendSnapshot.data()?.publicCode.toUpperCase()
        : "";
      const storedName = typeof friendSnapshot?.data()?.displayName === "string"
        ? friendSnapshot.data()?.displayName.trim()
        : "";
      if (!friendSnapshot?.exists || storedCode !== sharedAlertFriend.id || !storedName) {
        throw new HttpsError("failed-precondition", "Add this player as a GrowGo friend before choosing them for Bingles alerts.");
      }
      sharedAlertFriend = { id: storedCode, name: storedName };
    }

    const now = Timestamp.now();
    transaction.update(scarecrowRef, {
      skinId: input.skinId,
      birdLandingAlertsEnabled: input.birdLandingAlertsEnabled,
      birdAlertRadiusMetres: BINGLES_BIRD_ALERT_RADIUS_METRES,
      sharedAlertFriend,
      updatedAt: now
    });
    markMapDirectoryChanged(transaction, db, "bingles");

    return {
      ok: true,
      scarecrow: {
        ...scarecrow,
        skinId: input.skinId,
        birdLandingAlertsEnabled: input.birdLandingAlertsEnabled,
        birdAlertRadiusMetres: BINGLES_BIRD_ALERT_RADIUS_METRES,
        sharedAlertFriend
      } satisfies SafeBinglesScarecrow
    };
  });
}

export const deployAlphaBinglesScarecrow = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  deployAlphaBinglesScarecrowHandler
);

export const getActiveBinglesScarecrows = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  getActiveBinglesScarecrowsHandler
);

export const updateAlphaBinglesScarecrowSettings = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  updateAlphaBinglesScarecrowSettingsHandler
);
