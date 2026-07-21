import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const repoRoot = path.resolve(import.meta.dirname, "..");
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");
const helperBlockMatch = scriptSource.match(
  /\/\* CANONICAL V1 BASE PIN HELPERS START \*\/([\s\S]*?)\/\* CANONICAL V1 BASE PIN HELPERS END \*\//
);

function loadBrowserHelpers() {
  assert.ok(helperBlockMatch, "canonical helper block should exist in script.js");

  const context = vm.createContext({
    module: { exports: {} },
    exports: {},
    console,
    Math,
    Number,
    String,
    Array,
    Object,
    TypeError,
    RangeError
  });

  vm.runInContext(
    `
${helperBlockMatch[1]}
module.exports = {
  CANONICAL_BASE_PIN_GENERATOR_VERSION,
  CANONICAL_BASE_PIN_SOURCE_TYPE,
  CANONICAL_V1_BASE_PIN_ID_SCHEME,
  formatCanonicalV1BasePinId,
  parseCanonicalV1BasePinId,
  isLegacyCoordinateBasePinId,
  normalizeCanonicalV1SourceId,
  normalizeCanonicalV1Coordinate,
  calculateCanonicalV1DistanceMetres,
  generateCanonicalV1PinsForWay,
  filterCanonicalV1PinsToBounds
};
`,
    context
  );

  return context.module.exports;
}

async function loadCanonicalModules() {
  return {
    idModule: await import(
      path.join(repoRoot, "functions/lib/domain/pins/canonicalPinId.js")
    ),
    generatorModule: await import(
      path.join(repoRoot, "functions/lib/domain/pins/canonicalPinGenerator.js")
    )
  };
}

const earthRadiusMetres = 6371008.8;

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

function buildWaySource({ sourceId, coordinates, spacingMetres = 50 }) {
  return {
    generatorVersion: 1,
    sourceType: "osm-way",
    sourceId,
    orderedCoordinates: coordinates,
    spacingMetres
  };
}

function sortPinsById(pins) {
  return [...pins].sort((a, b) => a.pinId.localeCompare(b.pinId));
}

function normalizeBrowserPinsForComparison(pins) {
  return sortPinsById(pins).map((pin) => ({
    pinId: pin.pinId,
    generatorVersion: pin.generatorVersion,
    sourceType: pin.sourceType,
    sourceId: pin.sourceId,
    positionIndex: pin.positionIndex,
    segmentIndex: pin.segmentIndex,
    latitude: pin.latitude,
    longitude: pin.longitude,
    distanceAlongWayMetres: pin.distanceAlongWayMetres
  }));
}

function normalizeTypeScriptPinsForComparison(pins) {
  return sortPinsById(pins).map((pin) => ({
    pinId: pin.pinId,
    generatorVersion: pin.generatorVersion,
    sourceType: pin.sourceType,
    sourceId: pin.sourceId,
    positionIndex: pin.positionIndex,
    segmentIndex: pin.segmentIndex,
    latitude: pin.latitude,
    longitude: pin.longitude,
    distanceAlongWayMetres: pin.distanceAlongWayMetres
  }));
}

function createVisibleBounds(predicate) {
  return {
    contains(value) {
      if (Array.isArray(value)) {
        return predicate({ latitude: value[0], longitude: value[1] });
      }

      return predicate({
        latitude: value.latitude ?? value.lat,
        longitude: value.longitude ?? value.lng
      });
    }
  };
}

test("browser canonical formatter and parser match the pure-domain v1 contract", async () => {
  const browser = loadBrowserHelpers();
  const { idModule } = await loadCanonicalModules();

  const browserId = browser.formatCanonicalV1BasePinId({
    generatorVersion: 1,
    sourceType: "osm-way",
    sourceId: "123456789",
    positionIndex: 14
  });

  assert.equal(browserId, "ggpin:v1:osm-way:123456789:14");
  assert.equal(
    browserId,
    idModule.formatCanonicalPinId({
      generatorVersion: 1,
      sourceType: "osm-way",
      sourceId: "123456789",
      positionIndex: 14
    })
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(browser.parseCanonicalV1BasePinId(browserId))),
    {
    generatorVersion: 1,
    sourceType: "osm-way",
    sourceId: "123456789",
    positionIndex: 14
    }
  );
  assert.equal(
    browser.isLegacyCoordinateBasePinId("-38.450000,145.240000"),
    true
  );
  assert.throws(
    () => browser.parseCanonicalV1BasePinId("-38.450000,145.240000"),
    /exactly five segments|namespace is invalid/
  );
});

test("browser canonical ID helpers reject malformed values and oversized identities", () => {
  const browser = loadBrowserHelpers();

  assert.throws(
    () =>
      browser.formatCanonicalV1BasePinId({
        generatorVersion: 1,
        sourceType: "osm-way",
        sourceId: "000123",
        positionIndex: 0
      }),
    /sourceId must be a positive base-10 OSM identifier string/
  );
  assert.throws(
    () =>
      browser.formatCanonicalV1BasePinId({
        generatorVersion: 1,
        sourceType: "osm-way",
        sourceId: "12345678901234567890",
        positionIndex: 0
      }),
    /sourceId exceeds the maximum supported length/
  );
  assert.throws(
    () =>
      browser.formatCanonicalV1BasePinId({
        generatorVersion: 1,
        sourceType: "osm-way",
        sourceId: "123456789",
        positionIndex: -1
      }),
    /positionIndex must be a non-negative safe integer/
  );
  assert.throws(
    () =>
      browser.generateCanonicalV1PinsForWay(
        buildWaySource({
          sourceId: "123456789",
          coordinates: [
            { latitude: 0, longitude: 0 },
            { latitude: 0.0005, longitude: 0 }
          ],
          spacingMetres: 46
        })
      ),
    /spacing must remain locked to 50 metres/
  );
});

test("browser canonical generator matches the pure-domain implementation for straight, segmented, and short ways", async () => {
  const browser = loadBrowserHelpers();
  const { generatorModule } = await loadCanonicalModules();
  const origin = { latitude: 0, longitude: 0 };
  const fixtures = [
    buildWaySource({
      sourceId: "123456789",
      coordinates: [origin, makeNorthingCoordinate(origin, 120)]
    }),
    buildWaySource({
      sourceId: "123456790",
      coordinates: [
        origin,
        makeNorthingCoordinate(origin, 30),
        makeNorthingCoordinate(origin, 60)
      ]
    }),
    buildWaySource({
      sourceId: "123456791",
      coordinates: [origin, makeNorthingCoordinate(origin, 20)]
    }),
    buildWaySource({
      sourceId: "123456792",
      coordinates: [origin, makeNorthingCoordinate(origin, 100)]
    })
  ];

  for (const fixture of fixtures) {
    const browserPins = browser.generateCanonicalV1PinsForWay(fixture);
    const typeScriptPins = generatorModule.generateCanonicalPinsForWay(fixture);

    assert.deepEqual(
      normalizeBrowserPinsForComparison(browserPins),
      normalizeTypeScriptPinsForComparison(typeScriptPins)
    );
  }
});

test("browser canonical generation is deterministic across repeated runs, viewport filtering, and overlapping view loads", async () => {
  const browser = loadBrowserHelpers();
  const { generatorModule } = await loadCanonicalModules();
  const origin = { latitude: 0, longitude: 0 };
  const source = buildWaySource({
    sourceId: "123456793",
    coordinates: [origin, makeNorthingCoordinate(origin, 120)]
  });

  const first = browser.generateCanonicalV1PinsForWay(source);
  const second = browser.generateCanonicalV1PinsForWay(source);
  assert.deepEqual(first, second);

  const viewportA = createVisibleBounds(
    (coordinate) => coordinate.latitude <= makeNorthingCoordinate(origin, 60).latitude
  );
  const viewportB = createVisibleBounds(
    (coordinate) =>
      coordinate.latitude >= makeNorthingCoordinate(origin, 40).latitude
  );

  const browserA = browser.filterCanonicalV1PinsToBounds(first, viewportA);
  const browserB = browser.filterCanonicalV1PinsToBounds(first, viewportB);
  const mergedBrowser = new Map(
    [...browserA, ...browserB].map((pin) => [pin.pinId, pin])
  );

  const typeScriptPins = generatorModule.generateCanonicalPinsForWay(source);
  const tsA = generatorModule.filterCanonicalPinsByBoundingBox(typeScriptPins, {
    south: -0.000001,
    west: -0.000001,
    north: makeNorthingCoordinate(origin, 60).latitude,
    east: 0.000001
  });
  const tsB = generatorModule.filterCanonicalPinsByBoundingBox(typeScriptPins, {
    south: makeNorthingCoordinate(origin, 40).latitude,
    west: -0.000001,
    north: makeNorthingCoordinate(origin, 130).latitude,
    east: 0.000001
  });
  const mergedTypeScript = new Map(
    [...tsA, ...tsB].map((pin) => [pin.pinId, pin])
  );

  assert.deepEqual(
    normalizeBrowserPinsForComparison([...mergedBrowser.values()]),
    normalizeTypeScriptPinsForComparison([...mergedTypeScript.values()])
  );
});

test("parallel ways keep distinct canonical identities and browser helpers stay pure", () => {
  const browser = loadBrowserHelpers();
  const origin = { latitude: 0, longitude: 0 };
  const offsetOrigin = makeEastingCoordinate(origin, 5);

  const firstWay = browser.generateCanonicalV1PinsForWay(
    buildWaySource({
      sourceId: "123456794",
      coordinates: [origin, makeNorthingCoordinate(origin, 92)]
    })
  );
  const secondWay = browser.generateCanonicalV1PinsForWay(
    buildWaySource({
      sourceId: "123456795",
      coordinates: [
        offsetOrigin,
        makeNorthingCoordinate(offsetOrigin, 92)
      ]
    })
  );

  const mergedIds = new Set(
    [...firstWay, ...secondWay].map((pin) => pin.pinId)
  );

  assert.equal(mergedIds.size, firstWay.length + secondWay.length);
  assert.doesNotMatch(helperBlockMatch[1], /\bpinStore\b/);
  assert.doesNotMatch(helperBlockMatch[1], /\bfetchedViewportKeys\b/);
  assert.doesNotMatch(helperBlockMatch[1], /\bfetch\s*\(/);
  assert.doesNotMatch(helperBlockMatch[1], /\bfirebase\b/i);
});
