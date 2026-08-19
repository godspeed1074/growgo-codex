import {
  createDeveloperOnlyAtlasAssetRegistry,
  resolveDeveloperOnlyAtlasAssetRegistryEntry
} from "./developer-only-atlas-asset-registry.mjs";
import { coordinateToAtlasChunk } from "./developer-only-atlas-chunk-identity.mjs";
import {
  createDeveloperOnlyAtlasMultiAssetPlacementProvider,
  resolveDeveloperOnlyAtlasMultiAssetPlacement
} from "./developer-only-atlas-multi-asset-placement-provider.mjs";

export const PHILLIP_ISLAND_REGION_ID = "REGION_PHILLIP_ISLAND_V1";
export const PHILLIP_ISLAND_WORLD_PACKAGE_ID = "PHILLIP_ISLAND_WORLD_PACKAGE_V1";
export const PHILLIP_ISLAND_GEOGRAPHY_MANIFEST_VERSION = "1.0.0";
export const PHILLIP_ISLAND_GEOGRAPHY_MANIFEST_SCHEMA =
  "GROWGO_PHILLIP_ISLAND_GEOGRAPHY_MANIFEST_V1";

const GEOGRAPHY_CLASSES = Object.freeze([
  "URBAN_TOWN", "RESIDENTIAL", "COMMERCIAL", "PARKLAND", "FARMLAND",
  "OPEN_GRASSLAND", "COASTAL_SCRUB", "WOODLAND", "WETLAND", "BEACH",
  "COASTAL_EDGE", "WATER"
]);

const POPULATION_RULES = Object.freeze({
  URBAN_TOWN: Object.freeze({
    recipeId: "COASTAL_LOCATION_RECIPE_001",
    approvedAssetIds: Object.freeze(["BUILDING_CIVIC_SPORTS_PAVILION_001", "TREE_EUCALYPTUS_001", "SHRUB_COASTAL_LOW_001"])
  }),
  RESIDENTIAL: Object.freeze({ recipeId: "COASTAL_LOCATION_RECIPE_001", approvedAssetIds: Object.freeze(["TREE_EUCALYPTUS_001", "SHRUB_COASTAL_LOW_001"]) }),
  COMMERCIAL: Object.freeze({ recipeId: "COASTAL_LOCATION_RECIPE_001", approvedAssetIds: Object.freeze(["TREE_BOTTLEBRUSH_001", "SHRUB_COASTAL_LOW_001"]) }),
  PARKLAND: Object.freeze({ recipeId: "PARK_PUBLIC_GREEN_RECIPE_001", approvedAssetIds: Object.freeze(["TREE_EUCALYPTUS_001", "SHRUB_COASTAL_LOW_001"]) }),
  FARMLAND: Object.freeze({ recipeId: "COASTAL_LOCATION_RECIPE_001", approvedAssetIds: Object.freeze(["TREE_EUCALYPTUS_001", "TREE_BOTTLEBRUSH_001"]) }),
  OPEN_GRASSLAND: Object.freeze({ recipeId: "COASTAL_LOCATION_RECIPE_001", approvedAssetIds: Object.freeze(["TREE_EUCALYPTUS_001"]) }),
  COASTAL_SCRUB: Object.freeze({ recipeId: "COASTAL_GREEN_RECIPE_001", approvedAssetIds: Object.freeze(["TREE_BOTTLEBRUSH_001", "SHRUB_COASTAL_LOW_001"]) }),
  WOODLAND: Object.freeze({ recipeId: "COASTAL_LOCATION_RECIPE_001", approvedAssetIds: Object.freeze(["TREE_EUCALYPTUS_001", "TREE_BOTTLEBRUSH_001", "SHRUB_COASTAL_LOW_001"]) }),
  WETLAND: Object.freeze({ recipeId: "COASTAL_GREEN_RECIPE_001", approvedAssetIds: Object.freeze(["TREE_BOTTLEBRUSH_001", "SHRUB_COASTAL_LOW_001"]) }),
  BEACH: Object.freeze({ recipeId: "COASTAL_LOCATION_RECIPE_001", approvedAssetIds: Object.freeze([]) }),
  COASTAL_EDGE: Object.freeze({ recipeId: "COASTAL_GREEN_RECIPE_001", approvedAssetIds: Object.freeze(["TREE_BOTTLEBRUSH_001", "SHRUB_COASTAL_LOW_001"]) }),
  WATER: Object.freeze({ recipeId: "COASTAL_LOCATION_RECIPE_001", approvedAssetIds: Object.freeze([]) })
});

export const PHILLIP_ISLAND_GEOGRAPHY_MANIFEST = Object.freeze({
  schemaId: PHILLIP_ISLAND_GEOGRAPHY_MANIFEST_SCHEMA,
  manifestVersion: PHILLIP_ISLAND_GEOGRAPHY_MANIFEST_VERSION,
  region: Object.freeze({
    regionId: PHILLIP_ISLAND_REGION_ID,
    name: "Phillip Island",
    bounds: Object.freeze({ south: -38.60, west: 145.08, north: -38.42, east: 145.42 }),
    coordinateReferenceSystem: "WGS84 latitude/longitude decimal degrees",
    provenance: "Phillip Island Phase 2A deterministic geography manifest; representative developer population only.",
    approvalState: "DEVELOPER_ONLY_CANDIDATE",
    deterministicGenerationVersion: "PHILLIP_ISLAND_GENERATION_V1"
  }),
  subregions: Object.freeze([
    Object.freeze({ subregionId: "PHILLIP_ISLAND_COWES_V1", name: "Cowes", geographyClass: "URBAN_TOWN", bounds: Object.freeze({ south: -38.49, west: 145.205, north: -38.43, east: 145.26 }) }),
    Object.freeze({ subregionId: "PHILLIP_ISLAND_SILVERLEAVES_V1", name: "Silverleaves", geographyClass: "RESIDENTIAL", bounds: Object.freeze({ south: -38.475, west: 145.26, north: -38.43, east: 145.30 }) }),
    Object.freeze({ subregionId: "PHILLIP_ISLAND_RHYLL_V1", name: "Rhyll", geographyClass: "WETLAND", bounds: Object.freeze({ south: -38.55, west: 145.28, north: -38.475, east: 145.34 }) }),
    Object.freeze({ subregionId: "PHILLIP_ISLAND_CENTRAL_RURAL_V1", name: "Central rural Phillip Island", geographyClass: "FARMLAND", bounds: Object.freeze({ south: -38.59, west: 145.205, north: -38.475, east: 145.34 }) }),
    Object.freeze({ subregionId: "PHILLIP_ISLAND_WESTERN_V1", name: "Western Phillip Island", geographyClass: "COASTAL_SCRUB", bounds: Object.freeze({ south: -38.56, west: 145.08, north: -38.43, east: 145.205 }) })
  ]),
  geographyClasses: GEOGRAPHY_CLASSES,
  populationRules: POPULATION_RULES,
  proofChunkCoordinates: Object.freeze({
    COWES: Object.freeze({ latitude: -38.46, longitude: 145.24 }),
    CENTRAL_RURAL: Object.freeze({ latitude: -38.52, longitude: 145.24 }),
    WESTERN_COASTAL: Object.freeze({ latitude: -38.49, longitude: 145.17 })
  })
});

function fail(reasonCode) { throw Object.assign(new Error(reasonCode), { reasonCode }); }
function finite(value) { return Number.isFinite(Number(value)); }
function inside(bounds, latitude, longitude) { return latitude >= bounds.south && latitude < bounds.north && longitude >= bounds.west && longitude < bounds.east; }
function centerOf(chunk) { return Object.freeze({ latitude: Number(((chunk.bounds.south + chunk.bounds.north) / 2).toFixed(6)), longitude: Number(((chunk.bounds.west + chunk.bounds.east) / 2).toFixed(6)) }); }
function stablePopulationId(chunkId, assetId, index) { return `PHILLIP_ISLAND_POP_V1_${chunkId}_${assetId}_${index + 1}`; }

export function validatePhillipIslandGeographyManifest(manifest = PHILLIP_ISLAND_GEOGRAPHY_MANIFEST, { registry = createDeveloperOnlyAtlasAssetRegistry() } = {}) {
  if (!manifest || manifest.schemaId !== PHILLIP_ISLAND_GEOGRAPHY_MANIFEST_SCHEMA) fail("PHILLIP_ISLAND_MANIFEST_SCHEMA_INVALID");
  if (!/^\d+\.\d+\.\d+$/.test(String(manifest.manifestVersion ?? ""))) fail("PHILLIP_ISLAND_MANIFEST_VERSION_INVALID");
  const region = manifest.region;
  if (!region?.regionId || !region?.bounds || !finite(region.bounds.south) || !finite(region.bounds.west) || !finite(region.bounds.north) || !finite(region.bounds.east) || region.bounds.south >= region.bounds.north || region.bounds.west >= region.bounds.east) fail("PHILLIP_ISLAND_MANIFEST_BOUNDS_INVALID");
  if (!Array.isArray(manifest.geographyClasses) || manifest.geographyClasses.length !== GEOGRAPHY_CLASSES.length || manifest.geographyClasses.some((value) => !GEOGRAPHY_CLASSES.includes(value))) fail("PHILLIP_ISLAND_MANIFEST_GEOGRAPHY_UNKNOWN");
  const regions = manifest.regions ?? [region];
  if (!Array.isArray(regions) || new Set(regions.map((candidate) => candidate?.regionId)).size !== regions.length) fail("PHILLIP_ISLAND_MANIFEST_REGION_DUPLICATE");
  if (!Array.isArray(manifest.subregions) || manifest.subregions.length === 0) fail("PHILLIP_ISLAND_MANIFEST_SUBREGIONS_MISSING");
  const ids = new Set();
  for (const subregion of manifest.subregions) {
    if (!subregion?.subregionId || ids.has(subregion.subregionId)) fail("PHILLIP_ISLAND_MANIFEST_SUBREGION_DUPLICATE");
    ids.add(subregion.subregionId);
    if (!GEOGRAPHY_CLASSES.includes(subregion.geographyClass)) fail("PHILLIP_ISLAND_MANIFEST_GEOGRAPHY_UNKNOWN");
    const bounds = subregion.bounds;
    if (!bounds || ![bounds.south, bounds.west, bounds.north, bounds.east].every(finite) || bounds.south >= bounds.north || bounds.west >= bounds.east) fail("PHILLIP_ISLAND_MANIFEST_SUBREGION_BOUNDS_INVALID");
  }
  for (const geographyClass of GEOGRAPHY_CLASSES) {
    const rule = manifest.populationRules?.[geographyClass];
    if (!GEOGRAPHY_CLASSES.includes(geographyClass) || !rule?.recipeId || !Array.isArray(rule.approvedAssetIds)) fail("PHILLIP_ISLAND_MANIFEST_POPULATION_RULE_INVALID");
    for (const assetId of rule.approvedAssetIds) {
      const entry = resolveDeveloperOnlyAtlasAssetRegistryEntry(registry, assetId);
      if (!entry.approvedRegions.includes(region.regionId) || !entry.approvedPackages.includes(PHILLIP_ISLAND_WORLD_PACKAGE_ID) || !entry.approvedRecipeIds.includes(rule.recipeId)) fail("PHILLIP_ISLAND_MANIFEST_ASSET_NOT_APPROVED");
    }
  }
  return Object.freeze({ valid: true, regionId: region.regionId, manifestVersion: manifest.manifestVersion, subregionCount: manifest.subregions.length });
}

export function resolvePhillipIslandChunk(chunk, { manifest = PHILLIP_ISLAND_GEOGRAPHY_MANIFEST, registry = createDeveloperOnlyAtlasAssetRegistry() } = {}) {
  validatePhillipIslandGeographyManifest(manifest, { registry });
  if (!chunk?.chunkId || !chunk?.bounds) fail("PHILLIP_ISLAND_CHUNK_IDENTITY_INVALID");
  const coordinate = centerOf(chunk);
  if (!inside(manifest.region.bounds, coordinate.latitude, coordinate.longitude)) fail("PHILLIP_ISLAND_CHUNK_OUTSIDE_SCOPE");
  const subregion = manifest.subregions.find((candidate) => inside(candidate.bounds, coordinate.latitude, coordinate.longitude));
  if (!subregion) fail("PHILLIP_ISLAND_SUBREGION_UNRESOLVED");
  const populationRule = manifest.populationRules[subregion.geographyClass];
  if (!populationRule) fail("PHILLIP_ISLAND_POPULATION_RULE_UNRESOLVED");
  return Object.freeze({ manifestVersion: manifest.manifestVersion, regionId: manifest.region.regionId, packageId: PHILLIP_ISLAND_WORLD_PACKAGE_ID, chunkId: chunk.chunkId, coordinate, subregionId: subregion.subregionId, subregionName: subregion.name, geographyClass: subregion.geographyClass, recipeId: populationRule.recipeId, eligibleAssetIds: Object.freeze([...populationRule.approvedAssetIds]) });
}

export function createPhillipIslandProofPopulation(chunk, options = {}) {
  const resolution = resolvePhillipIslandChunk(chunk, options);
  const placementProvider = options.placementProvider ?? createDeveloperOnlyAtlasMultiAssetPlacementProvider({ registry: options.registry ?? createDeveloperOnlyAtlasAssetRegistry() });
  const population = resolution.eligibleAssetIds.map((assetId, index) => {
    const coordinate = Object.freeze({ latitude: Number((resolution.coordinate.latitude + index * 0.001).toFixed(6)), longitude: Number((resolution.coordinate.longitude + index * 0.001).toFixed(6)) });
    const placement = resolveDeveloperOnlyAtlasMultiAssetPlacement(placementProvider, { assetId, version: resolveDeveloperOnlyAtlasAssetRegistryEntry(options.registry ?? placementProvider.__internal.registry, assetId).assetVersion, coordinate, regionId: resolution.regionId, packageId: resolution.packageId, recipeId: resolution.recipeId, selectorSeed: `${resolution.manifestVersion}:${resolution.chunkId}:${assetId}:${index}` });
    return Object.freeze({ populationId: stablePopulationId(resolution.chunkId, assetId, index), assetId, coordinate, placement });
  });
  if (new Set(population.map((item) => item.populationId)).size !== population.length) fail("PHILLIP_ISLAND_POPULATION_ID_DUPLICATE");
  return Object.freeze({ resolution, population: Object.freeze(population) });
}

export function phillipIslandProofChunks() {
  return Object.freeze(Object.fromEntries(Object.entries(PHILLIP_ISLAND_GEOGRAPHY_MANIFEST.proofChunkCoordinates).map(([key, coordinate]) => [key, coordinateToAtlasChunk({ latitude: coordinate.latitude, longitude: coordinate.longitude })])));
}
