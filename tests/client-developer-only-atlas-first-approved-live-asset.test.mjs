import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const primitiveLayerModule = await import(
  path.join(repoRoot, "client", "developer-only-atlas-visual-primitive-layer.mjs")
);
const approvedAssetModule = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-first-approved-live-asset.mjs"
  )
);

function createMapStub(center = { lat: -38.12, lng: 144.61 }) {
  const layers = new Set();
  return {
    getCenter() {
      return center;
    },
    addLayer(layer) {
      layers.add(layer);
      return this;
    },
    removeLayer(layer) {
      layers.delete(layer);
      return this;
    },
    layerCount() {
      return layers.size;
    }
  };
}

function createLeafletStub() {
  return {
    divIcon(options) {
      return { options };
    },
    marker([lat, lng], options) {
      let mapRef = null;
      return {
        lat,
        lng,
        options,
        addTo(map) {
          mapRef = map;
          map.addLayer(this);
          return this;
        },
        setLatLng([nextLat, nextLng]) {
          this.lat = nextLat;
          this.lng = nextLng;
          return this;
        },
        setIcon(nextIcon) {
          this.options = {
            ...this.options,
            icon: nextIcon
          };
          return this;
        },
        remove() {
          mapRef?.removeLayer(this);
          mapRef = null;
        }
      };
    }
  };
}

function createAttachedStatus() {
  return {
    attached: true,
    exactLiveMapBound: true,
    attachedMapIdentityId: "ATLAS_LIVE_MAP_001"
  };
}

function createPrimitiveLayer() {
  const map = createMapStub();
  const layer = primitiveLayerModule.createDeveloperOnlyAtlasVisualPrimitiveLayer({
    getGrowGoMap: () => map,
    attachmentStatusProvider: () => createAttachedStatus(),
    leafletProvider: () => createLeafletStub()
  });
  return { map, layer };
}

test("approved live asset controller resolves TREE_EUCALYPTUS_001 and creates an Atlas-owned live primitive", () => {
  const { map, layer } = createPrimitiveLayer();
  const controller =
    approvedAssetModule.createDeveloperOnlyAtlasFirstApprovedLiveAssetController({
      primitiveLayer: layer
    });

  const result = controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });

  assert.equal(result.outcome, "created");
  assert.equal(result.status.selectedAssetId, "TREE_EUCALYPTUS_001");
  assert.equal(result.status.selectedAssetVersion, "v001");
  assert.equal(result.status.approvedAssetStatus, "approved");
  assert.match(
    result.status.assetSource,
    /developer-only-atlas-asset-registry\.mjs/
  );
  assert.match(
    result.status.resolvedGlbIdentity,
    /TREE_EUCALYPTUS_001_LOD_GAMEPLAY\.glb/
  );
  assert.equal(result.status.liveAssetPresent, true);
  assert.equal(map.layerCount(), 1);
});

test("approved live asset controller updates deterministically and preserves asset identity", () => {
  const { layer } = createPrimitiveLayer();
  const controller =
    approvedAssetModule.createDeveloperOnlyAtlasFirstApprovedLiveAssetController({
      primitiveLayer: layer
    });

  controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });
  const updated = controller.updateFirstApprovedLiveAsset({
    latitude: -38.115,
    longitude: 144.615
  });

  assert.equal(updated.outcome, "updated");
  assert.equal(updated.status.selectedAssetId, "TREE_EUCALYPTUS_001");
  assert.equal(updated.status.latitude, -38.115);
  assert.equal(updated.status.longitude, 144.615);
  assert.equal(
    updated.status.primitiveObjectId,
    approvedAssetModule.DEFAULT_FIRST_APPROVED_LIVE_ASSET_PRIMITIVE_ID
  );
});

test("approved live asset controller clears cleanly and leaves zero Atlas-owned primitive objects", () => {
  const { map, layer } = createPrimitiveLayer();
  const controller =
    approvedAssetModule.createDeveloperOnlyAtlasFirstApprovedLiveAssetController({
      primitiveLayer: layer
    });

  controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });

  const cleared = controller.clearFirstApprovedLiveAsset();

  assert.equal(cleared.outcome, "removed");
  assert.equal(cleared.status.liveAssetPresent, false);
  assert.equal(layer.getAtlasVisualPrimitiveLayerStatus().atlasPrimitiveCount, 0);
  assert.equal(map.layerCount(), 0);
});

test("approved live asset controller fails closed when primitive layer is unavailable", () => {
  const controller =
    approvedAssetModule.createDeveloperOnlyAtlasFirstApprovedLiveAssetController({
      primitiveLayer: null
    });

  const result = controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "ATLAS_PRIMITIVE_LAYER_UNAVAILABLE");
});
