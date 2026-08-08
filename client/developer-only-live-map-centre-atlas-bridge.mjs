import { createBrowserReadyDeveloperOnlyAtlasMapAdapter } from "./developer-only-atlas-browser-contract.mjs";

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

function buildBridgeState(atlasDiagnostic) {
  return deepFreeze({
    explicitInvocationOnly: true,
    liveMapGetterInvoked: true,
    liveMapCentreReadCount: 1,
    listenersAttached: false,
    mapMutated: false,
    rendererAttached: false,
    networkRequested: false,
    atlasAdapterReused: true,
    inheritedAtlasExecutionBoundaries: atlasDiagnostic?.executionBoundaries ?? null
  });
}

function buildBlockedBridgeResult({
  reasonCode,
  safetyFlags,
  coordinate = null
}) {
  return deepFreeze({
    schemaId: "ATLAS_LIVE_MAP_CENTRE_DIAGNOSTIC_RESULT_001",
    diagnosticStatus: "blocked",
    reasonCode,
    coordinate,
    resolvedRegion: null,
    resolvedPackage: null,
    resolvedRecipe: null,
    safetyFlags,
    executionBoundaries: buildBridgeState(null)
  });
}

function isValidCentreCoordinate(value) {
  return !!value && typeof value === "object" && Number.isFinite(value.lat) && Number.isFinite(value.lng);
}

export function createDeveloperOnlyLiveMapCentreAtlasBridge(options = {}) {
  const getGrowGoMap = options.getGrowGoMap ?? (() => null);
  const atlasAdapter =
    options.atlasAdapter ?? createBrowserReadyDeveloperOnlyAtlasMapAdapter({
      bridgeStateOverride: {
        liveMapGetterImplemented: true,
        liveMapInvocationPerformed: true,
        listenersAttached: false,
        mapMutated: false,
        rendererAttached: false,
        domMutated: false
      }
    });

  function getAtlasDiagnosticForCurrentMapCentre() {
    const safetyFlags = atlasAdapter.getSafetyFlags();
    const liveMap = getGrowGoMap();

    if (!liveMap) {
      return buildBlockedBridgeResult({
        reasonCode: "LIVE_MAP_UNAVAILABLE",
        safetyFlags
      });
    }

    if (typeof liveMap.getCenter !== "function") {
      return buildBlockedBridgeResult({
        reasonCode: "MAP_CENTER_UNAVAILABLE",
        safetyFlags
      });
    }

    const centre = liveMap.getCenter();

    if (!isValidCentreCoordinate(centre)) {
      return buildBlockedBridgeResult({
        reasonCode: "MALFORMED_MAP_CENTER",
        safetyFlags,
        coordinate: {
          latitude: centre?.lat ?? null,
          longitude: centre?.lng ?? null
        }
      });
    }

    const atlasDiagnostic = atlasAdapter.getAtlasMapDiagnostic({
      latitude: centre.lat,
      longitude: centre.lng
    });

    return deepFreeze({
      schemaId: "ATLAS_LIVE_MAP_CENTRE_DIAGNOSTIC_RESULT_001",
      diagnosticStatus: atlasDiagnostic.diagnosticStatus,
      reasonCode: atlasDiagnostic.reasonCode,
      coordinate: atlasDiagnostic.coordinate,
      approvedScope: atlasDiagnostic.approvedScope,
      activeDeveloperScopeId: atlasDiagnostic.activeDeveloperScopeId ?? null,
      matchedScopeReason: atlasDiagnostic.matchedScopeReason ?? null,
      approvedScopeList: atlasDiagnostic.approvedScopeList ?? Object.freeze([]),
      coordinateMatchResult: atlasDiagnostic.coordinateMatchResult ?? null,
      resolvedRegion: atlasDiagnostic.resolvedRegion,
      resolvedPackage: atlasDiagnostic.resolvedPackage,
      resolvedRecipe: atlasDiagnostic.resolvedRecipe,
      selectorSeed: atlasDiagnostic.selectorSeed ?? null,
      safetyFlags,
      executionBoundaries: buildBridgeState(atlasDiagnostic),
      atlasDiagnostic
    });
  }

  return deepFreeze({
    getAtlasDiagnosticForCurrentMapCentre,
    getSafetyFlags() {
      return atlasAdapter.getSafetyFlags();
    }
  });
}

export function installDeveloperOnlyLiveMapCentreAtlasDiagnosticBridge(options = {}) {
  const globalObject = options.globalObject ?? globalThis;
  const namespaceKey = options.namespaceKey ?? "GrowGoDeveloperDiagnostics";
  const bridge = options.bridge;

  if (!globalObject || !bridge || typeof bridge.getAtlasDiagnosticForCurrentMapCentre !== "function") {
    return null;
  }

  const namespace =
    globalObject[namespaceKey] && typeof globalObject[namespaceKey] === "object"
      ? globalObject[namespaceKey]
      : null;

  if (!namespace) {
    return null;
  }

  namespace.getAtlasDiagnosticForCurrentMapCentre =
    bridge.getAtlasDiagnosticForCurrentMapCentre;

  return namespace;
}
