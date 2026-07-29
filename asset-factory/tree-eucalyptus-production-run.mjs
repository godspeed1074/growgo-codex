import fs from "node:fs";
import path from "node:path";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import {
  buildAssetIdentityContract,
  inspectExportedGlbIdentityByPath
} from "./asset-identity-contract.mjs";
import {
  natureAssetPackRecords,
  natureAssetPackRecipes
} from "./asset-registry.mjs";
import { treeEucalyptusPrototypeAssetPackageDefinition } from "./tree-eucalyptus-prototype-asset-package.mjs";

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

export const treeEucalyptusProductionRunDefinition = deepFreeze({
  assetId: "TREE_EUCALYPTUS_001",
  sourceRecipeId: "TREE_EUCALYPTUS_RECIPE_001",
  registryRecipeId: "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001",
  assetFamilyId: "TREE_ASSET_FAMILY_001",
  productionFamilyId: "COASTAL_NATURE_FAMILY_001",
  category: "nature",
  blenderVersion: "Blender 4.2 LTS",
  generationScriptLocation:
    "asset-factory/local-blender-scripts/generate_tree_eucalyptus_001.py",
  resumeScriptLocation:
    "asset-factory/local-blender-scripts/resume_tree_eucalyptus_001_exports.py",
  verifierScriptLocation: "asset-factory/tree-eucalyptus-post-run-verify.mjs",
  outputLocation:
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export",
  expectedOutputs: deepFreeze({
    blend: "TREE_EUCALYPTUS_001_v001.blend",
    proofAssets: deepFreeze([
      "TREE_EUCALYPTUS_001_LOD_CLOSE.glb",
      "TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb",
      "TREE_EUCALYPTUS_001_LOD_MAP.glb"
    ]),
    metadataFiles: deepFreeze([
      "tree-eucalyptus-manifest.json",
      "tree-eucalyptus-metadata.json",
      "tree-eucalyptus-validation.json"
    ]),
    legacyOutputs: deepFreeze(["TREE_EUCALYPTUS_001_LOD_DISTANT_SILHOUETTE.glb"])
  }),
  completionMarkers: deepFreeze({
    generationStart: "S184_TREE_EUCALYPTUS_GENERATION_START",
    generationReady: "S184_TREE_EUCALYPTUS_GENERATION_READY_FOR_SAVE",
    generationComplete: "S184_TREE_EUCALYPTUS_GENERATION_COMPLETE",
    exportStart: "S184_TREE_EUCALYPTUS_EXPORT_START",
    exportComplete: "S184_TREE_EUCALYPTUS_EXPORT_COMPLETE",
    exportSkipPrefix: "S184_TREE_EUCALYPTUS_EXPORT_SKIP:",
    exportFailurePrefix: "S184_TREE_EUCALYPTUS_EXPORT_FAILURE:"
  }),
  paletteSlots: deepFreeze([
    "trunk",
    "branch",
    "canopy light",
    "canopy mid",
    "canopy dark"
  ]),
  variants: deepFreeze(["windswept", "upright", "young_cluster"]),
  atlasCompatibilityRules: deepFreeze([
    "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001",
    "RECIPE_NATURE_PARK_STANDARD_001",
    "RECIPE_NATURE_FOREST_ENVIRONMENT_STANDARD_001"
  ]),
  reusedSharedModules: deepFreeze([
    "TREE_EUCALYPTUS_TRUNK_001",
    "TREE_BRANCH_SMALL_001",
    "TREE_BRANCH_LARGE_001",
    "TREE_CANOPY_EUCALYPTUS_001",
    "TREE_LEAF_CLUSTER_001",
    "TREE_EUCALYPTUS_GROUND_SOCKET_001",
    "TREE_EUCALYPTUS_LANDSCAPE_SOCKET_001",
    "shared_nature_material",
    "shared_atlas_mobile_ready",
    "LOD_CLOSE",
    "LOD_GAMEPLAY",
    "LOD_MAP"
  ]),
  missingReusableModules: deepFreeze([
    "TREE_EUCALYPTUS_VARIANT_BENT_COASTAL_001",
    "TREE_EUCALYPTUS_VARIANT_STREET_COMPACT_001",
    "TREE_EUCALYPTUS_VARIANT_RESERVE_TALL_001",
    "TREE_EUCALYPTUS_SOCKET_STANDARDISED_001"
  ]),
  targetReusePercentage: 75,
  noBlenderLaunchFromCodex: true
});

export function buildTreeEucalyptusProductionRun(
  rawDefinition = treeEucalyptusProductionRunDefinition
) {
  return normalizeDefinition(rawDefinition);
}

export function auditTreeEucalyptusExistingState(
  rawDefinition = treeEucalyptusProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const registryMatches = natureAssetPackRecords.filter(
    (record) => record.assetId === definition.assetId
  );
  const recipeMatches = natureAssetPackRecipes.filter(
    (record) => record.recipeId === definition.registryRecipeId
  );
  const prototypePackage = treeEucalyptusPrototypeAssetPackageDefinition;
  const expectedFiles = [
    definition.expectedOutputs.blend,
    ...definition.expectedOutputs.proofAssets,
    ...definition.expectedOutputs.metadataFiles,
    ...definition.expectedOutputs.legacyOutputs
  ];

  const fileStates = expectedFiles.map((filename) =>
    classifyOutputFile(
      path.join(outputDirectory, filename),
      filename,
      definition,
      { treatBlendAsRequired: false }
    )
  );

  return deepFreeze({
    assetId: definition.assetId,
    sourceRecipeId: definition.sourceRecipeId,
    registryRecipeId: definition.registryRecipeId,
    assetFamilyId: definition.assetFamilyId,
    productionFamilyId: definition.productionFamilyId,
    outputDirectory,
    registryIdentityPreserved: registryMatches.length === 1,
    duplicateRegistryEntriesDetected: registryMatches.length > 1,
    registryMatches: deepFreeze(registryMatches),
    recipeMatches: deepFreeze(recipeMatches),
    prototypePackage: deepFreeze({
      assetFamilyId: prototypePackage.assetSourceDefinition.assetFamilyId,
      recipeReference: prototypePackage.assetSourceDefinition.recipeReference,
      componentDefinitions:
        prototypePackage.geometryRequirements.componentDefinitions.map(
          (component) => component.componentId
        )
    }),
    fileStates: deepFreeze(fileStates),
    reuseAudit: deepFreeze({
      reusableModules: definition.reusedSharedModules,
      missingModules: definition.missingReusableModules,
      estimatedReusePercentage: definition.targetReusePercentage
    }),
    atlasCompatibilityRules: definition.atlasCompatibilityRules,
    variants: definition.variants
  });
}

export function verifyTreeEucalyptusOutputs(
  rawDefinition = treeEucalyptusProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const files = [
    classifyOutputFile(
      path.join(outputDirectory, definition.expectedOutputs.blend),
      definition.expectedOutputs.blend,
      definition
    ),
    ...definition.expectedOutputs.proofAssets.map((filename) =>
      classifyOutputFile(path.join(outputDirectory, filename), filename, definition)
    ),
    ...definition.expectedOutputs.metadataFiles.map((filename) =>
      classifyOutputFile(path.join(outputDirectory, filename), filename, definition)
    )
  ];

  const proofAssets = files.filter((entry) =>
    definition.expectedOutputs.proofAssets.includes(entry.filename)
  );
  const manifestState =
    readJsonIfPresent(path.join(outputDirectory, "tree-eucalyptus-manifest.json")) ?? null;
  const metadataState =
    readJsonIfPresent(path.join(outputDirectory, "tree-eucalyptus-metadata.json")) ?? null;
  const validationState =
    readJsonIfPresent(path.join(outputDirectory, "tree-eucalyptus-validation.json")) ?? null;
  const manifestConsistency = evaluateManifestConsistency(
    definition,
    manifestState,
    metadataState,
    validationState
  );
  const lodComplexity = evaluateEucalyptusLodComplexity(proofAssets);
  const blockers = collectRegistrationBlockers(
    definition,
    files,
    manifestConsistency,
    lodComplexity
  );

  return deepFreeze({
    outputDirectory,
    files: deepFreeze(files),
    manifestConsistency,
    lodComplexity,
    registrationGate: deepFreeze({
      ready: blockers.length === 0,
      blockers: deepFreeze(blockers)
    }),
    deterministicFingerprint: createHash("sha256")
      .update(JSON.stringify({ files, manifestConsistency, lodComplexity, blockers }))
      .digest("hex")
  });
}

function evaluateManifestConsistency(
  definition,
  manifestState,
  metadataState,
  validationState
) {
  const checks = [];

  checks.push({
    name: "manifest_asset_id",
    ok: manifestState?.assetId === definition.assetId
  });
  checks.push({
    name: "manifest_recipe_id",
    ok: manifestState?.recipeReference === definition.sourceRecipeId
  });
  checks.push({
    name: "metadata_asset_id",
    ok: metadataState?.assetId === definition.assetId
  });
  checks.push({
    name: "metadata_recipe_id",
    ok: metadataState?.recipeReference === definition.sourceRecipeId
  });
  checks.push({
    name: "validation_asset_id",
    ok: validationState?.assetId === definition.assetId
  });

  return deepFreeze({
    ok: checks.every((check) => check.ok),
    checks: deepFreeze(checks)
  });
}

function collectRegistrationBlockers(
  definition,
  files,
  manifestConsistency,
  lodComplexity
) {
  const blockers = [];
  for (const entry of files) {
    if (entry.classification !== "VERIFIED_COMPLETE") {
      blockers.push(`${entry.filename}:${entry.classification}`);
    }
  }

  if (!manifestConsistency.ok) {
    blockers.push("manifest_consistency_failed");
  }

  if (!lodComplexity.ok) {
    blockers.push("lod_complexity_failed");
  }

  const blendEntry = files.find(
    (entry) => entry.filename === definition.expectedOutputs.blend
  );
  if (!blendEntry || blendEntry.classification !== "VERIFIED_COMPLETE") {
    blockers.push("final_blend_missing_or_unverified");
  }

  return deepFreeze(Array.from(new Set(blockers)));
}

function evaluateEucalyptusLodComplexity(proofAssets) {
  const find = (namePart) =>
    proofAssets.find((entry) => entry.filename.includes(namePart)) ?? null;
  const close = find("LOD_CLOSE");
  const gameplay = find("LOD_GAMEPLAY");
  const map = find("LOD_MAP");

  const checks = [
    {
      name: "triangles_close_gt_gameplay",
      ok:
        Number.isFinite(close?.triangleCount) &&
        Number.isFinite(gameplay?.triangleCount) &&
        close.triangleCount > gameplay.triangleCount
    },
    {
      name: "triangles_gameplay_gt_map",
      ok:
        Number.isFinite(gameplay?.triangleCount) &&
        Number.isFinite(map?.triangleCount) &&
        gameplay.triangleCount > map.triangleCount
    },
    {
      name: "meshes_close_gte_gameplay",
      ok:
        Number.isFinite(close?.meshCount) &&
        Number.isFinite(gameplay?.meshCount) &&
        close.meshCount >= gameplay.meshCount
    },
    {
      name: "meshes_gameplay_gte_map",
      ok:
        Number.isFinite(gameplay?.meshCount) &&
        Number.isFinite(map?.meshCount) &&
        gameplay.meshCount >= map.meshCount
    }
  ];

  return deepFreeze({
    ok: checks.every((check) => check.ok),
    checks: deepFreeze(checks)
  });
}

function classifyOutputFile(filename, label, definition, options = {}) {
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
        sha256: sha256File(filename),
        detail: "JSON parsed successfully.",
        jsonKeys: Object.keys(payload).sort()
      });
    }

    if (extension === ".glb") {
      const parsed = inspectExportedGlbIdentityByPath(
        buildAssetIdentityContract({
          assetId: definition.assetId,
          recipeId: definition.sourceRecipeId,
          version: "1.0.0",
          category: definition.category.toUpperCase()
        }),
        filename
      );
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
        assetIdentityHits: parsed.namedIdentityHits,
        detail: parsed.detail
      });
    }

    if (extension === ".blend") {
      const parsed = parseBlendFile(
        filename,
        definition.assetId,
        definition.sourceRecipeId
      );
      return deepFreeze({
        filename: label,
        absolutePath: filename,
        classification:
          parsed.valid && parsed.assetIdentityPreserved && parsed.recipeIdentityPreserved
            ? "VERIFIED_COMPLETE"
            : options.treatBlendAsRequired === false && parsed.valid
              ? "PRESENT_UNVERIFIED"
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
    detail: valid
      ? "Blend header and embedded identity markers inspected."
      : "Blend header was not valid."
  });
}

function readJsonIfPresent(filename) {
  if (!fs.existsSync(filename)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function normalizeDefinition(rawDefinition) {
  const definition = rawDefinition ?? {};
  if (!definition.assetId || !definition.sourceRecipeId || !definition.outputLocation) {
    throw new Error("Tree eucalyptus production definition was incomplete.");
  }
  return deepFreeze({
    ...definition
  });
}

function sha256File(filename) {
  return createHash("sha256").update(fs.readFileSync(filename)).digest("hex");
}

function sha256Buffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}
