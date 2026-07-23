import { assetRegistryStatuses } from "./asset-registry.mjs";

export const componentLibraryRequiredFields = Object.freeze([
  "componentId",
  "category",
  "type",
  "version",
  "status",
  "dimensions",
  "attachmentPoints",
  "compatibilityRules",
  "tags",
  "metadata"
]);

export const componentLibraryCategories = Object.freeze([
  "walls",
  "roofs",
  "windows",
  "doors",
  "terrain_pieces",
  "vegetation_pieces",
  "road_pieces"
]);

const componentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const versionPattern = /^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){0,2}$/;

export function createComponentLibrary(initialComponents = []) {
  const componentMap = new Map();

  for (const component of initialComponents) {
    addComponent(component);
  }

  return Object.freeze({
    addComponent,
    hasComponent(componentId) {
      return componentMap.has(normalizeComponentIdInput(componentId));
    },
    findComponentById(componentId) {
      return componentMap.get(normalizeComponentIdInput(componentId)) ?? null;
    },
    getComponentMetadata(componentId) {
      const component = componentMap.get(normalizeComponentIdInput(componentId));
      return component ? component.metadata : null;
    },
    getComponentAttachmentInformation(componentId) {
      const component = componentMap.get(normalizeComponentIdInput(componentId));
      return component ? component.attachmentPoints : null;
    },
    isComponentAvailable(componentId) {
      const component = componentMap.get(normalizeComponentIdInput(componentId));
      return component ? component.status === "validated" : false;
    },
    isComponentCompatible(componentId, candidate) {
      const component = componentMap.get(normalizeComponentIdInput(componentId));
      if (!component) {
        return false;
      }

      const normalizedCandidate = normalizeCompatibilityCandidate(candidate);
      if (!normalizedCandidate) {
        return false;
      }

      const {
        allowedCategories,
        allowedTypes,
        disallowedComponentIds
      } = component.compatibilityRules;

      if (
        disallowedComponentIds.length > 0 &&
        disallowedComponentIds.includes(normalizedCandidate.componentId)
      ) {
        return false;
      }

      if (
        allowedCategories.length > 0 &&
        !allowedCategories.includes(normalizedCandidate.category)
      ) {
        return false;
      }

      if (
        allowedTypes.length > 0 &&
        !allowedTypes.includes(normalizedCandidate.type)
      ) {
        return false;
      }

      return true;
    },
    listComponents() {
      return Array.from(componentMap.values());
    },
    listComponentIds() {
      return Array.from(componentMap.keys());
    },
    size() {
      return componentMap.size;
    }
  });

  function addComponent(rawComponent) {
    const normalizedComponent = normalizeComponentRecord(rawComponent);

    if (componentMap.has(normalizedComponent.componentId)) {
      throw createComponentLibraryValidationError(
        "duplicate_component_id",
        `Component ID ${normalizedComponent.componentId} already exists in the component library.`
      );
    }

    componentMap.set(normalizedComponent.componentId, normalizedComponent);
    return normalizedComponent;
  }
}

export function validateComponentRecord(rawComponent) {
  try {
    const normalizedComponent = normalizeComponentRecord(rawComponent);
    return Object.freeze({
      ok: true,
      normalizedComponent,
      errorCode: null,
      message: null
    });
  } catch (error) {
    if (error?.name !== "ComponentLibraryValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      normalizedComponent: null,
      errorCode: error.code,
      message: error.message
    });
  }
}

function normalizeComponentRecord(rawComponent) {
  const component = asPlainObject(rawComponent, "component");
  assertRequiredFields(component);

  const componentId = normalizeComponentIdInput(component.componentId);
  if (!componentIdPattern.test(componentId)) {
    throw createComponentLibraryValidationError(
      "invalid_component_id",
      `Component ID ${componentId} must use the approved permanent component ID format.`
    );
  }

  const category = normalizeStringValue(component.category, "category");
  if (!componentLibraryCategories.includes(category)) {
    throw createComponentLibraryValidationError(
      "invalid_category",
      `Component category ${category} is not part of the approved component library categories.`
    );
  }

  const type = normalizeStringValue(component.type, "type");
  const version = normalizeStringValue(component.version, "version");
  if (!versionPattern.test(version)) {
    throw createComponentLibraryValidationError(
      "invalid_version",
      `Component version ${version} must use the approved version format.`
    );
  }

  const status = normalizeStringValue(component.status, "status");
  if (!assetRegistryStatuses.includes(status)) {
    throw createComponentLibraryValidationError(
      "invalid_status",
      `Component status ${status} is not part of the approved Asset Factory status set.`
    );
  }

  const dimensions = normalizeDimensions(component.dimensions);
  const attachmentPoints = normalizeAttachmentPoints(component.attachmentPoints);
  const compatibilityRules = normalizeCompatibilityRules(
    component.compatibilityRules
  );
  const tags = normalizeStringArray(component.tags, "tags");
  const metadata = deepFreeze(asPlainObject(component.metadata, "metadata"));

  return deepFreeze({
    componentId,
    category,
    type,
    version,
    status,
    dimensions,
    attachmentPoints,
    compatibilityRules,
    tags: deepFreeze(tags),
    metadata
  });
}

function assertRequiredFields(component) {
  for (const fieldName of componentLibraryRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(component, fieldName)) {
      throw createComponentLibraryValidationError(
        "missing_required_field",
        `Component record is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeDimensions(rawDimensions) {
  const dimensions = asPlainObject(rawDimensions, "dimensions");
  return deepFreeze({
    width: normalizePositiveNumber(dimensions.width, "dimensions.width"),
    height: normalizePositiveNumber(dimensions.height, "dimensions.height"),
    depth: normalizePositiveNumber(dimensions.depth, "dimensions.depth")
  });
}

function normalizeAttachmentPoints(rawAttachmentPoints) {
  if (!Array.isArray(rawAttachmentPoints)) {
    throw createComponentLibraryValidationError(
      "invalid_field_type",
      "attachmentPoints must be an array of attachment point objects."
    );
  }

  return deepFreeze(
    rawAttachmentPoints.map((rawPoint, index) => {
      const point = asPlainObject(rawPoint, `attachmentPoints[${index}]`);
      const position = asPlainObject(
        point.position,
        `attachmentPoints[${index}].position`
      );

      return deepFreeze({
        pointId: normalizeStringValue(
          point.pointId,
          `attachmentPoints[${index}].pointId`
        ),
        type: normalizeStringValue(
          point.type,
          `attachmentPoints[${index}].type`
        ),
        position: deepFreeze({
          x: normalizeFiniteNumber(position.x, `attachmentPoints[${index}].position.x`),
          y: normalizeFiniteNumber(position.y, `attachmentPoints[${index}].position.y`),
          z: normalizeFiniteNumber(position.z, `attachmentPoints[${index}].position.z`)
        })
      });
    })
  );
}

function normalizeCompatibilityRules(rawCompatibilityRules) {
  const rules = asPlainObject(rawCompatibilityRules, "compatibilityRules");

  return deepFreeze({
    allowedCategories: deepFreeze(
      normalizeOptionalStringArray(rules.allowedCategories, "allowedCategories")
    ),
    allowedTypes: deepFreeze(
      normalizeOptionalStringArray(rules.allowedTypes, "allowedTypes")
    ),
    disallowedComponentIds: deepFreeze(
      normalizeOptionalStringArray(
        rules.disallowedComponentIds,
        "disallowedComponentIds"
      ).map((value) => value.toUpperCase())
    )
  });
}

function normalizeCompatibilityCandidate(candidate) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }

  try {
    return Object.freeze({
      componentId: normalizeStringValue(
        candidate.componentId,
        "candidate.componentId"
      ).toUpperCase(),
      category: normalizeStringValue(candidate.category, "candidate.category"),
      type: normalizeStringValue(candidate.type, "candidate.type")
    });
  } catch {
    return null;
  }
}

function normalizeComponentIdInput(value) {
  return normalizeStringValue(value, "componentId").toUpperCase();
}

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createComponentLibraryValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of non-empty strings.`
    );
  }

  return value.map((entry, index) =>
    normalizeStringValue(entry, `${fieldName}[${index}]`)
  );
}

function normalizeOptionalStringArray(value, fieldName) {
  if (typeof value === "undefined") {
    return [];
  }

  return normalizeStringArray(value, fieldName);
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createComponentLibraryValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw createComponentLibraryValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }

  return normalized;
}

function normalizePositiveNumber(value, fieldName) {
  const normalized = normalizeFiniteNumber(value, fieldName);
  if (normalized <= 0) {
    throw createComponentLibraryValidationError(
      "invalid_field_value",
      `Field ${fieldName} must be greater than zero.`
    );
  }

  return normalized;
}

function normalizeFiniteNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw createComponentLibraryValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a finite number.`
    );
  }

  return value;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createComponentLibraryValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createComponentLibraryValidationError(code, message) {
  const error = new Error(message);
  error.name = "ComponentLibraryValidationError";
  error.code = code;
  return error;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested);
    }
  }

  return Object.freeze(value);
}
