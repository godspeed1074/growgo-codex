import { createDeveloperOnlyAtlasMapAdapterCore } from "./developer-only-atlas-map-adapter-core.mjs";

const approvedScope = Object.freeze({
  scopeId: "DEVELOPER_SCOPE_BELLARINE_COASTAL_EXPLORATION",
  regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
  packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
  recipeId: "COASTAL_LOCATION_RECIPE_001",
  internalDeveloperOnly: true
});

const populatedVerificationScope = Object.freeze({
  scopeId: "DEVELOPER_SCOPE_BELLARINE_POPULATED_TEST_AREA",
  regionId: "REGION_BELLARINE_POPULATED_TEST_NEG_38_14_144_35_COASTAL_EXPLORATION",
  packageId: "ATLAS_REGION_PACKAGE_BELLARINE_POPULATED_TEST_NEG_38_14_144_35_v001",
  recipeId: "COASTAL_LOCATION_RECIPE_001",
  internalDeveloperOnly: true
});

const safetyFlags = Object.freeze({
  runtimeExecutionEnabled: false,
  mapAttachmentAllowed: false,
  automaticRendererExecutionAllowed: false,
  lifecycleExecutionEnabled: false
});

const approvedRepresentativePackage = Object.freeze({
  sourceDatasetId: "SOURCE_DATASET_BELLARINE_001",
  sourceRevision: "2026-07-30:R001",
  regionSlug: "BELLARINE_COAST",
  latBucket: -38.12,
  lngBucket: 144.61,
  environmentProfile: "COASTAL_EXPLORATION",
  primaryBiomeHint: "COASTAL_RESERVE_TRAIL",
  archetypeHint: "RESERVE_LOOP",
  expectedRecipeId: "COASTAL_LOCATION_RECIPE_001",
  mobileProfile: "MOBILE_STANDARD_001",
  regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
  packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
  packageVersion: "v001",
  selectorSeed: "baf38e127eee1e320570e2f02fc889cd1aaec4b9dfd7bee85bba4f10f30b6da0",
  packageFingerprint: "94c447ae7b3c888b3df618ad2f1f45cf3ea9e7d0282cd49c2d56ed94fff06aed"
});

const populatedVerificationRepresentativePackage = Object.freeze({
  sourceDatasetId: "SOURCE_DATASET_BELLARINE_POPULATED_TEST_001",
  sourceRevision: "2026-08-08:R001",
  regionSlug: "BELLARINE_POPULATED_TEST",
  latBucket: -38.14,
  lngBucket: 144.35,
  environmentProfile: "COASTAL_EXPLORATION",
  primaryBiomeHint: "COASTAL_RESERVE_TRAIL",
  archetypeHint: "RESERVE_LOOP",
  expectedRecipeId: "COASTAL_LOCATION_RECIPE_001",
  mobileProfile: "MOBILE_STANDARD_001",
  regionId: "REGION_BELLARINE_POPULATED_TEST_NEG_38_14_144_35_COASTAL_EXPLORATION",
  packageId: "ATLAS_REGION_PACKAGE_BELLARINE_POPULATED_TEST_NEG_38_14_144_35_v001",
  packageVersion: "v001",
  selectorSeed: "6c07ce2b7f1cf4f5dc973e1b4fc3854e7df97341f0969c1c9d4bf66e7ec5b8cf",
  packageFingerprint: "3de8cbf25b1f9f633c062e0c6511d161b3dbe6f3c30140da8a744d66bf127834"
});

const approvedScopeEntries = Object.freeze([
  Object.freeze({
    scope: approvedScope,
    representativePackage: approvedRepresentativePackage
  }),
  Object.freeze({
    scope: populatedVerificationScope,
    representativePackage: populatedVerificationRepresentativePackage
  })
]);

const selectorFoundation = Object.freeze({
  specification: {
    selectorId: "LOCATION_RECIPE_SELECTOR_001",
    workflowVersion: "ASSET_FACTORY_V1",
    selectionRules: {
      approvedLifecycleStates: ["APPROVED_CURRENT"],
      fallbackPolicy: {
        minimumConfidence: 35
      }
    }
  },
  recipeMetadataRecords: [
    {
      recipeId: "COASTAL_LOCATION_RECIPE_001",
      version: "v001",
      biomeFamily: "COASTAL_DUNE",
      biomeTags: [
        "COASTAL_CLIFF_LOOKOUT",
        "COASTAL_CREEK_MOUTH",
        "COASTAL_DUNE_EDGE",
        "COASTAL_RESERVE_TRAIL",
        "COASTAL_WETLAND_MARGIN"
      ],
      disallowedBiomeTags: [
        "ALPINE_TUNDRA",
        "INLAND_FARMLAND",
        "URBAN_MAIN_STREET"
      ],
      supportedArchetypes: [
        "BEACH_ACCESS_SPUR",
        "CLIFF_LOOKOUT_APPROACH",
        "RESERVE_LOOP",
        "WETLAND_CROSSING"
      ],
      selectionCapabilities: [
        "ACCENT_NATIVE_TREE",
        "COASTAL_SHRUB_MASS",
        "DESTINATION_NODE",
        "ELEVATED_WET_CROSSING",
        "LOOP_ROUTE",
        "NATIVE_GRASS_BREAKUP",
        "PRIMARY_PATH_SURFACE",
        "SHORELINE_TRANSITION",
        "SHORELINE_TRANSITION_BAND",
        "TERRAIN_DETAIL_CLUSTER",
        "UNDERSTORY_GROUND_BLEND",
        "WATER_BOUNDARY",
        "WET_CROSSING"
      ],
      lifecycleStatus: "APPROVED_CURRENT",
      approvalStatus: "approved",
      environmentRequirements: {
        requiredEnvironment: "DEVELOPMENT_ONLY"
      },
      versionCompatibility: {
        requiredWorkflowVersion: "ASSET_FACTORY_V1"
      },
      routeSignals: ["PEDESTRIAN_EXPLORATION"]
    },
    {
      recipeId: "FOREST_LOCATION_RECIPE_001",
      version: "v001",
      biomeFamily: "TEMPERATE_FOREST",
      biomeTags: [
        "FOREST_TRACK_CLEARING",
        "TEMPERATE_FOREST_EDGE",
        "WOODLAND_RESERVE_LOOP"
      ],
      disallowedBiomeTags: [],
      supportedArchetypes: [
        "CLEARING_SPUR",
        "FOREST_EDGE_LOOP",
        "RESERVE_TRACK_OUT_AND_BACK"
      ],
      selectionCapabilities: [
        "ACCENT_NATIVE_TREE",
        "CANOPY_ENCLOSURE",
        "CLEARING_DESTINATION",
        "DESTINATION_NODE",
        "FOREST_SHRUB_MASS",
        "LOOP_ROUTE",
        "NATIVE_GRASS_BREAKUP",
        "OUT_AND_BACK_ROUTE",
        "PRIMARY_PATH_SURFACE",
        "TERRAIN_DETAIL_CLUSTER",
        "UNDERSTORY_GROUND_BLEND"
      ],
      lifecycleStatus: "APPROVED_CURRENT",
      approvalStatus: "approved",
      environmentRequirements: {
        requiredEnvironment: "DEVELOPMENT_ONLY"
      },
      versionCompatibility: {
        requiredWorkflowVersion: "ASSET_FACTORY_V1"
      },
      routeSignals: [
        "FOREST_NAVIGATION_SHOULD_PRIORITIZE_READABLE_WALKING_ROUTES_LOW_OBSTRUCTION_AND_A_CLEAR_DESTINATION_OR_RETURN_LOGIC"
      ]
    }
  ]
});

export function createBrowserReadyDeveloperOnlyAtlasMapAdapter(options = {}) {
  return createDeveloperOnlyAtlasMapAdapterCore({
    approvedScope: options.approvedScopeOverride ?? approvedScope,
    approvedScopeEntries: options.approvedScopeEntriesOverride ?? approvedScopeEntries,
    safetyFlags: options.safetyFlagsOverride ?? safetyFlags,
    approvedRepresentativePackage:
      options.approvedRepresentativePackageOverride ?? approvedRepresentativePackage,
    selectorFoundation: options.selectorFoundationOverride ?? selectorFoundation,
    bridgeStateOverride: options.bridgeStateOverride
  });
}
