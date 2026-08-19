import test from "node:test";
import assert from "node:assert/strict";
import {
  PHILLIP_ISLAND_GEOGRAPHY_MANIFEST,
  PHILLIP_ISLAND_REGION_ID,
  createPhillipIslandProofPopulation,
  phillipIslandProofChunks,
  resolvePhillipIslandChunk,
  validatePhillipIslandGeographyManifest
} from "../client/developer-only-phillip-island-geography-manifest.mjs";
import { coordinateToAtlasChunk } from "../client/developer-only-atlas-chunk-identity.mjs";

function cloneManifest() { return structuredClone(PHILLIP_ISLAND_GEOGRAPHY_MANIFEST); }
function throwsReason(callback, reasonCode) {
  assert.throws(callback, (error) => error?.reasonCode === reasonCode);
}

test("Phillip Island manifest has one permanent region identity and validates against the authoritative registry", () => {
  const result = validatePhillipIslandGeographyManifest();
  assert.deepEqual(result, { valid: true, regionId: PHILLIP_ISLAND_REGION_ID, manifestVersion: "1.0.0", subregionCount: 5 });
  assert.equal(PHILLIP_ISLAND_GEOGRAPHY_MANIFEST.region.coordinateReferenceSystem, "WGS84 latitude/longitude decimal degrees");
});

test("representative Cowes, central rural, and western coastal chunks resolve deterministically", () => {
  const chunks = phillipIslandProofChunks();
  const expected = { COWES: "URBAN_TOWN", CENTRAL_RURAL: "FARMLAND", WESTERN_COASTAL: "COASTAL_SCRUB" };
  for (const [key, geographyClass] of Object.entries(expected)) {
    const first = resolvePhillipIslandChunk(chunks[key]);
    const second = resolvePhillipIslandChunk(chunks[key]);
    assert.deepEqual(first, second);
    assert.equal(first.regionId, PHILLIP_ISLAND_REGION_ID);
    assert.equal(first.geographyClass, geographyClass);
    assert.equal(first.eligibleAssetIds.length > 0, true);
  }
});

test("proof population uses only approved permanent asset IDs and returns identically on revisit", () => {
  for (const chunk of Object.values(phillipIslandProofChunks())) {
    const first = createPhillipIslandProofPopulation(chunk);
    const second = createPhillipIslandProofPopulation(chunk);
    assert.deepEqual(first, second);
    assert.equal(new Set(first.population.map((item) => item.populationId)).size, first.population.length);
    assert.equal(first.population.every((item) => /^PHILLIP_ISLAND_POP_V1_ATLAS_CHUNK_V1_/.test(item.populationId)), true);
    assert.equal(first.population.every((item) => item.placement.assetId === item.assetId), true);
  }
});

test("chunk resolution is stable at a subregion boundary and rejects chunks outside Phillip Island", () => {
  const cowesBoundary = coordinateToAtlasChunk({ latitude: -38.49, longitude: 145.205 });
  assert.equal(resolvePhillipIslandChunk(cowesBoundary).subregionId, "PHILLIP_ISLAND_COWES_V1");
  const outside = coordinateToAtlasChunk({ latitude: -37.8, longitude: 144.9 });
  throwsReason(() => resolvePhillipIslandChunk(outside), "PHILLIP_ISLAND_CHUNK_OUTSIDE_SCOPE");
});

test("manifest validation fails closed for duplicate IDs, malformed bounds, unknown geography, missing rules, and unknown assets", () => {
  const duplicateSubregion = cloneManifest();
  duplicateSubregion.subregions.push(structuredClone(duplicateSubregion.subregions[0]));
  throwsReason(() => validatePhillipIslandGeographyManifest(duplicateSubregion), "PHILLIP_ISLAND_MANIFEST_SUBREGION_DUPLICATE");

  const duplicateRegion = cloneManifest();
  duplicateRegion.regions = [duplicateRegion.region, structuredClone(duplicateRegion.region)];
  throwsReason(() => validatePhillipIslandGeographyManifest(duplicateRegion), "PHILLIP_ISLAND_MANIFEST_REGION_DUPLICATE");

  const malformedBounds = cloneManifest();
  malformedBounds.region.bounds.north = malformedBounds.region.bounds.south;
  throwsReason(() => validatePhillipIslandGeographyManifest(malformedBounds), "PHILLIP_ISLAND_MANIFEST_BOUNDS_INVALID");

  const unknownGeography = cloneManifest();
  unknownGeography.subregions[0].geographyClass = "VOLCANIC_MOONSCAPE";
  throwsReason(() => validatePhillipIslandGeographyManifest(unknownGeography), "PHILLIP_ISLAND_MANIFEST_GEOGRAPHY_UNKNOWN");

  const missingClass = cloneManifest();
  missingClass.geographyClasses = missingClass.geographyClasses.slice(1);
  throwsReason(() => validatePhillipIslandGeographyManifest(missingClass), "PHILLIP_ISLAND_MANIFEST_GEOGRAPHY_UNKNOWN");

  const missingRule = cloneManifest();
  delete missingRule.populationRules.FARMLAND;
  throwsReason(() => validatePhillipIslandGeographyManifest(missingRule), "PHILLIP_ISLAND_MANIFEST_POPULATION_RULE_INVALID");

  const unknownAsset = cloneManifest();
  unknownAsset.populationRules.FARMLAND.approvedAssetIds = ["UNREGISTERED_ASSET_001"];
  throwsReason(() => validatePhillipIslandGeographyManifest(unknownAsset), "UNKNOWN_ASSET_ID");
});
