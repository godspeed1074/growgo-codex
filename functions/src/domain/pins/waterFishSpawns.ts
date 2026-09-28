import { createHash } from "node:crypto";

import type { Firestore } from "firebase-admin/firestore";

export const WATER_FISH_LIFETIME_MILLISECONDS = 12 * 60 * 60 * 1_000;
export const WATER_FISH_SPAWN_CHANCE = 1 / 10;
export const WATER_FISH_CYCLES_COLLECTION = "activeWaterFishCycles";
const REPLACEMENT_CANDIDATE_SCAN_LIMIT = 500;
const REPLACEMENT_CANDIDATE_RETURN_LIMIT = 48;
const WATER_FISH_STATE_QUERY_BATCH_SIZE = 30;

export interface WaterFishCycle {
  key: string;
  spawnedAt: Date;
  expiresAt: Date;
}

export interface WaterFishActivity {
  active: boolean;
  type: "blue" | null;
  spawnedAt: Date | null;
  expiresAt: Date | null;
  source: "cycle" | "replacement" | null;
}

export interface WaterFishCandidate {
  pinId: string;
  latitude: number;
  longitude: number;
}

interface WaterFishStateDocument {
  schemaVersion: 1;
  pinId: string;
  cycleKey: string;
  state: "active" | "captured";
  source: "replacement" | "capture";
  spawnedAt: Date;
  expiresAt: Date;
  updatedAt: Date;
  replacementForPinId?: string;
  capturedAt?: Date;
  capturedByUid?: string;
}

export function getWaterFishCycle(now: Date): WaterFishCycle {
  const cycleStartMilliseconds = Math.floor(
    now.getTime() / WATER_FISH_LIFETIME_MILLISECONDS
  ) * WATER_FISH_LIFETIME_MILLISECONDS;
  const spawnedAt = new Date(cycleStartMilliseconds);
  const expiresAt = new Date(cycleStartMilliseconds + WATER_FISH_LIFETIME_MILLISECONDS);

  return {
    key: `fish-${spawnedAt.toISOString().replace(/[:.]/g, "-")}`,
    spawnedAt,
    expiresAt
  };
}

export function isCycleWaterFish(
  pinId: string,
  cycle: WaterFishCycle,
  spawnChance: number = WATER_FISH_SPAWN_CHANCE
): boolean {
  return getDeterministicRoll(`${cycle.key}|${pinId}`) < normalizeSpawnChance(spawnChance);
}

export function waterFishStateDocumentId(pinId: string): string {
  return createHash("sha256")
    .update(`growgo-water-fish-state-v1|${pinId}`, "utf8")
    .digest("hex");
}

export function getWaterFishStateRef(
  db: Firestore,
  cycle: WaterFishCycle,
  pinId: string
) {
  return db
    .collection(WATER_FISH_CYCLES_COLLECTION)
    .doc(cycle.key)
    .collection("pins")
    .doc(waterFishStateDocumentId(pinId));
}

export function resolveWaterFishActivity(params: {
  pinId: string;
  cycle: WaterFishCycle;
  value: unknown;
  spawnChance?: number;
}): WaterFishActivity {
  const record = readWaterFishStateDocument(params.value, params.pinId, params.cycle);
  if (record?.state === "captured") return inactiveWaterFish();
  if (record?.state === "active") {
    return {
      active: true,
      type: "blue",
      spawnedAt: record.spawnedAt,
      expiresAt: record.expiresAt,
      source: "replacement"
    };
  }
  if (isCycleWaterFish(params.pinId, params.cycle, params.spawnChance)) {
    return {
      active: true,
      type: "blue",
      spawnedAt: params.cycle.spawnedAt,
      expiresAt: params.cycle.expiresAt,
      source: "cycle"
    };
  }
  return inactiveWaterFish();
}

export async function readWaterFishActivitiesForPins(params: {
  db: Firestore;
  pinIds: readonly string[];
  now: Date;
  spawnChance?: number;
}): Promise<Map<string, WaterFishActivity>> {
  const cycle = getWaterFishCycle(params.now);
  const uniquePinIds = [...new Set(params.pinIds.filter(Boolean))];
  if (uniquePinIds.length === 0) return new Map();

  // Normal fish spawning is deterministic. Firestore only stores the small
  // exception set (captured fish and replacement fish), so querying those
  // records in batches is far cheaper than reading an empty document for
  // every visible water pin.
  const stateByPinId = new Map<string, unknown>();
  const cyclePins = params.db
    .collection(WATER_FISH_CYCLES_COLLECTION)
    .doc(cycle.key)
    .collection("pins");
  const batches = chunkPinIds(uniquePinIds, WATER_FISH_STATE_QUERY_BATCH_SIZE);
  const snapshots = await Promise.all(batches.map((pinIds) =>
    cyclePins.where("pinId", "in", pinIds).get()
  ));
  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((document) => {
      const value = document.data();
      if (typeof value?.pinId === "string") {
        stateByPinId.set(value.pinId, value);
      }
    });
  });

  const activities = new Map<string, WaterFishActivity>();
  uniquePinIds.forEach((pinId) => {
    activities.set(pinId, resolveWaterFishActivity({
      pinId,
      cycle,
      value: stateByPinId.get(pinId),
      spawnChance: params.spawnChance
    }));
  });
  return activities;
}

function chunkPinIds(pinIds: readonly string[], size: number): string[][] {
  const batches: string[][] = [];
  for (let index = 0; index < pinIds.length; index += size) {
    batches.push(pinIds.slice(index, index + size));
  }
  return batches;
}

/**
 * Chooses from the server-known global water-pin pool. We only return
 * deterministic non-cycle-fish candidates: each capture can then promote one
 * of them without changing the normal ten-percent fish density.
 */
export async function readWaterFishReplacementCandidates(params: {
  db: Firestore;
  now: Date;
  excludedPinIds: readonly string[];
  seed: string;
  limit?: number;
  spawnChance?: number;
}): Promise<WaterFishCandidate[]> {
  const cycle = getWaterFishCycle(params.now);
  const excluded = new Set(params.excludedPinIds);
  const snapshot = await params.db
    .collection("authoritativeWaterPinStates")
    .where("type", "==", "water")
    .limit(REPLACEMENT_CANDIDATE_SCAN_LIMIT)
    .get();

  return snapshot.docs
    .map((document) => {
      const value = document.data();
      return {
        pinId: typeof value.pinId === "string" ? value.pinId : "",
        latitude: Number(value.latitude),
        longitude: Number(value.longitude)
      };
    })
    .filter((candidate): candidate is WaterFishCandidate =>
      Boolean(candidate.pinId) &&
      Number.isFinite(candidate.latitude) &&
      Number.isFinite(candidate.longitude) &&
      !excluded.has(candidate.pinId) &&
      !isCycleWaterFish(candidate.pinId, cycle, params.spawnChance)
    )
    .sort((left, right) =>
      getDeterministicRoll(`${cycle.key}|${params.seed}|${left.pinId}`) -
      getDeterministicRoll(`${cycle.key}|${params.seed}|${right.pinId}`)
    )
    .slice(0, Math.max(1, Math.min(params.limit ?? REPLACEMENT_CANDIDATE_RETURN_LIMIT, REPLACEMENT_CANDIDATE_RETURN_LIMIT)));
}

export function buildCapturedWaterFishState(params: {
  pinId: string;
  cycle: WaterFishCycle;
  now: Date;
  uid: string;
}): WaterFishStateDocument {
  return {
    schemaVersion: 1,
    pinId: params.pinId,
    cycleKey: params.cycle.key,
    state: "captured",
    source: "capture",
    spawnedAt: params.cycle.spawnedAt,
    expiresAt: params.cycle.expiresAt,
    updatedAt: params.now,
    capturedAt: params.now,
    capturedByUid: params.uid
  };
}

export function buildReplacementWaterFishState(params: {
  pinId: string;
  replacedPinId: string;
  cycle: WaterFishCycle;
  now: Date;
}): WaterFishStateDocument {
  return {
    schemaVersion: 1,
    pinId: params.pinId,
    cycleKey: params.cycle.key,
    state: "active",
    source: "replacement",
    spawnedAt: params.now,
    expiresAt: params.cycle.expiresAt,
    updatedAt: params.now,
    replacementForPinId: params.replacedPinId
  };
}

function readWaterFishStateDocument(
  value: unknown,
  pinId: string,
  cycle: WaterFishCycle
): WaterFishStateDocument | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (
    record.schemaVersion !== 1 ||
    record.pinId !== pinId ||
    record.cycleKey !== cycle.key ||
    (record.state !== "active" && record.state !== "captured") ||
    (record.source !== "replacement" && record.source !== "capture")
  ) {
    return null;
  }

  const spawnedAt = readDate(record.spawnedAt);
  const expiresAt = readDate(record.expiresAt);
  if (!spawnedAt || !expiresAt || expiresAt.getTime() <= cycle.spawnedAt.getTime()) return null;

  return {
    schemaVersion: 1,
    pinId,
    cycleKey: cycle.key,
    state: record.state,
    source: record.source,
    spawnedAt,
    expiresAt,
    updatedAt: readDate(record.updatedAt) ?? spawnedAt,
    ...(record.replacementForPinId && typeof record.replacementForPinId === "string"
      ? { replacementForPinId: record.replacementForPinId }
      : {}),
    ...(record.capturedAt && readDate(record.capturedAt)
      ? { capturedAt: readDate(record.capturedAt)! }
      : {}),
    ...(record.capturedByUid && typeof record.capturedByUid === "string"
      ? { capturedByUid: record.capturedByUid }
      : {})
  };
}

function readDate(value: unknown): Date | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (value && typeof value === "object" && "toDate" in value) {
    const parsed = (value as { toDate?: () => Date }).toDate?.();
    if (parsed instanceof Date && Number.isFinite(parsed.getTime())) return parsed;
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (Number.isFinite(parsed.getTime())) return parsed;
  }
  return null;
}

function inactiveWaterFish(): WaterFishActivity {
  return {
    active: false,
    type: null,
    spawnedAt: null,
    expiresAt: null,
    source: null
  };
}

function normalizeSpawnChance(value: number): number {
  return Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : WATER_FISH_SPAWN_CHANCE;
}

function getDeterministicRoll(value: string): number {
  const digest = createHash("sha256")
    .update(`growgo-water-fish-cycle-v1|${value}`, "utf8")
    .digest();
  return digest.readUInt32BE(0) / 0x1_0000_0000;
}
