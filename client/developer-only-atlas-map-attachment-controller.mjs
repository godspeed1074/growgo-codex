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

const MAP_IDENTITY_IDS = new WeakMap();
let nextMapIdentitySequence = 1;

function assignMapIdentityId(map) {
  if (!map || typeof map !== "object") {
    return null;
  }

  const existing = MAP_IDENTITY_IDS.get(map);
  if (existing) {
    return existing;
  }

  const identityId = `ATLAS_LIVE_MAP_${String(nextMapIdentitySequence).padStart(3, "0")}`;
  nextMapIdentitySequence += 1;
  MAP_IDENTITY_IDS.set(map, identityId);
  return identityId;
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
  const getAuthorizationState =
    options.getAuthorizationState ?? createDefaultAuthorizationReader(atlasAdapter);

  let attached = false;
  let ownedMap = null;
  let ownedMapIdentityId = null;
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
    const currentLiveMap = getGrowGoMap();
    const currentLiveMapIdentityId = assignMapIdentityId(currentLiveMap);
    return deepFreeze({
      schemaId: "ATLAS_MAP_ATTACHMENT_CONTROLLER_STATUS_001",
      attached,
      attachmentMode: "passive_live_map_binding",
      liveMapResolved: ownedMap !== null,
      liveMapIdentityId: currentLiveMapIdentityId,
      attachedMapIdentityId: ownedMapIdentityId,
      exactLiveMapBound:
        attached === true &&
        currentLiveMapIdentityId != null &&
        ownedMapIdentityId != null &&
        currentLiveMapIdentityId === ownedMapIdentityId,
      liveMapValidationStatus: ownedMap ? "validated" : "unbound",
      authorizationState: getNormalizedAuthorizationState(),
      listenerEventName: null,
      ownedListenerCount: 0,
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

    if (typeof liveMap.getCenter !== "function") {
      return buildOperationResult("attach", "blocked", "MAP_CENTER_UNAVAILABLE");
    }

    const authorizationState = getNormalizedAuthorizationState();

    if (!authorizationState.attachAllowed) {
      return buildOperationResult("attach", "blocked", "MAP_ATTACHMENT_NOT_AUTHORIZED");
    }

    ownedMapIdentityId = assignMapIdentityId(liveMap);
    ownedMap = liveMap;
    attached = true;

    return buildOperationResult("attach", "attached", "ATTACHED");
  }

  function detachAtlasMapDiagnostic() {
    if (!attached || !ownedMap) {
      attached = false;
      ownedMap = null;
      ownedMapIdentityId = null;
      return buildOperationResult("detach", "noop", "ALREADY_DETACHED");
    }

    attached = false;
    ownedMap = null;
    ownedMapIdentityId = null;

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
