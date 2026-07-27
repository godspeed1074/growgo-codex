import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const regionTestModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-controlled-region-test.mjs"
  )
);

function createDirectRenderCommands() {
  const sceneId = "CONTROLLED_REGION_SOURCE_SCENE_001";
  return {
    schemaId: "ATLAS_RENDER_COMMANDS_001",
    entries: [
      {
        sceneId,
        sceneType: "TOWN_MAIN_STREET_SCENE",
        commands: [
          createCommand("REGIONAL_HIGHWAY_001", "REGIONAL_HIGHWAY", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 20, sceneId, { x: 0, y: 0, z: 0 }, "MAT_ROAD_STANDARD_001"),
          createCommand("REGIONAL_CONNECTOR_001", "CONNECTOR_ROUTE", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 21, sceneId, { x: 20, y: 0, z: 0 }, "MAT_ROAD_STANDARD_001"),
          createCommand("TOWN_ALPHA_ROAD_001", "TRANSPORT_ROUTE", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 22, sceneId, { x: 5, y: 0, z: 10 }, "MAT_ROAD_STANDARD_001"),
          createCommand("TOWN_BETA_ROAD_001", "TRANSPORT_ROUTE", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 23, sceneId, { x: 35, y: 0, z: 10 }, "MAT_ROAD_STANDARD_001"),
          createCommand("TOWN_GAMMA_ROAD_001", "TRANSPORT_ROUTE", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 24, sceneId, { x: 65, y: 0, z: 10 }, "MAT_ROAD_STANDARD_001"),
          createCommand("REGION_INTERSECTION_001", "ROAD_INTERSECTION", "ROAD_INTERSECTION_STANDARD_001", "ROAD_LAYER", 25, sceneId, { x: 20, y: 0, z: 10 }, "MAT_ROAD_STANDARD_001"),
          createCommand("REGION_INTERSECTION_002", "ROAD_INTERSECTION", "ROAD_INTERSECTION_STANDARD_001", "ROAD_LAYER", 26, sceneId, { x: 50, y: 0, z: 10 }, "MAT_ROAD_STANDARD_001"),
          createCommand("REGION_PATH_001", "SIDEWALK_PATH", "PATH_STANDARD_001", "ROAD_LAYER", 27, sceneId, { x: 10, y: 0, z: 4 }, "MAT_PATH_STANDARD_001"),
          createCommand("REGION_TRANSPORT_001", "RAIL_STATION", "ROAD_INTERSECTION_STANDARD_001", "ROAD_LAYER", 28, sceneId, { x: 40, y: 0, z: 18 }, "MAT_ROAD_STANDARD_001"),
          createCommand("REGION_TRANSPORT_002", "BUS_STATION", "ROAD_INTERSECTION_STANDARD_001", "ROAD_LAYER", 29, sceneId, { x: 70, y: 0, z: 18 }, "MAT_ROAD_STANDARD_001"),

          createCommand("TOWN_ALPHA_HOUSE_001", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 30, sceneId, { x: 4, y: 0, z: 14 }, "MAT_SUBURBAN_HOUSE_001"),
          createCommand("TOWN_ALPHA_HOUSE_002", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 31, sceneId, { x: 8, y: 0, z: 14 }, "MAT_SUBURBAN_HOUSE_001"),
          createCommand("TOWN_BETA_HOUSE_001", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 32, sceneId, { x: 34, y: 0, z: 14 }, "MAT_SUBURBAN_HOUSE_001"),
          createCommand("TOWN_BETA_HOUSE_002", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 33, sceneId, { x: 38, y: 0, z: 14 }, "MAT_SUBURBAN_HOUSE_001"),
          createCommand("TOWN_GAMMA_HOUSE_001", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 34, sceneId, { x: 64, y: 0, z: 14 }, "MAT_SUBURBAN_HOUSE_001"),
          createCommand("TOWN_GAMMA_HOUSE_002", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 35, sceneId, { x: 68, y: 0, z: 14 }, "MAT_SUBURBAN_HOUSE_001"),
          createCommand("TOWN_ALPHA_SHOP_001", "BAKERY", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 36, sceneId, { x: 12, y: 0, z: 12 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("TOWN_BETA_SHOP_001", "CAFE", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 37, sceneId, { x: 42, y: 0, z: 12 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("TOWN_GAMMA_SHOP_001", "SHOP", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 38, sceneId, { x: 72, y: 0, z: 12 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("REGION_CIVIC_001", "LIBRARY", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 39, sceneId, { x: 45, y: 0, z: 24 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("REGION_LANDMARK_001", "LANDMARK_LOOKOUT", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 40, sceneId, { x: 20, y: 0, z: 30 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("REGION_LANDMARK_002", "LANDMARK_MONUMENT", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 41, sceneId, { x: 60, y: 0, z: 30 }, "MAT_COMMERCIAL_SHOP_001"),

          createCommand("REGION_GREENSPACE_001", "GREEN_CORRIDOR", "PARK_TREATMENT_001", "GROUND_LAYER", 42, sceneId, { x: 28, y: 0, z: 28 }, "MAT_PARK_GROUND_001"),
          createCommand("REGION_GREENSPACE_002", "WETLAND_RESERVE", "PARK_TREATMENT_001", "GROUND_LAYER", 43, sceneId, { x: 55, y: 0, z: 28 }, "MAT_PARK_GROUND_001"),
          createCommand("REGION_TREE_001", "TREE", "TREE_EUCALYPTUS_001", "NATURE_LAYER", 44, sceneId, { x: 26, y: 0, z: 32 }, "MAT_TREE_EUCALYPTUS_001"),
          createCommand("REGION_TREE_002", "TREE", "TREE_EUCALYPTUS_001", "NATURE_LAYER", 45, sceneId, { x: 58, y: 0, z: 32 }, "MAT_TREE_EUCALYPTUS_001"),
          createCommand("REGION_TREE_003", "TREE", "TREE_EUCALYPTUS_001", "NATURE_LAYER", 46, sceneId, { x: 74, y: 0, z: 26 }, "MAT_TREE_EUCALYPTUS_001"),
          createCommand("REGION_BENCH_001", "BENCH", "BENCH_PARK_001", "DETAIL_LAYER", 50, sceneId, { x: 46, y: 0, z: 26 }, "MAT_BENCH_PARK_001")
        ],
        updateCommands: [],
        cleanupCommands: [],
        commandMetadata: {
          supportedCommandTypes: [
            "CREATE_OBJECT_COMMAND",
            "UPDATE_OBJECT_COMMAND",
            "REMOVE_OBJECT_COMMAND"
          ],
          commandCount: 28,
          cleanupSupported: true
        }
      }
    ]
  };
}

function createCommand(objectId, objectType, assetReference, renderLayer, layerOrdering, sceneId, position, materialReference) {
  return {
    commandType: "CREATE_OBJECT_COMMAND",
    objectId,
    objectType,
    assetReference,
    transform: {
      transformId: `${objectId}_TRANSFORM_00`,
      position,
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    },
    geometryReference: {
      geometryId: `${objectId}_GEOMETRY`,
      sourceFootprintId: `${objectId}_FOOTPRINT`
    },
    renderLayer,
    lod: "LOD_NEAR",
    materialReference,
    layerOrdering,
    sceneId
  };
}

test("region creation produces a connected multi-town scene", () => {
  const result = regionTestModule.createAtlasControlledRegionTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.townCount, 3);
  assert.equal(result.objectCount, 28);
  assert.deepEqual(result.sceneCategories, [
    "civic",
    "commercial",
    "detail",
    "environment",
    "intersection",
    "landmark",
    "localRoad",
    "nature",
    "path",
    "regionalRoad",
    "residential",
    "transport"
  ]);
});

test("town grouping validates regional composition", () => {
  const result = regionTestModule.createAtlasControlledRegionTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.relationshipSummary.regionalRoad, 2);
  assert.equal(result.relationshipSummary.localRoad, 3);
  assert.equal(result.relationshipSummary.intersection, 2);
  assert.equal(result.relationshipSummary.path, 1);
  assert.equal(result.relationshipSummary.transport, 2);
  assert.equal(result.relationshipSummary.residential, 6);
  assert.equal(result.relationshipSummary.commercial, 3);
  assert.equal(result.relationshipSummary.environment, 2);
  assert.equal(result.relationshipSummary.nature, 3);
  assert.equal(result.relationshipSummary.civic, 1);
  assert.equal(result.relationshipSummary.landmark, 2);
  assert.equal(result.relationshipSummary.detail, 1);
});

test("transport validation preserves regional structure", () => {
  const result = regionTestModule.createAtlasControlledRegionTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.validation.townGroupingValid, true);
  assert.equal(result.validation.regionalRoadHierarchyValid, true);
  assert.equal(result.validation.landmarkPlacementValid, true);
  assert.equal(result.validation.naturalEnvironmentRelationshipsValid, true);
  assert.equal(result.validation.transportConnectionsValid, true);
});

test("landmark validation preserves references", () => {
  const result = regionTestModule.createAtlasControlledRegionTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.validation.assetReferencesValid, true);
  assert.equal(result.validation.layerOrderingValid, true);
  assert.equal(result.validation.relationshipsPreserved, true);
  assert.equal(result.validation.commandsValid, true);
});

test("cleanup succeeds", () => {
  const result = regionTestModule.createAtlasControlledRegionTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.cleanupStatus.cleanupCompleted, true);
  assert.equal(result.cleanupStatus.sourceStateRestored, true);
});

test("deterministic output", () => {
  const first = regionTestModule.createAtlasControlledRegionTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );
  const second = regionTestModule.createAtlasControlledRegionTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicOutput, true);
});
