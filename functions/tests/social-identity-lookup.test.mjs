import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { createSocialIdentityLookup } = createRequire(import.meta.url)("../lib/domain/social/socialIdentityLookup.js");

test("social portraits deduplicate peers, cache for a minute, and refresh changes/removals", async () => {
  let now = 100_000, avatarUrl = "first.jpg";
  const calls = [];
  const lookup = createSocialIdentityLookup(async uids => {
    calls.push(uids);
    return new Map(uids.map(uid => [uid, { publicCode: uid, name: "Player", avatarUrl }]));
  }, () => now);
  assert.equal((await lookup(["a", "a", "b"])).get("a").avatarUrl, "first.jpg");
  assert.deepEqual(calls, [["a", "b"]]);
  avatarUrl = "replacement.jpg";
  now += 59_999;
  assert.equal((await lookup(["a"])).get("a").avatarUrl, "first.jpg");
  assert.equal(calls.length, 1);
  now++;
  assert.equal((await lookup(["a"])).get("a").avatarUrl, "replacement.jpg");
  avatarUrl = null;
  now += 60_000;
  assert.equal((await lookup(["a"])).get("a").avatarUrl, null, "removed portraits must not stick forever");
  assert.equal(calls.length, 3);
  await lookup([]);
  assert.equal(calls.length, 3, "empty lists require no profile reads");
});

test("concurrent viewers share in-flight public identity reads; failed reads are retryable", async () => {
  let release, calls = 0;
  const lookup = createSocialIdentityLookup(async uids => {
    calls++;
    await new Promise(resolve => release = resolve);
    return new Map(uids.map(uid => [uid, null]));
  });
  const first = lookup(["a"]), second = lookup(["a"]);
  await Promise.resolve();
  release();
  assert.equal((await first).get("a"), null);
  assert.equal((await second).get("a"), null);
  assert.equal(calls, 1);
  let fail = true;
  const retry = createSocialIdentityLookup(async () => {
    if (fail) throw Error("offline");
    return new Map([["a", null]]);
  });
  await assert.rejects(retry(["a"]), /offline/);
  fail = false;
  assert.equal((await retry(["a"])).get("a"), null);
});

test("identity batches and warm-instance cache remain bounded", async () => {
  const calls = [];
  const lookup = createSocialIdentityLookup(async uids => {
    calls.push(uids);
    return new Map(uids.map(uid => [uid, { publicCode: uid, name: uid, avatarUrl: null }]));
  });
  const result = await lookup(Array.from({ length: 2_100 }, (_, i) => String(i)));
  assert.equal(result.size, 2_100);
  assert.ok(calls.every(batch => batch.length <= 100));
  assert.equal(calls.length, 21);
  await lookup(["2099"]);
  assert.equal(calls.length, 21);
  await lookup(["0"]);
  assert.equal(calls.length, 22, "oldest entry is evicted beyond 2,048 cached identities");
});
