import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const PREVIOUS_VERSION = "v001";
const TARGET_VERSION = "v002";
const OUTPUT_DIRECTORY =
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
  return Object.freeze(value);
}

export function verifyTreeEucalyptusV002(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, OUTPUT_DIRECTORY);
  const files = [
    "TREE_EUCALYPTUS_001_v002.blend",
    "TREE_EUCALYPTUS_001_v002_LOD_CLOSE.glb",
    "TREE_EUCALYPTUS_001_v002_LOD_GAMEPLAY.glb",
    "TREE_EUCALYPTUS_001_v002_LOD_MAP.glb"
  ].map((filename) => inspectFile(path.join(outputDirectory, filename)));

  const v001Metadata = readJson(path.join(outputDirectory, "tree-eucalyptus-metadata.json"));
  const v002Metadata = readJson(
    path.join(outputDirectory, "tree-eucalyptus-v002-metadata.json")
  );
  const glbSummaries = files.filter((entry) => entry.filename.endsWith(".glb"));
  const gameplay = glbSummaries.find((entry) =>
    entry.filename.endsWith("_LOD_GAMEPLAY.glb")
  );
  const close = glbSummaries.find((entry) => entry.filename.endsWith("_LOD_CLOSE.glb"));
  const map = glbSummaries.find((entry) => entry.filename.endsWith("_LOD_MAP.glb"));
  const comparisons = [
    comparison(
      "blend_geometry_hash_changed",
      fileHash(path.join(outputDirectory, "TREE_EUCALYPTUS_001_v001.blend")) !==
        fileHash(path.join(outputDirectory, "TREE_EUCALYPTUS_001_v002.blend"))
    ),
    comparison(
      "gameplay_geometry_hash_changed",
      fileHash(path.join(outputDirectory, "TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb")) !==
        fileHash(path.join(outputDirectory, "TREE_EUCALYPTUS_001_v002_LOD_GAMEPLAY.glb"))
    ),
    comparison("asset_identity_unchanged", v001Metadata.assetId === v002Metadata.assetId),
    comparison(
      "recipe_identity_unchanged",
      v001Metadata.recipeReference === v002Metadata.recipeReference
    ),
    comparison(
      "version_change_recorded",
      v002Metadata.previousRegisteredVersion === PREVIOUS_VERSION &&
        v002Metadata.targetRevisionVersion === TARGET_VERSION &&
        v002Metadata.identityContractV2.version === TARGET_VERSION
    ),
    comparison(
      "lod_complexity_order_valid",
      Number(close?.triangleCount ?? 0) >= Number(gameplay?.triangleCount ?? 0) &&
        Number(gameplay?.triangleCount ?? 0) >= Number(map?.triangleCount ?? 0)
    ),
    comparison(
      "material_assignment_valid",
      glbSummaries.every((entry) => Number(entry.materialCount ?? 0) >= 3)
    )
  ];

  return deepFreeze({
    schemaId: "TREE_EUCALYPTUS_V002_PRODUCTION_VERIFICATION_001",
    assetId: "TREE_EUCALYPTUS_001",
    previousVersion: PREVIOUS_VERSION,
    targetVersion: TARGET_VERSION,
    outputDirectory,
    files,
    comparisons: deepFreeze(comparisons),
    readyForOperatorReview: comparisons.every((entry) => entry.ok === true)
  });
}

export function writeTreeEucalyptusV002Verification(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const verification = verifyTreeEucalyptusV002({ cwd });
  const outputDirectory = verification.outputDirectory;
  const validationRecord = deepFreeze({
    schemaId: "TREE_EUCALYPTUS_V002_VALIDATION_001",
    assetId: verification.assetId,
    previousRegisteredVersion: PREVIOUS_VERSION,
    targetRevisionVersion: TARGET_VERSION,
    finalBlendExists: verification.files.some(
      (entry) => entry.filename === "TREE_EUCALYPTUS_001_v002.blend"
    ),
    finalGlbsGenerated:
      verification.files.filter((entry) => entry.filename.endsWith(".glb")).length === 3,
    geometryVersionChangeDetected: verification.comparisons
      .filter((entry) => entry.name.includes("geometry_hash_changed"))
      .every((entry) => entry.ok),
    identityUnchanged: verification.comparisons
      .filter((entry) => entry.name.includes("identity_unchanged"))
      .every((entry) => entry.ok),
    versionChangeRecordedCorrectly:
      verification.comparisons.find((entry) => entry.name === "version_change_recorded")?.ok ===
      true,
    lodComplexityVerified:
      verification.comparisons.find((entry) => entry.name === "lod_complexity_order_valid")?.ok ===
      true,
    materialAssignmentsVerified:
      verification.comparisons.find((entry) => entry.name === "material_assignment_valid")?.ok ===
      true,
    readyForOperatorReview: verification.readyForOperatorReview,
    runtimeActivated: false,
    publishingPerformed: false,
    files: verification.files
  });
  const report = deepFreeze({
    schemaId: verification.schemaId,
    assetId: verification.assetId,
    previousVersion: verification.previousVersion,
    targetVersion: verification.targetVersion,
    comparisons: verification.comparisons,
    readyForOperatorReview: verification.readyForOperatorReview,
    deterministicFingerprint: createHash("sha256")
      .update(JSON.stringify(verification))
      .digest("hex")
  });
  fs.writeFileSync(
    path.join(outputDirectory, "tree-eucalyptus-v002-validation.json"),
    `${JSON.stringify(validationRecord, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(outputDirectory, "tree-eucalyptus-v002-verification.json"),
    `${JSON.stringify(report, null, 2)}\n`
  );
  return { validationRecord, report, verification };
}

function inspectFile(filename) {
  const buffer = fs.readFileSync(filename);
  const entry = {
    filename: path.basename(filename),
    sizeBytes: buffer.byteLength,
    sha256: createHash("sha256").update(buffer).digest("hex")
  };
  if (!filename.endsWith(".glb")) {
    return deepFreeze(entry);
  }
  const parsed = parseBinaryGlb(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  );
  return deepFreeze({
    ...entry,
    meshCount: parsed.meshCount,
    primitiveCount: parsed.primitiveCount,
    triangleCount: parsed.triangleCount,
    materialCount: parsed.materialCount
  });
}

function parseBinaryGlb(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  if (
    view.getUint32(0, true) !== 0x46546c67 ||
    view.getUint32(4, true) !== 2 ||
    view.getUint32(8, true) !== arrayBuffer.byteLength
  ) {
    throw new Error("INVALID_GLB_HEADER");
  }
  const jsonChunkLength = view.getUint32(12, true);
  const jsonBytes = new Uint8Array(arrayBuffer, 20, jsonChunkLength);
  const jsonText = new TextDecoder("utf-8").decode(jsonBytes).replace(/\0+$/u, "");
  const gltf = JSON.parse(jsonText);
  const meshes = Array.isArray(gltf.meshes) ? gltf.meshes : [];
  const materials = Array.isArray(gltf.materials) ? gltf.materials : [];
  const accessors = Array.isArray(gltf.accessors) ? gltf.accessors : [];
  let primitiveCount = 0;
  let triangleCount = 0;
  for (const mesh of meshes) {
    const primitives = Array.isArray(mesh?.primitives) ? mesh.primitives : [];
    primitiveCount += primitives.length;
    for (const primitive of primitives) {
      const accessorIndex = primitive?.indices;
      if (Number.isInteger(accessorIndex) && accessors[accessorIndex]) {
        triangleCount += Math.floor(Number(accessors[accessorIndex].count ?? 0) / 3);
      }
    }
  }
  return {
    meshCount: meshes.length,
    primitiveCount,
    triangleCount,
    materialCount: materials.length
  };
}

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function fileHash(filename) {
  return createHash("sha256").update(fs.readFileSync(filename)).digest("hex");
}

function comparison(name, ok) {
  return deepFreeze({ name, ok });
}
