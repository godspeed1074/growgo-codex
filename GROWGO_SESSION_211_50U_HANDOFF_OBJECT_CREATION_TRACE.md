GROWGO SESSION 211.50u — Handoff Object Creation Boundary Trace

Date: Tuesday, August 4, 2026
Branch: feature/atlas-phase-211-6-gated-map-attachment-controller

Goal

Identify the exact boundary between:

- successful snapshot callback resolution
- successful draw callback resolution
- actual handoff object creation for snapshot invocation

Current confirmed Safari state entering this phase

Pass:

- `commandBridgePassed = true`
- `adapterEntryBridgeReceived = true`
- `adapterEntryRawLeafletMapReference = true`
- `snapshotCallbackExists = true`
- `snapshotCallbackCallable = true`
- `drawCallbackExists = true`
- `drawCallbackCallable = true`
- `stackOverflowDetected = false`
- `totalExceptionCount = 0`

Fail:

- `handoffObjectCreated = false`
- `handoffObjectHasCanvas = false`
- `handoffObjectHasMap = false`

Current observed last calls

- `adapter.resolveFrameSnapshotBridge`
- `adapter.resolveFrameSnapshotBridge`
- `adapter.resolveDrawBridge`
- `adapter.resolveDrawBridge`

What this phase traces

Only the adapter seam after callback resolution and before snapshot invocation:

- handoff creation attempt
- handoff creation success or failure
- exact adapter function responsible
- required input presence:
  - map
  - canvas
  - snapshot callback
  - draw callback
  - viewport data
- created handoff object field presence:
  - map
  - canvas
  - frame snapshot
  - viewport data
  - callbacks

Developer-only diagnostics used

Reuse the existing pre-snapshot handoff diagnostics namespace:

- `resetCustom25DOneFramePreSnapshotHandoffTrace(reasonCode)`
- `getCustom25DOneFramePreSnapshotHandoffTrace()`

Trace payload additions for this phase

- `handoffCreationAttempted`
- `handoffCreationSucceeded`
- `handoffCreationFailureReason`
- `handoffCreationFunction`
- `handoffRequiredMapPresent`
- `handoffRequiredCanvasPresent`
- `handoffRequiredSnapshotCallbackPresent`
- `handoffRequiredDrawCallbackPresent`
- `handoffViewportDataPresent`
- `handoffObjectHasFrameSnapshot`
- `handoffObjectHasViewportData`
- `handoffObjectHasCallbacks`

Manual Safari procedure

Open:

[http://127.0.0.1:8000](http://127.0.0.1:8000)

1. Hard reload the page.
2. Wait for the Leaflet map to initialize.
3. Reset the pre-snapshot handoff trace:

```js
window.GrowGoDeveloperDiagnostics
  .resetCustom25DOneFramePreSnapshotHandoffTrace("PHASE_211_50U_PREP")
```

4. Run the real one-frame command once.
5. Immediately capture:

```js
window.GrowGoDeveloperDiagnostics
  .getCustom25DOneFramePreSnapshotHandoffTrace()
```

Required Safari evidence to preserve

- full command result
- `handoffCreationAttempted`
- `handoffCreationSucceeded`
- `handoffCreationFailureReason`
- `handoffCreationFunction`
- `handoffRequiredMapPresent`
- `handoffRequiredCanvasPresent`
- `handoffRequiredSnapshotCallbackPresent`
- `handoffRequiredDrawCallbackPresent`
- `handoffViewportDataPresent`
- `handoffObjectCreated`
- `handoffObjectHasMap`
- `handoffObjectHasCanvas`
- `handoffObjectHasFrameSnapshot`
- `handoffObjectHasViewportData`
- `handoffObjectHasCallbacks`
- `lastFailedFunctionName`
- `previousFunctionNameBeforeFailure`
- last 100 calls

Designed to answer

- was handoff creation ever attempted?
- did the adapter decide it had enough inputs to build the handoff object?
- which exact adapter function owns that decision?
- if creation was skipped, what failure reason was recorded?

Classification target

- `HANDOFF_OBJECT_CREATION_FAILURE_IDENTIFIED`
