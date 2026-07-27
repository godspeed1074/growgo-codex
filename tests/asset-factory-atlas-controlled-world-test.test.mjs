import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const worldTestModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-controlled-world-test.mjs"
  )
);

function createDirectRenderCommands() {
  const sceneId = "CONTROLLED_WORLD_SOURCE_SCENE_001";
  return {
    schemaId: "ATLAS_RENDER_COMMANDS_001",
    entries: [
      {
        sceneId,
        sceneType: "COASTAL_STREET_SCENE",
        commands: [
          createCommand("WORLD_HIGHWAY_001", "WORLD_HIGHWAY", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 10, sceneId, { x: 0, y: 0, z: 0 }, "MAT_ROAD_STANDARD_001"),
          createCommand("WORLD_HIGHWAY_002", "WORLD_ARTERIAL", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 11, sceneId, { x: 40, y: 0, z: 0 }, "MAT_ROAD_STANDARD_001"),
          createCommand("WORLD_COASTAL_ROUTE_001", "COASTAL_ROUTE", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 12, sceneId, { x: 80, y: 0, z: 0 }, "MAT_ROAD_STANDARD_001"),
          createCommand("WORLD_RAIL_CORRIDOR_001", "RAIL_CORRIDOR", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 13, sceneId, { x: 120, y: 0, z: 0 }, "MAT_ROAD_STANDARD_001"),

          createCommand("REGION_COASTAL_CONNECTOR_001", "CONNECTOR_ROUTE", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 14, sceneId, { x: 10, y: 0, z: 10 }, "MAT_ROAD_STANDARD_001"),
          createCommand("REGION_INLAND_CONNECTOR_001", "CONNECTOR_ROUTE", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 15, sceneId, { x: 50, y: 0, z: 10 }, "MAT_ROAD_STANDARD_001"),
          createCommand("REGION_HINTERLAND_CONNECTOR_001", "CONNECTOR_ROUTE", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 16, sceneId, { x: 90, y: 0, z: 10 }, "MAT_ROAD_STANDARD_001"),
          createCommand("REGION_COASTAL_TOWN_ALPHA_ROUTE_001", "TRANSPORT_ROUTE", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 17, sceneId, { x: 14, y: 0, z: 16 }, "MAT_ROAD_STANDARD_001"),
          createCommand("REGION_INLAND_TOWN_BETA_ROUTE_001", "TRANSPORT_ROUTE", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 18, sceneId, { x: 54, y: 0, z: 16 }, "MAT_ROAD_STANDARD_001"),
          createCommand("REGION_HINTERLAND_TOWN_GAMMA_ROUTE_001", "TRANSPORT_ROUTE", "ROAD_STRAIGHT_SMALL_001", "ROAD_LAYER", 19, sceneId, { x: 94, y: 0, z: 16 }, "MAT_ROAD_STANDARD_001"),
          createCommand("WORLD_INTERSECTION_001", "ROAD_INTERSECTION", "ROAD_INTERSECTION_STANDARD_001", "ROAD_LAYER", 20, sceneId, { x: 20, y: 0, z: 8 }, "MAT_ROAD_STANDARD_001"),
          createCommand("WORLD_INTERSECTION_002", "ROAD_INTERSECTION", "ROAD_INTERSECTION_STANDARD_001", "ROAD_LAYER", 21, sceneId, { x: 60, y: 0, z: 8 }, "MAT_ROAD_STANDARD_001"),
          createCommand("WORLD_INTERSECTION_003", "ROAD_INTERSECTION", "ROAD_INTERSECTION_STANDARD_001", "ROAD_LAYER", 22, sceneId, { x: 100, y: 0, z: 8 }, "MAT_ROAD_STANDARD_001"),
          createCommand("WORLD_PATH_001", "SIDEWALK_PATH", "PATH_STANDARD_001", "ROAD_LAYER", 23, sceneId, { x: 24, y: 0, z: 20 }, "MAT_PATH_STANDARD_001"),
          createCommand("WORLD_TRAIL_001", "TRAIL_PATH", "PATH_STANDARD_001", "ROAD_LAYER", 24, sceneId, { x: 84, y: 0, z: 24 }, "MAT_PATH_STANDARD_001"),
          createCommand("WORLD_RAIL_HUB_001", "RAIL_HUB", "ROAD_INTERSECTION_STANDARD_001", "ROAD_LAYER", 25, sceneId, { x: 62, y: 0, z: 18 }, "MAT_ROAD_STANDARD_001"),
          createCommand("WORLD_BUS_STATION_001", "BUS_STATION", "ROAD_INTERSECTION_STANDARD_001", "ROAD_LAYER", 26, sceneId, { x: 26, y: 0, z: 18 }, "MAT_ROAD_STANDARD_001"),
          createCommand("WORLD_FERRY_TERMINAL_001", "FERRY_TERMINAL", "ROAD_INTERSECTION_STANDARD_001", "ROAD_LAYER", 27, sceneId, { x: 108, y: 0, z: 18 }, "MAT_ROAD_STANDARD_001"),

          createCommand("REGION_COASTAL_TOWN_ALPHA_HOUSE_001", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 30, sceneId, { x: 12, y: 0, z: 24 }, "MAT_SUBURBAN_HOUSE_001"),
          createCommand("REGION_COASTAL_TOWN_ALPHA_SHOP_001", "BAKERY", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 31, sceneId, { x: 18, y: 0, z: 24 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("REGION_COASTAL_TOWN_ALPHA_CENTRE_001", "TOWN_CENTRE_PLAZA", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 32, sceneId, { x: 24, y: 0, z: 24 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("REGION_COASTAL_TOWN_ALPHA_LANDMARK_001", "LANDMARK_LIGHTHOUSE", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 33, sceneId, { x: 30, y: 0, z: 24 }, "MAT_COMMERCIAL_SHOP_001"),

          createCommand("REGION_INLAND_TOWN_BETA_HOUSE_001", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 34, sceneId, { x: 52, y: 0, z: 24 }, "MAT_SUBURBAN_HOUSE_001"),
          createCommand("REGION_INLAND_TOWN_BETA_SHOP_001", "CAFE", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 35, sceneId, { x: 58, y: 0, z: 24 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("REGION_INLAND_TOWN_BETA_CIVIC_001", "LIBRARY", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 36, sceneId, { x: 64, y: 0, z: 24 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("REGION_INLAND_TOWN_BETA_LANDMARK_001", "LANDMARK_MONUMENT", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 37, sceneId, { x: 70, y: 0, z: 24 }, "MAT_COMMERCIAL_SHOP_001"),

          createCommand("REGION_HINTERLAND_TOWN_GAMMA_HOUSE_001", "HOUSE", "BUILDING_RESIDENTIAL_SUBURBAN_001", "OBJECT_LAYER", 38, sceneId, { x: 92, y: 0, z: 24 }, "MAT_SUBURBAN_HOUSE_001"),
          createCommand("REGION_HINTERLAND_TOWN_GAMMA_SHOP_001", "SHOP", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 39, sceneId, { x: 98, y: 0, z: 24 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("REGION_HINTERLAND_TOWN_GAMMA_CENTRE_001", "MAIN_STREET_CENTRE", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 40, sceneId, { x: 104, y: 0, z: 24 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("REGION_HINTERLAND_TOWN_GAMMA_LANDMARK_001", "LANDMARK_LOOKOUT", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 41, sceneId, { x: 110, y: 0, z: 24 }, "MAT_COMMERCIAL_SHOP_001"),

          createCommand("REGION_HINTERLAND_TOWN_DELTA_LANDMARK_001", "LANDMARK_HISTORIC_SITE", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 42, sceneId, { x: 116, y: 0, z: 24 }, "MAT_COMMERCIAL_SHOP_001"),
          createCommand("REGION_HINTERLAND_TOWN_DELTA_CIVIC_001", "COMMUNITY_HALL", "BUILDING_COMMERCIAL_SMALL_SHOP_001", "OBJECT_LAYER", 43, sceneId, { x: 122, y: 0, z: 24 }, "MAT_COMMERCIAL_SHOP_001"),

          createCommand("REGION_COASTAL_BEACH_001", "BEACH_RESERVE", "PARK_TREATMENT_001", "GROUND_LAYER", 44, sceneId, { x: 16, y: 0, z: 34 }, "MAT_PARK_GROUND_001"),
          createCommand("REGION_INLAND_PARK_001", "PARK", "PARK_TREATMENT_001", "GROUND_LAYER", 45, sceneId, { x: 56, y: 0, z: 34 }, "MAT_PARK_GROUND_001"),
          createCommand("REGION_HINTERLAND_FOREST_001", "FOREST_RESERVE", "PARK_TREATMENT_001", "GROUND_LAYER", 46, sceneId, { x: 96, y: 0, z: 34 }, "MAT_PARK_GROUND_001"),
          createCommand("WORLD_WETLAND_001", "WETLAND_RESERVE", "PARK_TREATMENT_001", "GROUND_LAYER", 47, sceneId, { x: 126, y: 0, z: 34 }, "MAT_PARK_GROUND_001"),

          createCommand("REGION_COASTAL_TREE_001", "TREE", "TREE_COASTAL_001", "NATURE_LAYER", 48, sceneId, { x: 14, y: 0, z: 38 }, "MAT_TREE_EUCALYPTUS_001"),
          createCommand("REGION_INLAND_TREE_001", "TREE", "TREE_EUCALYPTUS_001", "NATURE_LAYER", 49, sceneId, { x: 54, y: 0, z: 38 }, "MAT_TREE_EUCALYPTUS_001"),
          createCommand("REGION_HINTERLAND_TREE_001", "TREE", "TREE_EUCALYPTUS_001", "NATURE_LAYER", 50, sceneId, { x: 94, y: 0, z: 38 }, "MAT_TREE_EUCALYPTUS_001"),
          createCommand("WORLD_ROCK_001", "ROCK", "ROCK_COASTAL_001", "NATURE_LAYER", 51, sceneId, { x: 124, y: 0, z: 38 }, "MAT_TREE_EUCALYPTUS_001"),

          createCommand("WORLD_SIGNPOST_001", "SIGNPOST", "BENCH_PARK_001", "DETAIL_LAYER", 52, sceneId, { x: 66, y: 0, z: 30 }, "MAT_BENCH_PARK_001"),
          createCommand("WORLD_LOOKOUT_BENCH_001", "BENCH", "BENCH_PARK_001", "DETAIL_LAYER", 53, sceneId, { x: 108, y: 0, z: 30 }, "MAT_BENCH_PARK_001")
        ],
        updateCommands: [],
        cleanupCommands: [],
        commandMetadata: {
          supportedCommandTypes: [
            "CREATE_OBJECT_COMMAND",
            "UPDATE_OBJECT_COMMAND",
            "REMOVE_OBJECT_COMMAND"
          ],
          commandCount: 42,
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

test("world creation produces a connected multi-region scene", () => {
  const result = worldTestModule.createAtlasControlledWorldTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.regionCount, 3);
  assert.equal(result.townCount, 4);
  assert.equal(result.objectCount, 42);
  assert.deepEqual(result.sceneCategories, [
    "civic",
    "commercial",
    "detail",
    "environment",
    "intersection",
    "landmark",
    "nature",
    "path",
    "regionalConnector",
    "residential",
    "townCentre",
    "transportHub",
    "worldCorridor"
  ]);
});

test("region grouping validates world composition", () => {
  const result = worldTestModule.createAtlasControlledWorldTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.relationshipSummary.worldCorridor, 4);
  assert.equal(result.relationshipSummary.regionalConnector, 6);
  assert.equal(result.relationshipSummary.intersection, 3);
  assert.equal(result.relationshipSummary.path, 2);
  assert.equal(result.relationshipSummary.transportHub, 3);
  assert.equal(result.relationshipSummary.residential, 4);
  assert.equal(result.relationshipSummary.commercial, 3);
  assert.equal(result.relationshipSummary.townCentre, 2);
  assert.equal(result.relationshipSummary.civic, 2);
  assert.equal(result.relationshipSummary.landmark, 3);
  assert.equal(result.relationshipSummary.environment, 4);
  assert.equal(result.relationshipSummary.nature, 4);
  assert.equal(result.relationshipSummary.detail, 2);
});

test("travel validation preserves world corridor structure", () => {
  const result = worldTestModule.createAtlasControlledWorldTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.validation.regionGroupingValid, true);
  assert.equal(result.validation.regionRelationshipsValid, true);
  assert.equal(result.validation.worldTravelCorridorsValid, true);
  assert.equal(result.validation.environmentDiversityValid, true);
});

test("landmark validation preserves references", () => {
  const result = worldTestModule.createAtlasControlledWorldTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.validation.landmarkDistributionValid, true);
  assert.equal(result.validation.assetReferencesValid, true);
  assert.equal(result.validation.layerOrderingValid, true);
  assert.equal(result.validation.relationshipsPreserved, true);
  assert.equal(result.validation.commandsValid, true);
});

test("cleanup succeeds", () => {
  const result = worldTestModule.createAtlasControlledWorldTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.equal(result.cleanupStatus.cleanupCompleted, true);
  assert.equal(result.cleanupStatus.sourceStateRestored, true);
});

test("deterministic output", () => {
  const first = worldTestModule.createAtlasControlledWorldTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );
  const second = worldTestModule.createAtlasControlledWorldTest(
    createDirectRenderCommands(),
    { rendererAuthorization: "AUTHORIZED_CONTROLLED_RENDER_TEST" }
  );

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicOutput, true);
});
