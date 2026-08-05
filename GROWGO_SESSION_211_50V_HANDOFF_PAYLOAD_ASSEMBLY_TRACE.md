GROWGO SESSION 211.50v — Handoff Payload Assembly Trace

Date: Tuesday, August 4, 2026
Branch: feature/atlas-phase-211-6-gated-map-attachment-controller

Goal

Identify the exact payload-assembly boundary between:

- surface preparation already completed
- callbacks already resolved
- handoff object creation still not reached

Current confirmed Safari state entering this phase

Pass:

- `commandBridgePassed = true`
- `adapterEntryBridgeReceived = true`
- `adapterEntryRawLeafletMapReference = true`
- `snapshotCallbackExists = true`
- `snapshotCallbackCallable = true`
- `drawCallbackExists = true`
- `drawCallbackCallable = true`

Fail:

- `handoffObjectCreated = false`
- `lastExceptionName = null`
- `lastExceptionMessage = null`
- `totalExceptionCount = 0`

Current observed last calls

- `adapter.resolveFrameSnapshotBridge`
- `adapter.resolveFrameSnapshotBridge`
- `adapter.resolveDrawBridge`
- `adapter.resolveDrawBridge`

What this phase traces

Only the handoff payload assembly stage inside:

- `client/developer-only-growgo-custom25d-live-one-frame-adapter.mjs`

Trace payload additions

- `handoffPayloadAssemblyStarted`
- `handoffPayloadAssemblyFunction`
- `surfaceInputPresent`
- `surfaceInputHasCanvas`
- `surfaceInputHasMap`
- `surfaceInputHasViewport`
- `handoffMapAssigned`
- `handoffCanvasAssigned`
- `handoffViewportAssigned`
- `handoffSnapshotCallbackAssigned`
- `handoffDrawCallbackAssigned`
- `handoffCreationBranchEntered`
- `handoffCreationSkippedReason`
- `handoffCreationAttempted`
- `handoffCreationSucceeded`

What this phase is designed to answer

- did payload assembly actually begin?
- did surface input reach the adapter with a canvas?
- did the adapter assign map/canvas/viewport/callback references?
- did the adapter enter the handoff creation branch?
- if creation was skipped, what exact condition caused the skip?

Developer-only diagnostics used

Reuse the existing pre-snapshot handoff diagnostics namespace:

- `resetCustom25DOneFramePreSnapshotHandoffTrace(reasonCode)`
- `getCustom25DOneFramePreSnapshotHandoffTrace()`

Manual Safari procedure

Open:

[http://127.0.0.1:8000](http://127.0.0.1:8000)

1. Hard reload the page.
2. Wait for the Leaflet map to initialize.
3. Reset the pre-snapshot trace:

```js
window.GrowGoDeveloperDiagnostics
  .resetCustom25DOneFramePreSnapshotHandoffTrace("PHASE_211_50V_PREP")
```

4. Run the real one-frame command once.
5. Immediately capture:

```js
window.GrowGoDeveloperDiagnostics
  .getCustom25DOneFramePreSnapshotHandoffTrace()
```

Required Safari evidence to preserve

- full command result
- `handoffPayloadAssemblyStarted`
- `handoffPayloadAssemblyFunction`
- `surfaceInputPresent`
- `surfaceInputHasCanvas`
- `surfaceInputHasMap`
- `surfaceInputHasViewport`
- `handoffMapAssigned`
- `handoffCanvasAssigned`
- `handoffViewportAssigned`
- `handoffSnapshotCallbackAssigned`
- `handoffDrawCallbackAssigned`
- `handoffCreationBranchEntered`
- `handoffCreationSkippedReason`
- `handoffCreationAttempted`
- `handoffCreationSucceeded`
- `handoffObjectCreated`
- `lastFailedFunctionName`
- `previousFunctionNameBeforeFailure`
- last 100 calls

Classification target

- `HANDOFF_PAYLOAD_ASSEMBLY_FAILURE_IDENTIFIED`
