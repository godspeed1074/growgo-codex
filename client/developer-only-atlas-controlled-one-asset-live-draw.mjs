import {
  DEFAULT_DEVELOPER_ONLY_ATLAS_APPROVED_EXISTING_ASSET_RECORDS
} from "./developer-only-atlas-controlled-existing-asset-binding-contract.mjs";
import {
  createDiscoveredGrowGoCustom25DRendererConsumerDescriptor
} from "./developer-only-atlas-renderer-zero-draw-handoff.mjs";

const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_CONTROLLED_ONE_ASSET_LIVE_DRAW_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_CONTROLLED_ONE_ASSET_LIVE_DRAW_RESULT_001";

export const AUTHORIZE_CONTROLLED_ONE_ASSET_LIVE_DRAW_ONE_SESSION =
  "AUTHORIZE_CONTROLLED_ONE_ASSET_LIVE_DRAW_ONE_SESSION";
export const DRAW_CONTROLLED_ONE_ASSET_LIVE =
  "DRAW_CONTROLLED_ONE_ASSET_LIVE";
export const CLEAR_CONTROLLED_ONE_ASSET_LIVE_DRAW =
  "CLEAR_CONTROLLED_ONE_ASSET_LIVE_DRAW";

export const DEFAULT_CONTROLLED_ONE_ASSET_LIVE_DRAW_ASSET_ID =
  "TREE_EUCALYPTUS_001";

const LOCAL_DEVELOPMENT_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1"
]);

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  if (seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested, seen);
    }
  }
  return Object.freeze(value);
}

function canonicalSafetyFlags() {
  return deepFreeze({
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

function sanitizeString(value) {
  return value == null ? null : String(value);
}

function assertFiniteNumber(value, reasonCode) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw Object.assign(new Error(reasonCode), { reasonCode });
  }
  return number;
}

function hashString(input) {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let index = 0; index < input.length; index += 1) {
    const charCode = input.charCodeAt(index);
    h1 = Math.imul(h1 ^ charCode, 2654435761);
    h2 = Math.imul(h2 ^ charCode, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, "0")}${(h1 >>> 0)
    .toString(16)
    .padStart(8, "0")}`;
}

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function isLocalDevelopmentHost(hostname) {
  return LOCAL_DEVELOPMENT_HOSTS.has(String(hostname ?? "").trim());
}

function unavailable(reasonCode) {
  const fn = () => {
    throw Object.assign(new Error(reasonCode), { reasonCode });
  };
  fn.__growgoUnavailable = true;
  return fn;
}

function isAvailableFunction(value) {
  return typeof value === "function" && value.__growgoUnavailable !== true;
}

function toReasonCode(error, fallback) {
  if (!error) {
    return fallback;
  }
  if (typeof error.reasonCode === "string" && error.reasonCode.trim()) {
    return error.reasonCode;
  }
  if (typeof error.code === "string" && error.code.trim()) {
    return error.code;
  }
  if (typeof error.message === "string" && error.message.trim()) {
    return error.message.trim().replace(/\s+/g, "_").toUpperCase();
  }
  return fallback;
}

function buildLiveDrawId({
  rendererHandoffPacketId,
  selectedExistingAssetId,
  resolvedGlbIdentity,
  resolvedLodProfile
}) {
  return `ATLAS_CONTROLLED_ONE_ASSET_LIVE_DRAW_${hashString(
    stableSerialize({
      rendererHandoffPacketId,
      selectedExistingAssetId,
      resolvedGlbIdentity,
      resolvedLodProfile
    })
  )
    .slice(0, 20)
    .toUpperCase()}`;
}

function buildApprovedExistingAssetMap() {
  return new Map(
    DEFAULT_DEVELOPER_ONLY_ATLAS_APPROVED_EXISTING_ASSET_RECORDS.map((record) => [
      record.assetId,
      deepFreeze({ ...record })
    ])
  );
}

function validateRendererConsumerDescriptor(descriptor) {
  if (!descriptor || typeof descriptor !== "object") {
    throw Object.assign(new Error("RENDERER_CONSUMER_UNAVAILABLE"), {
      reasonCode: "RENDERER_CONSUMER_UNAVAILABLE"
    });
  }
  if (
    descriptor.schemaId !== "GROWGO_CUSTOM_25D_RENDERER_CONSUMER_DESCRIPTOR_001" ||
    descriptor.rendererId !== "GROWGO_CUSTOM_25D_MAP_EXPERIMENT" ||
    descriptor.drawEntryPoint !== "drawCustom25DMapCanvas" ||
    descriptor.passiveHandoffOnly !== true
  ) {
    throw Object.assign(new Error("RENDERER_IDENTITY_MISMATCH"), {
      reasonCode: "RENDERER_IDENTITY_MISMATCH"
    });
  }
  return deepFreeze({ ...descriptor });
}

function validatePersistentAtlasStatus(status) {
  if (!status || typeof status !== "object") {
    throw Object.assign(new Error("PERSISTENT_ATLAS_UNAVAILABLE"), {
      reasonCode: "PERSISTENT_ATLAS_UNAVAILABLE"
    });
  }
  const flags = status.canonicalSafetyFlags ?? canonicalSafetyFlags();
  if (
    flags.runtimeExecutionEnabled !== false ||
    flags.mapAttachmentAllowed !== false ||
    flags.automaticRendererExecutionAllowed !== false ||
    flags.lifecycleExecutionEnabled !== false
  ) {
    throw Object.assign(new Error("CANONICAL_SAFETY_FLAGS_OPEN"), {
      reasonCode: "CANONICAL_SAFETY_FLAGS_OPEN"
    });
  }
  if (status.attached !== true || status.integrationState !== "attached_idle") {
    throw Object.assign(new Error("PERSISTENT_ATLAS_NOT_ATTACHED"), {
      reasonCode: "PERSISTENT_ATLAS_NOT_ATTACHED"
    });
  }
  if (status.authorizationState !== "attach_permission_consumed") {
    throw Object.assign(new Error("PERSISTENT_ATLAS_UNAUTHORIZED"), {
      reasonCode: "PERSISTENT_ATLAS_UNAUTHORIZED"
    });
  }
  if (status.redrawPermissionAllowed !== true) {
    throw Object.assign(new Error("PERSISTENT_ATLAS_REDRAW_NOT_ALLOWED"), {
      reasonCode: "PERSISTENT_ATLAS_REDRAW_NOT_ALLOWED"
    });
  }
  if (!status.lifecycleOwnerId) {
    throw Object.assign(new Error("PERSISTENT_ATLAS_LIFECYCLE_UNAVAILABLE"), {
      reasonCode: "PERSISTENT_ATLAS_LIFECYCLE_UNAVAILABLE"
    });
  }
  return deepFreeze({
    integrationState: sanitizeString(status.integrationState),
    authorizationState: sanitizeString(status.authorizationState),
    redrawPermissionAllowed: status.redrawPermissionAllowed === true,
    attached: status.attached === true,
    lifecycleOwnerId: sanitizeString(status.lifecycleOwnerId),
    sessionId: sanitizeString(status.sessionId),
    mapIdentityId: sanitizeString(status.mapIdentityId),
    ownedCanvasCount: Number(status.ownedCanvasCount ?? 0),
    ownedPaneCount: Number(status.ownedPaneCount ?? 0),
    canonicalSafetyFlags: flags
  });
}

function validateRendererHandoff(handoff, approvedAssetRecord) {
  if (!handoff || typeof handoff !== "object") {
    throw Object.assign(new Error("INVALID_RENDERER_HANDOFF"), {
      reasonCode: "INVALID_RENDERER_HANDOFF"
    });
  }
  if (handoff.rendererHandoffStatus !== "ready_for_future_renderer_attachment") {
    throw Object.assign(
      new Error(handoff.reasonCode ?? "INVALID_RENDERER_HANDOFF"),
      { reasonCode: handoff.reasonCode ?? "INVALID_RENDERER_HANDOFF" }
    );
  }
  if (handoff.rendererPlacementDescriptorStatus !== "valid") {
    throw Object.assign(new Error("RENDERER_INCOMPATIBLE_DESCRIPTOR"), {
      reasonCode: "RENDERER_INCOMPATIBLE_DESCRIPTOR"
    });
  }
  if (sanitizeString(handoff.selectedExistingAssetId) !== approvedAssetRecord.assetId) {
    throw Object.assign(new Error("ONLY_ONE_ASSET_SUPPORTED"), {
      reasonCode: "ONLY_ONE_ASSET_SUPPORTED"
    });
  }
  if (sanitizeString(handoff.resolvedGlbIdentity) !== approvedAssetRecord.resolvedGlbIdentity) {
    throw Object.assign(new Error("GLB_IDENTITY_MISMATCH"), {
      reasonCode: "GLB_IDENTITY_MISMATCH"
    });
  }
  if (sanitizeString(handoff.resolvedLodProfile) !== approvedAssetRecord.resolvedLodProfile) {
    throw Object.assign(new Error("LOD_IDENTITY_MISMATCH"), {
      reasonCode: "LOD_IDENTITY_MISMATCH"
    });
  }

  const descriptor = handoff.rendererPlacementDescriptor;
  if (
    !descriptor ||
    descriptor.schemaId !==
      "GROWGO_DEVELOPER_ONLY_ATLAS_EXISTING_ASSET_RENDERER_PLACEMENT_DESCRIPTOR_001"
  ) {
    throw Object.assign(new Error("RENDERER_INCOMPATIBLE_DESCRIPTOR"), {
      reasonCode: "RENDERER_INCOMPATIBLE_DESCRIPTOR"
    });
  }

  const worldPosition = {
    x: Number(assertFiniteNumber(descriptor.worldPosition?.x, "INVALID_WORLD_PLACEMENT_TRANSFORM").toFixed(3)),
    y: Number(assertFiniteNumber(descriptor.worldPosition?.y, "INVALID_WORLD_PLACEMENT_TRANSFORM").toFixed(3))
  };
  const heading = Number(assertFiniteNumber(descriptor.heading, "INVALID_WORLD_PLACEMENT_TRANSFORM").toFixed(3));
  const scale = Number(assertFiniteNumber(descriptor.scale, "INVALID_WORLD_PLACEMENT_TRANSFORM").toFixed(4));

  return deepFreeze({
    rendererHandoffPacketId: sanitizeString(handoff.rendererHandoffPacketId),
    selectedExistingAssetId: approvedAssetRecord.assetId,
    resolvedGlbIdentity: approvedAssetRecord.resolvedGlbIdentity,
    resolvedLodProfile: approvedAssetRecord.resolvedLodProfile,
    sourceWorldPlacementPacketId: sanitizeString(handoff.sourceWorldPlacementPacketId),
    rendererPlacementDescriptor: deepFreeze({ ...descriptor }),
    rendererConsumerDescriptor: validateRendererConsumerDescriptor(
      handoff.rendererConsumerDescriptor ??
        createDiscoveredGrowGoCustom25DRendererConsumerDescriptor()
    ),
    worldPosition,
    heading,
    scale
  });
}

function createState() {
  return {
    commandAvailable: true,
    authorizationState: "inactive",
    authorizationActive: false,
    confirmationAccepted: false,
    authorizationConsumed: false,
    controlledLiveAssetDrawId: null,
    selectedExistingAssetId: null,
    resolvedGlbIdentity: null,
    resolvedLodProfile: null,
    assetLoadStatus: "idle",
    rendererSubmitStatus: "idle",
    renderedAssetCount: 0,
    cleanupStatus: "idle",
    controlledLiveDrawStatus: "idle",
    controlledLiveDrawReason: null,
    lastFailureReason: null,
    resourcesActive: false
  };
}

function resetAuthorizationState(state) {
  state.authorizationState = "inactive";
  state.authorizationActive = false;
  state.confirmationAccepted = false;
  state.authorizationConsumed = false;
}

function cloneStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    commandAvailable: state.commandAvailable,
    authorizationState: state.authorizationState,
    authorizationActive: state.authorizationActive,
    confirmationAccepted: state.confirmationAccepted,
    authorizationConsumed: state.authorizationConsumed,
    controlledLiveAssetDrawId: state.controlledLiveAssetDrawId,
    selectedExistingAssetId: state.selectedExistingAssetId,
    resolvedGlbIdentity: state.resolvedGlbIdentity,
    resolvedLodProfile: state.resolvedLodProfile,
    assetLoadStatus: state.assetLoadStatus,
    rendererSubmitStatus: state.rendererSubmitStatus,
    renderedAssetCount: state.renderedAssetCount,
    cleanupStatus: state.cleanupStatus,
    controlledLiveDrawStatus: state.controlledLiveDrawStatus,
    controlledLiveDrawReason: state.controlledLiveDrawReason,
    lastFailureReason: state.lastFailureReason,
    resourcesActive: state.resourcesActive,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function buildResult(command, outcome, reasonCode, state, extra = {}) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    command,
    outcome,
    reasonCode,
    authorizationState: state.authorizationState,
    controlledLiveAssetDrawId: state.controlledLiveAssetDrawId,
    selectedExistingAssetId: state.selectedExistingAssetId,
    resolvedGlbIdentity: state.resolvedGlbIdentity,
    resolvedLodProfile: state.resolvedLodProfile,
    assetLoadStatus: state.assetLoadStatus,
    rendererSubmitStatus: state.rendererSubmitStatus,
    renderedAssetCount: state.renderedAssetCount,
    cleanupStatus: state.cleanupStatus,
    controlledLiveDrawStatus: state.controlledLiveDrawStatus,
    controlledLiveDrawReason: state.controlledLiveDrawReason,
    resourcesActive: state.resourcesActive,
    canonicalSafetyFlags: canonicalSafetyFlags(),
    ...extra
  });
}

export function createDeveloperOnlyAtlasControlledOneAssetLiveDraw({
  hostnameProvider = () => "",
  persistentAtlasStatusProvider = () => null,
  assetResolverProvider = unavailable("ASSET_RESOLVER_PROVIDER_UNAVAILABLE"),
  assetLoadProvider = unavailable("ASSET_LOAD_PROVIDER_UNAVAILABLE"),
  rendererSubmitProvider = unavailable("RENDERER_SUBMIT_PROVIDER_UNAVAILABLE"),
  cleanupProvider = () => ({ cleanupStatus: "already_clear", resourcesReleased: true })
} = {}) {
  const state = createState();
  const approvedAssetRecords = buildApprovedExistingAssetMap();
  const approvedAssetRecord =
    approvedAssetRecords.get(DEFAULT_CONTROLLED_ONE_ASSET_LIVE_DRAW_ASSET_ID);
  let activeSession = null;
  let activeRuntime = null;
  let sessionCounter = 0;

  function getStatus() {
    return cloneStatus(state);
  }

  function authorizeControlledOneAssetLiveDraw({ confirmation } = {}) {
    if (!isLocalDevelopmentHost(hostnameProvider())) {
      return buildResult(
        "authorizeControlledOneAssetLiveDraw",
        "blocked",
        "LOCAL_DEVELOPMENT_HOST_REQUIRED",
        getStatus()
      );
    }
    if (confirmation !== AUTHORIZE_CONTROLLED_ONE_ASSET_LIVE_DRAW_ONE_SESSION) {
      return buildResult(
        "authorizeControlledOneAssetLiveDraw",
        "blocked",
        confirmation == null ? "MISSING_CONFIRMATION" : "INVALID_CONFIRMATION",
        getStatus()
      );
    }
    if (activeSession && activeSession.consumed !== true) {
      return buildResult(
        "authorizeControlledOneAssetLiveDraw",
        "noop",
        "ALREADY_AUTHORIZED",
        getStatus()
      );
    }

    sessionCounter += 1;
    activeSession = {
      sessionId: `ATLAS_CONTROLLED_ONE_ASSET_LIVE_DRAW_SESSION_${String(sessionCounter).padStart(3, "0")}`,
      consumed: false
    };
    state.authorizationState = "active";
    state.authorizationActive = true;
    state.confirmationAccepted = true;
    state.authorizationConsumed = false;
    state.controlledLiveDrawReason = "AUTHORIZED_CONTROLLED_ONE_ASSET_LIVE_DRAW_ONE_SESSION";
    state.lastFailureReason = null;

    return buildResult(
      "authorizeControlledOneAssetLiveDraw",
      "authorized",
      "AUTHORIZED_CONTROLLED_ONE_ASSET_LIVE_DRAW_ONE_SESSION",
      getStatus()
    );
  }

  function drawControlledOneAssetLive({ confirmation, rendererHandoff } = {}) {
    if (confirmation !== DRAW_CONTROLLED_ONE_ASSET_LIVE) {
      return buildResult(
        "drawControlledOneAssetLive",
        "blocked",
        confirmation == null ? "MISSING_CONFIRMATION" : "INVALID_CONFIRMATION",
        getStatus()
      );
    }
    if (!activeSession || activeSession.consumed === true) {
      return buildResult(
        "drawControlledOneAssetLive",
        "blocked",
        "CONTROLLED_LIVE_DRAW_AUTHORIZATION_UNAVAILABLE",
        getStatus()
      );
    }
    if (activeRuntime) {
      return buildResult(
        "drawControlledOneAssetLive",
        "blocked",
        "CONTROLLED_LIVE_DRAW_ALREADY_ACTIVE",
        getStatus()
      );
    }

    try {
      const persistentStatus = validatePersistentAtlasStatus(
        persistentAtlasStatusProvider()
      );
      const validatedHandoff = validateRendererHandoff(
        rendererHandoff,
        approvedAssetRecord
      );
      if (!isAvailableFunction(assetResolverProvider)) {
        throw Object.assign(new Error("ASSET_RESOLVER_PROVIDER_UNAVAILABLE"), {
          reasonCode: "ASSET_RESOLVER_PROVIDER_UNAVAILABLE"
        });
      }
      if (!isAvailableFunction(assetLoadProvider)) {
        throw Object.assign(new Error("ASSET_LOAD_PROVIDER_UNAVAILABLE"), {
          reasonCode: "ASSET_LOAD_PROVIDER_UNAVAILABLE"
        });
      }
      if (!isAvailableFunction(rendererSubmitProvider)) {
        throw Object.assign(new Error("RENDERER_SUBMIT_PROVIDER_UNAVAILABLE"), {
          reasonCode: "RENDERER_SUBMIT_PROVIDER_UNAVAILABLE"
        });
      }

      const controlledLiveAssetDrawId = buildLiveDrawId(validatedHandoff);
      state.controlledLiveAssetDrawId = controlledLiveAssetDrawId;
      state.selectedExistingAssetId = validatedHandoff.selectedExistingAssetId;
      state.resolvedGlbIdentity = validatedHandoff.resolvedGlbIdentity;
      state.resolvedLodProfile = validatedHandoff.resolvedLodProfile;
      state.controlledLiveDrawStatus = "loading";
      state.assetLoadStatus = "resolving";
      state.rendererSubmitStatus = "idle";
      state.cleanupStatus = "idle";
      state.renderedAssetCount = 0;
      state.lastFailureReason = null;

      const resolvedAsset = assetResolverProvider({
        rendererHandoff: validatedHandoff,
        persistentAtlasStatus: persistentStatus,
        approvedAssetRecord
      });
      state.assetLoadStatus = "resolved";
      activeRuntime = {
        controlledLiveAssetDrawId,
        resolvedAsset,
        loadedAsset: null,
        validatedHandoff
      };

      const loadedAsset = assetLoadProvider({
        rendererHandoff: validatedHandoff,
        resolvedAsset,
        persistentAtlasStatus: persistentStatus,
        approvedAssetRecord
      });
      activeRuntime.loadedAsset = loadedAsset;
      state.assetLoadStatus =
        sanitizeString(loadedAsset?.assetLoadStatus) ?? "loaded";

      const submitResult = rendererSubmitProvider({
        rendererHandoff: validatedHandoff,
        resolvedAsset,
        loadedAsset,
        persistentAtlasStatus: persistentStatus,
        approvedAssetRecord
      });

      const renderedAssetCount = Number(submitResult?.renderedAssetCount ?? 0);
      if (renderedAssetCount !== 1) {
        throw Object.assign(new Error("RENDERED_ASSET_COUNT_INVALID"), {
          reasonCode: "RENDERED_ASSET_COUNT_INVALID"
        });
      }

      state.rendererSubmitStatus =
        sanitizeString(submitResult?.rendererSubmitStatus) ?? "submitted";
      state.renderedAssetCount = 1;
      state.controlledLiveDrawStatus = "drawn";
      state.controlledLiveDrawReason =
        "CONTROLLED_ONE_ASSET_LIVE_DRAW_COMPLETED";
      state.authorizationState = "consumed";
      state.authorizationActive = false;
      state.authorizationConsumed = true;
      state.resourcesActive = true;
      activeSession.consumed = true;

      return buildResult(
        "drawControlledOneAssetLive",
        "drawn",
        "CONTROLLED_ONE_ASSET_LIVE_DRAW_COMPLETED",
        getStatus()
      );
    } catch (error) {
      const reasonCode = toReasonCode(error, "CONTROLLED_ONE_ASSET_LIVE_DRAW_FAILED");
      let cleanupStatus = "idle";
      if (activeRuntime) {
        try {
          const cleanupResult = cleanupProvider({
            activeRuntime
          });
          cleanupStatus =
            sanitizeString(cleanupResult?.cleanupStatus) ?? "released";
        } catch (cleanupError) {
          cleanupStatus = "failed";
        }
      }
      activeRuntime = null;
      state.assetLoadStatus =
        state.assetLoadStatus === "idle" ? "blocked" : state.assetLoadStatus;
      state.rendererSubmitStatus =
        state.rendererSubmitStatus === "idle" ? "blocked" : state.rendererSubmitStatus;
      state.cleanupStatus = cleanupStatus;
      state.controlledLiveDrawStatus = "failed_closed";
      state.controlledLiveDrawReason = reasonCode;
      state.lastFailureReason = reasonCode;
      state.resourcesActive = false;
      state.renderedAssetCount = 0;
      resetAuthorizationState(state);
      activeSession = null;
      return buildResult(
        "drawControlledOneAssetLive",
        "failed_closed",
        reasonCode,
        getStatus()
      );
    }
  }

  function clearControlledOneAssetLiveDraw({ confirmation } = {}) {
    if (confirmation !== CLEAR_CONTROLLED_ONE_ASSET_LIVE_DRAW) {
      return buildResult(
        "clearControlledOneAssetLiveDraw",
        "blocked",
        confirmation == null ? "MISSING_CONFIRMATION" : "INVALID_CONFIRMATION",
        getStatus()
      );
    }

    if (!activeRuntime) {
      state.cleanupStatus = "already_clear";
      state.resourcesActive = false;
      state.controlledLiveDrawStatus = "cleared";
      state.controlledLiveDrawReason = "ALREADY_CLEAR";
      return buildResult(
        "clearControlledOneAssetLiveDraw",
        "noop",
        "ALREADY_CLEAR",
        getStatus()
      );
    }

    try {
      const cleanupResult = cleanupProvider({ activeRuntime });
      state.cleanupStatus =
        sanitizeString(cleanupResult?.cleanupStatus) ?? "released";
      state.resourcesActive = false;
      state.renderedAssetCount = 0;
      state.assetLoadStatus = "released";
      state.rendererSubmitStatus = "cleared";
      state.controlledLiveDrawStatus = "cleared";
      state.controlledLiveDrawReason = "CONTROLLED_ONE_ASSET_LIVE_DRAW_CLEARED";
      activeRuntime = null;
      activeSession = null;
      resetAuthorizationState(state);
      return buildResult(
        "clearControlledOneAssetLiveDraw",
        "cleared",
        "CONTROLLED_ONE_ASSET_LIVE_DRAW_CLEARED",
        getStatus()
      );
    } catch (error) {
      const reasonCode = toReasonCode(error, "CONTROLLED_ONE_ASSET_LIVE_DRAW_CLEAR_FAILED");
      state.cleanupStatus = "failed";
      state.lastFailureReason = reasonCode;
      state.controlledLiveDrawStatus = "failed_closed";
      state.controlledLiveDrawReason = reasonCode;
      return buildResult(
        "clearControlledOneAssetLiveDraw",
        "failed_closed",
        reasonCode,
        getStatus()
      );
    }
  }

  return deepFreeze({
    getControlledOneAssetLiveDrawStatus: getStatus,
    authorizeControlledOneAssetLiveDraw,
    drawControlledOneAssetLive,
    clearControlledOneAssetLiveDraw
  });
}

export function installDeveloperOnlyAtlasControlledOneAssetLiveDraw({
  globalObject = globalThis,
  command,
  namespaceKey = "GrowGoDeveloperDiagnostics",
  hostnameProvider = () => ""
} = {}) {
  if (!isLocalDevelopmentHost(hostnameProvider())) {
    return null;
  }
  if (
    !command ||
    typeof command.getControlledOneAssetLiveDrawStatus !== "function" ||
    typeof command.authorizeControlledOneAssetLiveDraw !== "function" ||
    typeof command.drawControlledOneAssetLive !== "function" ||
    typeof command.clearControlledOneAssetLiveDraw !== "function"
  ) {
    return null;
  }

  const namespace =
    globalObject?.[namespaceKey] && typeof globalObject[namespaceKey] === "object"
      ? globalObject[namespaceKey]
      : {};

  namespace.getControlledOneAssetLiveDrawStatus = () =>
    command.getControlledOneAssetLiveDrawStatus();
  namespace.authorizeControlledOneAssetLiveDraw = (input) =>
    command.authorizeControlledOneAssetLiveDraw(input);
  namespace.drawControlledOneAssetLive = (input) =>
    command.drawControlledOneAssetLive(input);
  namespace.clearControlledOneAssetLiveDraw = (input) =>
    command.clearControlledOneAssetLiveDraw(input);

  globalObject[namespaceKey] = namespace;
  return namespace;
}
