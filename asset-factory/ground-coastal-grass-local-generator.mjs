import path from "node:path";
import {
  blenderRuntimeConfigurationDefinition,
  validateBlenderRuntimeConfiguration
} from "./blender-runtime-configuration.mjs";
import {
  coastalStarterPackBlenderLocalGenerationScriptFoundationDefinition,
  buildCoastalStarterPackBlenderLocalGenerationPythonScript,
  validateCoastalStarterPackBlenderLocalGenerationScriptFoundation
} from "./coastal-starter-pack-blender-local-generation-script-foundation.mjs";
import {
  groundCoastalGrassPrototypeAssetPackageDefinition,
  validateGroundCoastalGrassPrototypeAssetPackage
} from "./ground-coastal-grass-prototype-asset-package.mjs";

export const groundCoastalGrassLocalGeneratorRequiredFields = Object.freeze([
  "assetId",
  "scriptLocation",
  "expectedOutputLocation",
  "executionInstructions",
  "validationMetadata"
]);

export const groundCoastalGrassLocalGeneratorDefinition = deepFreeze({
  assetId: "GROUND_COASTAL_GRASS_001",
  scriptLocation:
    "asset-factory/local-blender-scripts/generate_ground_coastal_grass.py",
  expectedOutputLocation:
    "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export",
  executionInstructions: {
    blenderCommand:
      'blender --background --python asset-factory/local-blender-scripts/generate_ground_coastal_grass.py -- --output-dir asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export',
    commandArguments: [
      "--background",
      "--python",
      "asset-factory/local-blender-scripts/generate_ground_coastal_grass.py",
      "--",
      "--output-dir",
      "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export"
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

export function createGroundCoastalGrassLocalGenerator(
  rawDefinition = groundCoastalGrassLocalGeneratorDefinition
) {
  return normalizeGeneratorDefinition(rawDefinition);
}

export function buildGroundCoastalGrassLocalBlenderCommand(
  rawDefinition = groundCoastalGrassLocalGeneratorDefinition
) {
  const definition = normalizeGeneratorDefinition(rawDefinition);
  return definition.executionInstructions.blenderCommand;
}

export function validateGroundCoastalGrassLocalGenerator(
  rawDefinition = groundCoastalGrassLocalGeneratorDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const definition = normalizeGeneratorDefinition(rawDefinition);

    const runtimeResult = normalizedOptions.validateBlenderRuntimeConfiguration(
      normalizedOptions.runtimeConfigurationDefinition
    );
    if (!runtimeResult.ok) {
      return freezeFailure(runtimeResult);
    }

    const scriptFoundationResult =
      normalizedOptions.validateCoastalStarterPackBlenderLocalGenerationScriptFoundation(
        normalizedOptions.scriptFoundationDefinition,
        {
          runtimeConfigurationDefinition:
            normalizedOptions.runtimeConfigurationDefinition,
          assetPackageDefinition: normalizedOptions.assetPackageDefinition
        }
      );
    if (!scriptFoundationResult.ok) {
      return freezeFailure(scriptFoundationResult);
    }

    const assetPackageResult =
      normalizedOptions.validateGroundCoastalGrassPrototypeAssetPackage(
        normalizedOptions.assetPackageDefinition
      );
    if (!assetPackageResult.ok) {
      return freezeFailure(assetPackageResult);
    }

    const generatedScript =
      normalizedOptions.buildCoastalStarterPackBlenderLocalGenerationPythonScript(
        normalizedOptions.scriptFoundationDefinition,
        {
          runtimeConfiguration:
            runtimeResult.runtimeConfiguration.configuration
        }
      );

    validateCompatibility(
      definition,
      runtimeResult.runtimeConfiguration.configuration,
      scriptFoundationResult.localGenerationScriptFoundation.foundation,
      assetPackageResult.prototypeAssetPackage.package,
      generatedScript
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      localGenerator: Object.freeze({
        definition,
        generatedScript,
        compatibility: Object.freeze({
          runtimeConfigurationVerified: true,
          scriptFoundationVerified: true,
          assetPackageVerified: true,
          localExecutionOnly: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "GroundCoastalGrassLocalGeneratorValidationError") {
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

function normalizeOptions(options) {
  return Object.freeze({
    runtimeConfigurationDefinition:
      options.runtimeConfigurationDefinition ??
      blenderRuntimeConfigurationDefinition,
    scriptFoundationDefinition:
      options.scriptFoundationDefinition ??
      coastalStarterPackBlenderLocalGenerationScriptFoundationDefinition,
    assetPackageDefinition:
      options.assetPackageDefinition ?? groundCoastalGrassPrototypeAssetPackageDefinition,
    validateBlenderRuntimeConfiguration:
      typeof options.validateBlenderRuntimeConfiguration === "function"
        ? options.validateBlenderRuntimeConfiguration
        : validateBlenderRuntimeConfiguration,
    validateCoastalStarterPackBlenderLocalGenerationScriptFoundation:
      typeof options.validateCoastalStarterPackBlenderLocalGenerationScriptFoundation ===
      "function"
        ? options.validateCoastalStarterPackBlenderLocalGenerationScriptFoundation
        : validateCoastalStarterPackBlenderLocalGenerationScriptFoundation,
    validateGroundCoastalGrassPrototypeAssetPackage:
      typeof options.validateGroundCoastalGrassPrototypeAssetPackage === "function"
        ? options.validateGroundCoastalGrassPrototypeAssetPackage
        : validateGroundCoastalGrassPrototypeAssetPackage,
    buildCoastalStarterPackBlenderLocalGenerationPythonScript:
      typeof options.buildCoastalStarterPackBlenderLocalGenerationPythonScript ===
      "function"
        ? options.buildCoastalStarterPackBlenderLocalGenerationPythonScript
        : buildCoastalStarterPackBlenderLocalGenerationPythonScript
  });
}

function validateCompatibility(
  definition,
  runtimeConfiguration,
  scriptFoundation,
  assetPackage,
  generatedScript
) {
  if (definition.assetId !== scriptFoundation.assetId) {
    throw createValidationError(
      "asset_id_mismatch",
      "Local generator assetId must match the approved local Blender script foundation."
    );
  }

  if (
    definition.expectedOutputLocation !== assetPackage.exportMetadata.assetPackageLocation
  ) {
    throw createValidationError(
      "output_location_mismatch",
      "Local generator expected output location must match the prototype asset package export location."
    );
  }

  const expectedScriptPath = path.join(
    "asset-factory",
    "local-blender-scripts",
    scriptFoundation.scriptTemplate.pythonFilename
  );
  if (definition.scriptLocation !== expectedScriptPath) {
    throw createValidationError(
      "script_location_mismatch",
      "Local generator script location must match the script foundation Python filename."
    );
  }

  if (
    !definition.executionInstructions.blenderCommand.startsWith(
      `${runtimeConfiguration.executable.executableName} `
    )
  ) {
    throw createValidationError(
      "command_mismatch",
      "Local generator Blender command must start with the configured Blender executable."
    );
  }

  if (
    !definition.executionInstructions.blenderCommand.includes(definition.scriptLocation) ||
    !definition.executionInstructions.blenderCommand.includes(
      definition.expectedOutputLocation
    )
  ) {
    throw createValidationError(
      "command_mismatch",
      "Local generator Blender command must include the script location and expected output directory."
    );
  }

  if (!definition.executionInstructions.localExecutionOnly) {
    throw createValidationError(
      "invalid_execution_target",
      "Local generator must remain local-execution-only."
    );
  }

  if (
    !generatedScript.includes("def generate_asset_package(") ||
    !generatedScript.includes("def export_asset_package(")
  ) {
    throw createValidationError(
      "script_generation_mismatch",
      "Generated Python template must preserve generation and export entry points."
    );
  }
}

function normalizeGeneratorDefinition(rawDefinition) {
  const definition = asPlainObject(
    rawDefinition,
    "ground coastal grass local generator"
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
  for (const fieldName of groundCoastalGrassLocalGeneratorRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(definition, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Ground coastal grass local generator is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizePermanentId(rawValue, fieldName) {
  const value = normalizeNonEmptyString(rawValue, fieldName);
  if (!permanentIdPattern.test(value)) {
    throw createValidationError(
      "invalid_permanent_id",
      `Field ${fieldName} must be a permanent uppercase Asset Factory identifier.`
    );
  }

  return value;
}

function normalizeRelativePythonPath(rawValue, fieldName) {
  const value = normalizeNonEmptyString(rawValue, fieldName);
  if (
    path.isAbsolute(value) ||
    !value.startsWith("asset-factory/") ||
    !value.endsWith(".py")
  ) {
    throw createValidationError(
      "invalid_script_location",
      `Field ${fieldName} must be a repo-relative Python script path under asset-factory/.`
    );
  }

  return value;
}

function normalizeRelativePath(rawValue, fieldName) {
  const value = normalizeNonEmptyString(rawValue, fieldName);
  if (path.isAbsolute(value)) {
    throw createValidationError(
      "invalid_relative_path",
      `Field ${fieldName} must be a repo-relative path.`
    );
  }

  return value;
}

function normalizeStringArray(rawValue, fieldName) {
  if (!Array.isArray(rawValue) || rawValue.length === 0) {
    throw createValidationError(
      "invalid_string_array",
      `Field ${fieldName} must be a non-empty array of strings.`
    );
  }

  return rawValue.map((value, index) =>
    normalizeNonEmptyString(value, `${fieldName}[${index}]`)
  );
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createValidationError(
      "invalid_boolean",
      `Field ${fieldName} must be a boolean.`
    );
  }

  return value;
}

function normalizeNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createValidationError(
      "invalid_string",
      `Field ${fieldName} must be a non-empty string.`
    );
  }

  return value.trim();
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_object",
      `${label} must be provided as a plain object.`
    );
  }

  return value;
}

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode,
    message: result.message,
    localGenerator: null
  });
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "GroundCoastalGrassLocalGeneratorValidationError";
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
