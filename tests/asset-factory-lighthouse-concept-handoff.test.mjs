import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const handoffModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "lighthouse-concept-asset-factory-handoff.mjs"
  )
);

test("lighthouse concept handoff validates approved lighthouse planning data", () => {
  const result = handoffModule.validateLighthouseConceptAssetFactoryHandoff();

  assert.equal(result.ok, true);
  assert.equal(result.handoff.concept.conceptId, "LIGHTHOUSE_COASTAL_FAMILY_001");
  assert.equal(result.handoff.planningData.category, "landmarks");
  assert.equal(result.handoff.planningData.productionStatus, "workflow-ready");
});

test("lighthouse concept handoff validates planned components, recipes, and appearance profiles", () => {
  const result = handoffModule.validateLighthouseConceptAssetFactoryHandoff();

  assert.equal(result.ok, true);
  assert.equal(result.handoff.planningData.plannedComponents.length, 9);
  assert.equal(result.handoff.planningData.plannedRecipes.length, 3);
  assert.deepEqual(result.handoff.planningData.appearanceProfiles, [
    "DAY_COASTAL_LIGHTHOUSE",
    "NIGHT_COASTAL_LIGHTHOUSE",
    "SUNSET_COASTAL_LIGHTHOUSE"
  ]);
});

test("lighthouse concept handoff rejects non-approved concepts and mismatched planning safely", () => {
  const conceptNotApproved = handoffModule.validateLighthouseConceptAssetFactoryHandoff(
    handoffModule.lighthouseConceptAssetFactoryHandoffDefinition,
    {
      conceptCard: {
        ...handoffModule.lighthouseCoastalFamilyConceptDefinition,
        status: "review"
      }
    }
  );

  const badComponentPlanning = handoffModule.validateLighthouseConceptAssetFactoryHandoff(
    {
      ...handoffModule.lighthouseConceptAssetFactoryHandoffDefinition,
      plannedComponents: [
        "LIGHTHOUSE_TOWER_BASE_001"
      ]
    }
  );

  assert.equal(conceptNotApproved.ok, false);
  assert.equal(conceptNotApproved.errorCode, "concept_not_approved");
  assert.equal(badComponentPlanning.ok, false);
  assert.equal(badComponentPlanning.errorCode, "component_planning_mismatch");
});

test("lighthouse concept handoff remains passive and non-rendering", () => {
  const result = handoffModule.validateLighthouseConceptAssetFactoryHandoff();

  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.handoff, "canvas"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.handoff, "mesh"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.handoff, "runtimeRenderer"),
    false
  );
});
