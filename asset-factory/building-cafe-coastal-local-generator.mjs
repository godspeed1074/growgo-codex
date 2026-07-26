import path from "node:path";

export const buildingCafeCoastalLocalGeneratorRequiredFields = Object.freeze([
  "assetId",
  "recipeId",
  "familyId",
  "scriptLocation",
  "expectedOutputLocation",
  "executionInstructions",
  "validationMetadata"
]);

export const buildingCafeCoastalLocalGeneratorDefinition = deepFreeze({
  assetId: "BUILDING_CAFE_COASTAL_001",
  recipeId: "RECIPE_CAFE_COASTAL_001",
  familyId: "FAMILY_COMMERCIAL_COASTAL",
  scriptLocation:
    "asset-factory/local-blender-scripts/generate_building_cafe_coastal.py",
  expectedOutputLocation:
    "asset-factory-workspace/production/CAFE_COASTAL_FAMILY_001/export",
  executionInstructions: {
    blenderCommand:
      "blender --factory-startup --python asset-factory/local-blender-scripts/generate_building_cafe_coastal.py -- --output-dir asset-factory-workspace/production/CAFE_COASTAL_FAMILY_001/export --auto-quit",
    commandArguments: [
      "--factory-startup",
      "--python",
      "asset-factory/local-blender-scripts/generate_building_cafe_coastal.py",
      "--",
      "--output-dir",
      "asset-factory-workspace/production/CAFE_COASTAL_FAMILY_001/export",
      "--auto-quit"
    ],
    localExecutionOnly: true,
    preferredExecutionMode: "gui"
  },
  validationMetadata: {
    reusedLibraryResolutionValidated: true,
    hospitalityBatchResolutionValidated: true,
    recipeAssemblyValidated: true,
    metadataWritingValidated: true
  }
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export function createBuildingCafeCoastalLocalGenerator(
  rawDefinition = buildingCafeCoastalLocalGeneratorDefinition
) {
  return normalizeDefinition(rawDefinition);
}

export function buildBuildingCafeCoastalLocalBlenderCommand(
  rawDefinition = buildingCafeCoastalLocalGeneratorDefinition
) {
  return normalizeDefinition(rawDefinition).executionInstructions.blenderCommand;
}

export function validateBuildingCafeCoastalLocalGenerator(
  rawDefinition = buildingCafeCoastalLocalGeneratorDefinition
) {
  try {
    const definition = normalizeDefinition(rawDefinition);

    const expectedScriptPath = path.join(
      "asset-factory",
      "local-blender-scripts",
      "generate_building_cafe_coastal.py"
    );

    if (definition.scriptLocation !== expectedScriptPath) {
      throw createValidationError(
        "script_location_mismatch",
        "Building cafe coastal local generator script location must match the approved assembly script."
      );
    }

    if (!definition.executionInstructions.blenderCommand.startsWith("blender ")) {
      throw createValidationError(
        "command_mismatch",
        "Building cafe coastal local generator command must begin with the Blender executable."
      );
    }

    if (
      !definition.executionInstructions.blenderCommand.includes(
        definition.scriptLocation
      ) ||
      !definition.executionInstructions.blenderCommand.includes(
        definition.expectedOutputLocation
      )
    ) {
      throw createValidationError(
        "command_mismatch",
        "Building cafe coastal local generator command must include the approved script path and output directory."
      );
    }

    if (!definition.executionInstructions.blenderCommand.includes("--auto-quit")) {
      throw createValidationError(
        "command_mismatch",
        "Building cafe coastal local generator command must request automatic quit for controlled GUI execution."
      );
    }

    if (!definition.executionInstructions.localExecutionOnly) {
      throw createValidationError(
        "invalid_execution_target",
        "Building cafe coastal local generator must remain local-execution-only."
      );
    }

    if (definition.executionInstructions.preferredExecutionMode !== "gui") {
      throw createValidationError(
        "invalid_execution_mode",
        "Building cafe coastal local generator must prefer GUI execution."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      localGenerator: Object.freeze({
        definition,
        compatibility: Object.freeze({
          localExecutionOnly: true,
          guiExecutionPreferred: true,
          recipeAssemblyScoped: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "BuildingCafeCoastalLocalGeneratorValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      localGenerator: null
    });
  }
}

function normalizeDefinition(rawDefinition) {
  const definition = asPlainObject(
    rawDefinition,
    "building cafe coastal local generator"
  );
  assertRequiredFields(definition);

  return deepFreeze({
    assetId: normalizePermanentId(definition.assetId, "assetId"),
    recipeId: normalizePermanentId(definition.recipeId, "recipeId"),
    familyId: normalizeNonEmptyString(definition.familyId, "familyId"),
    scriptLocation: normalizeRelativePythonPath(
      definition.scriptLocation,
      "scriptLocation"
    ),
    expectedOutputLocation: normalizeRelativePath(
      definition.expectedOutputLocation,
      "expectedOutputLocation"
    ),
    executionInstructions: normalizeExecutionInstructions(
      definition.executionInstructions
    ),
    validationMetadata: normalizeValidationMetadata(definition.validationMetadata)
  });
}

function normalizeExecutionInstructions(rawExecutionInstructions) {
  const executionInstructions = asPlainObject(
    rawExecutionInstructions,
    "executionInstructions"
  );
  return deepFreeze({
    blenderCommand: normalizeNonEmptyString(
      executionInstructions.blenderCommand,
      "executionInstructions.blenderCommand"
    ),
    commandArguments: deepFreeze(
      normalizeStringArray(
        executionInstructions.commandArguments,
        "executionInstructions.commandArguments"
      )
    ),
    localExecutionOnly: normalizeBoolean(
      executionInstructions.localExecutionOnly,
      "executionInstructions.localExecutionOnly"
    ),
    preferredExecutionMode: normalizeEnum(
      executionInstructions.preferredExecutionMode,
      "executionInstructions.preferredExecutionMode",
      ["gui", "background"]
    )
  });
}

function normalizeValidationMetadata(rawValidationMetadata) {
  const validationMetadata = asPlainObject(
    rawValidationMetadata,
    "validationMetadata"
  );
  return deepFreeze({
    reusedLibraryResolutionValidated: normalizeBoolean(
      validationMetadata.reusedLibraryResolutionValidated,
      "validationMetadata.reusedLibraryResolutionValidated"
    ),
    hospitalityBatchResolutionValidated: normalizeBoolean(
      validationMetadata.hospitalityBatchResolutionValidated,
      "validationMetadata.hospitalityBatchResolutionValidated"
    ),
    recipeAssemblyValidated: normalizeBoolean(
      validationMetadata.recipeAssemblyValidated,
      "validationMetadata.recipeAssemblyValidated"
    ),
    metadataWritingValidated: normalizeBoolean(
      validationMetadata.metadataWritingValidated,
      "validationMetadata.metadataWritingValidated"
    )
  });
}

function assertRequiredFields(definition) {
  for (const fieldName of buildingCafeCoastalLocalGeneratorRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(definition, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Building cafe coastal local generator is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeNonEmptyString(value, fieldName);
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "invalid_permanent_id",
      `${fieldName} must be a permanent Asset Factory identifier.`
    );
  }
  return normalized;
}

function normalizeRelativePythonPath(value, fieldName) {
  const normalized = normalizeRelativePath(value, fieldName);
  if (!normalized.endsWith(".py")) {
    throw createValidationError(
      "invalid_python_path",
      `${fieldName} must reference a Python script path.`
    );
  }
  return normalized;
}

function normalizeRelativePath(value, fieldName) {
  const normalized = normalizeNonEmptyString(value, fieldName).replaceAll("\\", "/");
  if (path.isAbsolute(normalized)) {
    throw createValidationError(
      "absolute_path_not_allowed",
      `${fieldName} must remain relative to the repository root.`
    );
  }
  if (normalized.startsWith("../")) {
    throw createValidationError(
      "parent_path_not_allowed",
      `${fieldName} must not escape the repository root.`
    );
  }
  return normalized;
}

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_string_array",
      `${fieldName} must be a non-empty string array.`
    );
  }
  return value.map((entry, index) =>
    normalizeNonEmptyString(entry, `${fieldName}[${index}]`)
  );
}

function normalizeEnum(value, fieldName, allowedValues) {
  const normalized = normalizeNonEmptyString(value, fieldName);
  if (!allowedValues.includes(normalized)) {
    throw createValidationError(
      "invalid_enum_value",
      `${fieldName} must be one of ${allowedValues.join(", ")}.`
    );
  }
  return normalized;
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createValidationError(
      "invalid_boolean",
      `${fieldName} must be a boolean.`
    );
  }
  return value;
}

function normalizeNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createValidationError(
      "invalid_string",
      `${fieldName} must be a non-empty string.`
    );
  }
  return value.trim();
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_definition",
      `${label} must be a plain object.`
    );
  }
  return value;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "BuildingCafeCoastalLocalGeneratorValidationError";
  error.code = code;
  return error;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }
  return Object.freeze(value);
}
