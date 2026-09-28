import {
  HttpsError,
  onCall,
  type CallableRequest
} from "firebase-functions/v2/https";
import { Timestamp, type DocumentData, type DocumentReference, type Transaction, type Firestore } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import { requireDevelopmentBackendOperationalSafeguardAccess } from "../config/developmentBackendOperationalSafeguards";
import { requireActiveDeviceSessionIfEnabled } from "../domain/players/activeDeviceSession";
import { getPlayerDocumentRef, readStoredPlayerDocument } from "../domain/players/playerStore";
import {
  getPlayerPublicCodeRef,
  normalizePlayerPublicCode
} from "../domain/social/playerPublicCodes";
import { getAdminFirestore } from "../firebaseAdmin";
import { requireDevelopmentBackendCapabilityAccess } from "../security/developmentBackendCapabilityGuard";
import { requireAppCheckIfEnabled, requireAuthenticated } from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import { asObject, assertAllowedKeys } from "../validation/requestValidation";
import { createSocialIdentityLookup, type SocialIdentity } from "../domain/social/socialIdentityLookup";

const PLAYER_SOCIAL_COLLECTION = "playerSocial" as const;
const MET_SUBCOLLECTION = "met" as const;
const FRIENDS_SUBCOLLECTION = "friends" as const;
const SOCIAL_SCHEMA_VERSION = 1 as const;
const MAX_SOCIAL_ENTRIES = 2_000;

const identityLookups = new WeakMap<Firestore, ReturnType<typeof createSocialIdentityLookup>>();
function getSocialIdentityLookup(db: Firestore) {
  let lookup = identityLookups.get(db);
  if (!lookup) {
    lookup = createSocialIdentityLookup(async uids => {
      const snapshots = await db.getAll(...uids.map(uid => db.collection("players").doc(uid)),
        { fieldMask: ["publicCode", "displayName", "avatarUrl", "profileComplete"] });
      return new Map(snapshots.map(snapshot => {
        const data = snapshot.data();
        const publicCode = normalizePlayerPublicCode(data?.publicCode);
        const name = typeof data?.displayName === "string" ? data.displayName.trim() : "";
        const identity: SocialIdentity | null = data?.profileComplete === true && publicCode && name
          ? { publicCode, name, avatarUrl: typeof data.avatarUrl === "string" ? data.avatarUrl : null }
          : null;
        return [snapshot.id, identity];
      }));
    });
    identityLookups.set(db, lookup);
  }
  return lookup;
}

interface PlayerSocialPeer {
  id: string;
  name: string;
  avatarUrl: string | null;
  metAt: string;
}

interface PlayerSocialSnapshot {
  met: PlayerSocialPeer[];
  friends: PlayerSocialPeer[];
}

interface ResolvedPeer {
  uid: string;
  publicCode: string;
  displayName: string;
  avatarUrl: string | null;
}

function getSocialEntryRef(uid: string, kind: typeof MET_SUBCOLLECTION | typeof FRIENDS_SUBCOLLECTION, peerUid: string): DocumentReference<DocumentData> {
  return getAdminFirestore().collection(PLAYER_SOCIAL_COLLECTION).doc(uid).collection(kind).doc(peerUid);
}

function validateDeviceOnlyRequest(request: CallableRequest<unknown>, label: string): string | undefined {
  const payload = asObject(request.data, label);
  assertAllowedKeys(payload, ["deviceId"], label);
  return typeof payload.deviceId === "string" ? payload.deviceId : undefined;
}

function validatePublicCodeRequest(request: CallableRequest<unknown>, label: string): { deviceId: string | undefined; publicCode: string } {
  const payload = asObject(request.data, label);
  assertAllowedKeys(payload, ["deviceId", "publicCode"], label);
  const publicCode = normalizePlayerPublicCode(payload.publicCode);
  if (!publicCode) {
    throw new HttpsError("invalid-argument", "That GrowGo player code is not valid.");
  }
  return {
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined,
    publicCode
  };
}

function peerFromPlayer(uid: string, player: ReturnType<typeof readStoredPlayerDocument>): ResolvedPeer {
  const publicCode = normalizePlayerPublicCode(player.publicCode);
  if (!player.profileComplete || !publicCode || !player.displayName) {
    throw new HttpsError("not-found", "That GrowGo player code could not be verified.");
  }
  return {
    uid,
    publicCode,
    displayName: player.displayName,
    avatarUrl: player.avatarUrl
  };
}

function socialEntryFromPeer(peer: ResolvedPeer, metAt: Timestamp) {
  return {
    schemaVersion: SOCIAL_SCHEMA_VERSION,
    peerUid: peer.uid,
    publicCode: peer.publicCode,
    displayName: peer.displayName,
    avatarUrl: peer.avatarUrl,
    firstMetAt: metAt,
    updatedAt: metAt
  };
}

function readSocialPeer(snapshot: { id: string; data(): DocumentData }): PlayerSocialPeer | null {
  const data = snapshot.data();
  const id = normalizePlayerPublicCode(data.publicCode);
  const name = typeof data.displayName === "string" ? data.displayName.trim() : "";
  const firstMetAt = data.firstMetAt instanceof Timestamp ? data.firstMetAt : null;
  if (data.schemaVersion !== SOCIAL_SCHEMA_VERSION || !id || !name || !firstMetAt) return null;
  return {
    id,
    name,
    avatarUrl: typeof data.avatarUrl === "string" ? data.avatarUrl : null,
    metAt: firstMetAt.toDate().toISOString()
  };
}

async function resolveScannedPeerInTransaction(params: {
  transaction: Transaction;
  currentUid: string;
  publicCode: string;
}): Promise<{ current: ResolvedPeer; target: ResolvedPeer }> {
  const currentRef = getPlayerDocumentRef(params.currentUid);
  const codeRef = getPlayerPublicCodeRef(params.publicCode);
  const [currentSnapshot, codeSnapshot] = await Promise.all([
    params.transaction.get(currentRef),
    params.transaction.get(codeRef)
  ]);

  const targetUid = typeof codeSnapshot.data()?.uid === "string" ? codeSnapshot.data()?.uid : "";
  if (!codeSnapshot.exists || !targetUid) {
    throw new HttpsError("not-found", "That GrowGo player code could not be verified.");
  }
  if (targetUid === params.currentUid) {
    throw new HttpsError("failed-precondition", "You cannot scan your own GrowGo code.");
  }

  const targetSnapshot = await params.transaction.get(getPlayerDocumentRef(targetUid));
  if (!currentSnapshot.exists || !targetSnapshot.exists) {
    throw new HttpsError("failed-precondition", "Create your GrowGo profile before using Meet.");
  }

  const current = peerFromPlayer(params.currentUid, readStoredPlayerDocument(currentSnapshot.data()));
  const target = peerFromPlayer(targetUid, readStoredPlayerDocument(targetSnapshot.data()));
  if (target.publicCode !== params.publicCode) {
    throw new HttpsError("not-found", "That GrowGo player code could not be verified.");
  }

  return { current, target };
}

export async function scanGrowGoPlayerCodeHandler(request: CallableRequest<unknown>) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });
  requireDevelopmentBackendOperationalSafeguardAccess({ operation: "player_snapshot", uid: authContext.uid });

  const input = validatePublicCodeRequest(request, "scanGrowGoPlayerCode payload");
  await requireActiveDeviceSessionIfEnabled({ uid: authContext.uid, deviceId: input.deviceId });

  const db = getAdminFirestore();
  return db.runTransaction(async (transaction) => {
    const { current, target } = await resolveScannedPeerInTransaction({
      transaction,
      currentUid: authContext.uid,
      publicCode: input.publicCode
    });
    const currentMetRef = getSocialEntryRef(current.uid, MET_SUBCOLLECTION, target.uid);
    const targetMetRef = getSocialEntryRef(target.uid, MET_SUBCOLLECTION, current.uid);
    const [currentMetSnapshot, targetMetSnapshot] = await Promise.all([
      transaction.get(currentMetRef),
      transaction.get(targetMetRef)
    ]);
    const now = Timestamp.now();
    const currentFirstMetAt = currentMetSnapshot.data()?.firstMetAt instanceof Timestamp
      ? currentMetSnapshot.data()?.firstMetAt
      : now;
    const targetFirstMetAt = targetMetSnapshot.data()?.firstMetAt instanceof Timestamp
      ? targetMetSnapshot.data()?.firstMetAt
      : now;

    transaction.set(currentMetRef, {
      ...socialEntryFromPeer(target, currentFirstMetAt),
      updatedAt: now
    });
    transaction.set(targetMetRef, {
      ...socialEntryFromPeer(current, targetFirstMetAt),
      updatedAt: now
    });

    return {
      ok: true,
      created: !currentMetSnapshot.exists,
      player: {
        id: target.publicCode,
        name: target.displayName,
        avatarUrl: target.avatarUrl,
        metAt: currentFirstMetAt.toDate().toISOString()
      } satisfies PlayerSocialPeer
    };
  });
}

export async function addGrowGoFriendHandler(request: CallableRequest<unknown>) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });
  requireDevelopmentBackendOperationalSafeguardAccess({ operation: "player_snapshot", uid: authContext.uid });

  const input = validatePublicCodeRequest(request, "addGrowGoFriend payload");
  await requireActiveDeviceSessionIfEnabled({ uid: authContext.uid, deviceId: input.deviceId });

  const db = getAdminFirestore();
  return db.runTransaction(async (transaction) => {
    const { current, target } = await resolveScannedPeerInTransaction({
      transaction,
      currentUid: authContext.uid,
      publicCode: input.publicCode
    });
    const metRef = getSocialEntryRef(current.uid, MET_SUBCOLLECTION, target.uid);
    const friendRef = getSocialEntryRef(current.uid, FRIENDS_SUBCOLLECTION, target.uid);
    const [metSnapshot, friendSnapshot] = await Promise.all([
      transaction.get(metRef),
      transaction.get(friendRef)
    ]);
    if (!metSnapshot.exists) {
      throw new HttpsError("failed-precondition", "Meet this player by scanning their GrowGo code before adding them as a friend.");
    }

    const now = Timestamp.now();
    const firstMetAt = metSnapshot.data()?.firstMetAt instanceof Timestamp
      ? metSnapshot.data()?.firstMetAt
      : now;
    transaction.set(friendRef, {
      ...socialEntryFromPeer(target, firstMetAt),
      addedAt: friendSnapshot.data()?.addedAt instanceof Timestamp ? friendSnapshot.data()?.addedAt : now,
      updatedAt: now
    });

    return {
      ok: true,
      created: !friendSnapshot.exists,
      friend: {
        id: target.publicCode,
        name: target.displayName,
        avatarUrl: target.avatarUrl,
        metAt: firstMetAt.toDate().toISOString()
      } satisfies PlayerSocialPeer
    };
  });
}

export async function getGrowGoSocialSnapshotHandler(request: CallableRequest<unknown>) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });
  requireDevelopmentBackendOperationalSafeguardAccess({ operation: "player_snapshot", uid: authContext.uid });

  const deviceId = validateDeviceOnlyRequest(request, "getGrowGoSocialSnapshot payload");
  await requireActiveDeviceSessionIfEnabled({ uid: authContext.uid, deviceId });

  const playerSnapshot = await getPlayerDocumentRef(authContext.uid).get();
  if (!playerSnapshot.exists || !readStoredPlayerDocument(playerSnapshot.data()).profileComplete) {
    throw new HttpsError("failed-precondition", "Create your GrowGo profile before using Social.");
  }

  const db = getAdminFirestore();
  const [metSnapshots, friendSnapshots] = await Promise.all([
    db.collection(PLAYER_SOCIAL_COLLECTION).doc(authContext.uid).collection(MET_SUBCOLLECTION).limit(MAX_SOCIAL_ENTRIES).get(),
    db.collection(PLAYER_SOCIAL_COLLECTION).doc(authContext.uid).collection(FRIENDS_SUBCOLLECTION).limit(MAX_SOCIAL_ENTRIES).get()
  ]);
  const sortByNewest = (left: PlayerSocialPeer, right: PlayerSocialPeer) => right.metAt.localeCompare(left.metAt);
  const social: PlayerSocialSnapshot = {
    met: metSnapshots.docs.map(readSocialPeer).filter((peer): peer is PlayerSocialPeer => Boolean(peer)).sort(sortByNewest),
    friends: friendSnapshots.docs.map(readSocialPeer).filter((peer): peer is PlayerSocialPeer => Boolean(peer)).sort(sortByNewest)
  };

  // Relationship records retain the photo/name from the day of the scan.
  // Resolve current public identity for known peers only; deduplicate Friends
  // and Met so one person costs at most one extra read per warm-cache minute.
  const peerUids = new Map([...metSnapshots.docs, ...friendSnapshots.docs]
    .map(snapshot => ({ snapshot, peer: readSocialPeer(snapshot) }))
    .filter(entry => entry.peer !== null)
    .map(({ snapshot, peer }) => [peer!.id, snapshot.id]));
  const identities = await getSocialIdentityLookup(db)([...peerUids.values()]);
  for (const peer of [...social.met, ...social.friends]) {
    const identity = identities.get(peerUids.get(peer.id)!);
    // Do not keep a deleted/moderated photo or attach a re-assigned identity.
    peer.avatarUrl = identity?.publicCode === peer.id ? identity.avatarUrl : null;
    if (identity?.publicCode === peer.id) peer.name = identity.name;
  }

  return { ok: true, social };
}

export const scanGrowGoPlayerCode = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  scanGrowGoPlayerCodeHandler
);

export const addGrowGoFriend = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  addGrowGoFriendHandler
);

export const getGrowGoSocialSnapshot = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  getGrowGoSocialSnapshotHandler
);
