/** Map reads must leave time for authoritative player/world state before Cloud Run's deadline. */
export class MapReadTimeoutError extends Error {
  constructor() {
    super("Map lookup exceeded its time budget.");
    this.name = "MapReadTimeoutError";
  }
}

export function waitForMapOperation<T>(signal: AbortSignal, operation: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) { reject(signal.reason); return; }
    const cleanup = () => signal.removeEventListener("abort", aborted);
    const aborted = () => { cleanup(); reject(signal.reason); };
    signal.addEventListener("abort", aborted, { once: true });
    // Observe late completion/rejection even if the caller has already timed out.
    // A non-cancellable database read must not start another phase afterward.
    Promise.resolve().then(() => {
      signal.throwIfAborted();
      return operation();
    }).then(
      (value) => { cleanup(); resolve(value); },
      (error) => { cleanup(); reject(error); }
    );
  });
}

export async function withMapReadDeadline<T>(
  milliseconds: number,
  operation: (signal: AbortSignal) => Promise<T>,
  parent?: AbortSignal
): Promise<T> {
  const controller = new AbortController();
  const aborted = () => controller.abort(parent?.reason);
  if (parent?.aborted) aborted();
  else parent?.addEventListener("abort", aborted, { once: true });
  const timer = setTimeout(() => controller.abort(new MapReadTimeoutError()), milliseconds);
  try { return await waitForMapOperation(controller.signal, () => operation(controller.signal)); }
  finally {
    clearTimeout(timer);
    parent?.removeEventListener("abort", aborted);
  }
}
