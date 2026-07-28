import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const assistantModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-agent-assistant.mjs")
);

test("status explanation summarizes governance and audit context", () => {
  const layer = assistantModule.createAssetAgentAssistantLayer();
  const response = layer.answerQuery({
    queryType: "ASSET_STATUS_EXPLANATION",
    assetId: "GROUND_BEACH_SAND_001"
  });

  assert.equal(response.queryType, "ASSET_STATUS_EXPLANATION");
  assert.match(response.answerSummary, /GROUND_BEACH_SAND_001/);
  assert.ok(response.supportingRecords.some((record) => record.recordType === "GOVERNANCE_REPORT"));
});

test("dependency explanation traces direct dependency records", () => {
  const layer = assistantModule.createAssetAgentAssistantLayer();
  const response = layer.answerQuery({
    queryType: "DEPENDENCY_EXPLANATION",
    assetId: "GROUND_BEACH_SAND_001"
  });

  assert.equal(response.queryType, "DEPENDENCY_EXPLANATION");
  assert.ok(response.supportingRecords.some((record) => record.recordType === "DEPENDENCY_RECORD"));
});

test("impact explanation reports severity and traced entries", () => {
  const layer = assistantModule.createAssetAgentAssistantLayer();
  const response = layer.answerQuery({
    queryType: "IMPACT_EXPLANATION",
    assetId: "GROUND_BEACH_SAND_001"
  });

  assert.equal(response.queryType, "IMPACT_EXPLANATION");
  assert.match(response.answerSummary, /impact/i);
  assert.ok(response.supportingRecords.some((record) => record.recordType === "IMPACT_REPORT"));
});

test("recommendation explanation summarizes top recommendation result", () => {
  const layer = assistantModule.createAssetAgentAssistantLayer();
  const response = layer.answerQuery({
    queryType: "RECOMMENDATION_EXPLANATION",
    assetId: "GROUND_BEACH_SAND_001",
    recommendationContext: {
      environmentType: "COASTAL_PARK",
      biome: "COASTAL",
      objectClassification: "NATURAL_FEATURE",
      atlasUsage: "PARK",
      existingAssetRelationships: ["GROUND_COASTAL_GRASS_001"],
      variantCompatibility: {
        baseReferenceType: "asset",
        baseReferenceId: "TREE_EUCALYPTUS_001"
      }
    }
  });

  assert.equal(response.queryType, "RECOMMENDATION_EXPLANATION");
  assert.match(response.answerSummary, /TREE_COASTAL_001/);
  assert.ok(response.supportingRecords.some((record) => record.recordType === "RECOMMENDATION_RESULT"));
});

test("same query produces deterministic same assistant output", () => {
  const layer = assistantModule.createAssetAgentAssistantLayer();
  const query = {
    queryType: "RECOMMENDATION_EXPLANATION",
    assetId: "GROUND_BEACH_SAND_001",
    recommendationContext: {
      environmentType: "COASTAL_PARK",
      biome: "COASTAL",
      objectClassification: "NATURAL_FEATURE",
      atlasUsage: "PARK",
      existingAssetRelationships: ["GROUND_COASTAL_GRASS_001"],
      variantCompatibility: {
        baseReferenceType: "asset",
        baseReferenceId: "TREE_EUCALYPTUS_001"
      }
    }
  };

  const first = layer.answerQuery(query);
  const second = layer.answerQuery(query);

  assert.deepEqual(first, second);
});
