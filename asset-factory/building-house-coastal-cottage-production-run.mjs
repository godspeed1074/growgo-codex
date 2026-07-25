import fs from "node:fs";
import path from "node:path";
import {
  blenderRuntimeConfigurationDefinition,
  detectBlenderRuntime
} from "./blender-runtime-configuration.mjs";
import {
  buildingHouseCoastalCottageLocalGeneratorDefinition,
  validateBuildingHouseCoastalCottageLocalGenerator
} from "./building-house-coastal-cottage-local-generator.mjs";

export const buildingHouseCoastalCottageProductionRunDefinition = deepFreeze({
  assetId: "BUILDING_HOUSE_COASTAL_COTTAGE_001",
  recipeId: "RECIPE_HOUSE_COASTAL_COTTAGE_001",
  familyId: "FAMILY_HOUSE_COASTAL",
  phase1CoreModules: deepFreeze([
    "MOD_FOUNDATION_STANDARD_RECT_001",
    "MOD_WALL_WEATHERBOARD_WHITE_001",
    "MOD_WALL_CORNER_STANDARD_001",
    "MOD_WINDOW_RESIDENTIAL_STANDARD_001",
    "MOD_DOOR_STANDARD_RESIDENTIAL_001",
    "MOD_ROOF_GABLE_STANDARD_001"
  ]),
  phase2ShellOutput: "HOUSE_COASTAL_COTTAGE_SHELL_TEST",
  phase3ExpansionModules: deepFreeze([
    "MOD_CHIMNEY_COASTAL_SMALL_001",
    "MOD_TRIM_STANDARD_COASTAL_001",
    "MOD_VERANDAH_STANDARD_TIMBER_001",
    "MOD_PORCH_COASTAL_SMALL_001",
    "MOD_PATH_STANDARD_001",
    "MOD_DRIVEWAY_STANDARD_SINGLE_001",
    "MOD_FENCE_STANDARD_001",
    "MOD_GROUND_GRASS_STANDARD_001",
    "MOD_BUSH_NATIVE_STANDARD_001",
    "MOD_TREE_EUCALYPTUS_STANDARD_001",
    "MOD_FLOWERBED_STANDARD_001"
  ]),
  outputLocation:
    "asset-factory-workspace/production/HOUSE_COASTAL_FAMILY_001/export",
  expectedOutputs: deepFreeze({
    coreModules: deepFreeze([
      "MOD_FOUNDATION_STANDARD_RECT_001.glb",
      "MOD_WALL_WEATHERBOARD_WHITE_001.glb",
      "MOD_WALL_CORNER_STANDARD_001.glb",
      "MOD_WINDOW_RESIDENTIAL_STANDARD_001.glb",
      "MOD_DOOR_STANDARD_RESIDENTIAL_001.glb",
      "MOD_ROOF_GABLE_STANDARD_001.glb"
    ]),
    shell: "HOUSE_COASTAL_COTTAGE_SHELL_TEST.glb",
    proofAsset: deepFreeze([
      "BUILDING_HOUSE_COASTAL_COTTAGE_001_LOD_CLOSE.glb",
      "BUILDING_HOUSE_COASTAL_COTTAGE_001_LOD_GAMEPLAY.glb",
      "BUILDING_HOUSE_COASTAL_COTTAGE_001_LOD_MAP.glb"
    ]),
    metadataFiles: deepFreeze([
      "building-house-coastal-cottage-manifest.json",
      "building-house-coastal-cottage-metadata.json",
      "building-house-coastal-cottage-validation.json"
    ])
  })
});

export function buildBuildingHouseCoastalCottageProductionRun(
  rawDefinition = buildingHouseCoastalCottageProductionRunDefinition
) {
  return normalizeDefinition(rawDefinition);
}

export function validateBuildingHouseCoastalCottageProductionRun(
  rawDefinition = buildingHouseCoastalCottageProductionRunDefinition
) {
  try {
    const definition = normalizeDefinition(rawDefinition);
    const generatorResult = validateBuildingHouseCoastalCottageLocalGenerator(
      buildingHouseCoastalCottageLocalGeneratorDefinition
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
        "Production run output location must match the approved local generator output location."
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
          proofBuildScoped: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "BuildingHouseCoastalCottageProductionRunValidationError") {
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

export function inspectBuildingHouseCoastalCottageProductionOutputs(
  rawDefinition = buildingHouseCoastalCottageProductionRunDefinition,
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
    path.join(outputDirectory, "building-house-coastal-cottage-validation.json")
  );

  return Object.freeze({
    outputDirectory,
    blenderRuntime: detectResult,
    fileStates,
    validationMetadata: metadata,
    summary: Object.freeze({
      allExpectedFilesPresent: fileStates.every((state) => state.exists),
      phase1CoreModulesPresent: fileStates
        .filter((state) => state.phase === "phase1")
        .every((state) => state.exists),
      phase2ShellPresent: fileStates
        .filter((state) => state.phase === "phase2")
        .every((state) => state.exists),
      phase3ProofAssetPresent: fileStates
        .filter((state) => state.phase === "phase3")
        .every((state) => state.exists)
    })
  });
}

function collectExpectedFileStates(outputDirectory, definition) {
  const states = [];

  for (const filename of definition.expectedOutputs.coreModules) {
    states.push(freezeFileState("phase1", outputDirectory, filename));
  }

  states.push(freezeFileState("phase2", outputDirectory, definition.expectedOutputs.shell));

  for (const filename of definition.expectedOutputs.proofAsset) {
    states.push(freezeFileState("phase3", outputDirectory, filename));
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
  const definition = asPlainObject(rawDefinition, "building house coastal cottage production run");
  return deepFreeze({
    assetId: normalizeNonEmptyString(definition.assetId, "assetId"),
    recipeId: normalizeNonEmptyString(definition.recipeId, "recipeId"),
    familyId: normalizeNonEmptyString(definition.familyId, "familyId"),
    phase1CoreModules: deepFreeze(
      normalizeStringArray(definition.phase1CoreModules, "phase1CoreModules")
    ),
    phase2ShellOutput: normalizeNonEmptyString(
      definition.phase2ShellOutput,
      "phase2ShellOutput"
    ),
    phase3ExpansionModules: deepFreeze(
      normalizeStringArray(definition.phase3ExpansionModules, "phase3ExpansionModules")
    ),
    outputLocation: normalizeNonEmptyString(definition.outputLocation, "outputLocation"),
    expectedOutputs: normalizeExpectedOutputs(definition.expectedOutputs)
  });
}

function normalizeExpectedOutputs(rawExpectedOutputs) {
  const expectedOutputs = asPlainObject(rawExpectedOutputs, "expectedOutputs");
  return deepFreeze({
    coreModules: deepFreeze(
      normalizeStringArray(expectedOutputs.coreModules, "expectedOutputs.coreModules")
    ),
    shell: normalizeNonEmptyString(expectedOutputs.shell, "expectedOutputs.shell"),
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
    name: "BuildingHouseCoastalCottageProductionRunValidationError"
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
