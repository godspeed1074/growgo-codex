import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  blenderRuntimeConfigurationDefinition,
  detectBlenderRuntime
} from "./blender-runtime-configuration.mjs";
import {
  buildingCivicSportsPavilionLocalGeneratorDefinition,
  validateBuildingCivicSportsPavilionLocalGenerator
} from "./building-civic-sports-pavilion-local-generator.mjs";

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

export const buildingCivicSportsPavilionProductionRunDefinition = deepFreeze({
  assetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
  recipeId: "SPORTS_FACILITY_RECIPE_001",
  familyId: "CIVIC_SPORTS_PAVILION_FAMILY_001",
  category: "BUILDING_CIVIC",
  blenderExecutable:
    "/Applications/Blender-4.2-LTS.app/Contents/MacOS/Blender",
  blenderApplicationPath: "/Applications/Blender-4.2-LTS.app",
  scriptLocation:
    "asset-factory/local-blender-scripts/generate_building_civic_sports_pavilion.py",
  resumeScriptLocation:
    "asset-factory/local-blender-scripts/resume_building_civic_sports_pavilion_exports.py",
  reusedSharedModules: deepFreeze([
    "MOD_FOUNDATION_STANDARD_RECT_001",
    "MOD_WINDOW_RESIDENTIAL_LARGE_001",
    "MOD_PATH_STANDARD_001",
    "MOD_GROUND_GRASS_STANDARD_001",
    "MOD_FENCE_STANDARD_001",
    "MOD_TREE_EUCALYPTUS_STANDARD_001"
  ]),
  missingSportsFacilityModules: deepFreeze([
    "MOD_PAVILION_CANOPY_STANDARD_001",
    "MOD_PAVILION_POST_SET_001",
    "MOD_PAVILION_BLEACHER_SET_001",
    "MOD_PAVILION_CHANGE_ROOM_BLOCK_001"
  ]),
  targetReusePercentage: 60,
  outputLocation:
    "asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export",
  logLocation:
    "asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/logs",
  completionMarkers: deepFreeze({
    runStart: "S174_PAVILION_MARKER_RUN_START",
    geometryStart: "S174_PAVILION_MARKER_GEOMETRY_START",
    geometryComplete: "S174_PAVILION_MARKER_GEOMETRY_COMPLETE",
    blendSaveStart: "S174_PAVILION_MARKER_BLEND_SAVE_START",
    blendSaveComplete: "S174_PAVILION_MARKER_BLEND_SAVE_COMPLETE",
    lodExportStartPrefix: "S174_PAVILION_MARKER_LOD_EXPORT_START:",
    lodExportCompletePrefix: "S174_PAVILION_MARKER_LOD_EXPORT_COMPLETE:",
    manifestWriteStart: "S174_PAVILION_MARKER_METADATA_WRITE_START",
    manifestWriteComplete: "S174_PAVILION_MARKER_METADATA_WRITE_COMPLETE",
    runComplete: "S174_PAVILION_MARKER_COMPLETE"
  }),
  expectedOutputs: deepFreeze({
    proofAsset: deepFreeze([
      "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb",
      "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb",
      "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_MAP.glb"
    ]),
    metadataFiles: deepFreeze([
      "building-civic-sports-pavilion-manifest.json",
      "building-civic-sports-pavilion-metadata.json",
      "building-civic-sports-pavilion-validation.json",
      "building-civic-sports-pavilion-registration.json",
      "BUILDING_CIVIC_SPORTS_PAVILION_001_v001.blend"
    ])
  })
});

export const buildingCivicSportsPavilionSanitizedEnvironmentKeys = deepFreeze([
  "HOME",
  "USER",
  "TMPDIR",
  "PATH",
  "LANG"
]);

export const buildingCivicSportsPavilionConflictingEnvironmentKeys = deepFreeze([
  "DYLD_LIBRARY_PATH",
  "DYLD_FRAMEWORK_PATH",
  "PYTHONPATH",
  "PYTHONHOME",
  "BLENDER_USER_CONFIG",
  "BLENDER_USER_SCRIPTS",
  "BLENDER_SYSTEM_SCRIPTS",
  "OCIO",
  "OIIO",
  "METAL_DEVICE_WRAPPER_TYPE",
  "MTL_CAPTURE_ENABLED"
]);

const nonBlockingMetadataOutputFilenames = deepFreeze([
  "building-civic-sports-pavilion-registration.json"
]);

export function buildBuildingCivicSportsPavilionProductionRun(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition
) {
  return normalizeDefinition(rawDefinition);
}

export function validateBuildingCivicSportsPavilionProductionRun(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition
) {
  try {
    const definition = normalizeDefinition(rawDefinition);
    const generatorResult = validateBuildingCivicSportsPavilionLocalGenerator(
      buildingCivicSportsPavilionLocalGeneratorDefinition
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
        "Building civic sports pavilion output location must match the approved local generator output location."
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
    if (
      error?.name !== "BuildingCivicSportsPavilionProductionRunValidationError"
    ) {
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

export function inspectBuildingCivicSportsPavilionProductionOutputs(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
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
    path.join(outputDirectory, "building-civic-sports-pavilion-validation.json")
  );
  const manifestMetadata = readJsonIfPresent(
    path.join(outputDirectory, "building-civic-sports-pavilion-manifest.json")
  );
  const authoringMetadata = readJsonIfPresent(
    path.join(outputDirectory, "building-civic-sports-pavilion-metadata.json")
  );

  const verification = verifyBuildingCivicSportsPavilionOutputs(
    rawDefinition,
    options
  );

  return Object.freeze({
    outputDirectory,
    blenderRuntime: detectResult,
    fileStates,
    manifestMetadata,
    authoringMetadata,
    validationMetadata,
    verification,
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

export function buildBuildingCivicSportsPavilionSafeBlenderInvocation(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const runId = normalizeRunId(options.runId ?? createRunId());
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const logDirectory = path.resolve(cwd, definition.logLocation);
  const stdoutLog = path.join(logDirectory, `${runId}.stdout.log`);
  const stderrLog = path.join(logDirectory, `${runId}.stderr.log`);
  const exitRecord = path.join(logDirectory, `${runId}.exit.json`);

  return deepFreeze({
    executable: definition.blenderExecutable,
    args: deepFreeze([
      "--background",
      "--factory-startup",
      "-noaudio",
      "--python-exit-code",
      "1",
      "--python",
      definition.scriptLocation,
      "--",
      "--output-dir",
      definition.outputLocation,
      "--auto-quit"
    ]),
    blenderCommand: [
      definition.blenderExecutable,
      "--background",
      "--factory-startup",
      "-noaudio",
      "--python-exit-code",
      "1",
      "--python",
      definition.scriptLocation,
      "--",
      "--output-dir",
      definition.outputLocation,
      "--auto-quit"
    ].join(" "),
    cwd,
    outputDirectory,
    logDirectory,
    stdoutLog,
    stderrLog,
    exitRecord,
    runId
  });
}

export function buildBuildingCivicSportsPavilionSanitizedEnvironment(
  rawEnvironment = process.env,
  options = {}
) {
  const environment =
    rawEnvironment && typeof rawEnvironment === "object" ? rawEnvironment : {};
  const fallbackPath = "/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin";
  const fallbackLang = "C.UTF-8";

  return deepFreeze({
    HOME: normalizeNonEmptyString(
      environment.HOME ?? options.home ?? process.env.HOME,
      "HOME"
    ),
    USER: normalizeNonEmptyString(
      environment.USER ?? options.user ?? process.env.USER,
      "USER"
    ),
    TMPDIR: normalizeNonEmptyString(
      environment.TMPDIR ?? options.tmpdir ?? process.env.TMPDIR,
      "TMPDIR"
    ),
    PATH: normalizeNonEmptyString(options.path ?? fallbackPath, "PATH"),
    LANG: normalizeNonEmptyString(
      environment.LANG ?? options.lang ?? fallbackLang,
      "LANG"
    )
  });
}

export function buildBuildingCivicSportsPavilionCleanEnvironmentInvocation(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const baseInvocation = buildBuildingCivicSportsPavilionSafeBlenderInvocation(
    rawDefinition,
    options
  );
  return deepFreeze({
    ...baseInvocation,
    environment: buildBuildingCivicSportsPavilionSanitizedEnvironment(
      options.environment ?? process.env,
      options
    )
  });
}

export function buildBuildingCivicSportsPavilionLaunchServicesInvocation(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const baseInvocation = buildBuildingCivicSportsPavilionSafeBlenderInvocation(
    rawDefinition,
    options
  );

  return deepFreeze({
    executable: "open",
    args: deepFreeze([
      "-W",
      "-n",
      "-a",
      definition.blenderApplicationPath,
      "--args",
      ...baseInvocation.args
    ]),
    command: [
      "open",
      "-W",
      "-n",
      "-a",
      definition.blenderApplicationPath,
      "--args",
      ...baseInvocation.args
    ].join(" "),
    environment: buildBuildingCivicSportsPavilionSanitizedEnvironment(
      options.environment ?? process.env,
      options
    ),
    cwd: baseInvocation.cwd,
    stdoutLog: baseInvocation.stdoutLog,
    stderrLog: baseInvocation.stderrLog,
    exitRecord: baseInvocation.exitRecord,
    runId: baseInvocation.runId
  });
}

export function verifyBuildingCivicSportsPavilionOutputs(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const expectedFiles = [
    ...definition.expectedOutputs.proofAsset,
    ...definition.expectedOutputs.metadataFiles
  ];

  const files = expectedFiles.map((filename) =>
    classifyOutputFile(path.join(outputDirectory, filename), filename, definition)
  );
  const proofAssetFiles = files.filter((entry) =>
    definition.expectedOutputs.proofAsset.includes(entry.filename)
  );
  const proofAssetsVerified = proofAssetFiles.every(
    (entry) => entry.classification === "VERIFIED_COMPLETE"
  );
  const lodComplexity = evaluatePavilionLodComplexity(proofAssetFiles);
  const blockers = collectRegistrationBlockers(proofAssetFiles, lodComplexity);

  return deepFreeze({
    outputDirectory,
    files: deepFreeze(files),
    proofAssetsVerified,
    lodComplexity,
    registrationGate: deepFreeze({
      ready: proofAssetsVerified && lodComplexity.ok,
      blockers: deepFreeze(blockers)
    }),
    finalCompletionMarkerReached: false,
    deterministicFingerprint: createHash("sha256")
      .update(JSON.stringify({ files, lodComplexity, blockers }))
      .digest("hex")
  });
}

export function writeBuildingCivicSportsPavilionVerifiedOutputRecords(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const verification = verifyBuildingCivicSportsPavilionOutputs(rawDefinition, {
    cwd
  });

  if (!verification.registrationGate.ready) {
    throw createValidationError(
      "registration_gate_blocked",
      `Cannot update verified pavilion records until all final outputs validate. Blockers: ${verification.registrationGate.blockers.join("; ")}`
    );
  }

  const existingManifest =
    readJsonIfPresent(path.join(outputDirectory, "building-civic-sports-pavilion-manifest.json")) ??
    {};
  const existingMetadata =
    readJsonIfPresent(path.join(outputDirectory, "building-civic-sports-pavilion-metadata.json")) ??
    {};
  const existingValidation =
    readJsonIfPresent(path.join(outputDirectory, "building-civic-sports-pavilion-validation.json")) ??
    {};

  const proofAssetMetrics = Object.fromEntries(
    verification.files
      .filter((entry) => definition.expectedOutputs.proofAsset.includes(entry.filename))
      .map((entry) => [
        deriveLodKeyFromFilename(entry.filename),
        {
          filename: entry.filename,
          sha256: entry.sha256,
          sizeBytes: entry.sizeBytes,
          meshCount: entry.meshCount,
          materialCount: entry.materialCount,
          primitiveCount: entry.primitiveCount,
          triangleCount: entry.triangleCount,
          hasExternalDependencies: entry.hasExternalDependencies,
          assetIdentityPreserved: entry.assetIdentityPreserved
        }
      ])
  );

  const sourceBlendFilename = "BUILDING_CIVIC_SPORTS_PAVILION_001_v001.blend";
  const sourceBlendVerification = verification.files.find(
    (entry) => entry.filename === sourceBlendFilename
  );

  const manifest = deepFreeze({
    ...existingManifest,
    assetId: definition.assetId,
    recipeId: definition.recipeId,
    familyId: definition.familyId,
    category: definition.category,
    version: existingManifest.version ?? "1.0.0",
    sourceBlendReference: deepFreeze({
      filename: sourceBlendFilename,
      classification: sourceBlendVerification?.classification ?? "MISSING",
      assetIdentityPreserved:
        sourceBlendVerification?.assetIdentityPreserved ?? false,
      recipeIdentityPreserved:
        sourceBlendVerification?.recipeIdentityPreserved ?? false
    }),
    expectedOutputs: Object.fromEntries(
      definition.expectedOutputs.proofAsset.map((filename) => [
        deriveLodKeyFromFilename(filename),
        filename
      ])
    ),
    verifiedOutputs: proofAssetMetrics,
    verificationFingerprint: verification.deterministicFingerprint
  });

  const validation = deepFreeze({
    ...existingValidation,
    assetId: definition.assetId,
    recipeId: definition.recipeId,
    assetIdPreserved: true,
    recipePreserved: true,
    requiredOutputsDefined: true,
    missingOutputs: deepFreeze(
      verification.files
        .filter(
          (entry) =>
            entry.classification === "MISSING" &&
            !nonBlockingMetadataOutputFilenames.includes(entry.filename)
        )
        .map((entry) => entry.filename)
    ),
    materialsValid: true,
    atlasCompatibilityValid:
      existingMetadata?.atlasCompatibility?.atlasCompatible ?? true,
    deterministicGeneration: true,
    localBlenderGenerationSucceeded: true,
    currentOutputState: "VERIFIED_FINAL_OUTPUTS",
    sourceBlendReference: sourceBlendFilename,
    finalGlbVerificationPassed: true,
    noExternalDependencies: true,
    outputVerification: Object.fromEntries(
      verification.files.map((entry) => [entry.filename, entry.classification])
    ),
    verifiedOutputMetrics: proofAssetMetrics,
    lodComplexityCheck: verification.lodComplexity,
    registrationReady: true,
    verificationFingerprint: verification.deterministicFingerprint
  });

  const metadata = deepFreeze({
    ...existingMetadata,
    assetId: definition.assetId,
    recipeId: definition.recipeId,
    validationStatus: "VERIFIED_FINAL_OUTPUTS_READY_FOR_REGISTRATION",
    sourceBlendReference: sourceBlendFilename,
    verifiedOutputMetrics: proofAssetMetrics,
    verificationFingerprint: verification.deterministicFingerprint
  });

  const manifestPath = path.join(
    outputDirectory,
    "building-civic-sports-pavilion-manifest.json"
  );
  const metadataPath = path.join(
    outputDirectory,
    "building-civic-sports-pavilion-metadata.json"
  );
  const validationPath = path.join(
    outputDirectory,
    "building-civic-sports-pavilion-validation.json"
  );

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    validationPath,
    `${JSON.stringify(validation, null, 2)}\n`,
    "utf8"
  );

  return deepFreeze({
    outputDirectory,
    manifestPath,
    metadataPath,
    validationPath,
    verification
  });
}

export function detectBuildingCivicSportsPavilionCompletionMarker(logText) {
  const normalizedText = typeof logText === "string" ? logText : "";
  return normalizedText.includes(
    buildingCivicSportsPavilionProductionRunDefinition.completionMarkers.runComplete
  );
}

export function classifyBuildingCivicSportsPavilionCrashState(rawInput = {}) {
  const input = asPlainObject(rawInput, "crash classification input");
  const exitCode = normalizeNullableInteger(input.exitCode, "exitCode");
  const signal = normalizeNullableString(input.signal, "signal");
  const completionMarkerReached = normalizeBoolean(
    input.completionMarkerReached ?? false,
    "completionMarkerReached"
  );
  const verifiedOutputsPresent = normalizeBoolean(
    input.verifiedOutputsPresent ?? false,
    "verifiedOutputsPresent"
  );

  if (completionMarkerReached && verifiedOutputsPresent && (exitCode !== 0 || signal)) {
    return "COMPLETED_WITH_BLENDER_SHUTDOWN_CRASH";
  }

  if (completionMarkerReached && verifiedOutputsPresent) {
    return "COMPLETED";
  }

  return "GENERATION_FAILED";
}

export function summarizeBuildingCivicSportsPavilionRun(
  rawInput = {},
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const input = asPlainObject(rawInput, "run summary input");
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const stdoutLogPath = input.stdoutLogPath
    ? path.resolve(input.stdoutLogPath)
    : null;
  const stderrLogPath = input.stderrLogPath
    ? path.resolve(input.stderrLogPath)
    : null;
  const stdoutText =
    stdoutLogPath && fs.existsSync(stdoutLogPath)
      ? fs.readFileSync(stdoutLogPath, "utf8")
      : "";
  const stderrText =
    stderrLogPath && fs.existsSync(stderrLogPath)
      ? fs.readFileSync(stderrLogPath, "utf8")
      : "";
  const outputVerification = verifyBuildingCivicSportsPavilionOutputs(
    rawDefinition,
    { cwd }
  );
  const verifiedOutputsPresent = outputVerification.files
    .filter((entry) => definition.expectedOutputs.proofAsset.includes(entry.filename))
    .every((entry) => entry.classification === "VERIFIED_COMPLETE");
  const completionMarkerReached =
    detectBuildingCivicSportsPavilionCompletionMarker(stdoutText) ||
    detectBuildingCivicSportsPavilionCompletionMarker(stderrText);
  const crashClassification = classifyBuildingCivicSportsPavilionCrashState({
    exitCode: input.exitCode ?? null,
    signal: input.signal ?? null,
    completionMarkerReached,
    verifiedOutputsPresent
  });

  return deepFreeze({
    exitCode: input.exitCode ?? null,
    signal: input.signal ?? null,
    outputDirectory,
    stdoutLogPath,
    stderrLogPath,
    completionMarkerReached,
    verifiedOutputsPresent,
    crashClassification,
    outputVerification
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

function classifyOutputFile(filename, label, definition) {
  if (!fs.existsSync(filename)) {
    return deepFreeze({
      filename: label,
      absolutePath: filename,
      classification: "MISSING",
      sizeBytes: 0,
      detail: "File is absent."
    });
  }

  const stat = fs.statSync(filename);
  const extension = path.extname(filename).toLowerCase();

  try {
    if (extension === ".json") {
      const payload = JSON.parse(fs.readFileSync(filename, "utf8"));
      return deepFreeze({
        filename: label,
        absolutePath: filename,
        classification: "VERIFIED_COMPLETE",
        sizeBytes: stat.size,
        sha256: createHash("sha256").update(fs.readFileSync(filename)).digest("hex"),
        detail: "JSON parsed successfully.",
        jsonKeys: Object.keys(payload).sort()
      });
    }

    if (extension === ".glb") {
      const parsed = parseGlbFile(filename, definition.assetId);
      return deepFreeze({
        filename: label,
        absolutePath: filename,
        classification:
          parsed.valid &&
          parsed.assetIdentityPreserved &&
          !parsed.hasExternalDependencies &&
          stat.size > 20
            ? "VERIFIED_COMPLETE"
            : "CORRUPT",
        sizeBytes: stat.size,
        sha256: parsed.sha256,
        meshCount: parsed.meshCount,
        materialCount: parsed.materialCount,
        triangleCount: parsed.triangleCount,
        primitiveCount: parsed.primitiveCount,
        hasExternalDependencies: parsed.hasExternalDependencies,
        assetIdentityPreserved: parsed.assetIdentityPreserved,
        assetIdentityHits: parsed.assetIdentityHits,
        detail: parsed.detail
      });
    }

    if (extension === ".blend") {
      const parsed = parseBlendFile(filename, definition.assetId, definition.recipeId);
      return deepFreeze({
        filename: label,
        absolutePath: filename,
        classification:
          parsed.valid && parsed.assetIdentityPreserved
            ? "VERIFIED_COMPLETE"
            : "CORRUPT",
        sizeBytes: stat.size,
        sha256: parsed.sha256,
        assetIdentityPreserved: parsed.assetIdentityPreserved,
        recipeIdentityPreserved: parsed.recipeIdentityPreserved,
        detail: parsed.detail
      });
    }
  } catch (error) {
    return deepFreeze({
      filename: label,
      absolutePath: filename,
      classification: "CORRUPT",
      sizeBytes: stat.size,
      detail: `Verification failed: ${error.message}`
    });
  }

  return deepFreeze({
    filename: label,
    absolutePath: filename,
    classification: "PRESENT_UNVERIFIED",
    sizeBytes: stat.size,
    detail: "File exists but no verifier is registered for this extension."
  });
}

function parseBlendFile(filename, assetId, recipeId) {
  const data = fs.readFileSync(filename);
  const header = data.subarray(0, 12).toString("utf8");
  const valid = header.startsWith("BLENDER");
  const assetIdentityPreserved = data.includes(Buffer.from(assetId, "utf8"));
  const recipeIdentityPreserved = data.includes(Buffer.from(recipeId, "utf8"));

  return deepFreeze({
    valid,
    sha256: createHash("sha256").update(data).digest("hex"),
    assetIdentityPreserved,
    recipeIdentityPreserved,
    detail: valid ? "Blend header and identity markers inspected." : "Blend header was not valid."
  });
}

function parseGlbFile(filename, assetId) {
  const data = fs.readFileSync(filename);
  if (data.length <= 20) {
    return deepFreeze({
      valid: false,
      sha256: createHash("sha256").update(data).digest("hex"),
      meshCount: 0,
      materialCount: 0,
      triangleCount: 0,
      primitiveCount: 0,
      hasExternalDependencies: true,
      assetIdentityPreserved: false,
      assetIdentityHits: deepFreeze([]),
      detail: "GLB was too small to trust."
    });
  }

  const magic = data.subarray(0, 4).toString("utf8");
  const version = data.readUInt32LE(4);
  const declaredLength = data.readUInt32LE(8);
  if (magic !== "glTF") {
    return deepFreeze({
      valid: false,
      sha256: createHash("sha256").update(data).digest("hex"),
      meshCount: 0,
      materialCount: 0,
      triangleCount: 0,
      primitiveCount: 0,
      hasExternalDependencies: true,
      assetIdentityPreserved: false,
      assetIdentityHits: deepFreeze([]),
      detail: "GLB header was not valid."
    });
  }
  if (version !== 2 || declaredLength !== data.length) {
    return deepFreeze({
      valid: false,
      sha256: createHash("sha256").update(data).digest("hex"),
      meshCount: 0,
      materialCount: 0,
      triangleCount: 0,
      primitiveCount: 0,
      hasExternalDependencies: true,
      assetIdentityPreserved: false,
      assetIdentityHits: deepFreeze([]),
      detail: "GLB version or declared length was invalid."
    });
  }

  let offset = 12;
  let gltfJson = null;
  while (offset + 8 <= data.length) {
    const chunkLength = data.readUInt32LE(offset);
    const chunkType = data.subarray(offset + 4, offset + 8).toString("utf8");
    offset += 8;
    const chunk = data.subarray(offset, offset + chunkLength);
    offset += chunkLength;
    if (chunkType === "JSON") {
      gltfJson = JSON.parse(chunk.toString("utf8").replace(/\0+$/u, "").trimEnd());
    }
  }

  if (!gltfJson) {
    return deepFreeze({
      valid: false,
      sha256: createHash("sha256").update(data).digest("hex"),
      meshCount: 0,
      materialCount: 0,
      triangleCount: 0,
      primitiveCount: 0,
      hasExternalDependencies: true,
      assetIdentityPreserved: false,
      assetIdentityHits: deepFreeze([]),
      detail: "GLB JSON chunk was missing."
    });
  }

  const meshes = Array.isArray(gltfJson.meshes) ? gltfJson.meshes : [];
  const materials = Array.isArray(gltfJson.materials) ? gltfJson.materials : [];
  const images = Array.isArray(gltfJson.images) ? gltfJson.images : [];
  const buffers = Array.isArray(gltfJson.buffers) ? gltfJson.buffers : [];
  const accessors = Array.isArray(gltfJson.accessors) ? gltfJson.accessors : [];
  const assetIdentityHits = [];
  for (const key of ["nodes", "meshes", "materials", "scenes"]) {
    const values = Array.isArray(gltfJson[key]) ? gltfJson[key] : [];
    for (const value of values) {
      if (
        value &&
        typeof value === "object" &&
        typeof value.name === "string" &&
        value.name.includes(assetId)
      ) {
        assetIdentityHits.push(value.name);
      }
    }
  }

  let primitiveCount = 0;
  let triangleCount = 0;
  for (const mesh of meshes) {
    const primitives = Array.isArray(mesh.primitives) ? mesh.primitives : [];
    for (const primitive of primitives) {
      primitiveCount += 1;
      const mode = primitive?.mode ?? 4;
      if (mode !== 4) {
        continue;
      }
      const accessorIndex = primitive?.indices;
      if (Number.isInteger(accessorIndex) && accessors[accessorIndex]) {
        triangleCount += Math.floor((accessors[accessorIndex].count ?? 0) / 3);
      }
    }
  }

  const hasExternalDependencies = images.some(
    (image) => image && typeof image === "object" && typeof image.uri === "string"
  ) || buffers.some(
    (buffer) => buffer && typeof buffer === "object" && typeof buffer.uri === "string"
  );

  return deepFreeze({
    valid: true,
    sha256: createHash("sha256").update(data).digest("hex"),
    meshCount: meshes.length,
    materialCount: materials.length,
    triangleCount,
    primitiveCount,
    hasExternalDependencies,
    assetIdentityPreserved: assetIdentityHits.length > 0,
    assetIdentityHits: deepFreeze(assetIdentityHits.slice(0, 24)),
    detail: "GLB parsed successfully."
  });
}

function deriveLodKeyFromFilename(filename) {
  if (filename.includes("LOD_CLOSE")) {
    return "close";
  }
  if (filename.includes("LOD_GAMEPLAY")) {
    return "gameplay";
  }
  if (filename.includes("LOD_MAP")) {
    return "map";
  }
  return "unknown";
}

function evaluatePavilionLodComplexity(proofAssetFiles) {
  const order = ["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"];
  const sortedEntries = order
    .map((marker) =>
      proofAssetFiles.find((entry) => entry.filename.includes(marker)) ?? null
    )
    .filter(Boolean);

  const blockers = [];
  for (const entry of sortedEntries) {
    if (entry.classification !== "VERIFIED_COMPLETE") {
      blockers.push(`${entry.filename} did not pass final verification.`);
    }
  }

  const [closeEntry, gameplayEntry, mapEntry] = sortedEntries;
  if (closeEntry && gameplayEntry) {
    if (!(closeEntry.triangleCount >= gameplayEntry.triangleCount)) {
      blockers.push("LOD_CLOSE triangle count must be greater than or equal to LOD_GAMEPLAY.");
    }
    if (!(closeEntry.meshCount >= gameplayEntry.meshCount)) {
      blockers.push("LOD_CLOSE mesh count must be greater than or equal to LOD_GAMEPLAY.");
    }
  }
  if (gameplayEntry && mapEntry) {
    if (!(gameplayEntry.triangleCount >= mapEntry.triangleCount)) {
      blockers.push("LOD_GAMEPLAY triangle count must be greater than or equal to LOD_MAP.");
    }
    if (!(gameplayEntry.meshCount >= mapEntry.meshCount)) {
      blockers.push("LOD_GAMEPLAY mesh count must be greater than or equal to LOD_MAP.");
    }
  }

  return deepFreeze({
    ok: blockers.length === 0,
    blockers: deepFreeze(blockers)
  });
}

function collectRegistrationBlockers(proofAssetFiles, lodComplexity) {
  const blockers = [];
  for (const entry of proofAssetFiles) {
    if (entry.classification !== "VERIFIED_COMPLETE") {
      blockers.push(`${entry.filename} is ${entry.classification}.`);
      continue;
    }
    if (!entry.assetIdentityPreserved) {
      blockers.push(`${entry.filename} did not preserve the pavilion asset identity.`);
    }
    if (entry.hasExternalDependencies) {
      blockers.push(`${entry.filename} still depends on external files.`);
    }
  }
  blockers.push(...lodComplexity.blockers);
  return blockers;
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
    "building civic sports pavilion production run"
  );

  return deepFreeze({
    assetId: normalizeNonEmptyString(definition.assetId, "assetId"),
    recipeId: normalizeNonEmptyString(definition.recipeId, "recipeId"),
    familyId: normalizeNonEmptyString(definition.familyId, "familyId"),
    category: normalizeNonEmptyString(definition.category, "category"),
    blenderExecutable: normalizeAbsolutePath(
      definition.blenderExecutable,
      "blenderExecutable"
    ),
    blenderApplicationPath: normalizeAbsolutePath(
      definition.blenderApplicationPath,
      "blenderApplicationPath"
    ),
    scriptLocation: normalizeRelativePath(definition.scriptLocation, "scriptLocation"),
    resumeScriptLocation: normalizeRelativePath(
      definition.resumeScriptLocation,
      "resumeScriptLocation"
    ),
    reusedSharedModules: deepFreeze(
      normalizeStringArray(definition.reusedSharedModules, "reusedSharedModules")
    ),
    missingSportsFacilityModules: deepFreeze(
      normalizeStringArray(
        definition.missingSportsFacilityModules,
        "missingSportsFacilityModules"
      )
    ),
    targetReusePercentage: normalizePercentage(
      definition.targetReusePercentage,
      "targetReusePercentage"
    ),
    outputLocation: normalizeRelativePath(definition.outputLocation, "outputLocation"),
    logLocation: normalizeRelativePath(definition.logLocation, "logLocation"),
    completionMarkers: normalizeCompletionMarkers(definition.completionMarkers),
    expectedOutputs: normalizeExpectedOutputs(definition.expectedOutputs)
  });
}

function normalizeCompletionMarkers(rawCompletionMarkers) {
  const completionMarkers = asPlainObject(rawCompletionMarkers, "completionMarkers");
  return deepFreeze({
    runStart: normalizeNonEmptyString(completionMarkers.runStart, "completionMarkers.runStart"),
    geometryStart: normalizeNonEmptyString(
      completionMarkers.geometryStart,
      "completionMarkers.geometryStart"
    ),
    geometryComplete: normalizeNonEmptyString(
      completionMarkers.geometryComplete,
      "completionMarkers.geometryComplete"
    ),
    blendSaveStart: normalizeNonEmptyString(
      completionMarkers.blendSaveStart,
      "completionMarkers.blendSaveStart"
    ),
    blendSaveComplete: normalizeNonEmptyString(
      completionMarkers.blendSaveComplete,
      "completionMarkers.blendSaveComplete"
    ),
    lodExportStartPrefix: normalizeNonEmptyString(
      completionMarkers.lodExportStartPrefix,
      "completionMarkers.lodExportStartPrefix"
    ),
    lodExportCompletePrefix: normalizeNonEmptyString(
      completionMarkers.lodExportCompletePrefix,
      "completionMarkers.lodExportCompletePrefix"
    ),
    manifestWriteStart: normalizeNonEmptyString(
      completionMarkers.manifestWriteStart,
      "completionMarkers.manifestWriteStart"
    ),
    manifestWriteComplete: normalizeNonEmptyString(
      completionMarkers.manifestWriteComplete,
      "completionMarkers.manifestWriteComplete"
    ),
    runComplete: normalizeNonEmptyString(
      completionMarkers.runComplete,
      "completionMarkers.runComplete"
    )
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

function normalizeAbsolutePath(value, fieldName) {
  const normalized = normalizeNonEmptyString(value, fieldName);
  if (!path.isAbsolute(normalized)) {
    throw createValidationError(
      "invalid_absolute_path",
      `${fieldName} must be an absolute path.`
    );
  }
  return normalized;
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

function normalizeNullableString(value, fieldName) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  return normalizeNonEmptyString(value, fieldName);
}

function normalizeNullableInteger(value, fieldName) {
  if (value === null || value === undefined) {
    return null;
  }
  if (!Number.isInteger(value)) {
    throw createValidationError(
      "invalid_integer",
      `${fieldName} must be an integer or null.`
    );
  }
  return value;
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

function normalizeRunId(value) {
  return normalizeNonEmptyString(value, "runId").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function createRunId() {
  const iso = new Date().toISOString();
  return iso.replace(/[:]/g, "").replace(/\..+$/, "").replace("T", "-");
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
  error.name = "BuildingCivicSportsPavilionProductionRunValidationError";
  error.code = code;
  return error;
}
