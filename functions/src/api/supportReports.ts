import { createHash } from "node:crypto";

import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type DocumentReference
} from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import { requireAdminAccount } from "../domain/admin/adminAccounts";
import { requireActiveDeviceSessionIfEnabled } from "../domain/players/activeDeviceSession";
import { getPlayerDocumentRef, readStoredPlayerDocument } from "../domain/players/playerStore";
import { avatarNameKey } from "./completePlayerProfile";
import { getAdminFirestore } from "../firebaseAdmin";
import { requireDevelopmentBackendCapabilityAccess } from "../security/developmentBackendCapabilityGuard";
import { requireAppCheckIfEnabled, requireAuthenticated } from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import { asObject, assertAllowedKeys, requireString } from "../validation/requestValidation";

const SUPPORT_CASES_COLLECTION = "supportCases" as const;
const SUPPORT_CASE_KEYS_COLLECTION = "supportCaseKeys" as const;
const PLAYER_MODERATION_COLLECTION = "playerModeration" as const;
const SUPPORT_CASE_SCHEMA_VERSION = 1 as const;
const MAX_CASE_LIST_SIZE = 75;
const MAX_HISTORY_SIZE = 100;

export const supportTargetTypes = [
  "player",
  "profile-picture",
  "pin-or-poi",
  "event",
  "market-listing",
  "bug"
] as const;

export const supportTopics = [
  "inappropriate-name",
  "inappropriate-profile-picture",
  "cheating-or-spoofing",
  "unsafe-or-incorrect-map-content",
  "harassment-or-scam",
  "other",
  "bug"
] as const;

export const supportCaseStatuses = [
  "open",
  "reviewing",
  "resolved",
  "dismissed",
  "fix-in-progress",
  "fixed"
] as const;

type SupportTargetType = (typeof supportTargetTypes)[number];
type SupportTopic = (typeof supportTopics)[number];
type SupportCaseStatus = (typeof supportCaseStatuses)[number];

interface StoredSupportCase {
  id: string;
  type: SupportTargetType;
  topic: SupportTopic;
  kind: "report" | "bug";
  status: SupportCaseStatus;
  active: boolean;
  targetLabel: string;
  targetReference: string | null;
  targetPlayerUid: string | null;
  reporterUids: string[];
  reporterCount: number;
  assignedAdminUid: string | null;
  assignedAdminName: string | null;
  createdAt: Date;
  updatedAt: Date;
  profilePicture: {
    suppressedAvatarUrl: string | null;
  } | null;
}

function requireDeviceId(payload: Record<string, unknown>): string | undefined {
  return typeof payload.deviceId === "string" ? payload.deviceId : undefined;
}

async function requireSecuredPlayerRequest(request: CallableRequest<unknown>, allowedKeys: readonly string[]) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });
  const payload = asObject(request.data, "Support request");
  assertAllowedKeys(payload, allowedKeys, "Support request");
  await requireActiveDeviceSessionIfEnabled({ uid: authContext.uid, deviceId: requireDeviceId(payload) });
  const playerSnapshot = await getPlayerDocumentRef(authContext.uid).get();
  if (!playerSnapshot.exists || !readStoredPlayerDocument(playerSnapshot.data()).profileComplete) {
    throw new HttpsError("failed-precondition", "Create your GrowGo profile before sending a report.");
  }
  return { authContext, payload };
}

async function requireSecuredAdminRequest(request: CallableRequest<unknown>, allowedKeys: readonly string[]) {
  const { authContext, payload } = await requireSecuredPlayerRequest(request, allowedKeys);
  const account = await requireAdminAccount(authContext.uid);
  const playerSnapshot = await getPlayerDocumentRef(authContext.uid).get();
  const player = playerSnapshot.exists ? readStoredPlayerDocument(playerSnapshot.data()) : null;
  return { authContext, payload, account, actorName: player?.displayName ?? "GrowGo Admin" };
}

export async function submitSupportReportHandler(request: CallableRequest<unknown>) {
  const { authContext, payload } = await requireSecuredPlayerRequest(request, [
    "deviceId",
    "type",
    "topic",
    "targetName",
    "targetReference",
    "note",
    "appVersion",
    "deviceLabel"
  ]);

  const type = requireSupportTargetType(payload.type);
  const topic = requireSupportTopic(payload.topic);
  assertTopicAllowedForType(type, topic);
  const note = optionalText(payload.note, "note", 500) ?? "";
  const suppliedTargetName = optionalText(payload.targetName, "targetName", 160) ?? "";
  const suppliedTargetReference = optionalText(payload.targetReference, "targetReference", 200) ?? "";

  const target = await resolveTarget({
    type,
    suppliedTargetName,
    suppliedTargetReference,
    reporterUid: authContext.uid
  });
  const key = createDedupeKey(type, topic, target.key);
  const db = getAdminFirestore();
  const keyRef = db.collection(SUPPORT_CASE_KEYS_COLLECTION).doc(hashKey(key));
  const now = Timestamp.now();

  const result = await db.runTransaction(async (transaction) => {
    const activeKeySnapshot = await transaction.get(keyRef);
    const activeCaseId = typeof activeKeySnapshot.data()?.caseId === "string"
      ? activeKeySnapshot.data()?.caseId
      : null;
    const activeCaseRef = activeCaseId ? db.collection(SUPPORT_CASES_COLLECTION).doc(activeCaseId) : null;
    const activeCaseSnapshot = activeCaseRef ? await transaction.get(activeCaseRef) : null;
    const existing = activeCaseSnapshot?.exists ? readStoredSupportCase(activeCaseSnapshot) : null;

    if (existing?.active) {
      if (existing.reporterUids.includes(authContext.uid)) {
        throw new HttpsError("failed-precondition", "You already reported this while the case is still open.");
      }
      const nextReporterUids = [...existing.reporterUids, authContext.uid];
      transaction.update(activeCaseRef!, {
        reporterUids: nextReporterUids,
        reporterCount: nextReporterUids.length,
        updatedAt: now
      });
      const submissionRef = activeCaseRef!.collection("submissions").doc(authContext.uid);
      transaction.set(submissionRef, buildSubmissionDocument({ authContext, note, payload, now }));
      transaction.set(activeCaseRef!.collection("history").doc(), buildHistoryDocument({
        actorUid: authContext.uid,
        actorName: "Player report",
        action: "additional-report-received",
        detail: "Another player reported the same target and topic.",
        now
      }));
      return { caseId: existing.id, merged: true, reporterCount: nextReporterUids.length };
    }

    const caseRef = db.collection(SUPPORT_CASES_COLLECTION).doc();
    const profilePicture = await suppressReportedProfilePictureIfNeeded({
      transaction,
      type,
      targetPlayerUid: target.playerUid,
      caseId: caseRef.id,
      now
    });
    transaction.set(caseRef, {
      schemaVersion: SUPPORT_CASE_SCHEMA_VERSION,
      type,
      topic,
      kind: type === "bug" ? "bug" : "report",
      status: "open" as SupportCaseStatus,
      active: true,
      dedupeKey: key,
      targetLabel: target.label,
      targetReference: target.reference,
      targetPlayerUid: target.playerUid,
      reporterUids: [authContext.uid],
      reporterCount: 1,
      assignedAdminUid: null,
      assignedAdminName: null,
      profilePicture,
      createdAt: now,
      updatedAt: now
    });
    transaction.set(keyRef, { caseId: caseRef.id, updatedAt: now });
    transaction.set(caseRef.collection("submissions").doc(authContext.uid), buildSubmissionDocument({ authContext, note, payload, now }));
    transaction.set(caseRef.collection("history").doc(), buildHistoryDocument({
      actorUid: authContext.uid,
      actorName: "Player report",
      action: type === "bug" ? "bug-received" : "report-received",
      detail: type === "bug" ? "A player sent a bug report." : "A player sent a report.",
      now
    }));
    return { caseId: caseRef.id, merged: false, reporterCount: 1 };
  });

  return { ok: true, received: true, ...result };
}

export async function listAdminSupportCasesHandler(request: CallableRequest<unknown>) {
  await requireSecuredAdminRequest(request, ["deviceId"]);
  const snapshot = await getAdminFirestore()
    .collection(SUPPORT_CASES_COLLECTION)
    .orderBy("updatedAt", "desc")
    .limit(MAX_CASE_LIST_SIZE)
    .get();
  const cases = snapshot.docs
    .map(readStoredSupportCase)
    .filter((item): item is StoredSupportCase => item !== null)
    .map(serializeSupportCaseSummary);
  return { ok: true, cases };
}

export async function getAdminSupportCaseHandler(request: CallableRequest<unknown>) {
  await requireSecuredAdminRequest(request, ["deviceId", "caseId"]);
  const payload = asObject(request.data, "Support request");
  const caseId = requireCaseId(payload.caseId);
  const caseRef = getAdminFirestore().collection(SUPPORT_CASES_COLLECTION).doc(caseId);
  const [caseSnapshot, historySnapshot, submissionSnapshot] = await Promise.all([
    caseRef.get(),
    caseRef.collection("history").orderBy("createdAt", "asc").limit(MAX_HISTORY_SIZE).get(),
    caseRef.collection("submissions").orderBy("createdAt", "asc").limit(MAX_HISTORY_SIZE).get()
  ]);
  const supportCase = caseSnapshot.exists ? readStoredSupportCase(caseSnapshot) : null;
  if (!supportCase) throw new HttpsError("not-found", "That support case could not be found.");
  const submissionEntries = submissionSnapshot.docs.map((entry) => ({
    reporterUid: typeof entry.data().reporterUid === "string" ? entry.data().reporterUid : entry.id,
    note: typeof entry.data().note === "string" ? entry.data().note : null,
    appVersion: typeof entry.data().appVersion === "string" ? entry.data().appVersion : null,
    deviceLabel: typeof entry.data().deviceLabel === "string" ? entry.data().deviceLabel : null,
    createdAt: readDate(entry.data().createdAt)?.toISOString() ?? null
  }));
  const reporterSnapshots = submissionEntries.length
    ? await getAdminFirestore().getAll(...submissionEntries.map((entry) => getPlayerDocumentRef(entry.reporterUid)))
    : [];
  const reporterNames = new Map(reporterSnapshots.map((snapshot) => {
    const player = snapshot.exists ? readStoredPlayerDocument(snapshot.data()) : null;
    return [snapshot.id, player?.displayName ?? "Unknown player"] as const;
  }));
  return {
    ok: true,
    supportCase: serializeSupportCaseDetail(supportCase),
    history: historySnapshot.docs.map((entry) => serializeHistoryEntry(entry)),
    submissions: submissionEntries.map((entry) => ({
      ...entry,
      reporterName: reporterNames.get(entry.reporterUid) ?? "Unknown player"
    }))
  };
}

export async function takeAdminSupportCaseHandler(request: CallableRequest<unknown>) {
  const { authContext, actorName } = await requireSecuredAdminRequest(request, ["deviceId", "caseId"]);
  const payload = asObject(request.data, "Support request");
  const caseRef = getAdminFirestore().collection(SUPPORT_CASES_COLLECTION).doc(requireCaseId(payload.caseId));
  const now = Timestamp.now();
  await getAdminFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(caseRef);
    const supportCase = snapshot.exists ? readStoredSupportCase(snapshot) : null;
    if (!supportCase) throw new HttpsError("not-found", "That support case could not be found.");
    if (!supportCase.active) throw new HttpsError("failed-precondition", "This support case is already closed.");
    transaction.update(caseRef, {
      status: supportCase.kind === "bug" ? "fix-in-progress" : "reviewing",
      assignedAdminUid: authContext.uid,
      assignedAdminName: actorName,
      updatedAt: now
    });
    transaction.set(caseRef.collection("history").doc(), buildHistoryDocument({
      actorUid: authContext.uid,
      actorName,
      action: "case-taken",
      detail: "This case was taken for review.",
      now
    }));
  });
  return { ok: true };
}

export async function addAdminSupportCaseNoteHandler(request: CallableRequest<unknown>) {
  const { authContext, actorName } = await requireSecuredAdminRequest(request, ["deviceId", "caseId", "note"]);
  const payload = asObject(request.data, "Support request");
  const caseRef = getAdminFirestore().collection(SUPPORT_CASES_COLLECTION).doc(requireCaseId(payload.caseId));
  const note = requireString(payload.note, "note", 1, 1_000);
  const now = Timestamp.now();
  await caseRef.firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(caseRef);
    if (!snapshot.exists || !readStoredSupportCase(snapshot)) {
      throw new HttpsError("not-found", "That support case could not be found.");
    }
    transaction.update(caseRef, { updatedAt: now });
    transaction.set(caseRef.collection("history").doc(), buildHistoryDocument({
      actorUid: authContext.uid,
      actorName,
      action: "admin-note",
      detail: note,
      now
    }));
  });
  return { ok: true };
}

export async function editAdminSupportCaseNoteHandler(request: CallableRequest<unknown>) {
  const { authContext, actorName } = await requireSecuredAdminRequest(request, ["deviceId", "caseId", "historyId", "note"]);
  const payload = asObject(request.data, "Support request");
  const caseRef = getAdminFirestore().collection(SUPPORT_CASES_COLLECTION).doc(requireCaseId(payload.caseId));
  const historyId = requireHistoryId(payload.historyId);
  const note = requireString(payload.note, "note", 1, 1_000);
  const historyRef = caseRef.collection("history").doc(historyId);
  const now = Timestamp.now();
  await caseRef.firestore.runTransaction(async (transaction) => {
    const [caseSnapshot, historySnapshot] = await Promise.all([transaction.get(caseRef), transaction.get(historyRef)]);
    if (!caseSnapshot.exists || !readStoredSupportCase(caseSnapshot)) throw new HttpsError("not-found", "That support case could not be found.");
    if (!historySnapshot.exists || historySnapshot.data()?.action !== "admin-note") throw new HttpsError("failed-precondition", "Only an admin note can be edited.");
    const priorNote = typeof historySnapshot.data()?.detail === "string" ? historySnapshot.data()?.detail : "";
    transaction.update(historyRef, {
      detail: note,
      editedAt: now,
      editedByUid: authContext.uid,
      editedByName: actorName,
      revision: Number(historySnapshot.data()?.revision || 1) + 1
    });
    transaction.update(caseRef, { updatedAt: now });
    transaction.set(caseRef.collection("history").doc(), buildHistoryDocument({
      actorUid: authContext.uid,
      actorName,
      action: "admin-note-revised",
      detail: `Revised note ${historyId}. Previous text: ${priorNote}`,
      now
    }));
  });
  return { ok: true };
}

export async function updateAdminSupportCaseStatusHandler(request: CallableRequest<unknown>) {
  const { authContext, actorName } = await requireSecuredAdminRequest(request, ["deviceId", "caseId", "status", "reason"]);
  const payload = asObject(request.data, "Support request");
  const nextStatus = requireSupportCaseStatus(payload.status);
  const reason = optionalText(payload.reason, "reason", 1_000) ?? "";
  if (["resolved", "dismissed", "fixed"].includes(nextStatus) && reason.length < 3) {
    throw new HttpsError("invalid-argument", "Add an internal reason before closing this case.");
  }

  const db = getAdminFirestore();
  const caseRef = db.collection(SUPPORT_CASES_COLLECTION).doc(requireCaseId(payload.caseId));
  const now = Timestamp.now();
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(caseRef);
    const supportCase = snapshot.exists ? readStoredSupportCase(snapshot) : null;
    if (!supportCase) throw new HttpsError("not-found", "That support case could not be found.");
    const active = !["resolved", "dismissed", "fixed"].includes(nextStatus);
    if (supportCase.kind === "bug" && ["reviewing", "resolved"].includes(nextStatus)) {
      throw new HttpsError("invalid-argument", "Use bug statuses for a bug report.");
    }
    if (supportCase.kind === "report" && ["fix-in-progress", "fixed"].includes(nextStatus)) {
      throw new HttpsError("invalid-argument", "Use report statuses for a player report.");
    }

    const dismissalRestore = await readDismissedProfilePictureRestore({
      transaction,
      supportCase,
      status: nextStatus
    });

    transaction.update(caseRef, {
      status: nextStatus,
      active,
      updatedAt: now
    });
    transaction.set(caseRef.collection("history").doc(), buildHistoryDocument({
      actorUid: authContext.uid,
      actorName,
      action: `status-${nextStatus}`,
      detail: reason || `Case status changed to ${formatStatus(nextStatus)}.`,
      now
    }));

    if (!active) {
      transaction.delete(db.collection(SUPPORT_CASE_KEYS_COLLECTION).doc(hashKey(createDedupeKey(supportCase.type, supportCase.topic, caseTargetKey(supportCase)))));
      if (dismissalRestore) {
        transaction.update(dismissalRestore.playerRef, {
          avatarUrl: dismissalRestore.avatarUrl,
          profilePictureModeration: FieldValue.delete(),
          updatedAt: now
        });
      }
    }
  });
  return { ok: true };
}

export async function flagSupportReportSubmissionAbuseHandler(request: CallableRequest<unknown>) {
  const { authContext, actorName } = await requireSecuredAdminRequest(request, ["deviceId", "caseId", "reporterUid", "reason"]);
  const payload = asObject(request.data, "Support request");
  const caseId = requireCaseId(payload.caseId);
  const reporterUid = requireString(payload.reporterUid, "reporterUid", 8, 128);
  const reason = requireString(payload.reason, "reason", 3, 1_000);
  const db = getAdminFirestore();
  const caseRef = db.collection(SUPPORT_CASES_COLLECTION).doc(caseId);
  const submissionRef = caseRef.collection("submissions").doc(reporterUid);
  const moderationRef = db.collection(PLAYER_MODERATION_COLLECTION).doc(reporterUid);
  const now = Timestamp.now();
  await db.runTransaction(async (transaction) => {
    const [caseSnapshot, submissionSnapshot, moderationSnapshot] = await Promise.all([
      transaction.get(caseRef),
      transaction.get(submissionRef),
      transaction.get(moderationRef)
    ]);
    if (!caseSnapshot.exists || !readStoredSupportCase(caseSnapshot)) throw new HttpsError("not-found", "That support case could not be found.");
    if (!submissionSnapshot.exists) throw new HttpsError("not-found", "That report submission could not be found.");
    const priorCount = Number(moderationSnapshot.data()?.abusiveReportCount || 0);
    transaction.set(moderationRef, {
      schemaVersion: 1,
      uid: reporterUid,
      abusiveReportCount: Math.max(0, priorCount) + 1,
      updatedAt: now
    }, { merge: true });
    transaction.set(moderationRef.collection("history").doc(), {
      caseId,
      actorUid: authContext.uid,
      actorName,
      reason,
      createdAt: now
    });
    transaction.update(caseRef, { updatedAt: now });
    transaction.set(caseRef.collection("history").doc(), buildHistoryDocument({
      actorUid: authContext.uid,
      actorName,
      action: "reporter-abuse-flagged",
      detail: `A report submission was marked abusive. Reason: ${reason}`,
      now
    }));
  });
  return { ok: true };
}

async function resolveTarget(params: {
  type: SupportTargetType;
  suppliedTargetName: string;
  suppliedTargetReference: string;
  reporterUid: string;
}): Promise<{ key: string; label: string; reference: string | null; playerUid: string | null }> {
  if (params.type === "bug") {
    return { key: "growgo-client", label: "GrowGo game", reference: null, playerUid: null };
  }
  if (params.type === "player" || params.type === "profile-picture") {
    if (!params.suppliedTargetName) throw new HttpsError("invalid-argument", "Enter the player name you want to report.");
    const nameKey = avatarNameKey(params.suppliedTargetName);
    const nameSnapshot = await getAdminFirestore().collection("playerNames").doc(nameKey).get();
    const playerUid = typeof nameSnapshot.data()?.uid === "string" ? nameSnapshot.data()?.uid : "";
    if (!playerUid) throw new HttpsError("not-found", "That GrowGo player name could not be found.");
    if (playerUid === params.reporterUid) throw new HttpsError("invalid-argument", "You cannot report your own player profile.");
    const playerSnapshot = await getPlayerDocumentRef(playerUid).get();
    const player = playerSnapshot.exists ? readStoredPlayerDocument(playerSnapshot.data()) : null;
    if (!player?.profileComplete || !player.displayName) throw new HttpsError("not-found", "That GrowGo player name could not be found.");
    return { key: playerUid, label: player.displayName, reference: player.publicCode, playerUid };
  }
  const label = params.suppliedTargetName;
  if (!label) throw new HttpsError("invalid-argument", "Name or describe the item you want to report.");
  return {
    key: params.suppliedTargetReference || label.toLocaleLowerCase("en-US"),
    label,
    reference: params.suppliedTargetReference || null,
    playerUid: null
  };
}

async function suppressReportedProfilePictureIfNeeded(params: {
  transaction: FirebaseFirestore.Transaction;
  type: SupportTargetType;
  targetPlayerUid: string | null;
  caseId: string;
  now: Timestamp;
}): Promise<{ suppressedAvatarUrl: string | null } | null> {
  if (params.type !== "profile-picture" || !params.targetPlayerUid) return null;
  const playerRef = getPlayerDocumentRef(params.targetPlayerUid);
  const playerSnapshot = await params.transaction.get(playerRef);
  if (!playerSnapshot.exists) return { suppressedAvatarUrl: null };
  const player = readStoredPlayerDocument(playerSnapshot.data());
  const suppressedAvatarUrl = player.avatarUrl;
  if (suppressedAvatarUrl) {
    params.transaction.update(playerRef, {
      avatarUrl: null,
      profilePictureModeration: {
        activeCaseId: params.caseId,
        suppressedAvatarUrl,
        suppressedAt: params.now
      },
      updatedAt: params.now
    });
  }
  return { suppressedAvatarUrl };
}

async function readDismissedProfilePictureRestore(params: {
  transaction: FirebaseFirestore.Transaction;
  supportCase: StoredSupportCase;
  status: SupportCaseStatus;
}): Promise<{ playerRef: DocumentReference<DocumentData>; avatarUrl: string } | null> {
  if (params.status !== "dismissed" || params.supportCase.type !== "profile-picture" || !params.supportCase.targetPlayerUid) return null;
  const originalAvatarUrl = params.supportCase.profilePicture?.suppressedAvatarUrl;
  if (!originalAvatarUrl) return null;
  const playerRef = getPlayerDocumentRef(params.supportCase.targetPlayerUid);
  const playerSnapshot = await params.transaction.get(playerRef);
  const moderation = playerSnapshot.data()?.profilePictureModeration;
  if (
    playerSnapshot.exists &&
    playerSnapshot.data()?.avatarUrl === null &&
    moderation?.activeCaseId === params.supportCase.id
  ) {
    return { playerRef, avatarUrl: originalAvatarUrl };
  }
  return null;
}

function buildSubmissionDocument(params: {
  authContext: { uid: string };
  note: string;
  payload: Record<string, unknown>;
  now: Timestamp;
}) {
  return {
    reporterUid: params.authContext.uid,
    note: params.note || null,
    appVersion: optionalText(params.payload.appVersion, "appVersion", 80) ?? null,
    deviceLabel: optionalText(params.payload.deviceLabel, "deviceLabel", 240) ?? null,
    createdAt: params.now
  };
}

function buildHistoryDocument(params: {
  actorUid: string;
  actorName: string;
  action: string;
  detail: string;
  now: Timestamp;
}) {
  return {
    actorUid: params.actorUid,
    actorName: params.actorName,
    action: params.action,
    detail: params.detail,
    revision: 1,
    createdAt: params.now
  };
}

function readStoredSupportCase(snapshot: FirebaseFirestore.DocumentSnapshot<DocumentData>): StoredSupportCase | null {
  const data = snapshot.data();
  if (!data || data.schemaVersion !== SUPPORT_CASE_SCHEMA_VERSION) return null;
  if (!isSupportTargetType(data.type) || !isSupportTopic(data.topic) || !isSupportCaseStatus(data.status)) return null;
  const createdAt = readDate(data.createdAt);
  const updatedAt = readDate(data.updatedAt);
  if (!createdAt || !updatedAt || typeof data.targetLabel !== "string") return null;
  const reporterUids = Array.isArray(data.reporterUids)
    ? data.reporterUids.filter((value): value is string => typeof value === "string")
    : [];
  return {
    id: snapshot.id,
    type: data.type,
    topic: data.topic,
    kind: data.kind === "bug" ? "bug" : "report",
    status: data.status,
    active: data.active === true,
    targetLabel: data.targetLabel,
    targetReference: typeof data.targetReference === "string" ? data.targetReference : null,
    targetPlayerUid: typeof data.targetPlayerUid === "string" ? data.targetPlayerUid : null,
    reporterUids,
    reporterCount: Math.max(1, Number.isSafeInteger(data.reporterCount) ? data.reporterCount : reporterUids.length),
    assignedAdminUid: typeof data.assignedAdminUid === "string" ? data.assignedAdminUid : null,
    assignedAdminName: typeof data.assignedAdminName === "string" ? data.assignedAdminName : null,
    createdAt,
    updatedAt,
    profilePicture: data.profilePicture && typeof data.profilePicture === "object"
      ? { suppressedAvatarUrl: typeof data.profilePicture.suppressedAvatarUrl === "string" ? data.profilePicture.suppressedAvatarUrl : null }
      : null
  };
}

function serializeSupportCaseSummary(supportCase: StoredSupportCase) {
  return {
    id: supportCase.id,
    type: supportCase.type,
    topic: supportCase.topic,
    kind: supportCase.kind,
    status: supportCase.status,
    active: supportCase.active,
    targetLabel: supportCase.targetLabel,
    reporterCount: supportCase.reporterCount,
    assignedAdminName: supportCase.assignedAdminName,
    createdAt: supportCase.createdAt.toISOString(),
    updatedAt: supportCase.updatedAt.toISOString()
  };
}

function serializeSupportCaseDetail(supportCase: StoredSupportCase) {
  return {
    ...serializeSupportCaseSummary(supportCase),
    targetReference: supportCase.targetReference,
    targetPlayerUid: supportCase.targetPlayerUid,
    profilePicture: supportCase.profilePicture
  };
}

function serializeHistoryEntry(snapshot: FirebaseFirestore.QueryDocumentSnapshot<DocumentData>) {
  const data = snapshot.data();
  const createdAt = readDate(data.createdAt);
  return {
    id: snapshot.id,
    action: typeof data.action === "string" ? data.action : "activity",
    detail: typeof data.detail === "string" ? data.detail : "",
    actorName: typeof data.actorName === "string" ? data.actorName : "GrowGo Admin",
    createdAt: createdAt?.toISOString() ?? null,
    revision: Number.isSafeInteger(data.revision) ? data.revision : 1,
    editedAt: readDate(data.editedAt)?.toISOString() ?? null,
    editedByName: typeof data.editedByName === "string" ? data.editedByName : null
  };
}

function createDedupeKey(type: SupportTargetType, topic: SupportTopic, targetKey: string): string {
  return `${type}:${topic}:${targetKey.trim().toLocaleLowerCase("en-US")}`;
}

function caseTargetKey(supportCase: StoredSupportCase): string {
  return supportCase.targetPlayerUid || supportCase.targetReference || supportCase.targetLabel;
}

function hashKey(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function optionalText(value: unknown, label: string, maxLength: number): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requireString(value, label, 1, maxLength);
}

function requireCaseId(value: unknown): string {
  return requireString(value, "caseId", 8, 128);
}

function requireHistoryId(value: unknown): string {
  return requireString(value, "historyId", 8, 128);
}

function requireSupportTargetType(value: unknown): SupportTargetType {
  if (!isSupportTargetType(value)) throw new HttpsError("invalid-argument", "Choose a report type.");
  return value;
}

function requireSupportTopic(value: unknown): SupportTopic {
  if (!isSupportTopic(value)) throw new HttpsError("invalid-argument", "Choose a report topic.");
  return value;
}

function requireSupportCaseStatus(value: unknown): SupportCaseStatus {
  if (!isSupportCaseStatus(value)) throw new HttpsError("invalid-argument", "Choose a valid case status.");
  return value;
}

function isSupportTargetType(value: unknown): value is SupportTargetType {
  return typeof value === "string" && supportTargetTypes.includes(value as SupportTargetType);
}

function isSupportTopic(value: unknown): value is SupportTopic {
  return typeof value === "string" && supportTopics.includes(value as SupportTopic);
}

function isSupportCaseStatus(value: unknown): value is SupportCaseStatus {
  return typeof value === "string" && supportCaseStatuses.includes(value as SupportCaseStatus);
}

function assertTopicAllowedForType(type: SupportTargetType, topic: SupportTopic) {
  const allowed: Record<SupportTargetType, readonly SupportTopic[]> = {
    player: ["inappropriate-name", "cheating-or-spoofing", "harassment-or-scam", "other"],
    "profile-picture": ["inappropriate-profile-picture", "other"],
    "pin-or-poi": ["unsafe-or-incorrect-map-content", "other"],
    event: ["unsafe-or-incorrect-map-content", "harassment-or-scam", "other"],
    "market-listing": ["harassment-or-scam", "other"],
    bug: ["bug"]
  };
  if (!allowed[type].includes(topic)) {
    throw new HttpsError("invalid-argument", "That topic is not available for this report type.");
  }
}

function readDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  return null;
}

function formatStatus(value: SupportCaseStatus): string {
  return value.replaceAll("-", " ");
}

export const submitSupportReport = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  submitSupportReportHandler
);
export const listAdminSupportCases = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  listAdminSupportCasesHandler
);
export const getAdminSupportCase = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  getAdminSupportCaseHandler
);
export const takeAdminSupportCase = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  takeAdminSupportCaseHandler
);
export const addAdminSupportCaseNote = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  addAdminSupportCaseNoteHandler
);
export const editAdminSupportCaseNote = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  editAdminSupportCaseNoteHandler
);
export const updateAdminSupportCaseStatus = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  updateAdminSupportCaseStatusHandler
);
export const flagSupportReportSubmissionAbuse = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  flagSupportReportSubmissionAbuseHandler
);
