import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadWaterClassifier() {
  return import(
    path.join(repoRoot, "functions/lib/domain/pins/waterPinClassifier.js")
  );
}

function makePin(latitude, longitude) {
  return {
    pinId: `ggpin:v1:osm-way:123456789:${Math.round(latitude * 1e6)}`,
    generatorVersion: 1,
    sourceType: "osm-way",
    sourceId: "123456789",
    positionIndex: 0,
    segmentIndex: 0,
    latitude,
    longitude,
    distanceAlongWayMetres: 0
  };
}

test("water classification marks road pins inside mapped water and within the 50m shoreline range", async () => {
  const water = await loadWaterClassifier();
  const river = {
    orderedCoordinates: [
      { latitude: -38.5000, longitude: 145.2000 },
      { latitude: -38.4900, longitude: 145.2000 }
    ],
    closed: false
  };
  const nearby = makePin(-38.4950, 145.2002);
  const distant = makePin(-38.4950, 145.2012);
  const lake = {
    orderedCoordinates: [
      { latitude: -38.5100, longitude: 145.2100 },
      { latitude: -38.5100, longitude: 145.2120 },
      { latitude: -38.5080, longitude: 145.2120 },
      { latitude: -38.5080, longitude: 145.2100 },
      { latitude: -38.5100, longitude: 145.2100 }
    ],
    closed: true
  };
  const insideLake = makePin(-38.5090, 145.2110);

  assert.equal(water.WATER_PIN_DISTANCE_METRES, 50);
  assert.deepEqual(
    water.classifyCanonicalPinsByWater(
      [nearby, distant, insideLake],
      [river, lake]
    ).map((pin) => pin.type),
    ["water", "base", "water"]
  );
});
