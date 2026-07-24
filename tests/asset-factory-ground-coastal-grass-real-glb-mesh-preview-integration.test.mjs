import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "ground-coastal-grass-real-glb-mesh-preview-integration.mjs"
  )
);

function createExistsSyncStub(existingPaths) {
  const normalized = new Set(existingPaths);
  return (candidatePath) => normalized.has(candidatePath);
}

test("ground coastal grass real GLB mesh preview validates when gameplay GLB exists", () => {
  const definition =
    moduleUnderTest.groundCoastalGrassRealGlbMeshPreviewIntegrationDefinition;
  const existingPaths = [
    definition.glbReference.glbPath,
    definition.glbReference.manifestReference,
    definition.glbReference.metadataReference
  ];

  const result =
    moduleUnderTest.validateGroundCoastalGrassRealGlbMeshPreviewIntegration(
      {
        ...definition,
        loadState: {
          ...definition.loadState,
          currentState: "loaded"
        },
        validationResult: {
          ...definition.validationResult,
          glbAvailable: true,
          meshLoaded: true,
          materialsLoaded: true
        }
      },
      {
        existsSync: createExistsSyncStub(existingPaths),
        validateGroundCoastalGrassRealGlbRendererPreviewTest() {
          return {
            ok: true,
            realGlbRendererPreview: {
              definition: {
                assetId: "GROUND_COASTAL_GRASS_001",
                glbReference: {
                  glbPath:
                    "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_GAMEPLAY.glb"
                },
                lodSelection: {
                  availableLods: ["LOD_GAMEPLAY", "LOD_MAP"]
                }
              }
            }
          };
        },
        validateGroundCoastalGrassGlbImportBridgeFoundation() {
          return {
            ok: true,
            glbImportBridge: {
              foundation: {
                glbRegistration: {
                  assetId: "GROUND_COASTAL_GRASS_001",
                  lodReferences: {
                    LOD_GAMEPLAY:
                      "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_GAMEPLAY.glb"
                  }
                }
              }
            }
          };
        }
      }
    );

  assert.equal(result.ok, true);
  assert.equal(result.realGlbMeshPreview.compatibility.actualMeshGeometryReady, true);
});

test("ground coastal grass real GLB mesh preview preserves fallback when gameplay GLB is unavailable", () => {
  const result =
    moduleUnderTest.validateGroundCoastalGrassRealGlbMeshPreviewIntegration(
      undefined,
      {
        existsSync: () => false,
        validateGroundCoastalGrassRealGlbRendererPreviewTest() {
          return {
            ok: true,
            realGlbRendererPreview: {
              definition: {
                assetId: "GROUND_COASTAL_GRASS_001",
                glbReference: {
                  glbPath:
                    "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_GAMEPLAY.glb"
                },
                lodSelection: {
                  availableLods: ["LOD_GAMEPLAY", "LOD_MAP"]
                }
              }
            }
          };
        },
        validateGroundCoastalGrassGlbImportBridgeFoundation() {
          return {
            ok: true,
            glbImportBridge: {
              foundation: {
                glbRegistration: {
                  assetId: "GROUND_COASTAL_GRASS_001",
                  lodReferences: {
                    LOD_GAMEPLAY:
                      "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_GAMEPLAY.glb"
                  }
                }
              }
            }
          };
        }
      }
    );

  assert.equal(result.ok, true);
  assert.equal(result.realGlbMeshPreview.definition.loadState.fallbackEnabled, true);
  assert.equal(result.realGlbMeshPreview.compatibility.actualMeshGeometryReady, false);
});

test("ground coastal grass real GLB mesh preview rejects invalid mesh data safely", () => {
  const invalidDefinition = structuredClone(
    moduleUnderTest.groundCoastalGrassRealGlbMeshPreviewIntegrationDefinition
  );
  invalidDefinition.meshData.projectedVertices = [];

  const result =
    moduleUnderTest.validateGroundCoastalGrassRealGlbMeshPreviewIntegration(
      invalidDefinition,
      {
        existsSync: () => true
      }
    );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "invalid_mesh_data");
});
