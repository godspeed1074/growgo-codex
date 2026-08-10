import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

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

const treeGameplayGlbPath = path.join(
  repoRoot,
  "asset-factory-workspace",
  "production",
  "COASTAL_NATURE_FAMILY_001",
  "export",
  "TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb"
);

async function loadTreeGameplayGlbArrayBuffer() {
  const buffer = await readFile(treeGameplayGlbPath);
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
}

function createFetchProvider(arrayBuffer) {
  return async (requestedPath) => ({
    ok: requestedPath.endsWith("TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb"),
    async arrayBuffer() {
      return arrayBuffer;
    }
  });
}

test("actual gameplay GLB projection parses the approved eucalyptus file", async () => {
  const arrayBuffer = await loadTreeGameplayGlbArrayBuffer();
  const projection =
    approvedAssetModule.parseTreeEucalyptusApprovedGameplayGlbProjection(
      arrayBuffer
    );

  assert.ok(projection.meshCount > 0);
  assert.ok(projection.materialCount > 0);
  assert.ok(projection.vertexCount > 0);
  assert.ok(projection.projectedPolygons.length > 0);
});

test("approved live asset controller loads the actual gameplay GLB and creates one Atlas-owned live primitive", async () => {
  const { map, layer } = createPrimitiveLayer();
  const controller =
    approvedAssetModule.createDeveloperOnlyAtlasFirstApprovedLiveAssetController({
      primitiveLayer: layer,
      fetchProvider: createFetchProvider(
        await loadTreeGameplayGlbArrayBuffer()
      )
    });

  const result = await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });

  assert.equal(result.outcome, "created");
  assert.equal(result.status.selectedAssetId, "TREE_EUCALYPTUS_001");
  assert.equal(result.status.selectedAssetVersion, "v001");
  assert.equal(result.status.approvedAssetStatus, "approved");
  assert.match(
    result.status.assetSource,
    /actual TREE_EUCALYPTUS_001_LOD_GAMEPLAY\.glb/
  );
  assert.match(
    result.status.resolvedGlbIdentity,
    /TREE_EUCALYPTUS_001_LOD_GAMEPLAY\.glb/
  );
  assert.equal(result.status.representationMode, "actual_glb_projected_mesh_overlay");
  assert.equal(result.status.loaderStatus, "loaded_actual_glb");
  assert.equal(result.status.actualGlbLoaded, true);
  assert.ok(result.status.meshCount > 0);
  assert.ok(result.status.materialCount > 0);
  assert.equal(result.status.liveAssetPresent, true);
  assert.equal(map.layerCount(), 1);
});

test("approved live asset controller updates deterministically and preserves actual GLB identity", async () => {
  const { layer } = createPrimitiveLayer();
  const controller =
    approvedAssetModule.createDeveloperOnlyAtlasFirstApprovedLiveAssetController({
      primitiveLayer: layer,
      fetchProvider: createFetchProvider(
        await loadTreeGameplayGlbArrayBuffer()
      )
    });

  await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });
  const updated = await controller.updateFirstApprovedLiveAsset({
    latitude: -38.118,
    longitude: 144.612
  });

  assert.equal(updated.outcome, "updated");
  assert.equal(updated.status.selectedAssetId, "TREE_EUCALYPTUS_001");
  assert.equal(updated.status.representationMode, "actual_glb_projected_mesh_overlay");
  assert.equal(updated.status.actualGlbLoaded, true);
  assert.equal(updated.status.latitude, -38.118);
  assert.equal(updated.status.longitude, 144.612);
  assert.equal(
    updated.status.primitiveObjectId,
    approvedAssetModule.DEFAULT_FIRST_APPROVED_LIVE_ASSET_PRIMITIVE_ID
  );
});

test("approved live asset controller clears cleanly and leaves zero Atlas-owned primitive objects", async () => {
  const { map, layer } = createPrimitiveLayer();
  const controller =
    approvedAssetModule.createDeveloperOnlyAtlasFirstApprovedLiveAssetController({
      primitiveLayer: layer,
      fetchProvider: createFetchProvider(
        await loadTreeGameplayGlbArrayBuffer()
      )
    });

  await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });

  const cleared = controller.clearFirstApprovedLiveAsset();

  assert.equal(cleared.outcome, "removed");
  assert.equal(cleared.status.liveAssetPresent, false);
  assert.equal(layer.getAtlasVisualPrimitiveLayerStatus().atlasPrimitiveCount, 0);
  assert.equal(map.layerCount(), 0);
});

test("approved live asset controller fails closed when the actual GLB fetch fails", async () => {
  const { layer } = createPrimitiveLayer();
  const controller =
    approvedAssetModule.createDeveloperOnlyAtlasFirstApprovedLiveAssetController({
      primitiveLayer: layer,
      fetchProvider: async () => ({ ok: false, async arrayBuffer() { return new ArrayBuffer(0); } })
    });

  const result = await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "APPROVED_ASSET_GLB_FETCH_FAILED");
  assert.equal(result.status.actualGlbLoaded, false);
});

test("approved live asset controller fails closed when primitive layer is unavailable", async () => {
  const controller =
    approvedAssetModule.createDeveloperOnlyAtlasFirstApprovedLiveAssetController({
      primitiveLayer: null
    });

  const result = await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "ATLAS_PRIMITIVE_LAYER_UNAVAILABLE");
});
