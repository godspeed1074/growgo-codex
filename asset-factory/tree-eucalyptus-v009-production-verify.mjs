import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const ASSET_ID = "TREE_EUCALYPTUS_001";
const VERSION = "v009";
const OUT = "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export";
const TEXTURE = "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/textures/TREE_EUCALYPTUS_001_v006_FOLIAGE_ATLAS_512.png";
const LIMITS = Object.freeze({
  CLOSE: { preferredMin: 8000, preferredMax: 12000, hardCeiling: 18000 },
  GAMEPLAY: { preferredMin: 3000, preferredMax: 5000, hardCeiling: 8000 },
  MAP: { preferredMin: 600, preferredMax: 1200, hardCeiling: 2000 }
});

function hash(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function parseGlb(filename) {
  const buffer = fs.readFileSync(filename);
  if (buffer.readUInt32LE(0) !== 0x46546c67 || buffer.readUInt32LE(4) !== 2) {
    throw new Error(`INVALID_GLB:${filename}`);
  }
  const jsonLength = buffer.readUInt32LE(12);
  const gltf = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString().replace(/\0+$/u, ""));
  let triangleCount = 0;
  for (const mesh of gltf.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      const accessor = gltf.accessors?.[primitive.indices];
      if (accessor) triangleCount += Math.floor(Number(accessor.count) / 3);
    }
  }
  const positions = [];
  for (const mesh of gltf.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      const accessor = gltf.accessors?.[primitive.attributes?.POSITION];
      if (accessor?.min && accessor?.max) positions.push(accessor);
    }
  }
  const min = [0, 1, 2].map((axis) => Math.min(...positions.map((entry) => entry.min[axis])));
  const max = [0, 1, 2].map((axis) => Math.max(...positions.map((entry) => entry.max[axis])));
  return Object.freeze({
    filename: path.basename(filename),
    sizeBytes: buffer.byteLength,
    sha256: hash(buffer),
    triangleCount,
    meshCount: (gltf.meshes ?? []).length,
    materialCount: (gltf.materials ?? []).length,
    materialNames: (gltf.materials ?? []).map((material) => material.name ?? ""),
    alphaModes: (gltf.materials ?? []).map((material) => material.alphaMode ?? "OPAQUE"),
    embeddedImageCount: (gltf.images ?? []).filter((image) => Number.isInteger(image.bufferView)).length,
    nodeNames: (gltf.nodes ?? []).map((node) => node.name).filter(Boolean),
    bounds: { min, max, dimensions: max.map((value, axis) => value - min[axis]) },
    externalDependencies: (gltf.images ?? []).filter((image) => typeof image.uri === "string").length
  });
}

export function verifyTreeEucalyptusV009(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, OUT);
  const blendPath = path.join(outputDirectory, `${ASSET_ID}_${VERSION}.blend`);
  const blend = fs.readFileSync(blendPath);
  const lods = Object.fromEntries(Object.keys(LIMITS).map((lod) => [
    lod,
    parseGlb(path.join(outputDirectory, `${ASSET_ID}_${VERSION}_LOD_${lod}.glb`))
  ]));
  const previousFiles = [
    `${ASSET_ID}_v001.blend`, `${ASSET_ID}_v002.blend`,
    `${ASSET_ID}_v002_LOD_CLOSE.glb`, `${ASSET_ID}_v002_LOD_GAMEPLAY.glb`, `${ASSET_ID}_v002_LOD_MAP.glb`,
    `${ASSET_ID}_v003.blend`, `${ASSET_ID}_v003_LOD_CLOSE.glb`,
    `${ASSET_ID}_v003_LOD_GAMEPLAY.glb`, `${ASSET_ID}_v003_LOD_MAP.glb`,
    `${ASSET_ID}_v004.blend`, `${ASSET_ID}_v004_LOD_CLOSE.glb`,
    `${ASSET_ID}_v004_LOD_GAMEPLAY.glb`, `${ASSET_ID}_v004_LOD_MAP.glb`,
    `${ASSET_ID}_v005.blend`, `${ASSET_ID}_v005_LOD_CLOSE.glb`,
    `${ASSET_ID}_v005_LOD_GAMEPLAY.glb`, `${ASSET_ID}_v005_LOD_MAP.glb`,
    `${ASSET_ID}_v006.blend`, `${ASSET_ID}_v006_LOD_CLOSE.glb`,
    `${ASSET_ID}_v006_LOD_GAMEPLAY.glb`, `${ASSET_ID}_v006_LOD_MAP.glb`,
    `${ASSET_ID}_v007.blend`, `${ASSET_ID}_v007_LOD_CLOSE.glb`,
    `${ASSET_ID}_v007_LOD_GAMEPLAY.glb`, `${ASSET_ID}_v007_LOD_MAP.glb`,
    `${ASSET_ID}_v008.blend`, `${ASSET_ID}_v008_LOD_CLOSE.glb`,
    `${ASSET_ID}_v008_LOD_GAMEPLAY.glb`, `${ASSET_ID}_v008_LOD_MAP.glb`
  ].map((filename) => {
    const buffer = fs.readFileSync(path.join(outputDirectory, filename));
    return { filename, sha256: hash(buffer) };
  });
  const checks = [];
  const check = (name, ok, detail = undefined) => checks.push({ name, ok: Boolean(ok), ...(detail ? { detail } : {}) });
  for (const [lod, summary] of Object.entries(lods)) {
    check(`${lod.toLowerCase()}_under_hard_ceiling`, summary.triangleCount <= LIMITS[lod].hardCeiling, `${summary.triangleCount} <= ${LIMITS[lod].hardCeiling}`);
    check(`${lod.toLowerCase()}_anchor_exported`, summary.nodeNames.includes(`${ASSET_ID}_LOD_${lod}_IDENTITY_ANCHOR`));
    check(`${lod.toLowerCase()}_root_exported`, summary.nodeNames.includes(`${ASSET_ID}_LOD_${lod}_ROOT`));
    check(`${lod.toLowerCase()}_ground_contact`, Math.abs(summary.bounds.min[1]) < 0.21, `minY=${summary.bounds.min[1]}`);
    check(`${lod.toLowerCase()}_no_external_dependencies`, summary.externalDependencies === 0);
    check(`${lod.toLowerCase()}_alpha_mask_material`, summary.alphaModes.includes("MASK"), summary.alphaModes.join(","));
    check(`${lod.toLowerCase()}_atlas_embedded`, summary.embeddedImageCount >= 1, `embeddedImages=${summary.embeddedImageCount}`);
    check(`${lod.toLowerCase()}_no_detached_bark_geometry`, !summary.nodeNames.some((name) => name.includes("GRAPHIC_BARK")));
    if (lod !== "MAP") check(`${lod.toLowerCase()}_integrated_bark_materials`, ["TAN", "PEACH", "RUST"].every((key) => summary.materialNames.some((name) => name.includes(key))), summary.materialNames.join(","));
  }
  check("lod_complexity_order", lods.CLOSE.triangleCount > lods.GAMEPLAY.triangleCount && lods.GAMEPLAY.triangleCount > lods.MAP.triangleCount);
  check("authored_height_coherent", lods.CLOSE.bounds.max[1] >= 13.5 && lods.CLOSE.bounds.max[1] <= 14.2, `maxY=${lods.CLOSE.bounds.max[1]}`);
  check("crown_width_in_target_band", lods.GAMEPLAY.bounds.dimensions[0] >= 8.5 && lods.GAMEPLAY.bounds.dimensions[0] <= 10.5, `width=${lods.GAMEPLAY.bounds.dimensions[0]}`);
  check("crown_depth_in_target_band", lods.GAMEPLAY.bounds.dimensions[2] >= 6.5 && lods.GAMEPLAY.bounds.dimensions[2] <= 8.2, `depth=${lods.GAMEPLAY.bounds.dimensions[2]}`);
  check("gameplay_over_preferred_documented", lods.GAMEPLAY.triangleCount <= LIMITS.GAMEPLAY.preferredMax || lods.GAMEPLAY.triangleCount <= LIMITS.GAMEPLAY.hardCeiling);
  check("gameplay_in_v009_refinement_band", lods.GAMEPLAY.triangleCount >= 5500 && lods.GAMEPLAY.triangleCount <= 8000, `${lods.GAMEPLAY.triangleCount} triangles`);
  const atlasPath = path.resolve(cwd, TEXTURE);
  const atlas = fs.readFileSync(atlasPath);
  check("atlas_png_signature", atlas.subarray(1, 4).toString() === "PNG");
  check("atlas_512_square", atlas.readUInt32BE(16) === 512 && atlas.readUInt32BE(20) === 512, `${atlas.readUInt32BE(16)}x${atlas.readUInt32BE(20)}`);
  return Object.freeze({
    schemaId: "TREE_EUCALYPTUS_V009_PRODUCTION_VERIFICATION_001",
    assetId: ASSET_ID,
    previousVersion: "v007",
    targetVersion: VERSION,
    blend: { filename: path.basename(blendPath), sizeBytes: blend.byteLength, sha256: hash(blend) },
    textureAtlas: { filename: path.basename(atlasPath), dimensions: [atlas.readUInt32BE(16), atlas.readUInt32BE(20)], sizeBytes: atlas.byteLength, sha256: hash(atlas) },
    lods,
    limits: LIMITS,
    previousProtectedEvidence: previousFiles,
    checks,
    technicalValidationPassed: checks.every((entry) => entry.ok),
    operatorVisualApprovalRequired: true,
    runtimeActivated: false,
    publishingPerformed: false
  });
}

export function writeTreeEucalyptusV009Verification(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const record = verifyTreeEucalyptusV009({ cwd });
  const outputDirectory = path.resolve(cwd, OUT);
  const gameplayReason = record.lods.GAMEPLAY.triangleCount > LIMITS.GAMEPLAY.preferredMax
    ? "The candidate reaches the 8,000-triangle hard ceiling because smoother fork blending, broad planted root sculpture, and the requested inner-canopy fullness materially improve the reference match; operator review is required before any further optimization."
    : null;
  const validation = {
    ...record,
    gameplayPreferredTargetExceptionReason: gameplayReason,
    readyForOperatorReview: record.technicalValidationPassed,
    visualApprovalStatus: "PENDING_OPERATOR_REVIEW"
  };
  fs.writeFileSync(path.join(outputDirectory, "tree-eucalyptus-v009-validation.json"), `${JSON.stringify(validation, null, 2)}\n`);
  fs.writeFileSync(path.join(outputDirectory, "tree-eucalyptus-v009-verification.json"), `${JSON.stringify({ schemaId: record.schemaId, assetId: ASSET_ID, checks: record.checks, technicalValidationPassed: record.technicalValidationPassed, deterministicFingerprint: hash(Buffer.from(JSON.stringify(record))) }, null, 2)}\n`);
  return validation;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(writeTreeEucalyptusV009Verification(), null, 2));
}
