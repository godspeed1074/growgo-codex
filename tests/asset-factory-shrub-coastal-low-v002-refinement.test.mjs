import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const revisionSpecPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/specification/shrub-coastal-low-v002-revision-specification.json"
);
const setupPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/validation/manual-authoring-v002-setup.json"
);

test("shrub v002 revision spec preserves v001 and defines the refinement-only workflow", () => {
  const spec = JSON.parse(fs.readFileSync(revisionSpecPath, "utf8"));

  assert.equal(spec.previousRevisionVersion, "v001");
  assert.equal(spec.targetRevisionVersion, "v002");
  assert.deepEqual(spec.visualIssues, [
    "pancaked_silhouette",
    "weak_side_profile",
    "flowers_not_visually_readable"
  ]);
  assert.equal(spec.constraints.preserveV001Completely, true);
  assert.equal(spec.constraints.finalGlbExportAllowed, false);
  assert.equal(spec.constraints.registrationAllowed, false);
  assert.equal(spec.constraints.promotionAllowed, false);
});

test("shrub v002 setup record targets only versioned v002 blend and glb outputs", () => {
  const setup = JSON.parse(fs.readFileSync(setupPath, "utf8"));

  assert.equal(setup.previousRegisteredVersion, "v001");
  assert.equal(setup.version, "v002");
  assert.equal(setup.expectedBlend, "SHRUB_COASTAL_LOW_001_v002.blend");
  assert.deepEqual(setup.expectedFinalOutputs, [
    "SHRUB_COASTAL_LOW_001_v002_LOD_CLOSE.glb",
    "SHRUB_COASTAL_LOW_001_v002_LOD_GAMEPLAY.glb",
    "SHRUB_COASTAL_LOW_001_v002_LOD_MAP.glb"
  ]);
});
