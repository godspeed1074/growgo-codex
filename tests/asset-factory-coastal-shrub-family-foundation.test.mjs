import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  buildCoastalShrubFamilyFoundation,
  validateCoastalShrubFamilyFoundation
} from "../asset-factory/coastal-shrub-family-foundation.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const productionRoot = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001"
);

test("coastal shrub family preserves the queued asset and recipe identities", () => {
  const foundation = buildCoastalShrubFamilyFoundation();
  const identity = foundation.assetIdentitySpecification;

  assert.equal(foundation.familyId, "COASTAL_SHRUB_FAMILY_001");
  assert.equal(identity.assetId, "SHRUB_COASTAL_LOW_001");
  assert.equal(
    identity.identityContract.recipeId,
    "SHRUB_COASTAL_LOW_RECIPE_001"
  );
  assert.equal(identity.identityContract.version, "v001");
  assert.equal(identity.identityContract.anchorRequired, true);
});

test("coastal shrub family follows eucalyptus and bottlebrush reference boundaries", () => {
  const foundation = buildCoastalShrubFamilyFoundation();

  assert.deepEqual(foundation.referencePipelineAssets, [
    "TREE_EUCALYPTUS_001",
    "TREE_BOTTLEBRUSH_001"
  ]);
  assert.deepEqual(
    foundation.assetIdentitySpecification.lodPlan.map((entry) => entry.lodLabel),
    ["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]
  );
  assert.equal(foundation.authoringState.blenderGeneratorCreated, false);
  assert.equal(foundation.authoringState.blenderLaunched, false);
  assert.equal(foundation.authoringState.glbsCreated, false);
});

test("coastal shrub recipe and dependency placeholders are specification-only", () => {
  const foundation = buildCoastalShrubFamilyFoundation();

  assert.deepEqual(
    foundation.recipePlaceholders.map((entry) => entry.status),
    ["placeholder", "reserved_placeholder", "reserved_placeholder"]
  );
  assert.deepEqual(
    foundation.reusableDependencyPlaceholders.map((entry) => entry.dependencyId),
    [
      "MOD_SHRUB_BRANCH_CLUSTER_COASTAL_001",
      "MOD_SHRUB_FOLIAGE_CLUSTER_COASTAL_001",
      "MOD_SHRUB_FLOWER_CLUSTER_COASTAL_001",
      "MOD_SHRUB_GROUND_SOCKET_COASTAL_001"
    ]
  );
  assert.equal(foundation.authoringState.registrationCreated, false);
  assert.equal(foundation.authoringState.publishingPrepared, false);
  assert.equal(foundation.authoringState.runtimeActivationPrepared, false);
});

test("coastal shrub production structure remains valid after later authoring phases", () => {
  const validation = validateCoastalShrubFamilyFoundation(undefined, {
    cwd: repoRoot,
    allowGeneratedBinaries: true
  });

  assert.equal(validation.ok, true);
  assert.equal(
    validation.binaryFiles.every((filename) => filename.endsWith(".glb")),
    true
  );
  for (const folder of ["source", "export", "validation"]) {
    assert.equal(fs.statSync(path.join(productionRoot, folder)).isDirectory(), true);
  }
});

test("workspace handoff records match the foundation contract", () => {
  const specification = JSON.parse(
    fs.readFileSync(path.join(productionRoot, "family-specification.json"), "utf8")
  );
  const recipes = JSON.parse(
    fs.readFileSync(path.join(productionRoot, "recipe-placeholders.json"), "utf8")
  );
  const expectations = JSON.parse(
    fs.readFileSync(
      path.join(productionRoot, "validation/validation-expectations.json"),
      "utf8"
    )
  );

  assert.equal(specification.primaryAsset.assetId, "SHRUB_COASTAL_LOW_001");
  assert.equal(recipes.recipes[0].recipeId, "SHRUB_COASTAL_LOW_RECIPE_001");
  assert.equal(recipes.registered, false);
  assert.equal(expectations.currentState.blendCreated, false);
  assert.equal(expectations.currentState.glbsCreated, false);
  assert.equal(expectations.currentState.published, false);
});

test("foundation build is deterministic", () => {
  assert.equal(
    buildCoastalShrubFamilyFoundation().deterministicFingerprint,
    buildCoastalShrubFamilyFoundation().deterministicFingerprint
  );
});
