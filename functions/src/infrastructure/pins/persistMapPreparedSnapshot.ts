import type { Firestore } from "firebase-admin/firestore";
import { SHARED_MAP_GEOMETRY_COLLECTION, type StoredMapGeometry } from "./sharedMapGeometryCache";

/** Best-effort optimisation; one attempt only, no background retry storm. */
export async function persistMapPreparedSnapshot(
  db: Firestore, key: string, expected: StoredMapGeometry,
  next: StoredMapGeometry, signal: AbortSignal,
  count: (kind: "read" | "write") => void = () => {}
): Promise<boolean> {
  signal.throwIfAborted();
  if (expected.cellKey !== key || next.cellKey !== key || expected.version !== next.version ||
      !Buffer.isBuffer(expected.data) || !Buffer.isBuffer(next.data)) return false;
  const ref = db.collection(SHARED_MAP_GEOMETRY_COLLECTION).doc(key);
  return db.runTransaction(async transaction => {
    signal.throwIfAborted();
    count("read");
    const snapshot = await transaction.get(ref);
    signal.throwIfAborted();
    const current = snapshot.data();
    if (!snapshot.exists || current?.version !== expected.version || current?.cellKey !== key ||
        !Buffer.isBuffer(current?.data) || !current.data.equals(expected.data)) return false;
    transaction.set(ref, next);
    count("write");
    return true;
  }, { maxAttempts: 1 });
}
