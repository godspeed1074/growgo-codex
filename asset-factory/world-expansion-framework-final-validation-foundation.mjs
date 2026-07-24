import {
  createWorldExpansionPlanningFoundation,
  validateWorldExpansionPlanningFoundation,
  worldExpansionPlanningFoundationDefinition
} from "./world-expansion-planning-foundation.mjs";
import {
  createWorldExpansionPipelineValidationFoundation,
  validateWorldExpansionPipelineValidationFoundation
} from "./world-expansion-pipeline-validation-foundation.mjs";
import {
  createWorldExpansionRegionSelectionFoundation,
  selectWorldExpansionRegionProfile,
  validateWorldExpansionRegionSelectionFoundation
} from "./world-expansion-region-selection-foundation.mjs";

export const worldExpansionFrameworkFinalValidationFoundationRequiredFields =
  Object.freeze([
    "frameworkValidationId",
    "pipelineValidation",
    "regionSelection",
    "frameworkValidationSummary",
    "regionProfileValidationReport",
    "validationResult"
  ]);

export const worldExpansionFrameworkFinalValidationFoundationDefinition = deepFreeze({
  ...worldExpansionPlanningFoundationDefinition
});

const supportedRegionTypes = Object.freeze([
  "coastal",
  "suburban",
  "rural",
  "urban"
]);
const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export async function createWorldExpansionFrameworkFinalValidationFoundation(
  rawDefinition = worldExpansionFrameworkFinalValidationFoundationDefinition,
  options = {}
) {
  const planningFoundation = await createWorldExpansionPlanningFoundation(
    rawDefinition,
    options
  );
  const pipelineValidation =
    await createWorldExpansionPipelineValidationFoundation(rawDefinition, options);
  const regionSelection =
    await createWorldExpansionRegionSelectionFoundation(rawDefinition, options);

  const regionProfileValidationReport = deepFreeze(
    supportedRegionTypes.map((regionType) =>
      buildRegionProfileValidationEntry(
        selectWorldExpansionRegionProfile(regionSelection, regionType, {
          selectionSource: "framework-final-validation"
        }),
        planningFoundation,
        pipelineValidation
      )
    )
  );

  const frameworkValidationSummary = deepFreeze({
    coordinateToScenePipeline: deepFreeze([
      "coordinate",
      "region selection",
      "region resolution",
      "scene routing",
      "map data routing",
      "settlement generation",
      "scene assembly"
    ]),
    coastalActiveWorldUnchanged:
      pipelineValidation.validationResult.coastalLocationUnchangedValid === true,
    futureRegionProfilesFallbackSafely:
      regionProfileValidationReport
        .filter((entry) => entry.regionType !== "coastal")
        .every((entry) => entry.validationResult.safeFallbackValid === true),
    deterministicOutputs:
      pipelineValidation.validationResult.deterministicOutputValid === true &&
      regionProfileValidationReport.every(
        (entry) => entry.validationResult.deterministicSelectionValid === true
      ),
    assetCompatibility:
      pipelineValidation.validationResult.assetCompatibilityValid === true &&
      regionProfileValidationReport.every(
        (entry) => entry.validationResult.assetProfileCompatibleValid === true
      ),
    validationChainConsistency:
      pipelineValidation.validationResult.chainIdentityConsistencyValid === true &&
      regionProfileValidationReport.every(
        (entry) => entry.validationResult.chainConsistencyValid === true
      )
  });

  const foundation = deepFreeze({
    frameworkValidationId: createFrameworkValidationId(
      planningFoundation.activeWorldLocation.worldId,
      planningFoundation.activeWorldLocation.seed
    ),
    planningFoundation,
    pipelineValidation,
    regionSelection,
    frameworkValidationSummary,
    regionProfileValidationReport,
    validationResult: deepFreeze({
      fullPipelineValid:
        frameworkValidationSummary.coordinateToScenePipeline.length === 7 &&
        pipelineValidation.validationResult.fullChainValid === true,
      coastalActiveWorldUnchangedValid:
        frameworkValidationSummary.coastalActiveWorldUnchanged === true,
      futureRegionProfilesFallbackSafelyValid:
        frameworkValidationSummary.futureRegionProfilesFallbackSafely === true,
      deterministicOutputsValid:
        frameworkValidationSummary.deterministicOutputs === true,
      assetCompatibilityValid:
        frameworkValidationSummary.assetCompatibility === true,
      validationChainConsistencyValid:
        frameworkValidationSummary.validationChainConsistency === true
    })
  });

  const validation =
    validateWorldExpansionFrameworkFinalValidationFoundation(foundation);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return foundation;
}

export function validateWorldExpansionFrameworkFinalValidationFoundation(
  rawFoundation
) {
  try {
    const foundation = normalizeFoundation(rawFoundation);

    const planningValidation = validateWorldExpansionPlanningFoundation(
      foundation.planningFoundation
    );
    if (!planningValidation.ok) {
      throw createValidationError(
        planningValidation.errorCode ?? "planning_foundation_invalid",
        planningValidation.message ??
          "World expansion framework final validation foundation requires a valid planning foundation."
      );
    }

    const pipelineValidation = validateWorldExpansionPipelineValidationFoundation(
      foundation.pipelineValidation
    );
    if (!pipelineValidation.ok) {
      throw createValidationError(
        pipelineValidation.errorCode ?? "pipeline_validation_invalid",
        pipelineValidation.message ??
          "World expansion framework final validation foundation requires a valid pipeline validation foundation."
      );
    }

    const regionSelectionValidation =
      validateWorldExpansionRegionSelectionFoundation(
        foundation.regionSelection
      );
    if (!regionSelectionValidation.ok) {
      throw createValidationError(
        regionSelectionValidation.errorCode ?? "region_selection_invalid",
        regionSelectionValidation.message ??
          "World expansion framework final validation foundation requires a valid region selection foundation."
      );
    }

    if (foundation.regionProfileValidationReport.length !== supportedRegionTypes.length) {
      throw createValidationError(
        "region_profile_report_count_invalid",
        "World expansion framework final validation foundation must include all supported region profiles."
      );
    }

    for (const fieldName of [
      "fullPipelineValid",
      "coastalActiveWorldUnchangedValid",
      "futureRegionProfilesFallbackSafelyValid",
      "deterministicOutputsValid",
      "assetCompatibilityValid",
      "validationChainConsistencyValid"
    ]) {
      if (foundation.validationResult[fieldName] !== true) {
        throw createValidationError(
          "validation_result_invalid",
          `World expansion framework final validation foundation ${fieldName} must be true.`
        );
      }
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      worldExpansionFrameworkFinalValidationFoundation: foundation
    });
  } catch (error) {
    if (
      error?.name !== "WorldExpansionFrameworkFinalValidationFoundationValidationError"
    ) {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      worldExpansionFrameworkFinalValidationFoundation: null
    });
  }
}

function buildRegionProfileValidationEntry(
  regionProfileSelection,
  planningFoundation,
  pipelineValidation
) {
  return deepFreeze({
    regionType: regionProfileSelection.selectedRegionType,
    worldRegionId: regionProfileSelection.regionResolution.worldRegionId,
    generationProfileId:
      regionProfileSelection.selectedGenerationProfile.generationProfileId,
    assetProfileId: regionProfileSelection.selectedAssetProfile.assetProfileId,
    selectionSource: regionProfileSelection.selectionSource,
    validationResult: deepFreeze({
      selectedProfileConsistent:
        regionProfileSelection.validationResult.regionSelectionConsistencyValid ===
        true,
      safeFallbackValid:
        regionProfileSelection.validationResult.safeFallbackValid === true,
      deterministicSelectionValid:
        regionProfileSelection.validationResult.deterministicRoutingValid === true,
      assetProfileCompatibleValid:
        regionProfileSelection.selectedRegionType === "coastal"
          ? pipelineValidation.validationResult.assetCompatibilityValid === true
          : regionProfileSelection.selectedAssetProfile.futureRegionContentEnabled ===
            false,
      chainConsistencyValid:
        planningFoundation.worldExpansionRegistry.some(
          (entry) =>
            entry.regionType === regionProfileSelection.selectedRegionType &&
            entry.worldRegionId === regionProfileSelection.regionResolution.worldRegionId
        ) &&
        regionProfileSelection.sceneRoute.worldRegionId ===
          regionProfileSelection.mapDataRoute.worldRegionId &&
        regionProfileSelection.sceneRoute.regionType ===
          regionProfileSelection.mapDataRoute.regionType
    })
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "worldExpansionFrameworkFinalValidationFoundation"
  );
  for (const fieldName of worldExpansionFrameworkFinalValidationFoundationRequiredFields) {
    if (!(fieldName in foundation)) {
      throw createValidationError(
        "missing_required_field",
        `World expansion framework final validation foundation is missing ${fieldName}.`
      );
    }
  }

  return deepFreeze({
    frameworkValidationId: normalizePermanentId(
      foundation.frameworkValidationId,
      "frameworkValidationId"
    ),
    planningFoundation: deepFreeze(
      asPlainObject(foundation.planningFoundation, "planningFoundation")
    ),
    pipelineValidation: deepFreeze(
      asPlainObject(foundation.pipelineValidation, "pipelineValidation")
    ),
    regionSelection: deepFreeze(
      asPlainObject(foundation.regionSelection, "regionSelection")
    ),
    frameworkValidationSummary: deepFreeze(
      asPlainObject(foundation.frameworkValidationSummary, "frameworkValidationSummary")
    ),
    regionProfileValidationReport: deepFreeze(
      normalizeRegionProfileValidationReport(foundation.regionProfileValidationReport)
    ),
    validationResult: deepFreeze(
      asPlainObject(foundation.validationResult, "validationResult")
    )
  });
}

function normalizeRegionProfileValidationReport(rawReport) {
  if (!Array.isArray(rawReport)) {
    throw createValidationError(
      "invalid_region_profile_report",
      "World expansion framework final validation foundation regionProfileValidationReport must be an array."
    );
  }
  return rawReport.map((entry, index) =>
    deepFreeze(asPlainObject(entry, `regionProfileValidationReport[${index}]`))
  );
}

function createFrameworkValidationId(worldId, seed) {
  const suffix = String(hashString(`${worldId}:${seed}`)).padStart(3, "0");
  return `WORLD_EXPANSION_FRAMEWORK_VALIDATION_${suffix}`;
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeString(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "invalid_permanent_id",
      `World expansion framework final validation foundation ${fieldName} must be a supported permanent ID.`
    );
  }
  return normalized;
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string") {
    throw createValidationError(
      "invalid_string",
      `World expansion framework final validation foundation ${fieldName} must be a string.`
    );
  }
  const normalized = value.trim();
  if (!normalized) {
    throw createValidationError(
      "empty_string",
      `World expansion framework final validation foundation ${fieldName} cannot be empty.`
    );
  }
  return normalized;
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_object",
      `World expansion framework final validation foundation ${fieldName} must be an object.`
    );
  }
  return value;
}

function hashString(value) {
  let hash = 0;
  for (const character of String(value)) {
    hash = (hash * 31 + character.charCodeAt(0)) % 1000;
  }
  return hash;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "WorldExpansionFrameworkFinalValidationFoundationValidationError";
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
