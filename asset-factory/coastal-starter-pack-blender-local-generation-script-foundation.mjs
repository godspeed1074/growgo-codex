import {
  blenderRuntimeConfigurationDefinition,
  validateBlenderRuntimeConfiguration
} from "./blender-runtime-configuration.mjs";
import {
  coastalStarterPackBlenderGenerationPipeline001Definition,
  validateCoastalStarterPackBlenderGenerationPipeline001
} from "./coastal-starter-pack-blender-generation-pipeline-001.mjs";
import {
  groundCoastalGrassPrototypeAssetPackageDefinition,
  validateGroundCoastalGrassPrototypeAssetPackage
} from "./ground-coastal-grass-prototype-asset-package.mjs";

export const coastalStarterPackBlenderLocalGenerationScriptFoundationRequiredFields =
  Object.freeze([
    "assetId",
    "executionTarget",
    "assetMetadataInput",
    "sceneHelpers",
    "geometryHelpers",
    "materialHelpers",
    "lodHelpers",
    "exportHelpers",
    "metadataManifestHelpers",
    "scriptTemplate"
  ]);

export const coastalStarterPackBlenderLocalGenerationScriptFoundationDefinition =
  deepFreeze({
    assetId: "GROUND_COASTAL_GRASS_001",
    executionTarget: {
      runtimeProfile: "local-blender-python",
      intendedExecutionHost: "developer-machine",
      localBlenderExecutionRequired: true,
      codexExecutionAllowed: false
    },
    assetMetadataInput: {
      generationJobId: "COASTAL_STARTER_GENERATION_JOB_001",
      assetFamilyId: "COASTAL_GROUND_FAMILY_001",
      recipeReference: "GROUND_COASTAL_GRASS_RECIPE_001",
      exportRoot: "GROUND_COASTAL_GRASS_001_EXPORT",
      manifestVersion: "1.0.0"
    },
    sceneHelpers: {
      rootCollection: "GROUND_COASTAL_GRASS_001",
      collections: [
        "GEOMETRY",
        "MATERIALS",
        "LOD0",
        "LOD1",
        "LOD2",
        "LOD3",
        "EXPORT"
      ]
    },
    geometryHelpers: {
      generationMode: "procedural-ground-cover",
      helperFunctions: [
        "ensure_scene_collections",
        "build_coastal_grass_geometry",
        "assign_geometry_to_lod_collection"
      ]
    },
    materialHelpers: {
      sharedMaterialProfile: "coastal-shared-materials",
      helperFunctions: [
        "build_coastal_ground_materials",
        "assign_material_to_objects"
      ]
    },
    lodHelpers: {
      lodKeys: ["close", "gameplay", "map", "distantSilhouette"],
      helperFunctions: [
        "build_lod_variants",
        "copy_objects_to_lod_collections"
      ]
    },
    exportHelpers: {
      exportFormat: "glb",
      helperFunctions: [
        "prepare_export_collection",
        "export_lod_glb_files"
      ],
      lodOutputs: {
        close: "GROUND_COASTAL_GRASS_001_LOD_CLOSE.glb",
        gameplay: "GROUND_COASTAL_GRASS_001_LOD_GAMEPLAY.glb",
        map: "GROUND_COASTAL_GRASS_001_LOD_MAP.glb",
        distantSilhouette: "GROUND_COASTAL_GRASS_001_LOD_DISTANT_SILHOUETTE.glb"
      }
    },
    metadataManifestHelpers: {
      helperFunctions: [
        "write_asset_metadata_json",
        "write_asset_manifest_json",
        "write_validation_metadata_json"
      ],
      manifestFilename: "ground-coastal-grass-manifest.json",
      metadataFilename: "ground-coastal-grass-metadata.json",
      validationFilename: "ground-coastal-grass-validation.json"
    },
    scriptTemplate: {
      templateId: "COASTAL_STARTER_BLENDER_LOCAL_SCRIPT_001",
      pythonFilename: "generate_ground_coastal_grass.py",
      generationEntryPoint: "generate_asset_package",
      exportEntryPoint: "export_asset_package"
    }
  });

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const versionPattern = /^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){0,2}$/;
const supportedCollections = Object.freeze([
  "GEOMETRY",
  "MATERIALS",
  "LOD0",
  "LOD1",
  "LOD2",
  "LOD3",
  "EXPORT"
]);
const supportedLodKeys = Object.freeze([
  "close",
  "gameplay",
  "map",
  "distantSilhouette"
]);

export function createCoastalStarterPackBlenderLocalGenerationScriptFoundation(
  rawDefinition = coastalStarterPackBlenderLocalGenerationScriptFoundationDefinition
) {
  return normalizeFoundation(rawDefinition);
}

export function buildCoastalStarterPackBlenderLocalGenerationPythonScript(
  rawDefinition = coastalStarterPackBlenderLocalGenerationScriptFoundationDefinition,
  options = {}
) {
  const foundation = normalizeFoundation(rawDefinition);
  const runtimeConfiguration = options.runtimeConfiguration
    ? normalizeRuntimeConfigurationForScript(options.runtimeConfiguration)
    : null;

  return buildPythonScript(foundation, runtimeConfiguration);
}

export function validateCoastalStarterPackBlenderLocalGenerationScriptFoundation(
  rawDefinition = coastalStarterPackBlenderLocalGenerationScriptFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeFoundation(rawDefinition);

    const runtimeResult = normalizedOptions.validateBlenderRuntimeConfiguration(
      normalizedOptions.runtimeConfigurationDefinition
    );
    if (!runtimeResult.ok) {
      return freezeFailure(runtimeResult);
    }

    const pipelineResult =
      normalizedOptions.validateCoastalStarterPackBlenderGenerationPipeline001(
        normalizedOptions.pipelineDefinition
      );
    if (!pipelineResult.ok) {
      return freezeFailure(pipelineResult);
    }

    const packageResult =
      normalizedOptions.validateGroundCoastalGrassPrototypeAssetPackage(
        normalizedOptions.assetPackageDefinition,
        { pipelineDefinition: normalizedOptions.pipelineDefinition }
      );
    if (!packageResult.ok) {
      return freezeFailure(packageResult);
    }

    validateFoundationCompatibility(
      foundation,
      runtimeResult.runtimeConfiguration.configuration,
      pipelineResult.generationPipeline.contract,
      packageResult.prototypeAssetPackage.package
    );

    const pythonScript = buildPythonScript(
      foundation,
      runtimeResult.runtimeConfiguration.configuration
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      localGenerationScriptFoundation: Object.freeze({
        foundation,
        pythonScript,
        compatibility: Object.freeze({
          runtimeConfigurationVerified: true,
          pipelineConfigurationVerified: true,
          prototypeAssetPackageVerified: true,
          localOnlyExecutionVerified: true
        })
      })
    });
  } catch (error) {
    if (
      error?.name !==
      "CoastalStarterPackBlenderLocalGenerationScriptFoundationValidationError"
    ) {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      localGenerationScriptFoundation: null
    });
  }
}

function normalizeOptions(options) {
  return Object.freeze({
    runtimeConfigurationDefinition:
      options.runtimeConfigurationDefinition ??
      blenderRuntimeConfigurationDefinition,
    pipelineDefinition:
      options.pipelineDefinition ??
      coastalStarterPackBlenderGenerationPipeline001Definition,
    assetPackageDefinition:
      options.assetPackageDefinition ?? groundCoastalGrassPrototypeAssetPackageDefinition,
    validateBlenderRuntimeConfiguration:
      typeof options.validateBlenderRuntimeConfiguration === "function"
        ? options.validateBlenderRuntimeConfiguration
        : validateBlenderRuntimeConfiguration,
    validateCoastalStarterPackBlenderGenerationPipeline001:
      typeof options.validateCoastalStarterPackBlenderGenerationPipeline001 ===
      "function"
        ? options.validateCoastalStarterPackBlenderGenerationPipeline001
        : validateCoastalStarterPackBlenderGenerationPipeline001,
    validateGroundCoastalGrassPrototypeAssetPackage:
      typeof options.validateGroundCoastalGrassPrototypeAssetPackage === "function"
        ? options.validateGroundCoastalGrassPrototypeAssetPackage
        : validateGroundCoastalGrassPrototypeAssetPackage
  });
}

function validateFoundationCompatibility(
  foundation,
  runtimeConfiguration,
  pipelineContract,
  prototypeAssetPackage
) {
  if (
    foundation.assetId !== pipelineContract.assetId ||
    foundation.assetId !== prototypeAssetPackage.assetId
  ) {
    throw createValidationError(
      "asset_id_mismatch",
      "Local Blender script foundation assetId must match the approved pipeline and prototype asset package."
    );
  }

  if (
    foundation.sceneHelpers.collections.length !==
      pipelineContract.sceneTemplate.collectionNames.length ||
    foundation.sceneHelpers.collections.some(
      (collectionName, index) =>
        collectionName !== pipelineContract.sceneTemplate.collectionNames[index]
    )
  ) {
    throw createValidationError(
      "scene_contract_mismatch",
      "Local Blender script foundation collections must match the approved Blender scene template."
    );
  }

  if (
    foundation.exportHelpers.exportFormat !== runtimeConfiguration.exportConfiguration.format ||
    foundation.exportHelpers.exportFormat !== prototypeAssetPackage.exportMetadata.format
  ) {
    throw createValidationError(
      "export_format_mismatch",
      "Local Blender script foundation export format must preserve the approved GLB export configuration."
    );
  }

  for (const lodKey of supportedLodKeys) {
    if (
      foundation.exportHelpers.lodOutputs[lodKey] !==
      prototypeAssetPackage.lodRequirements[lodKey].output
    ) {
      throw createValidationError(
        "lod_output_mismatch",
        `Local Blender script foundation output for ${lodKey} must match the prototype asset package export output.`
      );
    }
  }

  if (!foundation.executionTarget.localBlenderExecutionRequired) {
    throw createValidationError(
      "invalid_execution_target",
      "Local Blender script foundation must require local Blender execution on the developer machine."
    );
  }

  if (foundation.executionTarget.codexExecutionAllowed) {
    throw createValidationError(
      "invalid_execution_target",
      "Local Blender script foundation must remain unavailable for Codex-side Blender execution."
    );
  }
}

function buildPythonScript(foundation, runtimeConfiguration = null) {
  const scriptConfiguration = runtimeConfiguration ?? {
    executable: { executableName: "blender" },
    exportConfiguration: { format: foundation.exportHelpers.exportFormat }
  };
  const metadataJson = JSON.stringify(
    {
      assetId: foundation.assetId,
      executionTarget: foundation.executionTarget,
      assetMetadataInput: foundation.assetMetadataInput,
      sceneHelpers: foundation.sceneHelpers,
      geometryHelpers: foundation.geometryHelpers,
      materialHelpers: foundation.materialHelpers,
      lodHelpers: foundation.lodHelpers,
      exportHelpers: foundation.exportHelpers,
      metadataManifestHelpers: foundation.metadataManifestHelpers,
      scriptTemplate: foundation.scriptTemplate,
      runtimeConfiguration: {
        executableName: scriptConfiguration.executable.executableName,
        exportFormat: scriptConfiguration.exportConfiguration.format
      }
    },
    null,
    2
  );

  return [
    '"""',
    "Local Blender generation script template for GrowGo Asset Factory.",
    "Intended for execution on the developer machine inside Blender Python.",
    '"""',
    "",
    "import json",
    "from pathlib import Path",
    "",
    `ASSET_METADATA = ${toPythonTripleQuotedJson(metadataJson)}`,
    "",
    "def load_asset_metadata():",
    "    return json.loads(ASSET_METADATA)",
    "",
    "def ensure_scene_collections(collection_names):",
    "    # Blender runtime hook: create or resolve root and child collections.",
    "    return list(collection_names)",
    "",
    "def build_coastal_grass_geometry(metadata, collection_name):",
    "    # Blender runtime hook: generate coastal grass geometry for the target collection.",
    "    return {",
    '        "assetId": metadata["assetId"],',
    '        "collection": collection_name,',
    '        "generationMode": metadata["geometryHelpers"]["generationMode"]',
    "    }",
    "",
    "def build_coastal_ground_materials(metadata):",
    "    # Blender runtime hook: create shared materials for the ground asset.",
    '    return metadata["materialHelpers"]["sharedMaterialProfile"]',
    "",
    "def build_lod_variants(metadata):",
    "    # Blender runtime hook: create or simplify LOD payloads.",
    '    return metadata["lodHelpers"]["lodKeys"]',
    "",
    "def prepare_export_collection(metadata):",
    "    # Blender runtime hook: gather export-ready objects under EXPORT.",
    '    return metadata["assetMetadataInput"]["exportRoot"]',
    "",
    "def export_lod_glb_files(metadata, export_directory):",
    "    # Blender runtime hook: export GLB files for each approved LOD.",
    '    return {"exportDirectory": export_directory, "lodOutputs": metadata["exportHelpers"]["lodOutputs"]}',
    "",
    "def write_asset_metadata_json(metadata, output_directory):",
    '    path = Path(output_directory) / metadata["metadataManifestHelpers"]["metadataFilename"]',
    '    path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")',
    "    return str(path)",
    "",
    "def write_asset_manifest_json(metadata, output_directory):",
    "    manifest_payload = {",
    '        "assetId": metadata["assetId"],',
    '        "recipeReference": metadata["assetMetadataInput"]["recipeReference"],',
    '        "manifestVersion": metadata["assetMetadataInput"]["manifestVersion"]',
    "    }",
    '    path = Path(output_directory) / metadata["metadataManifestHelpers"]["manifestFilename"]',
    '    path.write_text(json.dumps(manifest_payload, indent=2), encoding="utf-8")',
    "    return str(path)",
    "",
    "def write_validation_metadata_json(metadata, output_directory):",
    "    validation_payload = {",
    '        "assetId": metadata["assetId"],',
    '        "localBlenderExecutionRequired": metadata["executionTarget"]["localBlenderExecutionRequired"],',
    '        "exportFormat": metadata["exportHelpers"]["exportFormat"]',
    "    }",
    '    path = Path(output_directory) / metadata["metadataManifestHelpers"]["validationFilename"]',
    '    path.write_text(json.dumps(validation_payload, indent=2), encoding="utf-8")',
    "    return str(path)",
    "",
    "def generate_asset_package(output_directory='.'):",
    "    metadata = load_asset_metadata()",
    '    collections = ensure_scene_collections(metadata["sceneHelpers"]["collections"])',
    "    build_coastal_ground_materials(metadata)",
    "    for collection_name in collections:",
    "        if collection_name.startswith('LOD') or collection_name == 'GEOMETRY':",
    "            build_coastal_grass_geometry(metadata, collection_name)",
    "    build_lod_variants(metadata)",
    "    write_asset_metadata_json(metadata, output_directory)",
    "    write_asset_manifest_json(metadata, output_directory)",
    "    write_validation_metadata_json(metadata, output_directory)",
    "    return metadata",
    "",
    "def export_asset_package(output_directory='.'):",
    "    metadata = load_asset_metadata()",
    "    prepare_export_collection(metadata)",
    "    return export_lod_glb_files(metadata, output_directory)",
    "",
    "if __name__ == '__main__':",
    "    generate_asset_package()",
    "    export_asset_package()",
    ""
  ].join("\n");
}

function normalizeFoundation(rawDefinition) {
  const foundation = asPlainObject(
    rawDefinition,
    "local Blender generation script foundation"
  );
  assertRequiredFields(foundation);

  return deepFreeze({
    assetId: normalizePermanentId(foundation.assetId, "assetId"),
    executionTarget: normalizeExecutionTarget(foundation.executionTarget),
    assetMetadataInput: normalizeAssetMetadataInput(foundation.assetMetadataInput),
    sceneHelpers: normalizeSceneHelpers(foundation.sceneHelpers),
    geometryHelpers: normalizeHelperGroup(
      foundation.geometryHelpers,
      "geometryHelpers"
    ),
    materialHelpers: normalizeHelperGroup(
      foundation.materialHelpers,
      "materialHelpers"
    ),
    lodHelpers: normalizeLodHelpers(foundation.lodHelpers),
    exportHelpers: normalizeExportHelpers(foundation.exportHelpers),
    metadataManifestHelpers: normalizeMetadataManifestHelpers(
      foundation.metadataManifestHelpers
    ),
    scriptTemplate: normalizeScriptTemplate(foundation.scriptTemplate)
  });
}

function normalizeRuntimeConfigurationForScript(rawConfiguration) {
  const configuration = asPlainObject(rawConfiguration, "runtimeConfiguration");
  const executable = asPlainObject(configuration.executable, "runtimeConfiguration.executable");
  const exportConfiguration = asPlainObject(
    configuration.exportConfiguration,
    "runtimeConfiguration.exportConfiguration"
  );

  return deepFreeze({
    executable: {
      executableName: normalizeNonEmptyString(
        executable.executableName,
        "runtimeConfiguration.executable.executableName"
      )
    },
    exportConfiguration: {
      format: normalizeLowercaseToken(
        exportConfiguration.format,
        "runtimeConfiguration.exportConfiguration.format"
      )
    }
  });
}

function normalizeExecutionTarget(rawExecutionTarget) {
  const executionTarget = asPlainObject(rawExecutionTarget, "executionTarget");
  return deepFreeze({
    runtimeProfile: normalizeNonEmptyString(
      executionTarget.runtimeProfile,
      "executionTarget.runtimeProfile"
    ),
    intendedExecutionHost: normalizeNonEmptyString(
      executionTarget.intendedExecutionHost,
      "executionTarget.intendedExecutionHost"
    ),
    localBlenderExecutionRequired: normalizeBoolean(
      executionTarget.localBlenderExecutionRequired,
      "executionTarget.localBlenderExecutionRequired"
    ),
    codexExecutionAllowed: normalizeBoolean(
      executionTarget.codexExecutionAllowed,
      "executionTarget.codexExecutionAllowed"
    )
  });
}

function normalizeAssetMetadataInput(rawAssetMetadataInput) {
  const assetMetadataInput = asPlainObject(
    rawAssetMetadataInput,
    "assetMetadataInput"
  );
  return deepFreeze({
    generationJobId: normalizePermanentId(
      assetMetadataInput.generationJobId,
      "assetMetadataInput.generationJobId"
    ),
    assetFamilyId: normalizePermanentId(
      assetMetadataInput.assetFamilyId,
      "assetMetadataInput.assetFamilyId"
    ),
    recipeReference: normalizePermanentId(
      assetMetadataInput.recipeReference,
      "assetMetadataInput.recipeReference"
    ),
    exportRoot: normalizeNonEmptyString(
      assetMetadataInput.exportRoot,
      "assetMetadataInput.exportRoot"
    ),
    manifestVersion: normalizeVersion(
      assetMetadataInput.manifestVersion,
      "assetMetadataInput.manifestVersion"
    )
  });
}

function normalizeSceneHelpers(rawSceneHelpers) {
  const sceneHelpers = asPlainObject(rawSceneHelpers, "sceneHelpers");
  const rootCollection = normalizePermanentId(
    sceneHelpers.rootCollection,
    "sceneHelpers.rootCollection"
  );
  const collections = normalizeUppercaseTokenArray(
    sceneHelpers.collections,
    "sceneHelpers.collections"
  );

  if (
    collections.length !== supportedCollections.length ||
    collections.some((collectionName, index) => collectionName !== supportedCollections[index])
  ) {
    throw createValidationError(
      "scene_contract_mismatch",
      "sceneHelpers.collections must preserve the approved GEOMETRY/MATERIALS/LOD0-LOD3/EXPORT collection contract."
    );
  }

  return deepFreeze({
    rootCollection,
    collections
  });
}

function normalizeHelperGroup(rawHelperGroup, fieldName) {
  const helperGroup = asPlainObject(rawHelperGroup, fieldName);
  return deepFreeze({
    ...Object.fromEntries(
      Object.entries(helperGroup).map(([key, value]) => {
        if (key === "helperFunctions") {
          return [key, normalizeLowercaseSnakeCaseArray(value, `${fieldName}.helperFunctions`)];
        }

        return [key, normalizeNonEmptyString(value, `${fieldName}.${key}`)];
      })
    )
  });
}

function normalizeLodHelpers(rawLodHelpers) {
  const lodHelpers = asPlainObject(rawLodHelpers, "lodHelpers");
  const lodKeys = normalizeLodKeyArray(lodHelpers.lodKeys, "lodHelpers.lodKeys");
  const helperFunctions = normalizeLowercaseSnakeCaseArray(
    lodHelpers.helperFunctions,
    "lodHelpers.helperFunctions"
  );

  return deepFreeze({
    lodKeys,
    helperFunctions
  });
}

function normalizeExportHelpers(rawExportHelpers) {
  const exportHelpers = asPlainObject(rawExportHelpers, "exportHelpers");
  const exportFormat = normalizeLowercaseToken(
    exportHelpers.exportFormat,
    "exportHelpers.exportFormat"
  );
  const helperFunctions = normalizeLowercaseSnakeCaseArray(
    exportHelpers.helperFunctions,
    "exportHelpers.helperFunctions"
  );
  const lodOutputs = normalizeLodOutputs(
    exportHelpers.lodOutputs,
    "exportHelpers.lodOutputs"
  );

  return deepFreeze({
    exportFormat,
    helperFunctions,
    lodOutputs
  });
}

function normalizeMetadataManifestHelpers(rawMetadataManifestHelpers) {
  const metadataManifestHelpers = asPlainObject(
    rawMetadataManifestHelpers,
    "metadataManifestHelpers"
  );
  return deepFreeze({
    helperFunctions: normalizeLowercaseSnakeCaseArray(
      metadataManifestHelpers.helperFunctions,
      "metadataManifestHelpers.helperFunctions"
    ),
    manifestFilename: normalizeJsonFilename(
      metadataManifestHelpers.manifestFilename,
      "metadataManifestHelpers.manifestFilename"
    ),
    metadataFilename: normalizeJsonFilename(
      metadataManifestHelpers.metadataFilename,
      "metadataManifestHelpers.metadataFilename"
    ),
    validationFilename: normalizeJsonFilename(
      metadataManifestHelpers.validationFilename,
      "metadataManifestHelpers.validationFilename"
    )
  });
}

function normalizeScriptTemplate(rawScriptTemplate) {
  const scriptTemplate = asPlainObject(rawScriptTemplate, "scriptTemplate");
  return deepFreeze({
    templateId: normalizePermanentId(
      scriptTemplate.templateId,
      "scriptTemplate.templateId"
    ),
    pythonFilename: normalizePythonFilename(
      scriptTemplate.pythonFilename,
      "scriptTemplate.pythonFilename"
    ),
    generationEntryPoint: normalizeLowercaseSnakeCase(
      scriptTemplate.generationEntryPoint,
      "scriptTemplate.generationEntryPoint"
    ),
    exportEntryPoint: normalizeLowercaseSnakeCase(
      scriptTemplate.exportEntryPoint,
      "scriptTemplate.exportEntryPoint"
    )
  });
}

function normalizeLodOutputs(rawLodOutputs, fieldName) {
  const lodOutputs = asPlainObject(rawLodOutputs, fieldName);
  return deepFreeze({
    close: normalizeGlbFilename(lodOutputs.close, `${fieldName}.close`),
    gameplay: normalizeGlbFilename(lodOutputs.gameplay, `${fieldName}.gameplay`),
    map: normalizeGlbFilename(lodOutputs.map, `${fieldName}.map`),
    distantSilhouette: normalizeGlbFilename(
      lodOutputs.distantSilhouette,
      `${fieldName}.distantSilhouette`
    )
  });
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

function normalizeVersion(rawValue, fieldName) {
  const value = normalizeNonEmptyString(rawValue, fieldName);
  if (!versionPattern.test(value)) {
    throw createValidationError(
      "invalid_version",
      `Field ${fieldName} must use semantic version format.`
    );
  }

  return value;
}

function normalizeUppercaseTokenArray(rawValue, fieldName) {
  return deepFreeze(
    normalizeStringArray(rawValue, fieldName).map((value, index) =>
      normalizeUppercaseToken(value, `${fieldName}[${index}]`)
    )
  );
}

function normalizeLodKeyArray(rawValue, fieldName) {
  const lodKeys = normalizeStringArray(rawValue, fieldName);
  if (
    lodKeys.length !== supportedLodKeys.length ||
    lodKeys.some((lodKey, index) => lodKey !== supportedLodKeys[index])
  ) {
    throw createValidationError(
      "invalid_lod_keys",
      `${fieldName} must preserve the approved close/gameplay/map/distantSilhouette LOD ordering.`
    );
  }

  return deepFreeze(lodKeys);
}

function normalizeLowercaseSnakeCaseArray(rawValue, fieldName) {
  return deepFreeze(
    normalizeStringArray(rawValue, fieldName).map((value, index) =>
      normalizeLowercaseSnakeCase(value, `${fieldName}[${index}]`)
    )
  );
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

function normalizeUppercaseToken(rawValue, fieldName) {
  const value = normalizeNonEmptyString(rawValue, fieldName);
  if (!/^[A-Z0-9_]+$/.test(value)) {
    throw createValidationError(
      "invalid_uppercase_token",
      `Field ${fieldName} must be an uppercase token.`
    );
  }

  return value;
}

function normalizeLowercaseToken(rawValue, fieldName) {
  const value = normalizeNonEmptyString(rawValue, fieldName).toLowerCase();
  if (!/^[a-z0-9._-]+$/.test(value)) {
    throw createValidationError(
      "invalid_lowercase_token",
      `Field ${fieldName} must be a lowercase token.`
    );
  }

  return value;
}

function normalizeLowercaseSnakeCase(rawValue, fieldName) {
  const value = normalizeNonEmptyString(rawValue, fieldName);
  if (!/^[a-z][a-z0-9_]*$/.test(value)) {
    throw createValidationError(
      "invalid_snake_case_identifier",
      `Field ${fieldName} must be a lowercase snake_case identifier.`
    );
  }

  return value;
}

function normalizePythonFilename(rawValue, fieldName) {
  const value = normalizeNonEmptyString(rawValue, fieldName);
  if (!/^[a-z0-9_-]+\.py$/.test(value)) {
    throw createValidationError(
      "invalid_python_filename",
      `Field ${fieldName} must be a Python filename ending with .py.`
    );
  }

  return value;
}

function normalizeJsonFilename(rawValue, fieldName) {
  const value = normalizeNonEmptyString(rawValue, fieldName);
  if (!/^[a-z0-9_-]+\.json$/.test(value)) {
    throw createValidationError(
      "invalid_json_filename",
      `Field ${fieldName} must be a JSON filename ending with .json.`
    );
  }

  return value;
}

function normalizeGlbFilename(rawValue, fieldName) {
  const value = normalizeNonEmptyString(rawValue, fieldName);
  if (!/^[A-Z0-9_]+\.glb$/.test(value)) {
    throw createValidationError(
      "invalid_glb_filename",
      `Field ${fieldName} must be an uppercase GLB filename ending with .glb.`
    );
  }

  return value;
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

function assertRequiredFields(foundation) {
  for (const fieldName of coastalStarterPackBlenderLocalGenerationScriptFoundationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Local Blender generation script foundation is missing required field ${fieldName}.`
      );
    }
  }
}

function toPythonTripleQuotedJson(jsonString) {
  return `r'''${jsonString.replace(/'''/g, "\\'\\'\\'")}'''`;
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
    localGenerationScriptFoundation: null
  });
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name =
    "CoastalStarterPackBlenderLocalGenerationScriptFoundationValidationError";
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
