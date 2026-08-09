import {
  createDeveloperOnlyAtlasControlledOneAssetLiveDraw,
  installDeveloperOnlyAtlasControlledOneAssetLiveDraw
} from "./developer-only-atlas-controlled-one-asset-live-draw.mjs";

const BROWSER_WIRING_STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_CONTROLLED_ONE_ASSET_LIVE_DRAW_BROWSER_WIRING_STATUS_001";

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

function unavailable(reasonCode) {
  const fn = () => {
    throw Object.assign(new Error(reasonCode), { reasonCode });
  };
  fn.__growgoUnavailable = true;
  fn.__growgoReasonCode = reasonCode;
  return fn;
}

function isAvailableFunction(value) {
  return typeof value === "function" && value.__growgoUnavailable !== true;
}

function resolveUnavailableReason(value, fallback) {
  if (typeof value === "function" && value.__growgoUnavailable === true) {
    return sanitizeString(value.__growgoReasonCode) ?? fallback;
  }
  return fallback;
}

function createDefaultAssetResolverProvider() {
  return ({ rendererHandoff, approvedAssetRecord, persistentAtlasStatus }) =>
    deepFreeze({
      assetResolverStatus: "resolved_existing_asset_reference",
      selectedExistingAssetId: approvedAssetRecord.assetId,
      resolvedGlbIdentity: approvedAssetRecord.resolvedGlbIdentity,
      resolvedLodProfile: approvedAssetRecord.resolvedLodProfile,
      sourceWorldPlacementPacketId:
        sanitizeString(rendererHandoff?.sourceWorldPlacementPacketId) ?? null,
      sessionId: sanitizeString(persistentAtlasStatus?.sessionId) ?? null,
      mapIdentityId: sanitizeString(persistentAtlasStatus?.mapIdentityId) ?? null
    });
}

function sanitizePlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

export function createDeveloperOnlyAtlasControlledOneAssetLiveDrawBrowserWiring({
  hostnameProvider = () => "",
  persistentAtlasStatusProvider = () => null,
  assetResolverProvider = createDefaultAssetResolverProvider(),
  assetLoadProvider = unavailable(
    "ONE_ASSET_LIVE_DRAW_ASSET_LOAD_DEPENDENCY_UNAVAILABLE"
  ),
  rendererSubmitProvider = unavailable(
    "ONE_ASSET_LIVE_DRAW_RENDERER_SUBMIT_DEPENDENCY_UNAVAILABLE"
  ),
  cleanupProvider = () =>
    deepFreeze({
      cleanupStatus: "already_clear",
      resourcesReleased: true
    })
} = {}) {
  const baseCommand = createDeveloperOnlyAtlasControlledOneAssetLiveDraw({
    hostnameProvider,
    persistentAtlasStatusProvider,
    assetResolverProvider,
    assetLoadProvider,
    rendererSubmitProvider,
    cleanupProvider
  });

  function getControlledOneAssetLiveDrawBrowserWiringStatus() {
    const dependencyFailures = [];

    if (!isAvailableFunction(assetResolverProvider)) {
      dependencyFailures.push(
        resolveUnavailableReason(
          assetResolverProvider,
          "ONE_ASSET_LIVE_DRAW_ASSET_RESOLVER_DEPENDENCY_UNAVAILABLE"
        )
      );
    }
    if (!isAvailableFunction(assetLoadProvider)) {
      dependencyFailures.push(
        resolveUnavailableReason(
          assetLoadProvider,
          "ONE_ASSET_LIVE_DRAW_ASSET_LOAD_DEPENDENCY_UNAVAILABLE"
        )
      );
    }
    if (!isAvailableFunction(rendererSubmitProvider)) {
      dependencyFailures.push(
        resolveUnavailableReason(
          rendererSubmitProvider,
          "ONE_ASSET_LIVE_DRAW_RENDERER_SUBMIT_DEPENDENCY_UNAVAILABLE"
        )
      );
    }

    const commandAvailable = true;
    const dependenciesAvailable = dependencyFailures.length === 0;
    const browserWiringStatus = dependenciesAvailable ? "ready" : "blocked";
    const browserWiringReason = dependenciesAvailable
      ? "ONE_ASSET_LIVE_DRAW_BROWSER_WIRING_READY"
      : dependencyFailures[0];

    return deepFreeze({
      schemaId: BROWSER_WIRING_STATUS_SCHEMA_ID,
      oneAssetLiveDrawCommandAvailable: commandAvailable,
      oneAssetLiveDrawDependenciesAvailable: dependenciesAvailable,
      oneAssetLiveDrawBrowserWiringStatus: browserWiringStatus,
      oneAssetLiveDrawBrowserWiringReason: browserWiringReason,
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }

  const wrappedCommand = deepFreeze({
    getControlledOneAssetLiveDrawStatus() {
      const baseStatus = sanitizePlainObject(
        baseCommand.getControlledOneAssetLiveDrawStatus()
      ) ?? {
        schemaId:
          "GROWGO_DEVELOPER_ONLY_ATLAS_CONTROLLED_ONE_ASSET_LIVE_DRAW_STATUS_001"
      };
      const browserStatus = getControlledOneAssetLiveDrawBrowserWiringStatus();
      return deepFreeze({
        ...baseStatus,
        oneAssetLiveDrawCommandAvailable:
          browserStatus.oneAssetLiveDrawCommandAvailable,
        oneAssetLiveDrawDependenciesAvailable:
          browserStatus.oneAssetLiveDrawDependenciesAvailable,
        oneAssetLiveDrawBrowserWiringStatus:
          browserStatus.oneAssetLiveDrawBrowserWiringStatus,
        oneAssetLiveDrawBrowserWiringReason:
          browserStatus.oneAssetLiveDrawBrowserWiringReason,
        canonicalSafetyFlags: canonicalSafetyFlags()
      });
    },
    authorizeControlledOneAssetLiveDraw(input) {
      return baseCommand.authorizeControlledOneAssetLiveDraw(input);
    },
    drawControlledOneAssetLive(input) {
      return baseCommand.drawControlledOneAssetLive(input);
    },
    clearControlledOneAssetLiveDraw(input) {
      return baseCommand.clearControlledOneAssetLiveDraw(input);
    },
    getControlledOneAssetLiveDrawBrowserWiringStatus
  });

  return deepFreeze({
    command: wrappedCommand,
    getControlledOneAssetLiveDrawBrowserWiringStatus,
    __internal: deepFreeze({
      baseCommand
    })
  });
}

export function installDeveloperOnlyAtlasControlledOneAssetLiveDrawBrowserWiring({
  globalObject = globalThis,
  wiring,
  namespaceKey = "GrowGoDeveloperDiagnostics",
  hostnameProvider = () => ""
} = {}) {
  const command = wiring?.command ?? wiring;
  const namespace = installDeveloperOnlyAtlasControlledOneAssetLiveDraw({
    globalObject,
    command,
    namespaceKey,
    hostnameProvider
  });

  if (!namespace) {
    return null;
  }

  if (
    command &&
    typeof command.getControlledOneAssetLiveDrawBrowserWiringStatus === "function"
  ) {
    namespace.getControlledOneAssetLiveDrawBrowserWiringStatus = () =>
      command.getControlledOneAssetLiveDrawBrowserWiringStatus();
  }

  return namespace;
}
