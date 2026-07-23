import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const workflowModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "concept-approval-workflow.mjs"
  )
);

test("concept approval workflow validates a production-ready coastal house concept card", () => {
  const result = workflowModule.validateConceptCard(
    workflowModule.coastalHouseConceptCardDefinition
  );

  assert.equal(result.ok, true);
  assert.equal(result.normalizedConcept.conceptId, "CONCEPT_COASTAL_HOUSE_SMALL_001");
  assert.equal(result.normalizedConcept.category, "buildings");
  assert.equal(result.normalizedConcept.status, "approved");
});

test("concept approval workflow registry enforces uniqueness and provides production handoff support", () => {
  const registry = workflowModule.createConceptApprovalWorkflowRegistry([
    workflowModule.coastalHouseConceptCardDefinition
  ]);

  assert.equal(registry.hasConcept("concept_coastal_house_small_001"), true);
  assert.equal(registry.isHandoffReady("CONCEPT_COASTAL_HOUSE_SMALL_001"), true);
  assert.equal(
    registry.getProductionHandoff("CONCEPT_COASTAL_HOUSE_SMALL_001").suggestedAssetCategory,
    "buildings"
  );

  assert.throws(
    () =>
      registry.addConcept(workflowModule.coastalHouseConceptCardDefinition),
    /already exists/
  );
});

test("concept approval workflow rejects invalid status, category, and incomplete handoff safely", () => {
  const badStatus = workflowModule.validateConceptCard({
    ...workflowModule.coastalHouseConceptCardDefinition,
    status: "live"
  });

  const badCategory = workflowModule.validateConceptCard({
    ...workflowModule.coastalHouseConceptCardDefinition,
    category: "quests"
  });

  const badHandoff = workflowModule.validateConceptCard({
    ...workflowModule.coastalHouseConceptCardDefinition,
    metadata: {
      ...workflowModule.coastalHouseConceptCardDefinition.metadata,
      assetFactoryHandoffMetadata: {
        ...workflowModule.coastalHouseConceptCardDefinition.metadata.assetFactoryHandoffMetadata,
        handoffReady: false
      }
    }
  });

  assert.equal(badStatus.ok, false);
  assert.equal(badStatus.errorCode, "invalid_status");
  assert.equal(badCategory.ok, false);
  assert.equal(badCategory.errorCode, "invalid_category");
  assert.equal(badHandoff.ok, false);
  assert.equal(badHandoff.errorCode, "handoff_not_ready");
});

test("concept approval workflow handoff stays passive and non-rendering", () => {
  const handoff = workflowModule.validateConceptProductionHandoff(
    workflowModule.coastalHouseConceptCardDefinition
  );

  assert.equal(handoff.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(handoff.handoff, "canvas"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(handoff.handoff, "mesh"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(handoff.handoff, "runtimeRenderer"),
    false
  );
});
