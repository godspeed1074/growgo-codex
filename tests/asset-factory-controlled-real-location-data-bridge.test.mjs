import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const locationBridgeModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "controlled-real-location-data-bridge.mjs"
  )
);

test("controlled real location data bridge validates a passive deterministic world request contract", () => {
  const result =
    locationBridgeModule.validateControlledRealLocationDataBridge();

  assert.equal(result.ok, true);
  assert.equal(
    result.locationBridge.locationRequest.locationId,
    "MORNINGTON_PIER_COASTAL_001"
  );
  assert.equal(
    result.locationBridge.locationClassification.classification,
    "coastal"
  );
  assert.deepEqual(
    result.locationBridge.assetCandidateRequest.possibleAssetFamilies,
    [
      "LIGHTHOUSE_COASTAL_FAMILY_001",
      "BUILDING_HOUSE_SMALL_COASTAL_FAMILY_001",
      "ROAD_STRAIGHT_SMALL_FAMILY_001",
      "TREE_EUCALYPTUS_FAMILY_001"
    ]
  );
  assert.equal(
    result.locationBridge.runtimeHandoff.activationMode,
    "manual-only-location-bridge"
  );
  assert.equal(
    result.locationBridge.runtimeHandoff.runtimeActivationAuthorized,
    false
  );
});

test("same location and world seed produce the same deterministic world request", () => {
  const first =
    locationBridgeModule.createControlledRealLocationWorldRequest();
  const second =
    locationBridgeModule.createControlledRealLocationWorldRequest();
  const third = locationBridgeModule.createControlledRealLocationWorldRequest({
    ...locationBridgeModule.controlledRealLocationDataBridgeDefinition.locationRequest,
    worldSeed: "growgo-coastal-alpha-seed-002"
  });

  assert.equal(
    first.deterministicWorldRequest.worldRequestId,
    second.deterministicWorldRequest.worldRequestId
  );
  assert.notEqual(
    first.deterministicWorldRequest.worldRequestId,
    third.deterministicWorldRequest.worldRequestId
  );
  assert.deepEqual(
    first.deterministicWorldRequest.placementPreview,
    second.deterministicWorldRequest.placementPreview
  );
});

test("controlled real location data bridge rejects invalid coordinates and unsupported environment types safely", () => {
  const invalidLatitude =
    locationBridgeModule.validateControlledRealLocationDataBridge({
      ...locationBridgeModule.controlledRealLocationDataBridgeDefinition,
      locationRequest: {
        ...locationBridgeModule.controlledRealLocationDataBridgeDefinition.locationRequest,
        latitude: 121
      }
    });

  const invalidEnvironment =
    locationBridgeModule.validateControlledRealLocationDataBridge({
      ...locationBridgeModule.controlledRealLocationDataBridgeDefinition,
      locationRequest: {
        ...locationBridgeModule.controlledRealLocationDataBridgeDefinition.locationRequest,
        environmentType: "desert"
      }
    });

  assert.equal(invalidLatitude.ok, false);
  assert.equal(invalidLatitude.errorCode, "invalid_latitude");
  assert.equal(invalidEnvironment.ok, false);
  assert.equal(invalidEnvironment.errorCode, "invalid_environment_type");
});

test("controlled real location data bridge remains passive and does not connect GPS, map services, or live runtime", () => {
  const result =
    locationBridgeModule.validateControlledRealLocationDataBridge();

  assert.equal(result.ok, true);
  assert.equal(result.locationBridge.compatibility.passiveOnly, true);
  assert.equal(result.locationBridge.compatibility.gpsConnected, false);
  assert.equal(
    result.locationBridge.compatibility.externalMapServicesQueried,
    false
  );
  assert.equal(
    result.locationBridge.compatibility.liveWorldObjectsSpawned,
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.locationBridge, "gpsHandle"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.locationBridge.runtimeHandoff,
      "mapAttachment"
    ),
    false
  );
});
