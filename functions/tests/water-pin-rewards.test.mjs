import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  ".."
);

async function loadRewards() {
  return import(
    path.join(repoRoot, "functions/lib/domain/pins/waterPinRewards.js")
  );
}

async function loadFishSpawns() {
  return import(
    path.join(repoRoot, "functions/lib/domain/pins/waterFishSpawns.js")
  );
}

test("water pins always grant water and only an active fish grants a fish reward", async () => {
  const { getWaterPinCaptureRewards } = await loadRewards();
  const withoutFish = getWaterPinCaptureRewards(false);
  const withFish = getWaterPinCaptureRewards(true);

  assert.deepEqual(withoutFish, { water: 1, fish: null });
  assert.deepEqual(withFish, { water: 1, fish: "blue" });
});

test("water-fish spawns use 12-hour cycles and captured fish stay absent for that cycle", async () => {
  const {
    WATER_FISH_LIFETIME_MILLISECONDS,
    getWaterFishCycle,
    isCycleWaterFish,
    resolveWaterFishActivity
  } = await loadFishSpawns();
  const beforeNoon = new Date("2026-08-29T11:59:59.000Z");
  const atNoon = new Date("2026-08-29T12:00:00.000Z");
  const firstCycle = getWaterFishCycle(beforeNoon);
  const secondCycle = getWaterFishCycle(atNoon);

  assert.equal(
    firstCycle.expiresAt.getTime() - firstCycle.spawnedAt.getTime(),
    WATER_FISH_LIFETIME_MILLISECONDS
  );
  assert.notEqual(firstCycle.key, secondCycle.key);

  const pins = Array.from(
    { length: 1_000 },
    (_, index) => `ggpin-v1-osm-way-${index + 1}-0`
  );
  const fishFirstCycle = pins.filter((pinId) => isCycleWaterFish(pinId, firstCycle));
  const fishSecondCycle = pins.filter((pinId) => isCycleWaterFish(pinId, secondCycle));

  assert.ok(fishFirstCycle.length > 0, "expected at least one fish in the sample");
  assert.notDeepEqual(fishSecondCycle, fishFirstCycle);

  const captured = resolveWaterFishActivity({
    pinId: fishFirstCycle[0],
    cycle: firstCycle,
    value: {
      schemaVersion: 1,
      pinId: fishFirstCycle[0],
      cycleKey: firstCycle.key,
      state: "captured",
      source: "capture",
      spawnedAt: firstCycle.spawnedAt,
      expiresAt: firstCycle.expiresAt,
      updatedAt: firstCycle.spawnedAt
    }
  });
  assert.equal(captured.active, false);
});
