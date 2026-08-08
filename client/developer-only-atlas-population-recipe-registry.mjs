const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_RECIPE_REGISTRY_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_RECIPE_RESOLUTION_RESULT_001";

const DEFAULT_APPROVED_REGIONS = Object.freeze([
  "BELLARINE",
  "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
  "REGION_BELLARINE_POPULATED_TEST_NEG_38_14_144_35_COASTAL_EXPLORATION"
]);
const DEFAULT_APPROVED_PACKAGES = Object.freeze([
  "ATLAS_DEVELOPER_PACKAGE",
  "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
  "ATLAS_REGION_PACKAGE_BELLARINE_POPULATED_TEST_NEG_38_14_144_35_v001"
]);
const DEFAULT_APPROVED_CONTEXT_RECIPES = Object.freeze([
  "COASTAL_LOCATION_RECIPE_001",
  "TREE_EUCALYPTUS_RECIPE_001",
  "TREE_BOTTLEBRUSH_RECIPE_001",
  "SHRUB_COASTAL_LOW_RECIPE_001",
  "SPORTS_OVAL_RECIPE_001",
  "RECREATION_AREA_RECIPE_001",
  "PARK_PUBLIC_GREEN_RECIPE_001",
  "COASTAL_GREEN_RECIPE_001",
  "BUILDING_CIVIC_RECIPE_001",
  "BUILDING_GENERIC_RECIPE_001"
]);

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_RECIPE_REGISTRY_VERSION =
  "atlas_population_recipe_registry_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_RECIPE_ENTRIES =
  Object.freeze([
    Object.freeze({
      recipeId: "PARK_PUBLIC_GREEN_RECIPE_001",
      featureClasses: Object.freeze(["park"]),
      assetCommands: Object.freeze([
        Object.freeze({
          assetId: "TREE_EUCALYPTUS_001",
          assetVersion: "v001",
          assetCategory: "vegetation"
        }),
        Object.freeze({
          assetId: "SHRUB_COASTAL_LOW_001",
          assetVersion: "v002",
          assetCategory: "vegetation"
        })
      ]),
      approvedRegions: DEFAULT_APPROVED_REGIONS,
      approvedPackages: DEFAULT_APPROVED_PACKAGES,
      approvedContextRecipeIds: DEFAULT_APPROVED_CONTEXT_RECIPES,
      status: "approved"
    }),
    Object.freeze({
      recipeId: "COASTAL_GREEN_RECIPE_001",
      featureClasses: Object.freeze([
        "vegetation_area",
        "coastal_green",
        "roadside_green",
        "reserve"
      ]),
      assetCommands: Object.freeze([
        Object.freeze({
          assetId: "TREE_BOTTLEBRUSH_001",
          assetVersion: "v002",
          assetCategory: "vegetation"
        }),
        Object.freeze({
          assetId: "SHRUB_COASTAL_LOW_001",
          assetVersion: "v002",
          assetCategory: "vegetation"
        })
      ]),
      approvedRegions: DEFAULT_APPROVED_REGIONS,
      approvedPackages: DEFAULT_APPROVED_PACKAGES,
      approvedContextRecipeIds: DEFAULT_APPROVED_CONTEXT_RECIPES,
      status: "approved"
    }),
    Object.freeze({
      recipeId: "BUILDING_CIVIC_RECIPE_001",
      featureClasses: Object.freeze(["civic_site", "sports_ground"]),
      assetCommands: Object.freeze([
        Object.freeze({
          assetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
          assetVersion: "1.0.0",
          assetCategory: "building"
        })
      ]),
      approvedRegions: DEFAULT_APPROVED_REGIONS,
      approvedPackages: DEFAULT_APPROVED_PACKAGES,
      approvedContextRecipeIds: DEFAULT_APPROVED_CONTEXT_RECIPES,
      status: "approved"
    }),
    Object.freeze({
      recipeId: "BUILDING_GENERIC_RECIPE_001",
      featureClasses: Object.freeze(["building_footprint"]),
      assetCommands: Object.freeze([]),
      approvedRegions: DEFAULT_APPROVED_REGIONS,
      approvedPackages: DEFAULT_APPROVED_PACKAGES,
      approvedContextRecipeIds: DEFAULT_APPROVED_CONTEXT_RECIPES,
      status: "approved"
    })
  ]);

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  if (seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested, seen);
    }
  }
  return Object.freeze(value);
}

function canonicalSafetyFlags() {
  return deepFreeze({
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

function sanitizeString(value) {
  return value == null ? null : String(value);
}

function validateStringArray(values, reasonCode) {
  if (!Array.isArray(values) || values.length === 0) {
    throw Object.assign(new Error(reasonCode), { reasonCode });
  }
  return deepFreeze(values.map((value) => String(value)));
}

function validateEntry(entry = {}) {
  const recipeId = sanitizeString(entry.recipeId);
  if (!recipeId) {
    throw Object.assign(new Error("MISSING_RECIPE_ID"), {
      reasonCode: "MISSING_RECIPE_ID"
    });
  }

  const featureClasses = validateStringArray(
    entry.featureClasses,
    "MISSING_FEATURE_CLASSES"
  );
  const assetCommands = Array.isArray(entry.assetCommands)
    ? deepFreeze(
        entry.assetCommands.map((command) =>
          deepFreeze({
            assetId: sanitizeString(command.assetId),
            assetVersion: sanitizeString(command.assetVersion),
            assetCategory: sanitizeString(command.assetCategory)
          })
        )
      )
    : deepFreeze([]);

  return deepFreeze({
    recipeId,
    featureClasses,
    assetCommands,
    approvedRegions: validateStringArray(
      entry.approvedRegions,
      "MISSING_APPROVED_REGIONS"
    ),
    approvedPackages: validateStringArray(
      entry.approvedPackages,
      "MISSING_APPROVED_PACKAGES"
    ),
    approvedContextRecipeIds: validateStringArray(
      entry.approvedContextRecipeIds,
      "MISSING_APPROVED_CONTEXT_RECIPES"
    ),
    status: sanitizeString(entry.status) ?? "approved"
  });
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    registryVersion: state.registryVersion,
    registeredRecipeCount: state.registeredRecipeCount,
    supportedFeatureClassCount: state.supportedFeatureClassCount,
    matchedRecipeId: state.matchedRecipeId,
    matchedFeatureClass: state.matchedFeatureClass,
    generatedCommandCount: state.generatedCommandCount,
    rejectedRecipeCount: state.rejectedRecipeCount,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createDeveloperOnlyAtlasPopulationRecipeRegistry({
  registryVersion = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_RECIPE_REGISTRY_VERSION,
  entries = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_RECIPE_ENTRIES
} = {}) {
  const validatedEntries = deepFreeze(entries.map(validateEntry));
  const featureClassCount = new Set(
    validatedEntries.flatMap((entry) => entry.featureClasses)
  ).size;

  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationRecipeRegistry: true,
    __entries: validatedEntries,
    __state: {
      registryVersion: sanitizeString(registryVersion),
      registeredRecipeCount: validatedEntries.length,
      supportedFeatureClassCount: featureClassCount,
      matchedRecipeId: null,
      matchedFeatureClass: null,
      generatedCommandCount: 0,
      rejectedRecipeCount: 0,
      lastFailureReason: null
    }
  });
}

function requireRegistry(registry) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationRecipeRegistry ||
    !Array.isArray(registry.__entries) ||
    !registry.__state
  ) {
    throw Object.assign(
      new Error("ATLAS_POPULATION_RECIPE_REGISTRY_UNAVAILABLE"),
      { reasonCode: "ATLAS_POPULATION_RECIPE_REGISTRY_UNAVAILABLE" }
    );
  }
  return registry;
}

export function resolveDeveloperOnlyAtlasPopulationRecipeForFeature(
  registry,
  {
    featureClass,
    regionId,
    packageId,
    contextRecipeId
  } = {}
) {
  requireRegistry(registry);
  const normalizedFeatureClass = sanitizeString(featureClass);
  const normalizedRegionId = sanitizeString(regionId);
  const normalizedPackageId = sanitizeString(packageId);
  const normalizedContextRecipeId = sanitizeString(contextRecipeId);

  if (!normalizedFeatureClass) {
    throw Object.assign(new Error("MISSING_FEATURE_CLASS"), {
      reasonCode: "MISSING_FEATURE_CLASS"
    });
  }

  const entry =
    registry.__entries.find((candidate) =>
      candidate.featureClasses.includes(normalizedFeatureClass)
    ) ?? null;

  if (!entry) {
    registry.__state.matchedRecipeId = null;
    registry.__state.matchedFeatureClass = normalizedFeatureClass;
    registry.__state.generatedCommandCount = 0;
    registry.__state.rejectedRecipeCount += 1;
    registry.__state.lastFailureReason = "UNSUPPORTED_FEATURE_CLASS";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      matchedRecipeId: null,
      matchedFeatureClass: normalizedFeatureClass,
      generatedCommandCount: 0,
      rejectedRecipeCount: 1,
      assetCommands: deepFreeze([]),
      reasonCode: "UNSUPPORTED_FEATURE_CLASS"
    });
  }

  if (!entry.approvedRegions.includes(normalizedRegionId)) {
    registry.__state.matchedRecipeId = null;
    registry.__state.matchedFeatureClass = normalizedFeatureClass;
    registry.__state.generatedCommandCount = 0;
    registry.__state.rejectedRecipeCount += 1;
    registry.__state.lastFailureReason = "INVALID_REGION_ID";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      matchedRecipeId: entry.recipeId,
      matchedFeatureClass: normalizedFeatureClass,
      generatedCommandCount: 0,
      rejectedRecipeCount: 1,
      assetCommands: deepFreeze([]),
      reasonCode: "INVALID_REGION_ID"
    });
  }

  if (!entry.approvedPackages.includes(normalizedPackageId)) {
    registry.__state.matchedRecipeId = null;
    registry.__state.matchedFeatureClass = normalizedFeatureClass;
    registry.__state.generatedCommandCount = 0;
    registry.__state.rejectedRecipeCount += 1;
    registry.__state.lastFailureReason = "INVALID_PACKAGE_ID";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      matchedRecipeId: entry.recipeId,
      matchedFeatureClass: normalizedFeatureClass,
      generatedCommandCount: 0,
      rejectedRecipeCount: 1,
      assetCommands: deepFreeze([]),
      reasonCode: "INVALID_PACKAGE_ID"
    });
  }

  if (!entry.approvedContextRecipeIds.includes(normalizedContextRecipeId)) {
    registry.__state.matchedRecipeId = null;
    registry.__state.matchedFeatureClass = normalizedFeatureClass;
    registry.__state.generatedCommandCount = 0;
    registry.__state.rejectedRecipeCount += 1;
    registry.__state.lastFailureReason = "INVALID_RECIPE_ID";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      matchedRecipeId: entry.recipeId,
      matchedFeatureClass: normalizedFeatureClass,
      generatedCommandCount: 0,
      rejectedRecipeCount: 1,
      assetCommands: deepFreeze([]),
      reasonCode: "INVALID_RECIPE_ID"
    });
  }

  registry.__state.matchedRecipeId = entry.recipeId;
  registry.__state.matchedFeatureClass = normalizedFeatureClass;
  registry.__state.generatedCommandCount = entry.assetCommands.length;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    matchedRecipeId: entry.recipeId,
    matchedFeatureClass: normalizedFeatureClass,
    generatedCommandCount: entry.assetCommands.length,
    rejectedRecipeCount: 0,
    assetCommands: entry.assetCommands,
    reasonCode: "RECIPE_RESOLVED"
  });
}

export function getDeveloperOnlyAtlasPopulationRecipeRegistryStatus(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasPopulationRecipeRegistry) {
    return freezeStatus({
      registryVersion: null,
      registeredRecipeCount: 0,
      supportedFeatureClassCount: 0,
      matchedRecipeId: null,
      matchedFeatureClass: null,
      generatedCommandCount: 0,
      rejectedRecipeCount: 0,
      lastFailureReason: "ATLAS_POPULATION_RECIPE_REGISTRY_UNAVAILABLE"
    });
  }

  return freezeStatus(registry.__state);
}
