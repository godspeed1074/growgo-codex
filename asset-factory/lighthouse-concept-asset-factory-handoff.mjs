import { assetFactoryCategories } from "./asset-registry.mjs";
import {
  conceptApprovalWorkflowStatuses,
  validateConceptCard
} from "./concept-approval-workflow.mjs";

export const lighthouseConceptAssetFactoryHandoffRequiredFields = Object.freeze([
  "conceptId",
  "assetFamilyId",
  "category",
  "theme",
  "productionStatus",
  "plannedComponents",
  "plannedRecipes",
  "appearanceProfiles",
  "metadata"
]);

export const lighthouseConceptHandoffProductionStatuses = Object.freeze([
  "approved-for-planning",
  "component-planning",
  "recipe-planning",
  "workflow-ready"
]);

export const lighthouseCoastalFamilyConceptDefinition = deepFreeze({
  conceptId: "LIGHTHOUSE_COASTAL_FAMILY_001",
  name: "Coastal Lighthouse Family",
  category: "landmarks",
  theme: "coastal_australian_lighthouse",
  purpose: "Create a reusable coastal lighthouse family for navigation landmarks and skyline identity.",
  visualDescription:
    "A modular coastal lighthouse family with stacked tower variants, lantern assembly, roof cap, and optional night beam treatment designed for readable Custom 2.5D silhouettes.",
  gameplayPurpose:
    "Supports landmark recognition and world identity without enabling gameplay authority or renderer runtime activation.",
  styleRules: [
    "painted_coastal_masonry_or_render",
    "high-contrast_lantern_profile",
    "readable_skyline_silhouette"
  ],
  environmentRules: [
    "coastal_headland_context_only",
    "harbor_or_rocky_island_variant_allowed",
    "day_night_and_sunset_appearance_supported"
  ],
  componentIdeas: [
    "LIGHTHOUSE_TOWER_BASE_001",
    "LIGHTHOUSE_TOWER_BODY_SHORT_001",
    "LIGHTHOUSE_TOWER_BODY_MEDIUM_001",
    "LIGHTHOUSE_TOWER_BODY_TALL_001",
    "LIGHTHOUSE_LANTERN_BASE_001",
    "LIGHTHOUSE_GLASS_RING_001",
    "LIGHTHOUSE_LIGHT_SOURCE_001",
    "LIGHTHOUSE_BEAM_EFFECT_001",
    "LIGHTHOUSE_ROOF_CAP_001"
  ],
  metadata: {
    creatorSource: "internal",
    validationState: "approved-for-handoff",
    suggestedAssetCategory: "landmarks",
    componentPlanningReferences: [
      "LIGHTHOUSE_TOWER_BASE_001",
      "LIGHTHOUSE_TOWER_BODY_SHORT_001",
      "LIGHTHOUSE_TOWER_BODY_MEDIUM_001",
      "LIGHTHOUSE_TOWER_BODY_TALL_001",
      "LIGHTHOUSE_LANTERN_BASE_001",
      "LIGHTHOUSE_GLASS_RING_001",
      "LIGHTHOUSE_LIGHT_SOURCE_001",
      "LIGHTHOUSE_BEAM_EFFECT_001",
      "LIGHTHOUSE_ROOF_CAP_001"
    ],
    assetFactoryHandoffMetadata: {
      targetAssetId: "LIGHTHOUSE_COASTAL_FAMILY_001",
      targetRecipeId: "LIGHTHOUSE_CLASSIC_RECIPE_001",
      handoffReady: true,
      rendererCompatibilityProfile: "custom-2.5d-passive"
    }
  },
  status: "approved"
});

export const lighthouseConceptAssetFactoryHandoffDefinition = deepFreeze({
  conceptId: "LIGHTHOUSE_COASTAL_FAMILY_001",
  assetFamilyId: "LIGHTHOUSE_COASTAL_FAMILY_001",
  category: "landmarks",
  theme: "coastal_australian_lighthouse",
  productionStatus: "workflow-ready",
  plannedComponents: [
    "LIGHTHOUSE_TOWER_BASE_001",
    "LIGHTHOUSE_TOWER_BODY_SHORT_001",
    "LIGHTHOUSE_TOWER_BODY_MEDIUM_001",
    "LIGHTHOUSE_TOWER_BODY_TALL_001",
    "LIGHTHOUSE_LANTERN_BASE_001",
    "LIGHTHOUSE_GLASS_RING_001",
    "LIGHTHOUSE_LIGHT_SOURCE_001",
    "LIGHTHOUSE_BEAM_EFFECT_001",
    "LIGHTHOUSE_ROOF_CAP_001"
  ],
  plannedRecipes: [
    "LIGHTHOUSE_ISLAND_ROCKY_RECIPE_001",
    "LIGHTHOUSE_CLASSIC_RECIPE_001",
    "LIGHTHOUSE_HARBOR_RECIPE_001"
  ],
  appearanceProfiles: [
    "DAY_COASTAL_LIGHTHOUSE",
    "NIGHT_COASTAL_LIGHTHOUSE",
    "SUNSET_COASTAL_LIGHTHOUSE"
  ],
  metadata: {
    creatorSource: "internal",
    validationState: "workflow-ready",
    conceptStatus: "approved",
    assetFactoryWorkflowCompatibility: {
      assetRegistryCompatible: true,
      recipeSystemCompatible: true,
      componentLibraryCompatible: true,
      assetManifestCompatible: true,
      lightweightBuildPlanningReady: true,
      importContractReady: true,
      blenderWorkflowReady: true,
      rendererCompatibilityProfile: "custom-2.5d-passive"
    }
  }
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export function validateLighthouseConceptAssetFactoryHandoff(
  rawHandoff = lighthouseConceptAssetFactoryHandoffDefinition,
  options = {}
) {
  try {
    const conceptCard =
      options.conceptCard ?? lighthouseCoastalFamilyConceptDefinition;
    const conceptValidation = validateConceptCard(conceptCard);

    if (!conceptValidation.ok) {
      return Object.freeze({
        ok: false,
        errorCode: conceptValidation.errorCode,
        message: conceptValidation.message,
        handoff: null
      });
    }

    const handoff = normalizeLighthouseConceptHandoff(rawHandoff);
    validateApprovedConceptStatus(conceptValidation.normalizedConcept.status);
    validateConceptCompatibility(conceptValidation.normalizedConcept, handoff);
    validatePlannedComponents(handoff, conceptValidation.normalizedConcept);
    validatePlannedRecipes(handoff);
    validateAppearanceProfiles(handoff);
    validateAssetFactoryWorkflowCompatibility(handoff);

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      handoff: Object.freeze({
        concept: conceptValidation.normalizedConcept,
        planningData: handoff,
        compatibility: Object.freeze({
          approvedConceptStatusVerified: true,
          componentPlanningVerified: true,
          recipePlanningVerified: true,
          appearanceProfilesVerified: true,
          assetFactoryWorkflowCompatibilityVerified: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "LighthouseConceptAssetFactoryHandoffValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      handoff: null
    });
  }
}

function normalizeLighthouseConceptHandoff(rawHandoff) {
  const handoff = asPlainObject(rawHandoff, "lighthouse concept handoff");
  assertRequiredFields(handoff);

  const conceptId = normalizePermanentId(handoff.conceptId, "conceptId");
  const assetFamilyId = normalizePermanentId(handoff.assetFamilyId, "assetFamilyId");
  const category = normalizeCategory(handoff.category, "category");
  const theme = normalizeStringValue(handoff.theme, "theme");
  const productionStatus = normalizeProductionStatus(
    handoff.productionStatus,
    "productionStatus"
  );
  const plannedComponents = deepFreeze(
    normalizePermanentIdArray(handoff.plannedComponents, "plannedComponents")
  );
  const plannedRecipes = deepFreeze(
    normalizePermanentIdArray(handoff.plannedRecipes, "plannedRecipes")
  );
  const appearanceProfiles = deepFreeze(
    normalizePermanentIdLikeArray(handoff.appearanceProfiles, "appearanceProfiles")
  );
  const metadata = normalizeHandoffMetadata(handoff.metadata);

  return deepFreeze({
    conceptId,
    assetFamilyId,
    category,
    theme,
    productionStatus,
    plannedComponents,
    plannedRecipes,
    appearanceProfiles,
    metadata
  });
}

function normalizeHandoffMetadata(rawMetadata) {
  const metadata = asPlainObject(rawMetadata, "metadata");
  const compatibility = asPlainObject(
    metadata.assetFactoryWorkflowCompatibility,
    "metadata.assetFactoryWorkflowCompatibility"
  );

  return deepFreeze({
    creatorSource: normalizeStringValue(metadata.creatorSource, "metadata.creatorSource"),
    validationState: normalizeStringValue(
      metadata.validationState,
      "metadata.validationState"
    ),
    conceptStatus: normalizeStatus(metadata.conceptStatus, "metadata.conceptStatus"),
    assetFactoryWorkflowCompatibility: deepFreeze({
      assetRegistryCompatible: normalizeBoolean(
        compatibility.assetRegistryCompatible,
        "metadata.assetFactoryWorkflowCompatibility.assetRegistryCompatible"
      ),
      recipeSystemCompatible: normalizeBoolean(
        compatibility.recipeSystemCompatible,
        "metadata.assetFactoryWorkflowCompatibility.recipeSystemCompatible"
      ),
      componentLibraryCompatible: normalizeBoolean(
        compatibility.componentLibraryCompatible,
        "metadata.assetFactoryWorkflowCompatibility.componentLibraryCompatible"
      ),
      assetManifestCompatible: normalizeBoolean(
        compatibility.assetManifestCompatible,
        "metadata.assetFactoryWorkflowCompatibility.assetManifestCompatible"
      ),
      lightweightBuildPlanningReady: normalizeBoolean(
        compatibility.lightweightBuildPlanningReady,
        "metadata.assetFactoryWorkflowCompatibility.lightweightBuildPlanningReady"
      ),
      importContractReady: normalizeBoolean(
        compatibility.importContractReady,
        "metadata.assetFactoryWorkflowCompatibility.importContractReady"
      ),
      blenderWorkflowReady: normalizeBoolean(
        compatibility.blenderWorkflowReady,
        "metadata.assetFactoryWorkflowCompatibility.blenderWorkflowReady"
      ),
      rendererCompatibilityProfile: normalizeStringValue(
        compatibility.rendererCompatibilityProfile,
        "metadata.assetFactoryWorkflowCompatibility.rendererCompatibilityProfile"
      )
    })
  });
}

function validateApprovedConceptStatus(status) {
  if (status !== "approved") {
    throw createValidationError(
      "concept_not_approved",
      `Lighthouse concept handoff requires approved concept status, received ${status}.`
    );
  }
}

function validateConceptCompatibility(concept, handoff) {
  if (concept.conceptId !== handoff.conceptId) {
    throw createValidationError(
      "concept_identity_mismatch",
      "Handoff conceptId must match the approved concept card conceptId."
    );
  }

  if (concept.category !== handoff.category) {
    throw createValidationError(
      "category_mismatch",
      "Handoff category must match the approved concept category."
    );
  }

  if (concept.theme !== handoff.theme) {
    throw createValidationError(
      "theme_mismatch",
      "Handoff theme must match the approved concept theme."
    );
  }
}

function validatePlannedComponents(handoff, concept) {
  if (
    JSON.stringify(handoff.plannedComponents) !== JSON.stringify(concept.componentIdeas)
  ) {
    throw createValidationError(
      "component_planning_mismatch",
      "Planned lighthouse components must match the approved concept componentIdeas set."
    );
  }
}

function validatePlannedRecipes(handoff) {
  if (handoff.plannedRecipes.length !== 3) {
    throw createValidationError(
      "invalid_recipe_planning",
      "Lighthouse handoff requires exactly three planned recipe references."
    );
  }
}

function validateAppearanceProfiles(handoff) {
  const expectedProfiles = [
    "DAY_COASTAL_LIGHTHOUSE",
    "NIGHT_COASTAL_LIGHTHOUSE",
    "SUNSET_COASTAL_LIGHTHOUSE"
  ];

  if (JSON.stringify(handoff.appearanceProfiles) !== JSON.stringify(expectedProfiles)) {
    throw createValidationError(
      "appearance_profile_mismatch",
      "Lighthouse handoff appearance profiles must match the approved day/night/sunset profile set."
    );
  }
}

function validateAssetFactoryWorkflowCompatibility(handoff) {
  const compatibility = handoff.metadata.assetFactoryWorkflowCompatibility;
  const requiredTrueFields = [
    "assetRegistryCompatible",
    "recipeSystemCompatible",
    "componentLibraryCompatible",
    "assetManifestCompatible",
    "lightweightBuildPlanningReady",
    "importContractReady",
    "blenderWorkflowReady"
  ];

  for (const fieldName of requiredTrueFields) {
    if (!compatibility[fieldName]) {
      throw createValidationError(
        "workflow_compatibility_incomplete",
        `Asset Factory lighthouse handoff requires ${fieldName} to be true.`
      );
    }
  }

  if (compatibility.rendererCompatibilityProfile !== "custom-2.5d-passive") {
    throw createValidationError(
      "renderer_profile_mismatch",
      "Lighthouse handoff must remain aligned to the passive Custom 2.5D renderer profile."
    );
  }
}

function assertRequiredFields(handoff) {
  for (const fieldName of lighthouseConceptAssetFactoryHandoffRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(handoff, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Lighthouse concept handoff is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeCategory(value, fieldName) {
  const category = normalizeStringValue(value, fieldName);
  if (!assetFactoryCategories.includes(category)) {
    throw createValidationError(
      "invalid_category",
      `Category ${category} is not part of the approved Asset Factory categories.`
    );
  }
  return category;
}

function normalizeStatus(value, fieldName) {
  const status = normalizeStringValue(value, fieldName);
  if (!conceptApprovalWorkflowStatuses.includes(status)) {
    throw createValidationError(
      "invalid_status",
      `Status ${status} is not part of the approved concept workflow states.`
    );
  }
  return status;
}

function normalizeProductionStatus(value, fieldName) {
  const status = normalizeStringValue(value, fieldName);
  if (!lighthouseConceptHandoffProductionStatuses.includes(status)) {
    throw createValidationError(
      "invalid_production_status",
      `Production status ${status} is not part of the approved lighthouse handoff workflow states.`
    );
  }
  return status;
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

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of permanent IDs.`
    );
  }

  return value.map((entry, index) =>
    normalizePermanentId(entry, `${fieldName}[${index}]`)
  );
}

function normalizePermanentIdLikeArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of uppercase profile IDs.`
    );
  }

  return value.map((entry, index) => {
    const normalized = normalizeStringValue(entry, `${fieldName}[${index}]`).toUpperCase();
    if (!/^[A-Z][A-Z0-9_]*$/.test(normalized)) {
      throw createValidationError(
        "invalid_identifier",
        `Field ${fieldName}[${index}] must use the approved uppercase profile ID format.`
      );
    }
    return normalized;
  });
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
  error.name = "LighthouseConceptAssetFactoryHandoffValidationError";
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
