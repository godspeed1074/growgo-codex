import { randomBytes } from "node:crypto";
import {
  HttpsError,
  onCall,
  type CallableRequest
} from "firebase-functions/v2/https";
import { Timestamp, type DocumentData } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import { requireDevelopmentBackendCapabilityAccess } from "../security/developmentBackendCapabilityGuard";
import { requireDevelopmentBackendOperationalSafeguardAccess } from "../config/developmentBackendOperationalSafeguards";
import { requireActiveDeviceSessionIfEnabled } from "../domain/players/activeDeviceSession";
import { getPlayerDocumentRef, readStoredPlayerDocument } from "../domain/players/playerStore";
import {
  getGrowGoPartyPresenceRef,
  PARTY_PRESENCE_MAX_ACCURACY_METRES,
  type PartyLocation
} from "../domain/parties/partyBonus";
import { getAdminFirestore } from "../firebaseAdmin";
import { requireAppCheckIfEnabled, requireAuthenticated } from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import { asObject, assertAllowedKeys } from "../validation/requestValidation";

const PARTIES_COLLECTION = "growGoParties" as const;
const PLAYER_PARTIES_COLLECTION = "growGoPlayerParties" as const;
const PARTY_SCHEMA_VERSION = 1 as const;
const PARTY_MEMBER_LIMIT = 8;
const PARTY_INVITE_WINDOW_MS = 10 * 60 * 1000;
// New QR payloads use six compact code characters after the P. Keep the
// earlier eight-character invites valid until their normal expiry.
const PARTY_CODE_PATTERN = /^P[A-Z0-9]{6,8}$/;
const PARTY_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type PartyStatus = "waiting" | "active";
type PartyRole = "leader" | "member";

interface SafePartySnapshot {
  inviteCode: string;
  status: PartyStatus;
  role: PartyRole;
  hostName: string;
  memberCount: number;
  memberLimit: number;
  inviteExpiresAt: string | null;
}

function partyRef(inviteCode: string) {
  return getAdminFirestore().collection(PARTIES_COLLECTION).doc(inviteCode);
}

function playerPartyRef(uid: string) {
  return getAdminFirestore().collection(PLAYER_PARTIES_COLLECTION).doc(uid);
}

function normalizeInviteCode(value: unknown): string | null {
  const code = typeof value === "string" ? value.trim().toUpperCase() : "";
  return PARTY_CODE_PATTERN.test(code) ? code : null;
}

function getDeviceId(request: CallableRequest<unknown>, label: string): string | undefined {
  const payload = asObject(request.data, label);
  assertAllowedKeys(payload, ["deviceId"], label);
  return typeof payload.deviceId === "string" ? payload.deviceId : undefined;
}

function readPartyLocation(payload: Record<string, unknown>): PartyLocation | null {
  const containsLocation = ["latitude", "longitude", "accuracyMetres"]
    .some((key) => payload[key] !== undefined);
  if (!containsLocation) return null;

  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);
  const accuracyMetres = Number(payload.accuracyMetres);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
    !Number.isFinite(accuracyMetres) || accuracyMetres < 0 ||
    accuracyMetres > PARTY_PRESENCE_MAX_ACCURACY_METRES) {
    throw new HttpsError("invalid-argument", "Use an accurate location to start or join a party.");
  }
  return { latitude, longitude, accuracyMetres };
}

function getCreatePartyRequest(request: CallableRequest<unknown>) {
  const payload = asObject(request.data, "createGrowGoParty payload");
  assertAllowedKeys(payload, ["deviceId", "latitude", "longitude", "accuracyMetres"], "createGrowGoParty payload");
  return {
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined,
    location: readPartyLocation(payload)
  };
}

function getJoinRequest(request: CallableRequest<unknown>): {
  deviceId: string | undefined;
  inviteCode: string;
  location: PartyLocation | null;
} {
  const payload = asObject(request.data, "joinGrowGoParty payload");
  assertAllowedKeys(payload, ["deviceId", "inviteCode", "latitude", "longitude", "accuracyMetres"], "joinGrowGoParty payload");
  const inviteCode = normalizeInviteCode(payload.inviteCode);
  if (!inviteCode) throw new HttpsError("invalid-argument", "That party QR code is not valid.");
  return {
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined,
    inviteCode,
    location: readPartyLocation(payload)
  };
}

function requireProfileName(snapshot: { exists: boolean; data(): DocumentData | undefined }) {
  if (!snapshot.exists) throw new HttpsError("failed-precondition", "Create your GrowGo profile before joining a party.");
  const player = readStoredPlayerDocument(snapshot.data());
  const name = String(player.displayName || "").trim();
  if (!player.profileComplete || !name) {
    throw new HttpsError("failed-precondition", "Create your GrowGo profile before joining a party.");
  }
  return { name, avatarUrl: player.avatarUrl };
}

function readSafePartySnapshot(params: {
  inviteCode: string;
  data: DocumentData;
  uid: string;
}): SafePartySnapshot {
  const memberUids = Array.isArray(params.data.memberUids)
    ? params.data.memberUids.filter((value): value is string => typeof value === "string")
    : [];
  const status: PartyStatus = params.data.status === "waiting" ? "waiting" : "active";
  const inviteExpiresAt = params.data.inviteExpiresAt instanceof Timestamp
    ? params.data.inviteExpiresAt.toDate().toISOString()
    : null;
  return {
    inviteCode: params.inviteCode,
    status,
    role: params.data.hostUid === params.uid ? "leader" : "member",
    hostName: typeof params.data.hostName === "string" && params.data.hostName.trim()
      ? params.data.hostName.trim()
      : "GrowGo player",
    memberCount: memberUids.length,
    memberLimit: PARTY_MEMBER_LIMIT,
    inviteExpiresAt
  };
}

function createInviteCode(): string {
  const bytes = randomBytes(6);
  let code = "P";
  for (const byte of bytes) code += PARTY_CODE_ALPHABET[byte % PARTY_CODE_ALPHABET.length];
  return code;
}

async function createPartyForPlayer(uid: string, location: PartyLocation | null): Promise<SafePartySnapshot> {
  const db = getAdminFirestore();
  return db.runTransaction(async (transaction) => {
    const membershipRef = playerPartyRef(uid);
    const playerRef = getPlayerDocumentRef(uid);
    const [membershipSnapshot, playerSnapshot] = await Promise.all([
      transaction.get(membershipRef),
      transaction.get(playerRef)
    ]);
    const player = requireProfileName(playerSnapshot);
    const now = Timestamp.now();

    const existingCode = normalizeInviteCode(membershipSnapshot.data()?.inviteCode);
    if (existingCode) {
      const existingPartyRef = partyRef(existingCode);
      const existingPartySnapshot = await transaction.get(existingPartyRef);
      if (existingPartySnapshot.exists) {
        const existingData = existingPartySnapshot.data() as DocumentData;
        const expiry = existingData.inviteExpiresAt instanceof Timestamp ? existingData.inviteExpiresAt : null;
        const waitingInviteExpired = existingData.status === "waiting" && expiry && expiry.toMillis() <= now.toMillis();
        if (!waitingInviteExpired && Array.isArray(existingData.memberUids) && existingData.memberUids.includes(uid)) {
          return readSafePartySnapshot({ inviteCode: existingCode, data: existingData, uid });
        }
      }
    }

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const inviteCode = createInviteCode();
      const inviteRef = partyRef(inviteCode);
      const inviteSnapshot = await transaction.get(inviteRef);
      if (inviteSnapshot.exists) continue;

      const inviteExpiresAt = Timestamp.fromMillis(now.toMillis() + PARTY_INVITE_WINDOW_MS);
      const partyData = {
        schemaVersion: PARTY_SCHEMA_VERSION,
        status: "waiting" as const,
        hostUid: uid,
        hostName: player.name,
        hostAvatarUrl: player.avatarUrl || null,
        memberUids: [uid],
        memberLimit: PARTY_MEMBER_LIMIT,
        createdAt: now,
        updatedAt: now,
        inviteExpiresAt
      };
      transaction.create(inviteRef, partyData);
      transaction.set(membershipRef, {
        schemaVersion: PARTY_SCHEMA_VERSION,
        inviteCode,
        role: "leader" as const,
        joinedAt: now,
        updatedAt: now
      });
      if (location) {
        transaction.set(getGrowGoPartyPresenceRef(db, inviteCode, uid), {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracyMetres: location.accuracyMetres,
          updatedAt: now
        });
      }
      return readSafePartySnapshot({ inviteCode, data: partyData, uid });
    }

    throw new HttpsError("aborted", "Could not create a party code. Please try again.");
  });
}

async function joinPartyForPlayer(
  uid: string,
  inviteCode: string,
  location: PartyLocation | null
): Promise<SafePartySnapshot> {
  const db = getAdminFirestore();
  return db.runTransaction(async (transaction) => {
    const membershipRef = playerPartyRef(uid);
    const playerRef = getPlayerDocumentRef(uid);
    const inviteRef = partyRef(inviteCode);
    const [membershipSnapshot, playerSnapshot, partySnapshot] = await Promise.all([
      transaction.get(membershipRef),
      transaction.get(playerRef),
      transaction.get(inviteRef)
    ]);
    requireProfileName(playerSnapshot);
    if (!partySnapshot.exists) throw new HttpsError("not-found", "That party is no longer available.");

    const now = Timestamp.now();
    const partyData = partySnapshot.data() as DocumentData;
    const memberUids = Array.isArray(partyData.memberUids)
      ? partyData.memberUids.filter((value): value is string => typeof value === "string")
      : [];
    const currentInviteCode = normalizeInviteCode(membershipSnapshot.data()?.inviteCode);
    if (currentInviteCode && currentInviteCode !== inviteCode) {
      throw new HttpsError("failed-precondition", "Leave your current party before joining another one.");
    }
    if (partyData.hostUid === uid) throw new HttpsError("failed-precondition", "You cannot join your own party.");

    const expiry = partyData.inviteExpiresAt instanceof Timestamp ? partyData.inviteExpiresAt : null;
    if (partyData.status === "waiting" && expiry && expiry.toMillis() <= now.toMillis()) {
      transaction.update(inviteRef, { status: "expired", updatedAt: now });
      throw new HttpsError("deadline-exceeded", "That party QR code has expired.");
    }
    if (partyData.status !== "waiting" && partyData.status !== "active") {
      throw new HttpsError("failed-precondition", "That party is no longer accepting players.");
    }
    if (!memberUids.includes(uid) && memberUids.length >= PARTY_MEMBER_LIMIT) {
      throw new HttpsError("resource-exhausted", "That party already has 8 players.");
    }

    const nextMembers = memberUids.includes(uid) ? memberUids : [...memberUids, uid];
    const nextData = {
      ...partyData,
      status: "active" as const,
      memberUids: nextMembers,
      updatedAt: now
    };
    transaction.update(inviteRef, {
      status: "active",
      memberUids: nextMembers,
      updatedAt: now
    });
    transaction.set(membershipRef, {
      schemaVersion: PARTY_SCHEMA_VERSION,
      inviteCode,
      role: "member" as const,
      joinedAt: membershipSnapshot.data()?.joinedAt instanceof Timestamp ? membershipSnapshot.data()?.joinedAt : now,
      updatedAt: now
    });
    if (location) {
      transaction.set(getGrowGoPartyPresenceRef(db, inviteCode, uid), {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracyMetres: location.accuracyMetres,
        updatedAt: now
      });
    }

    return readSafePartySnapshot({ inviteCode, data: nextData, uid });
  });
}

async function cancelPartyForPlayer(uid: string): Promise<void> {
  const db = getAdminFirestore();
  await db.runTransaction(async (transaction) => {
    const membershipRef = playerPartyRef(uid);
    const membershipSnapshot = await transaction.get(membershipRef);
    const inviteCode = normalizeInviteCode(membershipSnapshot.data()?.inviteCode);
    if (!inviteCode) return;

    const inviteRef = partyRef(inviteCode);
    const partySnapshot = await transaction.get(inviteRef);
    if (!partySnapshot.exists) {
      transaction.delete(membershipRef);
      return;
    }
    const partyData = partySnapshot.data() as DocumentData;
    if (partyData.hostUid !== uid) {
      throw new HttpsError("permission-denied", "Only the party creator can cancel this party.");
    }
    const memberUids = Array.isArray(partyData.memberUids)
      ? partyData.memberUids.filter((value): value is string => typeof value === "string")
      : [];
    const memberRefs = memberUids.map(playerPartyRef);
    const presenceRefs = memberUids.map((memberUid) => getGrowGoPartyPresenceRef(db, inviteCode, memberUid));
    const memberSnapshots = await Promise.all(memberRefs.map((ref) => transaction.get(ref)));
    const now = Timestamp.now();
    transaction.update(inviteRef, { status: "closed", updatedAt: now });
    memberSnapshots.forEach((snapshot, index) => {
      if (snapshot.exists && snapshot.data()?.inviteCode === inviteCode) transaction.delete(memberRefs[index]);
    });
    presenceRefs.forEach((presenceRef) => transaction.delete(presenceRef));
  });
}

/**
 * Removes only the requesting player. If the leader leaves an active party,
 * leadership passes to the earliest remaining member so the rest of the party
 * can keep playing together.
 */
async function leavePartyForPlayer(uid: string): Promise<{ transferredLeadership: boolean }> {
  const db = getAdminFirestore();
  return db.runTransaction(async (transaction) => {
    const membershipRef = playerPartyRef(uid);
    const membershipSnapshot = await transaction.get(membershipRef);
    const inviteCode = normalizeInviteCode(membershipSnapshot.data()?.inviteCode);
    if (!inviteCode) return { transferredLeadership: false };

    const inviteRef = partyRef(inviteCode);
    const partySnapshot = await transaction.get(inviteRef);
    if (!partySnapshot.exists) {
      transaction.delete(membershipRef);
      return { transferredLeadership: false };
    }

    const partyData = partySnapshot.data() as DocumentData;
    const memberUids = Array.isArray(partyData.memberUids)
      ? partyData.memberUids.filter((value): value is string => typeof value === "string")
      : [];
    if (!memberUids.includes(uid)) {
      transaction.delete(membershipRef);
      return { transferredLeadership: false };
    }

    const remainingMemberUids = memberUids.filter((memberUid) => memberUid !== uid);
    const leavingLeader = partyData.hostUid === uid;
    const nextLeaderUid = leavingLeader ? remainingMemberUids[0] || null : null;
    const nextLeaderSnapshot = nextLeaderUid
      ? await transaction.get(getPlayerDocumentRef(nextLeaderUid))
      : null;
    const now = Timestamp.now();

    transaction.delete(membershipRef);
    transaction.delete(getGrowGoPartyPresenceRef(db, inviteCode, uid));

    if (!remainingMemberUids.length) {
      transaction.update(inviteRef, {
        status: "closed",
        memberUids: [],
        updatedAt: now
      });
      return { transferredLeadership: false };
    }

    // A one-player remainder becomes a fresh waiting party. Its existing QR
    // stays fixed, but it gets a new ten-minute invitation window.
    const nextStatus: PartyStatus = remainingMemberUids.length >= 2 ? "active" : "waiting";
    const sharedUpdate: Record<string, unknown> = {
      status: nextStatus,
      memberUids: remainingMemberUids,
      updatedAt: now,
      ...(nextStatus === "waiting"
        ? { inviteExpiresAt: Timestamp.fromMillis(now.toMillis() + PARTY_INVITE_WINDOW_MS) }
        : {})
    };

    if (nextLeaderUid) {
      const nextLeader = nextLeaderSnapshot?.exists
        ? readStoredPlayerDocument(nextLeaderSnapshot.data())
        : null;
      transaction.update(inviteRef, {
        ...sharedUpdate,
        hostUid: nextLeaderUid,
        hostName: nextLeader?.displayName || "GrowGo player",
        hostAvatarUrl: nextLeader?.avatarUrl || null
      });
      transaction.set(playerPartyRef(nextLeaderUid), {
        role: "leader" as const,
        updatedAt: now
      }, { merge: true });
    } else {
      transaction.update(inviteRef, sharedUpdate);
    }

    return { transferredLeadership: Boolean(nextLeaderUid) };
  });
}

async function reportPartyLocationForPlayer(
  uid: string,
  location: PartyLocation
): Promise<SafePartySnapshot | null> {
  const db = getAdminFirestore();
  return db.runTransaction(async (transaction) => {
    const membershipRef = playerPartyRef(uid);
    const membershipSnapshot = await transaction.get(membershipRef);
    const inviteCode = normalizeInviteCode(membershipSnapshot.data()?.inviteCode);
    if (!inviteCode) return null;

    const inviteRef = partyRef(inviteCode);
    const partySnapshot = await transaction.get(inviteRef);
    if (!partySnapshot.exists) return null;
    const partyData = partySnapshot.data() as DocumentData;
    const memberUids = Array.isArray(partyData.memberUids)
      ? partyData.memberUids.filter((value): value is string => typeof value === "string")
      : [];
    if (!memberUids.includes(uid) || (partyData.status !== "waiting" && partyData.status !== "active")) {
      return null;
    }

    const now = Timestamp.now();
    transaction.set(getGrowGoPartyPresenceRef(db, inviteCode, uid), {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracyMetres: location.accuracyMetres,
      updatedAt: now
    });
    return readSafePartySnapshot({ inviteCode, data: partyData, uid });
  });
}

function requirePartyAccess(request: CallableRequest<unknown>) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });
  requireDevelopmentBackendOperationalSafeguardAccess({ operation: "player_snapshot", uid: authContext.uid });
  return authContext;
}

export async function createGrowGoPartyHandler(request: CallableRequest<unknown>) {
  const authContext = requirePartyAccess(request);
  const input = getCreatePartyRequest(request);
  await requireActiveDeviceSessionIfEnabled({ uid: authContext.uid, deviceId: input.deviceId });
  return { ok: true, party: await createPartyForPlayer(authContext.uid, input.location) };
}

export async function joinGrowGoPartyHandler(request: CallableRequest<unknown>) {
  const authContext = requirePartyAccess(request);
  const input = getJoinRequest(request);
  await requireActiveDeviceSessionIfEnabled({ uid: authContext.uid, deviceId: input.deviceId });
  return { ok: true, party: await joinPartyForPlayer(authContext.uid, input.inviteCode, input.location) };
}

export async function cancelGrowGoPartyHandler(request: CallableRequest<unknown>) {
  const authContext = requirePartyAccess(request);
  const deviceId = getDeviceId(request, "cancelGrowGoParty payload");
  await requireActiveDeviceSessionIfEnabled({ uid: authContext.uid, deviceId });
  await cancelPartyForPlayer(authContext.uid);
  return { ok: true };
}

export async function leaveGrowGoPartyHandler(request: CallableRequest<unknown>) {
  const authContext = requirePartyAccess(request);
  const deviceId = getDeviceId(request, "leaveGrowGoParty payload");
  await requireActiveDeviceSessionIfEnabled({ uid: authContext.uid, deviceId });
  return { ok: true, ...(await leavePartyForPlayer(authContext.uid)) };
}

export async function reportGrowGoPartyLocationHandler(request: CallableRequest<unknown>) {
  const authContext = requirePartyAccess(request);
  const payload = asObject(request.data, "reportGrowGoPartyLocation payload");
  assertAllowedKeys(payload, ["deviceId", "latitude", "longitude", "accuracyMetres"], "reportGrowGoPartyLocation payload");
  const location = readPartyLocation(payload);
  if (!location) throw new HttpsError("invalid-argument", "Current party location is required.");
  await requireActiveDeviceSessionIfEnabled({
    uid: authContext.uid,
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined
  });
  return { ok: true, party: await reportPartyLocationForPlayer(authContext.uid, location) };
}

export const createGrowGoParty = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  createGrowGoPartyHandler
);

export const joinGrowGoParty = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  joinGrowGoPartyHandler
);

export const cancelGrowGoParty = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  cancelGrowGoPartyHandler
);

export const leaveGrowGoParty = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  leaveGrowGoPartyHandler
);

export const reportGrowGoPartyLocation = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  reportGrowGoPartyLocationHandler
);
