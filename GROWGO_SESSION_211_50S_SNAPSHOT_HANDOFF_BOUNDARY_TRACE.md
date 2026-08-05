GROWGO SESSION 211.50s — Snapshot Handoff Boundary Trace

Date: Tuesday, August 4, 2026
Branch: feature/atlas-phase-211-6-gated-map-attachment-controller

Goal

Trace the exact boundary between:

- surface preparation completed
- snapshot handoff invoked
- snapshot result returned
- `frameSnapshotCreated` assigned

Current confirmed Safari state entering this phase

Pass:

- `commandBridgeAvailable = true`
- `adapterBridgeAvailable = true`
- `adapterReceivedBridge = true`
- `adapterBridgeResolutionFunction = adapter.resolveInjectedRuntimeOneFrameBridge`
- `hasBridge = true`
- `hasRawLeafletMapReference = true`
- `mapValidationResult = present`
- `surfacePreparationInputReady = true`
- `surfacePrepared = true`

Remaining failure:

- `reasonCode = MAXIMUM_CALL_STACK_SIZE_EXCEEDED`
- `frameSnapshotCreated = false`
- `drawAttemptCount = 0`
- `completedFrameCount = 0`

What this phase traces

Only the narrow snapshot handoff lane:

1. surface preparation completion
2. snapshot handoff call
3. `createCustom25DFrameViewportSnapshotForOneFrame`
4. `createCustom25DFrameViewportSnapshotPrivateImplementation`
5. `createCustom25DFrameViewportSnapshot`
6. snapshot return
7. `frameSnapshotCreated` assignment

Developer-only diagnostics added

- `resetCustom25DOneFrameSnapshotHandoffTrace(reasonCode)`
- `getCustom25DOneFrameSnapshotHandoffTrace()`

Trace payload includes

- `currentDepth`
- `maxObservedDepth`
- `last100Calls`
- `last100FunctionNames`
- `totalEntryCount`
- `totalExitCount`
- `totalExceptionCount`
- `lastFailedFunctionName`
- `previousFunctionNameBeforeFailure`
- `lastExceptionName`
- `lastExceptionMessage`
- `lastExceptionReasonCode`
- `stackOverflowDetected`
- `reachedSurfacePreparationCompletion`
- `reachedSnapshotHandoffCall`
- `reachedCreateCustom25DFrameViewportSnapshotForOneFrame`
- `reachedCreateCustom25DFrameViewportSnapshotPrivateImplementation`
- `reachedCreateCustom25DFrameViewportSnapshot`
- `reachedSnapshotReturn`
- `reachedFrameSnapshotCreatedAssignment`

Manual Safari procedure

Open:

[http://127.0.0.1:8000](http://127.0.0.1:8000)

1. Hard reload the page.
2. Wait for the Leaflet map to initialize.
3. Reset the snapshot handoff trace:

```js
window.GrowGoDeveloperDiagnostics
  .resetCustom25DOneFrameSnapshotHandoffTrace("PHASE_211_50S_PREP")
```

4. Run the real one-frame command once.
5. Immediately capture:

```js
window.GrowGoDeveloperDiagnostics
  .getCustom25DOneFrameSnapshotHandoffTrace()
```

Required Safari evidence to preserve

- full command result
- `lastFailedFunctionName`
- `previousFunctionNameBeforeFailure`
- `lastExceptionName`
- `lastExceptionMessage`
- `lastExceptionReasonCode`
- `stackOverflowDetected`
- `reachedSurfacePreparationCompletion`
- `reachedSnapshotHandoffCall`
- `reachedCreateCustom25DFrameViewportSnapshotForOneFrame`
- `reachedCreateCustom25DFrameViewportSnapshotPrivateImplementation`
- `reachedCreateCustom25DFrameViewportSnapshot`
- `reachedSnapshotReturn`
- `reachedFrameSnapshotCreatedAssignment`
- last 100 calls

What this phase is designed to answer

A) Does execution enter `createCustom25DFrameViewportSnapshotForOneFrame`?

B) If yes, what is the last function before `MAXIMUM_CALL_STACK_SIZE_EXCEEDED`?

C) If no, what wrapper fails before snapshot invocation?

Classification

- `SNAPSHOT_HANDOFF_BOUNDARY_IDENTIFIED`
- `BLOCKED_BY_SNAPSHOT_HANDOFF_FAILURE`
