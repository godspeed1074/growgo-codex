import {
  Timestamp,
  type DocumentData,
  type Firestore,
  type Transaction
} from "firebase-admin/firestore";

import { calculateHaversineDistanceMetres } from "../pins/canonicalPinGenerator";

export const GROWGO_PARTIES_COLLECTION = "growGoParties" as const;
export const GROWGO_PLAYER_PARTIES_COLLECTION = "growGoPlayerParties" as const;
export const PARTY_MEMBER_LIMIT = 8 as const;
export const PARTY_PROXIMITY_METRES = 100 as const;
// Party location is sent at joining and lightly refreshed while a party is
// active. It is deliberately short-lived so an old position never grants XP.
export const PARTY_PRESENCE_MAX_AGE_MILLISECONDS = 2 * 60 * 1_000;
export const PARTY_PRESENCE_MAX_ACCURACY_METRES = 100 as const;

export interface PartyLocation {
  latitude: number;
  longitude: number;
  accuracyMetres: number;
}

export interface PartyXpBonus {
  eligibleMemberCount: number;
  bonusPercent: 0 | 50 | 75 | 100;
  multiplier: 1 | 1.5 | 1.75 | 2;
}

const NO_PARTY_XP_BONUS: PartyXpBonus = Object.freeze({
  eligibleMemberCount: 0,
  bonusPercent: 0,
  multiplier: 1
});

export function getGrowGoPartyRef(db: Firestore, inviteCode: string) {
  return db.collection(GROWGO_PARTIES_COLLECTION).doc(inviteCode);
}

export function getGrowGoPlayerPartyRef(db: Firestore, uid: string) {
  return db.collection(GROWGO_PLAYER_PARTIES_COLLECTION).doc(uid);
}

export function getGrowGoPartyPresenceRef(db: Firestore, inviteCode: string, uid: string) {
  return getGrowGoPartyRef(db, inviteCode).collection("presence").doc(uid);
}

export function getPartyXpBonusForEligibleMemberCount(count: number): PartyXpBonus {
  const eligibleMemberCount = Math.max(0, Math.min(PARTY_MEMBER_LIMIT, Math.floor(count)));
  if (eligibleMemberCount >= 4) {
    return { eligibleMemberCount, bonusPercent: 100, multiplier: 2 };
  }
  if (eligibleMemberCount === 3) {
    return { eligibleMemberCount, bonusPercent: 75, multiplier: 1.75 };
  }
  if (eligibleMemberCount === 2) {
    return { eligibleMemberCount, bonusPercent: 50, multiplier: 1.5 };
  }
  return { ...NO_PARTY_XP_BONUS, eligibleMemberCount };
}

export function readPartyLocation(value: unknown, now: Date): PartyLocation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const latitude = Number(record.latitude);
  const longitude = Number(record.longitude);
  const accuracyMetres = Number(record.accuracyMetres);
  const updatedAt = record.updatedAt;
  const updatedAtMillis = updatedAt instanceof Timestamp
    ? updatedAt.toMillis()
    : updatedAt instanceof Date
      ? updatedAt.getTime()
      : NaN;

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
    !Number.isFinite(accuracyMetres) || accuracyMetres < 0 ||
    accuracyMetres > PARTY_PRESENCE_MAX_ACCURACY_METRES ||
    !Number.isFinite(updatedAtMillis) ||
    now.getTime() - updatedAtMillis > PARTY_PRESENCE_MAX_AGE_MILLISECONDS ||
    updatedAtMillis - now.getTime() > 30_000) {
    return null;
  }

  return { latitude, longitude, accuracyMetres };
}

/**
 * Resolves the party tier inside the same transaction that grants XP. The
 * caller's just-verified gameplay location overrides their cached presence;
 * every other member needs a recent in-range presence record.
 */
export async function resolvePartyXpBonusForReward(params: {
  db: Firestore;
  transaction: Transaction;
  uid: string;
  now: Date;
  currentLocation: PartyLocation;
}): Promise<PartyXpBonus> {
  const membershipRef = getGrowGoPlayerPartyRef(params.db, params.uid);
  const membershipSnapshot = await params.transaction.get(membershipRef);
  const inviteCode = typeof membershipSnapshot.data()?.inviteCode === "string"
    ? membershipSnapshot.data()?.inviteCode.trim().toUpperCase()
    : "";
  if (!/^P[A-Z0-9]{6,8}$/.test(inviteCode)) return { ...NO_PARTY_XP_BONUS };

  const partyRef = getGrowGoPartyRef(params.db, inviteCode);
  const partySnapshot = await params.transaction.get(partyRef);
  if (!partySnapshot.exists) return { ...NO_PARTY_XP_BONUS };

  const party = partySnapshot.data() as DocumentData;
  if (party.status !== "active" || typeof party.hostUid !== "string") {
    return { ...NO_PARTY_XP_BONUS };
  }
  const memberUids = Array.isArray(party.memberUids)
    ? party.memberUids.filter((value): value is string => typeof value === "string")
    : [];
  if (memberUids.length < 2 || !memberUids.includes(params.uid) || !memberUids.includes(party.hostUid)) {
    return { ...NO_PARTY_XP_BONUS };
  }

  const otherMemberUids = memberUids.filter((uid) => uid !== params.uid);
  const otherPresenceRefs = otherMemberUids.map((uid) =>
    getGrowGoPartyPresenceRef(params.db, inviteCode, uid)
  );
  const otherPresenceSnapshots = await Promise.all(
    otherPresenceRefs.map((ref) => params.transaction.get(ref))
  );
  const locationsByUid = new Map<string, PartyLocation>();
  locationsByUid.set(params.uid, params.currentLocation);
  otherMemberUids.forEach((uid, index) => {
    const location = readPartyLocation(otherPresenceSnapshots[index]?.data(), params.now);
    if (location) locationsByUid.set(uid, location);
  });

  const leaderLocation = locationsByUid.get(party.hostUid);
  if (!leaderLocation) return { ...NO_PARTY_XP_BONUS };

  const eligibleMemberCount = memberUids.reduce((count, uid) => {
    const location = locationsByUid.get(uid);
    if (!location) return count;
    const distance = calculateHaversineDistanceMetres(leaderLocation, location);
    return distance <= PARTY_PROXIMITY_METRES ? count + 1 : count;
  }, 0);

  return getPartyXpBonusForEligibleMemberCount(eligibleMemberCount);
}

export function serializePartyXpBonus(bonus: PartyXpBonus, applied: boolean, bonusXp: number) {
  return {
    eligibleMemberCount: bonus.eligibleMemberCount,
    bonusPercent: bonus.bonusPercent,
    applied,
    bonusXp: Math.max(0, Math.floor(bonusXp))
  };
}
