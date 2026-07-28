import path from "node:path";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const key of Reflect.ownKeys(value)) {
    const nestedValue = value[key];
    if (nestedValue && typeof nestedValue === "object") {
      deepFreeze(nestedValue);
    }
  }

  return Object.freeze(value);
}

export const buildingCivicSportsPavilionLocalGeneratorRequiredFields =
  Object.freeze([
    "assetId",
    "recipeId",
    "familyId",
    "category",
    "blenderExecutable",
    "scriptLocation",
    "expectedOutputLocation",
    "executionInstructions",
    "validationMetadata"
  ]);

export const buildingCivicSportsPavilionLocalGeneratorDefinition = deepFreeze({
  assetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
  recipeId: "SPORTS_FACILITY_RECIPE_001",
  familyId: "CIVIC_SPORTS_PAVILION_FAMILY_001",
  category: "BUILDING_CIVIC",
  blenderExecutable:
    "/Applications/Blender-4.2-LTS.app/Contents/MacOS/Blender",
  scriptLocation:
    "asset-factory/local-blender-scripts/generate_building_civic_sports_pavilion.py",
  expectedOutputLocation:
    "asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export",
  executionInstructions: {
    blenderCommand:
      "/Applications/Blender-4.2-LTS.app/Contents/MacOS/Blender --background --factory-startup -noaudio --python-exit-code 1 --python asset-factory/local-blender-scripts/generate_building_civic_sports_pavilion.py -- --output-dir asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export --auto-quit",
    commandArguments: [
      "--background",
      "--factory-startup",
      "-noaudio",
      "--python-exit-code",
      "1",
      "--python",
      "asset-factory/local-blender-scripts/generate_building_civic_sports_pavilion.py",
      "--",
      "--output-dir",
      "asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export",
      "--auto-quit"
    ],
    localExecutionOnly: true,
    preferredExecutionMode: "background"
  },
  validationMetadata: {
    modularAuditValidated: true,
    deterministicPaletteValidated: true,
    recipeAssemblyValidated: true,
    metadataWritingValidated: true
  }
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export function createBuildingCivicSportsPavilionLocalGenerator(
  rawDefinition = buildingCivicSportsPavilionLocalGeneratorDefinition
) {
  return normalizeDefinition(rawDefinition);
}

export function buildBuildingCivicSportsPavilionLocalBlenderCommand(
  rawDefinition = buildingCivicSportsPavilionLocalGeneratorDefinition
) {
  return normalizeDefinition(rawDefinition).executionInstructions.blenderCommand;
}

export function validateBuildingCivicSportsPavilionLocalGenerator(
  rawDefinition = buildingCivicSportsPavilionLocalGeneratorDefinition
) {
  try {
    const definition = normalizeDefinition(rawDefinition);

    const expectedScriptPath = path.join(
      "asset-factory",
      "local-blender-scripts",
      "generate_building_civic_sports_pavilion.py"
    );

    if (definition.scriptLocation !== expectedScriptPath) {
      throw createValidationError(
        "script_location_mismatch",
        "Building civic sports pavilion local generator script location must match the approved authoring script."
      );
    }

    if (
      !definition.executionInstructions.blenderCommand.startsWith(
        `${definition.blenderExecutable} `
      )
    ) {
      throw createValidationError(
        "command_mismatch",
        "Building civic sports pavilion local generator command must begin with the approved Blender 4.2 LTS executable."
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
        "Building civic sports pavilion local generator command must include the approved script path and output directory."
      );
    }

    if (!definition.executionInstructions.blenderCommand.includes("--background")) {
      throw createValidationError(
        "command_mismatch",
        "Building civic sports pavilion local generator command must request controlled background execution."
      );
    }

    if (!definition.executionInstructions.blenderCommand.includes("-noaudio")) {
      throw createValidationError(
        "command_mismatch",
        "Building civic sports pavilion local generator command must disable audio during controlled execution."
      );
    }

    if (
      !definition.executionInstructions.blenderCommand.includes(
        "--python-exit-code 1"
      )
    ) {
      throw createValidationError(
        "command_mismatch",
        "Building civic sports pavilion local generator command must request Python exit-code escalation."
      );
    }

    if (!definition.executionInstructions.blenderCommand.includes("--auto-quit")) {
      throw createValidationError(
        "command_mismatch",
        "Building civic sports pavilion local generator command must request automatic quit for controlled execution."
      );
    }

    if (!definition.executionInstructions.localExecutionOnly) {
      throw createValidationError(
        "invalid_execution_target",
        "Building civic sports pavilion local generator must remain local-execution-only."
      );
    }

    if (definition.executionInstructions.preferredExecutionMode !== "background") {
      throw createValidationError(
        "invalid_execution_mode",
        "Building civic sports pavilion local generator must prefer background execution."
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
          backgroundExecutionPreferred: true,
          recipeAssemblyScoped: true
        })
      })
    });
  } catch (error) {
    if (
      error?.name !== "BuildingCivicSportsPavilionLocalGeneratorValidationError"
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
    "building civic sports pavilion local generator"
  );
  assertRequiredFields(definition);

  return deepFreeze({
    assetId: normalizePermanentId(definition.assetId, "assetId"),
    recipeId: normalizePermanentId(definition.recipeId, "recipeId"),
    familyId: normalizeNonEmptyString(definition.familyId, "familyId"),
    category: normalizeNonEmptyString(definition.category, "category"),
    blenderExecutable: normalizeAbsoluteExecutablePath(
      definition.blenderExecutable,
      "blenderExecutable"
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
    modularAuditValidated: normalizeBoolean(
      validationMetadata.modularAuditValidated,
      "validationMetadata.modularAuditValidated"
    ),
    deterministicPaletteValidated: normalizeBoolean(
      validationMetadata.deterministicPaletteValidated,
      "validationMetadata.deterministicPaletteValidated"
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
  for (const fieldName of buildingCivicSportsPavilionLocalGeneratorRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(definition, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Building civic sports pavilion local generator is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeNonEmptyString(value, fieldName);
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "invalid_permanent_id",
      `${fieldName} must be a valid permanent Asset Factory identifier.`
    );
  }
  return normalized;
}

function normalizeRelativePythonPath(value, fieldName) {
  const normalized = normalizeRelativePath(value, fieldName);
  if (!normalized.endsWith(".py")) {
    throw createValidationError(
      "invalid_python_path",
      `${fieldName} must point to a Python script.`
    );
  }
  return normalized;
}

function normalizeAbsoluteExecutablePath(value, fieldName) {
  const normalized = normalizeNonEmptyString(value, fieldName);
  if (!path.isAbsolute(normalized)) {
    throw createValidationError(
      "invalid_executable_path",
      `${fieldName} must be an absolute executable path.`
    );
  }
  return normalized;
}

function normalizeRelativePath(value, fieldName) {
  const normalized = normalizeNonEmptyString(value, fieldName);
  if (path.isAbsolute(normalized)) {
    throw createValidationError(
      "invalid_relative_path",
      `${fieldName} must be a relative path.`
    );
  }
  return normalized;
}

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_string_array",
      `${fieldName} must be a non-empty array of strings.`
    );
  }
  return value.map((entry, index) =>
    normalizeNonEmptyString(entry, `${fieldName}[${index}]`)
  );
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

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_object",
      `${label} must be provided as an object.`
    );
  }
  return value;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "BuildingCivicSportsPavilionLocalGeneratorValidationError";
  error.code = code;
  return error;
}
