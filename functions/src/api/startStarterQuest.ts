import {
  HttpsError,
  onCall,
  type CallableRequest
} from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import {
  requireDevelopmentBackendOperationalSafeguardAccess
} from "../config/developmentBackendOperationalSafeguards";
import {
  requireActiveDeviceSessionIfEnabled
} from "../domain/players/activeDeviceSession";
import {
  getPlayerDocumentRef,
  readStoredPlayerDocument,
  serializePlayerSnapshot
} from "../domain/players/playerStore";
import {
  completeStarterQuestState,
  createStarterQuestState,
  readStarterQuestState,
  serializeStarterQuestState,
  STARTER_QUEST_REWARD_COINS
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

export async function startStarterQuestHandler(
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

  const payload = asObject(request.data, "startStarterQuest payload");
  assertAllowedKeys(payload, ["deviceId"], "startStarterQuest payload");
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
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before starting quests.");
    }

    const player = readStoredPlayerDocument(playerSnapshot.data());
    if (!player.profileComplete) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before starting quests.");
    }

    if (player.onboarding?.interfaceTutorial === "pending") {
      throw new HttpsError(
        "failed-precondition",
        "Complete the GrowGo controls tutorial before starting your first quest."
      );
    }

    const storedState = readStarterQuestState(questStateSnapshot.data());
    if (storedState) {
      let resolvedState = storedState;
      let rewardGranted = false;
      let responsePlayer = player;

      // Reconcile a successful capture that happened before the old client
      // could report it back to the starter-quest system.
      if (storedState.starterTutorial.status === "active") {
        const capturesAfterQuestStart = await transaction.get(
          db
            .collection("playerCaptureStates")
            .doc(authContext.uid)
            .collection("pins")
            .where("capturedAt", ">=", storedState.starterTutorial.startedAt)
            .limit(1)
        );

        if (!capturesAfterQuestStart.empty) {
          const completedAt = Timestamp.now();
          resolvedState = completeStarterQuestState(storedState, completedAt);
          responsePlayer = {
            ...player,
            coins: player.coins + STARTER_QUEST_REWARD_COINS,
            updatedAt: completedAt.toDate()
          };
          transaction.update(playerRef, {
            coins: responsePlayer.coins,
            updatedAt: completedAt
          });
          transaction.set(questStateRef, resolvedState);
          rewardGranted = true;
        }
      }

      return {
        ok: true,
        started: false,
        completedNow: rewardGranted,
        rewardGranted,
        player: serializePlayerSnapshot(responsePlayer),
        quest: serializeStarterQuestState(resolvedState)
      };
    }

    const startedAt = Timestamp.now();
    const starterTutorial = createStarterQuestState(startedAt);
    transaction.create(questStateRef, starterTutorial);

    return {
      ok: true,
      started: true,
      completedNow: false,
      rewardGranted: false,
      player: serializePlayerSnapshot(player),
      quest: serializeStarterQuestState(starterTutorial)
    };
  });
}

export const startStarterQuest = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  startStarterQuestHandler
);
