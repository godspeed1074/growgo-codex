import {
  firstBlenderGeneratedLighthousePrototypeAssetPackageDefinition,
  buildFirstBlenderGeneratedLighthousePrototypeAssetPackageContext,
  validateFirstBlenderGeneratedLighthousePrototypeAssetPackage
} from "./first-blender-generated-lighthouse-prototype-asset-package.mjs";
import {
  realAssetPackageRuntimeReplacementTestDefinition,
  validateRealAssetPackageRuntimeReplacementTest
} from "./real-asset-package-runtime-replacement-test.mjs";
import {
  syntheticWorldCustom25DVisualVerificationDefinition,
  validateSyntheticWorldCustom25DVisualVerification
} from "./synthetic-world-custom-25d-visual-verification.mjs";
import { validateWorldInstanceManagerFoundation } from "./world-instance-manager-foundation.mjs";
import { validateWorldStreamingCoordinatorFoundation } from "./world-streaming-coordinator-foundation.mjs";
import { validateWorldPipelineRendererBridge } from "./world-pipeline-renderer-bridge.mjs";

export const realLighthousePackageSyntheticWorldPlacementRequiredFields =
  Object.freeze([
    "assetId",
    "packageVersion",
    "packageReference",
    "defaultAppearanceProfile",
    "supportedAppearanceProfiles",
    "expectedLodProfile",
    "expectedVisibilityState"
  ]);

export const realLighthousePackageSyntheticWorldPlacementDefinition = deepFreeze({
  assetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
  packageVersion: "1.0.0",
  packageReference:
    "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/export/LIGHTHOUSE_ISLAND_ROCKY_001.glb",
  defaultAppearanceProfile: "DAY_COASTAL_LIGHTHOUSE",
  supportedAppearanceProfiles: [
    "DAY_COASTAL_LIGHTHOUSE",
    "SUNSET_COASTAL_LIGHTHOUSE",
    "NIGHT_COASTAL_LIGHTHOUSE"
  ],
  expectedLodProfile: "close",
  expectedVisibilityState: "visible"
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const supportedLodProfiles = Object.freeze(["close", "gameplay", "map"]);
const supportedVisibilityStates = Object.freeze([
  "requested",
  "loading",
  "ready",
  "visible",
  "cached",
  "unloaded"
]);
const expectedAppearanceProfiles = Object.freeze([
  "DAY_COASTAL_LIGHTHOUSE",
  "SUNSET_COASTAL_LIGHTHOUSE",
  "NIGHT_COASTAL_LIGHTHOUSE"
]);

export function buildRealLighthousePackageSyntheticWorldPlacementContext() {
  return Object.freeze(
    buildFirstBlenderGeneratedLighthousePrototypeAssetPackageContext()
  );
}

export function validateRealLighthousePackageSyntheticWorldPlacement(
  rawDefinition = realLighthousePackageSyntheticWorldPlacementDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const definition = normalizeDefinition(rawDefinition);

    const prototypePackageResult =
      normalizedOptions.validateFirstBlenderGeneratedLighthousePrototypeAssetPackage(
        normalizedOptions.prototypeAssetPackageDefinition,
        { validationContext: normalizedOptions.validationContext }
      );
    if (!prototypePackageResult.ok) {
      return freezeFailure(prototypePackageResult);
    }

    const runtimeReplacementResult =
      normalizedOptions.validateRealAssetPackageRuntimeReplacementTest(
        normalizedOptions.runtimeReplacementDefinition,
        { validationContext: normalizedOptions.validationContext }
      );
    if (!runtimeReplacementResult.ok) {
      return freezeFailure(runtimeReplacementResult);
    }

    const visualVerificationResult =
      normalizedOptions.validateSyntheticWorldCustom25DVisualVerification(
        normalizedOptions.visualVerificationDefinition,
        { context: normalizedOptions.validationContext }
      );
    if (!visualVerificationResult.ok) {
      return freezeFailure(visualVerificationResult);
    }

    const worldInstanceResult =
      normalizedOptions.validateWorldInstanceManagerFoundation();
    if (!worldInstanceResult.ok) {
      return freezeFailure(worldInstanceResult);
    }

    const worldStreamingResult =
      normalizedOptions.validateWorldStreamingCoordinatorFoundation();
    if (!worldStreamingResult.ok) {
      return freezeFailure(worldStreamingResult);
    }

    const worldPipelineResult =
      normalizedOptions.validateWorldPipelineRendererBridge();
    if (!worldPipelineResult.ok) {
      return freezeFailure(worldPipelineResult);
    }

    const lighthouseWorldPlacement = buildLighthouseWorldPlacementResult(
      definition,
      prototypePackageResult.lighthouseAssetPackage.prototypeAssetPackage,
      runtimeReplacementResult.runtimeReplacementValidation,
      visualVerificationResult.visualVerification
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      lighthouseWorldPlacement: Object.freeze({
        packageBackedWorldInstanceBinding:
          lighthouseWorldPlacement.packageBackedWorldInstanceBinding,
        syntheticWorldValidation: lighthouseWorldPlacement.syntheticWorldValidation,
        rendererHandoffValidation: lighthouseWorldPlacement.rendererHandoffValidation,
        appearanceProfileValidation:
          lighthouseWorldPlacement.appearanceProfileValidation,
        compatibility: Object.freeze({
          packageBackedBindingVerified: true,
          syntheticWorldDeterminismVerified: true,
          rendererHandoffVerified: true,
          appearanceProfilesVerified: true,
          passiveOnly: true
        })
      })
    });
  } catch (error) {
    if (
      error?.name !==
      "RealLighthousePackageSyntheticWorldPlacementValidationError"
    ) {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      lighthouseWorldPlacement: null
    });
  }
}

function normalizeOptions(options) {
  const validationContext =
    options.validationContext ??
    buildRealLighthousePackageSyntheticWorldPlacementContext();

  return Object.freeze({
    validationContext,
    prototypeAssetPackageDefinition:
      options.prototypeAssetPackageDefinition ??
      firstBlenderGeneratedLighthousePrototypeAssetPackageDefinition,
    runtimeReplacementDefinition:
      options.runtimeReplacementDefinition ??
      realAssetPackageRuntimeReplacementTestDefinition,
    visualVerificationDefinition:
      options.visualVerificationDefinition ??
      syntheticWorldCustom25DVisualVerificationDefinition,
    validateFirstBlenderGeneratedLighthousePrototypeAssetPackage:
      typeof options.validateFirstBlenderGeneratedLighthousePrototypeAssetPackage ===
      "function"
        ? options.validateFirstBlenderGeneratedLighthousePrototypeAssetPackage
        : validateFirstBlenderGeneratedLighthousePrototypeAssetPackage,
    validateRealAssetPackageRuntimeReplacementTest:
      typeof options.validateRealAssetPackageRuntimeReplacementTest === "function"
        ? options.validateRealAssetPackageRuntimeReplacementTest
        : validateRealAssetPackageRuntimeReplacementTest,
    validateSyntheticWorldCustom25DVisualVerification:
      typeof options.validateSyntheticWorldCustom25DVisualVerification ===
      "function"
        ? options.validateSyntheticWorldCustom25DVisualVerification
        : validateSyntheticWorldCustom25DVisualVerification,
    validateWorldInstanceManagerFoundation:
      typeof options.validateWorldInstanceManagerFoundation === "function"
        ? options.validateWorldInstanceManagerFoundation
        : validateWorldInstanceManagerFoundation,
    validateWorldStreamingCoordinatorFoundation:
      typeof options.validateWorldStreamingCoordinatorFoundation === "function"
        ? options.validateWorldStreamingCoordinatorFoundation
        : validateWorldStreamingCoordinatorFoundation,
    validateWorldPipelineRendererBridge:
      typeof options.validateWorldPipelineRendererBridge === "function"
        ? options.validateWorldPipelineRendererBridge
        : validateWorldPipelineRendererBridge
  });
}

function buildLighthouseWorldPlacementResult(
  definition,
  prototypeAssetPackage,
  runtimeReplacementValidation,
  visualVerification
) {
  validateDefinitionIdentity(
    definition,
    prototypeAssetPackage,
    runtimeReplacementValidation
  );

  const runtimeAssetResolution = runtimeReplacementValidation.assetResolution;
  const runtimePipeline = runtimeReplacementValidation.pipelineVerification;
  const runtimeTransform = runtimePipeline.rendererPayload.transformData;

  const lighthouseRendererPayload = findRendererPayload(
    visualVerification.rendererPayloads,
    definition.assetId
  );
  const lighthouseLodProfile = findAssetStateEntry(
    visualVerification.lodProfiles,
    definition.assetId,
    "lodProfile"
  );
  const lighthouseVisibilityState = findAssetStateEntry(
    visualVerification.visibilityStates,
    definition.assetId,
    "visibilityState"
  );

  validatePackageBackedBinding(definition, runtimeAssetResolution, runtimePipeline);
  validateSyntheticWorldReplacement(runtimeReplacementValidation, visualVerification);
  validateRendererHandoff(
    definition,
    runtimePipeline,
    lighthouseRendererPayload,
    lighthouseLodProfile,
    lighthouseVisibilityState
  );
  validateAppearanceProfiles(definition, runtimeAssetResolution, prototypeAssetPackage);

  return Object.freeze({
    packageBackedWorldInstanceBinding: Object.freeze({
      assetId: definition.assetId,
      packageVersion: definition.packageVersion,
      packageReference: definition.packageReference,
      placementRule: runtimeTransform.placementRuleId,
      lodProfile: lighthouseLodProfile.lodProfile,
      appearanceProfile: definition.defaultAppearanceProfile
    }),
    syntheticWorldValidation: Object.freeze({
      lighthouseUsesPackageBackedReference:
        definition.packageReference ===
          runtimeReplacementValidation.replacementValidation.realPackageReference &&
        !runtimeReplacementValidation.replacementValidation.realPackageReference.includes(
          "_PLACEHOLDER.glb"
        ),
      placeholderReferenceReplaced:
        runtimeReplacementValidation.replacementValidation.placeholderReference !==
        runtimeReplacementValidation.replacementValidation.realPackageReference,
      worldOutputDeterministic:
        runtimeReplacementValidation.deterministicVerification
          .deterministicOutputVerified === true
    }),
    rendererHandoffValidation: Object.freeze({
      assetReference: Object.freeze({
        assetId: lighthouseRendererPayload.rendererAssetReference.assetId,
        manifestId: lighthouseRendererPayload.rendererAssetReference.manifestId,
        recipeId: lighthouseRendererPayload.rendererAssetReference.recipeId
      }),
      transform: deepFreeze(lighthouseRendererPayload.transformData),
      placement: Object.freeze({
        locationId: runtimeTransform.locationId,
        placementRuleId: runtimeTransform.placementRuleId,
        orientation: runtimeTransform.orientation
      }),
      lod: lighthouseLodProfile.lodProfile,
      visibility: lighthouseVisibilityState.visibilityState
    }),
    appearanceProfileValidation: Object.freeze({
      day: "DAY_COASTAL_LIGHTHOUSE",
      sunset: "SUNSET_COASTAL_LIGHTHOUSE",
      night: "NIGHT_COASTAL_LIGHTHOUSE",
      defaultAppearanceProfile: definition.defaultAppearanceProfile,
      allProfilesSupported: true
    })
  });
}

function validateDefinitionIdentity(
  definition,
  prototypeAssetPackage,
  runtimeReplacementValidation
) {
  if (definition.assetId !== prototypeAssetPackage.assetId) {
    throw createValidationError(
      "asset_identity_mismatch",
      "Synthetic world lighthouse placement assetId must match the prototype lighthouse asset package assetId."
    );
  }

  if (
    definition.assetId !== runtimeReplacementValidation.assetResolution.assetId
  ) {
    throw createValidationError(
      "asset_identity_mismatch",
      "Synthetic world lighthouse placement assetId must match the runtime replacement lighthouse assetId."
    );
  }
}

function validatePackageBackedBinding(
  definition,
  runtimeAssetResolution,
  runtimePipeline
) {
  if (definition.packageVersion !== runtimeAssetResolution.packageVersion) {
    throw createValidationError(
      "package_version_mismatch",
      "Synthetic world lighthouse placement packageVersion must match the runtime replacement packageVersion."
    );
  }

  if (definition.packageReference !== runtimeAssetResolution.packageReference) {
    throw createValidationError(
      "package_reference_mismatch",
      "Synthetic world lighthouse placement packageReference must match the runtime replacement packageReference."
    );
  }

  if (
    definition.expectedLodProfile !== runtimePipeline.streamingSelection.lodProfile
  ) {
    throw createValidationError(
      "lod_profile_mismatch",
      "Synthetic world lighthouse placement expectedLodProfile must match the runtime streaming lighthouse LOD profile."
    );
  }

  if (
    definition.expectedVisibilityState !==
    runtimePipeline.streamingSelection.streamingState
  ) {
    throw createValidationError(
      "visibility_state_mismatch",
      "Synthetic world lighthouse placement expectedVisibilityState must match the runtime streaming lighthouse visibility state."
    );
  }
}

function validateSyntheticWorldReplacement(
  runtimeReplacementValidation,
  visualVerification
) {
  if (
    !runtimeReplacementValidation.replacementValidation.placeholderReference.includes(
      "_PLACEHOLDER.glb"
    )
  ) {
    throw createValidationError(
      "placeholder_reference_missing",
      "Synthetic world lighthouse placement requires the prior lighthouse placeholder reference for replacement verification."
    );
  }

  if (runtimeReplacementValidation.replacementValidation.sameWorldOutput !== true) {
    throw createValidationError(
      "deterministic_output_mismatch",
      "Synthetic world lighthouse placement requires the runtime replacement world output to remain deterministic."
    );
  }

  if (
    !visualVerification.renderAcceptanceState.receivedAssetIds.includes(
      "LIGHTHOUSE_ISLAND_ROCKY_001"
    )
  ) {
    throw createValidationError(
      "renderer_asset_reference_mismatch",
      "Synthetic world lighthouse placement requires the lighthouse asset to remain present in the visual verification payload."
    );
  }
}

function validateRendererHandoff(
  definition,
  runtimePipeline,
  lighthouseRendererPayload,
  lighthouseLodProfile,
  lighthouseVisibilityState
) {
  if (lighthouseRendererPayload.rendererAssetReference.assetId !== definition.assetId) {
    throw createValidationError(
      "renderer_asset_reference_mismatch",
      "Synthetic world lighthouse renderer handoff asset reference must match the lighthouse assetId."
    );
  }

  const runtimeTransform = runtimePipeline.rendererPayload.transformData;
  const rendererTransform = lighthouseRendererPayload.transformData;

  if (
    rendererTransform.position.x !== runtimeTransform.position.x ||
    rendererTransform.position.y !== runtimeTransform.position.y
  ) {
    throw createValidationError(
      "transform_position_mismatch",
      "Synthetic world lighthouse renderer handoff transform must match the runtime lighthouse transform position."
    );
  }

  if (rendererTransform.orientation !== runtimeTransform.orientation) {
    throw createValidationError(
      "transform_orientation_mismatch",
      "Synthetic world lighthouse renderer handoff orientation must match the runtime lighthouse orientation."
    );
  }

  if (rendererTransform.placementRuleId !== runtimeTransform.placementRuleId) {
    throw createValidationError(
      "placement_rule_mismatch",
      "Synthetic world lighthouse renderer handoff placementRuleId must match the runtime lighthouse placement rule."
    );
  }

  if (rendererTransform.locationId !== runtimeTransform.locationId) {
    throw createValidationError(
      "placement_location_mismatch",
      "Synthetic world lighthouse renderer handoff locationId must match the runtime lighthouse location."
    );
  }

  if (lighthouseLodProfile.lodProfile !== runtimePipeline.streamingSelection.lodProfile) {
    throw createValidationError(
      "lod_profile_mismatch",
      "Synthetic world lighthouse renderer handoff LOD must match the runtime lighthouse streaming LOD."
    );
  }

  if (
    lighthouseVisibilityState.visibilityState !==
    runtimePipeline.streamingSelection.streamingState
  ) {
    throw createValidationError(
      "visibility_state_mismatch",
      "Synthetic world lighthouse renderer handoff visibility must match the runtime lighthouse streaming state."
    );
  }
}

function validateAppearanceProfiles(
  definition,
  runtimeAssetResolution,
  prototypeAssetPackage
) {
  if (!sameStringSet(definition.supportedAppearanceProfiles, expectedAppearanceProfiles)) {
    throw createValidationError(
      "appearance_profile_mismatch",
      "Synthetic world lighthouse placement must support the approved day, sunset, and night appearance profile set."
    );
  }

  if (
    !sameStringSet(
      definition.supportedAppearanceProfiles,
      runtimeAssetResolution.appearanceProfiles
    )
  ) {
    throw createValidationError(
      "appearance_profile_mismatch",
      "Synthetic world lighthouse placement appearance profiles must match the runtime replacement appearance profile set."
    );
  }

  if (
    !sameStringSet(
      definition.supportedAppearanceProfiles,
      prototypeAssetPackage.appearanceProfiles
    )
  ) {
    throw createValidationError(
      "appearance_profile_mismatch",
      "Synthetic world lighthouse placement appearance profiles must match the prototype lighthouse package appearance profile set."
    );
  }

  if (!definition.supportedAppearanceProfiles.includes(definition.defaultAppearanceProfile)) {
    throw createValidationError(
      "appearance_profile_mismatch",
      "Synthetic world lighthouse placement defaultAppearanceProfile must be one of the supported lighthouse appearance profiles."
    );
  }
}

function normalizeDefinition(rawDefinition) {
  const definition = asPlainObject(
    rawDefinition,
    "real lighthouse package synthetic world placement"
  );
  assertRequiredFields(definition);

  return deepFreeze({
    assetId: normalizePermanentId(definition.assetId, "assetId"),
    packageVersion: normalizeVersionString(
      definition.packageVersion,
      "packageVersion"
    ),
    packageReference: normalizeStringValue(
      definition.packageReference,
      "packageReference"
    ),
    defaultAppearanceProfile: normalizeStringValue(
      definition.defaultAppearanceProfile,
      "defaultAppearanceProfile"
    ),
    supportedAppearanceProfiles: deepFreeze(
      normalizeStringArray(
        definition.supportedAppearanceProfiles,
        "supportedAppearanceProfiles"
      )
    ),
    expectedLodProfile: normalizeEnumValue(
      definition.expectedLodProfile,
      supportedLodProfiles,
      "expectedLodProfile"
    ),
    expectedVisibilityState: normalizeEnumValue(
      definition.expectedVisibilityState,
      supportedVisibilityStates,
      "expectedVisibilityState"
    )
  });
}

function assertRequiredFields(definition) {
  for (const fieldName of realLighthousePackageSyntheticWorldPlacementRequiredFields) {
    if (!(fieldName in definition)) {
      throw createValidationError(
        "missing_required_field",
        `Missing required synthetic world lighthouse placement field: ${fieldName}.`
      );
    }
  }
}

function normalizePermanentId(value, fieldName) {
  const normalizedValue = normalizeStringValue(value, fieldName);
  if (!permanentIdPattern.test(normalizedValue)) {
    throw createValidationError(
      "invalid_permanent_id",
      `${fieldName} must be a permanent uppercase asset identifier.`
    );
  }
  return normalizedValue;
}

function normalizeVersionString(value, fieldName) {
  const normalizedValue = normalizeStringValue(value, fieldName);
  if (!/^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){0,2}$/.test(normalizedValue)) {
    throw createValidationError(
      "invalid_version",
      `${fieldName} must use a valid dotted numeric version string.`
    );
  }
  return normalizedValue;
}

function normalizeEnumValue(value, supportedValues, fieldName) {
  const normalizedValue = normalizeStringValue(value, fieldName);
  if (!supportedValues.includes(normalizedValue)) {
    throw createValidationError(
      "invalid_enum_value",
      `${fieldName} must be one of: ${supportedValues.join(", ")}.`
    );
  }
  return normalizedValue;
}

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_array",
      `${fieldName} must be a non-empty array.`
    );
  }

  return value.map((entry, index) =>
    normalizeStringValue(entry, `${fieldName}[${index}]`)
  );
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createValidationError(
      "invalid_string",
      `${fieldName} must be a non-empty string.`
    );
  }
  return value.trim();
}

function findRendererPayload(rendererPayloads, assetId) {
  const rendererPayload =
    rendererPayloads.find((entry) => entry.rendererAssetReference.assetId === assetId) ??
    null;

  if (!rendererPayload) {
    throw createValidationError(
      "renderer_asset_reference_mismatch",
      `No renderer payload was found for ${assetId}.`
    );
  }

  return rendererPayload;
}

function findAssetStateEntry(entries, assetId, fieldName) {
  const entry = entries.find((candidate) => candidate.assetId === assetId) ?? null;

  if (!entry) {
    throw createValidationError(
      "renderer_asset_reference_mismatch",
      `No ${fieldName} entry was found for ${assetId}.`
    );
  }

  return entry;
}

function sameStringSet(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  const leftSet = new Set(left);
  const rightSet = new Set(right);
  if (leftSet.size !== rightSet.size) {
    return false;
  }

  for (const value of leftSet) {
    if (!rightSet.has(value)) {
      return false;
    }
  }

  return true;
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_object",
      `${fieldName} must be a plain object.`
    );
  }
  return value;
}

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode,
    message: result.message,
    lighthouseWorldPlacement: null
  });
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "RealLighthousePackageSyntheticWorldPlacementValidationError";
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
