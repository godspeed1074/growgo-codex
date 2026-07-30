import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const exportValidationPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/validation/coastal-boardwalk-export-validation.json"
);
const reportPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/reports/coastal-boardwalk-export-verification-report.md"
);
const exportRoot = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/export"
);

test("coastal boardwalk export validation records exported glbs and lod ordering", () => {
  const exportValidation = JSON.parse(fs.readFileSync(exportValidationPath, "utf8"));

  assert.equal(exportValidation.assetId, "COASTAL_BOARDWALK_001");
  assert.equal(exportValidation.version, "v001");
  assert.equal(exportValidation.exportStatus, "VERIFIED_COMPLETE");
  assert.equal(
    exportValidation.sourceVerification.sourceBlendRelativePath,
    "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/source/COASTAL_BOARDWALK_001_v001.blend"
  );
  assert.equal(exportValidation.sourceVerification.sourceBlendModifiedDuringExport, false);
  assert.equal(exportValidation.lodOrdering.passed, true);
  assert.deepEqual(
    exportValidation.files.map((entry) => entry.filename),
    [
      "COASTAL_BOARDWALK_001_LOD_CLOSE.glb",
      "COASTAL_BOARDWALK_001_LOD_GAMEPLAY.glb",
      "COASTAL_BOARDWALK_001_LOD_MAP.glb"
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
  assert.equal(exportValidation.validationSummary.sourceHashUnchanged, true);
  assert.equal(exportValidation.registrationPerformed, false);
  assert.equal(exportValidation.promotionPerformed, false);
  assert.equal(exportValidation.readinessForRegistration, true);
  assert.equal(exportValidation.blocker, null);
});

test("coastal boardwalk export manifest matches recorded validation metrics", () => {
  const exportValidation = JSON.parse(fs.readFileSync(exportValidationPath, "utf8"));
  const exportManifest = JSON.parse(
    fs.readFileSync(path.join(exportRoot, "coastal-boardwalk-export-manifest.json"), "utf8")
  );

  assert.equal(exportManifest.version, "v001");
  assert.equal(exportManifest.outputs.close.triangleCount, 221);
  assert.equal(exportManifest.outputs.gameplay.triangleCount, 185);
  assert.equal(exportManifest.outputs.map.triangleCount, 149);
  assert.equal(exportManifest.outputs.close.meshCount, 18);
  assert.equal(exportManifest.outputs.gameplay.meshCount, 15);
  assert.equal(exportManifest.outputs.map.meshCount, 12);
  assert.equal(
    exportValidation.exportManifest.deterministicFingerprint,
    exportManifest.deterministicFingerprint
  );
});

test("coastal boardwalk glbs preserve per-lod anchors and have no external dependencies", () => {
  const expectations = [
    [
      "COASTAL_BOARDWALK_001_LOD_CLOSE.glb",
      "COASTAL_BOARDWALK_001_LOD_CLOSE_IDENTITY_ANCHOR",
      18
    ],
    [
      "COASTAL_BOARDWALK_001_LOD_GAMEPLAY.glb",
      "COASTAL_BOARDWALK_001_LOD_GAMEPLAY_IDENTITY_ANCHOR",
      15
    ],
    [
      "COASTAL_BOARDWALK_001_LOD_MAP.glb",
      "COASTAL_BOARDWALK_001_LOD_MAP_IDENTITY_ANCHOR",
      12
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
    assert.match(blob, /COASTAL_BOARDWALK_001/);
    assert.match(blob, /COASTAL_BOARDWALK_RECIPE_001/);
    assert.match(blob, new RegExp(anchorName));
    for (const dependencyId of [
      "MOD_BOARDWALK_DECK_SEGMENT_001",
      "MOD_BOARDWALK_POST_RAIL_SET_001",
      "MOD_BOARDWALK_GROUND_SOCKET_COASTAL_001"
    ]) {
      assert.match(blob, new RegExp(dependencyId));
    }
    const countedPrimitives = (payload.meshes || []).reduce(
      (count, mesh) => count + ((mesh.primitives || []).length),
      0
    );
    assert.equal(countedPrimitives, primitiveCount);
    assert.equal(payload.materials?.length || 0, 2);
    assert.equal(
      (payload.buffers || []).some((buffer) => buffer.uri && !buffer.uri.startsWith("data:")),
      false
    );
  }
});

test("coastal boardwalk export report documents verified completion and registration readiness", () => {
  const report = fs.readFileSync(reportPath, "utf8");

  assert.match(report, /Verified complete/i);
  assert.match(report, /source blend hash remained unchanged/i);
  assert.match(report, /COASTAL_BOARDWALK_001_LOD_CLOSE\.glb/);
  assert.match(report, /COASTAL_BOARDWALK_001_LOD_GAMEPLAY\.glb/);
  assert.match(report, /COASTAL_BOARDWALK_001_LOD_MAP\.glb/);
  assert.match(report, /ready for registration/i);
});
