import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getPewPewCropHarvestResource } = require("../lib/api/fireAlphaPewPewBeam.js");
const day = 86_400_000;
const plantedAt = new Date("2026-08-01T12:00:00Z");
const plant = { seedId: "wheat_seed", plantedAt, miracleGrownAt: null };
const after = elapsed => new Date(plantedAt.getTime() + elapsed);

test("Pew-Pew crops use the normal 21-day growth and seven-day harvest window", () => {
  for (const age of [0, day, 8 * day, 15 * day, 21 * day - 1, 28 * day, 29 * day]) {
    assert.equal(getPewPewCropHarvestResource(plant, after(age)), null, `age ${age}`);
  }
  assert.equal(getPewPewCropHarvestResource(plant, after(21 * day)), "wheat");
  assert.equal(getPewPewCropHarvestResource(plant, after(28 * day - 1)), "wheat");
  assert.equal(getPewPewCropHarvestResource(null, after(22 * day)), null);
});

test("Pew-Pew honors Miracle Grow immediately and stops at its seven-day expiry", () => {
  const miracleGrownAt = after(60_000);
  const miraclePlant = { ...plant, miracleGrownAt };
  assert.equal(getPewPewCropHarvestResource(miraclePlant, after(59_999)), null);
  assert.equal(getPewPewCropHarvestResource(miraclePlant, miracleGrownAt), "wheat");
  assert.equal(getPewPewCropHarvestResource(miraclePlant, after(60_000 + 7 * day - 1)), "wheat");
  assert.equal(getPewPewCropHarvestResource(miraclePlant, after(60_000 + 7 * day)), null);
});

test("Pew-Pew never grants a second resource for an existing same-day receipt", () => {
  const now = after(22 * day);
  assert.equal(getPewPewCropHarvestResource(plant, now, "2026-08-23"), null);
  assert.equal(getPewPewCropHarvestResource(plant, now, "2026-08-22"), "wheat");
  assert.equal(getPewPewCropHarvestResource(plant, now, undefined), "wheat");
});

test("Pew-Pew crop resources match the ordinary capture mappings", () => {
  for (const [seedId, itemId] of Object.entries({
    wheat_seed: "wheat", corn_seed: "corn", sugar_cane_seed: "sugar_cane",
    tomato_seed: "tomato", cocoa_bean_seed: "cocoa_beans"
  })) {
    assert.equal(getPewPewCropHarvestResource({ ...plant, seedId }, after(22 * day)), itemId);
  }
});
