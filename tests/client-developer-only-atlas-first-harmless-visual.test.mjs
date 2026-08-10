import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const visualModule = await import(
  path.join(repoRoot, "client", "developer-only-atlas-first-harmless-visual.mjs")
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
    hasLayer(layer) {
      return layers.has(layer);
    },
    layerCount() {
      return layers.size;
    }
  };
}

function createLeafletStub() {
  return {
    divIcon(options) {
      return { __iconOptions: options };
    },
    marker([lat, lng], options) {
      let mapRef = null;
      return {
        __lat: lat,
        __lng: lng,
        __options: options,
        addTo(map) {
          mapRef = map;
          map.addLayer(this);
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

test("show is blocked when Atlas is not attached", () => {
  const map = createMapStub();
  const controller =
    visualModule.createDeveloperOnlyAtlasFirstHarmlessVisualController({
      getGrowGoMap: () => map,
      attachmentStatusProvider: () => ({
        attached: false,
        exactLiveMapBound: false,
        attachedMapIdentityId: null
      }),
      leafletProvider: () => createLeafletStub()
    });

  const result = controller.showAtlasFirstHarmlessVisual();
  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "ATLAS_NOT_ATTACHED");
  assert.equal(controller.getAtlasFirstHarmlessVisualStatus().visualPresent, false);
});

test("show renders exactly one harmless visual on the attached live map", () => {
  const map = createMapStub();
  const controller =
    visualModule.createDeveloperOnlyAtlasFirstHarmlessVisualController({
      getGrowGoMap: () => map,
      attachmentStatusProvider: () => ({
        attached: true,
        exactLiveMapBound: true,
        attachedMapIdentityId: "ATLAS_LIVE_MAP_001"
      }),
      leafletProvider: () => createLeafletStub()
    });

  const result = controller.showAtlasFirstHarmlessVisual();

  assert.equal(result.outcome, "rendered");
  assert.equal(result.reasonCode, "VISUAL_RENDERED");
  assert.equal(result.status.visualPresent, true);
  assert.equal(result.status.visualType, "leaflet_div_marker");
  assert.equal(result.status.attachedMapIdentityId, "ATLAS_LIVE_MAP_001");
  assert.equal(result.status.visualLatitude, -38.12);
  assert.equal(result.status.visualLongitude, 144.61);
  assert.equal(result.status.atlasOwnedLayerCount, 1);
  assert.equal(result.status.atlasOwnedCanvasCount, 0);
  assert.equal(result.status.atlasOwnedListenerCount, 0);
  assert.equal(map.layerCount(), 1);
});

test("duplicate show does not create another visual", () => {
  const map = createMapStub();
  const controller =
    visualModule.createDeveloperOnlyAtlasFirstHarmlessVisualController({
      getGrowGoMap: () => map,
      attachmentStatusProvider: () => ({
        attached: true,
        exactLiveMapBound: true,
        attachedMapIdentityId: "ATLAS_LIVE_MAP_001"
      }),
      leafletProvider: () => createLeafletStub()
    });

  controller.showAtlasFirstHarmlessVisual();
  const duplicate = controller.showAtlasFirstHarmlessVisual();

  assert.equal(duplicate.outcome, "noop");
  assert.equal(duplicate.reasonCode, "VISUAL_ALREADY_PRESENT");
  assert.equal(map.layerCount(), 1);
});

test("clear removes the harmless visual cleanly", () => {
  const map = createMapStub();
  const controller =
    visualModule.createDeveloperOnlyAtlasFirstHarmlessVisualController({
      getGrowGoMap: () => map,
      attachmentStatusProvider: () => ({
        attached: true,
        exactLiveMapBound: true,
        attachedMapIdentityId: "ATLAS_LIVE_MAP_001"
      }),
      leafletProvider: () => createLeafletStub()
    });

  controller.showAtlasFirstHarmlessVisual();
  const cleared = controller.clearAtlasFirstHarmlessVisual();

  assert.equal(cleared.outcome, "cleared");
  assert.equal(cleared.reasonCode, "VISUAL_CLEARED");
  assert.equal(cleared.status.visualPresent, false);
  assert.equal(cleared.status.atlasOwnedLayerCount, 0);
  assert.equal(map.layerCount(), 0);
});
