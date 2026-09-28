// HTTP adapter for the localhost-only regional pin-pack sandbox service.
// Refuses non-loopback URLs so the preview cannot accidentally hit a live host.
export function createRegionalPinPackSandboxTransport({baseUrl = 'http://127.0.0.1:57532', fetchImpl = globalThis.fetch} = {}) {
  const base = new URL(baseUrl);
  if (base.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname) ||
      typeof fetchImpl !== 'function') throw new TypeError('Sandbox transport requires a loopback HTTP URL and fetch.');

  async function request(path, options = {}) {
    const response = await fetchImpl(new URL(path, base), {cache: 'no-store', ...options});
    let value;
    try { value = await response.json(); } catch { throw new Error('Sandbox returned an invalid response.'); }
    if (!response.ok) throw new Error(typeof value?.error === 'string' ? value.error : `Sandbox request failed (${response.status}).`);
    return value;
  }

  return Object.freeze({
    getManifest: ({center, radiusKm, knownRevision}) => request('/manifest', {
      method: 'POST', headers: {'content-type': 'application/json'},
      body: JSON.stringify({center, radiusKm, knownRevision})
    }),
    getShard: ({id, revision}) => request(`/shard?id=${encodeURIComponent(id)}&revision=${encodeURIComponent(revision)}`),
    getDelta: ({shardId, catalogVersion, cursor}) => request(`/delta?shardId=${encodeURIComponent(shardId)}&catalogVersion=${encodeURIComponent(catalogVersion)}&cursor=${encodeURIComponent(cursor ?? '')}`)
  });
}
