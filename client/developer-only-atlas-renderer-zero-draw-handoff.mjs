import { getApprovedDeveloperOnlyAtlasIdentityRegistry } from "./developer-only-atlas-browser-contract.mjs";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested);
    }
  }

  return Object.freeze(value);
}

const HANDOFF_SCHEMA_ID = "ATLAS_RENDERER_HANDOFF_READINESS_001";
const EXPECTED_RENDERER_SCHEMA_ID = "GROWGO_CUSTOM_25D_RENDERER_CONSUMER_DESCRIPTOR_001";
const READY_STATUS = "ready_for_future_renderer_attachment";
const IDENTITY_REGISTRY_SOURCE =
  "developer-only-atlas-browser-contract.approvedDeveloperOnlyIdentityRegistry";

export function createDiscoveredGrowGoCustom25DRendererConsumerDescriptor() {
  return deepFreeze({
    schemaId: EXPECTED_RENDERER_SCHEMA_ID,
    rendererId: "GROWGO_CUSTOM_25D_MAP_EXPERIMENT",
    rendererProfile: "canvas-2d-custom-25d-map",
    rendererOwnerFile: "script.js",
    rendererOwnerFunction: "initCustom25DMapExperiment",
    rendererConsumerRetention: "custom25DMapLayer",
    drawEntryPoint: "drawCustom25DMapCanvas",
    canvasOwnerPath: "custom25DMapLayer.canvas",
    webglContextUsed: false,
    lifecycleOwner: "script.js",
    lifecycleMethods: ["initCustom25DMapExperiment", "drawCustom25DMapCanvas"],
    initializationGate: "ENABLE_CUSTOM_25D_MAP",
    startupDefaultAllowed: false,
    passiveHandoffOnly: true
  });
}

function extractResolvedPackage(diagnostic) {
  return diagnostic?.resolvedPackage ?? diagnostic?.atlasDiagnostic?.resolvedPackage ?? null;
}

function extractResolvedRecipe(diagnostic) {
  return diagnostic?.resolvedRecipe ?? diagnostic?.atlasDiagnostic?.resolvedRecipe ?? null;
}

function extractResolvedRegion(diagnostic) {
  return diagnostic?.resolvedRegion ?? diagnostic?.atlasDiagnostic?.resolvedRegion ?? null;
}

function extractApprovedScope(diagnostic) {
  return diagnostic?.approvedScope ?? diagnostic?.atlasDiagnostic?.approvedScope ?? null;
}

function extractSelectorSeed(diagnostic) {
  return diagnostic?.selectorSeed ?? diagnostic?.atlasDiagnostic?.selectorSeed ?? null;
}

function extractCoordinate(diagnostic) {
  return diagnostic?.coordinate ?? diagnostic?.atlasDiagnostic?.coordinate ?? null;
}

function extractSafetyFlags(diagnostic) {
  return diagnostic?.safetyFlags ?? diagnostic?.atlasDiagnostic?.safetyFlags ?? null;
}

function buildBlockedResult({
  reasonCode,
  diagnostic = null,
  rendererConsumerDescriptor = null,
  missingField = null,
  matchedIdentitySource = null,
  identityRegistrySource = IDENTITY_REGISTRY_SOURCE,
  identityMatchResult = null
}) {
  const approvedScope = extractApprovedScope(diagnostic);
  const coordinate = extractCoordinate(diagnostic);
  const safetyFlagSnapshot = extractSafetyFlags(diagnostic);

  return deepFreeze({
    schemaId: HANDOFF_SCHEMA_ID,
    handoffStatus: "blocked",
    reasonCode,
    missingField,
    regionId: extractResolvedRegion(diagnostic)?.regionId ?? null,
    packageId: extractResolvedPackage(diagnostic)?.packageId ?? null,
    packageVersion: extractResolvedPackage(diagnostic)?.packageVersion ?? null,
    packageFingerprint: extractResolvedPackage(diagnostic)?.packageFingerprint ?? null,
    recipeId: extractResolvedRecipe(diagnostic)?.recipeId ?? null,
    recipeVersion: extractResolvedRecipe(diagnostic)?.selectedVersion ?? null,
    environmentProfile: extractResolvedRegion(diagnostic)?.environmentProfile ?? null,
    selectorSeed: extractSelectorSeed(diagnostic),
    matchedIdentitySource,
    identityRegistrySource,
    identityMatchResult:
      identityMatchResult && typeof identityMatchResult === "object"
        ? deepFreeze({ ...identityMatchResult })
        : null,
    coordinate,
    rendererConsumerAvailable: !!rendererConsumerDescriptor,
    rendererIdentityValidated: false,
    rendererInitializationRequested: false,
    rendererAttached: false,
    drawRequested: false,
    canvasCreated: false,
    webglContextCreated: false,
    overlayCreated: false,
    networkRequested: false,
    assetDownloadRequested: false,
    approvedDeveloperOnlyScope: approvedScope,
    safetyFlagSnapshot
  });
}

function validateSafetyFlags(safetyFlags) {
  return (
    safetyFlags &&
    safetyFlags.runtimeExecutionEnabled === false &&
    safetyFlags.mapAttachmentAllowed === false &&
    safetyFlags.automaticRendererExecutionAllowed === false &&
    safetyFlags.lifecycleExecutionEnabled === false
  );
}

function validateRendererIdentity(rendererConsumerDescriptor) {
  if (!rendererConsumerDescriptor) {
    return {
      ok: false,
      reasonCode: "RENDERER_CONSUMER_UNAVAILABLE"
    };
  }

  if (rendererConsumerDescriptor.schemaId !== EXPECTED_RENDERER_SCHEMA_ID) {
    return {
      ok: false,
      reasonCode: "RENDERER_IDENTITY_MISMATCH"
    };
  }

  if (
    rendererConsumerDescriptor.rendererId !== "GROWGO_CUSTOM_25D_MAP_EXPERIMENT" ||
    rendererConsumerDescriptor.rendererOwnerFunction !== "initCustom25DMapExperiment" ||
    rendererConsumerDescriptor.drawEntryPoint !== "drawCustom25DMapCanvas"
  ) {
    return {
      ok: false,
      reasonCode: "RENDERER_IDENTITY_MISMATCH"
    };
  }

  return {
    ok: true,
    reasonCode: null
  };
}

function buildReadyResult({
  diagnostic,
  rendererConsumerDescriptor,
  matchedIdentitySource,
  identityRegistrySource = IDENTITY_REGISTRY_SOURCE,
  identityMatchResult = null
}) {
  const resolvedRegion = extractResolvedRegion(diagnostic);
  const resolvedPackage = extractResolvedPackage(diagnostic);
  const resolvedRecipe = extractResolvedRecipe(diagnostic);
  const approvedScope = extractApprovedScope(diagnostic);
  const coordinate = extractCoordinate(diagnostic);
  const safetyFlagSnapshot = extractSafetyFlags(diagnostic);

  return deepFreeze({
    schemaId: HANDOFF_SCHEMA_ID,
    handoffStatus: READY_STATUS,
    reasonCode: "HANDOFF_READY",
    regionId: resolvedRegion.regionId,
    packageId: resolvedPackage.packageId,
    packageVersion: resolvedPackage.packageVersion,
    packageFingerprint: resolvedPackage.packageFingerprint,
    recipeId: resolvedRecipe.recipeId,
    recipeVersion: resolvedRecipe.selectedVersion,
    environmentProfile: resolvedRegion.environmentProfile,
    selectorSeed: extractSelectorSeed(diagnostic),
    matchedIdentitySource,
    identityRegistrySource,
    identityMatchResult:
      identityMatchResult && typeof identityMatchResult === "object"
        ? deepFreeze({ ...identityMatchResult })
        : null,
    coordinate,
    rendererConsumerAvailable: true,
    rendererIdentityValidated: true,
    rendererInitializationRequested: false,
    rendererAttached: false,
    drawRequested: false,
    canvasCreated: false,
    webglContextCreated: false,
    overlayCreated: false,
    networkRequested: false,
    assetDownloadRequested: false,
    approvedDeveloperOnlyScope: approvedScope,
    safetyFlagSnapshot,
    rendererConsumerDescriptor
  });
}

function normalizeExpectedIdentities(expectedScope) {
  if (Array.isArray(expectedScope)) {
    return expectedScope.filter(Boolean);
  }

  if (expectedScope && typeof expectedScope === "object") {
    return [expectedScope];
  }

  return getApprovedDeveloperOnlyAtlasIdentityRegistry();
}

function findMatchingApprovedIdentity({
  expectedIdentities,
  resolvedRegion,
  resolvedPackage,
  resolvedRecipe,
  selectorSeed
}) {
  return (
    expectedIdentities.find(
      (candidate) =>
        candidate?.regionId === resolvedRegion.regionId &&
        candidate?.packageId === resolvedPackage.packageId &&
        candidate?.packageVersion === resolvedPackage.packageVersion &&
        candidate?.packageFingerprint === resolvedPackage.packageFingerprint &&
        candidate?.recipeId === resolvedRecipe.recipeId &&
        candidate?.selectorSeed === selectorSeed
    ) ?? null
  );
}

export function validateAtlasRendererZeroDrawHandoff({
  atlasDiagnostic,
  rendererConsumerDescriptor,
  expectedScope = null
}) {
  if (!atlasDiagnostic || typeof atlasDiagnostic !== "object") {
    return buildBlockedResult({
      reasonCode: "INVALID_DIAGNOSTIC",
      missingField: "atlasDiagnostic"
    });
  }

  if (atlasDiagnostic.diagnosticStatus === "blocked") {
    return buildBlockedResult({
      reasonCode: atlasDiagnostic.reasonCode ?? "INVALID_DIAGNOSTIC",
      diagnostic: atlasDiagnostic,
      rendererConsumerDescriptor
    });
  }

  if (atlasDiagnostic.diagnosticStatus !== "resolved") {
    return buildBlockedResult({
      reasonCode: "INVALID_DIAGNOSTIC",
      diagnostic: atlasDiagnostic,
      rendererConsumerDescriptor,
      missingField: "diagnosticStatus"
    });
  }

  const resolvedRegion = extractResolvedRegion(atlasDiagnostic);
  const resolvedPackage = extractResolvedPackage(atlasDiagnostic);
  const resolvedRecipe = extractResolvedRecipe(atlasDiagnostic);
  const coordinate = extractCoordinate(atlasDiagnostic);
  const safetyFlagSnapshot = extractSafetyFlags(atlasDiagnostic);
  const selectorSeed = extractSelectorSeed(atlasDiagnostic);
  const expectedIdentities = normalizeExpectedIdentities(expectedScope);

  if (!resolvedRegion?.regionId) {
    return buildBlockedResult({
      reasonCode: "INVALID_DIAGNOSTIC",
      diagnostic: atlasDiagnostic,
      rendererConsumerDescriptor,
      missingField: "resolvedRegion.regionId"
    });
  }

  if (!resolvedPackage?.packageId || !resolvedPackage?.packageVersion || !resolvedPackage?.packageFingerprint) {
    return buildBlockedResult({
      reasonCode: "INVALID_DIAGNOSTIC",
      diagnostic: atlasDiagnostic,
      rendererConsumerDescriptor,
      missingField: "resolvedPackage"
    });
  }

  if (!resolvedRecipe?.recipeId || !resolvedRecipe?.selectedVersion) {
    return buildBlockedResult({
      reasonCode: "INVALID_DIAGNOSTIC",
      diagnostic: atlasDiagnostic,
      rendererConsumerDescriptor,
      missingField: "resolvedRecipe"
    });
  }

  if (!resolvedRegion?.environmentProfile) {
    return buildBlockedResult({
      reasonCode: "INVALID_DIAGNOSTIC",
      diagnostic: atlasDiagnostic,
      rendererConsumerDescriptor,
      missingField: "resolvedRegion.environmentProfile"
    });
  }

  if (!selectorSeed || !coordinate) {
    return buildBlockedResult({
      reasonCode: "INVALID_DIAGNOSTIC",
      diagnostic: atlasDiagnostic,
      rendererConsumerDescriptor,
      missingField: !selectorSeed ? "selectorSeed" : "coordinate"
    });
  }

  if (!validateSafetyFlags(safetyFlagSnapshot)) {
    return buildBlockedResult({
      reasonCode: "SAFETY_FLAGS_NOT_BLOCKED",
      diagnostic: atlasDiagnostic,
      rendererConsumerDescriptor
    });
  }

  const matchedApprovedIdentity = findMatchingApprovedIdentity({
    expectedIdentities,
    resolvedRegion,
    resolvedPackage,
    resolvedRecipe,
    selectorSeed
  });
  const identityMatchBase = {
    matched: matchedApprovedIdentity != null,
    regionId: resolvedRegion.regionId,
    packageId: resolvedPackage.packageId,
    packageVersion: resolvedPackage.packageVersion,
    packageFingerprint: resolvedPackage.packageFingerprint,
    recipeId: resolvedRecipe.recipeId,
    selectorSeed,
    matchedIdentitySource: matchedApprovedIdentity?.identitySourceId ?? null
  };

  if (!matchedApprovedIdentity) {
    const regionKnown = expectedIdentities.some(
      (candidate) => candidate?.regionId === resolvedRegion.regionId
    );
    const packageKnown = expectedIdentities.some(
      (candidate) => candidate?.packageId === resolvedPackage.packageId
    );
    const recipeKnown = expectedIdentities.some(
      (candidate) => candidate?.recipeId === resolvedRecipe.recipeId
    );
    const selectorKnown = expectedIdentities.some(
      (candidate) => candidate?.selectorSeed === selectorSeed
    );

    if (!regionKnown) {
      return buildBlockedResult({
        reasonCode: "REGION_IDENTITY_MISMATCH",
        diagnostic: atlasDiagnostic,
        rendererConsumerDescriptor,
        identityMatchResult: {
          ...identityMatchBase,
          mismatchField: "regionId"
        }
      });
    }

    if (!packageKnown) {
      return buildBlockedResult({
        reasonCode: "PACKAGE_IDENTITY_MISMATCH",
        diagnostic: atlasDiagnostic,
        rendererConsumerDescriptor,
        identityMatchResult: {
          ...identityMatchBase,
          mismatchField: "packageId"
        }
      });
    }

    const packageVersionKnown = expectedIdentities.some(
      (candidate) => candidate?.packageVersion === resolvedPackage.packageVersion
    );
    if (!packageVersionKnown) {
      return buildBlockedResult({
        reasonCode: "PACKAGE_IDENTITY_MISMATCH",
        diagnostic: atlasDiagnostic,
        rendererConsumerDescriptor,
        identityMatchResult: {
          ...identityMatchBase,
          mismatchField: "packageVersion"
        }
      });
    }

    const packageFingerprintKnown = expectedIdentities.some(
      (candidate) => candidate?.packageFingerprint === resolvedPackage.packageFingerprint
    );
    if (!packageFingerprintKnown) {
      return buildBlockedResult({
        reasonCode: "PACKAGE_IDENTITY_MISMATCH",
        diagnostic: atlasDiagnostic,
        rendererConsumerDescriptor,
        identityMatchResult: {
          ...identityMatchBase,
          mismatchField: "packageFingerprint"
        }
      });
    }

    if (!recipeKnown) {
      return buildBlockedResult({
        reasonCode: "RECIPE_IDENTITY_MISMATCH",
        diagnostic: atlasDiagnostic,
        rendererConsumerDescriptor,
        identityMatchResult: {
          ...identityMatchBase,
          mismatchField: "recipeId"
        }
      });
    }

    if (!selectorKnown) {
      return buildBlockedResult({
        reasonCode: "SELECTOR_SEED_MISMATCH",
        diagnostic: atlasDiagnostic,
        rendererConsumerDescriptor,
        identityMatchResult: {
          ...identityMatchBase,
          mismatchField: "selectorSeed"
        }
      });
    }

    return buildBlockedResult({
      reasonCode: "PACKAGE_IDENTITY_MISMATCH",
      diagnostic: atlasDiagnostic,
      rendererConsumerDescriptor,
      identityMatchResult: {
        ...identityMatchBase,
        mismatchField: "identityRegistryEntry"
      }
    });
  }

  const rendererIdentity = validateRendererIdentity(rendererConsumerDescriptor);
  if (!rendererIdentity.ok) {
    return buildBlockedResult({
      reasonCode: rendererIdentity.reasonCode,
      diagnostic: atlasDiagnostic,
      rendererConsumerDescriptor
    });
  }

  return buildReadyResult({
    diagnostic: atlasDiagnostic,
    rendererConsumerDescriptor,
    matchedIdentitySource: matchedApprovedIdentity.identitySourceId ?? null,
    identityMatchResult: {
      ...identityMatchBase,
      mismatchField: null
    }
  });
}

export function createDeveloperOnlyAtlasRendererZeroDrawHandoff(options = {}) {
  const getAtlasDiagnostic =
    options.getAtlasDiagnostic ?? options.getAtlasDiagnosticForCurrentMapCentre ?? (() => null);
  const getRendererConsumerDescriptor =
    options.getRendererConsumerDescriptor ?? (() => null);
  const expectedScope = options.expectedScope ?? null;

  function getAtlasRendererHandoffReadiness() {
    return validateAtlasRendererZeroDrawHandoff({
      atlasDiagnostic: getAtlasDiagnostic(),
      rendererConsumerDescriptor: getRendererConsumerDescriptor(),
      expectedScope
    });
  }

  return deepFreeze({
    getAtlasRendererHandoffReadiness
  });
}

export function installDeveloperOnlyAtlasRendererZeroDrawHandoff(options = {}) {
  const globalObject = options.globalObject ?? globalThis;
  const namespaceKey = options.namespaceKey ?? "GrowGoDeveloperDiagnostics";
  const handoff = options.handoff;

  if (!globalObject || !handoff || typeof handoff.getAtlasRendererHandoffReadiness !== "function") {
    return null;
  }

  const namespace =
    globalObject[namespaceKey] && typeof globalObject[namespaceKey] === "object"
      ? globalObject[namespaceKey]
      : null;

  if (!namespace) {
    return null;
  }

  namespace.getAtlasRendererHandoffReadiness = handoff.getAtlasRendererHandoffReadiness;
  return namespace;
}
