import { withMapReadDeadline } from "./mapReadDeadline";

export const MAP_PROVIDER_TOTAL_MS = 20_000;
export const MAP_PROVIDER_ATTEMPT_MS = 8_000;
export const MAP_PROVIDER_BACKUP_DELAY_MS = 1_500;

interface ProviderOptions<T> {
  endpoints: readonly string[];
  body: string;
  userAgent: string;
  normalize(payload: unknown): T;
  signal?: AbortSignal;
  fetch?: typeof fetch;
  totalMs?: number;
  attemptMs?: number;
  backupDelayMs?: number;
  onAttemptFailure?: (endpoint: string) => void;
  onAttemptSuccess?: (endpoint: string) => void;
}

/** In-memory only: don't spend each short stale-refresh window on the same bad mirror. */
export function createNearbyMapProvider(now = Date.now, cooldownMs = 60_000) {
  const retryAfter = new Map<string, number>();
  let lastWinner: { endpoint: string; until: number } | null = null;
  return <T>(options: ProviderOptions<T>): Promise<T> => {
    for (const [endpoint, until] of retryAfter) {
      if (until <= now() || !options.endpoints.includes(endpoint)) retryAfter.delete(endpoint);
    }
    const preferred = lastWinner && lastWinner.until > now() ? lastWinner.endpoint : null;
    const endpoints = [...new Set(options.endpoints)].sort((left, right) =>
      (retryAfter.get(left) ?? 0) - (retryAfter.get(right) ?? 0) ||
      Number(right === preferred) - Number(left === preferred));
    return fetchNearbyMapGeometry({
      ...options, endpoints,
      onAttemptFailure: (endpoint) => {
        retryAfter.set(endpoint, now() + cooldownMs);
        options.onAttemptFailure?.(endpoint);
      },
      onAttemptSuccess: (endpoint) => {
        retryAfter.delete(endpoint);
        lastWinner = { endpoint, until: now() + 5 * 60_000 };
        options.onAttemptSuccess?.(endpoint);
      }
    });
  };
}

/** One total budget; at most two transports, one winner, no partial/empty-on-error success. */
export function fetchNearbyMapGeometry<T>(options: ProviderOptions<T>): Promise<T> {
  return withMapReadDeadline(options.totalMs ?? MAP_PROVIDER_TOTAL_MS, async (signal) => {
    const transport = options.fetch ?? fetch;
    const endpoints = [...new Set(options.endpoints)];
    return new Promise<T>((resolve, reject) => {
      const lifetime = new AbortController();
      const active = new Set<string>();
      let next = 0, finished = false;
      let backupTimer: ReturnType<typeof setTimeout> | undefined;
      const cleanup = () => {
        if (backupTimer !== undefined) clearTimeout(backupTimer);
        backupTimer = undefined;
        signal.removeEventListener("abort", aborted);
        lifetime.abort();
      };
      const fail = (error: unknown) => {
        if (finished) return;
        finished = true; cleanup(); reject(error);
      };
      const aborted = () => {
        // A too-slow stale refresh should move past these mirrors next time.
        // Winner-driven cancellation is different and never penalises a loser.
        active.forEach(endpoint => options.onAttemptFailure?.(endpoint));
        fail(signal.reason);
      };
      const scheduleBackup = () => {
        if (finished || backupTimer !== undefined || active.size !== 1 || next >= endpoints.length) return;
        backupTimer = setTimeout(() => {
          backupTimer = undefined;
          launch();
        }, options.backupDelayMs ?? MAP_PROVIDER_BACKUP_DELAY_MS);
      };
      const launch = () => {
        if (finished || signal.aborted || active.size >= 2 || next >= endpoints.length) return;
        const endpoint = endpoints[next++];
        active.add(endpoint);
        void withMapReadDeadline(options.attemptMs ?? MAP_PROVIDER_ATTEMPT_MS, async (attemptSignal) => {
          const response = await transport(endpoint, {
            method: "POST",
            headers: { "content-type": "text/plain", "user-agent": options.userAgent },
            body: options.body,
            signal: attemptSignal
          });
          attemptSignal.throwIfAborted();
          if (!response.ok) {
            // Close an unused body/connection without waiting for its contents.
            void response.body?.cancel().catch(() => undefined);
            throw new Error("Map provider unavailable.");
          }
          const payload = await response.json();
          attemptSignal.throwIfAborted();
          return options.normalize(payload);
        }, lifetime.signal).then(normalized => {
          if (finished || signal.aborted) return;
          finished = true;
          options.onAttemptSuccess?.(endpoint);
          cleanup(); resolve(normalized);
        }, () => {
          if (finished || signal.aborted) return;
          active.delete(endpoint);
          options.onAttemptFailure?.(endpoint);
          if (backupTimer !== undefined) clearTimeout(backupTimer);
          backupTimer = undefined;
          launch(); // An actual failure should not wait for the backup delay.
          if (active.size === 0) fail(new Error("No map provider returned complete geometry."));
          else scheduleBackup();
        });
        scheduleBackup();
      };
      signal.addEventListener("abort", aborted, { once: true });
      if (signal.aborted) { aborted(); return; }
      launch();
      if (active.size === 0) fail(new Error("No map provider returned complete geometry."));
    });
  }, options.signal);
}
