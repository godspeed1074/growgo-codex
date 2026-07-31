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

function defaultDiagnosticUnavailableResult() {
  return deepFreeze({
    schemaId: "ATLAS_LIVE_MAP_CENTRE_DIAGNOSTIC_RESULT_001",
    diagnosticStatus: "blocked",
    reasonCode: "DIAGNOSTIC_UNAVAILABLE"
  });
}

function normalizeAuthorizationState(rawAuthorizationState, safetyFlags) {
  const source =
    typeof rawAuthorizationState?.source === "string" && rawAuthorizationState.source.trim()
      ? rawAuthorizationState.source
      : "canonical";
  const effectiveMapAttachmentAllowed = rawAuthorizationState?.mapAttachmentAllowed === true;

  return deepFreeze({
    source,
    seamApplied: source !== "canonical",
    canonicalMapAttachmentAllowed: safetyFlags.mapAttachmentAllowed === true,
    effectiveMapAttachmentAllowed,
    attachAllowed: effectiveMapAttachmentAllowed
  });
}

function createDefaultAuthorizationReader(atlasAdapter) {
  return function getAuthorizationState() {
    const safetyFlags = atlasAdapter.getSafetyFlags();
    return {
      source: "canonical",
      mapAttachmentAllowed: safetyFlags.mapAttachmentAllowed === true
    };
  };
}

export function createGatedDeveloperOnlyAtlasMapAttachmentController(options = {}) {
  const atlasAdapter =
    options.atlasAdapter ?? createBrowserReadyDeveloperOnlyAtlasMapAdapter();
  const getGrowGoMap = options.getGrowGoMap ?? (() => null);
  const runAtlasDiagnostic =
    options.runAtlasDiagnostic ??
    options.getAtlasDiagnosticForCurrentMapCentre ?? defaultDiagnosticUnavailableResult;
  const getAuthorizationState =
    options.getAuthorizationState ?? createDefaultAuthorizationReader(atlasAdapter);
  const listenerEventName = "moveend";

  let attached = false;
  let ownedMap = null;
  let ownedListener = null;
  let diagnosticInvocationCount = 0;
  let lastDiagnosticStatus = null;
  let lastReasonCode = null;

  function getApprovedDeveloperOnlyScope() {
    return atlasAdapter.getApprovedScope();
  }

  function getSafetyFlags() {
    return atlasAdapter.getSafetyFlags();
  }

  function getNormalizedAuthorizationState() {
    return normalizeAuthorizationState(getAuthorizationState(), getSafetyFlags());
  }

  function buildStatus() {
    return deepFreeze({
      schemaId: "ATLAS_MAP_ATTACHMENT_CONTROLLER_STATUS_001",
      attached,
      authorizationState: getNormalizedAuthorizationState(),
      listenerEventName,
      ownedListenerCount: attached && ownedListener ? 1 : 0,
      diagnosticInvocationCount,
      lastDiagnosticStatus,
      lastReasonCode,
      approvedDeveloperOnlyScope: getApprovedDeveloperOnlyScope(),
      safetyFlags: getSafetyFlags(),
      automaticStartupAttachment: false,
      rendererActivity: false,
      networkActivity: false,
      overlayActivity: false,
      pollingOrTimerActivity: false,
      livePageDetachedByDefault: !attached
    });
  }

  function buildOperationResult(operation, outcome, reasonCode) {
    return deepFreeze({
      schemaId: "ATLAS_MAP_ATTACHMENT_CONTROLLER_OPERATION_RESULT_001",
      operation,
      outcome,
      reasonCode,
      status: buildStatus()
    });
  }

  function attachAtlasMapDiagnostic() {
    if (attached) {
      return buildOperationResult("attach", "noop", "ALREADY_ATTACHED");
    }

    const liveMap = getGrowGoMap();

    if (!liveMap) {
      return buildOperationResult("attach", "blocked", "LIVE_MAP_UNAVAILABLE");
    }

    if (typeof liveMap.on !== "function" || typeof liveMap.off !== "function") {
      return buildOperationResult("attach", "blocked", "MAP_LISTENER_API_UNAVAILABLE");
    }

    const authorizationState = getNormalizedAuthorizationState();

    if (!authorizationState.attachAllowed) {
      return buildOperationResult("attach", "blocked", "MAP_ATTACHMENT_NOT_AUTHORIZED");
    }

    ownedMap = liveMap;
    ownedListener = () => {
      const diagnosticResult = runAtlasDiagnostic();
      diagnosticInvocationCount += 1;
      lastDiagnosticStatus = diagnosticResult?.diagnosticStatus ?? null;
      lastReasonCode = diagnosticResult?.reasonCode ?? null;
    };

    ownedMap.on(listenerEventName, ownedListener);
    attached = true;

    return buildOperationResult("attach", "attached", "ATTACHED");
  }

  function detachAtlasMapDiagnostic() {
    if (!attached || !ownedMap || !ownedListener) {
      attached = false;
      ownedMap = null;
      ownedListener = null;
      return buildOperationResult("detach", "noop", "ALREADY_DETACHED");
    }

    ownedMap.off(listenerEventName, ownedListener);
    attached = false;
    ownedMap = null;
    ownedListener = null;

    return buildOperationResult("detach", "detached", "DETACHED");
  }

  function getAtlasMapAttachmentStatus() {
    return buildStatus();
  }

  return deepFreeze({
    attachAtlasMapDiagnostic,
    detachAtlasMapDiagnostic,
    getAtlasMapAttachmentStatus
  });
}

export function installGatedDeveloperOnlyAtlasMapAttachmentController(options = {}) {
  const globalObject = options.globalObject ?? globalThis;
  const namespaceKey = options.namespaceKey ?? "GrowGoDeveloperDiagnostics";
  const controller = options.controller;

  if (!globalObject || !controller) {
    return null;
  }

  const namespace =
    globalObject[namespaceKey] && typeof globalObject[namespaceKey] === "object"
      ? globalObject[namespaceKey]
      : null;

  if (!namespace) {
    return null;
  }

  namespace.attachAtlasMapDiagnostic = controller.attachAtlasMapDiagnostic;
  namespace.detachAtlasMapDiagnostic = controller.detachAtlasMapDiagnostic;
  namespace.getAtlasMapAttachmentStatus = controller.getAtlasMapAttachmentStatus;

  return namespace;
}
