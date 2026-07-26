import path from "node:path";

export const bakerySmallTownModuleBatchLocalGeneratorRequiredFields =
  Object.freeze([
    "batchId",
    "moduleIds",
    "scriptLocation",
    "expectedOutputLocation",
    "executionInstructions",
    "validationMetadata"
  ]);

export const bakerySmallTownModuleBatchLocalGeneratorDefinition = deepFreeze({
  batchId: "BAKERY_SMALL_TOWN_MODULE_BATCH_001",
  moduleIds: Object.freeze([
    "MOD_BAKERY_DISPLAY_WINDOW_001",
    "MOD_BAKERY_SIGN_STANDARD_001",
    "MOD_BAKERY_COUNTER_FRONTAGE_001",
    "MOD_BAKERY_ROOFTOP_ICON_001"
  ]),
  scriptLocation:
    "asset-factory/local-blender-scripts/generate_bakery_small_town_modules.py",
  expectedOutputLocation:
    "asset-factory-workspace/production/BAKERY_SMALL_TOWN_MODULE_BATCH_001/export",
  executionInstructions: {
    blenderCommand:
      "blender --factory-startup --python asset-factory/local-blender-scripts/generate_bakery_small_town_modules.py -- --output-dir asset-factory-workspace/production/BAKERY_SMALL_TOWN_MODULE_BATCH_001/export --auto-quit",
    commandArguments: [
      "--factory-startup",
      "--python",
      "asset-factory/local-blender-scripts/generate_bakery_small_town_modules.py",
      "--",
      "--output-dir",
      "asset-factory-workspace/production/BAKERY_SMALL_TOWN_MODULE_BATCH_001/export",
      "--auto-quit"
    ],
    localExecutionOnly: true,
    preferredExecutionMode: "gui"
  },
  validationMetadata: {
    scriptContractValidated: true,
    batchCollectionsValidated: true,
    moduleGeometryValidated: true,
    materialGenerationValidated: true,
    lodGenerationValidated: true,
    exportPreparationValidated: true,
    moduleMetadataWritingValidated: true,
    batchRegistrationWritingValidated: true
  }
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export function createBakerySmallTownModuleBatchLocalGenerator(
  rawDefinition = bakerySmallTownModuleBatchLocalGeneratorDefinition
) {
  return normalizeDefinition(rawDefinition);
}

export function buildBakerySmallTownModuleBatchLocalBlenderCommand(
  rawDefinition = bakerySmallTownModuleBatchLocalGeneratorDefinition
) {
  return normalizeDefinition(rawDefinition).executionInstructions.blenderCommand;
}

export function validateBakerySmallTownModuleBatchLocalGenerator(
  rawDefinition = bakerySmallTownModuleBatchLocalGeneratorDefinition
) {
  try {
    const definition = normalizeDefinition(rawDefinition);

    const expectedScriptPath = path.join(
      "asset-factory",
      "local-blender-scripts",
      "generate_bakery_small_town_modules.py"
    );

    if (definition.scriptLocation !== expectedScriptPath) {
      throw createValidationError(
        "script_location_mismatch",
        "Bakery small town module batch script location must match the approved Python script."
      );
    }

    if (!definition.executionInstructions.blenderCommand.startsWith("blender ")) {
      throw createValidationError(
        "command_mismatch",
        "Bakery small town module batch Blender command must start with the Blender executable."
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
        "Bakery small town module batch Blender command must include the script location and output directory."
      );
    }

    if (!definition.executionInstructions.blenderCommand.includes("--auto-quit")) {
      throw createValidationError(
        "command_mismatch",
        "Bakery small town module batch Blender command must request automatic quit for controlled GUI execution."
      );
    }

    if (!definition.executionInstructions.localExecutionOnly) {
      throw createValidationError(
        "invalid_execution_target",
        "Bakery small town module batch local generator must remain local-execution-only."
      );
    }

    if (definition.executionInstructions.preferredExecutionMode !== "gui") {
      throw createValidationError(
        "invalid_execution_mode",
        "Bakery small town module batch local generator must prefer GUI execution."
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
          batchScoped: true
        })
      })
    });
  } catch (error) {
    if (
      error?.name !== "BakerySmallTownModuleBatchLocalGeneratorValidationError"
    ) {
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
    "bakery small town module batch local generator"
  );
  assertRequiredFields(definition);

  return deepFreeze({
    batchId: normalizeNonEmptyString(definition.batchId, "batchId"),
    moduleIds: deepFreeze(
      normalizePermanentIdArray(definition.moduleIds, "moduleIds")
    ),
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
    scriptContractValidated: normalizeBoolean(
      validationMetadata.scriptContractValidated,
      "validationMetadata.scriptContractValidated"
    ),
    batchCollectionsValidated: normalizeBoolean(
      validationMetadata.batchCollectionsValidated,
      "validationMetadata.batchCollectionsValidated"
    ),
    moduleGeometryValidated: normalizeBoolean(
      validationMetadata.moduleGeometryValidated,
      "validationMetadata.moduleGeometryValidated"
    ),
    materialGenerationValidated: normalizeBoolean(
      validationMetadata.materialGenerationValidated,
      "validationMetadata.materialGenerationValidated"
    ),
    lodGenerationValidated: normalizeBoolean(
      validationMetadata.lodGenerationValidated,
      "validationMetadata.lodGenerationValidated"
    ),
    exportPreparationValidated: normalizeBoolean(
      validationMetadata.exportPreparationValidated,
      "validationMetadata.exportPreparationValidated"
    ),
    moduleMetadataWritingValidated: normalizeBoolean(
      validationMetadata.moduleMetadataWritingValidated,
      "validationMetadata.moduleMetadataWritingValidated"
    ),
    batchRegistrationWritingValidated: normalizeBoolean(
      validationMetadata.batchRegistrationWritingValidated,
      "validationMetadata.batchRegistrationWritingValidated"
    )
  });
}

function assertRequiredFields(definition) {
  for (const fieldName of bakerySmallTownModuleBatchLocalGeneratorRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(definition, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Bakery small town module batch local generator is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_string_array",
      `${fieldName} must be a non-empty array.`
    );
  }
  return value.map((entry, index) =>
    normalizePermanentId(entry, `${fieldName}[${index}]`)
  );
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeNonEmptyString(value, fieldName);
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "invalid_permanent_id",
      `${fieldName} must be a permanent asset identifier.`
    );
  }
  return normalized;
}

function normalizeRelativePythonPath(value, fieldName) {
  const normalized = normalizeRelativePath(value, fieldName);
  if (!normalized.endsWith(".py")) {
    throw createValidationError(
      "invalid_python_path",
      `${fieldName} must reference a Python script.`
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
    name: "BakerySmallTownModuleBatchLocalGeneratorValidationError"
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
