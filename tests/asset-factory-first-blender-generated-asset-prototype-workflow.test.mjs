import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const workflowModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "first-blender-generated-asset-prototype-workflow.mjs"
  )
);

test("first blender generated asset prototype workflow validates lighthouse island rocky prototype planning", () => {
  const result = workflowModule.validateFirstBlenderGeneratedAssetPrototypeWorkflow();

  assert.equal(result.ok, true);
  assert.equal(result.prototypeWorkflow.workflow.assetId, "LIGHTHOUSE_ISLAND_ROCKY_001");
  assert.equal(
    result.prototypeWorkflow.workflow.blenderPrototypeGenerationRequest.recipeId,
    "LIGHTHOUSE_ISLAND_ROCKY_RECIPE_001"
  );
});

test("first blender generated asset prototype workflow records modular audit and appearance profiles", () => {
  const result = workflowModule.validateFirstBlenderGeneratedAssetPrototypeWorkflow();

  assert.equal(result.ok, true);
  assert.equal(
    result.prototypeWorkflow.workflow.modularLibraryAudit.newLighthouseSpecificComponents.length,
    9
  );
  assert.equal(result.prototypeWorkflow.workflow.modularLibraryAudit.reusePercentage, 0);
  assert.deepEqual(
    result.prototypeWorkflow.workflow.blenderPrototypeGenerationRequest.appearanceProfiles,
    [
      "DAY_COASTAL_LIGHTHOUSE",
      "NIGHT_COASTAL_LIGHTHOUSE",
      "SUNSET_COASTAL_LIGHTHOUSE"
    ]
  );
});

test("first blender generated asset prototype workflow rejects incomplete modular audit and invalid recipe safely", () => {
  const badAudit = workflowModule.validateFirstBlenderGeneratedAssetPrototypeWorkflow({
    ...workflowModule.firstBlenderGeneratedAssetPrototypeWorkflowDefinition,
    modularLibraryAudit: {
      ...workflowModule.firstBlenderGeneratedAssetPrototypeWorkflowDefinition.modularLibraryAudit,
      newLighthouseSpecificComponents: [
        "LIGHTHOUSE_TOWER_BASE_001"
      ]
    }
  });

  const badRecipe = workflowModule.validateFirstBlenderGeneratedAssetPrototypeWorkflow({
    ...workflowModule.firstBlenderGeneratedAssetPrototypeWorkflowDefinition,
    blenderPrototypeGenerationRequest: {
      ...workflowModule.firstBlenderGeneratedAssetPrototypeWorkflowDefinition.blenderPrototypeGenerationRequest,
      recipeId: "LIGHTHOUSE_UNKNOWN_RECIPE_001"
    }
  });

  assert.equal(badAudit.ok, false);
  assert.equal(badAudit.errorCode, "modular_audit_incomplete");
  assert.equal(badRecipe.ok, false);
  assert.equal(badRecipe.errorCode, "recipe_reference_mismatch");
});

test("first blender generated asset prototype workflow remains passive and non-rendering", () => {
  const result = workflowModule.validateFirstBlenderGeneratedAssetPrototypeWorkflow();

  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.prototypeWorkflow, "canvas"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.prototypeWorkflow, "mesh"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.prototypeWorkflow, "runtimeRenderer"),
    false
  );
});
