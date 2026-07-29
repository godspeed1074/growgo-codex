import fs from "node:fs";
import path from "node:path";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";

import {
  buildAssetIdentityContract,
  inspectExportedGlbIdentityByPath
} from "./asset-identity-contract.mjs";
import {
  buildTreeBottlebrushProductionSetup,
  treeBottlebrushProductionSetupDefinition
} from "./tree-bottlebrush-production-setup.mjs";

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

const bottlebrushSetup = buildTreeBottlebrushProductionSetup();

export const treeBottlebrushProductionRunDefinition = deepFreeze({
  assetId: treeBottlebrushProductionSetupDefinition.assetId,
  sourceRecipeId: treeBottlebrushProductionSetupDefinition.recipeId,
  registryRecipeId: treeBottlebrushProductionSetupDefinition.registryRecipeId,
  assetFamilyId: treeBottlebrushProductionSetupDefinition.assetFamilyId,
  productionFamilyId: treeBottlebrushProductionSetupDefinition.productionFamilyId,
  category: treeBottlebrushProductionSetupDefinition.category,
  version: treeBottlebrushProductionSetupDefinition.version,
  variantId: treeBottlebrushProductionSetupDefinition.variantId,
  paletteId: treeBottlebrushProductionSetupDefinition.paletteId,
  lodProfile: treeBottlebrushProductionSetupDefinition.lodProfile,
  blenderVersion: treeBottlebrushProductionSetupDefinition.blenderVersion,
  generationScriptLocation:
    treeBottlebrushProductionSetupDefinition.placeholderScripts.generator,
  resumeScriptLocation:
    treeBottlebrushProductionSetupDefinition.placeholderScripts.exportResume,
  verifierScriptLocation: "asset-factory/tree-bottlebrush-post-run-verify.mjs",
  outputLocation: treeBottlebrushProductionSetupDefinition.outputLocation,
  expectedOutputs: deepFreeze({
    blend: treeBottlebrushProductionSetupDefinition.expectedOutputs.blend,
    proofAssets:
      treeBottlebrushProductionSetupDefinition.expectedOutputs.proofAssets,
    metadataFiles:
      treeBottlebrushProductionSetupDefinition.expectedOutputs.metadataFiles,
    lifecycleFiles:
      treeBottlebrushProductionSetupDefinition.expectedOutputs.lifecycleFiles
  }),
  reusableDependencies:
    treeBottlebrushProductionSetupDefinition.reusableDependencies,
  identityContract: bottlebrushSetup.identityContract
});

export function buildTreeBottlebrushProductionRun(
  rawDefinition = treeBottlebrushProductionRunDefinition
) {
  return normalizeDefinition(rawDefinition);
}

export function verifyTreeBottlebrushOutputs(
  rawDefinition = treeBottlebrushProductionRunDefinition,
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
  const [manifestFilename, metadataFilename, validationFilename] =
    definition.expectedOutputs.metadataFiles;
  const manifestState =
    readJsonIfPresent(path.join(outputDirectory, manifestFilename)) ?? null;
  const metadataState =
    readJsonIfPresent(path.join(outputDirectory, metadataFilename)) ?? null;
  const validationState =
    readJsonIfPresent(path.join(outputDirectory, validationFilename)) ?? null;
  const manifestConsistency = evaluateManifestConsistency(
    definition,
    manifestState,
    metadataState,
    validationState
  );
  const lodComplexity = evaluateLodComplexity(proofAssets);
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
    name: "manifest_expected_outputs",
    ok:
      JSON.stringify(manifestState?.expectedFinalOutputs ?? []) ===
      JSON.stringify(definition.expectedOutputs.proofAssets)
  });
  checks.push({
    name: "manifest_expected_blend",
    ok: manifestState?.expectedBlendFilename === definition.expectedOutputs.blend
  });
  checks.push({
    name: "manifest_version",
    ok:
      definition.version === "v001" ||
      manifestState?.targetRevisionVersion === definition.version
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
    name: "metadata_registry_recipe_id",
    ok: metadataState?.registryRecipeId === definition.registryRecipeId
  });
  checks.push({
    name: "metadata_palette_id",
    ok: metadataState?.identityContractV2?.paletteId === definition.paletteId
  });
  checks.push({
    name: "metadata_lod_profile",
    ok: metadataState?.identityContractV2?.lodProfile === definition.lodProfile
  });
  checks.push({
    name: "metadata_version",
    ok: metadataState?.identityContractV2?.version === definition.version
  });
  checks.push({
    name: "metadata_dependency_list",
    ok:
      JSON.stringify(
        (metadataState?.identityContractV2?.dependencies ?? []).map(
          (entry) => entry.dependencyId
        )
      ) ===
      JSON.stringify(
        definition.reusableDependencies.map((entry) => entry.dependencyId)
      )
  });
  checks.push({
    name: "validation_asset_id",
    ok: validationState?.assetId === definition.assetId
  });
  checks.push({
    name: "validation_identity_ready",
    ok: validationState?.identityMetadataReady === true
  });
  checks.push({
    name: "validation_version",
    ok:
      definition.version === "v001" ||
      validationState?.targetRevisionVersion === definition.version
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

function evaluateLodComplexity(proofAssets) {
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
    },
    {
      name: "primitives_close_gte_gameplay",
      ok:
        Number.isFinite(close?.primitiveCount) &&
        Number.isFinite(gameplay?.primitiveCount) &&
        close.primitiveCount >= gameplay.primitiveCount
    },
    {
      name: "primitives_gameplay_gte_map",
      ok:
        Number.isFinite(gameplay?.primitiveCount) &&
        Number.isFinite(map?.primitiveCount) &&
        gameplay.primitiveCount >= map.primitiveCount
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
      const parsed = inspectExportedGlbIdentityByPath(definition.identityContract, filename);
      const metadataHitBlob = parsed.metadataIdentityHits.join("\n");
      const expectedDependencyIds = definition.reusableDependencies.map(
        (entry) => entry.dependencyId
      );
      const dependencyHits = Array.isArray(parsed.dependencyIdentityHits)
        ? parsed.dependencyIdentityHits
        : [];
      const dependencyIdentityPreserved = expectedDependencyIds.every(
        (dependencyId) =>
          dependencyHits.some((hit) => hit.includes(dependencyId)) ||
          parsed.metadataIdentityHits.some((hit) => hit.includes(dependencyId))
      );
      const recipeIdentityPreserved = metadataHitBlob.includes(definition.sourceRecipeId);
      const metadataIdentityPreserved =
        recipeIdentityPreserved &&
        metadataHitBlob.includes(definition.assetId) &&
        metadataHitBlob.includes(definition.paletteId) &&
        metadataHitBlob.includes(definition.lodProfile);

      return deepFreeze({
        filename: label,
        absolutePath: filename,
        classification:
          parsed.valid &&
          parsed.assetIdentityPreserved &&
          parsed.anchorIdentityPreserved &&
          metadataIdentityPreserved &&
          dependencyIdentityPreserved &&
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
        recipeIdentityPreserved,
        metadataIdentityPreserved,
        anchorIdentityPreserved: parsed.anchorIdentityPreserved,
        dependencyIdentityPreserved,
        assetIdentityHits: parsed.namedIdentityHits,
        metadataIdentityHits: parsed.metadataIdentityHits,
        dependencyIdentityHits: parsed.dependencyIdentityHits,
        exportedIdentitySource: parsed.exportedIdentitySource,
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
    throw new Error("Tree bottlebrush production definition was incomplete.");
  }
  return deepFreeze({
    ...definition
  });
}

function sha256File(filename) {
  return createHash("sha256").update(fs.readFileSync(filename)).digest("hex");
}
