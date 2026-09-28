import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { createGetPlayerSnapshotHandler } = require('../lib/api/getPlayerSnapshot.js');

test('snapshot session rejection prevents player read and forwards actual identity', async () => {
  let read = false, checked;
  const denied = new Error('session rejected');
  const handler = createGetPlayerSnapshotHandler({
    requireInvitedUserAccess() {},
    requireDevelopmentCapabilityAccess() {},
    requireOperationalSafeguardAccess() {},
    async checkActiveSession(value) { checked = value; throw denied; },
    async readPlayer() { read = true; throw new Error('must not read'); }
  });
  await assert.rejects(handler({ auth: { uid: 'test-owner', token: {} }, data: { deviceId: 'test-device' } }), error => error === denied);
  assert.deepEqual(checked, { uid: 'test-owner', deviceId: 'test-device' });
  assert.equal(read, false);
});

test('production factories retain real security defaults, not permissive test substitutes', () => {
  const snapshot = readFileSync(new URL('../src/api/getPlayerSnapshot.ts', import.meta.url), 'utf8');
  const bootstrap = readFileSync(new URL('../src/api/bootstrapPlayer.ts', import.meta.url), 'utf8');
  assert.match(snapshot, /checkActiveSession: requireActiveDeviceSessionIfEnabled/);
  assert.match(bootstrap, /establishActiveSession: establishActiveDeviceSessionIfEnabled/);
  assert.match(snapshot, /createGetPlayerSnapshotHandler\(\)/);
  assert.match(bootstrap, /createBootstrapPlayerHandler\(\)/);
});
