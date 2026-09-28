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
import { getGrowGoUtcDayKey } from "../domain/leaderboards/leaderboardPeriods";
import {
  requireActiveDeviceSessionIfEnabled
} from "../domain/players/activeDeviceSession";
import {
  getPlayerDocumentRef,
  readStoredPlayerDocument
} from "../domain/players/playerStore";
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

export const ALPHA_PEW_PEW_TEST_KIT_ID = "alpha-pew-pew-2-2-test-kit-v1" as const;
export const PEW_PEW_DAILY_TEST_CHARGES = 5;
export const PEW_PEW_EXTRA_TEST_CHARGES = 5;
// One closed-alpha-only top-up: it applies on the UTC day the request was
// approved, then normal five-charge daily refreshes resume the next day.
export const PEW_PEW_EXTRA_CHARGE_DAY = "2026-08-28" as const;
const ALPHA_PEW_PEW_EXTRA_CHARGES_ID = "alpha-pew-pew-2-2-extra-charges-2026-08-28" as const;

export interface PewPewChargeState {
  dayKey: string;
  chargesAvailable: number;
  bonusCharges: number;
}

export function getPewPewChargeState(data: unknown, utcDay: string): PewPewChargeState {
  if (!data || typeof data !== "object") {
    return {
      dayKey: utcDay,
      chargesAvailable: PEW_PEW_DAILY_TEST_CHARGES,
      bonusCharges: 0
    };
  }

  const stored = data as Record<string, unknown>;
  if (stored.dayKey !== utcDay) {
    return {
      dayKey: utcDay,
      chargesAvailable: PEW_PEW_DAILY_TEST_CHARGES,
      bonusCharges: 0
    };
  }

  const bonusCharges = Number(stored.bonusCharges);
  const normalizedBonusCharges = Number.isSafeInteger(bonusCharges)
    ? Math.max(0, Math.min(PEW_PEW_EXTRA_TEST_CHARGES, bonusCharges))
    : 0;
  const chargesAvailable = Number(stored.chargesAvailable);
  return {
    dayKey: utcDay,
    chargesAvailable: Number.isSafeInteger(chargesAvailable)
      ? Math.max(0, Math.min(PEW_PEW_DAILY_TEST_CHARGES + normalizedBonusCharges, chargesAvailable))
      : PEW_PEW_DAILY_TEST_CHARGES + normalizedBonusCharges,
    bonusCharges: normalizedBonusCharges
  };
}

export function getNextUtcReset(now: Date): string {
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  )).toISOString();
}

async function requireEligibleAlphaPlayer(request: CallableRequest<unknown>) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });
  requireDevelopmentBackendOperationalSafeguardAccess({
    operation: "player_snapshot",
    uid: authContext.uid
  });

  const payload = asObject(request.data, "alphaPewPewTestKit payload");
  assertAllowedKeys(payload, ["deviceId"], "alphaPewPewTestKit payload");
  await requireActiveDeviceSessionIfEnabled({
    uid: authContext.uid,
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined
  });

  return authContext;
}

function getRewardRef(uid: string) {
  return getAdminFirestore()
    .collection("playerRewardGrants")
    .doc(uid)
    .collection("rewards")
    .doc(ALPHA_PEW_PEW_TEST_KIT_ID);
}

function getChargeStateRef(uid: string) {
  return getAdminFirestore()
    .collection("playerToyChargeStates")
    .doc(uid)
    .collection("toys")
    .doc("pew-pew-2-2");
}

function getExtraChargeRewardRef(uid: string) {
  return getAdminFirestore()
    .collection("playerRewardGrants")
    .doc(uid)
    .collection("rewards")
    .doc(ALPHA_PEW_PEW_EXTRA_CHARGES_ID);
}

export async function claimAlphaPewPewTestKitHandler(
  request: CallableRequest<unknown>
) {
  const authContext = await requireEligibleAlphaPlayer(request);
  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(authContext.uid);
  const rewardRef = getRewardRef(authContext.uid);
  const chargeStateRef = getChargeStateRef(authContext.uid);
  const now = new Date();
  const utcDay = getGrowGoUtcDayKey(now);

  return db.runTransaction(async (transaction) => {
    const [playerSnapshot, rewardSnapshot, chargeSnapshot] = await Promise.all([
      transaction.get(playerRef),
      transaction.get(rewardRef),
      transaction.get(chargeStateRef)
    ]);

    if (!playerSnapshot.exists || !readStoredPlayerDocument(playerSnapshot.data()).profileComplete) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before claiming rewards.");
    }

    const claimedNow = !rewardSnapshot.exists;
    if (claimedNow) {
      transaction.create(rewardRef, {
        schemaVersion: 1,
        rewardId: ALPHA_PEW_PEW_TEST_KIT_ID,
        itemId: "pew_pew_2_2",
        grantedAt: Timestamp.fromDate(now)
      });
    }

    const chargeState = getPewPewChargeState(chargeSnapshot.data(), utcDay);
    transaction.set(chargeStateRef, {
      schemaVersion: 1,
      toyId: "pew_pew_2_2",
      ...chargeState,
      updatedAt: Timestamp.fromDate(now)
    }, { merge: true });

    return {
      ok: true,
      claimId: ALPHA_PEW_PEW_TEST_KIT_ID,
      claimedNow,
      owned: true,
      dailyCharges: PEW_PEW_DAILY_TEST_CHARGES,
      bonusCharges: chargeState.bonusCharges,
      chargesAvailable: chargeState.chargesAvailable,
      resetsAt: getNextUtcReset(now),
      mode: "live-alpha"
    };
  });
}

export async function consumeAlphaPewPewTestChargeHandler(
  request: CallableRequest<unknown>
) {
  const authContext = await requireEligibleAlphaPlayer(request);
  const db = getAdminFirestore();
  const rewardRef = getRewardRef(authContext.uid);
  const chargeStateRef = getChargeStateRef(authContext.uid);
  const now = new Date();
  const utcDay = getGrowGoUtcDayKey(now);

  return db.runTransaction(async (transaction) => {
    const [rewardSnapshot, chargeSnapshot] = await Promise.all([
      transaction.get(rewardRef),
      transaction.get(chargeStateRef)
    ]);

    if (!rewardSnapshot.exists) {
      throw new HttpsError("failed-precondition", "The Pew-Pew 2-2 test kit is not available on this account.");
    }

    const previousState = getPewPewChargeState(chargeSnapshot.data(), utcDay);
    if (previousState.chargesAvailable <= 0) {
      throw new HttpsError("resource-exhausted", "All five Pew-Pew test charges have been used. They reset at 00:00 UTC.");
    }

    const nextState: PewPewChargeState = {
      dayKey: utcDay,
      chargesAvailable: previousState.chargesAvailable - 1,
      bonusCharges: previousState.bonusCharges
    };
    transaction.set(chargeStateRef, {
      schemaVersion: 1,
      toyId: "pew_pew_2_2",
      ...nextState,
      updatedAt: Timestamp.fromDate(now)
    }, { merge: true });

    return {
      ok: true,
      consumed: true,
      dailyCharges: PEW_PEW_DAILY_TEST_CHARGES,
      bonusCharges: nextState.bonusCharges,
      chargesAvailable: nextState.chargesAvailable,
      resetsAt: getNextUtcReset(now),
      mode: "live-alpha"
    };
  });
}

export async function claimAlphaPewPewExtraChargesHandler(
  request: CallableRequest<unknown>
) {
  const authContext = await requireEligibleAlphaPlayer(request);
  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(authContext.uid);
  const kitRewardRef = getRewardRef(authContext.uid);
  const extraRewardRef = getExtraChargeRewardRef(authContext.uid);
  const chargeStateRef = getChargeStateRef(authContext.uid);
  const now = new Date();
  const utcDay = getGrowGoUtcDayKey(now);

  return db.runTransaction(async (transaction) => {
    const [playerSnapshot, kitRewardSnapshot, extraRewardSnapshot, chargeSnapshot] = await Promise.all([
      transaction.get(playerRef),
      transaction.get(kitRewardRef),
      transaction.get(extraRewardRef),
      transaction.get(chargeStateRef)
    ]);
    if (!playerSnapshot.exists || !readStoredPlayerDocument(playerSnapshot.data()).profileComplete) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before claiming rewards.");
    }

    if (!kitRewardSnapshot.exists) {
      transaction.create(kitRewardRef, {
        schemaVersion: 1,
        rewardId: ALPHA_PEW_PEW_TEST_KIT_ID,
        itemId: "pew_pew_2_2",
        grantedAt: Timestamp.fromDate(now)
      });
    }

    const canGrantToday = utcDay === PEW_PEW_EXTRA_CHARGE_DAY;
    const grantedNow = canGrantToday && !extraRewardSnapshot.exists;
    const currentState = getPewPewChargeState(chargeSnapshot.data(), utcDay);
    const nextState: PewPewChargeState = grantedNow
      ? {
          dayKey: utcDay,
          chargesAvailable: Math.min(
            PEW_PEW_DAILY_TEST_CHARGES + PEW_PEW_EXTRA_TEST_CHARGES,
            currentState.chargesAvailable + PEW_PEW_EXTRA_TEST_CHARGES
          ),
          bonusCharges: PEW_PEW_EXTRA_TEST_CHARGES
        }
      : currentState;

    if (grantedNow) {
      transaction.create(extraRewardRef, {
        schemaVersion: 1,
        rewardId: ALPHA_PEW_PEW_EXTRA_CHARGES_ID,
        charges: PEW_PEW_EXTRA_TEST_CHARGES,
        grantedAt: Timestamp.fromDate(now)
      });
    }
    transaction.set(chargeStateRef, {
      schemaVersion: 1,
      toyId: "pew_pew_2_2",
      ...nextState,
      updatedAt: Timestamp.fromDate(now)
    }, { merge: true });

    return {
      ok: true,
      claimId: ALPHA_PEW_PEW_EXTRA_CHARGES_ID,
      grantedNow,
      owned: true,
      dailyCharges: PEW_PEW_DAILY_TEST_CHARGES,
      bonusCharges: nextState.bonusCharges,
      chargesAvailable: nextState.chargesAvailable,
      resetsAt: getNextUtcReset(now),
      mode: "live-alpha"
    };
  });
}

export const claimAlphaPewPewTestKit = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  claimAlphaPewPewTestKitHandler
);

export const consumeAlphaPewPewTestCharge = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  consumeAlphaPewPewTestChargeHandler
);

export const claimAlphaPewPewExtraCharges = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  claimAlphaPewPewExtraChargesHandler
);
