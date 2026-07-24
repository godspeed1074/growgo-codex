import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "ground-coastal-grass-real-glb-renderer-preview-test.mjs"
  )
);

function createExistsSyncStub(existingPaths) {
  const normalized = new Set(existingPaths);
  return (candidatePath) => normalized.has(candidatePath);
}

test("ground coastal grass real GLB renderer preview validates when real GLB files exist", () => {
  const definition =
    moduleUnderTest.groundCoastalGrassRealGlbRendererPreviewTestDefinition;
  const existingPaths = [
    definition.glbReference.glbPath,
    definition.glbReference.manifestReference,
    definition.glbReference.metadataReference
  ];

  const result =
    moduleUnderTest.validateGroundCoastalGrassRealGlbRendererPreviewTest(
      {
        ...definition,
        renderState: {
          ...definition.renderState,
          realGeometryReady: true
        },
        verificationResult: {
          ...definition.verificationResult,
          glbExists: true
        }
      },
      {
        existsSync: createExistsSyncStub(existingPaths)
      }
    );

  assert.equal(result.ok, true);
  assert.equal(result.realGlbRendererPreview.compatibility.previewRendererInputConnected, true);
  assert.equal(result.realGlbRendererPreview.compatibility.realGeometryRenderable, true);
});

test("ground coastal grass real GLB renderer preview preserves fallback when GLB is unavailable", () => {
  const result =
    moduleUnderTest.validateGroundCoastalGrassRealGlbRendererPreviewTest(
      undefined,
      {
        existsSync: () => false,
        validateGroundCoastalGrassRealGlbAtlasPreviewReplacement() {
          return {
            ok: false,
            errorCode: "preview_asset_missing",
            message: "missing",
            realGlbAtlasPreviewReplacement: null
          };
        },
        validateGroundCoastalGrassGlbImportBridgeFoundation() {
          return {
            ok: false,
            errorCode: "glb_missing",
            message: "missing",
            glbImportBridge: null
          };
        }
      }
    );

  assert.equal(result.ok, true);
  assert.equal(result.realGlbRendererPreview.definition.renderState.fallbackEnabled, true);
  assert.equal(result.realGlbRendererPreview.compatibility.realGeometryRenderable, false);
});

test("ground coastal grass real GLB renderer preview rejects invalid lod selection safely", () => {
  const invalidDefinition = structuredClone(
    moduleUnderTest.groundCoastalGrassRealGlbRendererPreviewTestDefinition
  );
  invalidDefinition.lodSelection.currentLod = "LOD_UNKNOWN";

  const result =
    moduleUnderTest.validateGroundCoastalGrassRealGlbRendererPreviewTest(
      invalidDefinition,
      {
        existsSync: () => true
      }
    );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "invalid_lod_selection");
});
