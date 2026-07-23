import { assetFactoryCategories } from "./asset-registry.mjs";

export const conceptApprovalWorkflowStatuses = Object.freeze([
  "concept",
  "review",
  "approved",
  "production",
  "completed",
  "retired"
]);

export const conceptApprovalWorkflowRequiredFields = Object.freeze([
  "conceptId",
  "name",
  "category",
  "theme",
  "purpose",
  "visualDescription",
  "gameplayPurpose",
  "styleRules",
  "environmentRules",
  "componentIdeas",
  "metadata",
  "status"
]);

export const conceptApprovalWorkflowHandoffStatuses = Object.freeze([
  "approved",
  "production",
  "completed"
]);

export const coastalHouseConceptCardDefinition = deepFreeze({
  conceptId: "CONCEPT_COASTAL_HOUSE_SMALL_001",
  name: "Small Coastal House",
  category: "buildings",
  theme: "coastal_australian_residential",
  purpose: "Starter residential landmark for low-density coastal world tiles.",
  visualDescription:
    "A compact weatherboard coastal house with a readable gable roof, front entry, and shuttered windows suited to the Custom 2.5D silhouette profile.",
  gameplayPurpose:
    "Supports recognisable residential map identity without introducing gameplay authority or runtime renderer activation.",
  styleRules: [
    "weatherboard_or_light_render_surfaces",
    "salt-air_resilient_palette",
    "compact_modular_verandah_ready"
  ],
  environmentRules: [
    "coastal_residential_context_only",
    "road_edge_or_building_plot",
    "grass_dirt_or_sand_terrain"
  ],
  componentIdeas: [
    "COASTAL_HOUSE_WALL_PANEL_001",
    "COASTAL_HOUSE_ROOF_GABLE_001",
    "COASTAL_HOUSE_DOOR_BASIC_001",
    "COASTAL_HOUSE_WINDOW_SHUTTER_001"
  ],
  metadata: {
    creatorSource: "internal",
    validationState: "approved-for-handoff",
    suggestedAssetCategory: "buildings",
    componentPlanningReferences: [
      "COASTAL_HOUSE_WALL_PANEL_001",
      "COASTAL_HOUSE_ROOF_GABLE_001",
      "COASTAL_HOUSE_DOOR_BASIC_001",
      "COASTAL_HOUSE_WINDOW_SHUTTER_001"
    ],
    assetFactoryHandoffMetadata: {
      targetAssetId: "BUILDING_HOUSE_SMALL_COASTAL_001",
      targetRecipeId: "BUILDING_HOUSE_SMALL_COASTAL_RECIPE_001",
      handoffReady: true,
      rendererCompatibilityProfile: "custom-2.5d-passive"
    }
  },
  status: "approved"
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export function createConceptApprovalWorkflowRegistry(initialConcepts = []) {
  const conceptMap = new Map();

  for (const concept of initialConcepts) {
    addConcept(concept);
  }

  return Object.freeze({
    addConcept,
    hasConcept(conceptId) {
      return conceptMap.has(normalizePermanentId(conceptId, "conceptId"));
    },
    findConceptById(conceptId) {
      return conceptMap.get(normalizePermanentId(conceptId, "conceptId")) ?? null;
    },
    getConceptMetadata(conceptId) {
      const concept = conceptMap.get(normalizePermanentId(conceptId, "conceptId"));
      return concept ? concept.metadata : null;
    },
    getProductionHandoff(conceptId) {
      const concept = conceptMap.get(normalizePermanentId(conceptId, "conceptId"));
      if (!concept) {
        return null;
      }

      return buildConceptProductionHandoff(concept);
    },
    isHandoffReady(conceptId) {
      const concept = conceptMap.get(normalizePermanentId(conceptId, "conceptId"));
      if (!concept) {
        return false;
      }

      return isConceptHandoffReady(concept);
    },
    listConcepts() {
      return Array.from(conceptMap.values());
    },
    listConceptIds() {
      return Array.from(conceptMap.keys());
    },
    size() {
      return conceptMap.size;
    }
  });

  function addConcept(rawConcept) {
    const normalizedConcept = normalizeConceptCard(rawConcept);

    if (conceptMap.has(normalizedConcept.conceptId)) {
      throw createConceptApprovalWorkflowValidationError(
        "duplicate_concept_id",
        `Concept ID ${normalizedConcept.conceptId} already exists in the concept approval workflow registry.`
      );
    }

    conceptMap.set(normalizedConcept.conceptId, normalizedConcept);
    return normalizedConcept;
  }
}

export function validateConceptCard(rawConcept) {
  try {
    const normalizedConcept = normalizeConceptCard(rawConcept);
    return Object.freeze({
      ok: true,
      normalizedConcept,
      errorCode: null,
      message: null
    });
  } catch (error) {
    if (error?.name !== "ConceptApprovalWorkflowValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      normalizedConcept: null,
      errorCode: error.code,
      message: error.message
    });
  }
}

export function validateConceptProductionHandoff(rawConcept) {
  try {
    const concept = normalizeConceptCard(rawConcept);
    const handoff = buildConceptProductionHandoff(concept);
    return Object.freeze({
      ok: true,
      handoff,
      errorCode: null,
      message: null
    });
  } catch (error) {
    if (error?.name !== "ConceptApprovalWorkflowValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      handoff: null,
      errorCode: error.code,
      message: error.message
    });
  }
}

function normalizeConceptCard(rawConcept) {
  const concept = asPlainObject(rawConcept, "concept card");
  assertRequiredFields(concept);

  const conceptId = normalizePermanentId(concept.conceptId, "conceptId");
  const name = normalizeStringValue(concept.name, "name");
  const category = normalizeCategory(concept.category, "category");
  const theme = normalizeStringValue(concept.theme, "theme");
  const purpose = normalizeStringValue(concept.purpose, "purpose");
  const visualDescription = normalizeStringValue(
    concept.visualDescription,
    "visualDescription"
  );
  const gameplayPurpose = normalizeStringValue(
    concept.gameplayPurpose,
    "gameplayPurpose"
  );
  const styleRules = deepFreeze(normalizeStringArray(concept.styleRules, "styleRules"));
  const environmentRules = deepFreeze(
    normalizeStringArray(concept.environmentRules, "environmentRules")
  );
  const componentIdeas = deepFreeze(
    normalizePermanentIdArray(concept.componentIdeas, "componentIdeas")
  );
  const metadata = normalizeConceptMetadata(concept.metadata, category, componentIdeas);
  const status = normalizeStatus(concept.status, "status");

  validateHandoffReadiness(status, metadata, componentIdeas);

  return deepFreeze({
    conceptId,
    name,
    category,
    theme,
    purpose,
    visualDescription,
    gameplayPurpose,
    styleRules,
    environmentRules,
    componentIdeas,
    metadata,
    status
  });
}

function normalizeConceptMetadata(rawMetadata, category, componentIdeas) {
  const metadata = asPlainObject(rawMetadata, "metadata");
  const handoffMetadata = asPlainObject(
    metadata.assetFactoryHandoffMetadata,
    "metadata.assetFactoryHandoffMetadata"
  );

  const componentPlanningReferences = deepFreeze(
    normalizePermanentIdArray(
      metadata.componentPlanningReferences,
      "metadata.componentPlanningReferences"
    )
  );

  if (JSON.stringify(componentPlanningReferences) !== JSON.stringify(componentIdeas)) {
    throw createConceptApprovalWorkflowValidationError(
      "component_planning_mismatch",
      "Concept componentPlanningReferences must match the approved componentIdeas list."
    );
  }

  const suggestedAssetCategory = normalizeCategory(
    metadata.suggestedAssetCategory,
    "metadata.suggestedAssetCategory"
  );

  if (suggestedAssetCategory !== category) {
    throw createConceptApprovalWorkflowValidationError(
      "category_mismatch",
      "Concept suggestedAssetCategory must match the concept category."
    );
  }

  return deepFreeze({
    creatorSource: normalizeStringValue(metadata.creatorSource, "metadata.creatorSource"),
    validationState: normalizeStringValue(
      metadata.validationState,
      "metadata.validationState"
    ),
    suggestedAssetCategory,
    componentPlanningReferences,
    assetFactoryHandoffMetadata: deepFreeze({
      targetAssetId: normalizePermanentId(
        handoffMetadata.targetAssetId,
        "metadata.assetFactoryHandoffMetadata.targetAssetId"
      ),
      targetRecipeId: normalizePermanentId(
        handoffMetadata.targetRecipeId,
        "metadata.assetFactoryHandoffMetadata.targetRecipeId"
      ),
      handoffReady: normalizeBoolean(
        handoffMetadata.handoffReady,
        "metadata.assetFactoryHandoffMetadata.handoffReady"
      ),
      rendererCompatibilityProfile: normalizeStringValue(
        handoffMetadata.rendererCompatibilityProfile,
        "metadata.assetFactoryHandoffMetadata.rendererCompatibilityProfile"
      )
    })
  });
}

function validateHandoffReadiness(status, metadata, componentIdeas) {
  if (!conceptApprovalWorkflowHandoffStatuses.includes(status)) {
    return;
  }

  if (!metadata.assetFactoryHandoffMetadata.handoffReady) {
    throw createConceptApprovalWorkflowValidationError(
      "handoff_not_ready",
      `Concept status ${status} requires explicit handoffReady metadata.`
    );
  }

  if (componentIdeas.length === 0) {
    throw createConceptApprovalWorkflowValidationError(
      "handoff_missing_components",
      "Production handoff requires at least one component planning reference."
    );
  }
}

function buildConceptProductionHandoff(concept) {
  if (!isConceptHandoffReady(concept)) {
    throw createConceptApprovalWorkflowValidationError(
      "handoff_not_ready",
      `Concept ${concept.conceptId} is not approved for Asset Factory production handoff.`
    );
  }

  return deepFreeze({
    conceptId: concept.conceptId,
    approvedConcept: concept,
    suggestedAssetCategory: concept.metadata.suggestedAssetCategory,
    componentPlanningReferences: concept.metadata.componentPlanningReferences,
    assetFactoryHandoffMetadata: concept.metadata.assetFactoryHandoffMetadata
  });
}

function isConceptHandoffReady(concept) {
  return (
    conceptApprovalWorkflowHandoffStatuses.includes(concept.status) &&
    concept.metadata.assetFactoryHandoffMetadata.handoffReady === true
  );
}

function assertRequiredFields(concept) {
  for (const fieldName of conceptApprovalWorkflowRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(concept, fieldName)) {
      throw createConceptApprovalWorkflowValidationError(
        "missing_required_field",
        `Concept card is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeCategory(value, fieldName) {
  const category = normalizeStringValue(value, fieldName);
  if (!assetFactoryCategories.includes(category)) {
    throw createConceptApprovalWorkflowValidationError(
      "invalid_category",
      `Concept category ${category} is not part of the approved Asset Factory categories.`
    );
  }

  return category;
}

function normalizeStatus(value, fieldName) {
  const status = normalizeStringValue(value, fieldName);
  if (!conceptApprovalWorkflowStatuses.includes(status)) {
    throw createConceptApprovalWorkflowValidationError(
      "invalid_status",
      `Concept status ${status} is not part of the approved concept approval workflow states.`
    );
  }

  return status;
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw createConceptApprovalWorkflowValidationError(
      "invalid_identifier",
      `Field ${fieldName} must use the approved permanent uppercase Asset Factory ID format.`
    );
  }

  return normalized;
}

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createConceptApprovalWorkflowValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of permanent IDs.`
    );
  }

  return value.map((entry, index) =>
    normalizePermanentId(entry, `${fieldName}[${index}]`)
  );
}

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createConceptApprovalWorkflowValidationError(
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
    throw createConceptApprovalWorkflowValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }

  const normalized = value.trim();
  if (!normalized) {
    throw createConceptApprovalWorkflowValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }

  return normalized;
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createConceptApprovalWorkflowValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a boolean.`
    );
  }

  return value;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createConceptApprovalWorkflowValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createConceptApprovalWorkflowValidationError(code, message) {
  const error = new Error(message);
  error.name = "ConceptApprovalWorkflowValidationError";
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
