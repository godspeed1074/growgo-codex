import type { Firestore } from "firebase-admin/firestore";
import { readSharedBasePinState, SHARED_BASE_PIN_STATES_COLLECTION, type SharedBasePinState } from "../../domain/world/sharedWorld";

// Isolated candidate; deliberately not used by gameplay or writers yet.
export const OWNED_LONGITUDE_BAND_FIELD = "longitudeBandV1";
const SCALE = 50; // 0.02-degree bands; integer arithmetic avoids edge drift.
const MAX_BAND = 360 * SCALE - 1;
export function ownedLongitudeBand(longitude: number): number {
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error("Invalid longitude");
  return Math.min(MAX_BAND, Math.max(0, Math.floor((longitude + 180) * SCALE)));
}
export interface OwnedPinBounds { south: number; north: number; west: number; east: number }
export function ownedLongitudeBands(bounds: OwnedPinBounds): number[] {
  if (!Number.isFinite(bounds.south) || !Number.isFinite(bounds.north) || bounds.south < -90 || bounds.north > 90 || bounds.south > bounds.north) throw new Error("Invalid latitude bounds");
  const start = ownedLongitudeBand(bounds.west), end = ownedLongitudeBand(bounds.east);
  const ranges = bounds.west <= bounds.east ? [[start, end]] : [[start, MAX_BAND], [0, end]];
  const count = ranges.reduce((n, [a, b]) => n + b - a + 1, 0);
  // Never silently split broad views into dozens of billable empty queries.
  if (count > 30) throw new Error("Viewport exceeds single-query band budget");
  return [...new Set(ranges.flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i)))];
}

export async function readBandedOwnedPinStates(params: {
  db: Pick<Firestore, "collection">;
  bounds: OwnedPinBounds;
  pinIds: readonly string[];
  // Must come from a verified server migration manifest, never client input.
  coverageVerified: boolean;
}): Promise<{ states: Map<string, SharedBasePinState>; documentsRead: number; queries: number }> {
  const states = new Map<string, SharedBasePinState>();
  if (!params.pinIds.length) return { states, documentsRead: 0, queries: 0 };
  if (!params.coverageVerified) throw new Error("Owned-pin band migration is not verified");
  const bands = ownedLongitudeBands(params.bounds);
  const requested = new Set(params.pinIds);
  const snapshot = await params.db.collection(SHARED_BASE_PIN_STATES_COLLECTION)
    .where(OWNED_LONGITUDE_BAND_FIELD, "in", bands)
    .where("latitude", ">=", params.bounds.south)
    .where("latitude", "<=", params.bounds.north)
    .get();
  // No 500-record truncation, no completed-state cache, no writes.
  for (const doc of snapshot.docs) {
    const state = readSharedBasePinState(doc.data());
    if (!state || !requested.has(state.pinId)) continue;
    const { south, north, west, east } = params.bounds;
    const inLongitude = west <= east ? state.longitude >= west && state.longitude <= east : state.longitude >= west || state.longitude <= east;
    if (state.latitude >= south && state.latitude <= north && inLongitude) states.set(state.pinId, state);
  }
  return { states, documentsRead: snapshot.docs.length, queries: 1 };
}
