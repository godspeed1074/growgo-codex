import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const earthRadiusMetres = 6371008.8;

async function loadGeneratorModule() {
  return import(
    path.join(repoRoot, "functions/lib/domain/pins/canonicalPinGenerator.js")
  );
}

async function loadTypeModule() {
  return import(
    path.join(repoRoot, "functions/lib/domain/pins/basePinTypes.js")
  );
}

function metresToLatitudeDegrees(metres) {
  return (metres / earthRadiusMetres) * (180 / Math.PI);
}

function metresToLongitudeDegreesAtLatitude(metres, latitudeDegrees) {
  return (
    (metres / (earthRadiusMetres * Math.cos((latitudeDegrees * Math.PI) / 180))) *
    (180 / Math.PI)
  );
}

function makeNorthingCoordinate(origin, northMetres) {
  return {
    latitude: origin.latitude + metresToLatitudeDegrees(northMetres),
    longitude: origin.longitude
  };
}

function makeEastingCoordinate(origin, eastMetres) {
  return {
    latitude: origin.latitude,
    longitude:
      origin.longitude +
      metresToLongitudeDegreesAtLatitude(eastMetres, origin.latitude)
  };
}

function buildWaySource({ sourceId, coordinates }) {
  return {
    generatorVersion: 1,
    sourceType: "osm-way",
    sourceId,
    orderedCoordinates: coordinates,
    spacingMetres: 50
  };
}

function mergeByPinId(...pinSets) {
  const merged = new Map();
  for (const pinSet of pinSets) {
    for (const pin of pinSet) {
      merged.set(pin.pinId, pin);
    }
  }
  return [...merged.values()].sort((a, b) => a.pinId.localeCompare(b.pinId));
}

test("canonical generator is deterministic, pure, and independent of browser or Firebase globals", async () => {
  const generator = await loadGeneratorModule();
  const origin = { latitude: 0, longitude: 0 };
  const source = buildWaySource({
    sourceId: "123456789",
    coordinates: [origin, makeNorthingCoordinate(origin, 120)]
  });

  const first = generator.generateCanonicalPinsForWay(source);
  const second = generator.generateCanonicalPinsForWay(source);

  assert.deepEqual(first, second);

  const sourceText = fs.readFileSync(
    path.join(repoRoot, "functions/src/domain/pins/canonicalPinGenerator.ts"),
    "utf8"
  );
  assert.doesNotMatch(sourceText, /\bfetch\s*\(/);
  assert.doesNotMatch(sourceText, /\bfirebase-admin\b/);
  assert.doesNotMatch(sourceText, /\bwindow\b/);
  assert.doesNotMatch(sourceText, /\bdocument\b/);
});

test("canonical v1 source validation accepts exactly 50 metre spacing and rejects non-canonical spacing values", async () => {
  const generator = await loadGeneratorModule();
  const origin = { latitude: 0, longitude: 0 };
  const coordinates = [origin, makeNorthingCoordinate(origin, 120)];

  const acceptedPins = generator.generateCanonicalPinsForWay(
    buildWaySource({
      sourceId: "123456788",
      coordinates
    })
  );
  assert.ok(acceptedPins.length >= 2);

  for (const spacingMetres of [46, 49, 49.999, 50.001, 51, -50, 0]) {
    assert.throws(
      () =>
        generator.generateCanonicalPinsForWay({
          generatorVersion: 1,
          sourceType: "osm-way",
          sourceId: "123456788",
          orderedCoordinates: coordinates,
          spacingMetres
        }),
      /spacing must remain locked to 50 metres/
    );
  }

  assert.throws(
    () =>
      generator.generateCanonicalPinsForWay({
        generatorVersion: 1,
        sourceType: "osm-way",
        sourceId: "123456788",
        orderedCoordinates: coordinates,
        spacingMetres: "50"
      }),
    /spacing must remain locked to 50 metres/
  );

  assert.throws(
    () =>
      generator.generateCanonicalPinsForWay({
        generatorVersion: 1,
        sourceType: "osm-way",
        sourceId: "123456788",
        orderedCoordinates: coordinates
      }),
    /spacing must remain locked to 50 metres/
  );

  assert.throws(
    () =>
      generator.generateCanonicalPinsForWay({
        generatorVersion: 1,
        sourceType: "osm-way",
        sourceId: "123456788",
        orderedCoordinates: coordinates,
        spacingMetres: Number.NaN
      }),
    /spacing must remain locked to 50 metres/
  );

  assert.throws(
    () =>
      generator.generateCanonicalPinsForWay({
        generatorVersion: 1,
        sourceType: "osm-way",
        sourceId: "123456788",
        orderedCoordinates: coordinates,
        spacingMetres: Number.POSITIVE_INFINITY
      }),
    /spacing must remain locked to 50 metres/
  );
});

test("straight ways start at positionIndex 0 and place pins every 50 metres along the full way", async () => {
  const generator = await loadGeneratorModule();
  const origin = { latitude: 0, longitude: 0 };
  const source = buildWaySource({
    sourceId: "123456789",
    coordinates: [origin, makeNorthingCoordinate(origin, 120)]
  });

  const pins = generator.generateCanonicalPinsForWay(source);
  assert.equal(pins.length, 3);
  assert.deepEqual(
    pins.map((pin) => ({
      pinId: pin.pinId,
      positionIndex: pin.positionIndex,
      distanceAlongWayMetres: pin.distanceAlongWayMetres
    })),
    [
      {
        pinId: "ggpin:v1:osm-way:123456789:0",
        positionIndex: 0,
        distanceAlongWayMetres: 0
      },
      {
        pinId: "ggpin:v1:osm-way:123456789:1",
        positionIndex: 1,
        distanceAlongWayMetres: 50
      },
      {
        pinId: "ggpin:v1:osm-way:123456789:2",
        positionIndex: 2,
        distanceAlongWayMetres: 100
      }
    ]
  );
});

test("multi-segment ways carry spacing remainder across segment boundaries without restarting", async () => {
  const generator = await loadGeneratorModule();
  const origin = { latitude: 0, longitude: 0 };
  const source = buildWaySource({
    sourceId: "123456790",
    coordinates: [
      origin,
      makeNorthingCoordinate(origin, 30),
      makeNorthingCoordinate(origin, 60)
    ]
  });

  const pins = generator.generateCanonicalPinsForWay(source);
  assert.equal(pins.length, 2);
  assert.equal(pins[0].positionIndex, 0);
  assert.equal(pins[1].positionIndex, 1);
  assert.equal(pins[1].segmentIndex, 1);
  assert.equal(pins[1].distanceAlongWayMetres, 50);
});

test("short ways still produce the starting canonical pin and exact 50/100/150 metre boundaries produce endpoint pins", async () => {
  const generator = await loadGeneratorModule();
  const origin = { latitude: 0, longitude: 0 };

  const shortWayPins = generator.generateCanonicalPinsForWay(
    buildWaySource({
      sourceId: "123456791",
      coordinates: [origin, makeNorthingCoordinate(origin, 20)]
    })
  );
  assert.equal(shortWayPins.length, 1);
  assert.equal(shortWayPins[0].positionIndex, 0);
  assert.equal(shortWayPins[0].distanceAlongWayMetres, 0);

  const exact50Pins = generator.generateCanonicalPinsForWay(
    buildWaySource({
      sourceId: "123456792",
      coordinates: [origin, makeNorthingCoordinate(origin, 50)]
    })
  );
  assert.equal(exact50Pins.length, 2);
  assert.equal(exact50Pins[1].distanceAlongWayMetres, 50);

  const exact100Pins = generator.generateCanonicalPinsForWay(
    buildWaySource({
      sourceId: "123456793",
      coordinates: [origin, makeNorthingCoordinate(origin, 100)]
    })
  );
  assert.equal(exact100Pins.length, 3);
  assert.equal(exact100Pins[2].distanceAlongWayMetres, 100);

  const exact150Pins = generator.generateCanonicalPinsForWay(
    buildWaySource({
      sourceId: "123456801",
      coordinates: [origin, makeNorthingCoordinate(origin, 150)]
    })
  );
  assert.equal(exact150Pins.length, 4);
  assert.deepEqual(
    exact150Pins.map((pin) => pin.distanceAlongWayMetres),
    [0, 50, 100, 150]
  );

  const exact46Pins = generator.generateCanonicalPinsForWay(
    buildWaySource({
      sourceId: "123456802",
      coordinates: [origin, makeNorthingCoordinate(origin, 46)]
    })
  );
  assert.equal(exact46Pins.length, 1);
  assert.equal(exact46Pins[0].distanceAlongWayMetres, 0);

  const exact92Pins = generator.generateCanonicalPinsForWay(
    buildWaySource({
      sourceId: "123456803",
      coordinates: [origin, makeNorthingCoordinate(origin, 92)]
    })
  );
  assert.equal(exact92Pins.length, 2);
  assert.deepEqual(
    exact92Pins.map((pin) => pin.distanceAlongWayMetres),
    [0, 50]
  );
});

test("duplicate consecutive coordinates are handled deterministically and invalid coordinates are rejected", async () => {
  const generator = await loadGeneratorModule();
  const origin = { latitude: 0, longitude: 0 };

  const pins = generator.generateCanonicalPinsForWay(
    buildWaySource({
      sourceId: "123456794",
      coordinates: [
        origin,
        origin,
        makeNorthingCoordinate(origin, 50)
      ]
    })
  );
  assert.equal(pins.length, 2);
  assert.equal(pins[1].distanceAlongWayMetres, 50);

  assert.throws(
    () =>
      generator.generateCanonicalPinsForWay(
        buildWaySource({
          sourceId: "123456795",
          coordinates: [
            { latitude: 95, longitude: 0 },
            { latitude: 95.1, longitude: 0 }
          ]
        })
      ),
    /must be between -90 and 90/
  );

  assert.throws(
    () =>
      generator.generateCanonicalPinsForWay(
        buildWaySource({
          sourceId: "123456796",
          coordinates: [origin, { latitude: 0, longitude: 181 }]
        })
      ),
    /must be between -180 and 180/
  );
});

test("viewport filtering happens after canonical generation and merged subsets stay stable across loading order", async () => {
  const generator = await loadGeneratorModule();
  const origin = { latitude: 0, longitude: 0 };
  const fullPins = generator.generateCanonicalPinsForWay(
    buildWaySource({
      sourceId: "123456797",
      coordinates: [origin, makeNorthingCoordinate(origin, 120)]
    })
  );

  const viewportA = generator.filterCanonicalPinsByBoundingBox(fullPins, {
    south: -0.000001,
    west: -0.000001,
    north: makeNorthingCoordinate(origin, 60).latitude,
    east: 0.000001
  });
  const viewportB = generator.filterCanonicalPinsByBoundingBox(fullPins, {
    south: makeNorthingCoordinate(origin, 40).latitude,
    west: -0.000001,
    north: makeNorthingCoordinate(origin, 130).latitude,
    east: 0.000001
  });

  const mergedAB = mergeByPinId(viewportA, viewportB);
  const mergedBA = mergeByPinId(viewportB, viewportA);
  const fullSorted = [...fullPins].sort((a, b) => a.pinId.localeCompare(b.pinId));

  assert.deepEqual(mergedAB, fullSorted);
  assert.deepEqual(mergedBA, fullSorted);
});

test("parallel ways keep independent canonical identities and do not collapse by insertion order", async () => {
  const generator = await loadGeneratorModule();
  const origin = { latitude: 0, longitude: 0 };
  const offsetOrigin = makeEastingCoordinate(origin, 5);

  const firstWay = generator.generateCanonicalPinsForWay(
    buildWaySource({
      sourceId: "123456798",
      coordinates: [origin, makeNorthingCoordinate(origin, 92)]
    })
  );
  const secondWay = generator.generateCanonicalPinsForWay(
    buildWaySource({
      sourceId: "123456799",
      coordinates: [
        offsetOrigin,
        makeNorthingCoordinate(offsetOrigin, 92)
      ]
    })
  );

  const merged = mergeByPinId(firstWay, secondWay);
  assert.equal(merged.length, firstWay.length + secondWay.length);
  assert.equal(new Set(merged.map((pin) => pin.pinId)).size, merged.length);
});

test("conflicting geometry with the same sourceId surfaces deterministic output differences and capture radius stays locked at 100 metres", async () => {
  const generator = await loadGeneratorModule();
  const types = await loadTypeModule();
  const origin = { latitude: 0, longitude: 0 };

  const firstPins = generator.generateCanonicalPinsForWay(
    buildWaySource({
      sourceId: "123456800",
      coordinates: [origin, makeNorthingCoordinate(origin, 92)]
    })
  );
  const conflictingPins = generator.generateCanonicalPinsForWay(
    buildWaySource({
      sourceId: "123456800",
      coordinates: [origin, makeNorthingCoordinate(origin, 138)]
    })
  );

  assert.notDeepEqual(firstPins, conflictingPins);
  assert.equal(types.GROWGO_CAPTURE_RADIUS_METRES, 100);
});
