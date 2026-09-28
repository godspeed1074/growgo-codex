import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadLifecycle() {
  return import(path.join(repoRoot, "functions/lib/domain/world/cropLifecycle.js"));
}

test("a crop stays harvestable for exactly seven days after it reaches level four", async () => {
  const lifecycle = await loadLifecycle();
  const harvestOpensAt = new Date("2026-09-01T00:00:00.000Z");
  const plant = {
    seedId: "corn_seed",
    plantedAt: new Date(harvestOpensAt.getTime() - (lifecycle.CROP_STAGE_MILLISECONDS * 3)),
    miracleGrownAt: null
  };

  const window = lifecycle.getCropHarvestWindow(plant);
  assert.equal(window.opensAt.toISOString(), harvestOpensAt.toISOString());
  assert.equal(
    window.closesAt.getTime() - window.opensAt.getTime(),
    lifecycle.CROP_STAGE_MILLISECONDS
  );
  assert.equal(lifecycle.isCropHarvestActive(plant, window.opensAt), true);
  assert.equal(
    lifecycle.isCropHarvestActive(plant, new Date(window.closesAt.getTime() - 1)),
    true
  );
  assert.equal(lifecycle.isCropHarvestActive(plant, window.closesAt), false);
});

test("Miracle Grow opens a fresh seven-day harvest window immediately", async () => {
  const lifecycle = await loadLifecycle();
  const miracleGrownAt = new Date("2026-09-01T10:15:00.000Z");
  const plant = {
    seedId: "sugar_cane_seed",
    plantedAt: new Date("2026-08-31T10:15:00.000Z"),
    miracleGrownAt
  };

  const window = lifecycle.getCropHarvestWindow(plant);
  assert.equal(window.opensAt.toISOString(), miracleGrownAt.toISOString());
  assert.equal(lifecycle.isCropHarvestActive(plant, miracleGrownAt), true);
  assert.equal(
    lifecycle.isCropHarvestActive(plant, new Date(miracleGrownAt.getTime() + lifecycle.CROP_STAGE_MILLISECONDS)),
    false
  );
});
