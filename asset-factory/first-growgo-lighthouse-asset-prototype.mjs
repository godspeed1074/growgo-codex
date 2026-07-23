import {
  buildRealAssetPackageRuntimeReplacementTestContext,
  realAssetPackageRuntimeReplacementTestDefinition,
  validateRealAssetPackageRuntimeReplacementTest
} from "./real-asset-package-runtime-replacement-test.mjs";
import {
  assetGenerationWorkspaceAppearanceProfileFoundationDefinition,
  validateAssetGenerationWorkspaceAppearanceProfileFoundation
} from "./asset-generation-workspace-appearance-profile-foundation.mjs";
import {
  lighthouseConceptAssetFactoryHandoffDefinition,
  validateLighthouseConceptAssetFactoryHandoff
} from "./lighthouse-concept-asset-factory-handoff.mjs";

export const firstGrowGoLighthouseAssetPrototypeRequiredFields = Object.freeze([
  "modularLibraryAudit",
  "prototypeAsset",
  "prototypeModuleDefinitions"
]);

export const firstGrowGoLighthouseAssetPrototypeDefinition = deepFreeze({
  modularLibraryAudit: deepFreeze({
    reusableExistingModules: deepFreeze([]),
    newLighthouseModules: deepFreeze([
      "LIGHTHOUSE_TOWER_BASE_001",
      "LIGHTHOUSE_TOWER_BODY_TALL_001",
      "LIGHTHOUSE_LANTERN_BASE_001",
      "LIGHTHOUSE_GLASS_RING_001",
      "LIGHTHOUSE_ROOF_CAP_001",
      "LIGHTHOUSE_BEAM_EFFECT_001"
    ]),
    reuseSummary: deepFreeze({
      totalModuleCount: 6,
      reusableModuleCount: 0,
      newModuleCount: 6,
      reusePercentage: 0
    })
  }),
  prototypeAsset: deepFreeze({
    assetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
    componentReferences: deepFreeze([
      "LIGHTHOUSE_TOWER_BASE_001",
      "LIGHTHOUSE_TOWER_BODY_TALL_001",
      "LIGHTHOUSE_LANTERN_BASE_001",
      "LIGHTHOUSE_GLASS_RING_001",
      "LIGHTHOUSE_ROOF_CAP_001",
      "LIGHTHOUSE_BEAM_EFFECT_001"
    ]),
    materialReferences: deepFreeze([
      "LIGHTHOUSE_MASONRY_SHARED_001",
      "LIGHTHOUSE_LANTERN_SHARED_001",
      "LIGHTHOUSE_BEAM_SHARED_001"
    ]),
    lodReferences: deepFreeze({
      close: "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_CLOSE.glb",
      gameplay: "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_GAMEPLAY.glb",
      map: "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_MAP.glb",
      distantSilhouette: "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_DISTANT_SILHOUETTE.glb"
    }),
    appearanceProfiles: deepFreeze([
      "DAY_COASTAL_LIGHTHOUSE",
      "NIGHT_COASTAL_LIGHTHOUSE",
      "SUNSET_COASTAL_LIGHTHOUSE"
    ]),
    performanceMetadata: deepFreeze({
      storageTargetKb: 256,
      ramTargetKb: 384,
      gpuVertexBudget: 480,
      batchingExpected: true
    })
  }),
  prototypeModuleDefinitions: deepFreeze([
    createPrototypeModuleDefinition(
      "LIGHTHOUSE_TOWER_BASE_001",
      "walls",
      "lighthouse_tower_base",
      5,
      3,
      5
    ),
    createPrototypeModuleDefinition(
      "LIGHTHOUSE_TOWER_BODY_TALL_001",
      "walls",
      "lighthouse_tower_body_tall",
      4,
      12,
      4
    ),
    createPrototypeModuleDefinition(
      "LIGHTHOUSE_LANTERN_BASE_001",
      "walls",
      "lighthouse_lantern_base",
      3,
      2,
      3
    ),
    createPrototypeModuleDefinition(
      "LIGHTHOUSE_GLASS_RING_001",
      "windows",
      "lighthouse_glass_ring",
      3,
      2,
      3
    ),
    createPrototypeModuleDefinition(
      "LIGHTHOUSE_ROOF_CAP_001",
      "roofs",
      "lighthouse_roof_cap",
      3,
      2,
      3
    ),
    createPrototypeModuleDefinition(
      "LIGHTHOUSE_BEAM_EFFECT_001",
      "windows",
      "lighthouse_beam_effect",
      1,
      6,
      1
    )
  ])
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export function buildFirstGrowGoLighthouseAssetPrototypeContext() {
  return Object.freeze(buildRealAssetPackageRuntimeReplacementTestContext());
}

export function validateFirstGrowGoLighthouseAssetPrototype(
  rawPrototype = firstGrowGoLighthouseAssetPrototypeDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const prototype = normalizePrototype(rawPrototype);

    const handoffResult = normalizedOptions.validateLighthouseConceptAssetFactoryHandoff(
      normalizedOptions.handoffDefinition
    );
    if (!handoffResult.ok) {
      return freezeFailure(handoffResult);
    }

    const runtimeReplacementResult =
      normalizedOptions.validateRealAssetPackageRuntimeReplacementTest(
        normalizedOptions.runtimeReplacementDefinition,
        { validationContext: normalizedOptions.validationContext }
      );
    if (!runtimeReplacementResult.ok) {
      return freezeFailure(runtimeReplacementResult);
    }

    const workspaceResult =
      normalizedOptions.validateAssetGenerationWorkspaceAppearanceProfileFoundation(
        normalizedOptions.workspaceDefinition,
        { validationContext: normalizedOptions.validationContext }
      );
    if (!workspaceResult.ok) {
      return freezeFailure(workspaceResult);
    }

    const lighthousePrototype = buildLighthousePrototypeResult(
      prototype,
      handoffResult.handoff.planningData,
      runtimeReplacementResult.runtimeReplacementValidation,
      workspaceResult.workspaceProfile.foundation,
      normalizedOptions.validationContext
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      lighthousePrototype
    });
  } catch (error) {
    if (error?.name !== "FirstGrowGoLighthouseAssetPrototypeValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      lighthousePrototype: null
    });
  }
}

function normalizeOptions(options) {
  const validationContext =
    options.validationContext ?? buildFirstGrowGoLighthouseAssetPrototypeContext();

  return Object.freeze({
    validationContext,
    handoffDefinition:
      options.handoffDefinition ?? lighthouseConceptAssetFactoryHandoffDefinition,
    runtimeReplacementDefinition:
      options.runtimeReplacementDefinition ??
      realAssetPackageRuntimeReplacementTestDefinition,
    workspaceDefinition:
      options.workspaceDefinition ??
      assetGenerationWorkspaceAppearanceProfileFoundationDefinition,
    validateLighthouseConceptAssetFactoryHandoff:
      typeof options.validateLighthouseConceptAssetFactoryHandoff === "function"
        ? options.validateLighthouseConceptAssetFactoryHandoff
        : validateLighthouseConceptAssetFactoryHandoff,
    validateRealAssetPackageRuntimeReplacementTest:
      typeof options.validateRealAssetPackageRuntimeReplacementTest === "function"
        ? options.validateRealAssetPackageRuntimeReplacementTest
        : validateRealAssetPackageRuntimeReplacementTest,
    validateAssetGenerationWorkspaceAppearanceProfileFoundation:
      typeof options.validateAssetGenerationWorkspaceAppearanceProfileFoundation ===
      "function"
        ? options.validateAssetGenerationWorkspaceAppearanceProfileFoundation
        : validateAssetGenerationWorkspaceAppearanceProfileFoundation
  });
}

function buildLighthousePrototypeResult(
  prototype,
  handoff,
  runtimeReplacementValidation,
  workspaceFoundation,
  context
) {
  validateModularLibraryAudit(prototype.modularLibraryAudit, handoff);
  validatePrototypeStructure(
    prototype.prototypeAsset,
    runtimeReplacementValidation,
    workspaceFoundation
  );
  validatePrototypeModules(
    prototype.prototypeModuleDefinitions,
    prototype.prototypeAsset,
    handoff,
    context
  );

  return Object.freeze({
    modularLibraryAudit: prototype.modularLibraryAudit,
    prototypeAsset: prototype.prototypeAsset,
    prototypeModuleDefinitions: prototype.prototypeModuleDefinitions,
    compatibility: Object.freeze({
      componentCompatibilityVerified: true,
      recipeCompatibilityVerified: true,
      importContractCompatibilityVerified: true,
      workspaceCompatibilityVerified: true,
      performanceRulesVerified: true,
      passiveOnly: true
    })
  });
}

function validateModularLibraryAudit(modularLibraryAudit, handoff) {
  const expectedNewModules = [
    "LIGHTHOUSE_TOWER_BASE_001",
    "LIGHTHOUSE_TOWER_BODY_TALL_001",
    "LIGHTHOUSE_LANTERN_BASE_001",
    "LIGHTHOUSE_GLASS_RING_001",
    "LIGHTHOUSE_ROOF_CAP_001",
    "LIGHTHOUSE_BEAM_EFFECT_001"
  ];

  if (
    JSON.stringify(modularLibraryAudit.newLighthouseModules) !==
    JSON.stringify(expectedNewModules)
  ) {
    throw createValidationError(
      "prototype_module_selection_mismatch",
      "The lighthouse prototype must define the approved six-module prototype set."
    );
  }

  for (const moduleId of modularLibraryAudit.newLighthouseModules) {
    if (!handoff.plannedComponents.includes(moduleId)) {
      throw createValidationError(
        "module_not_in_handoff_plan",
        `Prototype module ${moduleId} is not present in the lighthouse concept handoff plan.`
      );
    }
  }

  if (modularLibraryAudit.reusableExistingModules.length !== 0) {
    throw createValidationError(
      "unexpected_reusable_modules",
      "The first lighthouse prototype must keep reusableExistingModules empty until shared lighthouse modules are formally introduced."
    );
  }

  const reuseSummary = modularLibraryAudit.reuseSummary;
  if (
    reuseSummary.totalModuleCount !== 6 ||
    reuseSummary.reusableModuleCount !== 0 ||
    reuseSummary.newModuleCount !== 6 ||
    reuseSummary.reusePercentage !== 0
  ) {
    throw createValidationError(
      "invalid_reuse_summary",
      "The lighthouse prototype reuse summary must report six total modules, zero reusable modules, and zero reuse percentage."
    );
  }
}

function validatePrototypeStructure(
  prototypeAsset,
  runtimeReplacementValidation,
  workspaceFoundation
) {
  const runtimeResolution = runtimeReplacementValidation.assetResolution;
  if (prototypeAsset.assetId !== runtimeResolution.assetId) {
    throw createValidationError(
      "asset_identity_mismatch",
      "Prototype assetId must match the lighthouse runtime replacement assetId."
    );
  }

  if (
    JSON.stringify(prototypeAsset.lodReferences) !==
    JSON.stringify(runtimeResolution.lodReferences)
  ) {
    throw createValidationError(
      "lod_reference_mismatch",
      "Prototype LOD references must match the lighthouse runtime replacement LOD references."
    );
  }

  if (
    JSON.stringify(prototypeAsset.appearanceProfiles) !==
    JSON.stringify(runtimeResolution.appearanceProfiles)
  ) {
    throw createValidationError(
      "appearance_profile_mismatch",
      "Prototype appearance profiles must match the lighthouse runtime replacement appearance profiles."
    );
  }

  if (
    prototypeAsset.performanceMetadata.storageTargetKb >
      workspaceFoundation.performanceProfile.storageBudgetKb ||
    prototypeAsset.performanceMetadata.ramTargetKb >
      workspaceFoundation.performanceProfile.ramBudgetKb
  ) {
    throw createValidationError(
      "workspace_performance_budget_exceeded",
      "Prototype performance metadata must remain within the lighthouse workspace storage and RAM budgets."
    );
  }

  if (prototypeAsset.performanceMetadata.batchingExpected !== true) {
    throw createValidationError(
      "invalid_performance_rules",
      "Prototype performance metadata must preserve batchingExpected: true."
    );
  }
}

function validatePrototypeModules(
  prototypeModuleDefinitions,
  prototypeAsset,
  handoff,
  context
) {
  const recipe = context.recipeRegistry.findRecipeById("LIGHTHOUSE_ISLAND_ROCKY_RECIPE_001");
  if (!recipe || !context.recipeRegistry.isRecipeAvailable("LIGHTHOUSE_ISLAND_ROCKY_RECIPE_001")) {
    throw createValidationError(
      "missing_recipe_reference",
      "The lighthouse prototype requires the validated LIGHTHOUSE_ISLAND_ROCKY_RECIPE_001 recipe."
    );
  }

  for (const moduleDefinition of prototypeModuleDefinitions) {
    const libraryComponent = context.componentLibrary.findComponentById(
      moduleDefinition.componentId
    );

    if (!libraryComponent || !context.componentLibrary.isComponentAvailable(moduleDefinition.componentId)) {
      throw createValidationError(
        "missing_component_reference",
        `Prototype module ${moduleDefinition.componentId} is not available in the modular component library.`
      );
    }

    if (!prototypeAsset.componentReferences.includes(moduleDefinition.componentId)) {
      throw createValidationError(
        "prototype_component_mismatch",
        `Prototype module ${moduleDefinition.componentId} is not included in the prototype asset component references.`
      );
    }

    if (!handoff.plannedComponents.includes(moduleDefinition.componentId)) {
      throw createValidationError(
        "module_not_in_handoff_plan",
        `Prototype module ${moduleDefinition.componentId} is not in the lighthouse concept handoff component plan.`
      );
    }

    if (!recipe.components.includes(moduleDefinition.componentId)) {
      throw createValidationError(
        "recipe_component_mismatch",
        `Prototype module ${moduleDefinition.componentId} is not part of the lighthouse recipe component set.`
      );
    }

    validateModuleMatchesLibrary(moduleDefinition, libraryComponent);
  }
}

function validateModuleMatchesLibrary(moduleDefinition, libraryComponent) {
  const comparableFields = ["componentId", "category", "type", "version", "status"];
  for (const fieldName of comparableFields) {
    if (moduleDefinition[fieldName] !== libraryComponent[fieldName]) {
      throw createValidationError(
        "component_contract_mismatch",
        `Prototype module ${moduleDefinition.componentId} must match modular library field ${fieldName}.`
      );
    }
  }

  if (
    JSON.stringify(moduleDefinition.dimensions) !==
    JSON.stringify(libraryComponent.dimensions)
  ) {
    throw createValidationError(
      "component_dimensions_mismatch",
      `Prototype module ${moduleDefinition.componentId} must match the modular library dimensions.`
    );
  }
}

function normalizePrototype(rawPrototype) {
  const prototype = asPlainObject(rawPrototype, "lighthouse asset prototype");
  assertRequiredFields(prototype);

  return deepFreeze({
    modularLibraryAudit: normalizeModularLibraryAudit(prototype.modularLibraryAudit),
    prototypeAsset: normalizePrototypeAsset(prototype.prototypeAsset),
    prototypeModuleDefinitions: deepFreeze(
      normalizePrototypeModuleDefinitions(prototype.prototypeModuleDefinitions)
    )
  });
}

function normalizeModularLibraryAudit(value) {
  const modularLibraryAudit = asPlainObject(value, "modularLibraryAudit");
  const reuseSummary = asPlainObject(modularLibraryAudit.reuseSummary, "modularLibraryAudit.reuseSummary");

  return deepFreeze({
    reusableExistingModules: deepFreeze(
      normalizePermanentIdArray(
        modularLibraryAudit.reusableExistingModules,
        "modularLibraryAudit.reusableExistingModules",
        true
      )
    ),
    newLighthouseModules: deepFreeze(
      normalizePermanentIdArray(
        modularLibraryAudit.newLighthouseModules,
        "modularLibraryAudit.newLighthouseModules"
      )
    ),
    reuseSummary: deepFreeze({
      totalModuleCount: normalizeNonNegativeInteger(
        reuseSummary.totalModuleCount,
        "modularLibraryAudit.reuseSummary.totalModuleCount"
      ),
      reusableModuleCount: normalizeNonNegativeInteger(
        reuseSummary.reusableModuleCount,
        "modularLibraryAudit.reuseSummary.reusableModuleCount"
      ),
      newModuleCount: normalizeNonNegativeInteger(
        reuseSummary.newModuleCount,
        "modularLibraryAudit.reuseSummary.newModuleCount"
      ),
      reusePercentage: normalizePercentage(
        reuseSummary.reusePercentage,
        "modularLibraryAudit.reuseSummary.reusePercentage"
      )
    })
  });
}

function normalizePrototypeAsset(value) {
  const prototypeAsset = asPlainObject(value, "prototypeAsset");
  const performanceMetadata = asPlainObject(
    prototypeAsset.performanceMetadata,
    "prototypeAsset.performanceMetadata"
  );

  return deepFreeze({
    assetId: normalizePermanentId(prototypeAsset.assetId, "prototypeAsset.assetId"),
    componentReferences: deepFreeze(
      normalizePermanentIdArray(
        prototypeAsset.componentReferences,
        "prototypeAsset.componentReferences"
      )
    ),
    materialReferences: deepFreeze(
      normalizePermanentIdArray(
        prototypeAsset.materialReferences,
        "prototypeAsset.materialReferences"
      )
    ),
    lodReferences: deepFreeze(
      normalizeLodReferences(prototypeAsset.lodReferences, "prototypeAsset.lodReferences")
    ),
    appearanceProfiles: deepFreeze(
      normalizeUppercaseStringArray(
        prototypeAsset.appearanceProfiles,
        "prototypeAsset.appearanceProfiles"
      )
    ),
    performanceMetadata: deepFreeze({
      storageTargetKb: normalizePositiveInteger(
        performanceMetadata.storageTargetKb,
        "prototypeAsset.performanceMetadata.storageTargetKb"
      ),
      ramTargetKb: normalizePositiveInteger(
        performanceMetadata.ramTargetKb,
        "prototypeAsset.performanceMetadata.ramTargetKb"
      ),
      gpuVertexBudget: normalizePositiveInteger(
        performanceMetadata.gpuVertexBudget,
        "prototypeAsset.performanceMetadata.gpuVertexBudget"
      ),
      batchingExpected: normalizeBoolean(
        performanceMetadata.batchingExpected,
        "prototypeAsset.performanceMetadata.batchingExpected"
      )
    })
  });
}

function normalizePrototypeModuleDefinitions(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_field_type",
      "prototypeModuleDefinitions must be a non-empty array."
    );
  }

  return value.map((entry, index) => {
    const moduleDefinition = asPlainObject(
      entry,
      `prototypeModuleDefinitions[${index}]`
    );
    return deepFreeze({
      componentId: normalizePermanentId(
        moduleDefinition.componentId,
        `prototypeModuleDefinitions[${index}].componentId`
      ),
      category: normalizeStringValue(
        moduleDefinition.category,
        `prototypeModuleDefinitions[${index}].category`
      ),
      type: normalizeStringValue(
        moduleDefinition.type,
        `prototypeModuleDefinitions[${index}].type`
      ),
      version: normalizeStringValue(
        moduleDefinition.version,
        `prototypeModuleDefinitions[${index}].version`
      ),
      status: normalizeStringValue(
        moduleDefinition.status,
        `prototypeModuleDefinitions[${index}].status`
      ),
      dimensions: deepFreeze(asPlainObject(
        moduleDefinition.dimensions,
        `prototypeModuleDefinitions[${index}].dimensions`
      )),
      attachmentPoints: deepFreeze(
        normalizeAttachmentPoints(
          moduleDefinition.attachmentPoints,
          `prototypeModuleDefinitions[${index}].attachmentPoints`
        )
      ),
      compatibilityRules: deepFreeze(asPlainObject(
        moduleDefinition.compatibilityRules,
        `prototypeModuleDefinitions[${index}].compatibilityRules`
      )),
      tags: deepFreeze(
        normalizeStringArray(moduleDefinition.tags, `prototypeModuleDefinitions[${index}].tags`)
      ),
      metadata: deepFreeze(asPlainObject(
        moduleDefinition.metadata,
        `prototypeModuleDefinitions[${index}].metadata`
      ))
    });
  });
}

function normalizeAttachmentPoints(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_field_type",
      `${fieldName} must be a non-empty array.`
    );
  }

  return value.map((entry, index) => {
    const attachmentPoint = asPlainObject(entry, `${fieldName}[${index}]`);
    const position = asPlainObject(
      attachmentPoint.position,
      `${fieldName}[${index}].position`
    );

    return deepFreeze({
      pointId: normalizeStringValue(
        attachmentPoint.pointId,
        `${fieldName}[${index}].pointId`
      ),
      type: normalizeStringValue(
        attachmentPoint.type,
        `${fieldName}[${index}].type`
      ),
      position: deepFreeze({
        x: normalizeFiniteNumber(position.x, `${fieldName}[${index}].position.x`),
        y: normalizeFiniteNumber(position.y, `${fieldName}[${index}].position.y`),
        z: normalizeFiniteNumber(position.z, `${fieldName}[${index}].position.z`)
      })
    });
  });
}

function normalizeLodReferences(value, fieldName) {
  const lodReferences = asPlainObject(value, fieldName);
  return {
    close: normalizeGlbFilename(lodReferences.close, `${fieldName}.close`),
    gameplay: normalizeGlbFilename(lodReferences.gameplay, `${fieldName}.gameplay`),
    map: normalizeGlbFilename(lodReferences.map, `${fieldName}.map`),
    distantSilhouette: normalizeGlbFilename(
      lodReferences.distantSilhouette,
      `${fieldName}.distantSilhouette`
    )
  };
}

function normalizeGlbFilename(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!normalized.endsWith(".glb")) {
    throw createValidationError(
      "invalid_file_extension",
      `Field ${fieldName} must point to a GLB filename.`
    );
  }
  return normalized;
}

function normalizePermanentIdArray(value, fieldName, allowEmpty = false) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw createValidationError(
      "invalid_field_type",
      `${fieldName} must be ${allowEmpty ? "an array" : "a non-empty array"} of permanent IDs.`
    );
  }

  return value.map((entry, index) =>
    normalizePermanentId(entry, `${fieldName}[${index}]`)
  );
}

function normalizeUppercaseStringArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_field_type",
      `${fieldName} must be a non-empty array.`
    );
  }

  return value.map((entry, index) => {
    const normalized = normalizeStringValue(entry, `${fieldName}[${index}]`);
    if (!/^[A-Z][A-Z0-9_]*$/.test(normalized)) {
      throw createValidationError(
        "invalid_field_value",
        `${fieldName}[${index}] must use the approved uppercase appearance profile format.`
      );
    }
    return normalized;
  });
}

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_field_type",
      `${fieldName} must be a non-empty array.`
    );
  }

  return value.map((entry, index) =>
    normalizeStringValue(entry, `${fieldName}[${index}]`)
  );
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

function normalizePositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw createValidationError(
      "invalid_field_value",
      `Field ${fieldName} must be a positive integer.`
    );
  }
  return value;
}

function normalizePercentage(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    throw createValidationError(
      "invalid_field_value",
      `Field ${fieldName} must be a percentage between 0 and 100.`
    );
  }
  return value;
}

function normalizeFiniteNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a finite number.`
    );
  }
  return value;
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "invalid_identifier",
      `Field ${fieldName} must use the approved permanent uppercase Asset Factory ID format.`
    );
  }
  return normalized;
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }
  const normalized = value.trim();
  if (!normalized) {
    throw createValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }
  return normalized;
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

function assertRequiredFields(prototype) {
  for (const fieldName of firstGrowGoLighthouseAssetPrototypeRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(prototype, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Lighthouse prototype is missing required field ${fieldName}.`
      );
    }
  }
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

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode,
    message: result.message,
    lighthousePrototype: null
  });
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "FirstGrowGoLighthouseAssetPrototypeValidationError";
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

function createPrototypeModuleDefinition(componentId, category, type, width, height, depth) {
  return deepFreeze({
    componentId,
    category,
    type,
    version: "1.0.0",
    status: "validated",
    dimensions: deepFreeze({
      width,
      height,
      depth
    }),
    attachmentPoints: deepFreeze([
      {
        pointId: `${componentId}_ATTACH_ROOT`,
        type: "root",
        position: {
          x: 0,
          y: 0,
          z: 0
        }
      }
    ]),
    compatibilityRules: deepFreeze({
      allowedCategories: deepFreeze([]),
      allowedTypes: deepFreeze([]),
      disallowedComponentIds: deepFreeze([])
    }),
    tags: deepFreeze(["lighthouse_prototype", category]),
    metadata: deepFreeze({
      creatorSource: "internal",
      validationState: "validated"
    })
  });
}
