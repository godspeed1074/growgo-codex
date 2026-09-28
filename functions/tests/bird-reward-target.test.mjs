import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { planBirdRewardTarget: plan } = createRequire(import.meta.url)('../lib/domain/quests/birdRewardTarget.js');
const owner = { schemaVersion: 1, uid: 'owner', bird: { id: 'alpha-dove-owner', level: 1, xp: 90, questsCompleted: 2 } };
const earned = { schemaVersion: 1, uid: 'owner', id: 'earned', species: 'dove', level: 1, xp: 10, questsCompleted: 0 };
test('earned bird receives progress without changing legacy bird', () => {
  const before = structuredClone(owner);
  const result = plan('owner', 'earned', owner, earned, 100);
  assert.equal(result.legacy, false);
  assert.deepEqual(result.stats, { xp: 110, questsCompleted: 1 });
  assert.deepEqual(owner, before);
});
test('existing test bird retains its reward route and stats', () => {
  const result = plan('owner', 'alpha-dove-owner', owner, undefined, 100);
  assert.equal(result.legacy, true);
  assert.deepEqual(result.stats, { xp: 190, questsCompleted: 3 });
});
test('earned bird works when owner has no legacy bird', () => {
  assert.equal(plan('owner', 'earned', { ...owner, bird: null }, earned, 100).stats.xp, 110);
});
test('wrong owner, missing bird and malformed counters fail closed', () => {
  for (const value of [undefined, { ...earned, uid: 'other' }, { ...earned, id: 'other' },
    { ...earned, xp: -1 }, { ...earned, questsCompleted: NaN }, { ...earned, xp: Number.MAX_SAFE_INTEGER }]) {
    assert.throws(() => plan('owner', 'earned', owner, value, 100));
  }
  assert.throws(() => plan('owner', 'earned', { ...owner, uid: 'other' }, earned, 100));
});
