import type { Firestore } from "firebase-admin/firestore";

const QUERY_BATCH_SIZE = 30;

/** Map display only: read this player's nearby POIs, not their whole daily history. */
export async function readNearbyDailyPoiCaptures(params: {
  db: Pick<Firestore, "collection">;
  uid: string;
  captureDay: string;
  pinIds: readonly string[];
}): Promise<Set<string>> {
  const ids = [...new Set(params.pinIds.filter(Boolean))];
  if (ids.length === 0) return new Set();

  const requested = new Set(ids);
  const collection = params.db.collection("playerDailyPoiCaptures").doc(params.uid).collection("pins");
  const batches: string[][] = [];
  for (let offset = 0; offset < ids.length; offset += QUERY_BATCH_SIZE) {
    batches.push(ids.slice(offset, offset + QUERY_BATCH_SIZE));
  }
  // One existing single-field index; no new composite index or migration.
  // Yesterday's record is still stored at this pin's ID, so check its UTC day
  // after reading it. Do not cache this result or treat a failed query as empty.
  const snapshots = await Promise.all(batches.map(batch => collection.where("pinId", "in", batch).get()));
  const captured = new Set<string>();
  for (const snapshot of snapshots) {
    for (const document of snapshot.docs) {
      const value = document.data();
      if (typeof value.pinId === "string" && requested.has(value.pinId) && value.captureDay === params.captureDay) {
        captured.add(value.pinId);
      }
    }
  }
  return captured;
}
