import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import { getAdminStorageBucket } from "../firebaseAdmin";
import {
  getPlayerDocumentRef,
  readStoredPlayerDocument,
  serializePlayerSnapshot
} from "../domain/players/playerStore";
import { requireActiveDeviceSessionIfEnabled } from "../domain/players/activeDeviceSession";
import { requireAppCheckIfEnabled, requireAuthenticated } from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import { asObject, assertAllowedKeys, requireRequestId } from "../validation/requestValidation";

const MAX_AVATAR_BYTES = 512 * 1024;

export async function updatePlayerAvatarHandler(
  request: CallableRequest<unknown>
) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);

  const payload = asObject(request.data, "updatePlayerAvatar payload");
  assertAllowedKeys(
    payload,
    ["requestId", "deviceId", "avatarUrl"],
    "updatePlayerAvatar payload"
  );
  const requestId = requireRequestId(payload.requestId);
  const avatarUrl = payload.avatarUrl === null
    ? null
    : requireAvatarUrl(payload.avatarUrl, authContext.uid);

  await requireActiveDeviceSessionIfEnabled({
    uid: authContext.uid,
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined
  });

  if (avatarUrl) {
    await assertStoredAvatarIsSafe(avatarUrl, authContext.uid);
  }

  const playerRef = getPlayerDocumentRef(authContext.uid);
  const player = await playerRef.firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(playerRef);
    if (!snapshot.exists) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before uploading a picture.");
    }

    const existing = readStoredPlayerDocument(snapshot.data());
    if (!existing.profileComplete) {
      throw new HttpsError("failed-precondition", "Complete your player profile before uploading a picture.");
    }

    const updatedAt = Timestamp.now();
    // A player may replace a picture while an older picture is under review.
    // That new choice is legitimate: clear the old moderation hold so a later
    // dismissed case can never overwrite the newer profile picture.
    transaction.update(playerRef, {
      avatarUrl,
      profilePictureModeration: FieldValue.delete(),
      updatedAt
    });
    return { ...existing, avatarUrl, updatedAt: updatedAt.toDate() };
  });

  // Achievement pins are a shared map surface. Refresh any active pins the
  // player already deployed so other players see the current public picture,
  // including pins placed before an older alpha device-picture migration.
  await refreshActiveAchievementPinAvatars({
    uid: authContext.uid,
    avatarUrl,
    firestore: playerRef.firestore
  });

  return {
    ok: true,
    requestId,
    player: serializePlayerSnapshot(player)
  };
}

async function refreshActiveAchievementPinAvatars(params: {
  uid: string;
  avatarUrl: string | null;
  firestore: FirebaseFirestore.Firestore;
}) {
  try {
    const now = Timestamp.now();
    const snapshot = await params.firestore
      .collection("farmerMarketAchievementDeployments")
      .where("deployerUid", "==", params.uid)
      .limit(50)
      .get();
    const activePins = snapshot.docs.filter((document) => {
      const expiresAt = document.data().expiresAt;
      return expiresAt instanceof Timestamp && expiresAt.toMillis() > now.toMillis();
    });
    if (activePins.length === 0) return;

    const batch = params.firestore.batch();
    activePins.forEach((document) => {
      batch.update(document.ref, {
        deployerAvatarUrl: params.avatarUrl,
        updatedAt: now
      });
    });
    await batch.commit();
  } catch (error) {
    // The saved profile picture is the primary action. A temporary refresh
    // issue must never undo it; the owner's own live snapshot still resolves
    // their avatar immediately.
    console.warn("Could not refresh active Achievement Pin avatars.", error);
  }
}

export const updatePlayerAvatar = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  updatePlayerAvatarHandler
);

function requireAvatarUrl(value: unknown, uid: string): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 2_048) {
    throw new HttpsError("invalid-argument", "avatarUrl is invalid.");
  }

  const url = new URL(value);
  const bucketName = getAdminStorageBucket().name;
  const expectedPrefix = `/v0/b/${encodeURIComponent(bucketName)}/o/`;
  if (
    url.protocol !== "https:" ||
    url.hostname !== "firebasestorage.googleapis.com" ||
    !url.pathname.startsWith(expectedPrefix) ||
    url.searchParams.get("alt") !== "media"
  ) {
    throw new HttpsError("invalid-argument", "avatarUrl is not a GrowGo profile image.");
  }

  const objectName = decodeURIComponent(url.pathname.slice(expectedPrefix.length));
  const parts = objectName.split("/");
  const isOwnedAvatar =
    parts.length === 3 &&
    parts[0] === "player-avatars" &&
    parts[1] === uid &&
    /^profile-\d{10,16}\.jpg$/.test(parts[2]);
  if (!isOwnedAvatar) {
    throw new HttpsError("permission-denied", "You can only use your own GrowGo profile image.");
  }

  return url.toString();
}

async function assertStoredAvatarIsSafe(avatarUrl: string, uid: string): Promise<void> {
  const bucket = getAdminStorageBucket();
  const objectName = decodeURIComponent(
    new URL(avatarUrl).pathname.slice(
      `/v0/b/${encodeURIComponent(bucket.name)}/o/`.length
    )
  );
  const file = bucket.file(objectName);
  const [exists] = await file.exists();
  if (!exists) {
    throw new HttpsError("failed-precondition", "Upload the profile image before saving it.");
  }

  const [metadata] = await file.getMetadata();
  const size = Number(metadata.size || 0);
  if (
    metadata.contentType?.startsWith("image/") !== true ||
    !Number.isFinite(size) ||
    size <= 0 ||
    size > MAX_AVATAR_BYTES ||
    !objectName.startsWith(`player-avatars/${uid}/`)
  ) {
    throw new HttpsError("invalid-argument", "That profile image is not supported.");
  }
}
