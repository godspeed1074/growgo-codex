import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadGreatOceanRoadModule() {
  return import(
    path.join(repoRoot, "functions/lib/domain/routes/greatOceanRoad.js")
  );
}

test("Great Ocean Road has one special capture per twenty eligible base pins", async () => {
  const route = await loadGreatOceanRoadModule();

  assert.equal(route.GREAT_OCEAN_ROAD_SPECIAL_PIN_COUNT, 203);
  assert.equal(
    route.isGreatOceanRoadSpecialPin("ggpin:v1:osm-way:770577438:6"),
    true
  );
  assert.equal(
    route.isGreatOceanRoadSpecialPin("ggpin:v1:osm-way:770577438:7"),
    false
  );
});

test("Great Ocean Road completion is awarded only once", async () => {
  const route = await loadGreatOceanRoadModule();
  const now = new Date("2026-09-02T00:00:00.000Z");
  const specialPinIds = route.getGreatOceanRoadSpecialPinIds();

  const completed = route.recordGreatOceanRoadCaptures({
    progress: { capturedPinIds: [], completedAt: null },
    pinIds: [...specialPinIds, specialPinIds[0]],
    now
  });
  assert.equal(completed.capturedCount, 203);
  assert.equal(completed.completedNow, true);
  assert.equal(completed.completedAt.getTime(), now.getTime());

  const repeated = route.recordGreatOceanRoadCaptures({
    progress: completed,
    pinIds: [specialPinIds[0]],
    now: new Date(now.getTime() + 1_000)
  });
  assert.equal(repeated.completedNow, false);
  assert.equal(repeated.capturedCount, 203);
});
