import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import {
  treeBottlebrushProductionRunDefinition,
  verifyTreeBottlebrushOutputs
} from "./tree-bottlebrush-production-run.mjs";

const PREVIOUS_VERSION = "v001";
const TARGET_VERSION = "v002";
const OUTPUT_DIRECTORY =
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export";
const VALIDATION_FILENAME = "tree-bottlebrush-v002-validation.json";
const REPORT_FILENAME = "tree-bottlebrush-v002-verification.json";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
  return Object.freeze(value);
}

export const treeBottlebrushV002VerificationDefinition = deepFreeze({
  ...treeBottlebrushProductionRunDefinition,
  version: TARGET_VERSION,
  expectedOutputs: deepFreeze({
    ...treeBottlebrushProductionRunDefinition.expectedOutputs,
    blend: "TREE_BOTTLEBRUSH_001_v002.blend",
    proofAssets: deepFreeze([
      "TREE_BOTTLEBRUSH_001_v002_LOD_CLOSE.glb",
      "TREE_BOTTLEBRUSH_001_v002_LOD_GAMEPLAY.glb",
      "TREE_BOTTLEBRUSH_001_v002_LOD_MAP.glb"
    ]),
    metadataFiles: deepFreeze([
      "tree-bottlebrush-v002-manifest.json",
      "tree-bottlebrush-v002-metadata.json",
      VALIDATION_FILENAME
    ])
  }),
  identityContract: deepFreeze({
    ...treeBottlebrushProductionRunDefinition.identityContract,
    version: TARGET_VERSION
  })
});

export function verifyTreeBottlebrushV002(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, OUTPUT_DIRECTORY);
  const packageVerification = verifyTreeBottlebrushOutputs(
    treeBottlebrushV002VerificationDefinition,
    { cwd }
  );
  const v001Metadata = readJson(
    path.join(outputDirectory, "tree-bottlebrush-metadata.json")
  );
  const v002Metadata = readJson(
    path.join(outputDirectory, "tree-bottlebrush-v002-metadata.json")
  );
  const comparisons = [
    comparison(
      "blend_geometry_hash_changed",
      fileHash(path.join(outputDirectory, "TREE_BOTTLEBRUSH_001_v001.blend")) !==
        fileHash(path.join(outputDirectory, "TREE_BOTTLEBRUSH_001_v002.blend"))
    ),
    comparison(
      "close_geometry_hash_changed",
      fileHash(path.join(outputDirectory, "TREE_BOTTLEBRUSH_001_LOD_CLOSE.glb")) !==
        fileHash(
          path.join(outputDirectory, "TREE_BOTTLEBRUSH_001_v002_LOD_CLOSE.glb")
        )
    ),
    comparison(
      "gameplay_geometry_hash_changed",
      fileHash(
        path.join(outputDirectory, "TREE_BOTTLEBRUSH_001_LOD_GAMEPLAY.glb")
      ) !==
        fileHash(
          path.join(outputDirectory, "TREE_BOTTLEBRUSH_001_v002_LOD_GAMEPLAY.glb")
        )
    ),
    comparison(
      "map_geometry_hash_changed",
      fileHash(path.join(outputDirectory, "TREE_BOTTLEBRUSH_001_LOD_MAP.glb")) !==
        fileHash(path.join(outputDirectory, "TREE_BOTTLEBRUSH_001_v002_LOD_MAP.glb"))
    ),
    comparison("asset_identity_unchanged", v001Metadata.assetId === v002Metadata.assetId),
    comparison(
      "recipe_identity_unchanged",
      v001Metadata.recipeReference === v002Metadata.recipeReference
    ),
    comparison(
      "dependency_identity_unchanged",
      JSON.stringify(dependencyIds(v001Metadata)) ===
        JSON.stringify(dependencyIds(v002Metadata))
    ),
    comparison(
      "metadata_identity_unchanged",
      metadataIdentity(v001Metadata) === metadataIdentity(v002Metadata)
    ),
    comparison(
      "version_change_recorded",
      v001Metadata.identityContractV2.version === PREVIOUS_VERSION &&
        v002Metadata.previousRegisteredVersion === PREVIOUS_VERSION &&
        v002Metadata.targetRevisionVersion === TARGET_VERSION &&
        v002Metadata.identityContractV2.version === TARGET_VERSION
    )
  ];
  const versionComparison = deepFreeze({
    ok: comparisons.every((entry) => entry.ok),
    previousVersion: PREVIOUS_VERSION,
    targetVersion: TARGET_VERSION,
    checks: deepFreeze(comparisons)
  });
  const readyToReplaceV001 =
    packageVerification.registrationGate.ready && versionComparison.ok;

  return deepFreeze({
    schemaId: "TREE_BOTTLEBRUSH_V002_PRODUCTION_VERIFICATION_001",
    assetId: treeBottlebrushV002VerificationDefinition.assetId,
    previousVersion: PREVIOUS_VERSION,
    targetVersion: TARGET_VERSION,
    outputDirectory,
    packageVerification,
    versionComparison,
    replacementReadiness: deepFreeze({
      readyToReplaceV001,
      registrationReplaced: false,
      visualApprovalReplaced: false,
      publishingPerformed: false,
      runtimeActivated: false
    })
  });
}

export function writeTreeBottlebrushV002Verification(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const verification = verifyTreeBottlebrushV002({ cwd });
  const outputDirectory = verification.outputDirectory;
  const validation = buildValidationRecord(verification);
  fs.writeFileSync(
    path.join(outputDirectory, VALIDATION_FILENAME),
    `${JSON.stringify(validation, null, 2)}\n`
  );
  const finalVerification = verifyTreeBottlebrushV002({ cwd });
  const report = buildVerificationReport(finalVerification);
  fs.writeFileSync(
    path.join(outputDirectory, REPORT_FILENAME),
    `${JSON.stringify(report, null, 2)}\n`
  );
  return deepFreeze({ validation, report, verification: finalVerification });
}

function buildValidationRecord(verification) {
  const files = verification.packageVerification.files;
  const glbs = files.filter((entry) => entry.filename.endsWith(".glb"));
  return deepFreeze({
    schemaId: "TREE_BOTTLEBRUSH_V002_VALIDATION_001",
    assetId: verification.assetId,
    previousRegisteredVersion: PREVIOUS_VERSION,
    targetRevisionVersion: TARGET_VERSION,
    identityContractSchemaId: "ASSET_IDENTITY_CONTRACT_PHASE_001_1",
    identityMetadataReady: true,
    sourceVerified: files[0]?.classification === "VERIFIED_COMPLETE",
    finalBlendExists: files[0]?.classification === "VERIFIED_COMPLETE",
    finalGlbsGenerated: glbs.length === 3,
    glbIdentityVerified: glbs.every(
      (entry) =>
        entry.assetIdentityPreserved &&
        entry.recipeIdentityPreserved &&
        entry.metadataIdentityPreserved &&
        entry.dependencyIdentityPreserved &&
        entry.anchorIdentityPreserved
    ),
    noExternalDependencies: glbs.every(
      (entry) => entry.hasExternalDependencies === false
    ),
    lodComplexityVerified: verification.packageVerification.lodComplexity.ok,
    geometryVersionChangeDetected: verification.versionComparison.checks
      .filter((entry) => entry.name.endsWith("_geometry_hash_changed"))
      .every((entry) => entry.ok),
    identityUnchanged: verification.versionComparison.checks
      .filter((entry) => entry.name.endsWith("_identity_unchanged"))
      .every((entry) => entry.ok),
    versionChangeRecordedCorrectly:
      verification.versionComparison.checks.find(
        (entry) => entry.name === "version_change_recorded"
      )?.ok === true,
    readyToReplaceV001: verification.replacementReadiness.readyToReplaceV001,
    registrationReplaced: false,
    visualApprovalReplaced: false,
    publishingPerformed: false,
    runtimeActivated: false,
    files: files
      .filter((entry) => entry.filename.endsWith(".blend") || entry.filename.endsWith(".glb"))
      .map((entry) => ({
        filename: entry.filename,
        sizeBytes: entry.sizeBytes,
        sha256: entry.sha256,
        classification: entry.classification,
        ...(entry.filename.endsWith(".glb")
          ? {
              meshCount: entry.meshCount,
              primitiveCount: entry.primitiveCount,
              triangleCount: entry.triangleCount,
              materialCount: entry.materialCount
            }
          : {})
      }))
  });
}

function buildVerificationReport(verification) {
  return deepFreeze({
    schemaId: verification.schemaId,
    assetId: verification.assetId,
    previousVersion: verification.previousVersion,
    targetVersion: verification.targetVersion,
    packageReady: verification.packageVerification.registrationGate.ready,
    packageBlockers: verification.packageVerification.registrationGate.blockers,
    lodComplexity: verification.packageVerification.lodComplexity,
    versionComparison: verification.versionComparison,
    replacementReadiness: verification.replacementReadiness,
    deterministicFingerprint:
      verification.packageVerification.deterministicFingerprint
  });
}

function comparison(name, ok) {
  return deepFreeze({ name, ok });
}

function dependencyIds(metadata) {
  return (metadata.identityContractV2?.dependencies ?? []).map(
    (entry) => entry.dependencyId
  );
}

function metadataIdentity(metadata) {
  const identity = metadata.identityContractV2;
  return JSON.stringify({
    assetId: identity.assetId,
    category: identity.category,
    recipeId: identity.recipeId,
    variantId: identity.variantId,
    paletteId: identity.paletteId,
    lodProfile: identity.lodProfile,
    source: identity.source,
    dependencies: identity.dependencies,
    identityPolicy: identity.identityPolicy,
    identityAnchor: identity.identityAnchor,
    anchorRequired: identity.anchorRequired,
    anchorValidation: identity.anchorValidation,
    exportedIdentitySource: identity.exportedIdentitySource
  });
}

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function fileHash(filename) {
  return createHash("sha256").update(fs.readFileSync(filename)).digest("hex");
}
