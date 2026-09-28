import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import { getAdminFirestore } from "../firebaseAdmin";
import {
  requireActiveDeviceSessionIfEnabled
} from "../domain/players/activeDeviceSession";
import { getPlayerDocumentRef, readStoredPlayerDocument, serializePlayerSnapshot } from "../domain/players/playerStore";
import {
  assertPlayerNameIsSafe,
  parseAdditionalBlockedTerms
} from "../domain/players/playerNamePolicy";
import { growGoGenders, growGoRegions, type CompletePlayerProfileRequest } from "../domain/players/playerTypes";
import { requireAppCheckIfEnabled, requireAuthenticated } from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import { asObject, assertAllowedKeys, requireRequestId } from "../validation/requestValidation";

const AVATAR_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 _-]{2,19}$/;

export function normalizeAvatarName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function avatarNameKey(value: string) {
  return normalizeAvatarName(value).toLocaleLowerCase("en-US");
}

export function createCompletePlayerProfileHandler() {
  return async (request: CallableRequest<unknown>) => {
    const authContext = requireAuthenticated(request);
    requireAppCheckIfEnabled(request);
    requireInvitedUserAccess(request);

    const payload = asObject(request.data, "completePlayerProfile payload");
    assertAllowedKeys(
      payload,
      ["requestId", "deviceId", "avatarName", "region", "country", "state", "gender"],
      "completePlayerProfile payload"
    );

    const validated: CompletePlayerProfileRequest = {
      requestId: requireRequestId(payload.requestId),
      avatarName: requireText(payload.avatarName, "avatarName", 20),
      region: requireEnum(payload.region, growGoRegions, "region"),
      country: requireText(payload.country, "country", 80),
      state: requireText(payload.state, "state", 80),
      gender: requireEnum(payload.gender, growGoGenders, "gender")
    };

    const avatarName = normalizeAvatarName(validated.avatarName);
    if (!AVATAR_NAME_PATTERN.test(avatarName)) {
      throw new HttpsError(
        "invalid-argument",
        "Player name must be 3–20 characters and use letters, numbers, spaces, hyphens or underscores."
      );
    }

    assertPlayerNameIsSafe(avatarName, {
      additionalBlockedTerms: parseAdditionalBlockedTerms(
        process.env.GROWGO_PLAYER_NAME_DENYLIST
      )
    });
    await requireActiveDeviceSessionIfEnabled({
      uid: authContext.uid,
      deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined
    });

    const db = getAdminFirestore();
    const playerRef = getPlayerDocumentRef(authContext.uid);
    const nameRef = db.collection("playerNames").doc(avatarNameKey(avatarName));

    const player = await db.runTransaction(async (transaction) => {
      const [playerSnapshot, nameSnapshot] = await Promise.all([
        transaction.get(playerRef),
        transaction.get(nameRef)
      ]);

      if (!playerSnapshot.exists) {
        throw new HttpsError("failed-precondition", "Player account must be created first.");
      }

      const existing = readStoredPlayerDocument(playerSnapshot.data());
      if (existing.profileComplete) {
        throw new HttpsError("failed-precondition", "Player profile is already complete.");
      }

      if (nameSnapshot.exists && nameSnapshot.data()?.uid !== authContext.uid) {
        throw new HttpsError("already-exists", "That player name is already taken.");
      }

      const now = Timestamp.now();
      transaction.set(nameRef, {
        uid: authContext.uid,
        displayName: avatarName,
        createdAt: now
      });
      transaction.update(playerRef, {
        displayName: avatarName,
        region: validated.region,
        country: validated.country,
        state: validated.state,
        gender: validated.gender,
        profileComplete: true,
        onboarding: {
          interfaceTutorial: "pending" as const
        },
        updatedAt: now
      });

      return {
        ...existing,
        displayName: avatarName,
        region: validated.region,
        country: validated.country,
        state: validated.state,
        gender: validated.gender,
        profileComplete: true,
        onboarding: {
          interfaceTutorial: "pending" as const
        },
        updatedAt: now.toDate()
      };
    });

    return {
      ok: true,
      requestId: validated.requestId,
      player: serializePlayerSnapshot(player)
    };
  };
}

function requireText(value: unknown, label: string, maxLength: number) {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `${label} is required.`);
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new HttpsError("invalid-argument", `${label} is invalid.`);
  }
  return normalized;
}

function requireEnum<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new HttpsError("invalid-argument", `${label} is invalid.`);
  }
  return value as T;
}

export const completePlayerProfile = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  createCompletePlayerProfileHandler()
);
