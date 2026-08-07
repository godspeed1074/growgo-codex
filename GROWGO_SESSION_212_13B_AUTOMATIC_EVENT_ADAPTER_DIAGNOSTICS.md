# GROWGO SESSION 212.13B — AUTOMATIC EVENT ADAPTER DIAGNOSTICS

## Goal

Expose the existing automatic population live-event adapter status through the existing local developer diagnostics namespace so real Safari verification can inspect event receipt and forwarding.

## Scope

This phase exposes diagnostics only.

It does not change:

- automatic population behavior
- listener registration behavior
- controller logic
- automatic enablement policy
- startup behavior
- renderer behavior

## Change made

Updated:

- [client/developer-only-controlled-automatic-atlas-population-toggle.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-controlled-automatic-atlas-population-toggle.mjs)

The existing toggle installer now exposes:

- `window.GrowGoDeveloperDiagnostics.getAtlasAutomaticPopulationLiveEventAdapterStatus()`

The getter returns the already existing frozen serializable adapter status from:

- `getAtlasAutomaticPopulationLiveEventAdapterStatus(...)`

No second namespace was created.

## Exposed status

The diagnostics getter exposes:

- `schemaId`
- `adapterReady`
- `state`
- `enabled`
- `listenerOwnerId`
- `boundMapIdentityId`
- `boundSessionId`
- `ownedListenerCount`
- `moveendRegistered`
- `zoomendRegistered`
- `resizeRegistered`
- `eventReceivedCount`
- `eventForwardedCount`
- `eventRejectedCount`
- `moveendReceivedCount`
- `zoomendReceivedCount`
- `resizeReceivedCount`
- `lastEventReason`
- `lastFailureReason`
- `staleMapDetected`
- `readinessBlockedDetected`
- `identityMismatchDetected`
- `referencesReleased`
- canonical safety flags

## Safety

The getter does not expose:

- raw map objects
- callbacks
- listener functions
- event objects
- controller internals
- renderer objects
- Canvas objects
- DOM objects

All canonical safety flags remain false:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Safari implication

Real Safari verification can now inspect whether:

- `moveend`
- `zoomend`
- `resize`

are being received and forwarded by the live-event adapter without changing the adapter’s behavior.

