import { withMapReadDeadline } from "./mapReadDeadline";

/** Share only an active static-map read, never a completed result or player state. */
export function createInFlightMapRead<T>(timeoutMs: number, maxKeys = 100) {
  const scopes = new WeakMap<object, Map<string, Promise<T>>>();
  return (scope: object, key: string, read: () => Promise<T>): Promise<T> => {
    let pending = scopes.get(scope);
    if (!pending) { pending = new Map(); scopes.set(scope, pending); }
    const existing = pending.get(key);
    if (existing) return existing;

    // Bound retained entries without blocking valid reads in other areas.
    if (pending.size >= maxKeys) return withMapReadDeadline(timeoutMs, read);
    const task = withMapReadDeadline(timeoutMs, read).finally(() => {
      if (pending.get(key) === task) pending.delete(key);
    });
    pending.set(key, task);
    return task;
  };
}
