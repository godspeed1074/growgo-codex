import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sourceVerificationPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/source/coastal-rock-cluster-source-verification.json"
);
const exportValidationPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/validation/coastal-rock-cluster-export-validation.json"
);
const exportManifestPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/coastal-rock-cluster-export-manifest.json"
);
const exportRoot = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export"
);

function parseGlbJson(filename) {
  const data = fs.readFileSync(path.join(exportRoot, filename));
  assert.equal(data.subarray(0, 4).toString("utf8"), "glTF");
  const jsonLength = data.readUInt32LE(12);
  assert.equal(data.subarray(16, 20).toString("utf8"), "JSON");
  return JSON.parse(
    data
      .subarray(20, 20 + jsonLength)
      .toString("utf8")
      .replace(/\u0000+$/, "")
  );
}

test("rock cluster source verification still records the unchanged canonical source blend", () => {
  const sourceVerification = JSON.parse(
    fs.readFileSync(sourceVerificationPath, "utf8")
  );

  assert.equal(sourceVerification.assetId, "COASTAL_ROCK_CLUSTER_001");
  assert.equal(sourceVerification.version, "v001");
  assert.equal(
    sourceVerification.sourceBlend.sha256,
    "63eff4636ee2b5e4f26522ac443cf586e9f597d8d9964f0f49f52776d9afc471"
  );
});

test("rock cluster export validation records exported glbs and lod ordering", () => {
  const exportValidation = JSON.parse(
    fs.readFileSync(exportValidationPath, "utf8")
  );

  assert.equal(exportValidation.assetId, "COASTAL_ROCK_CLUSTER_001");
  assert.equal(exportValidation.version, "v001");
  assert.equal(exportValidation.exportStatus, "VERIFIED_COMPLETE");
  assert.equal(exportValidation.lodOrdering.passed, true);
  assert.deepEqual(
    exportValidation.files.map((entry) => entry.filename),
    [
      "COASTAL_ROCK_CLUSTER_001_LOD_CLOSE.glb",
      "COASTAL_ROCK_CLUSTER_001_LOD_GAMEPLAY.glb",
      "COASTAL_ROCK_CLUSTER_001_LOD_MAP.glb"
    ]
  );
  for (const file of exportValidation.files) {
    assert.equal(file.metadataPreserved, true);
    assert.equal(file.assetIdentityPreserved, true);
    assert.equal(file.recipeIdentityPreserved, true);
    assert.equal(file.dependencyIdentityPreserved, true);
    assert.equal(file.anchorIdentityPreserved, true);
    assert.equal(file.hasExternalDependencies, false);
  }
});

test("rock cluster export manifest matches recorded validation metrics", () => {
  const exportValidation = JSON.parse(
    fs.readFileSync(exportValidationPath, "utf8")
  );
  const exportManifest = JSON.parse(
    fs.readFileSync(exportManifestPath, "utf8")
  );

  assert.equal(exportManifest.version, "v001");
  assert.equal(exportManifest.outputs.close.triangleCount, 129);
  assert.equal(exportManifest.outputs.gameplay.triangleCount, 97);
  assert.equal(exportManifest.outputs.map.triangleCount, 65);
  assert.equal(
    exportValidation.exportManifest.deterministicFingerprint,
    exportManifest.deterministicFingerprint
  );
});

test("rock cluster glbs preserve per-lod anchors and have no external dependencies", () => {
  const expectations = [
    [
      "COASTAL_ROCK_CLUSTER_001_LOD_CLOSE.glb",
      "COASTAL_ROCK_CLUSTER_001_LOD_CLOSE_IDENTITY_ANCHOR",
      9
    ],
    [
      "COASTAL_ROCK_CLUSTER_001_LOD_GAMEPLAY.glb",
      "COASTAL_ROCK_CLUSTER_001_LOD_GAMEPLAY_IDENTITY_ANCHOR",
      7
    ],
    [
      "COASTAL_ROCK_CLUSTER_001_LOD_MAP.glb",
      "COASTAL_ROCK_CLUSTER_001_LOD_MAP_IDENTITY_ANCHOR",
      5
    ]
  ];

  for (const [filename, anchorName, primitiveCount] of expectations) {
    const payload = parseGlbJson(filename);
    const blob = JSON.stringify(payload);
    assert.match(blob, /COASTAL_ROCK_CLUSTER_001/);
    assert.match(blob, /COASTAL_ROCK_CLUSTER_RECIPE_001/);
    assert.match(blob, new RegExp(anchorName));
    for (const dependencyId of [
      "MOD_ROCK_CLUSTER_CORE_COASTAL_001",
      "MOD_ROCK_CLUSTER_DETAIL_COASTAL_001",
      "MOD_ROCK_CLUSTER_GROUND_SOCKET_COASTAL_001"
    ]) {
      assert.match(blob, new RegExp(dependencyId));
    }
    const countedPrimitives = (payload.meshes || []).reduce(
      (count, mesh) => count + ((mesh.primitives || []).length),
      0
    );
    assert.equal(countedPrimitives, primitiveCount);
    assert.equal(
      (payload.buffers || []).some((buffer) => buffer.uri && !buffer.uri.startsWith("data:")),
      false
    );
  }
});
