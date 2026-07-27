import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const discoveryModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-discovery.mjs")
);

test("search by asset ID returns deterministic direct asset match", () => {
  const layer = discoveryModule.createAssetDiscoveryLayer();
  const results = layer.search("GROUND_BEACH_SAND_001");

  assert.equal(results.length > 0, true);
  assert.equal(results[0].assetId, "GROUND_BEACH_SAND_001");
  assert.ok(results[0].matchingFields.includes("assetId"));
});

test("search by category returns nature assets", () => {
  const layer = discoveryModule.createAssetDiscoveryLayer();
  const results = layer.search({
    category: "nature"
  });

  assert.equal(results.length > 0, true);
  assert.ok(results.some((result) => result.assetId === "TREE_EUCALYPTUS_001"));
});

test("search by variant resolves assets with matching variant coverage", () => {
  const layer = discoveryModule.createAssetDiscoveryLayer();
  const results = layer.search({
    variant: "coastal"
  });

  assert.equal(results.length > 0, true);
  assert.ok(results.some((result) => result.assetId === "TREE_EUCALYPTUS_001"));
});

test("related asset lookup returns deterministic dependency and variant relationships", () => {
  const layer = discoveryModule.createAssetDiscoveryLayer();
  const related = layer.getRelatedAssets("TREE_EUCALYPTUS_001");

  assert.equal(related.length > 0, true);
  assert.ok(
    related.some((entry) => entry.assetId === "TREE_COASTAL_001")
  );
});

test("same input produces deterministic same search results", () => {
  const layer = discoveryModule.createAssetDiscoveryLayer();
  const first = layer.search({
    query: "BEACH",
    category: "nature"
  });
  const second = layer.search({
    query: "BEACH",
    category: "nature"
  });

  assert.deepEqual(first, second);
});
