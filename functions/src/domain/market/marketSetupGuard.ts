/** Warm-instance optimisation for immutable setup markers, never stock or prices.
 * The loader must resolve true only after every migration has committed.
 */
export function createMarketSetupGuard(load: () => Promise<boolean>, now = Date.now, ttlMs = 300_000) {
  let validUntil = 0;
  let pending: Promise<void> | undefined;
  return async (): Promise<void> => {
    if (now() < validUntil) return;
    if (!pending) {
      pending = Promise.resolve().then(load).then(complete => {
        if (complete) validUntil = now() + ttlMs;
      }).finally(() => { pending = undefined; });
    }
    await pending;
  };
}
