import { Timestamp, type Firestore, type QueryDocumentSnapshot } from "firebase-admin/firestore";

import { CROP_STAGE_MILLISECONDS, getCropHarvestWindow, hasCropHarvestWindowEnded } from "../domain/world/cropLifecycle";
import { SHARED_BASE_PIN_STATES_COLLECTION, readSharedBasePinState } from "../domain/world/sharedWorld";

export const MAX_CROP_LIFECYCLE_ADVANCES_PER_RUN = 200;
const MIN_TIMESTAMP = Timestamp.fromDate(new Date("0001-01-01T00:00:00.000Z"));

/** Select expired crops only; callers must still recheck each one inside its transaction. */
export async function readDueCropLifecycleStates(
  db: Pick<Firestore, "collection">,
  now: Date,
  limit = MAX_CROP_LIFECYCLE_ADVANCES_PER_RUN
): Promise<QueryDocumentSnapshot[]> {
  if (!Number.isFinite(now.getTime()) || !Number.isSafeInteger(limit) ||
      limit < 1 || limit > MAX_CROP_LIFECYCLE_ADVANCES_PER_RUN) {
    throw new Error("Invalid crop lifecycle query time or limit.");
  }
  const collection = db.collection(SHARED_BASE_PIN_STATES_COLLECTION);
  const cutoffs = [
    ["plant.plantedAt", now.getTime() - 4 * CROP_STAGE_MILLISECONDS],
    ["plant.miracleGrownAt", now.getTime() - CROP_STAGE_MILLISECONDS]
  ] as const;

  // Separate single-field queries also cover legacy Miracle Grow records whose
  // plantedAt was not backdated. The lower bound excludes null/non-date values.
  // Bound both reads; fail before starting any mutations if either query fails.
  const snapshots = await Promise.all(cutoffs.map(([field, cutoff]) => collection
    .where(field, ">=", MIN_TIMESTAMP)
    .where(field, "<=", Timestamp.fromMillis(cutoff))
    .orderBy(field, "asc")
    .limit(limit)
    .get()));

  const due = new Map<string, { document: QueryDocumentSnapshot; closesAt: number }>();
  for (const snapshot of snapshots) {
    for (const document of snapshot.docs) {
      const state = readSharedBasePinState(document.data());
      // An old planting timestamp with a recent Miracle Grow date is NOT due.
      if (!state?.plant || !hasCropHarvestWindowEnded(state.plant, now)) continue;
      due.set(document.id, { document, closesAt: getCropHarvestWindow(state.plant).closesAt.getTime() });
    }
  }
  return [...due.values()]
    .sort((a, b) => a.closesAt - b.closesAt || a.document.id.localeCompare(b.document.id))
    .slice(0, limit)
    .map(candidate => candidate.document);
}
