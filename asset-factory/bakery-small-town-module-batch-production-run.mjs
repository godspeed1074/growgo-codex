import fs from "node:fs";
import path from "node:path";
import {
  blenderRuntimeConfigurationDefinition,
  detectBlenderRuntime
} from "./blender-runtime-configuration.mjs";
import {
  bakerySmallTownModuleBatchLocalGeneratorDefinition,
  validateBakerySmallTownModuleBatchLocalGenerator
} from "./bakery-small-town-module-batch-local-generator.mjs";

export const bakerySmallTownModuleBatchProductionRunDefinition = deepFreeze({
  batchId: "BAKERY_SMALL_TOWN_MODULE_BATCH_001",
  moduleIds: deepFreeze([
    "MOD_BAKERY_DISPLAY_WINDOW_001",
    "MOD_BAKERY_SIGN_STANDARD_001",
    "MOD_BAKERY_COUNTER_FRONTAGE_001",
    "MOD_BAKERY_ROOFTOP_ICON_001"
  ]),
  outputLocation:
    "asset-factory-workspace/production/BAKERY_SMALL_TOWN_MODULE_BATCH_001/export",
  expectedOutputs: deepFreeze({
    moduleExports: deepFreeze([
      "MOD_BAKERY_DISPLAY_WINDOW_001_LOD_CLOSE.glb",
      "MOD_BAKERY_DISPLAY_WINDOW_001_LOD_GAMEPLAY.glb",
      "MOD_BAKERY_DISPLAY_WINDOW_001_LOD_MAP.glb",
      "MOD_BAKERY_SIGN_STANDARD_001_LOD_CLOSE.glb",
      "MOD_BAKERY_SIGN_STANDARD_001_LOD_GAMEPLAY.glb",
      "MOD_BAKERY_SIGN_STANDARD_001_LOD_MAP.glb",
      "MOD_BAKERY_COUNTER_FRONTAGE_001_LOD_CLOSE.glb",
      "MOD_BAKERY_COUNTER_FRONTAGE_001_LOD_GAMEPLAY.glb",
      "MOD_BAKERY_COUNTER_FRONTAGE_001_LOD_MAP.glb",
      "MOD_BAKERY_ROOFTOP_ICON_001_LOD_CLOSE.glb",
      "MOD_BAKERY_ROOFTOP_ICON_001_LOD_GAMEPLAY.glb",
      "MOD_BAKERY_ROOFTOP_ICON_001_LOD_MAP.glb"
    ]),
    metadataFiles: deepFreeze([
      "bakery-small-town-module-batch-1-manifest.json",
      "bakery-small-town-module-batch-1-validation.json",
      "bakery-small-town-module-batch-1-registration.json",
      "mod-bakery-display-window-001-metadata.json",
      "mod-bakery-display-window-001-validation.json",
      "mod-bakery-sign-standard-001-metadata.json",
      "mod-bakery-sign-standard-001-validation.json",
      "mod-bakery-counter-frontage-001-metadata.json",
      "mod-bakery-counter-frontage-001-validation.json",
      "mod-bakery-rooftop-icon-001-metadata.json",
      "mod-bakery-rooftop-icon-001-validation.json"
    ])
  })
});

export function buildBakerySmallTownModuleBatchProductionRun(
  rawDefinition = bakerySmallTownModuleBatchProductionRunDefinition
) {
  return normalizeDefinition(rawDefinition);
}

export function validateBakerySmallTownModuleBatchProductionRun(
  rawDefinition = bakerySmallTownModuleBatchProductionRunDefinition
) {
  try {
    const definition = normalizeDefinition(rawDefinition);
    const generatorResult = validateBakerySmallTownModuleBatchLocalGenerator(
      bakerySmallTownModuleBatchLocalGeneratorDefinition
    );
    if (!generatorResult.ok) {
      return generatorResult;
    }

    if (
      definition.outputLocation !==
      generatorResult.localGenerator.definition.expectedOutputLocation
    ) {
      throw createValidationError(
        "output_location_mismatch",
        "Bakery small town module batch output location must match the approved local generator output location."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      productionRun: Object.freeze({
        definition,
        compatibility: Object.freeze({
          generatorValidated: true,
          batchScoped: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "BakerySmallTownModuleBatchProductionRunValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      productionRun: null
    });
  }
}

export function inspectBakerySmallTownModuleBatchOutputs(
  rawDefinition = bakerySmallTownModuleBatchProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);

  const detectResult = detectBlenderRuntime(
    options.runtimeConfiguration ?? blenderRuntimeConfigurationDefinition,
    options.runtimeDetectionOptions ?? {}
  );

  const fileStates = collectExpectedFileStates(outputDirectory, definition);
  const validationMetadata = readJsonIfPresent(
    path.join(outputDirectory, "bakery-small-town-module-batch-1-validation.json")
  );
  const registration = readJsonIfPresent(
    path.join(outputDirectory, "bakery-small-town-module-batch-1-registration.json")
  );

  return Object.freeze({
    outputDirectory,
    blenderRuntime: detectResult,
    fileStates,
    validationMetadata,
    registration,
    summary: Object.freeze({
      allExpectedFilesPresent: fileStates.every((state) => state.exists),
      moduleExportsPresent: fileStates
        .filter((state) => state.phase === "module-export")
        .every((state) => state.exists),
      metadataFilesPresent: fileStates
        .filter((state) => state.phase === "metadata")
        .every((state) => state.exists)
    })
  });
}

function collectExpectedFileStates(outputDirectory, definition) {
  const states = [];

  for (const filename of definition.expectedOutputs.moduleExports) {
    states.push(freezeFileState("module-export", outputDirectory, filename));
  }

  for (const filename of definition.expectedOutputs.metadataFiles) {
    states.push(freezeFileState("metadata", outputDirectory, filename));
  }

  return Object.freeze(states);
}

function freezeFileState(phase, outputDirectory, filename) {
  const absolutePath = path.join(outputDirectory, filename);
  return Object.freeze({
    phase,
    filename,
    absolutePath,
    exists: fs.existsSync(absolutePath)
  });
}

function readJsonIfPresent(absolutePath) {
  if (!fs.existsSync(absolutePath)) {
    return null;
  }
  return Object.freeze(JSON.parse(fs.readFileSync(absolutePath, "utf8")));
}

function normalizeDefinition(rawDefinition) {
  const definition = asPlainObject(
    rawDefinition,
    "bakery small town module batch production run"
  );
  return deepFreeze({
    batchId: normalizeNonEmptyString(definition.batchId, "batchId"),
    moduleIds: deepFreeze(normalizeStringArray(definition.moduleIds, "moduleIds")),
    outputLocation: normalizeNonEmptyString(
      definition.outputLocation,
      "outputLocation"
    ),
    expectedOutputs: normalizeExpectedOutputs(definition.expectedOutputs)
  });
}

function normalizeExpectedOutputs(rawExpectedOutputs) {
  const expectedOutputs = asPlainObject(rawExpectedOutputs, "expectedOutputs");
  return deepFreeze({
    moduleExports: deepFreeze(
      normalizeStringArray(
        expectedOutputs.moduleExports,
        "expectedOutputs.moduleExports"
      )
    ),
    metadataFiles: deepFreeze(
      normalizeStringArray(
        expectedOutputs.metadataFiles,
        "expectedOutputs.metadataFiles"
      )
    )
  });
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
    name: "BakerySmallTownModuleBatchProductionRunValidationError"
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
