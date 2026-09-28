import type { Firestore } from "firebase-admin/firestore";
import {
  readBasePinCaptureValueState,
  SHARED_BASE_PIN_CAPTURE_VALUES_COLLECTION,
  type BasePinCaptureValueState
} from "../../domain/pins/basePinValue";

const QUERY_BATCH_SIZE = 30;

/** Uses the existing records/index; no migration or capture-writer change. */
export async function readSparseBasePinCaptureValues(
  db: Pick<Firestore, "collection">,
  pinIds: readonly string[]
): Promise<Map<string, BasePinCaptureValueState>> {
  const uniqueIds = [...new Set(pinIds)];
  const requested = new Set(uniqueIds);
  const collection = db.collection(SHARED_BASE_PIN_CAPTURE_VALUES_COLLECTION);
  const batches: string[][] = [];
  for (let index = 0; index < uniqueIds.length; index += QUERY_BATCH_SIZE) {
    batches.push(uniqueIds.slice(index, index + QUERY_BATCH_SIZE));
  }
  const snapshots = await Promise.all(batches.map((ids) => collection.where("pinId", "in", ids).get()));
  const values = new Map<string, BasePinCaptureValueState>();
  for (const snapshot of snapshots) {
    for (const document of snapshot.docs) {
      const value = readBasePinCaptureValueState(document.data());
      if (value && requested.has(value.pinId)) values.set(value.pinId, value);
    }
  }
  return values;
}
