import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadCanonicalPinIdModule() {
  return import(
    path.join(repoRoot, "functions/lib/domain/pins/canonicalPinId.js")
  );
}

test("canonical pin ID formatter and parser round-trip deterministically", async () => {
  const module = await loadCanonicalPinIdModule();
  const pinId = module.formatCanonicalPinId({
    generatorVersion: 1,
    sourceType: "osm-way",
    sourceId: "123456789",
    positionIndex: 14
  });

  assert.equal(pinId, "ggpin:v1:osm-way:123456789:14");
  assert.deepEqual(module.parseCanonicalPinId(pinId), {
    generatorVersion: 1,
    sourceType: "osm-way",
    sourceId: "123456789",
    positionIndex: 14
  });
});

test("canonical pin IDs are stable for identical inputs and vary with canonical identity fields", async () => {
  const module = await loadCanonicalPinIdModule();
  const base = {
    generatorVersion: 1,
    sourceType: "osm-way",
    sourceId: "123456789",
    positionIndex: 14
  };

  const stableA = module.formatCanonicalPinId(base);
  const stableB = module.formatCanonicalPinId(base);
  assert.equal(stableA, stableB);

  assert.notEqual(
    stableA,
    module.formatCanonicalPinId({ ...base, sourceId: "123456790" })
  );
  assert.notEqual(
    stableA,
    module.formatCanonicalPinId({ ...base, positionIndex: 15 })
  );
  assert.throws(
    () =>
      module.formatCanonicalPinId({
        ...base,
        generatorVersion: 2
      }),
    /Unsupported canonical pin generator version/
  );
  assert.throws(
    () =>
      module.formatCanonicalPinId({
        ...base,
        sourceType: "osm-relation"
      }),
    /Unsupported canonical pin source type/
  );
});

test("canonical pin IDs reject malformed generator versions, source IDs, position indices, and oversized IDs", async () => {
  const module = await loadCanonicalPinIdModule();

  assert.throws(
    () =>
      module.formatCanonicalPinId({
        generatorVersion: 1,
        sourceType: "osm-way",
        sourceId: "000123",
        positionIndex: 0
      }),
    /sourceId must be a positive base-10 OSM identifier string/
  );
  assert.throws(
    () =>
      module.formatCanonicalPinId({
        generatorVersion: 1,
        sourceType: "osm-way",
        sourceId: "12345678901234567890",
        positionIndex: 0
      }),
    /sourceId exceeds the maximum supported length/
  );
  assert.throws(
    () =>
      module.formatCanonicalPinId({
        generatorVersion: 1,
        sourceType: "osm-way",
        sourceId: "123456789",
        positionIndex: -1
      }),
    /positionIndex must be a non-negative safe integer/
  );
  assert.throws(
    () =>
      module.formatCanonicalPinId({
        generatorVersion: 1,
        sourceType: "osm-way",
        sourceId: "123456789",
        positionIndex: 1.5
      }),
    /positionIndex must be a non-negative safe integer/
  );
  assert.throws(
    () => module.parseCanonicalPinId("ggpin:v2:osm-way:123456789:0"),
    /Unsupported canonical pin generator version/
  );
  assert.throws(
    () => module.parseCanonicalPinId("ggpin:v1:osm-way:12345678901234567890:0"),
    /exceeds the maximum supported length|sourceId exceeds the maximum supported length/
  );
});

test("legacy coordinate IDs never parse as v1 and are detected separately", async () => {
  const module = await loadCanonicalPinIdModule();
  const legacyId = "-38.450000,145.240000";

  assert.equal(module.isLegacyCoordinatePinId(legacyId), true);
  assert.equal(module.isLegacyCoordinatePinId("ggpin:v1:osm-way:123:0"), false);
  assert.throws(
    () => module.parseCanonicalPinId(legacyId),
    /exactly five segments|namespace is invalid/
  );
});

test("canonical pin ID contract does not use uid, requestId, latitude, or longitude as identity inputs", () => {
  const source = fs.readFileSync(
    path.join(repoRoot, "functions/src/domain/pins/canonicalPinId.ts"),
    "utf8"
  );

  assert.doesNotMatch(source, /\buid\b/);
  assert.doesNotMatch(source, /\brequestId\b/);
  assert.doesNotMatch(source, /\blatitude\b/);
  assert.doesNotMatch(source, /\blongitude\b/);
});
