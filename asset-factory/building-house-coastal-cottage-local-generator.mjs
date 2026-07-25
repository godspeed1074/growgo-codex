import path from "node:path";

export const buildingHouseCoastalCottageLocalGeneratorRequiredFields =
  Object.freeze([
    "assetId",
    "recipeId",
    "familyId",
    "scriptLocation",
    "expectedOutputLocation",
    "executionInstructions",
    "validationMetadata"
  ]);

export const buildingHouseCoastalCottageLocalGeneratorDefinition = deepFreeze({
  assetId: "BUILDING_HOUSE_COASTAL_COTTAGE_001",
  recipeId: "RECIPE_HOUSE_COASTAL_COTTAGE_001",
  familyId: "FAMILY_HOUSE_COASTAL",
  scriptLocation:
    "asset-factory/local-blender-scripts/generate_building_house_coastal_cottage.py",
  expectedOutputLocation:
    "asset-factory-workspace/production/HOUSE_COASTAL_FAMILY_001/export",
  executionInstructions: {
    blenderCommand:
      "blender --background --python asset-factory/local-blender-scripts/generate_building_house_coastal_cottage.py -- --output-dir asset-factory-workspace/production/HOUSE_COASTAL_FAMILY_001/export",
    commandArguments: [
      "--background",
      "--python",
      "asset-factory/local-blender-scripts/generate_building_house_coastal_cottage.py",
      "--",
      "--output-dir",
      "asset-factory-workspace/production/HOUSE_COASTAL_FAMILY_001/export"
    ],
    localExecutionOnly: true
  },
  validationMetadata: {
    phase1CoreModuleProofEnabled: true,
    phase2ShellAssemblyEnabled: true,
    phase3ProofAssetExpansionEnabled: true,
    outputMetadataWritingValidated: true
  }
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export function createBuildingHouseCoastalCottageLocalGenerator(
  rawDefinition = buildingHouseCoastalCottageLocalGeneratorDefinition
) {
  return normalizeDefinition(rawDefinition);
}

export function buildBuildingHouseCoastalCottageLocalBlenderCommand(
  rawDefinition = buildingHouseCoastalCottageLocalGeneratorDefinition
) {
  return normalizeDefinition(rawDefinition).executionInstructions.blenderCommand;
}

export function validateBuildingHouseCoastalCottageLocalGenerator(
  rawDefinition = buildingHouseCoastalCottageLocalGeneratorDefinition
) {
  try {
    const definition = normalizeDefinition(rawDefinition);

    const expectedScriptPath = path.join(
      "asset-factory",
      "local-blender-scripts",
      "generate_building_house_coastal_cottage.py"
    );

    if (definition.scriptLocation !== expectedScriptPath) {
      throw createValidationError(
        "script_location_mismatch",
        "Building house coastal cottage local generator script location must match the approved proof-build script."
      );
    }

    if (!definition.executionInstructions.blenderCommand.startsWith("blender ")) {
      throw createValidationError(
        "command_mismatch",
        "Building house coastal cottage local generator command must begin with the Blender executable."
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
        "Building house coastal cottage local generator command must include the approved script path and output directory."
      );
    }

    if (!definition.executionInstructions.localExecutionOnly) {
      throw createValidationError(
        "invalid_execution_target",
        "Building house coastal cottage local generator must remain local-execution-only."
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
          proofBuildScoped: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "BuildingHouseCoastalCottageLocalGeneratorValidationError") {
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
  const definition = asPlainObject(rawDefinition, "building house coastal cottage local generator");
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
    )
  });
}

function normalizeValidationMetadata(rawValidationMetadata) {
  const validationMetadata = asPlainObject(
    rawValidationMetadata,
    "validationMetadata"
  );
  return deepFreeze({
    phase1CoreModuleProofEnabled: normalizeBoolean(
      validationMetadata.phase1CoreModuleProofEnabled,
      "validationMetadata.phase1CoreModuleProofEnabled"
    ),
    phase2ShellAssemblyEnabled: normalizeBoolean(
      validationMetadata.phase2ShellAssemblyEnabled,
      "validationMetadata.phase2ShellAssemblyEnabled"
    ),
    phase3ProofAssetExpansionEnabled: normalizeBoolean(
      validationMetadata.phase3ProofAssetExpansionEnabled,
      "validationMetadata.phase3ProofAssetExpansionEnabled"
    ),
    outputMetadataWritingValidated: normalizeBoolean(
      validationMetadata.outputMetadataWritingValidated,
      "validationMetadata.outputMetadataWritingValidated"
    )
  });
}

function assertRequiredFields(definition) {
  for (const fieldName of buildingHouseCoastalCottageLocalGeneratorRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(definition, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Building house coastal cottage local generator is missing required field ${fieldName}.`
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
      `${fieldName} must reference a Python generator script.`
    );
  }
  return normalized;
}

function normalizeRelativePath(value, fieldName) {
  const normalized = normalizeNonEmptyString(value, fieldName);
  if (normalized.startsWith("/")) {
    throw createValidationError(
      "invalid_relative_path",
      `${fieldName} must remain repository-relative.`
    );
  }
  return normalized;
}

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_string_array",
      `${fieldName} must be a non-empty array.`
    );
  }
  return value.map((entry, index) =>
    normalizeNonEmptyString(entry, `${fieldName}[${index}]`)
  );
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createValidationError("invalid_boolean", `${fieldName} must be a boolean.`);
  }
  return value;
}

function normalizeNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw createValidationError("invalid_string", `${fieldName} must be a non-empty string.`);
  }
  return value.trim();
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError("invalid_object", `${fieldName} must be an object.`);
  }
  return value;
}

function createValidationError(code, message) {
  return Object.assign(new Error(message), {
    code,
    name: "BuildingHouseCoastalCottageLocalGeneratorValidationError"
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
