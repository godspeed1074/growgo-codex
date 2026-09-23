import {
  HttpsError,
  onCall,
  type CallableRequest
} from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import {
  adminRoles,
  buildAdminAccountDocument,
  getAdminAccountRef,
  isAdminRole,
  readAdminAccount,
  requireAdminAccount,
  type AdminRole
} from "../domain/admin/adminAccounts";
import {
  createAwaitingDailyOperationsReport,
  dailyOperationsReportRef,
  readDailyOperationsReport
} from "../domain/admin/dailyOperationsReport";
import { recordAdminAuditEvent } from "../domain/admin/adminAuditLog";
import {
  listOfficialEventOccurrences,
  readOfficialEventSchedule
} from "../domain/events/officialEvents";
import { requireActiveDeviceSessionIfEnabled } from "../domain/players/activeDeviceSession";
import { getPlayerDocumentRef, readStoredPlayerDocument } from "../domain/players/playerStore";
import { getPlayerPublicCodeRef, normalizePlayerPublicCode } from "../domain/social/playerPublicCodes";
import { getAdminFirestore } from "../firebaseAdmin";
import { requireDevelopmentBackendCapabilityAccess } from "../security/developmentBackendCapabilityGuard";
import { requireAppCheckIfEnabled, requireAuthenticated } from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import { asObject, assertAllowedKeys } from "../validation/requestValidation";
import { readDailyOperationsBillingConfiguration } from "./refreshDailyOperationsReport";
import { resettableMainQuests } from "./adminQuestTools";

const ADMIN_OWNER_EMAILS_VARIABLE_NAME = "GROWGO_ADMIN_OWNER_EMAILS" as const;
const MAX_STAFF_ENTRIES = 50;

function validateDeviceRequest(request: CallableRequest<unknown>, label: string) {
  const payload = asObject(request.data, label);
  assertAllowedKeys(payload, ["deviceId"], label);
  return typeof payload.deviceId === "string" ? payload.deviceId : undefined;
}

async function requireSecuredAdminRequest(
  request: CallableRequest<unknown>,
  allowedRoles: readonly AdminRole[] = adminRoles,
  allowedKeys: readonly string[] = ["deviceId"]
) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });
  const payload = asObject(request.data, "Control Center payload");
  assertAllowedKeys(payload, allowedKeys, "Control Center payload");
  const deviceId = typeof payload.deviceId === "string" ? payload.deviceId : undefined;
  await requireActiveDeviceSessionIfEnabled({ uid: authContext.uid, deviceId });
  const account = await requireAdminAccount(authContext.uid, allowedRoles);
  return { authContext, account };
}

export async function bootstrapAdminOwnerHandler(request: CallableRequest<unknown>) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });
  const deviceId = validateDeviceRequest(request, "bootstrapAdminOwner payload");
  await requireActiveDeviceSessionIfEnabled({ uid: authContext.uid, deviceId });

  const email = normalizeEmail(request.auth?.token?.email);
  const configuredOwnerEmails = readConfiguredOwnerEmails();
  if (!email || !configuredOwnerEmails.includes(email)) {
    throw new HttpsError(
      "permission-denied",
      "This account is not configured as a GrowGo Control Center owner."
    );
  }

  const playerSnapshot = await getPlayerDocumentRef(authContext.uid).get();
  if (!playerSnapshot.exists || !readStoredPlayerDocument(playerSnapshot.data()).profileComplete) {
    throw new HttpsError("failed-precondition", "Create your GrowGo player profile first.");
  }

  const ref = getAdminAccountRef(authContext.uid);
  const existing = readAdminAccount((await ref.get()).data());
  if (!existing || existing.role !== "owner") {
    await ref.set(buildAdminAccountDocument({
      uid: authContext.uid,
      role: "owner",
      assignedByUid: null
    }));
    await recordAdminAuditEvent({
      actorUid: authContext.uid,
      action: "admin_owner_bootstrapped",
      targetUid: authContext.uid,
      role: "owner"
    });
  }

  return { ok: true, role: "owner" as const };
}

export async function getAdminControlCenterSnapshotHandler(request: CallableRequest<unknown>) {
  const { account } = await requireSecuredAdminRequest(request);
  const db = getAdminFirestore();
  const now = new Date();
  const todayStart = getUtcDayStart(now);
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayKey = getUtcDayKey(yesterdayStart);
  const players = db.collection("players");

  // These are aggregate queries, made only when an authorised staff member
  // opens Mission Control. They do not create player heartbeats or alter
  // normal gameplay traffic.
  const [
    playerCountSnapshot,
    activeTodaySnapshot,
    activeYesterdaySnapshot,
    newTodaySnapshot,
    newYesterdaySnapshot,
    openSupportCasesSnapshot,
    dailyOperationsSnapshot,
    officialEvents
  ] = await Promise.all([
    players.count().get(),
    players.where("lastLoginAt", ">=", Timestamp.fromDate(todayStart)).count().get(),
    players
      .where("lastLoginAt", ">=", Timestamp.fromDate(yesterdayStart))
      .where("lastLoginAt", "<", Timestamp.fromDate(todayStart))
      .count()
      .get(),
    players.where("createdAt", ">=", Timestamp.fromDate(todayStart)).count().get(),
    players
      .where("createdAt", ">=", Timestamp.fromDate(yesterdayStart))
      .where("createdAt", "<", Timestamp.fromDate(todayStart))
      .count()
      .get(),
    db.collection("supportCases").where("active", "==", true).count().get(),
    dailyOperationsReportRef(db, yesterdayKey).get(),
    readOfficialEventSchedule(db, now)
  ]);

  const playerCount = playerCountSnapshot.data().count;
  const activePlayers = activeTodaySnapshot.data().count;
  const activePlayersYesterday = activeYesterdaySnapshot.data().count;
  const newAccounts = newTodaySnapshot.data().count;
  const newAccountsYesterday = newYesterdaySnapshot.data().count;
  const openReports = openSupportCasesSnapshot.data().count;
  const billingConfiguration = readDailyOperationsBillingConfiguration();
  const dailyOperations = readDailyOperationsReport(dailyOperationsSnapshot.data()) ??
    createAwaitingDailyOperationsReport({
      utcDay: yesterdayKey,
      now,
      firebaseConfigured: Boolean(billingConfiguration.firebaseBillingExportTable),
      vercelConfigured: Boolean(
        billingConfiguration.vercelBillingToken && billingConfiguration.vercelTeamId
      )
    });

  return {
    ok: true,
    role: account.role,
    capabilities: {
      manageStaff: account.role === "owner",
      manageOfficialEvents: account.role === "owner",
      questTesting: account.role === "owner",
      playerTools: account.role === "owner" || account.role === "admin",
      moderationQueue: true,
      worldTools: account.role === "owner" || account.role === "admin"
    },
    summary: {
      playerCount,
      activePlayers,
      activePlayersYesterday,
      newAccounts,
      newAccountsYesterday,
      moderationReports: "configured",
      openReports,
      worldTools: "read-only-foundation"
    },
    operations: {
      gameBackend: "connected",
      checkedAt: now.toISOString(),
      officialEventSettings: officialEvents,
      officialEvents: listOfficialEventOccurrences({ events: officialEvents, now, days: 30 }),
      dailyReport: account.role === "owner"
        ? dailyOperations
        : { status: "restricted" }
    },
    finance: account.role === "owner"
      ? {
        status: "daily-report",
        reportDay: dailyOperations.utcDay,
        reportingCurrency: "provider-native"
      }
      : { status: "restricted" },
    questTesting: account.role === "owner"
      ? { quests: resettableMainQuests }
      : { quests: [] },
    refreshedAt: new Date().toISOString()
  };
}

export async function listAdminAccountsHandler(request: CallableRequest<unknown>) {
  await requireSecuredAdminRequest(request, ["owner"]);
  const db = getAdminFirestore();
  const accountSnapshots = await db.collection("adminAccounts").limit(MAX_STAFF_ENTRIES).get();
  const accounts = accountSnapshots.docs
    .map((snapshot) => readAdminAccount(snapshot.data()))
    .filter((account): account is NonNullable<typeof account> => account !== null)
    .sort((left, right) => adminRoles.indexOf(left.role) - adminRoles.indexOf(right.role));
  const playerSnapshots = accounts.length > 0
    ? await db.getAll(...accounts.map((account) => getPlayerDocumentRef(account.uid)))
    : [];
  const playersByUid = new Map(playerSnapshots.map((snapshot) => {
    const player = snapshot.exists ? readStoredPlayerDocument(snapshot.data()) : null;
    return [snapshot.id, player] as const;
  }));

  return {
    ok: true,
    accounts: accounts.map((account) => {
      const player = playersByUid.get(account.uid);
      return {
        uid: account.uid,
        role: account.role,
        displayName: player?.displayName ?? "Unknown player",
        publicCode: player?.publicCode ?? null,
        assignedAt: account.assignedAt.toISOString()
      };
    })
  };
}

export async function assignAdminAccountRoleHandler(request: CallableRequest<unknown>) {
  const { authContext } = await requireSecuredAdminRequest(
    request,
    ["owner"],
    ["deviceId", "publicCode", "role"]
  );
  const payload = asObject(request.data, "assignAdminAccountRole payload");
  assertAllowedKeys(payload, ["deviceId", "publicCode", "role"], "assignAdminAccountRole payload");
  const publicCode = normalizePlayerPublicCode(payload.publicCode);
  if (!publicCode) {
    throw new HttpsError("invalid-argument", "Enter a valid GrowGo player code.");
  }
  if (!isAdminRole(payload.role) || payload.role === "owner") {
    throw new HttpsError("invalid-argument", "Choose Admin access.");
  }

  const codeSnapshot = await getPlayerPublicCodeRef(publicCode).get();
  const targetUid = typeof codeSnapshot.data()?.uid === "string" ? codeSnapshot.data()?.uid : "";
  if (!targetUid) {
    throw new HttpsError("not-found", "That player code could not be found.");
  }

  const targetPlayerSnapshot = await getPlayerDocumentRef(targetUid).get();
  if (!targetPlayerSnapshot.exists) {
    throw new HttpsError("not-found", "That player profile could not be found.");
  }
  const targetPlayer = readStoredPlayerDocument(targetPlayerSnapshot.data());
  if (!targetPlayer.profileComplete) {
    throw new HttpsError("failed-precondition", "That player has not completed their profile.");
  }

  await getAdminAccountRef(targetUid).set(buildAdminAccountDocument({
    uid: targetUid,
    role: payload.role,
    assignedByUid: authContext.uid
  }));
  await recordAdminAuditEvent({
    actorUid: authContext.uid,
    action: "admin_role_assigned",
    targetUid,
    role: payload.role
  });

  return {
    ok: true,
    account: {
      uid: targetUid,
      role: payload.role,
      displayName: targetPlayer.displayName,
      publicCode: targetPlayer.publicCode
    }
  };
}

export function readConfiguredOwnerEmails(env: Readonly<Record<string, string | undefined>> = process.env) {
  const raw = env[ADMIN_OWNER_EMAILS_VARIABLE_NAME];
  if (typeof raw !== "string" || raw.trim().length === 0) return [];
  return raw
    .split(",")
    .map((value) => normalizeEmail(value))
    .filter((value): value is string => Boolean(value));
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function getUtcDayStart(now: Date): Date {
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0,
    0,
    0,
    0
  ));
}

function getUtcDayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export const bootstrapAdminOwner = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  bootstrapAdminOwnerHandler
);

export const getAdminControlCenterSnapshot = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  getAdminControlCenterSnapshotHandler
);

export const listAdminAccounts = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  listAdminAccountsHandler
);

export const assignAdminAccountRole = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  assignAdminAccountRoleHandler
);
