import {
  HttpsError,
  onCall,
  type CallableRequest
} from "firebase-functions/v2/https";

import { runtimeConfig } from "../config/runtimeConfig";
import { recordAdminAuditEvent } from "../domain/admin/adminAuditLog";
import { requireAdminAccount } from "../domain/admin/adminAccounts";
import {
  buildOfficialEventSettingsDocument,
  clearOfficialEventScheduleCache,
  getOfficialEventById,
  getOfficialEventSettingsRef,
  isOfficialEventId,
  listOfficialEventOccurrences,
  readOfficialEventSchedule,
  type OfficialEventSettings
} from "../domain/events/officialEvents";
import { requireActiveDeviceSessionIfEnabled } from "../domain/players/activeDeviceSession";
import { getPlayerDocumentRef, readStoredPlayerDocument } from "../domain/players/playerStore";
import { getAdminFirestore } from "../firebaseAdmin";
import { requireDevelopmentBackendCapabilityAccess } from "../security/developmentBackendCapabilityGuard";
import { requireAppCheckIfEnabled, requireAuthenticated } from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import { asObject, assertAllowedKeys } from "../validation/requestValidation";

const CALENDAR_DAYS = 30;

function readDeviceId(request: CallableRequest<unknown>, label: string): string | undefined {
  const payload = asObject(request.data, label);
  assertAllowedKeys(payload, ["deviceId"], label);
  return typeof payload.deviceId === "string" ? payload.deviceId : undefined;
}

async function requireCalendarPlayer(request: CallableRequest<unknown>) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });
  const deviceId = readDeviceId(request, "getOfficialEventCalendar payload");
  await requireActiveDeviceSessionIfEnabled({ uid: authContext.uid, deviceId });

  const playerSnapshot = await getPlayerDocumentRef(authContext.uid).get();
  if (!playerSnapshot.exists || !readStoredPlayerDocument(playerSnapshot.data()).profileComplete) {
    throw new HttpsError("failed-precondition", "Create your GrowGo profile before viewing the event calendar.");
  }
  return authContext;
}

export async function getOfficialEventCalendarHandler(request: CallableRequest<unknown>) {
  await requireCalendarPlayer(request);
  const now = new Date();
  const events = await readOfficialEventSchedule(getAdminFirestore(), now);
  return {
    ok: true,
    generatedAt: now.toISOString(),
    events: listOfficialEventOccurrences({ events, now, days: CALENDAR_DAYS }),
    playerEvents: []
  };
}

export async function updateOfficialEventHandler(request: CallableRequest<unknown>) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });
  const payload = asObject(request.data, "updateOfficialEvent payload");
  assertAllowedKeys(
    payload,
    [
      "deviceId",
      "eventId",
      "enabled",
      "name",
      "description",
      "announcementEnabled",
      "announcementTitle",
      "announcementMessage",
      "weekdayUtc",
      "startHourUtc",
      "durationHours",
      "reason"
    ],
    "updateOfficialEvent payload"
  );
  const deviceId = typeof payload.deviceId === "string" ? payload.deviceId : undefined;
  await requireActiveDeviceSessionIfEnabled({ uid: authContext.uid, deviceId });
  await requireAdminAccount(authContext.uid, ["owner"]);

  if (!isOfficialEventId(payload.eventId)) {
    throw new HttpsError("invalid-argument", "Choose a valid official event.");
  }
  const reason = normalizeText(payload.reason, 240);
  if (!reason) {
    throw new HttpsError("invalid-argument", "Add a short reason so this official event change is recorded.");
  }

  const incoming = validateEventUpdate(payload);
  const db = getAdminFirestore();
  const now = new Date();
  const currentEvents = await readOfficialEventSchedule(db, now);
  const current = getOfficialEventById(currentEvents, payload.eventId);
  const next: OfficialEventSettings = {
    ...current,
    ...incoming,
    id: current.id,
    schemaVersion: current.schemaVersion
  };

  await getOfficialEventSettingsRef(db, current.id).set(
    buildOfficialEventSettingsDocument({ event: next, updatedByUid: authContext.uid, now }),
    { merge: false }
  );
  clearOfficialEventScheduleCache();
  await recordAdminAuditEvent({
    actorUid: authContext.uid,
    action: "official_event_updated",
    targetUid: authContext.uid,
    details: {
      eventId: current.id,
      enabled: next.enabled,
      announcementEnabled: next.announcementEnabled,
      announcementTitle: next.announcementTitle,
      announcementMessage: next.announcementMessage,
      weekdayUtc: next.weekdayUtc,
      startHourUtc: next.startHourUtc,
      durationHours: next.durationHours,
      reason
    }
  });

  return {
    ok: true,
    event: next,
    updatedAt: now.toISOString()
  };
}

function validateEventUpdate(payload: Record<string, unknown>): Partial<OfficialEventSettings> {
  const update: Partial<OfficialEventSettings> = {};
  if (payload.enabled !== undefined) {
    if (typeof payload.enabled !== "boolean") throw new HttpsError("invalid-argument", "Event status must be enabled or paused.");
    update.enabled = payload.enabled;
  }
  if (payload.name !== undefined) update.name = requireText(payload.name, "Event name", 56);
  if (payload.description !== undefined) update.description = requireText(payload.description, "Event description", 180);
  if (payload.announcementEnabled !== undefined) {
    if (typeof payload.announcementEnabled !== "boolean") {
      throw new HttpsError("invalid-argument", "Announcement status must be enabled or paused.");
    }
    update.announcementEnabled = payload.announcementEnabled;
  }
  if (payload.announcementTitle !== undefined) {
    update.announcementTitle = requireText(payload.announcementTitle, "Announcement heading", 56);
  }
  if (payload.announcementMessage !== undefined) {
    update.announcementMessage = requireText(payload.announcementMessage, "Announcement message", 180);
  }
  if (payload.weekdayUtc !== undefined) update.weekdayUtc = requireInteger(payload.weekdayUtc, "UTC day", 0, 6);
  if (payload.startHourUtc !== undefined) update.startHourUtc = requireInteger(payload.startHourUtc, "UTC hour", 0, 23);
  if (payload.durationHours !== undefined) update.durationHours = requireInteger(payload.durationHours, "Duration", 1, 168);
  return update;
}

function requireText(value: unknown, label: string, maxLength: number) {
  const normalized = normalizeText(value, maxLength);
  if (!normalized) throw new HttpsError("invalid-argument", `${label} is required.`);
  return normalized;
}

function normalizeText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > 0 && normalized.length <= maxLength ? normalized : null;
}

function requireInteger(value: unknown, label: string, min: number, max: number) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    throw new HttpsError("invalid-argument", `${label} must be between ${min} and ${max}.`);
  }
  return value;
}

export const getOfficialEventCalendar = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  getOfficialEventCalendarHandler
);

export const updateOfficialEvent = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  updateOfficialEventHandler
);
