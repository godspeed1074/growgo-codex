import { assetFactoryCategories } from "./asset-registry.mjs";

export const worldPlacementRuleRequiredFields = Object.freeze([
  "placementRuleId",
  "assetCategory",
  "allowedLocations",
  "orientationRules",
  "terrainRequirements",
  "spacingRules",
  "compatibilityRules",
  "metadata"
]);

export const worldPlacementResolverRequiredFields = Object.freeze([
  "placementRuleId",
  "assetId",
  "locationId",
  "coordinates",
  "seed",
  "terrainType"
]);

export const allowedPlacementOrientations = Object.freeze([
  "north",
  "south",
  "east",
  "west",
  "faceRoad"
]);

export const allowedAlignmentRules = Object.freeze([
  "grid",
  "cell-center",
  "edge-aligned",
  "free"
]);

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export const coreWorldPlacementRules = deepFreeze([
  createPlacementRuleRecord(
    "PLACEMENT_TERRAIN_TILE_001",
    "terrain",
    ["terrain_cell"],
    {
      allowedOrientations: ["north", "south", "east", "west"],
      defaultOrientation: "north",
      alignmentRule: "grid"
    },
    {
      allowedTerrainTypes: ["grass", "dirt", "sand", "water_edge"],
      blockedTerrainTypes: []
    },
    {
      minDistanceMetres: 0,
      gridSizeMetres: 1,
      clusterSpacingMetres: 0
    },
    {
      allowedAssetIds: [
        "TERRAIN_GRASS_001",
        "TERRAIN_DIRT_001",
        "TERRAIN_SAND_001",
        "TERRAIN_WATER_EDGE_001"
      ],
      incompatibleAssetIds: []
    }
  ),
  createPlacementRuleRecord(
    "PLACEMENT_ROAD_SEGMENT_001",
    "roads",
    ["road_lane", "path_lane"],
    {
      allowedOrientations: ["north", "south", "east", "west", "faceRoad"],
      defaultOrientation: "faceRoad",
      alignmentRule: "edge-aligned"
    },
    {
      allowedTerrainTypes: ["dirt", "sand", "grass"],
      blockedTerrainTypes: ["water_edge"]
    },
    {
      minDistanceMetres: 0,
      gridSizeMetres: 1,
      clusterSpacingMetres: 0
    },
    {
      allowedAssetIds: [
        "ROAD_STRAIGHT_001",
        "ROAD_CURVE_001",
        "ROAD_INTERSECTION_001",
        "TRAIL_PATH_001",
        "ROAD_STRAIGHT_SMALL_001",
        "ROAD_CURVE_SMALL_001",
        "ROAD_INTERSECTION_SMALL_001",
        "TRAIL_PATH_SMALL_001"
      ],
      incompatibleAssetIds: []
    }
  ),
  createPlacementRuleRecord(
    "PLACEMENT_NATURE_CLUSTER_001",
    "nature",
    ["terrain_cell", "nature_cluster"],
    {
      allowedOrientations: ["north", "south", "east", "west"],
      defaultOrientation: "north",
      alignmentRule: "free"
    },
    {
      allowedTerrainTypes: ["grass", "dirt", "sand"],
      blockedTerrainTypes: ["water_edge"]
    },
    {
      minDistanceMetres: 1,
      gridSizeMetres: 0.5,
      clusterSpacingMetres: 1.5
    },
    {
      allowedAssetIds: [
        "TREE_BASIC_001",
        "BUSH_BASIC_001",
        "ROCK_SMALL_001",
        "TREE_EUCALYPTUS_001",
        "TREE_PINE_001",
        "BUSH_NATIVE_001",
        "ROCK_COASTAL_001"
      ],
      incompatibleAssetIds: []
    }
  ),
  createPlacementRuleRecord(
    "PLACEMENT_BUILDING_PLOT_001",
    "buildings",
    ["building_plot", "road_edge"],
    {
      allowedOrientations: ["north", "south", "east", "west", "faceRoad"],
      defaultOrientation: "faceRoad",
      alignmentRule: "cell-center"
    },
    {
      allowedTerrainTypes: ["grass", "dirt", "sand"],
      blockedTerrainTypes: ["water_edge"]
    },
    {
      minDistanceMetres: 2,
      gridSizeMetres: 1,
      clusterSpacingMetres: 3
    },
    {
      allowedAssetIds: [
        "BUILDING_HOUSE_SMALL_001",
        "BUILDING_SHOP_SMALL_001",
        "BUILDING_HOUSE_SMALL_COASTAL_001",
        "BUILDING_BAKERY_SMALL_001",
        "BUILDING_GAS_STATION_SMALL_001"
      ],
      incompatibleAssetIds: ["ROAD_INTERSECTION_001"]
    }
  ),
  createPlacementRuleRecord(
    "PLACEMENT_DECORATION_EDGE_001",
    "decorations",
    ["road_edge", "building_plot"],
    {
      allowedOrientations: ["north", "south", "east", "west", "faceRoad"],
      defaultOrientation: "faceRoad",
      alignmentRule: "edge-aligned"
    },
    {
      allowedTerrainTypes: ["grass", "dirt", "sand"],
      blockedTerrainTypes: ["water_edge"]
    },
    {
      minDistanceMetres: 0.5,
      gridSizeMetres: 0.5,
      clusterSpacingMetres: 1
    },
    {
      allowedAssetIds: [
        "DECORATION_SIGN_BASIC_001",
        "SIGN_BASIC_001",
        "FENCE_WOOD_001",
        "LAMP_POST_BASIC_001"
      ],
      incompatibleAssetIds: []
    }
  )
]);

export function createWorldPlacementRuleRegistry(initialRules = []) {
  const ruleMap = new Map();

  for (const rule of initialRules) {
    addRule(rule);
  }

  return Object.freeze({
    addRule,
    hasPlacementRule(placementRuleId) {
      return ruleMap.has(normalizePermanentId(placementRuleId, "placementRuleId"));
    },
    findPlacementRuleById(placementRuleId) {
      return (
        ruleMap.get(normalizePermanentId(placementRuleId, "placementRuleId")) ?? null
      );
    },
    listPlacementRules() {
      return Array.from(ruleMap.values());
    },
    listPlacementRuleIds() {
      return Array.from(ruleMap.keys());
    },
    size() {
      return ruleMap.size;
    }
  });

  function addRule(rawRule) {
    const normalizedRule = normalizePlacementRule(rawRule);

    if (ruleMap.has(normalizedRule.placementRuleId)) {
      throw createWorldPlacementValidationError(
        "duplicate_placement_rule_id",
        `Placement rule ${normalizedRule.placementRuleId} already exists.`
      );
    }

    ruleMap.set(normalizedRule.placementRuleId, normalizedRule);
    return normalizedRule;
  }
}

export function validateWorldPlacementRule(rawRule) {
  try {
    const normalizedRule = normalizePlacementRule(rawRule);

    return Object.freeze({
      ok: true,
      normalizedRule,
      errorCode: null,
      message: null
    });
  } catch (error) {
    if (error?.name !== "WorldPlacementValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      normalizedRule: null,
      errorCode: error.code,
      message: error.message
    });
  }
}

export function calculateDeterministicPlacement(input, options = {}) {
  const normalizedOptions = normalizePlacementOptions(options);
  const validation = validateDeterministicPlacementInput(input, normalizedOptions);

  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      selectedAsset: null,
      selectedManifest: null,
      selectedRecipeReference: null,
      placement: null,
      deterministicPlacement: null
    });
  }

  const normalizedInput = validation.normalizedInput;
  const placementRule = normalizedOptions.placementRuleRegistry.findPlacementRuleById(
    normalizedInput.placementRuleId
  );
  const selectedAsset = normalizedOptions.assetRegistry.findAssetById(
    normalizedInput.assetId
  );
  const selectedManifest =
    normalizedOptions.manifestRegistry.findManifestByAssetId(normalizedInput.assetId);

  const hashInput = [
    normalizedInput.assetId,
    normalizedInput.locationId,
    `${normalizedInput.coordinates.x},${normalizedInput.coordinates.y}`,
    normalizedInput.seed,
    normalizedInput.terrainType,
    placementRule.placementRuleId,
    placementRule.orientationRules.defaultOrientation,
    placementRule.orientationRules.alignmentRule
  ].join("::");

  const deterministicHash = stableHash(hashInput);
  const orientation = selectOrientation(
    placementRule.orientationRules,
    deterministicHash
  );
  const alignedPosition = calculateAlignedPosition(
    normalizedInput.coordinates,
    placementRule.orientationRules.alignmentRule,
    placementRule.spacingRules.gridSizeMetres,
    deterministicHash
  );

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    selectedAsset,
    selectedManifest,
    selectedRecipeReference: selectedManifest.recipeId,
    placement: Object.freeze({
      locationId: normalizedInput.locationId,
      position: alignedPosition,
      orientation,
      alignmentRule: placementRule.orientationRules.alignmentRule,
      terrainType: normalizedInput.terrainType,
      spacingProfile: Object.freeze({
        minDistanceMetres: placementRule.spacingRules.minDistanceMetres,
        clusterSpacingMetres: placementRule.spacingRules.clusterSpacingMetres
      })
    }),
    deterministicPlacement: Object.freeze({
      hashInput,
      deterministicHash,
      placementRuleId: placementRule.placementRuleId,
      selectedAssetId: selectedAsset.assetId
    })
  });
}

export function validateDeterministicPlacementInput(input, options = {}) {
  try {
    const normalizedInput = normalizePlacementInput(
      input,
      normalizePlacementOptions(options)
    );

    return Object.freeze({
      ok: true,
      normalizedInput,
      errorCode: null,
      message: null
    });
  } catch (error) {
    if (error?.name !== "WorldPlacementValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      normalizedInput: null,
      errorCode: error.code,
      message: error.message
    });
  }
}

function normalizePlacementRule(rawRule) {
  const rule = asPlainObject(rawRule, "placement rule");
  assertRequiredFields(rule, worldPlacementRuleRequiredFields, "Placement rule");

  const placementRuleId = normalizePermanentId(
    rule.placementRuleId,
    "placementRuleId"
  );
  const assetCategory = normalizeAssetCategory(rule.assetCategory);
  const allowedLocations = normalizeStringArray(
    rule.allowedLocations,
    "allowedLocations"
  );
  const orientationRules = normalizeOrientationRules(rule.orientationRules);
  const terrainRequirements = normalizeTerrainRequirements(rule.terrainRequirements);
  const spacingRules = normalizeSpacingRules(rule.spacingRules);
  const compatibilityRules = normalizeCompatibilityRules(rule.compatibilityRules);
  const metadata = deepFreeze(asPlainObject(rule.metadata, "metadata"));

  validateCompatibilityRules(assetCategory, compatibilityRules);

  return deepFreeze({
    placementRuleId,
    assetCategory,
    allowedLocations: deepFreeze(allowedLocations),
    orientationRules,
    terrainRequirements,
    spacingRules,
    compatibilityRules,
    metadata
  });
}

function normalizePlacementInput(rawInput, options) {
  const input = asPlainObject(rawInput, "placement input");
  assertRequiredFields(
    input,
    worldPlacementResolverRequiredFields,
    "Placement input"
  );

  if (
    !options.placementRuleRegistry ||
    typeof options.placementRuleRegistry.findPlacementRuleById !== "function"
  ) {
    throw createWorldPlacementValidationError(
      "placement_rule_registry_unavailable",
      "Deterministic placement requires an available placement rule registry."
    );
  }

  if (!options.assetRegistry || typeof options.assetRegistry.findAssetById !== "function") {
    throw createWorldPlacementValidationError(
      "asset_registry_unavailable",
      "Deterministic placement requires an available asset registry."
    );
  }

  if (
    !options.manifestRegistry ||
    typeof options.manifestRegistry.findManifestByAssetId !== "function"
  ) {
    throw createWorldPlacementValidationError(
      "manifest_registry_unavailable",
      "Deterministic placement requires an available manifest registry."
    );
  }

  const placementRuleId = normalizePermanentId(
    input.placementRuleId,
    "placementRuleId"
  );
  const assetId = normalizePermanentId(input.assetId, "assetId");
  const locationId = normalizeStringValue(input.locationId, "locationId");
  const coordinates = normalizeCoordinates(input.coordinates);
  const seed = normalizeStringValue(input.seed, "seed");
  const terrainType = normalizeStringValue(input.terrainType, "terrainType");
  const locationType = normalizeOptionalStringValue(input.locationType, "locationType");

  const placementRule =
    options.placementRuleRegistry.findPlacementRuleById(placementRuleId);
  if (!placementRule) {
    throw createWorldPlacementValidationError(
      "missing_placement_rule",
      `Placement rule ${placementRuleId} is not available.`
    );
  }

  const asset = options.assetRegistry.findAssetById(assetId);
  if (!asset) {
    throw createWorldPlacementValidationError(
      "missing_asset_reference",
      `Asset ${assetId} is not available for placement.`
    );
  }

  if (
    typeof options.assetRegistry.isAssetAvailable === "function" &&
    !options.assetRegistry.isAssetAvailable(assetId)
  ) {
    throw createWorldPlacementValidationError(
      "unavailable_asset_reference",
      `Asset ${assetId} is not approved for placement.`
    );
  }

  const manifest = options.manifestRegistry.findManifestByAssetId(assetId);
  if (!manifest) {
    throw createWorldPlacementValidationError(
      "missing_manifest_reference",
      `Asset ${assetId} does not have an approved manifest for placement.`
    );
  }

  if (
    typeof options.manifestRegistry.isManifestAvailable === "function" &&
    !options.manifestRegistry.isManifestAvailable(assetId)
  ) {
    throw createWorldPlacementValidationError(
      "unavailable_manifest_reference",
      `Asset ${assetId} has a manifest that is not approved for placement.`
    );
  }

  validatePlacementCompatibility(
    {
      placementRule,
      asset,
      manifest,
      terrainType,
      locationType
    }
  );

  return Object.freeze({
    placementRuleId,
    assetId,
    locationId,
    coordinates,
    seed,
    terrainType,
    locationType
  });
}

function validatePlacementCompatibility({
  placementRule,
  asset,
  manifest,
  terrainType,
  locationType
}) {
  if (
    asset.category !== placementRule.assetCategory ||
    manifest.category !== placementRule.assetCategory
  ) {
    throw createWorldPlacementValidationError(
      "asset_category_mismatch",
      `Asset ${asset.assetId} is not compatible with placement rule ${placementRule.placementRuleId}.`
    );
  }

  if (
    placementRule.compatibilityRules.allowedAssetIds.length > 0 &&
    !placementRule.compatibilityRules.allowedAssetIds.includes(asset.assetId)
  ) {
    throw createWorldPlacementValidationError(
      "asset_not_allowed",
      `Asset ${asset.assetId} is not approved by placement rule ${placementRule.placementRuleId}.`
    );
  }

  if (
    placementRule.compatibilityRules.incompatibleAssetIds.includes(asset.assetId)
  ) {
    throw createWorldPlacementValidationError(
      "asset_marked_incompatible",
      `Asset ${asset.assetId} is explicitly incompatible with placement rule ${placementRule.placementRuleId}.`
    );
  }

  if (
    placementRule.terrainRequirements.allowedTerrainTypes.length > 0 &&
    !placementRule.terrainRequirements.allowedTerrainTypes.includes(terrainType)
  ) {
    throw createWorldPlacementValidationError(
      "terrain_not_allowed",
      `Terrain type ${terrainType} is not allowed by placement rule ${placementRule.placementRuleId}.`
    );
  }

  if (
    placementRule.terrainRequirements.blockedTerrainTypes.includes(terrainType)
  ) {
    throw createWorldPlacementValidationError(
      "terrain_blocked",
      `Terrain type ${terrainType} is blocked by placement rule ${placementRule.placementRuleId}.`
    );
  }

  if (
    locationType &&
    !placementRule.allowedLocations.includes(locationType)
  ) {
    throw createWorldPlacementValidationError(
      "location_not_allowed",
      `Location type ${locationType} is not allowed by placement rule ${placementRule.placementRuleId}.`
    );
  }
}

function normalizeOrientationRules(rawOrientationRules) {
  const orientationRules = asPlainObject(
    rawOrientationRules,
    "orientationRules"
  );
  const allowedOrientations = normalizeStringArray(
    orientationRules.allowedOrientations,
    "orientationRules.allowedOrientations"
  );
  const defaultOrientation = normalizeStringValue(
    orientationRules.defaultOrientation,
    "orientationRules.defaultOrientation"
  );
  const alignmentRule = normalizeStringValue(
    orientationRules.alignmentRule,
    "orientationRules.alignmentRule"
  );

  for (const orientation of allowedOrientations) {
    if (!allowedPlacementOrientations.includes(orientation)) {
      throw createWorldPlacementValidationError(
        "invalid_orientation",
        `Orientation ${orientation} is not approved for world placement rules.`
      );
    }
  }

  if (!allowedOrientations.includes(defaultOrientation)) {
    throw createWorldPlacementValidationError(
      "default_orientation_not_allowed",
      `Default orientation ${defaultOrientation} must be included in allowedOrientations.`
    );
  }

  if (!allowedAlignmentRules.includes(alignmentRule)) {
    throw createWorldPlacementValidationError(
      "invalid_alignment_rule",
      `Alignment rule ${alignmentRule} is not approved for world placement rules.`
    );
  }

  return deepFreeze({
    allowedOrientations: deepFreeze(allowedOrientations),
    defaultOrientation,
    alignmentRule
  });
}

function normalizeTerrainRequirements(rawTerrainRequirements) {
  const terrainRequirements = asPlainObject(
    rawTerrainRequirements,
    "terrainRequirements"
  );

  return deepFreeze({
    allowedTerrainTypes: deepFreeze(
      normalizeStringArray(
        terrainRequirements.allowedTerrainTypes,
        "terrainRequirements.allowedTerrainTypes"
      )
    ),
    blockedTerrainTypes: deepFreeze(
      normalizeStringArray(
        terrainRequirements.blockedTerrainTypes,
        "terrainRequirements.blockedTerrainTypes"
      )
    )
  });
}

function normalizeSpacingRules(rawSpacingRules) {
  const spacingRules = asPlainObject(rawSpacingRules, "spacingRules");

  return deepFreeze({
    minDistanceMetres: normalizeNonNegativeNumber(
      spacingRules.minDistanceMetres,
      "spacingRules.minDistanceMetres"
    ),
    gridSizeMetres: normalizePositiveNumber(
      spacingRules.gridSizeMetres,
      "spacingRules.gridSizeMetres"
    ),
    clusterSpacingMetres: normalizeNonNegativeNumber(
      spacingRules.clusterSpacingMetres,
      "spacingRules.clusterSpacingMetres"
    )
  });
}

function normalizeCompatibilityRules(rawCompatibilityRules) {
  const compatibilityRules = asPlainObject(
    rawCompatibilityRules,
    "compatibilityRules"
  );

  return deepFreeze({
    allowedAssetIds: deepFreeze(
      normalizePermanentIdArray(
        compatibilityRules.allowedAssetIds,
        "compatibilityRules.allowedAssetIds"
      )
    ),
    incompatibleAssetIds: deepFreeze(
      normalizePermanentIdArray(
        compatibilityRules.incompatibleAssetIds,
        "compatibilityRules.incompatibleAssetIds"
      )
    )
  });
}

function validateCompatibilityRules(assetCategory, compatibilityRules) {
  if (
    compatibilityRules.allowedAssetIds.some(
      (assetId) => !assetId.includes(assetCategory.toUpperCase().slice(0, 4))
    )
  ) {
    return;
  }
}

function normalizePlacementOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    return Object.freeze({
      placementRuleRegistry: null,
      assetRegistry: null,
      manifestRegistry: null
    });
  }

  return Object.freeze({
    placementRuleRegistry:
      options.placementRuleRegistry && typeof options.placementRuleRegistry === "object"
        ? options.placementRuleRegistry
        : null,
    assetRegistry:
      options.assetRegistry && typeof options.assetRegistry === "object"
        ? options.assetRegistry
        : null,
    manifestRegistry:
      options.manifestRegistry && typeof options.manifestRegistry === "object"
        ? options.manifestRegistry
        : null
  });
}

function calculateAlignedPosition(coordinates, alignmentRule, gridSizeMetres, hash) {
  if (alignmentRule === "cell-center") {
    return deepFreeze({
      x: roundToGrid(coordinates.x, gridSizeMetres) + gridSizeMetres / 2,
      y: roundToGrid(coordinates.y, gridSizeMetres) + gridSizeMetres / 2
    });
  }

  if (alignmentRule === "edge-aligned") {
    return deepFreeze({
      x: roundToGrid(coordinates.x, gridSizeMetres),
      y:
        roundToGrid(coordinates.y, gridSizeMetres) +
        (hash % 2 === 0 ? 0 : gridSizeMetres)
    });
  }

  if (alignmentRule === "grid") {
    return deepFreeze({
      x: roundToGrid(coordinates.x, gridSizeMetres),
      y: roundToGrid(coordinates.y, gridSizeMetres)
    });
  }

  return deepFreeze({
    x: coordinates.x,
    y: coordinates.y
  });
}

function selectOrientation(orientationRules, hash) {
  const orientations = orientationRules.allowedOrientations;

  if (orientationRules.defaultOrientation === "faceRoad") {
    return orientations[hash % orientations.length];
  }

  const nonFaceRoadOrientations = orientations.filter(
    (orientation) => orientation !== "faceRoad"
  );

  if (nonFaceRoadOrientations.length === 0) {
    return orientationRules.defaultOrientation;
  }

  return nonFaceRoadOrientations[hash % nonFaceRoadOrientations.length];
}

function roundToGrid(value, gridSizeMetres) {
  return Math.round(value / gridSizeMetres) * gridSizeMetres;
}

function assertRequiredFields(record, requiredFields, label) {
  for (const fieldName of requiredFields) {
    if (!Object.prototype.hasOwnProperty.call(record, fieldName)) {
      throw createWorldPlacementValidationError(
        "missing_required_field",
        `${label} is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeAssetCategory(value) {
  const category = normalizeStringValue(value, "assetCategory");
  if (!assetFactoryCategories.includes(category)) {
    throw createWorldPlacementValidationError(
      "invalid_category",
      `Asset category ${category} is not part of the approved Asset Factory categories.`
    );
  }

  return category;
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw createWorldPlacementValidationError(
      "invalid_identifier",
      `Field ${fieldName} must use the approved permanent uppercase Asset Factory ID format.`
    );
  }

  return normalized;
}

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createWorldPlacementValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of permanent IDs.`
    );
  }

  return value.map((entry, index) =>
    normalizePermanentId(entry, `${fieldName}[${index}]`)
  );
}

function normalizeCoordinates(rawCoordinates) {
  const coordinates = asPlainObject(rawCoordinates, "coordinates");

  return deepFreeze({
    x: normalizeFiniteNumber(coordinates.x, "coordinates.x"),
    y: normalizeFiniteNumber(coordinates.y, "coordinates.y")
  });
}

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createWorldPlacementValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of non-empty strings.`
    );
  }

  return value.map((entry, index) =>
    normalizeStringValue(entry, `${fieldName}[${index}]`)
  );
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createWorldPlacementValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw createWorldPlacementValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }

  return normalized;
}

function normalizeOptionalStringValue(value, fieldName) {
  if (typeof value === "undefined" || value === null) {
    return null;
  }

  return normalizeStringValue(value, fieldName);
}

function normalizeFiniteNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw createWorldPlacementValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a finite number.`
    );
  }

  return value;
}

function normalizePositiveNumber(value, fieldName) {
  const normalized = normalizeFiniteNumber(value, fieldName);
  if (normalized <= 0) {
    throw createWorldPlacementValidationError(
      "invalid_field_value",
      `Field ${fieldName} must be greater than zero.`
    );
  }

  return normalized;
}

function normalizeNonNegativeNumber(value, fieldName) {
  const normalized = normalizeFiniteNumber(value, fieldName);
  if (normalized < 0) {
    throw createWorldPlacementValidationError(
      "invalid_field_value",
      `Field ${fieldName} must be zero or greater.`
    );
  }

  return normalized;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createWorldPlacementValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createPlacementRuleRecord(
  placementRuleId,
  assetCategory,
  allowedLocations,
  orientationRules,
  terrainRequirements,
  spacingRules,
  compatibilityRules
) {
  return deepFreeze({
    placementRuleId,
    assetCategory,
    allowedLocations: deepFreeze(allowedLocations),
    orientationRules: deepFreeze(orientationRules),
    terrainRequirements: deepFreeze(terrainRequirements),
    spacingRules: deepFreeze(spacingRules),
    compatibilityRules: deepFreeze(compatibilityRules),
    metadata: deepFreeze({
      creatorSource: "internal",
      validationState: "validated",
      placementRole: "core_world_seed_rule"
    })
  });
}

function createWorldPlacementValidationError(code, message) {
  const error = new Error(message);
  error.name = "WorldPlacementValidationError";
  error.code = code;
  return error;
}

function stableHash(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const nestedValue of Object.values(value)) {
    if (nestedValue && typeof nestedValue === "object") {
      deepFreeze(nestedValue);
    }
  }

  return Object.freeze(value);
}
