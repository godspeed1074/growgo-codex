// Preview-only transport queue. Not enabled by the live map.
// enqueue receives evidence captured while the pin was actually in range.
export function createAutoCaptureBatcher({send, onResult, onError = () => {}, now = Date.now,
  setTimer = setTimeout, clearTimer = clearTimeout, maxAgeMs = 15000}) {
  const pending = new Map();
  const inFlight = new Set();
  let timer = null, busy = false, stopped = false;
  function arm() {
    if (!stopped && !busy && pending.size && timer === null)
      timer = setTimer(() => { timer = null; void flush(); }, 500);
  }
  async function flush() {
    if (stopped || busy) return;
    if (timer !== null) { clearTimer(timer); timer = null; }
    const entries = [];
    for (const [id, item] of pending) {
      pending.delete(id);
      if (now() - Date.parse(item.clientCapturedAt) > maxAgeMs) {
        onError(new Error('Capture evidence expired'), item); continue;
      }
      entries.push(item); inFlight.add(id);
      if (entries.length === 10) break;
    }
    if (!entries.length) return;
    busy = true;
    try {
      const response = await send({captures: entries.map(({retried, ...evidence}) => evidence)});
      if (!Array.isArray(response?.results) || response.results.length !== entries.length ||
          response.results.some((r, i) => r.requestId !== entries[i].requestId))
        throw new Error('Incomplete batch response');
      response.results.forEach((result, i) => onResult(result, entries[i]));
    } catch (error) {
      // Keep the same per-pin request IDs/evidence: never mint a second reward
      // request when the first response was lost. Retry at most once.
      for (const item of entries) {
        if (!stopped && !item.retried && now() - Date.parse(item.clientCapturedAt) <= maxAgeMs)
          pending.set(item.pinId, {...item, retried: true});
        else onError(error, item);
      }
    } finally {
      entries.forEach(item => inFlight.delete(item.pinId)); busy = false; arm();
    }
  }
  return {
    enqueue(evidence) {
      if (stopped || pending.has(evidence.pinId) || inFlight.has(evidence.pinId)) return false;
      const age = now() - Date.parse(evidence.clientCapturedAt);
      if (!evidence.requestId || !evidence.pinId || !Number.isFinite(age) || age < -1000 || age > maxAgeMs) return false;
      // Snapshot coordinates; a moving GPS fix must not rewrite queued evidence.
      pending.set(evidence.pinId, {...evidence});
      if (pending.size >= 10 && !busy) void flush(); else arm();
      return true;
    },
    stop() { stopped = true; pending.clear(); if (timer !== null) clearTimer(timer); timer = null; },
    flush
  };
}
