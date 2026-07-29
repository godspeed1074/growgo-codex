import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sourceVerificationPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/source/coastal-grass-tussock-source-verification.json"
);
const exportValidationPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/validation/coastal-grass-tussock-export-validation.json"
);
const exportManifestPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/coastal-grass-tussock-export-manifest.json"
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

test("coastal grass tussock source verification records the source facts", () => {
  const sourceVerification = JSON.parse(
    fs.readFileSync(sourceVerificationPath, "utf8")
  );

  assert.equal(sourceVerification.assetId, "COASTAL_GRASS_TUSSOCK_001");
  assert.equal(sourceVerification.version, "v001");
  assert.equal(
    sourceVerification.sourceBlend.filename,
    "COASTAL_GRASS_TUSSOCK_001_v001.blend"
  );
  assert.equal(sourceVerification.sourceIdentityVerification.assetIdentityMatches, true);
  assert.equal(sourceVerification.sourceIdentityVerification.identityAnchorsPresent, true);
  assert.equal(
    sourceVerification.sourceIdentityVerification.universalExporterCompatible,
    true
  );
  assert.equal(
    sourceVerification.sourceIdentityVerification.sourceBlendModifiedDuringExport,
    false
  );
});

test("coastal grass tussock export validation records exported glbs and lod ordering", () => {
  const exportValidation = JSON.parse(
    fs.readFileSync(exportValidationPath, "utf8")
  );

  assert.equal(exportValidation.assetId, "COASTAL_GRASS_TUSSOCK_001");
  assert.equal(exportValidation.version, "v001");
  assert.equal(exportValidation.exportStatus, "VERIFIED_COMPLETE");
  assert.equal(exportValidation.lodOrdering.passed, true);
  assert.deepEqual(
    exportValidation.files.map((entry) => entry.filename),
    [
      "COASTAL_GRASS_TUSSOCK_001_LOD_CLOSE.glb",
      "COASTAL_GRASS_TUSSOCK_001_LOD_GAMEPLAY.glb",
      "COASTAL_GRASS_TUSSOCK_001_LOD_MAP.glb"
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

test("coastal grass tussock export manifest matches recorded validation metrics", () => {
  const exportValidation = JSON.parse(
    fs.readFileSync(exportValidationPath, "utf8")
  );
  const exportManifest = JSON.parse(
    fs.readFileSync(exportManifestPath, "utf8")
  );

  assert.equal(exportManifest.version, "v001");
  assert.equal(exportManifest.outputs.close.triangleCount, 133);
  assert.equal(exportManifest.outputs.gameplay.triangleCount, 89);
  assert.equal(exportManifest.outputs.map.triangleCount, 65);
  assert.equal(
    exportValidation.exportManifest.deterministicFingerprint,
    exportManifest.deterministicFingerprint
  );
});

test("coastal grass tussock glbs preserve identity anchors and have no external dependencies", () => {
  const expectations = [
    [
      "COASTAL_GRASS_TUSSOCK_001_LOD_CLOSE.glb",
      "COASTAL_GRASS_TUSSOCK_001_LOD_CLOSE_IDENTITY_ANCHOR",
      10
    ],
    [
      "COASTAL_GRASS_TUSSOCK_001_LOD_GAMEPLAY.glb",
      "COASTAL_GRASS_TUSSOCK_001_LOD_GAMEPLAY_IDENTITY_ANCHOR",
      7
    ],
    [
      "COASTAL_GRASS_TUSSOCK_001_LOD_MAP.glb",
      "COASTAL_GRASS_TUSSOCK_001_LOD_MAP_IDENTITY_ANCHOR",
      5
    ]
  ];

  for (const [filename, anchorName, primitiveCount] of expectations) {
    const payload = parseGlbJson(filename);
    const blob = JSON.stringify(payload);
    assert.match(blob, /COASTAL_GRASS_TUSSOCK_001/);
    assert.match(blob, /COASTAL_GRASS_TUSSOCK_RECIPE_001/);
    assert.match(blob, new RegExp(anchorName));
    for (const dependencyId of [
      "MOD_GRASS_BLADE_TUSSOCK_001",
      "MOD_GRASS_TUFT_CLUSTER_001",
      "MOD_GRASS_GROUND_SOCKET_COASTAL_001"
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
