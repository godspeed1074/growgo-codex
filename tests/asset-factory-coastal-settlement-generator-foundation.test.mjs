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

test("coastal settlement generator foundation consumes deterministic map fixture inputs into settlement blocks, roads, buildings, vegetation, and landmarks", async () => {
  const fixtureDefinition = {
    ...moduleUnderTest.coastalSettlementGeneratorFoundationDefinition,
    seed: "growgo-coastal-map-fixture-alpha-001",
    mapFixtureData: {
      roads: [
        {
          roadSegmentId: "LOCAL_MAP_ROAD_SEGMENT_001",
          roadClass: "coastal_collector",
          orientation: "east-west",
          start: { x: 48, y: 332.8 },
          end: { x: 896, y: 332.8 },
          width: 28,
          connectedIntersectionIds: ["LOCAL_MAP_INTERSECTION_001", "LOCAL_MAP_INTERSECTION_002"]
        },
        {
          roadSegmentId: "LOCAL_MAP_ROAD_SEGMENT_002",
          roadClass: "residential_spur",
          orientation: "north-south",
          start: { x: 268.8, y: 332.8 },
          end: { x: 268.8, y: 217.6 },
          width: 18,
          connectedIntersectionIds: ["LOCAL_MAP_INTERSECTION_001", "LOCAL_MAP_INTERSECTION_003"]
        },
        {
          roadSegmentId: "LOCAL_MAP_ROAD_SEGMENT_003",
          roadClass: "residential_spur",
          orientation: "north-south",
          start: { x: 633.6, y: 332.8 },
          end: { x: 633.6, y: 217.6 },
          width: 18,
          connectedIntersectionIds: ["LOCAL_MAP_INTERSECTION_002", "LOCAL_MAP_INTERSECTION_003"]
        },
        {
          roadSegmentId: "LOCAL_MAP_ROAD_SEGMENT_004",
          roadClass: "coastal_view_road",
          orientation: "east-west",
          start: { x: 268.8, y: 217.6 },
          end: { x: 633.6, y: 217.6 },
          width: 20,
          connectedIntersectionIds: ["LOCAL_MAP_INTERSECTION_003"]
        }
      ],
      landAreas: [
        {
          landAreaId: "LOCAL_MAP_LAND_AREA_RESIDENTIAL_001",
          areaType: "residential_neighbourhood",
          boundaryPoints: [
            { x: 48, y: 88 },
            { x: 456, y: 88 },
            { x: 456, y: 290.8 },
            { x: 48, y: 290.8 }
          ]
        },
        {
          landAreaId: "LOCAL_MAP_LAND_AREA_RESIDENTIAL_002",
          areaType: "residential_neighbourhood",
          boundaryPoints: [
            { x: 504, y: 88 },
            { x: 904, y: 88 },
            { x: 904, y: 290.8 },
            { x: 504, y: 290.8 }
          ]
        },
        {
          landAreaId: "LOCAL_MAP_LAND_AREA_COASTLINE_001",
          areaType: "coastline_boundary",
          boundaryPoints: [
            { x: 0, y: 460.8 },
            { x: 960, y: 460.8 },
            { x: 960, y: 640 },
            { x: 0, y: 640 }
          ]
        },
        {
          landAreaId: "LOCAL_MAP_LAND_AREA_FORESHORE_001",
          areaType: "foreshore_transition",
          boundaryPoints: [
            { x: 32, y: 408.8 },
            { x: 928, y: 408.8 },
            { x: 928, y: 486.8 },
            { x: 32, y: 486.8 }
          ]
        }
      ],
      buildingHints: [
        {
          buildingHintId: "LOCAL_MAP_BUILDING_HINT_001",
          assetId: "BUILDING_COASTAL_COTTAGE_001",
          lotId: "COASTAL_SETTLEMENT_LOT_001",
          frontageRoadSegmentId: "LOCAL_MAP_ROAD_SEGMENT_001",
          position: { x: 162, y: 234.8 },
          width: 132,
          depth: 148,
          buildingWidth: 72,
          buildingDepth: 60,
          facing: "south",
          residentialAreaId: "LOCAL_MAP_LAND_AREA_RESIDENTIAL_001"
        },
        {
          buildingHintId: "LOCAL_MAP_BUILDING_HINT_002",
          assetId: "BUILDING_COASTAL_COTTAGE_001",
          lotId: "COASTAL_SETTLEMENT_LOT_002",
          frontageRoadSegmentId: "LOCAL_MAP_ROAD_SEGMENT_004",
          position: { x: 362.8, y: 159.6 },
          width: 132,
          depth: 148,
          buildingWidth: 72,
          buildingDepth: 60,
          facing: "south",
          residentialAreaId: "LOCAL_MAP_LAND_AREA_RESIDENTIAL_001"
        },
        {
          buildingHintId: "LOCAL_MAP_BUILDING_HINT_003",
          assetId: "BUILDING_COASTAL_COTTAGE_001",
          lotId: "COASTAL_SETTLEMENT_LOT_003",
          frontageRoadSegmentId: "LOCAL_MAP_ROAD_SEGMENT_004",
          position: { x: 541.6, y: 161.6 },
          width: 132,
          depth: 148,
          buildingWidth: 72,
          buildingDepth: 60,
          facing: "south",
          residentialAreaId: "LOCAL_MAP_LAND_AREA_RESIDENTIAL_002"
        },
        {
          buildingHintId: "LOCAL_MAP_BUILDING_HINT_004",
          assetId: "BUILDING_COASTAL_COTTAGE_001",
          lotId: "COASTAL_SETTLEMENT_LOT_004",
          frontageRoadSegmentId: "LOCAL_MAP_ROAD_SEGMENT_001",
          position: { x: 806, y: 236.8 },
          width: 132,
          depth: 148,
          buildingWidth: 72,
          buildingDepth: 60,
          facing: "south",
          residentialAreaId: "LOCAL_MAP_LAND_AREA_RESIDENTIAL_002"
        }
      ],
      vegetationHints: [
        {
          vegetationHintId: "LOCAL_MAP_VEGETATION_HINT_001",
          assetId: "TREE_EUCALYPTUS_001",
          position: { x: 134, y: 194.8 },
          density: "moderate",
          vegetationAreaId: "LOCAL_MAP_LAND_AREA_RESIDENTIAL_001",
          lotId: "COASTAL_SETTLEMENT_LOT_001"
        },
        {
          vegetationHintId: "LOCAL_MAP_VEGETATION_HINT_002",
          assetId: "TREE_EUCALYPTUS_001",
          position: { x: 390.8, y: 119.6 },
          density: "moderate",
          vegetationAreaId: "LOCAL_MAP_LAND_AREA_RESIDENTIAL_001",
          lotId: "COASTAL_SETTLEMENT_LOT_002"
        },
        {
          vegetationHintId: "LOCAL_MAP_VEGETATION_HINT_003",
          assetId: "TREE_EUCALYPTUS_001",
          position: { x: 513.6, y: 121.6 },
          density: "light",
          vegetationAreaId: "LOCAL_MAP_LAND_AREA_RESIDENTIAL_002",
          lotId: "COASTAL_SETTLEMENT_LOT_003"
        },
        {
          vegetationHintId: "LOCAL_MAP_VEGETATION_HINT_004",
          assetId: "TREE_EUCALYPTUS_001",
          position: { x: 834, y: 196.8 },
          density: "light",
          vegetationAreaId: "LOCAL_MAP_LAND_AREA_RESIDENTIAL_002",
          lotId: "COASTAL_SETTLEMENT_LOT_004"
        }
      ],
      landmarkHints: [
        {
          landmarkHintId: "LOCAL_MAP_LANDMARK_HINT_001",
          assetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
          hintType: "landmark",
          position: { x: 828, y: 518.8 },
          source: "local_fixture_map_data"
        }
      ]
    }
  };

  const settlement = await moduleUnderTest.createCoastalSettlementGeneratorFoundation(
    fixtureDefinition,
    buildLoaderOptions()
  );

  const result =
    moduleUnderTest.validateCoastalSettlementGeneratorFoundation(settlement);

  assert.equal(result.ok, true);
  assert.equal(settlement.mapFixtureDriven, true);
  assert.equal(settlement.roadNetwork.roadSegments.length, 4);
  assert.equal(settlement.roadNetwork.intersections.length, 3);
  assert.equal(settlement.residentialBlocks.length, 2);
  assert.equal(settlement.residentialLots.length, 4);
  assert.equal(settlement.buildingPlacements.length, 4);
  assert.equal(settlement.vegetationPlacements.length, 4);
  assert.equal(settlement.landmarkPlacements.length, 1);
  assert.equal(settlement.validationResult.settlementMatchesMapFixture, true);
  assert.deepEqual(
    [...new Set(settlement.assetPlacements.map((placement) => placement.assetId))].sort(),
    [
      "BUILDING_COASTAL_COTTAGE_001",
      "LIGHTHOUSE_ISLAND_ROCKY_001",
      "ROAD_COASTAL_001",
      "TREE_EUCALYPTUS_001"
    ]
  );
});
