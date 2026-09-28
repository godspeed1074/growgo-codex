import type { DocumentData, Firestore } from "firebase-admin/firestore";

export const OFFICIAL_EVENT_SETTINGS_COLLECTION = "officialEventSettings" as const;
export const OFFICIAL_EVENT_SCHEMA_VERSION = 1 as const;
export const OFFICIAL_EVENT_SCHEDULE_CACHE_MILLISECONDS = 60_000;

export const officialEventIds = ["fishy-friday", "manic-monday"] as const;
export type OfficialEventId = (typeof officialEventIds)[number];

export interface OfficialEventSettings {
  schemaVersion: typeof OFFICIAL_EVENT_SCHEMA_VERSION;
  id: OfficialEventId;
  enabled: boolean;
  name: string;
  description: string;
  announcementEnabled: boolean;
  announcementTitle: string;
  announcementMessage: string;
  weekdayUtc: number;
  startHourUtc: number;
  durationHours: number;
}

export interface OfficialEventOccurrence {
  id: OfficialEventId;
  name: string;
  description: string;
  announcementEnabled: boolean;
  announcementTitle: string;
  announcementMessage: string;
  effectSummary: string;
  enabled: boolean;
  status: "active" | "upcoming" | "paused";
  startsAt: string;
  endsAt: string;
}

const DEFAULT_OFFICIAL_EVENTS: Readonly<Record<OfficialEventId, OfficialEventSettings>> = Object.freeze({
  "fishy-friday": {
    schemaVersion: OFFICIAL_EVENT_SCHEMA_VERSION,
    id: "fishy-friday",
    enabled: true,
    name: "Fishy Friday",
    description: "The waters are busier every Friday.",
    announcementEnabled: true,
    announcementTitle: "Fishy Friday",
    announcementMessage: "More fish are swimming across water pins today.",
    weekdayUtc: 5,
    startHourUtc: 0,
    durationHours: 24
  },
  "manic-monday": {
    schemaVersion: OFFICIAL_EVENT_SCHEMA_VERSION,
    id: "manic-monday",
    enabled: true,
    name: "Manic Monday",
    description: "Make every food boost count on Monday.",
    announcementEnabled: true,
    announcementTitle: "Manic Monday",
    announcementMessage: "Food buffs started today keep working twice as long.",
    weekdayUtc: 1,
    startHourUtc: 0,
    durationHours: 24
  }
});

let cachedSchedule: { expiresAt: number; events: OfficialEventSettings[] } | null = null;

export function isOfficialEventId(value: unknown): value is OfficialEventId {
  return typeof value === "string" && officialEventIds.includes(value as OfficialEventId);
}

export function getOfficialEventSettingsRef(db: Firestore, id: OfficialEventId) {
  return db.collection(OFFICIAL_EVENT_SETTINGS_COLLECTION).doc(id);
}

export function getDefaultOfficialEventSettings(id: OfficialEventId): OfficialEventSettings {
  return { ...DEFAULT_OFFICIAL_EVENTS[id] };
}

export function getOfficialEventEffectSummary(id: OfficialEventId): string {
  if (id === "fishy-friday") {
    return "Double fish spawns worldwide. Exotic fish will receive their 3× chance once exotic fish are introduced.";
  }
  return "Food boosts activated during the event last twice as long, even if they continue into Tuesday.";
}

export function readOfficialEventSettings(id: OfficialEventId, value: unknown): OfficialEventSettings {
  const fallback = getDefaultOfficialEventSettings(id);
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== OFFICIAL_EVENT_SCHEMA_VERSION || record.id !== id) return fallback;

  return {
    schemaVersion: OFFICIAL_EVENT_SCHEMA_VERSION,
    id,
    enabled: typeof record.enabled === "boolean" ? record.enabled : fallback.enabled,
    name: readShortText(record.name, fallback.name, 56),
    description: readShortText(record.description, fallback.description, 180),
    announcementEnabled: typeof record.announcementEnabled === "boolean"
      ? record.announcementEnabled
      : fallback.announcementEnabled,
    announcementTitle: readShortText(record.announcementTitle, fallback.announcementTitle, 56),
    announcementMessage: readShortText(record.announcementMessage, fallback.announcementMessage, 180),
    weekdayUtc: readBoundedInteger(record.weekdayUtc, fallback.weekdayUtc, 0, 6),
    startHourUtc: readBoundedInteger(record.startHourUtc, fallback.startHourUtc, 0, 23),
    durationHours: readBoundedInteger(record.durationHours, fallback.durationHours, 1, 168)
  };
}

export async function readOfficialEventSchedule(
  db: Firestore,
  now: Date = new Date()
): Promise<OfficialEventSettings[]> {
  if (cachedSchedule && cachedSchedule.expiresAt > now.getTime()) {
    return cachedSchedule.events.map((event) => ({ ...event }));
  }

  const snapshots = await db.getAll(
    ...officialEventIds.map((id) => getOfficialEventSettingsRef(db, id))
  );
  const events = officialEventIds.map((id, index) =>
    readOfficialEventSettings(id, snapshots[index]?.data())
  );
  cachedSchedule = {
    expiresAt: now.getTime() + OFFICIAL_EVENT_SCHEDULE_CACHE_MILLISECONDS,
    events
  };
  return events.map((event) => ({ ...event }));
}

export function clearOfficialEventScheduleCache() {
  cachedSchedule = null;
}

export function getOfficialEventById(
  events: readonly OfficialEventSettings[],
  id: OfficialEventId
): OfficialEventSettings {
  return events.find((event) => event.id === id) ?? getDefaultOfficialEventSettings(id);
}

export function isOfficialEventActive(
  event: OfficialEventSettings,
  now: Date
): boolean {
  if (!event.enabled) return false;
  const start = getMostRecentOccurrenceStart(event, now);
  const end = new Date(start.getTime() + event.durationHours * 60 * 60 * 1_000);
  return now.getTime() >= start.getTime() && now.getTime() < end.getTime();
}

export function getWaterFishSpawnMultiplier(
  events: readonly OfficialEventSettings[],
  now: Date
): number {
  return isOfficialEventActive(getOfficialEventById(events, "fishy-friday"), now) ? 2 : 1;
}

export function getFoodBuffDurationMultiplier(
  events: readonly OfficialEventSettings[],
  now: Date
): number {
  return isOfficialEventActive(getOfficialEventById(events, "manic-monday"), now) ? 2 : 1;
}

export function listOfficialEventOccurrences(params: {
  events: readonly OfficialEventSettings[];
  now: Date;
  days?: number;
}): OfficialEventOccurrence[] {
  const days = Math.max(1, Math.min(90, Math.floor(params.days ?? 30)));
  const earliest = new Date(params.now.getTime() - 7 * 24 * 60 * 60 * 1_000);
  const latest = new Date(params.now.getTime() + days * 24 * 60 * 60 * 1_000);
  const occurrences: OfficialEventOccurrence[] = [];

  for (const event of params.events) {
    for (let cursor = startOfUtcDay(earliest); cursor.getTime() <= latest.getTime(); cursor = addUtcDays(cursor, 1)) {
      if (cursor.getUTCDay() !== event.weekdayUtc) continue;
      const start = new Date(Date.UTC(
        cursor.getUTCFullYear(),
        cursor.getUTCMonth(),
        cursor.getUTCDate(),
        event.startHourUtc,
        0,
        0,
        0
      ));
      const end = new Date(start.getTime() + event.durationHours * 60 * 60 * 1_000);
      if (end.getTime() <= params.now.getTime() || start.getTime() > latest.getTime()) continue;
      occurrences.push({
        id: event.id,
        name: event.name,
        description: event.description,
        announcementEnabled: event.announcementEnabled,
        announcementTitle: event.announcementTitle,
        announcementMessage: event.announcementMessage,
        effectSummary: getOfficialEventEffectSummary(event.id),
        enabled: event.enabled,
        status: !event.enabled ? "paused" : isOfficialEventActive(event, params.now) ? "active" : "upcoming",
        startsAt: start.toISOString(),
        endsAt: end.toISOString()
      });
    }
  }

  return occurrences.sort((left, right) => left.startsAt.localeCompare(right.startsAt));
}

export function buildOfficialEventSettingsDocument(params: {
  event: OfficialEventSettings;
  updatedByUid: string;
  now?: Date;
}) {
  return {
    ...params.event,
    updatedByUid: params.updatedByUid,
    updatedAt: params.now ?? new Date()
  } as const;
}

function getMostRecentOccurrenceStart(event: OfficialEventSettings, now: Date): Date {
  const midnight = startOfUtcDay(now);
  const daysSinceEvent = (midnight.getUTCDay() - event.weekdayUtc + 7) % 7;
  const date = addUtcDays(midnight, -daysSinceEvent);
  const start = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    event.startHourUtc,
    0,
    0,
    0
  ));
  return start.getTime() > now.getTime() ? addUtcDays(start, -7) : start;
}

function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function addUtcDays(value: Date, days: number) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate() + days));
}

function readShortText(value: unknown, fallback: string, maximumLength: number) {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > 0 && normalized.length <= maximumLength ? normalized : fallback;
}

function readBoundedInteger(value: unknown, fallback: number, min: number, max: number) {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
    ? value
    : fallback;
}
