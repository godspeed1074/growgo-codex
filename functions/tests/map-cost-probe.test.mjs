import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { countMapCost, withMapCostProbe } = require('../lib/infrastructure/pins/mapCostProbe.js');
const env = { GROWGO_MAP_COST_PROBE_ENABLED: 'true', GROWGO_MAP_COST_PROBE_UID: 'test-owner' };

test('disabled, missing identity and other players emit nothing', async () => {
  const logs = [];
  for (const [uid, flags] of [['test-owner', {}], ['other', env], [undefined, env], ['test-owner', { GROWGO_MAP_COST_PROBE_ENABLED: 'true' }]]) {
    assert.equal(await withMapCostProbe(uid, async () => { countMapCost('geometry_reads'); return 42; }, { env: flags, emit: v => logs.push(v) }), 42);
  }
  assert.deepEqual(logs, []);
});
test('concurrent requests stay isolated with only bounded allowlisted fields', async () => {
  const logs = [];
  await Promise.all([2, 7].map(n => withMapCostProbe('test-owner', async () => {
    await new Promise(resolve => setTimeout(resolve, n));
    countMapCost('geometry_reads', n);
    countMapCost('secret-coordinate', 1);
    countMapCost('returned_pins', -1);
  }, { env, emit: v => logs.push(v) })));
  assert.deepEqual(logs.map(v => v.counts.geometry_reads).sort((a,b) => a-b), [2,7]);
  assert.ok(logs.every(v => v.outcome === 'success' && Object.keys(v.counts).length === 1));
  assert.equal(JSON.stringify(logs).includes('test-owner'), false);
});
test('telemetry cannot change success or mask original errors', async () => {
  const failure = new Error('original failure');
  const options = { env, emit() { throw new Error('logger failed'); } };
  assert.equal(await withMapCostProbe('test-owner', async () => 'ok', options), 'ok');
  await assert.rejects(withMapCostProbe('test-owner', async () => { throw failure; }, options), error => error === failure);
});
test('late background work cannot mutate completed log entries', async () => {
  const logs = []; let late;
  await withMapCostProbe('test-owner', async () => {
    countMapCost('response_hit');
    late = new Promise(resolve => setTimeout(() => { countMapCost('geometry_reads'); resolve(); }, 10));
  }, { env, emit: v => logs.push(v) });
  await late;
  assert.deepEqual(logs[0].counts, { response_hit: 1 });
});
