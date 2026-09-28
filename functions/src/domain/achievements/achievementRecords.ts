import { Timestamp, type DocumentData, type Firestore } from "firebase-admin/firestore";

export const PLAYER_ACHIEVEMENT_RECORDS_COLLECTION = "playerAchievementRecords" as const;
export const ACHIEVEMENT_RECORD_SCHEMA_VERSION = 1 as const;

export type AchievementCompletionSource = "server" | "legacy-alpha";
export type WorldFirstAwardKind = "first" | "shared";

export interface AchievementDefinition {
  id: string;
  title: string;
  points: number;
}

/**
 * This is deliberately the server's short, stable catalogue. The browser may
 * choose how to display an achievement, but it can never nominate its own
 * title or point value for a deployable pin.
 */
export const achievementDefinitions: readonly AchievementDefinition[] = [
  { id: "poi-discover-1", title: "First Find", points: 20 },
  { id: "poi-discover-10", title: "Local Scout", points: 50 },
  { id: "poi-discover-50", title: "Area Mapper", points: 150 },
  { id: "poi-capture-1", title: "First Check-In", points: 20 },
  { id: "poi-capture-10", title: "POI Runner", points: 50 },
  { id: "poi-capture-50", title: "Landmark Legend", points: 150 },
  { id: "poi-church-1", title: "Steeple Spotter", points: 20 },
  { id: "poi-hospital-1", title: "Care Finder", points: 20 },
  { id: "poi-historic-1", title: "History Hunter", points: 20 },
  { id: "poi-park-1", title: "Green Trail", points: 20 },
  { id: "poi-landmark-1", title: "Landmark Found", points: 20 },
  { id: "poi-local-1", title: "Local Knowledge", points: 20 },
  {
    id: "achievement-albert-park-grand-prix-circuit",
    title: "Albert Park Grand Prix Circuit",
    points: 150
  },
  { id: "achievement-great-ocean-road", title: "Great Ocean Road", points: 150 },
  {
    id: "achievement-dinosaur-discoveries-complete",
    title: "Dinosaur Discoveries Complete",
    points: 100
  },
  {
    id: "achievement-fish-discoveries-complete",
    title: "Fishy Business Complete",
    points: 100
  }
] as const;

const achievementDefinitionById = new Map(
  achievementDefinitions.map((definition) => [definition.id, definition])
);

export interface StoredAchievementCompletion {
  completedAt: Date;
  source: AchievementCompletionSource;
  worldFirst: StoredWorldFirstRecognition | null;
}

export interface StoredWorldFirstRecognition {
  kind: WorldFirstAwardKind;
  firstCompletedAt: Date;
  sharedWindowEndsAt: Date;
}

export interface StoredPlayerAchievementRecords {
  achievements: Record<string, StoredAchievementCompletion>;
  legacyMigrationAppliedAt: Date | null;
}

export function getAchievementDefinition(id: string): AchievementDefinition | null {
  return achievementDefinitionById.get(id) || null;
}

export function getPlayerAchievementRecordsRef(db: Firestore, uid: string) {
  return db.collection(PLAYER_ACHIEVEMENT_RECORDS_COLLECTION).doc(uid);
}

export function readStoredPlayerAchievementRecords(
  value: DocumentData | undefined
): StoredPlayerAchievementRecords {
  const rawAchievements = value?.achievements;
  const achievements = rawAchievements && typeof rawAchievements === "object" && !Array.isArray(rawAchievements)
    ? Object.entries(rawAchievements as Record<string, unknown>).reduce<Record<string, StoredAchievementCompletion>>(
      (result, [id, entry]) => {
        const definition = getAchievementDefinition(id);
        if (!definition || !entry || typeof entry !== "object" || Array.isArray(entry)) return result;
        const record = entry as Record<string, unknown>;
        const completedAt = readDate(record.completedAt);
        const source = record.source === "legacy-alpha" ? "legacy-alpha" : "server";
        if (completedAt) {
          result[id] = {
            completedAt,
            source,
            worldFirst: readStoredWorldFirstRecognition(record.worldFirst)
          };
        }
        return result;
      },
      {}
    )
    : {};

  return {
    achievements,
    legacyMigrationAppliedAt: readDate(value?.legacyMigrationAppliedAt)
  };
}

export function completeAchievementRecord(params: {
  records: StoredPlayerAchievementRecords;
  achievementId: string;
  completedAt: Date;
  source: AchievementCompletionSource;
  worldFirst?: StoredWorldFirstRecognition | null;
}): StoredPlayerAchievementRecords {
  if (!getAchievementDefinition(params.achievementId) || params.records.achievements[params.achievementId]) {
    return params.records;
  }

  return {
    ...params.records,
    achievements: {
      ...params.records.achievements,
      [params.achievementId]: {
        completedAt: params.completedAt,
        source: params.source,
        worldFirst: params.worldFirst || null
      }
    }
  };
}

export function buildPlayerAchievementRecordsStorage(params: {
  records: StoredPlayerAchievementRecords;
  updatedAt: Date;
}) {
  return {
    schemaVersion: ACHIEVEMENT_RECORD_SCHEMA_VERSION,
    achievements: Object.fromEntries(
      Object.entries(params.records.achievements).map(([id, record]) => [id, {
        completedAt: Timestamp.fromDate(record.completedAt),
        source: record.source,
        ...(record.worldFirst
          ? {
              worldFirst: {
                kind: record.worldFirst.kind,
                firstCompletedAt: Timestamp.fromDate(record.worldFirst.firstCompletedAt),
                sharedWindowEndsAt: Timestamp.fromDate(record.worldFirst.sharedWindowEndsAt)
              }
            }
          : {})
      }])
    ),
    legacyMigrationAppliedAt: params.records.legacyMigrationAppliedAt
      ? Timestamp.fromDate(params.records.legacyMigrationAppliedAt)
      : null,
    updatedAt: Timestamp.fromDate(params.updatedAt)
  };
}

export function serializeAchievementCompletion(params: {
  achievementId: string;
  record: StoredAchievementCompletion;
}) {
  const definition = getAchievementDefinition(params.achievementId);
  if (!definition) return null;
  return {
    id: definition.id,
    title: definition.title,
    points: definition.points,
    completedAt: params.record.completedAt.toISOString(),
    source: params.record.source,
    worldFirst: params.record.worldFirst
      ? {
          kind: params.record.worldFirst.kind,
          firstCompletedAt: params.record.worldFirst.firstCompletedAt.toISOString(),
          sharedWindowEndsAt: params.record.worldFirst.sharedWindowEndsAt.toISOString()
        }
      : null
  };
}

function readStoredWorldFirstRecognition(value: unknown): StoredWorldFirstRecognition | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const kind: WorldFirstAwardKind | null = raw.kind === "first" || raw.kind === "shared"
    ? raw.kind
    : null;
  const firstCompletedAt = readDate(raw.firstCompletedAt);
  const sharedWindowEndsAt = readDate(raw.sharedWindowEndsAt);
  if (!kind || !firstCompletedAt || !sharedWindowEndsAt) return null;
  return { kind, firstCompletedAt, sharedWindowEndsAt };
}

function readDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  if (value && typeof (value as { toDate?: unknown }).toDate === "function") {
    const date = (value as { toDate(): Date }).toDate();
    return Number.isFinite(date.getTime()) ? date : null;
  }
  if (typeof value === "string") {
    const time = Date.parse(value);
    return Number.isFinite(time) ? new Date(time) : null;
  }
  return null;
}
