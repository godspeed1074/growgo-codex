import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "coastal-settlement-generator-foundation.mjs"
  )
);

function createSyntheticGlb({
  materialNames = ["SettlementMaterialA", "SettlementMaterialB"]
} = {}) {
  const json = JSON.stringify({
    asset: { version: "2.0" },
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [
      {
        primitives: [{ attributes: { POSITION: 0 }, material: 0 }]
      }
    ],
    materials: materialNames.map((name) => ({ name }))
  });
  const jsonBytes = new TextEncoder().encode(json);
  const paddedJsonLength = Math.ceil(jsonBytes.length / 4) * 4;
  const totalLength = 12 + 8 + paddedJsonLength;
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, totalLength, true);
  view.setUint32(12, paddedJsonLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  new Uint8Array(arrayBuffer, 20, paddedJsonLength).set(jsonBytes);
  return arrayBuffer;
}

function buildLoaderOptions() {
  return {
    existsSync() {
      return true;
    },
    loadArrayBuffer() {
      return Promise.resolve(createSyntheticGlb());
    }
  };
}

test("coastal settlement generator foundation creates a deterministic coastal settlement using existing cottage, tree, and road assets", async () => {
  const settlement = await moduleUnderTest.createCoastalSettlementGeneratorFoundation(
    moduleUnderTest.coastalSettlementGeneratorFoundationDefinition,
    buildLoaderOptions()
  );

  const result =
    moduleUnderTest.validateCoastalSettlementGeneratorFoundation(settlement);

  assert.equal(result.ok, true);
  assert.equal(settlement.worldRegionId, "COASTAL_SETTLEMENT_REGION_001");
  assert.equal(settlement.roadNetwork.roadSegments.length, 3);
  assert.equal(settlement.roadNetwork.intersections.length, 2);
  assert.equal(settlement.residentialLots.length, 4);
  assert.deepEqual(
    [...new Set(settlement.assetPlacements.map((placement) => placement.assetId))].sort(),
    [
      "BUILDING_COASTAL_COTTAGE_001",
      "ROAD_COASTAL_001",
      "TREE_EUCALYPTUS_001"
    ]
  );
  assert.equal(settlement.settlementSummary.cottageCount, 4);
  assert.equal(settlement.settlementSummary.treeCount, 8);
  assert.equal(settlement.settlementSummary.roadAssetPlacementCount, 3);
  assert.equal(settlement.validationResult.deterministicOutput, true);
});

test("same seed produces the same settlement and a different seed changes the layout safely", async () => {
  const first = await moduleUnderTest.createCoastalSettlementGeneratorFoundation(
    moduleUnderTest.coastalSettlementGeneratorFoundationDefinition,
    buildLoaderOptions()
  );
  const second = await moduleUnderTest.createCoastalSettlementGeneratorFoundation(
    moduleUnderTest.coastalSettlementGeneratorFoundationDefinition,
    buildLoaderOptions()
  );
  const third = await moduleUnderTest.createCoastalSettlementGeneratorFoundation(
    {
      ...moduleUnderTest.coastalSettlementGeneratorFoundationDefinition,
      seed: "growgo-coastal-settlement-alpha-002"
    },
    buildLoaderOptions()
  );

  assert.deepEqual(first, second);
  assert.notDeepEqual(first.assetPlacements, third.assetPlacements);
  assert.notEqual(first.settlementSummary.settlementId, third.settlementSummary.settlementId);
});

test("coastal settlement generator foundation rejects overlapping lots safely", async () => {
  const settlement = await moduleUnderTest.createCoastalSettlementGeneratorFoundation(
    moduleUnderTest.coastalSettlementGeneratorFoundationDefinition,
    buildLoaderOptions()
  );

  const invalid = {
    ...settlement,
    residentialLots: settlement.residentialLots.map((lot, index) =>
      index === 1
        ? {
            ...lot,
            position: { ...settlement.residentialLots[0].position }
          }
        : lot
    ),
    validationResult: {
      ...settlement.validationResult,
      placementValidity: false
    }
  };

  const result =
    moduleUnderTest.validateCoastalSettlementGeneratorFoundation(invalid);

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "lot_overlap_invalid");
});
