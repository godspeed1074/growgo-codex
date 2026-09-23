import {
  HttpsError,
  onCall,
  type CallableRequest
} from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import { ADMIN_AUDIT_LOG_COLLECTION } from "../domain/admin/adminAuditLog";
import { requireAdminAccount } from "../domain/admin/adminAccounts";
import { requireActiveDeviceSessionIfEnabled } from "../domain/players/activeDeviceSession";
import { getPlayerDocumentRef, readStoredPlayerDocument } from "../domain/players/playerStore";
import { createStarterQuestState, readStarterQuestState } from "../domain/quests/starterQuest";
import { getAdminFirestore } from "../firebaseAdmin";
import { requireDevelopmentBackendCapabilityAccess } from "../security/developmentBackendCapabilityGuard";
import { requireAppCheckIfEnabled, requireAuthenticated } from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import { asObject, assertAllowedKeys, requireString } from "../validation/requestValidation";

const PLAYER_ADMIN_HISTORY_SUBCOLLECTION = "adminHistory" as const;
const LEONARD_QUEST_ID = "a-little-help-from-my-friends" as const;

export const resettableMainQuests = [
  {
    id: "starter-tutorial",
    label: "Bingles’ Starter Tutorial",
    rewardPolicy: "Resets the whole starter path. It does not change coins, inventory, pins, or crops."
  },
  {
    id: "leonard-introduction",
    label: "Leonard’s Dove Quest",
    rewardPolicy: "Resets an unfinished quest only. An already-earned dove is never removed or awarded twice."
  }
] as const;

type ResettableMainQuestId = (typeof resettableMainQuests)[number]["id"];

function requireResettableMainQuestId(value: unknown): ResettableMainQuestId {
  if (typeof value === "string" && resettableMainQuests.some((quest) => quest.id === value)) {
    return value as ResettableMainQuestId;
  }
  throw new HttpsError("invalid-argument", "Choose a supported main quest to reset.");
}

/**
 * Owner-only test support. Every reset is limited to one named quest and keeps
 * permanent rewards intact, so a test run cannot erase a player's account or
 * mint duplicate rewards.
 */
export async function resetAdminMainQuestHandler(request: CallableRequest<unknown>) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });

  const payload = asObject(request.data, "Quest testing request");
  assertAllowedKeys(payload, ["deviceId", "targetUid", "questId"], "Quest testing request");
  await requireActiveDeviceSessionIfEnabled({
    uid: authContext.uid,
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined
  });
  await requireAdminAccount(authContext.uid, ["owner"]);

  const targetUid = requireString(payload.targetUid, "targetUid", 8, 128);
  const questId = requireResettableMainQuestId(payload.questId);
  const db = getAdminFirestore();
  const targetPlayerRef = getPlayerDocumentRef(targetUid);
  const starterQuestRef = db.collection("playerQuestStates").doc(targetUid);
  const leonardQuestRef = db.collection("leonardIntroductionPlayers").doc(targetUid);
  const leonardBirdRef = db
    .collection("playerBirdhouses")
    .doc(targetUid)
    .collection("birds")
    .doc("leonard-introduction-dove");
  const historyRef = targetPlayerRef.collection(PLAYER_ADMIN_HISTORY_SUBCOLLECTION).doc();
  const auditRef = db.collection(ADMIN_AUDIT_LOG_COLLECTION).doc();
  const now = Timestamp.now();

  const reset = await db.runTransaction(async (transaction) => {
    const playerSnapshot = await transaction.get(targetPlayerRef);
    if (!playerSnapshot.exists) {
      throw new HttpsError("not-found", "That player profile could not be found.");
    }
    const player = readStoredPlayerDocument(playerSnapshot.data());
    if (!player.profileComplete || !player.displayName) {
      throw new HttpsError("failed-precondition", "That GrowGo account does not have a completed player profile.");
    }

    let label: string;
    let resetState: "ready-to-start" | "starter-active";
    if (questId === "starter-tutorial") {
      const existingStarterQuest = await transaction.get(starterQuestRef);
      const previous = readStarterQuestState(existingStarterQuest.data());
      transaction.set(starterQuestRef, createStarterQuestState(now));
      label = "Bingles’ Starter Tutorial";
      resetState = "starter-active";
      transaction.set(historyRef, {
        schemaVersion: 1,
        kind: "quest-reset",
        actorUid: authContext.uid,
        actorName: "GrowGo Owner",
        questId,
        questLabel: label,
        previousStatus: previous?.starterTutorial.status ?? "not-started",
        nextStatus: "active",
        createdAt: now
      });
    } else {
      const [existingLeonardQuest, existingDove] = await Promise.all([
        transaction.get(leonardQuestRef),
        transaction.get(leonardBirdRef)
      ]);
      if (existingDove.exists) {
        throw new HttpsError(
          "failed-precondition",
          "Leonard’s quest cannot be reset after the dove is earned. This protects the permanent bird reward from being removed or duplicated."
        );
      }
      if (existingLeonardQuest.exists) transaction.delete(leonardQuestRef);
      label = "Leonard’s Dove Quest";
      resetState = "ready-to-start";
      transaction.set(historyRef, {
        schemaVersion: 1,
        kind: "quest-reset",
        actorUid: authContext.uid,
        actorName: "GrowGo Owner",
        questId,
        questLabel: label,
        previousStatus: existingLeonardQuest.exists ? "in-progress" : "not-started",
        nextStatus: "ready-to-start",
        createdAt: now
      });
    }

    transaction.set(auditRef, {
      schemaVersion: 1,
      actorUid: authContext.uid,
      action: "quest_reset",
      targetUid,
      details: { questId, resetState },
      createdAt: now
    });

    return { playerName: player.displayName, label, resetState };
  });

  return {
    ok: true,
    reset: {
      questId,
      ...reset
    }
  };
}

export const resetAdminMainQuest = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  resetAdminMainQuestHandler
);
