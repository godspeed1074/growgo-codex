import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const require = createRequire(import.meta.url);
const { T1_BIRD_QUESTS, advanceBirdRun, chooseT1Offers, rollT1Reward, BIRD_CARD_POOL } = require("../lib/domain/quests/t1BirdQuests.js");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const run = (questId = T1_BIRD_QUESTS[0].id) => ({ schemaVersion: 1, id: "run", uid: "owner", birdId: "dove", questId,
  acceptedAt: 100, status: "active", seen: [], completedAt: null, reward: null });

test("approved six objectives and minimum ten distinct base pins", () => {
  assert.equal(T1_BIRD_QUESTS.length, 6);
  assert.equal(chooseT1Offers({ base: Array(10).fill("same") }, false).length, 0);
  assert.equal(chooseT1Offers({ base: Array.from({ length: 9 }, (_, i) => `${i}`) }, false).length, 0);
  assert.equal(chooseT1Offers({ base: Array.from({ length: 10 }, (_, i) => `${i}`) }, false)[0].target, 10);
  assert.equal(chooseT1Offers({}, true)[0].kind, "craft");
});
test("progress ignores old, future, wrong-player, wrong-kind and repeated actions", () => {
  const action = { uid: "owner", id: "pin", at: 110, kind: "base" };
  const next = advanceBirdRun(run(), [action, action, { ...action, uid: "other", id: "x" },
    { ...action, at: 99, id: "old" }, { ...action, at: 201, id: "future" }, { ...action, kind: "water", id: "water" }], 200);
  assert.deepEqual(next.seen, ["pin"]);
  assert.deepEqual(advanceBirdRun(next, [action], 200), next);
  const done = advanceBirdRun(next, Array.from({ length: 9 }, (_, i) => ({ ...action, id: `${i}` })), 200);
  assert.equal(done.status, "reward-pending"); assert.equal(done.seen.length, 10);
  assert.equal(advanceBirdRun(done, [], 300), done);
});
test("flour only, no arbitrary craft or client-supplied quantities", () => {
  const flour = run(T1_BIRD_QUESTS[5].id), action = { uid: "owner", id: "craft", at: 120, kind: "craft" };
  assert.equal(advanceBirdRun(flour, [{ ...action, recipeId: "sugar" }], 200).status, "active");
  assert.equal(advanceBirdRun(flour, [{ ...action, recipeId: "flour" }], 200).status, "reward-pending");
});
test("rewards have four items, 100 points/XP, separate card and rarity rolls", () => {
  assert.equal(BIRD_CARD_POOL.length, 104);
  const ozIds = JSON.parse(readFileSync(resolve(root, "assets/cards/land-of-oz/manifest.json"), "utf8")).cards.map((card) => card.id);
  assert.deepEqual(BIRD_CARD_POOL.filter((id) => id.startsWith("land_of_oz_")), ozIds);
  let rolls = [0, 0, 0, 0, 9, 24, 9];
  const rare = rollT1Reward(() => rolls.shift());
  assert.deepEqual(rare, { points: 100, xp: 100, items: { corn: 2, corn_seed: 2 }, card: { cardId: "fish-001", rarity: "rare" } });
  rolls = [0, 0, 0, 0, 10]; assert.equal(rollT1Reward(() => rolls.shift()).card, null);
  rolls = [0, 0, 0, 0, 0, 0, 10]; assert.equal(rollT1Reward(() => rolls.shift()).card.rarity, "common");
});
