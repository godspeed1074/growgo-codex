import { AsyncLocalStorage } from 'node:async_hooks';

const counters = ['response_hit', 'response_miss', 'geometry_reads', 'geometry_writes',
  'provider_fetches', 'prepared_pins', 'prepared_sources', 'classification_reads',
  'owned_query_documents', 'owned_visible_documents', 'returned_pins',
  'preparation_persist_attempts', 'preparation_persist_reads',
  'preparation_persist_write_attempts', 'preparation_persist_saved',
  'preparation_persist_conflicts'] as const;
type Counter = typeof counters[number];
type Probe = { counts: Partial<Record<Counter, number>>; closed: boolean };
const context = new AsyncLocalStorage<Probe>();

export function countMapCost(name: Counter, amount = 1): void {
  const probe = context.getStore();
  if (!probe || probe.closed || !counters.includes(name) || !Number.isSafeInteger(amount) || amount < 0) return;
  probe.counts[name] = Math.min(1_000_000, (probe.counts[name] ?? 0) + amount);
}

/** Observational only: no database calls, identities, coordinates or request data in logs. */
export async function withMapCostProbe<T>(uid: string | undefined, run: () => Promise<T>, options: {
  env?: NodeJS.ProcessEnv; now?: () => number; emit?: (record: unknown) => void;
} = {}): Promise<T> {
  const env = options.env ?? process.env;
  if (env.GROWGO_MAP_COST_PROBE_ENABLED !== 'true' || !uid ||
      !env.GROWGO_MAP_COST_PROBE_UID || uid !== env.GROWGO_MAP_COST_PROBE_UID) return run();
  const clock = options.now ?? Date.now;
  const started = clock();
  const probe: Probe = { counts: {}, closed: false };
  return context.run(probe, async () => {
    let outcome = 'error';
    try {
      const result = await run();
      outcome = 'success';
      return result;
    } finally {
      probe.closed = true;
      try {
        (options.emit ?? (record => console.info(JSON.stringify(record))))({
          component: 'map_cost_probe', version: 1, outcome,
          elapsedMs: Math.max(0, clock() - started), counts: probe.counts
        });
      } catch { /* Telemetry must never break gameplay or mask its error. */ }
    }
  });
}
