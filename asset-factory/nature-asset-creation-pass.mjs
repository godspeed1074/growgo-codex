import {
  createNatureAssetPack,
  natureAssetPackRecords
} from "./asset-registry.mjs";
import {
  treeEucalyptusPrototypeAssetPackageDefinition,
  validateTreeEucalyptusPrototypeAssetPackage
} from "./tree-eucalyptus-prototype-asset-package.mjs";
import {
  groundCoastalGrassPrototypeAssetPackageDefinition,
  validateGroundCoastalGrassPrototypeAssetPackage
} from "./ground-coastal-grass-prototype-asset-package.mjs";

export const natureAssetCreationPassSchemaId = "NATURE_ASSET_CREATION_PASS_001";
export const natureAssetCreationValidationSchemaId =
  "NATURE_ASSET_CREATION_VALIDATION_001";

export const natureAssetCreationSetDefinition = deepFreeze({
  schemaId: natureAssetCreationPassSchemaId,
  setId: "NATURE_ASSET_SET_001",
  styleProfile: deepFreeze({
    visualDirection: "papercut_2_5d",
    shapeLanguage: "clean_playful_lightweight",
    materialStrategy: "shared_materials_and_atlas",
    mobileFriendly: true,
    instancingRequired: true
  }),
  assets: deepFreeze([
    createAssetDefinition({
      assetId: "TREE_EUCALYPTUS_001",
      assetFamily: "TREE_ASSET_FAMILY_001",
      recipeId: "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001",
      modularBibleEntryId: "MODULAR_BIBLE_NATURE_TREE_EUCALYPTUS_001",
      polygonBudget: deepFreeze({
        close: 240,
        gameplay: 160,
        map: 72,
        distantSilhouette: 24
      }),
      materialBudget: deepFreeze({
        maxSharedMaterials: 3,
        textureStrategy: "shared_atlas_mobile_ready",
        uniqueTexturesAllowed: 0
      }),
      lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP", "LOD_DISTANT_SILHOUETTE"]),
      atlasCompatibility: deepFreeze({
        atlasCompatible: true,
        placementRoles: deepFreeze(["park_tree", "coastal_tree", "street_tree"]),
        instanceReuseExpected: true
      }),
      biomeCompatibility: deepFreeze(["COASTAL", "SUBURBAN_PARKLAND", "FOREST_EDGE", "URBAN_STREET"]),
      previewMetadata: deepFreeze({
        previewAssetReady: true,
        previewOrientation: "north_up_friendly",
        representativeScaleMeters: 6.4
      }),
      validationMetadata: deepFreeze({
        sourceDefinition: "tree-eucalyptus-prototype-asset-package",
        productionReadiness: "validated_prototype_package",
        realModelRequiredLater: true
      })
    }),
    createAssetDefinition({
      assetId: "TREE_COASTAL_001",
      assetFamily: "TREE_ASSET_FAMILY_001",
      recipeId: "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001",
      modularBibleEntryId: "MODULAR_BIBLE_NATURE_TREE_COASTAL_001",
      polygonBudget: deepFreeze({
        close: 220,
        gameplay: 144,
        map: 64,
        distantSilhouette: 20
      }),
      materialBudget: deepFreeze({
        maxSharedMaterials: 3,
        textureStrategy: "shared_atlas_mobile_ready",
        uniqueTexturesAllowed: 0
      }),
      lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP", "LOD_DISTANT_SILHOUETTE"]),
      atlasCompatibility: deepFreeze({
        atlasCompatible: true,
        placementRoles: deepFreeze(["foreshore_tree", "coastal_street_tree", "park_tree"]),
        instanceReuseExpected: true
      }),
      biomeCompatibility: deepFreeze(["COASTAL", "FORESHORE_PARKLAND", "SUBURBAN_PARKLAND", "URBAN_STREET"]),
      previewMetadata: deepFreeze({
        previewAssetReady: true,
        previewOrientation: "north_up_friendly",
        representativeScaleMeters: 5.8
      }),
      validationMetadata: deepFreeze({
        sourceDefinition: "session-112-coastal-tree-creation-pass",
        productionReadiness: "metadata_validated_first_pass",
        realModelRequiredLater: true
      })
    }),
    createAssetDefinition({
      assetId: "BUSH_NATIVE_001",
      assetFamily: "VEGETATION_ASSET_FAMILY_001",
      recipeId: "RECIPE_NATURE_SUBURBAN_GARDEN_STANDARD_001",
      modularBibleEntryId: "MODULAR_BIBLE_NATURE_BUSH_NATIVE_001",
      polygonBudget: deepFreeze({
        close: 96,
        gameplay: 64,
        map: 28,
        distantSilhouette: 12
      }),
      materialBudget: deepFreeze({
        maxSharedMaterials: 2,
        textureStrategy: "shared_atlas_mobile_ready",
        uniqueTexturesAllowed: 0
      }),
      lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]),
      atlasCompatibility: deepFreeze({
        atlasCompatible: true,
        placementRoles: deepFreeze(["garden_fill", "park_border", "coastal_shrub"]),
        instanceReuseExpected: true
      }),
      biomeCompatibility: deepFreeze(["SUBURBAN_GARDEN", "COASTAL", "TEMPERATE_FOREST_EDGE"]),
      previewMetadata: deepFreeze({
        previewAssetReady: true,
        previewOrientation: "camera_agnostic",
        representativeScaleMeters: 1.2
      }),
      validationMetadata: deepFreeze({
        sourceDefinition: "session-112-bush-native-creation-pass",
        productionReadiness: "metadata_validated_first_pass",
        realModelRequiredLater: true
      })
    }),
    createAssetDefinition({
      assetId: "GROUND_COASTAL_GRASS_001",
      assetFamily: "GROUND_ASSET_FAMILY_001",
      recipeId: "RECIPE_NATURE_PARK_STANDARD_001",
      modularBibleEntryId: "MODULAR_BIBLE_NATURE_GROUND_COASTAL_GRASS_001",
      polygonBudget: deepFreeze({
        close: 160,
        gameplay: 96,
        map: 48,
        distantSilhouette: 12
      }),
      materialBudget: deepFreeze({
        maxSharedMaterials: 2,
        textureStrategy: "shared_atlas_mobile_ready",
        uniqueTexturesAllowed: 0
      }),
      lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP", "LOD_DISTANT_SILHOUETTE"]),
      atlasCompatibility: deepFreeze({
        atlasCompatible: true,
        placementRoles: deepFreeze(["park_ground", "verge_ground", "coastal_ground"]),
        instanceReuseExpected: true
      }),
      biomeCompatibility: deepFreeze(["COASTAL", "SUBURBAN_PARKLAND", "TEMPERATE_GRASSLAND"]),
      previewMetadata: deepFreeze({
        previewAssetReady: true,
        previewOrientation: "tile_friendly",
        representativeScaleMeters: 2.0
      }),
      validationMetadata: deepFreeze({
        sourceDefinition: "ground-coastal-grass-prototype-asset-package",
        productionReadiness: "validated_prototype_package",
        realModelRequiredLater: true
      })
    }),
    createAssetDefinition({
      assetId: "ROCK_COASTAL_001",
      assetFamily: "TERRAIN_FEATURE_ASSET_FAMILY_001",
      recipeId: "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001",
      modularBibleEntryId: "MODULAR_BIBLE_NATURE_ROCK_COASTAL_001",
      polygonBudget: deepFreeze({
        close: 128,
        gameplay: 84,
        map: 40,
        distantSilhouette: 14
      }),
      materialBudget: deepFreeze({
        maxSharedMaterials: 2,
        textureStrategy: "shared_atlas_mobile_ready",
        uniqueTexturesAllowed: 0
      }),
      lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]),
      atlasCompatibility: deepFreeze({
        atlasCompatible: true,
        placementRoles: deepFreeze(["cliff_edge", "beach_edge", "river_edge"]),
        instanceReuseExpected: true
      }),
      biomeCompatibility: deepFreeze(["COASTAL", "RIVER_CORRIDOR", "CLIFF_EDGE"]),
      previewMetadata: deepFreeze({
        previewAssetReady: true,
        previewOrientation: "camera_agnostic",
        representativeScaleMeters: 1.8
      }),
      validationMetadata: deepFreeze({
        sourceDefinition: "session-112-rock-coastal-creation-pass",
        productionReadiness: "metadata_validated_first_pass",
        realModelRequiredLater: true
      })
    })
  ])
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const supportedLods = Object.freeze([
  "LOD_CLOSE",
  "LOD_GAMEPLAY",
  "LOD_MAP",
  "LOD_DISTANT_SILHOUETTE"
]);

export function createNatureAssetCreationPass(
  rawDefinition = natureAssetCreationSetDefinition
) {
  const definition = normalizeNatureAssetCreationPass(rawDefinition);
  const naturePack = createNatureAssetPack();
  const validation = buildNatureAssetCreationValidation(definition, naturePack);

  const result = deepFreeze({
    schemaId: natureAssetCreationPassSchemaId,
    setId: definition.setId,
    styleProfile: definition.styleProfile,
    assets: definition.assets,
    natureAssetPack: deepFreeze({
      packId: naturePack.packId,
      assetFamilies: naturePack.assetFamilies
    }),
    validation
  });

  const checked = validateNatureAssetCreationPass(result);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return result;
}

export function validateNatureAssetCreationPass(
  rawCreationPass = natureAssetCreationSetDefinition
) {
  try {
    const creationPass =
      rawCreationPass?.schemaId === natureAssetCreationPassSchemaId &&
      Array.isArray(rawCreationPass.assets) &&
      rawCreationPass.validation
        ? rawCreationPass
        : createNatureAssetCreationPass(rawCreationPass);

    if (creationPass.validation.schemaId !== natureAssetCreationValidationSchemaId) {
      throw createValidationError(
        "invalid_nature_asset_creation_validation_schema",
        `Expected ${natureAssetCreationValidationSchemaId} but received ${creationPass.validation.schemaId}.`
      );
    }

    for (const key of [
      "assetsHaveIds",
      "metadataComplete",
      "lodDefined",
      "atlasCompatible",
      "performanceBudgetValid",
      "validationPassed"
    ]) {
      if (creationPass.validation[key] !== true) {
        throw createValidationError(
          "nature_asset_creation_validation_failed",
          `Nature asset creation validation flag ${key} must be true.`
        );
      }
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      natureAssetCreationPass: creationPass
    });
  } catch (error) {
    if (error?.name !== "NatureAssetCreationPassValidationError") {
      throw error;
    }
    return deepFreeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      natureAssetCreationPass: null
    });
  }
}

function normalizeNatureAssetCreationPass(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "nature asset creation pass");

  return deepFreeze({
    schemaId: natureAssetCreationPassSchemaId,
    setId: normalizeNonEmptyString(definition.setId, "setId"),
    styleProfile: normalizeStyleProfile(definition.styleProfile),
    assets: deepFreeze(
      normalizeAssetDefinitions(definition.assets).sort((left, right) =>
        left.assetId.localeCompare(right.assetId)
      )
    )
  });
}

function normalizeStyleProfile(rawStyleProfile) {
  const styleProfile = asPlainObject(rawStyleProfile, "styleProfile");
  return deepFreeze({
    visualDirection: normalizeNonEmptyString(
      styleProfile.visualDirection,
      "styleProfile.visualDirection"
    ),
    shapeLanguage: normalizeNonEmptyString(
      styleProfile.shapeLanguage,
      "styleProfile.shapeLanguage"
    ),
    materialStrategy: normalizeNonEmptyString(
      styleProfile.materialStrategy,
      "styleProfile.materialStrategy"
    ),
    mobileFriendly: normalizeBoolean(
      styleProfile.mobileFriendly,
      "styleProfile.mobileFriendly"
    ),
    instancingRequired: normalizeBoolean(
      styleProfile.instancingRequired,
      "styleProfile.instancingRequired"
    )
  });
}

function normalizeAssetDefinitions(rawAssets) {
  if (!Array.isArray(rawAssets) || rawAssets.length === 0) {
    throw createValidationError(
      "invalid_nature_assets",
      "Nature asset creation pass must define a non-empty asset list."
    );
  }

  const seenAssetIds = new Set();
  return rawAssets.map((rawAsset) => {
    const asset = normalizeAssetDefinition(rawAsset);
    if (seenAssetIds.has(asset.assetId)) {
      throw createValidationError(
        "duplicate_nature_asset_id",
        `Nature asset ${asset.assetId} appears more than once.`
      );
    }
    seenAssetIds.add(asset.assetId);
    return asset;
  });
}

function normalizeAssetDefinition(rawAsset) {
  const asset = asPlainObject(rawAsset, "natureAsset");
  const assetId = normalizePermanentId(asset.assetId, "natureAsset.assetId");

  return deepFreeze({
    assetId,
    assetFamily: normalizeNonEmptyString(asset.assetFamily, "natureAsset.assetFamily"),
    recipeId: normalizeNonEmptyString(asset.recipeId, "natureAsset.recipeId"),
    modularBibleEntryId: normalizeNonEmptyString(
      asset.modularBibleEntryId,
      "natureAsset.modularBibleEntryId"
    ),
    polygonBudget: normalizePolygonBudget(asset.polygonBudget),
    materialBudget: normalizeMaterialBudget(asset.materialBudget),
    lodRules: deepFreeze(normalizeLodRules(asset.lodRules)),
    atlasCompatibility: normalizeAtlasCompatibility(asset.atlasCompatibility),
    biomeCompatibility: deepFreeze(
      normalizeStringArray(asset.biomeCompatibility, "natureAsset.biomeCompatibility")
    ),
    previewMetadata: normalizePreviewMetadata(asset.previewMetadata),
    validationMetadata: normalizeValidationMetadata(asset.validationMetadata)
  });
}

function normalizePolygonBudget(rawPolygonBudget) {
  const polygonBudget = asPlainObject(rawPolygonBudget, "polygonBudget");
  const normalized = {
    close: normalizePositiveInteger(polygonBudget.close, "polygonBudget.close"),
    gameplay: normalizePositiveInteger(
      polygonBudget.gameplay,
      "polygonBudget.gameplay"
    ),
    map: normalizePositiveInteger(polygonBudget.map, "polygonBudget.map"),
    distantSilhouette: normalizePositiveInteger(
      polygonBudget.distantSilhouette,
      "polygonBudget.distantSilhouette"
    )
  };

  if (
    !(
      normalized.close >= normalized.gameplay &&
      normalized.gameplay >= normalized.map &&
      normalized.map >= normalized.distantSilhouette
    )
  ) {
    throw createValidationError(
      "invalid_polygon_budget_order",
      "Polygon budgets must descend from close to distant silhouette."
    );
  }

  return deepFreeze(normalized);
}

function normalizeMaterialBudget(rawMaterialBudget) {
  const materialBudget = asPlainObject(rawMaterialBudget, "materialBudget");
  return deepFreeze({
    maxSharedMaterials: normalizePositiveInteger(
      materialBudget.maxSharedMaterials,
      "materialBudget.maxSharedMaterials"
    ),
    textureStrategy: normalizeNonEmptyString(
      materialBudget.textureStrategy,
      "materialBudget.textureStrategy"
    ),
    uniqueTexturesAllowed: normalizeNonNegativeInteger(
      materialBudget.uniqueTexturesAllowed,
      "materialBudget.uniqueTexturesAllowed"
    )
  });
}

function normalizeLodRules(rawLodRules) {
  const lodRules = normalizeStringArray(rawLodRules, "natureAsset.lodRules");
  for (const lodRule of lodRules) {
    if (!supportedLods.includes(lodRule)) {
      throw createValidationError(
        "invalid_lod_rule",
        `LOD rule ${lodRule} is not part of the approved nature asset LOD set.`
      );
    }
  }
  return lodRules;
}

function normalizeAtlasCompatibility(rawAtlasCompatibility) {
  const atlasCompatibility = asPlainObject(
    rawAtlasCompatibility,
    "natureAsset.atlasCompatibility"
  );
  return deepFreeze({
    atlasCompatible: normalizeBoolean(
      atlasCompatibility.atlasCompatible,
      "natureAsset.atlasCompatibility.atlasCompatible"
    ),
    placementRoles: deepFreeze(
      normalizeStringArray(
        atlasCompatibility.placementRoles,
        "natureAsset.atlasCompatibility.placementRoles"
      )
    ),
    instanceReuseExpected: normalizeBoolean(
      atlasCompatibility.instanceReuseExpected,
      "natureAsset.atlasCompatibility.instanceReuseExpected"
    )
  });
}

function normalizePreviewMetadata(rawPreviewMetadata) {
  const previewMetadata = asPlainObject(rawPreviewMetadata, "natureAsset.previewMetadata");
  return deepFreeze({
    previewAssetReady: normalizeBoolean(
      previewMetadata.previewAssetReady,
      "natureAsset.previewMetadata.previewAssetReady"
    ),
    previewOrientation: normalizeNonEmptyString(
      previewMetadata.previewOrientation,
      "natureAsset.previewMetadata.previewOrientation"
    ),
    representativeScaleMeters: normalizePositiveNumber(
      previewMetadata.representativeScaleMeters,
      "natureAsset.previewMetadata.representativeScaleMeters"
    )
  });
}

function normalizeValidationMetadata(rawValidationMetadata) {
  const validationMetadata = asPlainObject(
    rawValidationMetadata,
    "natureAsset.validationMetadata"
  );
  return deepFreeze({
    sourceDefinition: normalizeNonEmptyString(
      validationMetadata.sourceDefinition,
      "natureAsset.validationMetadata.sourceDefinition"
    ),
    productionReadiness: normalizeNonEmptyString(
      validationMetadata.productionReadiness,
      "natureAsset.validationMetadata.productionReadiness"
    ),
    realModelRequiredLater: normalizeBoolean(
      validationMetadata.realModelRequiredLater,
      "natureAsset.validationMetadata.realModelRequiredLater"
    )
  });
}

function buildNatureAssetCreationValidation(definition, naturePack) {
  const packAssetIds = new Set(naturePack.assets.map((asset) => asset.assetId));
  const assetsHaveIds = definition.assets.every((asset) => permanentIdPattern.test(asset.assetId));
  const metadataComplete = definition.assets.every(
    (asset) =>
      asset.modularBibleEntryId &&
      asset.materialBudget.textureStrategy &&
      asset.previewMetadata.previewAssetReady === true
  );
  const lodDefined = definition.assets.every((asset) => asset.lodRules.length >= 3);
  const atlasCompatible = definition.assets.every(
    (asset) =>
      asset.atlasCompatibility.atlasCompatible === true &&
      asset.atlasCompatibility.placementRoles.length > 0 &&
      packAssetIds.has(asset.assetId)
  );
  const performanceBudgetValid = definition.assets.every((asset) =>
    asset.polygonBudget.close <= 240 &&
    asset.polygonBudget.gameplay <= 160 &&
    asset.materialBudget.maxSharedMaterials <= 3 &&
    asset.materialBudget.uniqueTexturesAllowed === 0
  );

  const prototypeChecks = deepFreeze({
    treeEucalyptus: validateTreeEucalyptusPrototypeAssetPackage(
      treeEucalyptusPrototypeAssetPackageDefinition
    ).ok,
    groundCoastalGrass: validateGroundCoastalGrassPrototypeAssetPackage(
      groundCoastalGrassPrototypeAssetPackageDefinition
    ).ok
  });

  return deepFreeze({
    schemaId: natureAssetCreationValidationSchemaId,
    assetsHaveIds,
    metadataComplete,
    lodDefined,
    atlasCompatible,
    performanceBudgetValid,
    prototypeChecks,
    validationPassed:
      assetsHaveIds &&
      metadataComplete &&
      lodDefined &&
      atlasCompatible &&
      performanceBudgetValid &&
      prototypeChecks.treeEucalyptus &&
      prototypeChecks.groundCoastalGrass
  });
}

function createAssetDefinition(value) {
  return deepFreeze(value);
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeNonEmptyString(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "invalid_permanent_id",
      `Field ${fieldName} must use the permanent uppercase Asset Factory ID format.`
    );
  }
  return normalized;
}

function normalizeNonEmptyString(value, fieldName) {
  if (typeof value !== "string") {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw createValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }
  return normalized;
}

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty array of strings.`
    );
  }
  return value.map((entry, index) =>
    normalizeNonEmptyString(entry, `${fieldName}[${index}]`)
  );
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a boolean.`
    );
  }
  return value;
}

function normalizePositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw createValidationError(
      "invalid_field_value",
      `Field ${fieldName} must be a positive integer.`
    );
  }
  return value;
}

function normalizeNonNegativeInteger(value, fieldName) {
  if (!Number.isInteger(value) || value < 0) {
    throw createValidationError(
      "invalid_field_value",
      `Field ${fieldName} must be a non-negative integer.`
    );
  }
  return value;
}

function normalizePositiveNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw createValidationError(
      "invalid_field_value",
      `Field ${fieldName} must be a positive number.`
    );
  }
  return value;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }
  return value;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "NatureAssetCreationPassValidationError";
  error.code = code;
  return error;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }
  return value;
}
