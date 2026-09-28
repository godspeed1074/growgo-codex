import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { createMarketSetupGuard } = require('../lib/domain/market/marketSetupGuard.js');

test('completed setup is reused, expires and never caches stock', async () => {
  let calls = 0, time = 100;
  const guard = createMarketSetupGuard(async () => { calls++; return true; }, () => time, 1000);
  await guard(); await guard();
  assert.equal(calls, 1);
  time = 1100; await guard();
  assert.equal(calls, 2);
});

test('concurrent setup checks share one committed result', async () => {
  let calls = 0, release;
  const guard = createMarketSetupGuard(() => {
    calls++;
    return new Promise(resolve => { release = resolve; });
  });
  const requests = Array.from({ length: 20 }, () => guard());
  await Promise.resolve();
  assert.equal(calls, 1);
  release(true); await Promise.all(requests); await guard();
  assert.equal(calls, 1);
});

test('fresh seed and failed checks are not remembered as complete', async () => {
  let calls = 0;
  const guard = createMarketSetupGuard(async () => {
    calls++;
    if (calls === 1) throw new Error('transaction failed');
    return calls > 2;
  });
  await assert.rejects(guard(), /transaction failed/);
  await guard(); await guard(); await guard();
  assert.equal(calls, 3);
});

test('mail reads still verify access; mutation actions retain activity gate', async () => {
  const sessions = require('../lib/domain/players/activeDeviceSession.js');
  const security = require('../lib/security/requireAuthenticated.js');
  const invites = require('../lib/security/requireInvitedUserAccess.js');
  const original = { ...sessions }, originalSecurity = { ...security }, originalInvites = { ...invites };
  const seen = [];
  try {
    security.requireAuthenticated = () => ({ uid: 'test-player' });
    security.requireAppCheckIfEnabled = () => {};
    invites.requireInvitedUserAccess = () => {};
    sessions.verifyActiveDeviceSessionIfEnabled = async args => { seen.push(['read', args]); throw new Error('access checked'); };
    sessions.requireActiveDeviceSessionIfEnabled = async args => { seen.push(['mutation', args]); throw new Error('access checked'); };
    const { playerMailHandler } = require('../lib/api/playerMail.js');
    for (const action of ['badge', 'list', 'collect', 'deployMailbox', 'packMailbox']) {
      await assert.rejects(playerMailHandler({ auth: { token: { email_verified: true } }, data: { action, deviceId: 'device' } }), /access checked/);
    }
    assert.deepEqual(seen.map(([mode]) => mode), ['read', 'read', 'mutation', 'mutation', 'mutation']);
    assert.ok(seen.every(([, args]) => args.uid === 'test-player' && args.deviceId === 'device'));
  } finally {
    Object.assign(sessions, original); Object.assign(security, originalSecurity); Object.assign(invites, originalInvites);
  }
});

test('scarecrow snapshot uses verification, deployment and settings retain mutation gates', () => {
  const source = readFileSync(new URL('../src/api/alphaBinglesScarecrowDeployment.ts', import.meta.url), 'utf8');
  const snapshot = source.split('export async function getActiveBinglesScarecrowsHandler')[1].split('export async function updateAlphaBinglesScarecrowSettingsHandler')[0];
  assert.match(snapshot, /await verifyActiveDeviceSessionIfEnabled\(/);
  assert.doesNotMatch(snapshot, /await requireActiveDeviceSessionIfEnabled\(/);
  assert.equal((source.match(/await requireActiveDeviceSessionIfEnabled\(/g) || []).length, 2);
});
