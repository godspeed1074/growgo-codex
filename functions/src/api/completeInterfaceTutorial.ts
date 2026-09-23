import {
  HttpsError,
  onCall,
  type CallableRequest
} from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import {
  requireActiveDeviceSessionIfEnabled
} from "../domain/players/activeDeviceSession";
import {
  getPlayerDocumentRef,
  readStoredPlayerDocument,
  serializePlayerSnapshot
} from "../domain/players/playerStore";
import {
  createStarterQuestState,
  readStarterQuestState,
  serializeStarterQuestState
} from "../domain/quests/starterQuest";
import { getAdminFirestore } from "../firebaseAdmin";
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
  assertAllowedKeys
} from "../validation/requestValidation";

/**
 * Finishes the controls walkthrough and atomically makes Bingles' first quest
 * available. Keeping those two changes in one transaction means a player can
 * never finish the walkthrough and be left with no starter quest because a
 * second request was delayed or lost.
 */
export async function completeInterfaceTutorialHandler(
  request: CallableRequest<unknown>
) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });

  const payload = asObject(request.data, "completeInterfaceTutorial payload");
  assertAllowedKeys(payload, ["deviceId"], "completeInterfaceTutorial payload");
  await requireActiveDeviceSessionIfEnabled({
    uid: authContext.uid,
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined
  });

  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(authContext.uid);
  const questStateRef = db.collection("playerQuestStates").doc(authContext.uid);

  return db.runTransaction(async (transaction) => {
    const [playerSnapshot, questStateSnapshot] = await Promise.all([
      transaction.get(playerRef),
      transaction.get(questStateRef)
    ]);
    if (!playerSnapshot.exists) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before continuing.");
    }

    const player = readStoredPlayerDocument(playerSnapshot.data());
    if (!player.profileComplete) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before continuing.");
    }

    const storedQuestState = readStarterQuestState(questStateSnapshot.data());

    // Existing alpha players have no onboarding record. Returning success
    // keeps the Settings restart button harmless for those accounts. Include
    // an existing quest when present so a retry can restore its screen without
    // another network round trip.
    if (!player.onboarding || player.onboarding.interfaceTutorial === "completed") {
      return {
        ok: true,
        completedNow: false,
        started: false,
        player: serializePlayerSnapshot(player),
        ...(storedQuestState ? { quest: serializeStarterQuestState(storedQuestState) } : {})
      };
    }

    const completedAt = Timestamp.now();
    const starterQuestState = storedQuestState ?? createStarterQuestState(completedAt);
    const completedPlayer = {
      ...player,
      onboarding: {
        interfaceTutorial: "completed" as const,
        interfaceTutorialCompletedAt: completedAt.toDate()
      },
      updatedAt: completedAt.toDate()
    };
    transaction.update(playerRef, {
      onboarding: {
        interfaceTutorial: "completed",
        interfaceTutorialCompletedAt: completedAt
      },
      updatedAt: completedAt
    });
    if (!storedQuestState) {
      transaction.create(questStateRef, starterQuestState);
    }

    return {
      ok: true,
      completedNow: true,
      started: !storedQuestState,
      player: serializePlayerSnapshot(completedPlayer),
      quest: serializeStarterQuestState(starterQuestState)
    };
  });
}

export const completeInterfaceTutorial = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  completeInterfaceTutorialHandler
);
