import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const moduleUnderTest = await import(
  path.join(repoRoot, "client", "developer-only-atlas-renderer-zero-draw-handoff.mjs")
);
const source = fs.readFileSync(
  path.join(repoRoot, "client", "developer-only-atlas-renderer-zero-draw-handoff.mjs"),
  "utf8"
);
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);

function createApprovedDiagnostic() {
  return Object.freeze({
    schemaId: "ATLAS_LIVE_MAP_CENTRE_DIAGNOSTIC_RESULT_001",
    diagnosticStatus: "resolved",
    reasonCode: "RESOLVED",
    coordinate: Object.freeze({
      latitude: -38.12436167080344,
      longitude: 144.609432220459,
      latBucket: -38.12,
      lngBucket: 144.61
    }),
    approvedScope: Object.freeze({
      regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
      packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
      recipeId: "COASTAL_LOCATION_RECIPE_001",
      internalDeveloperOnly: true
    }),
    resolvedRegion: Object.freeze({
      regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
      environmentProfile: "COASTAL_EXPLORATION"
    }),
    resolvedPackage: Object.freeze({
      packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
      packageVersion: "v001",
      packageFingerprint: "94c447ae7b3c888b3df618ad2f1f45cf3ea9e7d0282cd49c2d56ed94fff06aed"
    }),
    resolvedRecipe: Object.freeze({
      recipeId: "COASTAL_LOCATION_RECIPE_001",
      selectedVersion: "v001",
      confidenceScore: 100,
      fallbackApplied: false
    }),
    selectorSeed: "baf38e127eee1e320570e2f02fc889cd1aaec4b9dfd7bee85bba4f10f30b6da0",
    safetyFlags: Object.freeze({
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      lifecycleExecutionEnabled: false
    })
  });
}

function createPopulatedApprovedDiagnostic() {
  return Object.freeze({
    schemaId: "ATLAS_LIVE_MAP_CENTRE_DIAGNOSTIC_RESULT_001",
    diagnosticStatus: "resolved",
    reasonCode: "RESOLVED",
    coordinate: Object.freeze({
      latitude: -38.13565,
      longitude: 144.34905,
      latBucket: -38.14,
      lngBucket: 144.35
    }),
    approvedScope: Object.freeze({
      scopeId: "DEVELOPER_SCOPE_BELLARINE_POPULATED_TEST_AREA",
      regionId: "REGION_BELLARINE_POPULATED_TEST_NEG_38_14_144_35_COASTAL_EXPLORATION",
      packageId: "ATLAS_REGION_PACKAGE_BELLARINE_POPULATED_TEST_NEG_38_14_144_35_v001",
      recipeId: "COASTAL_LOCATION_RECIPE_001",
      internalDeveloperOnly: true
    }),
    resolvedRegion: Object.freeze({
      regionId: "REGION_BELLARINE_POPULATED_TEST_NEG_38_14_144_35_COASTAL_EXPLORATION",
      environmentProfile: "COASTAL_EXPLORATION"
    }),
    resolvedPackage: Object.freeze({
      packageId: "ATLAS_REGION_PACKAGE_BELLARINE_POPULATED_TEST_NEG_38_14_144_35_v001",
      packageVersion: "v001",
      packageFingerprint: "3de8cbf25b1f9f633c062e0c6511d161b3dbe6f3c30140da8a744d66bf127834"
    }),
    resolvedRecipe: Object.freeze({
      recipeId: "COASTAL_LOCATION_RECIPE_001",
      selectedVersion: "v001",
      confidenceScore: 100,
      fallbackApplied: false
    }),
    selectorSeed: "6c07ce2b7f1cf4f5dc973e1b4fc3854e7df97341f0969c1c9d4bf66e7ec5b8cf",
    safetyFlags: Object.freeze({
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      lifecycleExecutionEnabled: false
    })
  });
}

function createBlockedOutOfScopeDiagnostic() {
  return Object.freeze({
    schemaId: "ATLAS_LIVE_MAP_CENTRE_DIAGNOSTIC_RESULT_001",
    diagnosticStatus: "blocked",
    reasonCode: "REGION_OUT_OF_SCOPE",
    coordinate: Object.freeze({
      latitude: -38.9,
      longitude: 145.5,
      latBucket: -38.9,
      lngBucket: 145.5
    }),
    approvedScope: Object.freeze({
      regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
      packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
      recipeId: "COASTAL_LOCATION_RECIPE_001",
      internalDeveloperOnly: true
    }),
    resolvedRegion: null,
    resolvedPackage: null,
    resolvedRecipe: null,
    safetyFlags: Object.freeze({
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      lifecycleExecutionEnabled: false
    })
  });
}

function createRendererConsumerDescriptor(overrides = {}) {
  return Object.freeze({
    ...moduleUnderTest.createDiscoveredGrowGoCustom25DRendererConsumerDescriptor(),
    ...overrides
  });
}

test("approved resolved diagnostic creates one valid immutable zero-draw handoff descriptor", () => {
  const result = moduleUnderTest.validateAtlasRendererZeroDrawHandoff({
    atlasDiagnostic: createApprovedDiagnostic(),
    rendererConsumerDescriptor: createRendererConsumerDescriptor()
  });

  assert.equal(result.schemaId, "ATLAS_RENDERER_HANDOFF_READINESS_001");
  assert.equal(result.handoffStatus, "ready_for_future_renderer_attachment");
  assert.equal(result.reasonCode, "HANDOFF_READY");
  assert.equal(result.regionId, "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION");
  assert.equal(result.packageId, "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001");
  assert.equal(result.packageVersion, "v001");
  assert.equal(
    result.packageFingerprint,
    "94c447ae7b3c888b3df618ad2f1f45cf3ea9e7d0282cd49c2d56ed94fff06aed"
  );
  assert.equal(result.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(result.recipeVersion, "v001");
  assert.equal(result.environmentProfile, "COASTAL_EXPLORATION");
  assert.equal(
    result.selectorSeed,
    "baf38e127eee1e320570e2f02fc889cd1aaec4b9dfd7bee85bba4f10f30b6da0"
  );
  assert.equal(result.rendererConsumerAvailable, true);
  assert.equal(result.rendererIdentityValidated, true);
  assert.equal(result.rendererInitializationRequested, false);
  assert.equal(result.rendererAttached, false);
  assert.equal(result.drawRequested, false);
  assert.equal(result.canvasCreated, false);
  assert.equal(result.webglContextCreated, false);
  assert.equal(result.overlayCreated, false);
  assert.equal(result.networkRequested, false);
  assert.equal(result.assetDownloadRequested, false);
  assert.equal(
    result.matchedIdentitySource,
    "DEVELOPER_SCOPE_BELLARINE_COASTAL_EXPLORATION"
  );
  assert.equal(
    result.identityRegistrySource,
    "developer-only-atlas-browser-contract.approvedDeveloperOnlyIdentityRegistry"
  );
  assert.equal(result.identityMatchResult?.matched, true);
  assert.equal(result.identityMatchResult?.mismatchField, null);
  assert.equal(result.safetyFlagSnapshot.runtimeExecutionEnabled, false);
  assert.equal(result.safetyFlagSnapshot.mapAttachmentAllowed, false);
  assert.equal(result.safetyFlagSnapshot.automaticRendererExecutionAllowed, false);
  assert.equal(result.safetyFlagSnapshot.lifecycleExecutionEnabled, false);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.rendererConsumerDescriptor), true);
});

test("populated developer-only scope resolves as a valid renderer handoff identity", () => {
  const result = moduleUnderTest.validateAtlasRendererZeroDrawHandoff({
    atlasDiagnostic: createPopulatedApprovedDiagnostic(),
    rendererConsumerDescriptor: createRendererConsumerDescriptor()
  });

  assert.equal(result.handoffStatus, "ready_for_future_renderer_attachment");
  assert.equal(result.reasonCode, "HANDOFF_READY");
  assert.equal(
    result.regionId,
    "REGION_BELLARINE_POPULATED_TEST_NEG_38_14_144_35_COASTAL_EXPLORATION"
  );
  assert.equal(
    result.packageId,
    "ATLAS_REGION_PACKAGE_BELLARINE_POPULATED_TEST_NEG_38_14_144_35_v001"
  );
  assert.equal(result.packageVersion, "v001");
  assert.equal(
    result.packageFingerprint,
    "3de8cbf25b1f9f633c062e0c6511d161b3dbe6f3c30140da8a744d66bf127834"
  );
  assert.equal(result.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(
    result.selectorSeed,
    "6c07ce2b7f1cf4f5dc973e1b4fc3854e7df97341f0969c1c9d4bf66e7ec5b8cf"
  );
  assert.equal(
    result.matchedIdentitySource,
    "DEVELOPER_SCOPE_BELLARINE_POPULATED_TEST_AREA"
  );
  assert.equal(result.identityMatchResult?.matched, true);
  assert.equal(result.identityMatchResult?.mismatchField, null);
});

test("out-of-scope diagnostic remains blocked and creates no renderer handoff", () => {
  const result = moduleUnderTest.validateAtlasRendererZeroDrawHandoff({
    atlasDiagnostic: createBlockedOutOfScopeDiagnostic(),
    rendererConsumerDescriptor: createRendererConsumerDescriptor()
  });

  assert.equal(result.handoffStatus, "blocked");
  assert.equal(result.reasonCode, "REGION_OUT_OF_SCOPE");
  assert.equal(result.rendererIdentityValidated, false);
  assert.equal(result.rendererInitializationRequested, false);
  assert.equal(result.drawRequested, false);
  assert.equal(
    result.identityRegistrySource,
    "developer-only-atlas-browser-contract.approvedDeveloperOnlyIdentityRegistry"
  );
});

test("incomplete diagnostic fails closed with exact missing field", () => {
  const diagnostic = createApprovedDiagnostic();
  const result = moduleUnderTest.validateAtlasRendererZeroDrawHandoff({
    atlasDiagnostic: {
      ...diagnostic,
      resolvedPackage: {
        packageId: diagnostic.resolvedPackage.packageId
      }
    },
    rendererConsumerDescriptor: createRendererConsumerDescriptor()
  });

  assert.equal(result.handoffStatus, "blocked");
  assert.equal(result.reasonCode, "INVALID_DIAGNOSTIC");
  assert.equal(result.missingField, "resolvedPackage");
});

test("package recipe and renderer identity mismatches all fail closed precisely", () => {
  const diagnostic = createApprovedDiagnostic();

  const packageMismatch = moduleUnderTest.validateAtlasRendererZeroDrawHandoff({
    atlasDiagnostic: {
      ...diagnostic,
      resolvedPackage: {
        ...diagnostic.resolvedPackage,
        packageId: "ATLAS_REGION_PACKAGE_OTHER_001"
      }
    },
    rendererConsumerDescriptor: createRendererConsumerDescriptor()
  });
  const recipeMismatch = moduleUnderTest.validateAtlasRendererZeroDrawHandoff({
    atlasDiagnostic: {
      ...diagnostic,
      resolvedRecipe: {
        ...diagnostic.resolvedRecipe,
        recipeId: "FOREST_LOCATION_RECIPE_001"
      }
    },
    rendererConsumerDescriptor: createRendererConsumerDescriptor()
  });
  const regionMismatch = moduleUnderTest.validateAtlasRendererZeroDrawHandoff({
    atlasDiagnostic: {
      ...createPopulatedApprovedDiagnostic(),
      resolvedRegion: {
        regionId: "REGION_UNKNOWN_001",
        environmentProfile: "COASTAL_EXPLORATION"
      }
    },
    rendererConsumerDescriptor: createRendererConsumerDescriptor()
  });
  const selectorMismatch = moduleUnderTest.validateAtlasRendererZeroDrawHandoff({
    atlasDiagnostic: {
      ...createPopulatedApprovedDiagnostic(),
      selectorSeed: "SELECTOR_SEED_MISMATCH"
    },
    rendererConsumerDescriptor: createRendererConsumerDescriptor()
  });
  const rendererMismatch = moduleUnderTest.validateAtlasRendererZeroDrawHandoff({
    atlasDiagnostic: diagnostic,
    rendererConsumerDescriptor: createRendererConsumerDescriptor({
      drawEntryPoint: "drawSomethingElse"
    })
  });

  assert.equal(regionMismatch.reasonCode, "REGION_IDENTITY_MISMATCH");
  assert.equal(regionMismatch.identityMatchResult?.mismatchField, "regionId");
  assert.equal(packageMismatch.reasonCode, "PACKAGE_IDENTITY_MISMATCH");
  assert.equal(packageMismatch.identityMatchResult?.mismatchField, "packageId");
  assert.equal(recipeMismatch.reasonCode, "RECIPE_IDENTITY_MISMATCH");
  assert.equal(recipeMismatch.identityMatchResult?.mismatchField, "recipeId");
  assert.equal(selectorMismatch.reasonCode, "SELECTOR_SEED_MISMATCH");
  assert.equal(selectorMismatch.identityMatchResult?.mismatchField, "selectorSeed");
  assert.equal(rendererMismatch.reasonCode, "RENDERER_IDENTITY_MISMATCH");
});

test("fingerprint mismatch fails closed with exact mismatch field", () => {
  const result = moduleUnderTest.validateAtlasRendererZeroDrawHandoff({
    atlasDiagnostic: {
      ...createPopulatedApprovedDiagnostic(),
      resolvedPackage: {
        ...createPopulatedApprovedDiagnostic().resolvedPackage,
        packageFingerprint: "PACKAGE_FINGERPRINT_MISMATCH"
      }
    },
    rendererConsumerDescriptor: createRendererConsumerDescriptor()
  });

  assert.equal(result.handoffStatus, "blocked");
  assert.equal(result.reasonCode, "PACKAGE_IDENTITY_MISMATCH");
  assert.equal(result.identityMatchResult?.mismatchField, "packageFingerprint");
});

test("missing renderer consumer fails closed", () => {
  const result = moduleUnderTest.validateAtlasRendererZeroDrawHandoff({
    atlasDiagnostic: createApprovedDiagnostic(),
    rendererConsumerDescriptor: null
  });

  assert.equal(result.handoffStatus, "blocked");
  assert.equal(result.reasonCode, "RENDERER_CONSUMER_UNAVAILABLE");
});

test("zero-draw handoff performs no startup invocation listener timer network draw or asset side effect", () => {
  const sideEffects = {
    rendererInitialized: 0,
    drawCalled: 0,
    canvasCreated: 0,
    webglCreated: 0,
    overlayCreated: 0,
    networkRequested: 0,
    assetDownloaded: 0,
    listenersAdded: 0,
    timersStarted: 0
  };
  let diagnosticCalls = 0;
  let rendererDescriptorCalls = 0;

  const handoff = moduleUnderTest.createDeveloperOnlyAtlasRendererZeroDrawHandoff({
    getAtlasDiagnostic() {
      diagnosticCalls += 1;
      return createApprovedDiagnostic();
    },
    getRendererConsumerDescriptor() {
      rendererDescriptorCalls += 1;
      return createRendererConsumerDescriptor({
        initialize() {
          sideEffects.rendererInitialized += 1;
        },
        drawFrame() {
          sideEffects.drawCalled += 1;
        },
        createCanvas() {
          sideEffects.canvasCreated += 1;
        },
        createWebGLContext() {
          sideEffects.webglCreated += 1;
        },
        createOverlay() {
          sideEffects.overlayCreated += 1;
        },
        requestNetwork() {
          sideEffects.networkRequested += 1;
        },
        downloadAssets() {
          sideEffects.assetDownloaded += 1;
        },
        addMapListener() {
          sideEffects.listenersAdded += 1;
        },
        startTimer() {
          sideEffects.timersStarted += 1;
        }
      });
    }
  });

  assert.equal(diagnosticCalls, 0);
  assert.equal(rendererDescriptorCalls, 0);

  const result = handoff.getAtlasRendererHandoffReadiness();

  assert.equal(diagnosticCalls, 1);
  assert.equal(rendererDescriptorCalls, 1);
  assert.equal(result.handoffStatus, "ready_for_future_renderer_attachment");
  assert.deepEqual(sideEffects, {
    rendererInitialized: 0,
    drawCalled: 0,
    canvasCreated: 0,
    webglCreated: 0,
    overlayCreated: 0,
    networkRequested: 0,
    assetDownloaded: 0,
    listenersAdded: 0,
    timersStarted: 0
  });
});

test("installation is optional and no automatic startup exposure is wired into development alpha app", () => {
  const namespace = {};
  const installed = moduleUnderTest.installDeveloperOnlyAtlasRendererZeroDrawHandoff({
    globalObject: {
      GrowGoDeveloperDiagnostics: namespace
    },
    handoff: moduleUnderTest.createDeveloperOnlyAtlasRendererZeroDrawHandoff({
      getAtlasDiagnostic: createApprovedDiagnostic,
      getRendererConsumerDescriptor: createRendererConsumerDescriptor
    })
  });

  assert.equal(typeof installed.getAtlasRendererHandoffReadiness, "function");
  assert.doesNotMatch(source, /fetch\(/);
  assert.doesNotMatch(source, /XMLHttpRequest/);
  assert.doesNotMatch(source, /setInterval\(/);
  assert.doesNotMatch(source, /setTimeout\(/);
  assert.doesNotMatch(source, /createElement/);
  assert.doesNotMatch(source, /appendChild/);
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /window\.GrowGoDeveloperDiagnostics\.getAtlasRendererHandoffReadiness\(\)/
  );
});
