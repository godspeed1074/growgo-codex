import { AsyncLocalStorage } from "node:async_hooks";

type Pilot = { expiresAt: number; now: () => number; active: boolean };
const context = new AsyncLocalStorage<Pilot>();
/** Server-configured, one-account pilot. Never accepts a client feature flag. */
export async function withMapPreparationPilot<T>(uid: string | undefined, run: () => Promise<T>, options: {
  env?: NodeJS.ProcessEnv; now?: () => number
} = {}): Promise<T> {
  const env = options.env ?? process.env, now = options.now ?? Date.now;
  const expiresAt = Date.parse(env.GROWGO_MAP_PREPARATION_PILOT_EXPIRES_AT ?? "");
  const enabled = env.GROWGO_PERSIST_PREPARED_MAP_HINTS === "true" && !!uid &&
    uid === env.GROWGO_MAP_PREPARATION_PILOT_UID &&
    env.GROWGO_MAP_COST_PROBE_ENABLED === "true" && uid === env.GROWGO_MAP_COST_PROBE_UID &&
    Number.isFinite(expiresAt) && expiresAt > now() && expiresAt - now() <= 3_600_000;
  // Explicitly shadow any outer context even for an ineligible request.
  const state = { expiresAt, now, active: enabled };
  return context.run(state, async () => {
    try { return await run(); } finally { state.active = false; }
  });
}
export function canPersistMapPreparation(): boolean {
  const state = context.getStore();
  return !!state?.active && state.now() < state.expiresAt;
}
