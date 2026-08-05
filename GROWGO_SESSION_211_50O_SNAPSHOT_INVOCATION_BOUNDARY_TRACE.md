GROWGO SESSION 211.50o — Trace Snapshot Invocation Boundary

Date: Tuesday, August 4, 2026
Branch: feature/atlas-phase-211-6-gated-map-attachment-controller

Goal

Find the exact outer handoff function that fails immediately before:

- `frameSnapshotCreated = false`
- `reasonCode = MAXIMUM_CALL_STACK_SIZE_EXCEEDED`

Context entering this phase

Latest real Safari evidence shows:

- `adapterInvoked = true`
- `surfacePrepared = true`
- `frameSnapshotCreated = false`
- `reasonCode = MAXIMUM_CALL_STACK_SIZE_EXCEEDED`

Previous phase 211.50n proved the stack overflow happens before the snapshot implementation itself begins:

- snapshot boundary trace:
  - `totalEntryCount = 0`
  - `totalExitCount = 0`
  - `stackOverflowDetected = false`
- not reached:
  - snapshot validation
  - `map.getSize()`
  - `map.getBounds()`
  - north-west conversion
  - `latLngToLayerPoint()`
  - device-pixel-ratio read

Conclusion

The failure is now believed to occur in the outer handoff boundary before
`createCustom25DFrameViewportSnapshotForOneFrame` actually starts.

What was instrumented

Developer-only invocation-boundary tracing was added around the outer handoff path:

- `runAuthorizedAtlasCustom25DOneFrame`
- command → adapter invocation
- `executeDeveloperOnlyLiveOneFrameAdapter`
- surface ownership conversion
- snapshot bridge provider resolution
- snapshot-compatible map normalization
- surface bundle → snapshot argument construction
- snapshot bridge invocation

Exact trace markers:

- `command.adapter.executeDeveloperOnlyLiveOneFrameAdapter`
- `adapter.translatePreparedSurfaceToLifecycleBundle`
- `adapter.resolveFrameSnapshotBridge`
- `adapter.resolveSnapshotCompatibleMap`
- `adapter.createSnapshotBridgeInput`
- `adapter.invokeFrameSnapshotBridge`

Developer-only trace surface

Reset before the test:

```js
window.GrowGoDeveloperDiagnostics
  .resetCustom25DOneFrameInvocationBoundaryTrace("PHASE_211_50O_PREP")
```

Read after failure:

```js
window.GrowGoDeveloperDiagnostics
  .getCustom25DOneFrameInvocationBoundaryTrace()
```

Compatibility aliases remain available:

- `resetAtlasCustom25DOneFrameInvocationBoundaryTrace(reasonCode)`
- `getAtlasCustom25DOneFrameInvocationBoundaryTrace()`

Expected trace payload fields

- `schemaId`
- `currentDepth`
- `maxObservedDepth`
- `last100FunctionNames`
- `last100Calls`
- `totalEntryCount`
- `totalExitCount`
- `totalExceptionCount`
- `lastFailedFunctionName`
- `previousFunctionNameBeforeFailure`
- `lastExceptionName`
- `lastExceptionMessage`
- `lastExceptionReasonCode`
- `stackOverflowDetected`
- `reachedRunAuthorizedAtlasCustom25DOneFrame`
- `reachedAdapterExecutePath`
- `reachedSurfacePrepared`
- `reachedSurfaceOwnershipConversion`
- `reachedSnapshotBridgeProvider`
- `reachedSnapshotMapNormalization`
- `reachedSnapshotArgumentConstruction`
- `reachedSnapshotBridgeInvocation`
- `reachedCreateCustom25DFrameViewportSnapshotCaller`

What this phase is designed to answer

Does execution reach the caller of `createCustom25DFrameViewportSnapshotForOneFrame` at all?

If not, does Safari fail while:

- calling the bridge provider
- constructing snapshot arguments
- resolving adapter references
- converting prepared surface ownership
- invoking the bridge function itself

Manual Safari procedure

Open:

[http://127.0.0.1:8000](http://127.0.0.1:8000)

1. Hard reload the page.
2. Wait for the Leaflet map to initialize.
3. Reset the invocation-boundary trace:

```js
window.GrowGoDeveloperDiagnostics
  .resetCustom25DOneFrameInvocationBoundaryTrace("PHASE_211_50O_PREP")
```

4. Run the already-authorized manual one-frame command.
5. Immediately after failure, capture:

```js
window.GrowGoDeveloperDiagnostics
  .getCustom25DOneFrameInvocationBoundaryTrace()
```

Required evidence to preserve

- full command result
- `lastFailedFunctionName`
- `previousFunctionNameBeforeFailure`
- `lastExceptionReasonCode`
- `lastExceptionMessage`
- `stackOverflowDetected`
- `reachedSurfacePrepared`
- `reachedSurfaceOwnershipConversion`
- `reachedSnapshotBridgeProvider`
- `reachedSnapshotMapNormalization`
- `reachedSnapshotArgumentConstruction`
- `reachedSnapshotBridgeInvocation`
- `reachedCreateCustom25DFrameViewportSnapshotCaller`
- last 100 calls

Local verification target

Focused tests should confirm:

- namespace exposure of invocation-boundary trace helpers
- source-lock of command and adapter handoff markers
- manual evidence procedure completeness

What this phase does not claim

This phase does not change snapshot implementation, draw, lifecycle, cleanup, or authorization.
It only traces the outer invocation boundary needed to identify the exact pre-snapshot failure function.
