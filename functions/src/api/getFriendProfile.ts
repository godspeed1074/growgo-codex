import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { runtimeConfig } from "../config/runtimeConfig";
import { requireDevelopmentBackendOperationalSafeguardAccess } from "../config/developmentBackendOperationalSafeguards";
import { requireActiveDeviceSessionIfEnabled } from "../domain/players/activeDeviceSession";
import { getPlayerDocumentRef, readStoredPlayerDocument } from "../domain/players/playerStore";
import { getPlayerPublicCodeRef, normalizePlayerPublicCode } from "../domain/social/playerPublicCodes";
import { getGrowGoUtcDayKey } from "../domain/leaderboards/leaderboardPeriods";
import { readLeaderboardScoreDocument } from "../domain/leaderboards/leaderboardScoreStore";
import { getAdminFirestore } from "../firebaseAdmin";
import { requireDevelopmentBackendCapabilityAccess } from "../security/developmentBackendCapabilityGuard";
import { requireAppCheckIfEnabled, requireAuthenticated } from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import { asObject, assertAllowedKeys } from "../validation/requestValidation";

/** Read-only, on-demand social profile. Never return the private player snapshot.
 * No capture-history scans, new writes, listeners, or changes to gameplay. */
export function createSocialProfileHandler(relationship: "friends" | "met") {
  return async (request: CallableRequest<unknown>) => {
    const { uid } = requireAuthenticated(request);
    requireAppCheckIfEnabled(request);
    requireInvitedUserAccess(request);
    requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });
    requireDevelopmentBackendOperationalSafeguardAccess({ operation: "player_snapshot", uid });
    const label = relationship === "friends" ? "getFriendProfile payload" : "getMetPlayerProfile payload";
    const payload = asObject(request.data, label);
    assertAllowedKeys(payload, ["publicCode", "deviceId"], label);
    const publicCode = normalizePlayerPublicCode(payload.publicCode);
    if (!publicCode) throw new HttpsError("invalid-argument", "Choose a valid player.");
    await requireActiveDeviceSessionIfEnabled({ uid, deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined });

    const db = getAdminFirestore();
    const profile = await db.runTransaction(async transaction => {
      const codeSnapshot = await transaction.get(getPlayerPublicCodeRef(publicCode));
      const targetUid = codeSnapshot.data()?.uid;
      if (typeof targetUid !== "string" || !targetUid || targetUid.includes("/")) {
        throw new HttpsError("not-found", "This player's profile is unavailable.");
      }
      // Relationship is fixed by the endpoint, never accepted from the request.
      const friendSnapshot = await transaction.get(db.collection("playerSocial").doc(uid).collection(relationship).doc(targetUid));
      if (!friendSnapshot.exists || friendSnapshot.data()?.publicCode !== publicCode) {
        throw new HttpsError("permission-denied", relationship === "friends"
          ? "Add this player to your friends before viewing their profile."
          : "Meet this player by scanning their code before viewing their profile.");
      }
      const [playerSnapshot, scoreSnapshot] = await Promise.all([
        transaction.get(getPlayerDocumentRef(targetUid)),
        transaction.get(db.collection("playerLeaderboardScores").doc(targetUid))
      ]);
      if (!playerSnapshot.exists) throw new HttpsError("not-found", "This player's profile is unavailable.");
      const player = readStoredPlayerDocument(playerSnapshot.data());
      if (!player.profileComplete || !player.displayName || player.publicCode !== publicCode) {
        throw new HttpsError("not-found", "This player's profile is unavailable.");
      }
      const scores = readLeaderboardScoreDocument(scoreSnapshot.data());
      const todayKey = getGrowGoUtcDayKey(new Date());
      // Explicit allowlist: no email, wallet, inventory, location, device,
      // moderation, spending, activity timestamps, or account credentials.
      return {
        publicCode, name: player.displayName, avatarUrl: player.avatarUrl,
        level: player.level, craftingLevel: player.craftingLevel,
        stats: {
          today: { points: scoreSnapshot.exists ? (scores.daily.key === todayKey ? scores.daily.points : 0) : null },
          lifetime: { xp: player.xp, craftingXp: player.craftingXp, achievementPoints: scoreSnapshot.exists ? scores.achievementPoints : null },
          best: null
        },
        todayKey
      };
    }, { readOnly: true });
    return { ok: true, profile };
  };
}

export const getFriendProfileHandler = createSocialProfileHandler("friends");

export const getFriendProfile = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  getFriendProfileHandler
);
