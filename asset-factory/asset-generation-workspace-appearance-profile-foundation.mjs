import {
  blenderApiBridgeFoundationDefinition,
  buildBlenderApiBridgeFoundationContext,
  validateBlenderApiBridgeFoundation
} from "./blender-api-bridge-foundation.mjs";
import {
  lighthouseConceptAssetFactoryHandoffDefinition,
  validateLighthouseConceptAssetFactoryHandoff
} from "./lighthouse-concept-asset-factory-handoff.mjs";

export const assetGenerationWorkspaceAppearanceProfileFoundationRequiredFields = Object.freeze([
  "assetId",
  "assetFamilyId",
  "workspaceContract",
  "appearanceProfiles",
  "animationProfiles",
  "seasonalEventHooks",
  "performanceProfile",
  "metadata"
]);

export const assetGenerationWorkspaceAppearanceProfileFoundationDefinition = deepFreeze({
  assetId: "LIGHTHOUSE_COASTAL_FAMILY_001",
  assetFamilyId: "LIGHTHOUSE_COASTAL_FAMILY_001",
  workspaceContract: {
    conceptFolder: "asset-factory-workspace/concepts/LIGHTHOUSE_COASTAL_FAMILY_001",
    productionFolder: "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001",
    blenderSourceFolder: "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/blender-source",
    modelsFolder: "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/models",
    lodFolders: {
      close: "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/models/lod-close",
      gameplay: "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/models/lod-gameplay",
      map: "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/models/lod-map",
      distantSilhouette: "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/models/lod-distant-silhouette"
    },
    materialsFolder: "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/materials",
    texturesFolder: "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/textures",
    exportFolder: "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/export",
    metadataLocation: "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/metadata/lighthouse-coastal-family.json",
    sharedAssetResources: [
      "shared/materials/coastal-landmark-materials",
      "shared/textures/coastal-atlas",
      "shared/metadata/appearance-profiles"
    ]
  },
  appearanceProfiles: [
    {
      profileId: "DAY_COASTAL_LIGHTHOUSE",
      lightingState: "day",
      beamVisible: false,
      paletteProfile: "coastal-day"
    },
    {
      profileId: "SUNSET_COASTAL_LIGHTHOUSE",
      lightingState: "sunset",
      beamVisible: false,
      paletteProfile: "coastal-sunset"
    },
    {
      profileId: "NIGHT_COASTAL_LIGHTHOUSE",
      lightingState: "night",
      beamVisible: true,
      paletteProfile: "coastal-night"
    }
  ],
  animationProfiles: [
    {
      componentId: "LIGHTHOUSE_BEAM_EFFECT_001",
      activationWindow: "night-only",
      distanceReductionRules: {
        gameplay: "full-beam",
        map: "reduced-beam",
        distantSilhouette: "beam-disabled"
      },
      animationAuthorized: false
    }
  ],
  seasonalEventHooks: [
    {
      eventId: "CHRISTMAS",
      hookEnabled: true,
      assetMutationAuthorized: false
    },
    {
      eventId: "HALLOWEEN",
      hookEnabled: true,
      assetMutationAuthorized: false
    },
    {
      eventId: "WINTER",
      hookEnabled: true,
      assetMutationAuthorized: false
    },
    {
      eventId: "STORM_DAMAGE",
      hookEnabled: true,
      assetMutationAuthorized: false
    }
  ],
  performanceProfile: {
    storageBudgetKb: 384,
    ramBudgetKb: 512,
    lodExpectationProfile: "four-tier-lighthouse-lod",
    animationLimitProfile: "night-beam-only",
    textureLimitProfile: "shared-atlas-preferred"
  },
  metadata: {
    workspaceProfileId: "ASSET_GENERATION_WORKSPACE_PROFILE_001",
    rendererCompatibilityProfile: "custom-2.5d-passive",
    creatorSource: "internal",
    validationState: "validated"
  }
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const uppercaseProfilePattern = /^[A-Z][A-Z0-9_]*$/;
const supportedLodKeys = Object.freeze(["close", "gameplay", "map", "distantSilhouette"]);
const supportedLightingStates = Object.freeze(["day", "sunset", "night"]);
const supportedEventIds = Object.freeze(["CHRISTMAS", "HALLOWEEN", "WINTER", "STORM_DAMAGE"]);

export function buildAssetGenerationWorkspaceAppearanceProfileFoundationContext() {
  return Object.freeze(buildBlenderApiBridgeFoundationContext());
}

export function validateAssetGenerationWorkspaceAppearanceProfileFoundation(
  rawFoundation = assetGenerationWorkspaceAppearanceProfileFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeFoundationOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const handoffResult = normalizedOptions.validateLighthouseConceptAssetFactoryHandoff(
      normalizedOptions.handoffDefinition
    );

    if (!handoffResult.ok) {
      return Object.freeze({
        ok: false,
        errorCode: handoffResult.errorCode,
        message: handoffResult.message,
        workspaceProfile: null
      });
    }

    const bridgeResult = normalizedOptions.validateBlenderApiBridgeFoundation(
      normalizedOptions.bridgeDefinition,
      { validationContext: normalizedOptions.validationContext }
    );

    if (!bridgeResult.ok) {
      return Object.freeze({
        ok: false,
        errorCode: bridgeResult.errorCode,
        message: bridgeResult.message,
        workspaceProfile: null
      });
    }

    validateFoundationIdentity(foundation, handoffResult.handoff.planningData);
    validateAppearanceProfiles(foundation, handoffResult.handoff.planningData.appearanceProfiles);
    validateAnimationProfiles(foundation, bridgeResult.bridge.request.componentReferences);
    validateSeasonalHooks(foundation.seasonalEventHooks);
    validateWorkspaceCompatibility(foundation, bridgeResult.bridge.request);

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      workspaceProfile: Object.freeze({
        foundation,
        handoff: handoffResult.handoff,
        bridge: bridgeResult.bridge,
        compatibility: Object.freeze({
          identityVerified: true,
          appearanceProfilesVerified: true,
          animationProfilesVerified: true,
          seasonalHooksVerified: true,
          workspaceCompatibilityVerified: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "AssetGenerationWorkspaceAppearanceProfileFoundationValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      workspaceProfile: null
    });
  }
}

function normalizeFoundationOptions(options) {
  return Object.freeze({
    handoffDefinition: options.handoffDefinition ?? lighthouseConceptAssetFactoryHandoffDefinition,
    bridgeDefinition: options.bridgeDefinition ?? blenderApiBridgeFoundationDefinition,
    validationContext:
      options.validationContext ?? buildAssetGenerationWorkspaceAppearanceProfileFoundationContext(),
    validateLighthouseConceptAssetFactoryHandoff:
      typeof options.validateLighthouseConceptAssetFactoryHandoff === "function"
        ? options.validateLighthouseConceptAssetFactoryHandoff
        : validateLighthouseConceptAssetFactoryHandoff,
    validateBlenderApiBridgeFoundation:
      typeof options.validateBlenderApiBridgeFoundation === "function"
        ? options.validateBlenderApiBridgeFoundation
        : validateBlenderApiBridgeFoundation
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(rawFoundation, "asset generation workspace foundation");
  assertRequiredFields(foundation);

  return deepFreeze({
    assetId: normalizePermanentId(foundation.assetId, "assetId"),
    assetFamilyId: normalizePermanentId(foundation.assetFamilyId, "assetFamilyId"),
    workspaceContract: normalizeWorkspaceContract(foundation.workspaceContract),
    appearanceProfiles: deepFreeze(normalizeAppearanceProfiles(foundation.appearanceProfiles)),
    animationProfiles: deepFreeze(normalizeAnimationProfiles(foundation.animationProfiles)),
    seasonalEventHooks: deepFreeze(normalizeSeasonalEventHooks(foundation.seasonalEventHooks)),
    performanceProfile: normalizePerformanceProfile(foundation.performanceProfile),
    metadata: normalizeMetadata(foundation.metadata)
  });
}

function normalizeWorkspaceContract(rawWorkspaceContract) {
  const workspace = asPlainObject(rawWorkspaceContract, "workspaceContract");
  const lodFolders = asPlainObject(workspace.lodFolders, "workspaceContract.lodFolders");

  const normalizedLodFolders = {};
  for (const lodKey of supportedLodKeys) {
    normalizedLodFolders[lodKey] = normalizeStringValue(
      lodFolders[lodKey],
      `workspaceContract.lodFolders.${lodKey}`
    );
  }

  return deepFreeze({
    conceptFolder: normalizeStringValue(workspace.conceptFolder, "workspaceContract.conceptFolder"),
    productionFolder: normalizeStringValue(workspace.productionFolder, "workspaceContract.productionFolder"),
    blenderSourceFolder: normalizeStringValue(workspace.blenderSourceFolder, "workspaceContract.blenderSourceFolder"),
    modelsFolder: normalizeStringValue(workspace.modelsFolder, "workspaceContract.modelsFolder"),
    lodFolders: deepFreeze(normalizedLodFolders),
    materialsFolder: normalizeStringValue(workspace.materialsFolder, "workspaceContract.materialsFolder"),
    texturesFolder: normalizeStringValue(workspace.texturesFolder, "workspaceContract.texturesFolder"),
    exportFolder: normalizeStringValue(workspace.exportFolder, "workspaceContract.exportFolder"),
    metadataLocation: normalizeStringValue(workspace.metadataLocation, "workspaceContract.metadataLocation"),
    sharedAssetResources: deepFreeze(
      normalizeStringArray(workspace.sharedAssetResources, "workspaceContract.sharedAssetResources")
    )
  });
}

function normalizeAppearanceProfiles(rawAppearanceProfiles) {
  if (!Array.isArray(rawAppearanceProfiles)) {
    throw createValidationError(
      "invalid_field_type",
      "appearanceProfiles must be an array of appearance profile objects."
    );
  }

  return rawAppearanceProfiles.map((entry, index) => {
    const profile = asPlainObject(entry, `appearanceProfiles[${index}]`);
    return deepFreeze({
      profileId: normalizeUppercaseProfileId(
        profile.profileId,
        `appearanceProfiles[${index}].profileId`
      ),
      lightingState: normalizeLightingState(
        profile.lightingState,
        `appearanceProfiles[${index}].lightingState`
      ),
      beamVisible: normalizeBoolean(
        profile.beamVisible,
        `appearanceProfiles[${index}].beamVisible`
      ),
      paletteProfile: normalizeStringValue(
        profile.paletteProfile,
        `appearanceProfiles[${index}].paletteProfile`
      )
    });
  });
}

function normalizeAnimationProfiles(rawAnimationProfiles) {
  if (!Array.isArray(rawAnimationProfiles)) {
    throw createValidationError(
      "invalid_field_type",
      "animationProfiles must be an array of animation profile objects."
    );
  }

  return rawAnimationProfiles.map((entry, index) => {
    const profile = asPlainObject(entry, `animationProfiles[${index}]`);
    const distanceReductionRules = asPlainObject(
      profile.distanceReductionRules,
      `animationProfiles[${index}].distanceReductionRules`
    );

    return deepFreeze({
      componentId: normalizePermanentId(
        profile.componentId,
        `animationProfiles[${index}].componentId`
      ),
      activationWindow: normalizeStringValue(
        profile.activationWindow,
        `animationProfiles[${index}].activationWindow`
      ),
      distanceReductionRules: deepFreeze({
        gameplay: normalizeStringValue(
          distanceReductionRules.gameplay,
          `animationProfiles[${index}].distanceReductionRules.gameplay`
        ),
        map: normalizeStringValue(
          distanceReductionRules.map,
          `animationProfiles[${index}].distanceReductionRules.map`
        ),
        distantSilhouette: normalizeStringValue(
          distanceReductionRules.distantSilhouette,
          `animationProfiles[${index}].distanceReductionRules.distantSilhouette`
        )
      }),
      animationAuthorized: normalizeBoolean(
        profile.animationAuthorized,
        `animationProfiles[${index}].animationAuthorized`
      )
    });
  });
}

function normalizeSeasonalEventHooks(rawSeasonalEventHooks) {
  if (!Array.isArray(rawSeasonalEventHooks)) {
    throw createValidationError(
      "invalid_field_type",
      "seasonalEventHooks must be an array of seasonal event hook objects."
    );
  }

  return rawSeasonalEventHooks.map((entry, index) => {
    const hook = asPlainObject(entry, `seasonalEventHooks[${index}]`);
    return deepFreeze({
      eventId: normalizeEventId(hook.eventId, `seasonalEventHooks[${index}].eventId`),
      hookEnabled: normalizeBoolean(
        hook.hookEnabled,
        `seasonalEventHooks[${index}].hookEnabled`
      ),
      assetMutationAuthorized: normalizeBoolean(
        hook.assetMutationAuthorized,
        `seasonalEventHooks[${index}].assetMutationAuthorized`
      )
    });
  });
}

function normalizePerformanceProfile(rawPerformanceProfile) {
  const performance = asPlainObject(rawPerformanceProfile, "performanceProfile");

  return deepFreeze({
    storageBudgetKb: normalizePositiveInteger(
      performance.storageBudgetKb,
      "performanceProfile.storageBudgetKb"
    ),
    ramBudgetKb: normalizePositiveInteger(
      performance.ramBudgetKb,
      "performanceProfile.ramBudgetKb"
    ),
    lodExpectationProfile: normalizeStringValue(
      performance.lodExpectationProfile,
      "performanceProfile.lodExpectationProfile"
    ),
    animationLimitProfile: normalizeStringValue(
      performance.animationLimitProfile,
      "performanceProfile.animationLimitProfile"
    ),
    textureLimitProfile: normalizeStringValue(
      performance.textureLimitProfile,
      "performanceProfile.textureLimitProfile"
    )
  });
}

function normalizeMetadata(rawMetadata) {
  const metadata = asPlainObject(rawMetadata, "metadata");

  return deepFreeze({
    workspaceProfileId: normalizePermanentId(
      metadata.workspaceProfileId,
      "metadata.workspaceProfileId"
    ),
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

function validateFoundationIdentity(foundation, planningData) {
  if (foundation.assetId !== planningData.assetFamilyId) {
    throw createValidationError(
      "asset_identity_mismatch",
      "Workspace foundation assetId must match the lighthouse handoff assetFamilyId."
    );
  }

  if (foundation.assetFamilyId !== planningData.assetFamilyId) {
    throw createValidationError(
      "asset_family_identity_mismatch",
      "Workspace foundation assetFamilyId must match the lighthouse handoff assetFamilyId."
    );
  }
}

function validateAppearanceProfiles(foundation, approvedAppearanceProfiles) {
  const profileIds = foundation.appearanceProfiles.map((entry) => entry.profileId).sort();
  const approvedIds = [...approvedAppearanceProfiles].sort();
  if (JSON.stringify(profileIds) !== JSON.stringify(approvedIds)) {
    throw createValidationError(
      "appearance_profile_mismatch",
      "Workspace appearance profiles must match the approved lighthouse appearance profile set."
    );
  }
}

function validateAnimationProfiles(foundation, bridgeComponentReferences) {
  const beamProfile = foundation.animationProfiles.find(
    (entry) => entry.componentId === "LIGHTHOUSE_BEAM_EFFECT_001"
  );

  if (!beamProfile) {
    throw createValidationError(
      "missing_animation_profile",
      "Workspace foundation requires an animation profile for LIGHTHOUSE_BEAM_EFFECT_001."
    );
  }

  if (!bridgeComponentReferences.includes(beamProfile.componentId)) {
    throw createValidationError(
      "animation_component_mismatch",
      "Animation profile componentId must be part of the approved Blender bridge componentReferences."
    );
  }

  if (beamProfile.activationWindow !== "night-only") {
    throw createValidationError(
      "invalid_animation_activation_window",
      "Lighthouse beam animation must remain night-only."
    );
  }

  if (beamProfile.animationAuthorized !== false) {
    throw createValidationError(
      "animation_authorization_open",
      "Animation authorization must remain false in the passive workspace foundation."
    );
  }
}

function validateSeasonalHooks(seasonalEventHooks) {
  for (const hook of seasonalEventHooks) {
    if (hook.assetMutationAuthorized !== false) {
      throw createValidationError(
        "event_mutation_authorization_open",
        `Seasonal hook ${hook.eventId} must remain passive with assetMutationAuthorized false.`
      );
    }
  }
}

function validateWorkspaceCompatibility(foundation, bridgeRequest) {
  if (
    foundation.metadata.rendererCompatibilityProfile !==
    bridgeRequest.metadata.rendererCompatibilityProfile
  ) {
    throw createValidationError(
      "renderer_profile_mismatch",
      "Workspace renderer compatibility profile must match the Blender bridge renderer compatibility profile."
    );
  }

  const lodFolderKeys = Object.keys(foundation.workspaceContract.lodFolders);
  const lodRequirementKeys = Object.keys(bridgeRequest.lodRequirements);
  if (JSON.stringify(lodFolderKeys) !== JSON.stringify(lodRequirementKeys)) {
    throw createValidationError(
      "lod_workspace_mismatch",
      "Workspace LOD folders must align to the Blender bridge LOD requirements."
    );
  }
}

function assertRequiredFields(foundation) {
  for (const fieldName of assetGenerationWorkspaceAppearanceProfileFoundationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Workspace appearance foundation is missing required field ${fieldName}.`
      );
    }
  }
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

function normalizeUppercaseProfileId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();
  if (!uppercaseProfilePattern.test(normalized)) {
    throw createValidationError(
      "invalid_identifier",
      `Field ${fieldName} must use the approved uppercase profile identifier format.`
    );
  }
  return normalized;
}

function normalizeEventId(value, fieldName) {
  const normalized = normalizeUppercaseProfileId(value, fieldName);
  if (!supportedEventIds.includes(normalized)) {
    throw createValidationError(
      "invalid_event_id",
      `Field ${fieldName} must use one of ${supportedEventIds.join(", ")}.`
    );
  }
  return normalized;
}

function normalizeLightingState(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toLowerCase();
  if (!supportedLightingStates.includes(normalized)) {
    throw createValidationError(
      "invalid_lighting_state",
      `Field ${fieldName} must use one of ${supportedLightingStates.join(", ")}.`
    );
  }
  return normalized;
}

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of strings.`
    );
  }
  return value.map((entry, index) =>
    normalizeStringValue(entry, `${fieldName}[${index}]`)
  );
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

function normalizePositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw createValidationError(
      "invalid_field_value",
      `Field ${fieldName} must be a positive integer.`
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
  error.name = "AssetGenerationWorkspaceAppearanceProfileFoundationValidationError";
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
