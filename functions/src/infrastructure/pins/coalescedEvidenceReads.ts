/** Share only pending reads. Completed snapshots are never cached. */
export function createCoalescedEvidenceReads<Input, Output>(
  keyOf: (input: Input) => string,
  load: (inputs: Input[]) => Promise<Output[]>,
  maxPending = 2_000
) {
  const pending = new Map<string, Promise<Output>>();
  return async (inputs: Input[]): Promise<Output[]> => {
    const selected = new Map<string, Promise<Output>>();
    const missing = new Map<string, Input>();
    for (const input of inputs) {
      const key = keyOf(input), active = pending.get(key);
      if (active) selected.set(key, active);
      else missing.set(key, input);
    }
    if (missing.size) {
      const keys = [...missing.keys()];
      const batch = Promise.resolve().then(() => load([...missing.values()])).then(results => {
        if (results.length !== keys.length) throw new Error('Incomplete evidence read');
        return results;
      });
      keys.forEach((key, index) => {
        const result = batch.then(results => results[index]).finally(() => {
          if (pending.get(key) === result) pending.delete(key);
        });
        selected.set(key, result);
        if (pending.size < maxPending) pending.set(key, result);
      });
    }
    return Promise.all(inputs.map(input => selected.get(keyOf(input))!));
  };
}
