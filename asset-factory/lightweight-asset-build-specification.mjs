import {
  buildRealAssetToCustom25DPassiveRendererValidationContext,
  realAssetToCustom25DPassiveRendererValidationDefinition,
  validateRealAssetToCustom25DPassiveRenderer
} from "./real-asset-to-custom-25d-passive-renderer-validation.mjs";
import { coastalAustraliaAssetSpecificationPackDefinition } from "./coastal-australia-asset-specification-pack.mjs";

export const lightweightAssetBuildSpecificationRequiredFields = Object.freeze([
  "assetId",
  "recipeId",
  "geometrySpecification",
  "materialSpecification",
  "lodSpecification",
  "componentMapping",
  "animationSpecification",
  "mobilePerformanceSpecification",
  "metadata"
]);

export const lightweightAssetBuildSpecificationDefinition = deepFreeze({
  assetId: "BUILDING_HOUSE_SMALL_COASTAL_001",
  recipeId: "BUILDING_HOUSE_SMALL_COASTAL_RECIPE_001",
  geometrySpecification: {
    polygonBudgets: {
      close: 320,
      gameplay: 180,
      map: 72,
      distantSilhouette: 24
    },
    modularConstructionLimits: {
      maxUniqueModules: 4,
      maxRepeatedModuleFamilies: 4,
      modularAssemblyRequired: true
    },
    silhouetteRequirements: {
      profile: "custom-2.5d-house-silhouette",
      rooflineReadable: true,
      doorReadable: true,
      windowReadable: true
    },
    lodGeometryExpectations: {
      close: "full facade silhouette with door and window definition",
      gameplay: "simplified facade silhouette with preserved entry readability",
      map: "reduced massing silhouette with roofline retained",
      distantSilhouette: "single-mass silhouette preserving category readability"
    }
  },
  materialSpecification: {
    sharedMaterials: ["COASTAL_WEATHERBOARD_SHARED_001", "COASTAL_ROOF_SHARED_001"],
    textureAtlasRule: "shared-coastal-atlas-only",
    reusableSurfaceDefinitions: [
      {
        surfaceId: "HOUSE_WALL_SURFACE_001",
        materialFamily: "painted_weatherboard",
        atlasRegion: "coastal_residential_walls"
      },
      {
        surfaceId: "HOUSE_ROOF_SURFACE_001",
        materialFamily: "salt_resilient_roofing",
        atlasRegion: "coastal_residential_roofs"
      },
      {
        surfaceId: "HOUSE_TRIM_SURFACE_001",
        materialFamily: "coastal_trim",
        atlasRegion: "coastal_residential_trim"
      }
    ]
  },
  lodSpecification: {
    close: {
      lodId: "close",
      geometryProfile: "lod0",
      silhouettePriority: "full"
    },
    gameplay: {
      lodId: "gameplay",
      geometryProfile: "lod1",
      silhouettePriority: "high"
    },
    map: {
      lodId: "map",
      geometryProfile: "lod2",
      silhouettePriority: "medium"
    },
    distantSilhouette: {
      lodId: "distantSilhouette",
      geometryProfile: "lod3",
      silhouettePriority: "essential"
    }
  },
  componentMapping: [
    {
      buildPieceId: "wall-shell",
      componentId: "COASTAL_HOUSE_WALL_PANEL_001",
      visualRole: "primary-walls",
      materialSurfaceId: "HOUSE_WALL_SURFACE_001"
    },
    {
      buildPieceId: "roof-shell",
      componentId: "COASTAL_HOUSE_ROOF_GABLE_001",
      visualRole: "primary-roof",
      materialSurfaceId: "HOUSE_ROOF_SURFACE_001"
    },
    {
      buildPieceId: "entry-module",
      componentId: "COASTAL_HOUSE_DOOR_BASIC_001",
      visualRole: "entry",
      materialSurfaceId: "HOUSE_TRIM_SURFACE_001"
    },
    {
      buildPieceId: "window-module",
      componentId: "COASTAL_HOUSE_WINDOW_SHUTTER_001",
      visualRole: "window",
      materialSurfaceId: "HOUSE_TRIM_SURFACE_001"
    }
  ],
  animationSpecification: {
    initialStaticState: "static",
    futureAnimationExtensionPoints: ["door-open-state", "window-shutter-variation"],
    runtimeAnimationAuthorized: false
  },
  mobilePerformanceSpecification: {
    storageTargetKb: 192,
    ramTargetKb: 256,
    gpuVertexBudget: 320,
    batchingExpected: true
  },
  metadata: {
    buildProfileId: "LIGHTWEIGHT_BUILD_PROFILE_001",
    rendererCompatibilityProfile: "custom-2.5d-passive",
    creatorSource: "internal",
    validationState: "validated"
  }
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export function buildLightweightAssetBuildSpecificationContext() {
  return Object.freeze(buildRealAssetToCustom25DPassiveRendererValidationContext());
}

export function validateLightweightAssetBuildSpecification(
  rawSpecification = lightweightAssetBuildSpecificationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeBuildSpecificationOptions(options);
    const specification = normalizeBuildSpecification(rawSpecification);
    const assetSpecification = findAssetSpecification(specification.assetId);
    const rendererValidation =
      normalizedOptions.validateCustom25DPassiveRenderer(
        realAssetToCustom25DPassiveRendererValidationDefinition,
        normalizedOptions.validationContext
      );

    if (!rendererValidation.ok) {
      return Object.freeze({
        ok: false,
        errorCode: rendererValidation.errorCode,
        message: rendererValidation.message,
        buildSpecification: null
      });
    }

    validateRecipeIdentity(
      specification.recipeId,
      rendererValidation.custom25DValidation.recipe.recipeId
    );
    validateComponentMapping(
      specification.componentMapping,
      assetSpecification.componentRequirements,
      normalizedOptions.validationContext.componentLibrary,
      specification.materialSpecification.reusableSurfaceDefinitions
    );
    validateRendererCompatibility(specification, rendererValidation.custom25DValidation);
    validateMobileBudgetCompatibility(specification, assetSpecification);

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      buildSpecification: Object.freeze({
        specification,
        assetSpecification,
        rendererValidation: rendererValidation.custom25DValidation,
        compatibility: Object.freeze({
          assetIdentityVerified: true,
          recipeReferenceVerified: true,
          componentMappingVerified: true,
          rendererCompatibilityVerified: true,
          mobileBudgetCompatibilityVerified: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "LightweightAssetBuildSpecificationValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      buildSpecification: null
    });
  }
}

function normalizeBuildSpecificationOptions(options) {
  const validationContext =
    options.validationContext ?? buildLightweightAssetBuildSpecificationContext();
  const validateCustom25DPassiveRenderer =
    typeof options.validateCustom25DPassiveRenderer === "function"
      ? options.validateCustom25DPassiveRenderer
      : validateRealAssetToCustom25DPassiveRenderer;

  return Object.freeze({
    validationContext,
    validateCustom25DPassiveRenderer
  });
}

function normalizeBuildSpecification(rawSpecification) {
  const specification = asPlainObject(rawSpecification, "lightweight asset build specification");
  assertRequiredFields(specification);

  const assetId = normalizePermanentId(specification.assetId, "assetId");
  const recipeId = normalizePermanentId(specification.recipeId, "recipeId");
  const geometrySpecification = normalizeGeometrySpecification(
    specification.geometrySpecification
  );
  const materialSpecification = normalizeMaterialSpecification(
    specification.materialSpecification
  );
  const lodSpecification = normalizeLodSpecification(specification.lodSpecification);
  const componentMapping = normalizeComponentMapping(specification.componentMapping);
  const animationSpecification = normalizeAnimationSpecification(
    specification.animationSpecification
  );
  const mobilePerformanceSpecification = normalizeMobilePerformanceSpecification(
    specification.mobilePerformanceSpecification
  );
  const metadata = normalizeMetadata(specification.metadata);

  return deepFreeze({
    assetId,
    recipeId,
    geometrySpecification,
    materialSpecification,
    lodSpecification,
    componentMapping: deepFreeze(componentMapping),
    animationSpecification,
    mobilePerformanceSpecification,
    metadata
  });
}

function findAssetSpecification(assetId) {
  const specification =
    coastalAustraliaAssetSpecificationPackDefinition.assetSpecifications.find(
      (entry) => entry.assetId === assetId
    ) ?? null;

  if (!specification) {
    throw createBuildSpecificationValidationError(
      "missing_asset_specification",
      `Asset specification ${assetId} is not available for the lightweight asset build profile.`
    );
  }

  return specification;
}

function validateRecipeIdentity(buildRecipeId, rendererRecipeId) {
  if (buildRecipeId !== rendererRecipeId) {
    throw createBuildSpecificationValidationError(
      "recipe_reference_mismatch",
      "Build specification recipe identity must match the validated passive renderer contract recipe."
    );
  }
}

function validateComponentMapping(
  componentMapping,
  expectedComponentIds,
  componentLibrary,
  reusableSurfaceDefinitions
) {
  const expectedSet = new Set(expectedComponentIds);
  const mappedSet = new Set();
  const surfaceIds = new Set(reusableSurfaceDefinitions.map((surface) => surface.surfaceId));

  if (componentMapping.length !== expectedComponentIds.length) {
    throw createBuildSpecificationValidationError(
      "component_mapping_incomplete",
      "Build specification component mapping must cover every approved asset component exactly once."
    );
  }

  for (const entry of componentMapping) {
    if (!expectedSet.has(entry.componentId)) {
      throw createBuildSpecificationValidationError(
        "unexpected_component_mapping",
        `Component mapping ${entry.componentId} is not part of the approved asset specification component set.`
      );
    }

    if (mappedSet.has(entry.componentId)) {
      throw createBuildSpecificationValidationError(
        "duplicate_component_mapping",
        `Component ${entry.componentId} is mapped more than once in the lightweight build specification.`
      );
    }

    if (!surfaceIds.has(entry.materialSurfaceId)) {
      throw createBuildSpecificationValidationError(
        "missing_surface_definition",
        `Component mapping ${entry.componentId} references missing material surface ${entry.materialSurfaceId}.`
      );
    }

    const component = componentLibrary.findComponentById(entry.componentId);
    if (!component) {
      throw createBuildSpecificationValidationError(
        "missing_component_reference",
        `Build specification component ${entry.componentId} is not available in the component library.`
      );
    }

    if (
      typeof componentLibrary.isComponentAvailable === "function" &&
      !componentLibrary.isComponentAvailable(entry.componentId)
    ) {
      throw createBuildSpecificationValidationError(
        "unavailable_component_reference",
        `Build specification component ${entry.componentId} is not approved for lightweight asset builds.`
      );
    }

    mappedSet.add(entry.componentId);
  }
}

function validateRendererCompatibility(specification, rendererValidation) {
  const compatibility = rendererValidation.compatibility;
  if (!compatibility.passiveConsumerCompatibilityVerified) {
    throw createBuildSpecificationValidationError(
      "renderer_compatibility_failed",
      "Passive renderer consumer compatibility must be verified before a lightweight build specification is accepted."
    );
  }

  if (specification.metadata.rendererCompatibilityProfile !== compatibility.rendererProfile) {
    throw createBuildSpecificationValidationError(
      "renderer_profile_mismatch",
      "Build specification renderer compatibility profile must match the validated passive Custom 2.5D contract profile."
    );
  }

  const rendererOutput = rendererValidation.rendererFacingOutput;
  if (rendererOutput.rendererAssetReference.assetId !== specification.assetId) {
    throw createBuildSpecificationValidationError(
      "asset_identity_mismatch",
      "Build specification asset identity must match the renderer-facing passive output identity."
    );
  }
}

function validateMobileBudgetCompatibility(specification, assetSpecification) {
  const budgets = specification.geometrySpecification.polygonBudgets;
  if (
    !(budgets.close > budgets.gameplay &&
      budgets.gameplay > budgets.map &&
      budgets.map > budgets.distantSilhouette)
  ) {
    throw createBuildSpecificationValidationError(
      "invalid_polygon_budget_order",
      "Polygon budgets must decrease from close to gameplay to map to distant silhouette."
    );
  }

  if (
    specification.mobilePerformanceSpecification.gpuVertexBudget < budgets.close
  ) {
    throw createBuildSpecificationValidationError(
      "gpu_budget_too_small",
      "GPU vertex budget must be at least as large as the close-view polygon budget."
    );
  }

  const performance = assetSpecification.mobilePerformanceRequirements;
  if (
    performance.storageBudget !== "low" ||
    performance.ramBudget !== "low" ||
    performance.gpuBudget !== "low"
  ) {
    throw createBuildSpecificationValidationError(
      "mobile_budget_mismatch",
      "Lightweight build specification requires the source asset specification to remain in the low mobile budget profile."
    );
  }
}

function normalizeGeometrySpecification(value) {
  const geometrySpecification = asPlainObject(value, "geometrySpecification");
  const polygonBudgets = asPlainObject(
    geometrySpecification.polygonBudgets,
    "geometrySpecification.polygonBudgets"
  );
  const modularConstructionLimits = asPlainObject(
    geometrySpecification.modularConstructionLimits,
    "geometrySpecification.modularConstructionLimits"
  );
  const silhouetteRequirements = asPlainObject(
    geometrySpecification.silhouetteRequirements,
    "geometrySpecification.silhouetteRequirements"
  );
  const lodGeometryExpectations = asPlainObject(
    geometrySpecification.lodGeometryExpectations,
    "geometrySpecification.lodGeometryExpectations"
  );

  return deepFreeze({
    polygonBudgets: deepFreeze({
      close: normalizePositiveInteger(polygonBudgets.close, "polygonBudgets.close"),
      gameplay: normalizePositiveInteger(
        polygonBudgets.gameplay,
        "polygonBudgets.gameplay"
      ),
      map: normalizePositiveInteger(polygonBudgets.map, "polygonBudgets.map"),
      distantSilhouette: normalizePositiveInteger(
        polygonBudgets.distantSilhouette,
        "polygonBudgets.distantSilhouette"
      )
    }),
    modularConstructionLimits: deepFreeze({
      maxUniqueModules: normalizePositiveInteger(
        modularConstructionLimits.maxUniqueModules,
        "modularConstructionLimits.maxUniqueModules"
      ),
      maxRepeatedModuleFamilies: normalizePositiveInteger(
        modularConstructionLimits.maxRepeatedModuleFamilies,
        "modularConstructionLimits.maxRepeatedModuleFamilies"
      ),
      modularAssemblyRequired: normalizeBoolean(
        modularConstructionLimits.modularAssemblyRequired,
        "modularConstructionLimits.modularAssemblyRequired"
      )
    }),
    silhouetteRequirements: deepFreeze({
      profile: normalizeStringValue(
        silhouetteRequirements.profile,
        "silhouetteRequirements.profile"
      ),
      rooflineReadable: normalizeBoolean(
        silhouetteRequirements.rooflineReadable,
        "silhouetteRequirements.rooflineReadable"
      ),
      doorReadable: normalizeBoolean(
        silhouetteRequirements.doorReadable,
        "silhouetteRequirements.doorReadable"
      ),
      windowReadable: normalizeBoolean(
        silhouetteRequirements.windowReadable,
        "silhouetteRequirements.windowReadable"
      )
    }),
    lodGeometryExpectations: deepFreeze({
      close: normalizeStringValue(lodGeometryExpectations.close, "lodGeometryExpectations.close"),
      gameplay: normalizeStringValue(
        lodGeometryExpectations.gameplay,
        "lodGeometryExpectations.gameplay"
      ),
      map: normalizeStringValue(lodGeometryExpectations.map, "lodGeometryExpectations.map"),
      distantSilhouette: normalizeStringValue(
        lodGeometryExpectations.distantSilhouette,
        "lodGeometryExpectations.distantSilhouette"
      )
    })
  });
}

function normalizeMaterialSpecification(value) {
  const materialSpecification = asPlainObject(value, "materialSpecification");
  const reusableSurfaceDefinitions = normalizeReusableSurfaceDefinitions(
    materialSpecification.reusableSurfaceDefinitions
  );

  return deepFreeze({
    sharedMaterials: deepFreeze(
      normalizePermanentIdArray(materialSpecification.sharedMaterials, "sharedMaterials")
    ),
    textureAtlasRule: normalizeStringValue(
      materialSpecification.textureAtlasRule,
      "textureAtlasRule"
    ),
    reusableSurfaceDefinitions: deepFreeze(reusableSurfaceDefinitions)
  });
}

function normalizeReusableSurfaceDefinitions(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createBuildSpecificationValidationError(
      "invalid_field_type",
      "reusableSurfaceDefinitions must be a non-empty array."
    );
  }

  return value.map((entry, index) => {
    const surface = asPlainObject(entry, `reusableSurfaceDefinitions[${index}]`);

    return deepFreeze({
      surfaceId: normalizeStringValue(surface.surfaceId, `surfaceId[${index}]`),
      materialFamily: normalizeStringValue(
        surface.materialFamily,
        `materialFamily[${index}]`
      ),
      atlasRegion: normalizeStringValue(surface.atlasRegion, `atlasRegion[${index}]`)
    });
  });
}

function normalizeLodSpecification(value) {
  const lodSpecification = asPlainObject(value, "lodSpecification");
  const lodKeys = ["close", "gameplay", "map", "distantSilhouette"];
  const normalized = {};

  for (const lodKey of lodKeys) {
    const lodEntry = asPlainObject(lodSpecification[lodKey], `lodSpecification.${lodKey}`);
    normalized[lodKey] = deepFreeze({
      lodId: normalizeStringValue(lodEntry.lodId, `lodSpecification.${lodKey}.lodId`),
      geometryProfile: normalizeStringValue(
        lodEntry.geometryProfile,
        `lodSpecification.${lodKey}.geometryProfile`
      ),
      silhouettePriority: normalizeStringValue(
        lodEntry.silhouettePriority,
        `lodSpecification.${lodKey}.silhouettePriority`
      )
    });
  }

  return deepFreeze(normalized);
}

function normalizeComponentMapping(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createBuildSpecificationValidationError(
      "invalid_field_type",
      "componentMapping must be a non-empty array."
    );
  }

  return value.map((entry, index) => {
    const mapping = asPlainObject(entry, `componentMapping[${index}]`);

    return deepFreeze({
      buildPieceId: normalizeStringValue(
        mapping.buildPieceId,
        `componentMapping[${index}].buildPieceId`
      ),
      componentId: normalizePermanentId(
        mapping.componentId,
        `componentMapping[${index}].componentId`
      ),
      visualRole: normalizeStringValue(
        mapping.visualRole,
        `componentMapping[${index}].visualRole`
      ),
      materialSurfaceId: normalizeStringValue(
        mapping.materialSurfaceId,
        `componentMapping[${index}].materialSurfaceId`
      )
    });
  });
}

function normalizeAnimationSpecification(value) {
  const animationSpecification = asPlainObject(value, "animationSpecification");

  return deepFreeze({
    initialStaticState: normalizeStringValue(
      animationSpecification.initialStaticState,
      "animationSpecification.initialStaticState"
    ),
    futureAnimationExtensionPoints: deepFreeze(
      normalizeStringArray(
        animationSpecification.futureAnimationExtensionPoints,
        "animationSpecification.futureAnimationExtensionPoints"
      )
    ),
    runtimeAnimationAuthorized: normalizeBoolean(
      animationSpecification.runtimeAnimationAuthorized,
      "animationSpecification.runtimeAnimationAuthorized"
    )
  });
}

function normalizeMobilePerformanceSpecification(value) {
  const mobilePerformanceSpecification = asPlainObject(
    value,
    "mobilePerformanceSpecification"
  );

  return deepFreeze({
    storageTargetKb: normalizePositiveInteger(
      mobilePerformanceSpecification.storageTargetKb,
      "mobilePerformanceSpecification.storageTargetKb"
    ),
    ramTargetKb: normalizePositiveInteger(
      mobilePerformanceSpecification.ramTargetKb,
      "mobilePerformanceSpecification.ramTargetKb"
    ),
    gpuVertexBudget: normalizePositiveInteger(
      mobilePerformanceSpecification.gpuVertexBudget,
      "mobilePerformanceSpecification.gpuVertexBudget"
    ),
    batchingExpected: normalizeBoolean(
      mobilePerformanceSpecification.batchingExpected,
      "mobilePerformanceSpecification.batchingExpected"
    )
  });
}

function normalizeMetadata(value) {
  const metadata = asPlainObject(value, "metadata");

  return deepFreeze({
    buildProfileId: normalizePermanentId(metadata.buildProfileId, "metadata.buildProfileId"),
    rendererCompatibilityProfile: normalizeStringValue(
      metadata.rendererCompatibilityProfile,
      "metadata.rendererCompatibilityProfile"
    ),
    creatorSource: normalizeStringValue(metadata.creatorSource, "metadata.creatorSource"),
    validationState: normalizeStringValue(
      metadata.validationState,
      "metadata.validationState"
    )
  });
}

function assertRequiredFields(specification) {
  for (const fieldName of lightweightAssetBuildSpecificationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(specification, fieldName)) {
      throw createBuildSpecificationValidationError(
        "missing_required_field",
        `Lightweight asset build specification is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createBuildSpecificationValidationError(
      "invalid_field_type",
      `${fieldName} must be a non-empty array of permanent IDs.`
    );
  }

  return value.map((entry, index) =>
    normalizePermanentId(entry, `${fieldName}[${index}]`)
  );
}

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createBuildSpecificationValidationError(
      "invalid_field_type",
      `${fieldName} must be an array of strings.`
    );
  }

  return value.map((entry, index) =>
    normalizeStringValue(entry, `${fieldName}[${index}]`)
  );
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();

  if (!permanentIdPattern.test(normalized)) {
    throw createBuildSpecificationValidationError(
      "invalid_identifier",
      `Field ${fieldName} must use the approved permanent uppercase Asset Factory ID format.`
    );
  }

  return normalized;
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createBuildSpecificationValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a string.`
    );
  }

  const normalized = value.trim();
  if (!normalized) {
    throw createBuildSpecificationValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be empty.`
    );
  }

  return normalized;
}

function normalizePositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw createBuildSpecificationValidationError(
      "invalid_field_value",
      `Field ${fieldName} must be a positive integer.`
    );
  }

  return value;
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createBuildSpecificationValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a boolean.`
    );
  }

  return value;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createBuildSpecificationValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createBuildSpecificationValidationError(code, message) {
  const error = new Error(message);
  error.name = "LightweightAssetBuildSpecificationValidationError";
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
