import type { Firestore } from "firebase-admin/firestore";
import {
  SHARED_BASE_PIN_STATES_COLLECTION,
  readSharedBasePinState,
  type SharedBasePinState
} from "../../domain/world/sharedWorld";

/** Exact visible IDs, not a latitude strip with a truncating global limit.
 * Fresh reads only: never cache away ownership/plant changes or hide failures.
 */
export async function readNearbyOwnedPinStates(
  db: Pick<Firestore, "collection">,
  pinIds: readonly string[]
): Promise<{ states: Map<string, SharedBasePinState>; documentsRead: number; queries: number }> {
  const ids = [...new Set(pinIds)];
  const requested = new Set(ids);
  const states = new Map<string, SharedBasePinState>();
  if (!ids.length) return { states, documentsRead: 0, queries: 0 };
  const collection = db.collection(SHARED_BASE_PIN_STATES_COLLECTION);
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += 30) batches.push(ids.slice(i, i + 30));
  let cursor = 0;
  let documentsRead = 0;
  // Bound parallel calls during large views without truncating the result.
  await Promise.all(Array.from({ length: Math.min(4, batches.length) }, async () => {
    while (cursor < batches.length) {
      const batch = batches[cursor++];
      const snapshot = await collection.where("pinId", "in", batch).get();
      documentsRead += snapshot.docs.length;
      for (const document of snapshot.docs) {
        const state = readSharedBasePinState(document.data());
        if (state && requested.has(state.pinId)) states.set(state.pinId, state);
      }
    }
  }));
  return { states, documentsRead, queries: batches.length };
}
