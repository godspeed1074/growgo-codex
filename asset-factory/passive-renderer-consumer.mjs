export const passiveRendererConsumerRequiredFields = Object.freeze([
  "rendererAssetReference",
  "rendererComponentReferences",
  "transformData",
  "orientation",
  "metadata"
]);

export const supportedPassiveRendererProfiles = Object.freeze([
  "custom-2.5d-passive"
]);

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export function createPassiveRendererConsumer() {
  return Object.freeze({
    consume(payload) {
      return consumePassiveRendererPayload(payload);
    },
    validatePayload(payload) {
      return validatePassiveRendererPayload(payload);
    }
  });
}

export function consumePassiveRendererPayload(payload) {
  const validation = validatePassiveRendererPayload(payload);

  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      acceptedPayload: null
    });
  }

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    acceptedPayload: validation.normalizedPayload
  });
}

export function validatePassiveRendererPayload(payload) {
  try {
    const normalizedPayload = normalizePassiveRendererPayload(payload);

    return Object.freeze({
      ok: true,
      normalizedPayload,
      errorCode: null,
      message: null
    });
  } catch (error) {
    if (error?.name !== "PassiveRendererConsumerValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      normalizedPayload: null,
      errorCode: error.code,
      message: error.message
    });
  }
}

function normalizePassiveRendererPayload(rawPayload) {
  const payload = asPlainObject(rawPayload, "passive renderer payload");
  assertRequiredFields(payload);

  const rendererAssetReference = normalizeRendererAssetReference(
    payload.rendererAssetReference
  );
  const rendererComponentReferences = normalizeRendererComponentReferences(
    payload.rendererComponentReferences
  );
  const transformData = normalizeTransformData(payload.transformData);
  const orientation = normalizeOrientation(payload.orientation);
  const metadata = normalizePassiveRendererMetadata(payload.metadata);

  if (transformData.orientation !== orientation) {
    throw createPassiveRendererConsumerValidationError(
      "orientation_mismatch",
      `Renderer payload orientation ${orientation} must match transform orientation ${transformData.orientation}.`
    );
  }

  if (rendererComponentReferences.length === 0) {
    throw createPassiveRendererConsumerValidationError(
      "missing_component_references",
      "Passive renderer payload must contain at least one renderer component reference."
    );
  }

  return Object.freeze({
    rendererAssetReference,
    rendererComponentReferences: deepFreeze(rendererComponentReferences),
    transformData,
    orientation,
    metadata
  });
}

function normalizeRendererAssetReference(value) {
  const rendererAssetReference = asPlainObject(
    value,
    "rendererAssetReference"
  );

  return deepFreeze({
    assetId: normalizePermanentId(
      rendererAssetReference.assetId,
      "rendererAssetReference.assetId"
    ),
    manifestId: normalizePermanentId(
      rendererAssetReference.manifestId,
      "rendererAssetReference.manifestId"
    ),
    recipeId: normalizePermanentId(
      rendererAssetReference.recipeId,
      "rendererAssetReference.recipeId"
    ),
    rendererCategory: normalizeStringValue(
      rendererAssetReference.rendererCategory,
      "rendererAssetReference.rendererCategory"
    ),
    rendererLayer: normalizeStringValue(
      rendererAssetReference.rendererLayer,
      "rendererAssetReference.rendererLayer"
    )
  });
}

function normalizeRendererComponentReferences(value) {
  if (!Array.isArray(value)) {
    throw createPassiveRendererConsumerValidationError(
      "invalid_field_type",
      "rendererComponentReferences must be an array of passive renderer component references."
    );
  }

  return value.map((entry, index) => {
    const rendererComponentReference = asPlainObject(
      entry,
      `rendererComponentReferences[${index}]`
    );

    return deepFreeze({
      componentId: normalizePermanentId(
        rendererComponentReference.componentId,
        `rendererComponentReferences[${index}].componentId`
      ),
      rendererComponentKey: normalizeStringValue(
        rendererComponentReference.rendererComponentKey,
        `rendererComponentReferences[${index}].rendererComponentKey`
      ),
      rendererComponentCategory: normalizeStringValue(
        rendererComponentReference.rendererComponentCategory,
        `rendererComponentReferences[${index}].rendererComponentCategory`
      )
    });
  });
}

function normalizeTransformData(value) {
  const transformData = asPlainObject(value, "transformData");

  return deepFreeze({
    position: deepFreeze({
      x: normalizeFiniteNumber(transformData.position?.x, "transformData.position.x"),
      y: normalizeFiniteNumber(transformData.position?.y, "transformData.position.y")
    }),
    orientation: normalizeOrientation(transformData.orientation),
    alignmentRule: normalizeStringValue(
      transformData.alignmentRule,
      "transformData.alignmentRule"
    ),
    placementRuleId: normalizePermanentId(
      transformData.placementRuleId,
      "transformData.placementRuleId"
    ),
    locationId: normalizeStringValue(
      transformData.locationId,
      "transformData.locationId"
    )
  });
}

function normalizePassiveRendererMetadata(value) {
  const metadata = asPlainObject(value, "metadata");
  const adapterProfile = normalizeStringValue(
    metadata.adapterProfile,
    "metadata.adapterProfile"
  );

  if (!supportedPassiveRendererProfiles.includes(adapterProfile)) {
    throw createPassiveRendererConsumerValidationError(
      "unsupported_renderer_profile",
      `Renderer profile ${adapterProfile} is not supported by the passive renderer consumer contract.`
    );
  }

  return deepFreeze({
    adapterProfile,
    assetMetadata:
      typeof metadata.assetMetadata === "undefined"
        ? null
        : deepFreeze(asPlainObject(metadata.assetMetadata, "metadata.assetMetadata")),
    manifestMetadata:
      typeof metadata.manifestMetadata === "undefined"
        ? null
        : deepFreeze(
            asPlainObject(metadata.manifestMetadata, "metadata.manifestMetadata")
          ),
    recipeMetadata:
      typeof metadata.recipeMetadata === "undefined"
        ? null
        : deepFreeze(asPlainObject(metadata.recipeMetadata, "metadata.recipeMetadata")),
    placementMetadata:
      typeof metadata.placementMetadata === "undefined" || metadata.placementMetadata === null
        ? null
        : deepFreeze(
            asPlainObject(metadata.placementMetadata, "metadata.placementMetadata")
          )
  });
}

function assertRequiredFields(payload) {
  for (const fieldName of passiveRendererConsumerRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(payload, fieldName)) {
      throw createPassiveRendererConsumerValidationError(
        "missing_required_field",
        `Passive renderer payload is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();

  if (!permanentIdPattern.test(normalized)) {
    throw createPassiveRendererConsumerValidationError(
      "invalid_identifier",
      `Field ${fieldName} must use the approved permanent uppercase Asset Factory ID format.`
    );
  }

  return normalized;
}

function normalizeOrientation(value) {
  return normalizeStringValue(value, "orientation");
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createPassiveRendererConsumerValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw createPassiveRendererConsumerValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }

  return normalized;
}

function normalizeFiniteNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw createPassiveRendererConsumerValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a finite number.`
    );
  }

  return value;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createPassiveRendererConsumerValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createPassiveRendererConsumerValidationError(code, message) {
  const error = new Error(message);
  error.name = "PassiveRendererConsumerValidationError";
  error.code = code;
  return error;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const nestedValue of Object.values(value)) {
    if (nestedValue && typeof nestedValue === "object") {
      deepFreeze(nestedValue);
    }
  }

  return Object.freeze(value);
}
