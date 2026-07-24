import path from "node:path";
import { buildingCoastalCottagePrototypeAssetPackageDefinition } from "./building-coastal-cottage-prototype-asset-package.mjs";

export const buildingCoastalCottageLocalGeneratorRequiredFields = Object.freeze([
  "assetId",
  "scriptLocation",
  "expectedOutputLocation",
  "executionInstructions",
  "validationMetadata"
]);

export const buildingCoastalCottageLocalGeneratorDefinition = deepFreeze({
  assetId: "BUILDING_COASTAL_COTTAGE_001",
  scriptLocation:
    "asset-factory/local-blender-scripts/generate_building_coastal_cottage.py",
  expectedOutputLocation:
    "asset-factory-workspace/production/COASTAL_RESIDENTIAL_FAMILY_001/export",
  executionInstructions: {
    blenderCommand:
      "blender --background --python asset-factory/local-blender-scripts/generate_building_coastal_cottage.py -- --output-dir asset-factory-workspace/production/COASTAL_RESIDENTIAL_FAMILY_001/export",
    commandArguments: [
      "--background",
      "--python",
      "asset-factory/local-blender-scripts/generate_building_coastal_cottage.py",
      "--",
      "--output-dir",
      "asset-factory-workspace/production/COASTAL_RESIDENTIAL_FAMILY_001/export"
    ],
    localExecutionOnly: true
  },
  validationMetadata: {
    scriptContractValidated: true,
    collectionsValidated: true,
    geometryGenerationValidated: true,
    materialGenerationValidated: true,
    lodGenerationValidated: true,
    exportPreparationValidated: true,
    assetMetadataWritingValidated: true
  }
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export function createBuildingCoastalCottageLocalGenerator(
  rawDefinition = buildingCoastalCottageLocalGeneratorDefinition
) {
  return normalizeGeneratorDefinition(rawDefinition);
}

export function buildBuildingCoastalCottageLocalBlenderCommand(
  rawDefinition = buildingCoastalCottageLocalGeneratorDefinition
) {
  const definition = normalizeGeneratorDefinition(rawDefinition);
  return definition.executionInstructions.blenderCommand;
}

export function validateBuildingCoastalCottageLocalGenerator(
  rawDefinition = buildingCoastalCottageLocalGeneratorDefinition,
  options = {}
) {
  try {
    const definition = normalizeGeneratorDefinition(rawDefinition);
    const assetPackage =
      options.assetPackageDefinition ??
      buildingCoastalCottagePrototypeAssetPackageDefinition;

    validateCompatibility(definition, assetPackage);

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      localGenerator: Object.freeze({
        definition,
        compatibility: Object.freeze({
          assetPackageVerified: true,
          localExecutionOnly: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "BuildingCoastalCottageLocalGeneratorValidationError") {
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

function validateCompatibility(definition, assetPackage) {
  if (definition.assetId !== assetPackage.assetId) {
    throw createValidationError(
      "asset_id_mismatch",
      "Building coastal cottage local generator assetId must match the prototype asset package."
    );
  }

  if (
    definition.expectedOutputLocation !==
    assetPackage.exportMetadata.assetPackageLocation
  ) {
    throw createValidationError(
      "output_location_mismatch",
      "Building coastal cottage local generator output location must match the prototype asset package export location."
    );
  }

  const expectedScriptPath = path.join(
    "asset-factory",
    "local-blender-scripts",
    "generate_building_coastal_cottage.py"
  );
  if (definition.scriptLocation !== expectedScriptPath) {
    throw createValidationError(
      "script_location_mismatch",
      "Building coastal cottage local generator script location must match the approved Python script."
    );
  }

  if (!definition.executionInstructions.blenderCommand.startsWith("blender ")) {
    throw createValidationError(
      "command_mismatch",
      "Building coastal cottage local generator command must start with the Blender executable."
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
      "Building coastal cottage local generator command must include the script location and output directory."
    );
  }

  if (!definition.executionInstructions.localExecutionOnly) {
    throw createValidationError(
      "invalid_execution_target",
      "Building coastal cottage local generator must remain local-execution-only."
    );
  }
}

function normalizeGeneratorDefinition(rawDefinition) {
  const definition = asPlainObject(
    rawDefinition,
    "building coastal cottage local generator"
  );
  assertRequiredFields(definition);

  return deepFreeze({
    assetId: normalizePermanentId(definition.assetId, "assetId"),
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
    scriptContractValidated: normalizeBoolean(
      validationMetadata.scriptContractValidated,
      "validationMetadata.scriptContractValidated"
    ),
    collectionsValidated: normalizeBoolean(
      validationMetadata.collectionsValidated,
      "validationMetadata.collectionsValidated"
    ),
    geometryGenerationValidated: normalizeBoolean(
      validationMetadata.geometryGenerationValidated,
      "validationMetadata.geometryGenerationValidated"
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
    assetMetadataWritingValidated: normalizeBoolean(
      validationMetadata.assetMetadataWritingValidated,
      "validationMetadata.assetMetadataWritingValidated"
    )
  });
}

function assertRequiredFields(definition) {
  for (const fieldName of buildingCoastalCottageLocalGeneratorRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(definition, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Building coastal cottage local generator is missing required field ${fieldName}.`
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
    name: "BuildingCoastalCottageLocalGeneratorValidationError"
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
