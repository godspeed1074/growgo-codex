import { createHash } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { firestoreCacheScope } from "../sharedReadCache";

interface Entry { revision: string; expiresAt: number; ids: Set<string> }
const TTL_MS = 90_000;
const MAX_ENTRIES = 100;
const MAX_IDS = 50_000;

/** Only a map-display cache. Actual captures/harvests still read their own records. */
export function createPlayerDailyCaptureCache() {
  const entries = new Map<string, Entry>();
  const pending = new Map<string, Promise<Entry>>();
  return async (params: { db: Firestore; uid: string; day: string; pinIds: readonly string[]; revision: string; now: number; enabled: boolean }) => {
    const pinIds = [...new Set(params.pinIds.filter(Boolean))].sort();
    const selection = createHash("sha256").update(JSON.stringify(pinIds)).digest("hex");
    const key = `${firestoreCacheScope(params.db)}:${params.uid}:${params.day}:${selection}`;
    const endOfDay = Date.parse(`${params.day}T00:00:00Z`) + 86_400_000;
    for (const [id, entry] of entries) if (entry.expiresAt <= params.now) entries.delete(id);
    const cached = entries.get(key);
    if (params.enabled && cached?.revision === params.revision && cached.expiresAt > params.now) return cached;
    const flightKey = `${key}:${params.revision}`;
    if (params.enabled && pending.has(flightKey)) return pending.get(flightKey)!;
    const request = (async () => {
      const ids = new Set<string>();
      const collection = params.db.collection("playerCaptureStates").doc(params.uid).collection("pins");
      const requested = new Set(pinIds);
      // Bound reads to the returned map pins, not the player's growing daily history.
      // Single-field queries need no new index. Filter the UTC day after reading
      // because each pin's record is overwritten on its next successful capture.
      // At most four queries at once: avoid a serial delay or an unbounded burst.
      for (let offset = 0; offset < pinIds.length; offset += 120) {
        const batches: string[][] = [];
        for (let start = offset; start < Math.min(offset + 120, pinIds.length); start += 30) {
          batches.push(pinIds.slice(start, start + 30));
        }
        const pages = await Promise.all(batches.map(batch => collection.where("pinId", "in", batch).get()));
        for (const doc of pages.flatMap(page => page.docs)) {
          const value = doc.data();
          if (typeof value.pinId === "string" && requested.has(value.pinId) && value.captureDay === params.day) ids.add(value.pinId);
        }
      }
      const entry = { ids, revision: params.revision, expiresAt: Math.min(params.now + TTL_MS, endOfDay) };
      if (params.enabled && ids.size <= MAX_IDS) {
        entries.delete(key);
        entries.set(key, entry);
        while (entries.size > MAX_ENTRIES || [...entries.values()].reduce((n, e) => n + e.ids.size, 0) > MAX_IDS) {
          entries.delete(entries.keys().next().value!);
        }
      }
      return entry;
    })();
    if (params.enabled) pending.set(flightKey, request);
    try { return await request; } finally { pending.delete(flightKey); }
  };
}
