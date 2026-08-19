import { createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner } from "./developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function fail(reasonCode) {
  throw Object.assign(new Error(reasonCode), { reasonCode });
}

/**
 * Keeps renderer-surface resource ownership out of the startup app. The app
 * supplies approved surface/map adapters; this bridge alone composes the
 * low-level renderer lifecycle owner and exposes only attach/dispose/status.
 */
export function createDeveloperOnlyPersistentAtlasRendererLifecycleBridge({
  mapProvider,
  surfaceProvider,
  surfaceRollbackProvider,
  clearRuntimeReferences
} = {}) {
  let owner = null;
  let publicLifecycle = null;

  function attach({ lifecycleOwnerId, lifecycleGenerationId, surfaceOwnerId } = {}) {
    if (publicLifecycle) fail("DUPLICATE_LIFECYCLE_OWNER_ACQUISITION");
    const map = mapProvider?.();
    const surface = surfaceProvider?.();
    if (!map || !surface?.canvas || !surface?.pane) fail("MISSING_PREPARED_SURFACE");
    owner = createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner({
      removeCanvas(canvas) {
        if (canvas !== surface.canvas) fail("PERSISTENT_SURFACE_IDENTITY_MISMATCH");
        const result = surfaceRollbackProvider?.({ surface });
        if (result?.outcome === "failed_closed") fail(result.reasonCode ?? "PERSISTENT_SURFACE_ROLLBACK_FAILED");
      },
      removePaneIfEmpty() {
        // Surface rollback owns its pane cleanup as one operation.
        return { ok: true, removed: false };
      }
    });
    const registration = owner.register({
      ownershipMode: "ONE_FRAME_SURFACE_ONLY",
      map,
      pane: surface.pane,
      paneName: "custom25DMapPane",
      canvas: surface.canvas,
      listener: null,
      redrawCallback: null,
      listenerEventNames: [],
      retentionSlotName: "custom25DMapLayer",
      clearRetentionSlot: clearRuntimeReferences,
      retentionResetRequired: true,
      paneOwnershipProven: false
    });
    if (registration?.outcome !== "registered") fail(registration?.reasonCode ?? "PERSISTENT_LIFECYCLE_OWNER_REGISTRATION_FAILED");
    publicLifecycle = deepFreeze({
      ownerId: lifecycleOwnerId,
      id: lifecycleOwnerId,
      lifecycleGenerationId,
      surfaceOwnerId,
      dispose: () => owner?.dispose?.(),
      status: () => owner?.status?.()
    });
    return publicLifecycle;
  }

  return deepFreeze({ attach });
}
