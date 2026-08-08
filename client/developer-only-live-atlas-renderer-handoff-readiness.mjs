import {
  createDiscoveredGrowGoCustom25DRendererConsumerDescriptor,
  validateAtlasRendererZeroDrawHandoff
} from "./developer-only-atlas-renderer-zero-draw-handoff.mjs?v=atlas21213k";

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

function buildCombinedReadinessResult({
  atlasDiagnostic,
  handoffResult
}) {
  const coordinate = atlasDiagnostic?.coordinate ?? null;
  const approvedDeveloperOnlyScope =
    atlasDiagnostic?.approvedScope ?? handoffResult?.approvedDeveloperOnlyScope ?? null;
  const safetyFlagSnapshot =
    handoffResult?.safetyFlagSnapshot ?? atlasDiagnostic?.safetyFlags ?? null;

  return deepFreeze({
    schemaId: "ATLAS_RENDERER_HANDOFF_READINESS_DIAGNOSTIC_RESULT_001",
    diagnosticStatus: atlasDiagnostic?.diagnosticStatus ?? "blocked",
    reasonCode: atlasDiagnostic?.reasonCode ?? handoffResult?.reasonCode ?? "INVALID_DIAGNOSTIC",
    coordinate,
    approvedDeveloperOnlyScope,
    activeDeveloperScopeId: atlasDiagnostic?.activeDeveloperScopeId ?? null,
    matchedScopeReason: atlasDiagnostic?.matchedScopeReason ?? null,
    approvedScopeList: atlasDiagnostic?.approvedScopeList ?? deepFreeze([]),
    coordinateMatchResult: atlasDiagnostic?.coordinateMatchResult ?? null,
    matchedIdentitySource: handoffResult?.matchedIdentitySource ?? null,
    identityRegistrySource: handoffResult?.identityRegistrySource ?? null,
    identityMatchResult: handoffResult?.identityMatchResult ?? null,
    resolvedRegion: atlasDiagnostic?.resolvedRegion ?? null,
    resolvedPackage: atlasDiagnostic?.resolvedPackage ?? null,
    resolvedRecipe: atlasDiagnostic?.resolvedRecipe ?? null,
    selectorSeed: atlasDiagnostic?.selectorSeed ?? null,
    rendererHandoffStatus: handoffResult?.handoffStatus ?? "blocked",
    rendererConsumerAvailable: handoffResult?.rendererConsumerAvailable ?? false,
    rendererIdentityValidated: handoffResult?.rendererIdentityValidated ?? false,
    rendererInitializationRequested:
      handoffResult?.rendererInitializationRequested ?? false,
    rendererAttached: handoffResult?.rendererAttached ?? false,
    drawRequested: handoffResult?.drawRequested ?? false,
    canvasCreated: handoffResult?.canvasCreated ?? false,
    webglContextCreated: handoffResult?.webglContextCreated ?? false,
    overlayCreated: handoffResult?.overlayCreated ?? false,
    listenerAdded: false,
    networkRequested: handoffResult?.networkRequested ?? false,
    assetDownloadRequested: handoffResult?.assetDownloadRequested ?? false,
    automaticInvocation: false,
    safetyFlagSnapshot,
    atlasDiagnostic,
    rendererHandoff: handoffResult
  });
}

export function createDeveloperOnlyLiveAtlasRendererHandoffReadiness(options = {}) {
  const getAtlasDiagnosticForCurrentMapCentre =
    options.getAtlasDiagnosticForCurrentMapCentre ?? (() => null);
  const getRendererConsumerDescriptor =
    options.getRendererConsumerDescriptor ??
    (() => createDiscoveredGrowGoCustom25DRendererConsumerDescriptor());
  const expectedScope = options.expectedScope;

  function getAtlasRendererHandoffReadiness() {
    const atlasDiagnostic = getAtlasDiagnosticForCurrentMapCentre();
    const rendererConsumerDescriptor = getRendererConsumerDescriptor();
    const handoffResult = validateAtlasRendererZeroDrawHandoff({
      atlasDiagnostic,
      rendererConsumerDescriptor,
      expectedScope
    });

    return buildCombinedReadinessResult({
      atlasDiagnostic,
      handoffResult
    });
  }

  return deepFreeze({
    getAtlasRendererHandoffReadiness
  });
}

export function installDeveloperOnlyLiveAtlasRendererHandoffReadiness(options = {}) {
  const globalObject = options.globalObject ?? globalThis;
  const namespaceKey = options.namespaceKey ?? "GrowGoDeveloperDiagnostics";
  const readiness = options.readiness;

  if (
    !globalObject ||
    !readiness ||
    typeof readiness.getAtlasRendererHandoffReadiness !== "function"
  ) {
    return null;
  }

  const namespace =
    globalObject[namespaceKey] && typeof globalObject[namespaceKey] === "object"
      ? globalObject[namespaceKey]
      : null;

  if (!namespace) {
    return null;
  }

  namespace.getAtlasRendererHandoffReadiness =
    readiness.getAtlasRendererHandoffReadiness;

  return namespace;
}
