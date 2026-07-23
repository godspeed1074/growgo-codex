import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "blender-glb-production-workflow-contract.mjs"
  )
);

test("blender glb production workflow contract validates the first coastal house workflow", () => {
  const context = moduleUnderTest.buildBlenderGlbProductionWorkflowContractContext();
  const result = moduleUnderTest.validateBlenderGlbProductionWorkflowContract(
    moduleUnderTest.blenderGlbProductionWorkflowContractDefinition,
    { validationContext: context }
  );

  assert.equal(result.ok, true);
  assert.equal(result.workflowContract.contract.assetId, "BUILDING_HOUSE_SMALL_COASTAL_001");
  assert.equal(
    result.workflowContract.compatibility.rendererCompatibilityVerified,
    true
  );
  assert.equal(
    result.workflowContract.contract.glbExportRules.primaryFormat,
    "glb"
  );
});

test("blender glb production workflow contract rejects invalid axes and unsupported formats safely", () => {
  const context = moduleUnderTest.buildBlenderGlbProductionWorkflowContractContext();

  const badAxis = moduleUnderTest.validateBlenderGlbProductionWorkflowContract(
    {
      ...moduleUnderTest.blenderGlbProductionWorkflowContractDefinition,
      blenderSceneRules: {
        ...moduleUnderTest.blenderGlbProductionWorkflowContractDefinition.blenderSceneRules,
        worldOrientation: {
          ...moduleUnderTest.blenderGlbProductionWorkflowContractDefinition.blenderSceneRules.worldOrientation,
          upAxis: "Q"
        }
      }
    },
    { validationContext: context }
  );

  const badFormat = moduleUnderTest.validateBlenderGlbProductionWorkflowContract(
    {
      ...moduleUnderTest.blenderGlbProductionWorkflowContractDefinition,
      glbExportRules: {
        ...moduleUnderTest.blenderGlbProductionWorkflowContractDefinition.glbExportRules,
        primaryFormat: "fbx"
      }
    },
    { validationContext: context }
  );

  assert.equal(badAxis.ok, false);
  assert.equal(badAxis.errorCode, "invalid_axis");
  assert.equal(badFormat.ok, false);
  assert.equal(badFormat.errorCode, "unsupported_format");
});

test("blender glb production workflow contract rejects component workflow mismatches and bad lod order safely", () => {
  const context = moduleUnderTest.buildBlenderGlbProductionWorkflowContractContext();

  const badComponents = moduleUnderTest.validateBlenderGlbProductionWorkflowContract(
    {
      ...moduleUnderTest.blenderGlbProductionWorkflowContractDefinition,
      modularAssetWorkflow: {
        ...moduleUnderTest.blenderGlbProductionWorkflowContractDefinition.modularAssetWorkflow,
        componentNaming: ["COASTAL_HOUSE_WALL_PANEL_001"]
      }
    },
    { validationContext: context }
  );

  const badLodBudget = moduleUnderTest.validateBlenderGlbProductionWorkflowContract(
    {
      ...moduleUnderTest.blenderGlbProductionWorkflowContractDefinition,
      lodWorkflow: {
        ...moduleUnderTest.blenderGlbProductionWorkflowContractDefinition.lodWorkflow,
        close: {
          ...moduleUnderTest.blenderGlbProductionWorkflowContractDefinition.lodWorkflow.close,
          polygonBudget: 100
        },
        gameplay: {
          ...moduleUnderTest.blenderGlbProductionWorkflowContractDefinition.lodWorkflow.gameplay,
          polygonBudget: 180
        }
      }
    },
    { validationContext: context }
  );

  assert.equal(badComponents.ok, false);
  assert.equal(badComponents.errorCode, "component_workflow_mismatch");
  assert.equal(badLodBudget.ok, false);
  assert.equal(badLodBudget.errorCode, "invalid_lod_budget_order");
});

test("blender glb production workflow contract remains passive and non-rendering", () => {
  const context = moduleUnderTest.buildBlenderGlbProductionWorkflowContractContext();
  const result = moduleUnderTest.validateBlenderGlbProductionWorkflowContract(
    moduleUnderTest.blenderGlbProductionWorkflowContractDefinition,
    { validationContext: context }
  );

  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.workflowContract, "canvas"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.workflowContract, "mesh"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.workflowContract, "runtimeRenderer"),
    false
  );
});
