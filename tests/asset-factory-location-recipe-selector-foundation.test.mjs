import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const selectorRoot = path.join(
  repoRoot,
  "asset-factory-workspace/recipe-selector/LOCATION_RECIPE_SELECTOR_001"
);

const specificationPath = path.join(
  selectorRoot,
  "specification/location-recipe-selector-specification.json"
);
const libraryPath = path.join(
  selectorRoot,
  "metadata/location-recipe-selector-library.json"
);
const coastalMetadataPath = path.join(
  selectorRoot,
  "metadata/coastal-location-recipe-001-selector-metadata.json"
);
const forestMetadataPath = path.join(
  selectorRoot,
  "metadata/forest-location-recipe-001-selector-metadata.json"
);
const validationPath = path.join(
  selectorRoot,
  "validation/location-recipe-selector-validation.json"
);
const lifecyclePath = path.join(
  selectorRoot,
  "lifecycle/location-recipe-selector-lifecycle-record.json"
);
const reportPath = path.join(
  selectorRoot,
  "reports/location-recipe-selector-foundation-report.md"
);

const selectorModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "location-recipe-selector-foundation.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("location recipe selector foundation builder is deterministic", () => {
  const first = selectorModule.buildLocationRecipeSelectorFoundation({
    cwd: repoRoot
  });
  const second = selectorModule.buildLocationRecipeSelectorFoundation({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.library, second.library);
  assert.deepEqual(first.validation, second.validation);
});

test("location recipe selector chooses coastal and forest recipes deterministically", () => {
  const foundation = selectorModule.buildLocationRecipeSelectorFoundation({
    cwd: repoRoot
  });

  const coastalSelection = selectorModule.selectLocationRecipe(
    {
      worldContextId: "COASTAL_CONTEXT_001",
      environment: "DEVELOPMENT_ONLY",
      biomeProfile: "COASTAL_RESERVE_TRAIL",
      routeMode: "pedestrian_exploration",
      archetype: "RESERVE_LOOP",
      desiredFeatures: ["shoreline_transition", "wet_crossing", "loop_route"],
      seed: "LOCATION_RECIPE_SELECTOR_001:COASTAL"
    },
    foundation.recipeMetadataRecords,
    foundation.specification
  );
  const forestSelection = selectorModule.selectLocationRecipe(
    {
      worldContextId: "FOREST_CONTEXT_001",
      environment: "DEVELOPMENT_ONLY",
      biomeProfile: "TEMPERATE_FOREST_EDGE",
      routeMode: "pedestrian_exploration",
      archetype: "FOREST_EDGE_LOOP",
      desiredFeatures: ["canopy_enclosure", "clearing_destination", "loop_route"],
      seed: "LOCATION_RECIPE_SELECTOR_001:FOREST"
    },
    foundation.recipeMetadataRecords,
    foundation.specification
  );

  assert.equal(coastalSelection.selectedRecipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(forestSelection.selectedRecipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(coastalSelection.blocked, false);
  assert.equal(forestSelection.blocked, false);
});

test("location recipe selector blocks unsupported contexts and non-approved recipes", () => {
  const foundation = selectorModule.buildLocationRecipeSelectorFoundation({
    cwd: repoRoot
  });

  const unsupportedSelection = selectorModule.selectLocationRecipe(
    {
      worldContextId: "UNSUPPORTED_CONTEXT_001",
      environment: "DEVELOPMENT_ONLY",
      biomeProfile: "ALPINE_TUNDRA",
      routeMode: "pedestrian_exploration",
      archetype: "MOUNTAIN_PASS",
      desiredFeatures: ["snow_corridor"],
      seed: "LOCATION_RECIPE_SELECTOR_001:UNSUPPORTED"
    },
    foundation.recipeMetadataRecords,
    foundation.specification
  );
  assert.equal(unsupportedSelection.blocked, true);
  assert.equal(unsupportedSelection.selectedRecipeId, null);

  const downgradedLibrary = foundation.recipeMetadataRecords.map((metadata) => ({
    ...metadata,
    approvalStatus: "draft"
  }));
  const downgradedSelection = selectorModule.selectLocationRecipe(
    {
      worldContextId: "COASTAL_CONTEXT_001",
      environment: "DEVELOPMENT_ONLY",
      biomeProfile: "COASTAL_RESERVE_TRAIL",
      routeMode: "pedestrian_exploration",
      archetype: "RESERVE_LOOP",
      desiredFeatures: ["shoreline_transition", "wet_crossing", "loop_route"],
      seed: "LOCATION_RECIPE_SELECTOR_001:COASTAL"
    },
    downgradedLibrary,
    foundation.specification
  );

  assert.equal(downgradedSelection.selectedRecipeId, null);
  assert.equal(downgradedSelection.blocked, true);
});

test("location recipe selector generated records describe an approved recipe library", () => {
  const specification = readJson(specificationPath);
  const library = readJson(libraryPath);
  const coastalMetadata = readJson(coastalMetadataPath);
  const forestMetadata = readJson(forestMetadataPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(specification.selectorId, "LOCATION_RECIPE_SELECTOR_001");
  assert.equal(library.recipeCount, 2);
  assert.equal(
    library.recipes.every((recipe) => recipe.lifecycleStatus === "APPROVED_CURRENT"),
    true
  );
  assert.equal(coastalMetadata.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(forestMetadata.recipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(validation.status, "pass");
  assert.equal(lifecycle.lifecycleStatus, "READY");
  assert.match(report, /Future Atlas Engine integration: READY/);
});
