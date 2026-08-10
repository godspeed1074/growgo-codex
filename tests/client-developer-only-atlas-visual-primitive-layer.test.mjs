import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const primitiveLayerModule = await import(
  path.join(repoRoot, "client", "developer-only-atlas-visual-primitive-layer.mjs")
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

test("create point primitive on attached live map", () => {
  const map = createMapStub();
  const layer = primitiveLayerModule.createDeveloperOnlyAtlasVisualPrimitiveLayer({
    getGrowGoMap: () => map,
    attachmentStatusProvider: () => createAttachedStatus(),
    leafletProvider: () => createLeafletStub()
  });

  const result = layer.upsertAtlasVisualPrimitive({
    primitiveId: "ATLAS_DEV_POINT_001",
    primitiveType: "point_anchor",
    latitude: -38.12,
    longitude: 144.61
  });

  assert.equal(result.outcome, "created");
  assert.equal(result.reasonCode, "PRIMITIVE_CREATED");
  assert.equal(result.status.atlasPrimitiveCount, 1);
  assert.deepEqual(result.status.atlasPrimitiveIds, ["ATLAS_DEV_POINT_001"]);
  assert.deepEqual(result.status.atlasPrimitiveTypes, ["point_anchor"]);
  assert.equal(map.layerCount(), 1);
});

test("create sprite primitive on attached live map", () => {
  const map = createMapStub();
  const layer = primitiveLayerModule.createDeveloperOnlyAtlasVisualPrimitiveLayer({
    getGrowGoMap: () => map,
    attachmentStatusProvider: () => createAttachedStatus(),
    leafletProvider: () => createLeafletStub()
  });

  const result = layer.upsertAtlasVisualPrimitive({
    primitiveId: "ATLAS_DEV_SPRITE_001",
    primitiveType: "sprite_image",
    latitude: -38.10,
    longitude: 144.63
  });

  assert.equal(result.outcome, "created");
  assert.equal(result.status.atlasPrimitiveCount, 1);
  assert.deepEqual(result.status.atlasPrimitiveTypes, ["sprite_image"]);
});

test("update existing primitive repositions deterministically", () => {
  const map = createMapStub();
  const layer = primitiveLayerModule.createDeveloperOnlyAtlasVisualPrimitiveLayer({
    getGrowGoMap: () => map,
    attachmentStatusProvider: () => createAttachedStatus(),
    leafletProvider: () => createLeafletStub()
  });

  layer.upsertAtlasVisualPrimitive({
    primitiveId: "ATLAS_DEV_POINT_001",
    primitiveType: "point_anchor",
    latitude: -38.12,
    longitude: 144.61
  });
  const updated = layer.upsertAtlasVisualPrimitive({
    primitiveId: "ATLAS_DEV_POINT_001",
    primitiveType: "point_anchor",
    latitude: -38.10,
    longitude: 144.63,
    label: "Atlas Point Updated"
  });

  assert.equal(updated.outcome, "updated");
  assert.equal(updated.reasonCode, "PRIMITIVE_UPDATED");
  assert.equal(updated.status.atlasPrimitiveCount, 1);
  assert.equal(updated.status.atlasPrimitiveEntries[0].latitude, -38.1);
  assert.equal(updated.status.atlasPrimitiveEntries[0].longitude, 144.63);
});

test("remove and clear fully clean ownership", () => {
  const map = createMapStub();
  const layer = primitiveLayerModule.createDeveloperOnlyAtlasVisualPrimitiveLayer({
    getGrowGoMap: () => map,
    attachmentStatusProvider: () => createAttachedStatus(),
    leafletProvider: () => createLeafletStub()
  });

  layer.upsertAtlasVisualPrimitive({
    primitiveId: "ATLAS_DEV_POINT_001",
    primitiveType: "point_anchor",
    latitude: -38.12,
    longitude: 144.61
  });
  layer.upsertAtlasVisualPrimitive({
    primitiveId: "ATLAS_DEV_SPRITE_001",
    primitiveType: "sprite_image",
    latitude: -38.10,
    longitude: 144.63
  });

  const removed = layer.removeAtlasVisualPrimitive({
    primitiveId: "ATLAS_DEV_POINT_001"
  });
  const cleared = layer.clearAllAtlasVisualPrimitives();

  assert.equal(removed.outcome, "removed");
  assert.equal(cleared.outcome, "cleared");
  assert.equal(cleared.status.atlasPrimitiveCount, 0);
  assert.equal(cleared.status.atlasOwnedCanvasCount, 0);
  assert.equal(cleared.status.atlasOwnedListenerCount, 0);
  assert.equal(map.layerCount(), 0);
});

test("fail closed when Atlas is not attached", () => {
  const map = createMapStub();
  const layer = primitiveLayerModule.createDeveloperOnlyAtlasVisualPrimitiveLayer({
    getGrowGoMap: () => map,
    attachmentStatusProvider: () => ({
      attached: false,
      exactLiveMapBound: false,
      attachedMapIdentityId: null
    }),
    leafletProvider: () => createLeafletStub()
  });

  const result = layer.upsertAtlasVisualPrimitive({
    primitiveId: "ATLAS_DEV_POINT_001",
    primitiveType: "point_anchor",
    latitude: -38.12,
    longitude: 144.61
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "ATLAS_NOT_ATTACHED");
  assert.equal(layer.getAtlasVisualPrimitiveLayerStatus().atlasPrimitiveCount, 0);
});
