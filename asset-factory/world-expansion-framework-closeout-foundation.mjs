import {
  createWorldExpansionFrameworkFinalValidationFoundation,
  validateWorldExpansionFrameworkFinalValidationFoundation,
  worldExpansionFrameworkFinalValidationFoundationDefinition
} from "./world-expansion-framework-final-validation-foundation.mjs";

export const worldExpansionFrameworkCloseoutFoundationRequiredFields = Object.freeze([
  "frameworkId",
  "supportedRegionProfiles",
  "activeProductionRegion",
  "validationStatus",
  "extensionPoints"
]);

export const worldExpansionFrameworkCloseoutFoundationDefinition = deepFreeze({
  ...worldExpansionFrameworkFinalValidationFoundationDefinition
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export async function createWorldExpansionFrameworkCloseoutFoundation(
  rawDefinition = worldExpansionFrameworkCloseoutFoundationDefinition,
  options = {}
) {
  const finalValidation =
    await createWorldExpansionFrameworkFinalValidationFoundation(
      rawDefinition,
      options
    );

  const foundation = deepFreeze({
    frameworkId: createFrameworkCloseoutId(
      finalValidation.frameworkValidationId,
      finalValidation.planningFoundation.activeWorldLocation.worldId
    ),
    finalValidation,
    supportedRegionProfiles: deepFreeze(
      finalValidation.regionProfileValidationReport.map((entry) =>
        deepFreeze({
          regionType: entry.regionType,
          worldRegionId: entry.worldRegionId,
          generationProfileId: entry.generationProfileId,
          assetProfileId: entry.assetProfileId
        })
      )
    ),
    activeProductionRegion: deepFreeze({
      regionType:
        finalValidation.planningFoundation.activeWorldLocation.activeRegionType,
      worldRegionId: finalValidation.pipelineValidation.regionResolution.worldRegionId,
      currentCoastalProductionPath: deepFreeze({
        coordinateResolver: "map-coordinate-world-resolver-foundation",
        sceneRouting:
          finalValidation.pipelineValidation.sceneRoute.sceneProfile.sceneAssemblyId,
        mapDataRouting:
          finalValidation.pipelineValidation.mapDataRoute.providerProfile.providerMode,
        settlementGeneration:
          finalValidation.pipelineValidation.sceneRoute.settlementProfile.generatorId,
        sceneAssembly:
          finalValidation.pipelineValidation.sceneRoute.sceneProfile.sceneAssemblyId
      })
    }),
    validationStatus: deepFreeze({
      status:
        finalValidation.validationResult.fullPipelineValid === true &&
        finalValidation.validationResult.coastalActiveWorldUnchangedValid === true &&
        finalValidation.validationResult.futureRegionProfilesFallbackSafelyValid ===
          true
          ? "ready-for-future-region-content-work"
          : "closeout-incomplete",
      frameworkModulesCompatible:
        finalValidation.validationResult.validationChainConsistencyValid === true,
      coastalPathUnchanged:
        finalValidation.validationResult.coastalActiveWorldUnchangedValid === true,
      missingDependencies: deepFreeze([]),
      summary: deepFreeze({
        fullPipelineValid: finalValidation.validationResult.fullPipelineValid === true,
        deterministicOutputsValid:
          finalValidation.validationResult.deterministicOutputsValid === true,
        assetCompatibilityValid:
          finalValidation.validationResult.assetCompatibilityValid === true,
        futureRegionFallbackValid:
          finalValidation.validationResult.futureRegionProfilesFallbackSafelyValid ===
          true
      })
    }),
    extensionPoints: deepFreeze({
      futureRegionExtensionPath: deepFreeze([
        "world expansion planning foundation",
        "world region resolution foundation",
        "world region scene routing foundation",
        "world region map data routing foundation",
        "world expansion region selection foundation"
      ]),
      mapProviderBoundary: deepFreeze({
        activeProviderKind:
          finalValidation.pipelineValidation.mapDataRoute.localMapDataAdapter
            .providerBoundary.providerKind,
        compatibleFutureProviderKinds:
          finalValidation.pipelineValidation.mapDataRoute.localMapDataAdapter
            .providerBoundary.compatibleFutureProviderKinds,
        liveNetworkAllowed:
          finalValidation.pipelineValidation.mapDataRoute.localMapDataAdapter
            .providerBoundary.liveNetworkAllowed
      }),
      assetCompatibilityBoundary: deepFreeze({
        activeAssetProfileId:
          finalValidation.pipelineValidation.regionResolution.assetProfile.assetProfileId,
        coastalAssetCompatibility:
          finalValidation.frameworkValidationSummary.assetCompatibility === true,
        futureRegionContentEnabled: false
      })
    }),
    validationResult: deepFreeze({
      allFrameworkModulesRemainCompatible:
        finalValidation.validationResult.validationChainConsistencyValid === true,
      coastalPathUnchanged:
        finalValidation.validationResult.coastalActiveWorldUnchangedValid === true,
      noMissingDependencies: true
    })
  });

  const validation = validateWorldExpansionFrameworkCloseoutFoundation(foundation);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return foundation;
}

export function validateWorldExpansionFrameworkCloseoutFoundation(rawFoundation) {
  try {
    const foundation = normalizeFoundation(rawFoundation);

    const finalValidation =
      validateWorldExpansionFrameworkFinalValidationFoundation(
        foundation.finalValidation
      );
    if (!finalValidation.ok) {
      throw createValidationError(
        finalValidation.errorCode ?? "final_validation_invalid",
        finalValidation.message ??
          "World expansion framework closeout foundation requires a valid final validation foundation."
      );
    }

    if (foundation.supportedRegionProfiles.length !== 4) {
      throw createValidationError(
        "supported_region_profile_count_invalid",
        "World expansion framework closeout foundation must include four supported region profiles."
      );
    }
    if (!foundation.validationResult.allFrameworkModulesRemainCompatible) {
      throw createValidationError(
        "framework_modules_incompatible",
        "World expansion framework closeout foundation allFrameworkModulesRemainCompatible must be true."
      );
    }
    if (!foundation.validationResult.coastalPathUnchanged) {
      throw createValidationError(
        "coastal_path_changed",
        "World expansion framework closeout foundation coastalPathUnchanged must be true."
      );
    }
    if (!foundation.validationResult.noMissingDependencies) {
      throw createValidationError(
        "missing_dependencies",
        "World expansion framework closeout foundation noMissingDependencies must be true."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      worldExpansionFrameworkCloseoutFoundation: foundation
    });
  } catch (error) {
    if (error?.name !== "WorldExpansionFrameworkCloseoutFoundationValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      worldExpansionFrameworkCloseoutFoundation: null
    });
  }
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "worldExpansionFrameworkCloseoutFoundation"
  );
  for (const fieldName of worldExpansionFrameworkCloseoutFoundationRequiredFields) {
    if (!(fieldName in foundation)) {
      throw createValidationError(
        "missing_required_field",
        `World expansion framework closeout foundation is missing ${fieldName}.`
      );
    }
  }

  return deepFreeze({
    frameworkId: normalizePermanentId(foundation.frameworkId, "frameworkId"),
    finalValidation: deepFreeze(
      asPlainObject(foundation.finalValidation, "finalValidation")
    ),
    supportedRegionProfiles: deepFreeze(
      normalizeRegionProfiles(foundation.supportedRegionProfiles)
    ),
    activeProductionRegion: deepFreeze(
      asPlainObject(foundation.activeProductionRegion, "activeProductionRegion")
    ),
    validationStatus: deepFreeze(
      asPlainObject(foundation.validationStatus, "validationStatus")
    ),
    extensionPoints: deepFreeze(
      asPlainObject(foundation.extensionPoints, "extensionPoints")
    ),
    validationResult: deepFreeze(
      asPlainObject(foundation.validationResult, "validationResult")
    )
  });
}

function normalizeRegionProfiles(rawProfiles) {
  if (!Array.isArray(rawProfiles)) {
    throw createValidationError(
      "invalid_supported_region_profiles",
      "World expansion framework closeout foundation supportedRegionProfiles must be an array."
    );
  }
  return rawProfiles.map((profile, index) =>
    deepFreeze(asPlainObject(profile, `supportedRegionProfiles[${index}]`))
  );
}

function createFrameworkCloseoutId(frameworkValidationId, worldId) {
  const suffix = String(hashString(`${frameworkValidationId}:${worldId}`)).padStart(
    3,
    "0"
  );
  return `WORLD_EXPANSION_FRAMEWORK_CLOSEOUT_${suffix}`;
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeString(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "invalid_permanent_id",
      `World expansion framework closeout foundation ${fieldName} must be a supported permanent ID.`
    );
  }
  return normalized;
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string") {
    throw createValidationError(
      "invalid_string",
      `World expansion framework closeout foundation ${fieldName} must be a string.`
    );
  }
  const normalized = value.trim();
  if (!normalized) {
    throw createValidationError(
      "empty_string",
      `World expansion framework closeout foundation ${fieldName} cannot be empty.`
    );
  }
  return normalized;
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_object",
      `World expansion framework closeout foundation ${fieldName} must be an object.`
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
  error.name = "WorldExpansionFrameworkCloseoutFoundationValidationError";
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
