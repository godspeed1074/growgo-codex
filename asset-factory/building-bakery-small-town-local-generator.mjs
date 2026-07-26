import path from "node:path";

export const buildingBakerySmallTownLocalGeneratorRequiredFields =
  Object.freeze([
    "assetId",
    "recipeId",
    "familyId",
    "category",
    "scriptLocation",
    "expectedOutputLocation",
    "executionInstructions",
    "validationMetadata"
  ]);

export const buildingBakerySmallTownLocalGeneratorDefinition = deepFreeze({
  assetId: "BUILDING_BAKERY_SMALL_TOWN_001",
  recipeId: "RECIPE_BAKERY_SMALL_TOWN_001",
  familyId: "FAMILY_COMMERCIAL_SMALL_TOWN",
  category: "BUILDING_COMMERCIAL",
  scriptLocation:
    "asset-factory/local-blender-scripts/generate_building_bakery_small_town.py",
  expectedOutputLocation:
    "asset-factory-workspace/production/BAKERY_SMALL_TOWN_FAMILY_001/export",
  executionInstructions: {
    blenderCommand:
      "blender --factory-startup --python asset-factory/local-blender-scripts/generate_building_bakery_small_town.py -- --output-dir asset-factory-workspace/production/BAKERY_SMALL_TOWN_FAMILY_001/export --auto-quit",
    commandArguments: [
      "--factory-startup",
      "--python",
      "asset-factory/local-blender-scripts/generate_building_bakery_small_town.py",
      "--",
      "--output-dir",
      "asset-factory-workspace/production/BAKERY_SMALL_TOWN_FAMILY_001/export",
      "--auto-quit"
    ],
    localExecutionOnly: true,
    preferredExecutionMode: "gui"
  },
  validationMetadata: {
    reusedLibraryResolutionValidated: true,
    hospitalityBatchResolutionValidated: true,
    bakeryIdentityBatchResolutionValidated: true,
    recipeAssemblyValidated: true,
    metadataWritingValidated: true
  }
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export function createBuildingBakerySmallTownLocalGenerator(
  rawDefinition = buildingBakerySmallTownLocalGeneratorDefinition
) {
  return normalizeDefinition(rawDefinition);
}

export function buildBuildingBakerySmallTownLocalBlenderCommand(
  rawDefinition = buildingBakerySmallTownLocalGeneratorDefinition
) {
  return normalizeDefinition(rawDefinition).executionInstructions.blenderCommand;
}

export function validateBuildingBakerySmallTownLocalGenerator(
  rawDefinition = buildingBakerySmallTownLocalGeneratorDefinition
) {
  try {
    const definition = normalizeDefinition(rawDefinition);

    const expectedScriptPath = path.join(
      "asset-factory",
      "local-blender-scripts",
      "generate_building_bakery_small_town.py"
    );

    if (definition.scriptLocation !== expectedScriptPath) {
      throw createValidationError(
        "script_location_mismatch",
        "Building bakery small town local generator script location must match the approved assembly script."
      );
    }

    if (!definition.executionInstructions.blenderCommand.startsWith("blender ")) {
      throw createValidationError(
        "command_mismatch",
        "Building bakery small town local generator command must begin with the Blender executable."
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
        "Building bakery small town local generator command must include the approved script path and output directory."
      );
    }

    if (!definition.executionInstructions.blenderCommand.includes("--auto-quit")) {
      throw createValidationError(
        "command_mismatch",
        "Building bakery small town local generator command must request automatic quit for controlled GUI execution."
      );
    }

    if (!definition.executionInstructions.localExecutionOnly) {
      throw createValidationError(
        "invalid_execution_target",
        "Building bakery small town local generator must remain local-execution-only."
      );
    }

    if (definition.executionInstructions.preferredExecutionMode !== "gui") {
      throw createValidationError(
        "invalid_execution_mode",
        "Building bakery small town local generator must prefer GUI execution."
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
    if (error?.name !== "BuildingBakerySmallTownLocalGeneratorValidationError") {
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
    "building bakery small town local generator"
  );
  assertRequiredFields(definition);

  return deepFreeze({
    assetId: normalizePermanentId(definition.assetId, "assetId"),
    recipeId: normalizePermanentId(definition.recipeId, "recipeId"),
    familyId: normalizeNonEmptyString(definition.familyId, "familyId"),
    category: normalizeNonEmptyString(definition.category, "category"),
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
    bakeryIdentityBatchResolutionValidated: normalizeBoolean(
      validationMetadata.bakeryIdentityBatchResolutionValidated,
      "validationMetadata.bakeryIdentityBatchResolutionValidated"
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
  for (const fieldName of buildingBakerySmallTownLocalGeneratorRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(definition, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Building bakery small town local generator is missing required field ${fieldName}.`
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

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createValidationError(
      "invalid_boolean",
      `${fieldName} must be a boolean.`
    );
  }
  return value;
}

function normalizeEnum(value, fieldName, allowedValues) {
  const normalized = normalizeNonEmptyString(value, fieldName);
  if (!allowedValues.includes(normalized)) {
    throw createValidationError(
      "invalid_enum",
      `${fieldName} must be one of ${allowedValues.join(", ")}.`
    );
  }
  return normalized;
}

function normalizeNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw createValidationError(
      "invalid_string",
      `${fieldName} must be a non-empty string.`
    );
  }
  return value.trim();
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_object",
      `${fieldName} must be an object.`
    );
  }
  return value;
}

function createValidationError(code, message) {
  return Object.assign(new Error(message), {
    code,
    name: "BuildingBakerySmallTownLocalGeneratorValidationError"
  });
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
