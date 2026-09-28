import { createHash } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import type { Firestore } from "firebase-admin/firestore";

export const SHARED_READ_CACHE_COLLECTION = "sharedReadCachesV1";
const MAX_BYTES = 700_000;
const MAX_DECODED_BYTES = 8_000_000;
const pending = new Map<string, Promise<ReadResult<unknown>>>();
const scopes = new WeakMap<Firestore, number>();
let nextScope = 0;
export function firestoreCacheScope(db: Firestore): number {
  if (!scopes.has(db)) scopes.set(db, ++nextScope);
  return scopes.get(db)!;
}
export interface ReadResult<T> { value: T; loadedAt: number; expiresAt: number }

/** Server-only JSON read models. Never cache authorization or mutation results. */
export async function readSharedCache<T>(params: {
  db: Firestore; key: string; ttlMs: number; revision?: string; enabled?: boolean;
  load(): Promise<T>; validate(value: unknown): value is T; now?: () => number;
}): Promise<ReadResult<T>> {
  const now = params.now ?? Date.now;
  const direct = async () => {
    const loadedAt = now();
    return { value: await params.load(), loadedAt, expiresAt: loadedAt + params.ttlMs };
  };
  if (params.enabled === false) return direct();
  const id = createHash("sha256").update(params.key).digest("hex");
  const revision = params.revision ?? "";
  const flightKey = `${firestoreCacheScope(params.db)}:${id}:${revision}`;
  const existing = pending.get(flightKey);
  if (existing) return existing as Promise<ReadResult<T>>;
  const request = (async () => {
    const ref = params.db.collection(SHARED_READ_CACHE_COLLECTION).doc(id);
    try {
      const record = (await ref.get()).data();
      if (record?.version === 1 && record.key === params.key && record.revision === revision &&
          Number.isFinite(record.loadedAt) && record.loadedAt <= now() &&
          record.expiresAt === record.loadedAt + params.ttlMs && record.expiresAt > now() &&
          Buffer.isBuffer(record.data) && record.data.length <= MAX_BYTES) {
        const value: unknown = JSON.parse(gunzipSync(record.data, { maxOutputLength: MAX_DECODED_BYTES }).toString());
        if (params.validate(value)) return { value, loadedAt: record.loadedAt, expiresAt: record.expiresAt };
      }
    } catch { /* Cache failures must not disable a working source query. */ }
    const result = await direct();
    try {
      const json = JSON.stringify(result.value);
      if (Buffer.byteLength(json) <= MAX_DECODED_BYTES) {
        const data = gzipSync(json);
        if (data.length <= MAX_BYTES) await ref.set({ version: 1, key: params.key, revision,
          loadedAt: result.loadedAt, expiresAt: result.expiresAt, data });
      }
    } catch { /* Reusable data is optional; never fail a successful read. */ }
    return result;
  })();
  pending.set(flightKey, request);
  try { return await request; } finally { pending.delete(flightKey); }
}

export function readOptimizationEnabled(area: "LEADERBOARDS" | "BINGLES" | "MARKETS" | "CAPTURES") {
  return process.env[`GROWGO_OPTIMIZE_${area}`] !== "false";
}
