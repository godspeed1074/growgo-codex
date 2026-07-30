import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const revisionSpecPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/specification/coastal-ground-cover-v002-revision-specification.json"
);
const setupPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/validation/coastal-ground-cover-manual-authoring-v002-setup.json"
);

test("ground cover v002 revision spec preserves v001 and defines the refinement-only workflow", () => {
  const spec = JSON.parse(fs.readFileSync(revisionSpecPath, "utf8"));

  assert.equal(spec.previousRevisionVersion, "v001");
  assert.equal(spec.targetRevisionVersion, "v002");
  assert.deepEqual(spec.visualIssues, [
    "square_terrain_tile_read",
    "insufficient_organic_clumping",
    "weak_side_and_45_degree_silhouette"
  ]);
  assert.equal(spec.constraints.preserveV001Completely, true);
  assert.equal(spec.constraints.finalGlbExportAllowed, false);
  assert.equal(spec.constraints.registrationAllowed, false);
  assert.equal(spec.constraints.promotionAllowed, false);
});

test("ground cover v002 setup record targets only versioned v002 blend and glb outputs", () => {
  const setup = JSON.parse(fs.readFileSync(setupPath, "utf8"));

  assert.equal(setup.previousRegisteredVersion, "v001");
  assert.equal(setup.version, "v002");
  assert.equal(setup.expectedBlend, "COASTAL_GROUND_COVER_001_v002.blend");
  assert.deepEqual(setup.expectedFinalOutputs, [
    "COASTAL_GROUND_COVER_001_v002_LOD_CLOSE.glb",
    "COASTAL_GROUND_COVER_001_v002_LOD_GAMEPLAY.glb",
    "COASTAL_GROUND_COVER_001_v002_LOD_MAP.glb"
  ]);
});
