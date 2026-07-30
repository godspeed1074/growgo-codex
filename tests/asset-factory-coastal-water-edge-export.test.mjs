import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const exportValidationPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/validation/coastal-water-edge-export-validation.json"
);
const reportPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/reports/coastal-water-edge-export-verification-report.md"
);
const exportRoot = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export"
);

test("coastal water edge export validation records exported glbs and lod ordering", () => {
  const exportValidation = JSON.parse(fs.readFileSync(exportValidationPath, "utf8"));

  assert.equal(exportValidation.assetId, "COASTAL_WATER_EDGE_001");
  assert.equal(exportValidation.version, "v001");
  assert.equal(exportValidation.exportStatus, "VERIFIED_COMPLETE");
  assert.equal(
    exportValidation.sourceVerification.sourceBlendRelativePath,
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/source/COASTAL_WATER_EDGE_001_v001.blend"
  );
  assert.equal(exportValidation.sourceVerification.sourceBlendModifiedDuringExport, false);
  assert.equal(exportValidation.lodOrdering.passed, true);
  assert.deepEqual(
    exportValidation.files.map((entry) => entry.filename),
    [
      "COASTAL_WATER_EDGE_001_LOD_CLOSE.glb",
      "COASTAL_WATER_EDGE_001_LOD_GAMEPLAY.glb",
      "COASTAL_WATER_EDGE_001_LOD_MAP.glb"
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
  assert.equal(exportValidation.registrationPerformed, false);
  assert.equal(exportValidation.promotionPerformed, false);
  assert.equal(exportValidation.readinessForRegistration, true);
});

test("coastal water edge export manifest matches recorded validation metrics", () => {
  const exportValidation = JSON.parse(fs.readFileSync(exportValidationPath, "utf8"));
  const exportManifest = JSON.parse(
    fs.readFileSync(path.join(exportRoot, "coastal-water-edge-export-manifest.json"), "utf8")
  );

  assert.equal(exportManifest.version, "v001");
  assert.equal(exportManifest.outputs.close.triangleCount, 165);
  assert.equal(exportManifest.outputs.gameplay.triangleCount, 121);
  assert.equal(exportManifest.outputs.map.triangleCount, 77);
  assert.equal(
    exportValidation.exportManifest.deterministicFingerprint,
    exportManifest.deterministicFingerprint
  );
});

test("coastal water edge glbs preserve per-lod anchors and have no external dependencies", () => {
  const expectations = [
    [
      "COASTAL_WATER_EDGE_001_LOD_CLOSE.glb",
      "COASTAL_WATER_EDGE_001_LOD_CLOSE_IDENTITY_ANCHOR",
      12
    ],
    [
      "COASTAL_WATER_EDGE_001_LOD_GAMEPLAY.glb",
      "COASTAL_WATER_EDGE_001_LOD_GAMEPLAY_IDENTITY_ANCHOR",
      9
    ],
    [
      "COASTAL_WATER_EDGE_001_LOD_MAP.glb",
      "COASTAL_WATER_EDGE_001_LOD_MAP_IDENTITY_ANCHOR",
      6
    ]
  ];

  for (const [filename, anchorName, primitiveCount] of expectations) {
    const data = fs.readFileSync(path.join(exportRoot, filename));
    assert.equal(data.subarray(0, 4).toString("utf8"), "glTF");
    const jsonLength = data.readUInt32LE(12);
    assert.equal(data.subarray(16, 20).toString("utf8"), "JSON");
    const payload = JSON.parse(
      data
        .subarray(20, 20 + jsonLength)
        .toString("utf8")
        .replace(/\u0000+$/, "")
    );
    const blob = JSON.stringify(payload);
    assert.match(blob, /COASTAL_WATER_EDGE_001/);
    assert.match(blob, /COASTAL_WATER_EDGE_RECIPE_001/);
    assert.match(blob, new RegExp(anchorName));
    for (const dependencyId of [
      "MOD_WATER_EDGE_SHORE_BAND_001",
      "MOD_WATER_EDGE_WET_MARGIN_001",
      "MOD_WATER_EDGE_GROUND_SOCKET_001"
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

test("coastal water edge export report documents verified completion and registration readiness", () => {
  const report = fs.readFileSync(reportPath, "utf8");

  assert.match(report, /Verified complete/i);
  assert.match(report, /source blend hash remained unchanged/i);
  assert.match(report, /COASTAL_WATER_EDGE_001_LOD_CLOSE\.glb/);
  assert.match(report, /COASTAL_WATER_EDGE_001_LOD_GAMEPLAY\.glb/);
  assert.match(report, /COASTAL_WATER_EDGE_001_LOD_MAP\.glb/);
  assert.match(report, /ready for registration/i);
});
