import {
  createDeveloperOnlyAtlasControlledOneAssetLiveDraw,
  installDeveloperOnlyAtlasControlledOneAssetLiveDraw
} from "./developer-only-atlas-controlled-one-asset-live-draw.mjs";
import {
  createDeveloperOnlyAtlasControlledOneAssetLoadDependencyBridge
} from "./developer-only-atlas-controlled-one-asset-load-dependency-bridge.mjs";
import {
  createDeveloperOnlyAtlasControlledOneAssetRendererSubmitDependencyBridge
} from "./developer-only-atlas-controlled-one-asset-renderer-submit-dependency-bridge.mjs";

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
  assetLoadDependencyBridge =
    createDeveloperOnlyAtlasControlledOneAssetLoadDependencyBridge(),
  rendererSubmitDependencyBridge =
    createDeveloperOnlyAtlasControlledOneAssetRendererSubmitDependencyBridge(),
  assetLoadProvider = ({ rendererHandoff, approvedAssetRecord, resolvedAsset }) =>
    assetLoadDependencyBridge.loadControlledOneAssetLiveDrawAssetDependency({
      rendererHandoff,
      approvedAssetRecord,
      resolvedAsset
    }),
  rendererSubmitProvider = ({
    rendererHandoff,
    loadedAsset,
    approvedAssetRecord
  }) =>
    rendererSubmitDependencyBridge.submitControlledOneAssetLiveDraw({
      rendererHandoff,
      loadedAsset,
      approvedAssetRecord
    }),
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
    const assetLoadDependencyStatus =
      typeof assetLoadDependencyBridge
        ?.getControlledOneAssetLiveDrawAssetLoadDependencyStatus === "function"
        ? assetLoadDependencyBridge.getControlledOneAssetLiveDrawAssetLoadDependencyStatus()
        : null;
    const rendererSubmitDependencyStatus =
      typeof rendererSubmitDependencyBridge
        ?.getControlledOneAssetLiveDrawRendererSubmitDependencyStatus === "function"
        ? rendererSubmitDependencyBridge.getControlledOneAssetLiveDrawRendererSubmitDependencyStatus()
        : null;

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
      oneAssetLiveDrawAssetLoadDependencyStatus:
        sanitizeString(
          assetLoadDependencyStatus?.oneAssetLiveDrawAssetLoadDependencyStatus
        ) ?? null,
      selectedAssetLoaderId:
        sanitizeString(assetLoadDependencyStatus?.selectedAssetLoaderId) ?? null,
      selectedExistingAssetId:
        sanitizeString(assetLoadDependencyStatus?.selectedExistingAssetId) ?? null,
      resolvedGlbIdentity:
        sanitizeString(assetLoadDependencyStatus?.resolvedGlbIdentity) ?? null,
      assetLoadDependencyReason:
        sanitizeString(assetLoadDependencyStatus?.assetLoadDependencyReason) ?? null,
      oneAssetLiveDrawRendererSubmitDependencyStatus:
        sanitizeString(
          rendererSubmitDependencyStatus
            ?.oneAssetLiveDrawRendererSubmitDependencyStatus
        ) ?? null,
      rendererSubmitDependencyId:
        sanitizeString(
          rendererSubmitDependencyStatus?.rendererSubmitDependencyId
        ) ?? null,
      rendererSubmitAvailabilityStatus:
        sanitizeString(
          rendererSubmitDependencyStatus?.rendererSubmitAvailabilityStatus
        ) ?? null,
      rendererSubmitReason:
        sanitizeString(rendererSubmitDependencyStatus?.rendererSubmitReason) ?? null,
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
        oneAssetLiveDrawAssetLoadDependencyStatus:
          browserStatus.oneAssetLiveDrawAssetLoadDependencyStatus,
        selectedAssetLoaderId: browserStatus.selectedAssetLoaderId,
        assetLoadDependencyReason:
          browserStatus.assetLoadDependencyReason,
        oneAssetLiveDrawRendererSubmitDependencyStatus:
          browserStatus.oneAssetLiveDrawRendererSubmitDependencyStatus,
        rendererSubmitDependencyId:
          browserStatus.rendererSubmitDependencyId,
        rendererSubmitAvailabilityStatus:
          browserStatus.rendererSubmitAvailabilityStatus,
        rendererSubmitReason:
          browserStatus.rendererSubmitReason,
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
