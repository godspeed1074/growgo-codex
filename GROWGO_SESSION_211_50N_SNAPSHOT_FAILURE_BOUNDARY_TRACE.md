GROWGO SESSION 211.50n — Instrument Snapshot Creation Failure Boundary

Date: Monday, August 3, 2026
Branch: feature/atlas-phase-211-6-gated-map-attachment-controller

Goal

Capture the exact function boundary that throws `MAXIMUM_CALL_STACK_SIZE_EXCEEDED` during live Safari snapshot creation, without assuming recursion and without changing bridge, authorization, cleanup, lifecycle, or draw behavior.

Current Safari evidence entering this phase

- command result:
  - `outcome = failed_closed`
  - `reasonCode = MAXIMUM_CALL_STACK_SIZE_EXCEEDED`
- command status:
  - `adapterInvoked = true`
  - `surfacePrepared = true`
  - `frameSnapshotCreated = false`
  - `drawAttemptCount = 0`
  - `cleanupCompleted = true`
  - `referencesReleased = true`
- current execution trace:
  - `recursionDetected = false`
  - `repeatedCallChain = []`
- recent trace markers:
  - `rawLeafletMapProvider`
  - `getGrowGoMap`
  - `rawLeafletMapProvider`
  - `getGrowGoMap`

Conclusion entering this phase

The earlier `getGrowGoMap` infinite recursion is no longer the active failure.
The remaining stack overflow occurs after surface preparation and before `frameSnapshotCreated`.

What was instrumented

Developer-only snapshot-boundary tracing was added around the exact live snapshot path in `script.js`:

- `createCustom25DFrameViewportSnapshotForOneFrame`
- `createCustom25DFrameViewportSnapshotPrivateImplementation`
- `createCustom25DFrameViewportSnapshot`
- `snapshot.validation`
- `snapshot.map.getSize`
- `snapshot.map.getBounds`
- `snapshot.bounds.getNorthWest`
- `snapshot.map.latLngToLayerPoint`
- `snapshot.window.devicePixelRatio`
- `snapshot.validation.result`

Important current-path note

`createCustom25DFrameRootViewportSnapshot` is not present in the current live path.
That absence is now recorded directly in the trace payload as:

- `createCustom25DFrameRootViewportSnapshotPresent: false`

Developer-only trace surface

Before the manual Safari retest, use:

```js
window.GrowGoDeveloperDiagnostics
  .resetCustom25DOneFrameSnapshotBoundaryTrace("PHASE_211_50N_PREP")
```

After the failure, inspect:

```js
window.GrowGoDeveloperDiagnostics
  .getCustom25DOneFrameSnapshotBoundaryTrace()
```

Expected trace payload fields

- `schemaId`
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
- `reachedSnapshotValidation`
- `reachedMapGetSize`
- `reachedMapGetBounds`
- `reachedNorthWestConversion`
- `reachedLatLngToLayerPoint`
- `reachedDevicePixelRatioRead`
- `createCustom25DFrameRootViewportSnapshotPresent`

What this phase is designed to answer

The trace should tell us:

1. The exact function immediately failing when Safari throws.
2. The function immediately before that failure.
3. Whether the overflow happens:
   - before or after `map.getSize()`
   - before or after `map.getBounds()`
   - before or after north-west conversion
   - before or after `latLngToLayerPoint()`
   - before or after the device-pixel-ratio read
4. Whether this is a real stack overflow without a recursive repeated-call pattern.

Manual Safari procedure

Open:

[http://127.0.0.1:8000](http://127.0.0.1:8000)

1. Hard reload the page.
2. Wait for the Leaflet map to initialize.
3. Reset the snapshot boundary trace:

```js
window.GrowGoDeveloperDiagnostics
  .resetCustom25DOneFrameSnapshotBoundaryTrace("PHASE_211_50N_PREP")
```

4. Optionally confirm the trace is empty/idle:

```js
window.GrowGoDeveloperDiagnostics
  .getCustom25DOneFrameSnapshotBoundaryTrace()
```

5. Run the already-authorized manual one-frame command in Safari.
6. Immediately after failure, capture:

```js
window.GrowGoDeveloperDiagnostics
  .getCustom25DOneFrameSnapshotBoundaryTrace()
```

Required evidence to preserve

- full command result
- `lastFailedFunctionName`
- `previousFunctionNameBeforeFailure`
- `lastExceptionReasonCode`
- `lastExceptionMessage`
- `stackOverflowDetected`
- `reachedMapGetSize`
- `reachedMapGetBounds`
- `reachedNorthWestConversion`
- `reachedLatLngToLayerPoint`
- `reachedDevicePixelRatioRead`
- last 100 calls

Local verification completed

Focused local coverage added for:

- namespace exposure of snapshot-boundary trace helpers
- exact instrumented snapshot markers in `script.js`
- evidence document procedure completeness

What this phase does not claim

This phase does not claim the live Safari issue is fixed.
It only instruments the exact boundary needed to identify the real snapshot failure function.
