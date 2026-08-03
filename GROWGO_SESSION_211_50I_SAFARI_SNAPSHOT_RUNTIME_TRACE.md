# GrowGo Session 211.50i — Safari Snapshot Runtime Trace

## Goal

Prepare the real Safari snapshot runtime trace needed to capture the exact repeated call chain still causing:

- `outcome = failed_closed`
- `reasonCode = MAXIMUM_CALL_STACK_SIZE_EXCEEDED`
- `surfacePrepared = true`
- `frameSnapshotCreated = false`

This phase adds runtime tracing around the actual Safari snapshot path only.

This phase does **not** inspect or redesign:

- draw seam
- lifecycle owner
- cleanup
- authorization
- Canvas behavior

## Live Safari evidence entering this phase

Real Safari still reported:

- `adapterInvoked = true`
- `surfacePrepared = true`
- `authorizationConsumed = true`
- `frameSnapshotCreated = false`
- `drawAttemptCount = 0`
- `completedFrameCount = 0`
- `realDrawFunctionCalled = false`
- `cleanupCompleted = true`
- `referencesReleased = true`

## Runtime trace coverage added

The actual Safari runtime lane now records bounded trace entries for:

- `createCustom25DFrameViewportSnapshotForOneFrame`
- `createCustom25DFrameViewportSnapshotPrivateImplementation`
- `createCustom25DFrameViewportSnapshot`
- `defaultSnapshotMapNormalizer`
- `resolveSnapshotMapTarget`
- `normalizedSnapshotMap.getSize`
- `normalizedSnapshotMap.getBounds`
- `normalizedSnapshotMap.latLngToLayerPoint`
- `normalizedSnapshotMap.getZoom`
- `devicePixelRatioProvider`

Captured trace data includes:

- function entry
- function exit
- call depth
- repeat count
- last 50 calls

## New browser diagnostics helpers

Available on the live Safari page:

- `window.GrowGoDeveloperDiagnostics.resetAtlasCustom25DOneFrameExecutionTrace(reasonCode?)`
- `window.GrowGoDeveloperDiagnostics.getAtlasCustom25DOneFrameExecutionTrace()`

## Manual Safari trace procedure

Browser:

- `Safari`

Page:

- `http://127.0.0.1:8000`

### 1. Hard reload

Hard reload the page and wait for the Leaflet map to initialize.

### 2. Reset the runtime trace immediately before the one-frame attempt

```js
window.GrowGoDeveloperDiagnostics
  .resetAtlasCustom25DOneFrameExecutionTrace(
    "PHASE_211_50I_PRE_SAFARI_ONE_FRAME_RUNTIME_TRACE"
  )
```

### 3. Confirm trace helpers exist

```js
[
  typeof window.GrowGoDeveloperDiagnostics
    ?.resetAtlasCustom25DOneFrameExecutionTrace,
  typeof window.GrowGoDeveloperDiagnostics
    ?.getAtlasCustom25DOneFrameExecutionTrace
]
```

Expected:

```js
["function", "function"]
```

### 4. Run the normal approved Safari one-frame procedure

Use the same approved manual Safari authorization and one-frame execution flow already established for this branch.

Do **not** change:

- draw settings
- lifecycle settings
- authorization rules

### 5. Immediately capture the runtime trace after the failure

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasCustom25DOneFrameExecutionTrace()
```

### 6. Paste back the exact runtime trace object

Need the returned trace object exactly as Safari reports it, especially:

- `reasonCode`
- `recursionDetected`
- `overflowPrevented`
- `maxObservedDepth`
- `repeatedCallChain`
- `last50FunctionNames`
- `last50Calls`

## What the next Safari result should reveal

The trace should let us distinguish whether the remaining real Safari recursion is happening in:

- snapshot bridge entry
- normalized map adapter wrapping
- `getSize`
- `getBounds`
- `latLngToLayerPoint`
- `devicePixelRatioProvider`
- another helper called by snapshot creation

## Honest current state

This phase adds runtime tracing for the real Safari snapshot lane.

It does **not** yet contain the exact repeated Safari chain, because that requires one more genuine manual Safari run with the new trace helpers enabled.
