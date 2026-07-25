import fs from "node:fs";
import path from "node:path";
import {
  blenderRuntimeConfigurationDefinition,
  detectBlenderRuntime
} from "./blender-runtime-configuration.mjs";
import {
  buildingHouseBeachBungalowLocalGeneratorDefinition,
  validateBuildingHouseBeachBungalowLocalGenerator
} from "./building-house-beach-bungalow-local-generator.mjs";

export const buildingHouseBeachBungalowProductionRunDefinition = deepFreeze({
  assetId: "BUILDING_HOUSE_BEACH_BUNGALOW_001",
  recipeId: "RECIPE_HOUSE_BEACH_BUNGALOW_001",
  familyId: "FAMILY_HOUSE_COASTAL",
  reusedModules: deepFreeze([
    "MOD_PATH_STANDARD_001",
    "MOD_FENCE_STANDARD_001",
    "MOD_GROUND_GRASS_STANDARD_001",
    "MOD_BUSH_NATIVE_STANDARD_001",
    "MOD_TREE_EUCALYPTUS_STANDARD_001",
    "MOD_DRIVEWAY_STANDARD_SINGLE_001",
    "MOD_FLOWERBED_STANDARD_001",
    "MOD_ROOF_GABLE_STANDARD_001",
    "MOD_WALL_WEATHERBOARD_WHITE_001",
    "MOD_WINDOW_RESIDENTIAL_STANDARD_001",
    "MOD_DOOR_STANDARD_RESIDENTIAL_001"
  ]),
  newModulesUsed: deepFreeze([
    "MOD_FOUNDATION_RAISED_COASTAL_001",
    "MOD_WINDOW_RESIDENTIAL_LARGE_001",
    "MOD_DECK_TIMBER_COASTAL_001"
  ]),
  targetReusePercentage: 79,
  outputLocation:
    "asset-factory-workspace/production/HOUSE_BEACH_BUNGALOW_FAMILY_001/export",
  expectedOutputs: deepFreeze({
    proofAsset: deepFreeze([
      "BUILDING_HOUSE_BEACH_BUNGALOW_001_LOD_CLOSE.glb",
      "BUILDING_HOUSE_BEACH_BUNGALOW_001_LOD_GAMEPLAY.glb",
      "BUILDING_HOUSE_BEACH_BUNGALOW_001_LOD_MAP.glb"
    ]),
    metadataFiles: deepFreeze([
      "building-house-beach-bungalow-manifest.json",
      "building-house-beach-bungalow-metadata.json",
      "building-house-beach-bungalow-validation.json",
      "BUILDING_HOUSE_BEACH_BUNGALOW_001_ASSEMBLY_TEST_v001.blend"
    ])
  })
});

export function buildBuildingHouseBeachBungalowProductionRun(
  rawDefinition = buildingHouseBeachBungalowProductionRunDefinition
) {
  return normalizeDefinition(rawDefinition);
}

export function validateBuildingHouseBeachBungalowProductionRun(
  rawDefinition = buildingHouseBeachBungalowProductionRunDefinition
) {
  try {
    const definition = normalizeDefinition(rawDefinition);
    const generatorResult = validateBuildingHouseBeachBungalowLocalGenerator(
      buildingHouseBeachBungalowLocalGeneratorDefinition
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
        "Building house beach bungalow output location must match the approved local generator output location."
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
          recipeAssemblyScoped: true,
          duplicateModulesAvoided: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "BuildingHouseBeachBungalowProductionRunValidationError") {
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

export function inspectBuildingHouseBeachBungalowProductionOutputs(
  rawDefinition = buildingHouseBeachBungalowProductionRunDefinition,
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
  const metadata = readJsonIfPresent(
    path.join(outputDirectory, "building-house-beach-bungalow-validation.json")
  );

  return Object.freeze({
    outputDirectory,
    blenderRuntime: detectResult,
    fileStates,
    validationMetadata: metadata,
    summary: Object.freeze({
      allExpectedFilesPresent: fileStates.every((state) => state.exists),
      proofAssetsPresent: fileStates
        .filter((state) => state.phase === "proof-asset")
        .every((state) => state.exists),
      metadataFilesPresent: fileStates
        .filter((state) => state.phase === "metadata")
        .every((state) => state.exists)
    })
  });
}

function collectExpectedFileStates(outputDirectory, definition) {
  const states = [];

  for (const filename of definition.expectedOutputs.proofAsset) {
    states.push(
      Object.freeze({
        phase: "proof-asset",
        filename,
        exists: fs.existsSync(path.join(outputDirectory, filename))
      })
    );
  }

  for (const filename of definition.expectedOutputs.metadataFiles) {
    states.push(
      Object.freeze({
        phase: "metadata",
        filename,
        exists: fs.existsSync(path.join(outputDirectory, filename))
      })
    );
  }

  return Object.freeze(states);
}

function readJsonIfPresent(filename) {
  if (!fs.existsSync(filename)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function normalizeDefinition(rawDefinition) {
  const definition = asPlainObject(
    rawDefinition,
    "building house beach bungalow production run"
  );

  return deepFreeze({
    assetId: normalizeNonEmptyString(definition.assetId, "assetId"),
    recipeId: normalizeNonEmptyString(definition.recipeId, "recipeId"),
    familyId: normalizeNonEmptyString(definition.familyId, "familyId"),
    reusedModules: deepFreeze(
      normalizeStringArray(definition.reusedModules, "reusedModules")
    ),
    newModulesUsed: deepFreeze(
      normalizeStringArray(definition.newModulesUsed, "newModulesUsed")
    ),
    targetReusePercentage: normalizePercentage(
      definition.targetReusePercentage,
      "targetReusePercentage"
    ),
    outputLocation: normalizeRelativePath(definition.outputLocation, "outputLocation"),
    expectedOutputs: normalizeExpectedOutputs(definition.expectedOutputs)
  });
}

function normalizeExpectedOutputs(rawExpectedOutputs) {
  const expectedOutputs = asPlainObject(rawExpectedOutputs, "expectedOutputs");
  return deepFreeze({
    proofAsset: deepFreeze(
      normalizeStringArray(expectedOutputs.proofAsset, "expectedOutputs.proofAsset")
    ),
    metadataFiles: deepFreeze(
      normalizeStringArray(
        expectedOutputs.metadataFiles,
        "expectedOutputs.metadataFiles"
      )
    )
  });
}

function normalizePercentage(value, fieldName) {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw createValidationError(
      "invalid_percentage",
      `${fieldName} must be an integer percentage between 0 and 100.`
    );
  }
  return value;
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
  error.name = "BuildingHouseBeachBungalowProductionRunValidationError";
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
