GROWGO SESSION 211.50t — Pre-Snapshot Handoff Failure Boundary

Date: Tuesday, August 4, 2026
Branch: feature/atlas-phase-211-6-gated-map-attachment-controller

Goal

Identify the exact failure boundary between:

- `surfacePrepared = true`
- snapshot callback invocation

Current confirmed Safari state entering this phase

Pass:

- `commandBridgeAvailable = true`
- `adapterBridgeAvailable = true`
- `adapterReceivedBridge = true`
- `hasRawLeafletMapReference = true`
- `mapValidationResult = present`
- `surfacePreparationInputReady = true`
- `surfacePrepared = true`

Fail:

- `frameSnapshotCreated = false`
- `reasonCode = MAXIMUM_CALL_STACK_SIZE_EXCEEDED`

Previous handoff trace conclusion

The snapshot handoff trace did not enter:

- `createCustom25DFrameViewportSnapshotForOneFrame`
- `createCustom25DFrameViewportSnapshotPrivateImplementation`
- `createCustom25DFrameViewportSnapshot`

That means the failure occurs before snapshot invocation begins.

What this phase traces

Only the narrow pre-snapshot gap:

- adapter entry bridge receipt
- snapshot callback resolution
- draw callback resolution
- handoff object creation
- snapshot callback invocation boundary

Developer-only diagnostics

Expose through the command diagnostics namespace:

- `resetCustom25DOneFramePreSnapshotHandoffTrace(reasonCode)`
- `getCustom25DOneFramePreSnapshotHandoffTrace()`

Trace payload includes

- `lastFailedFunctionName`
- `previousFunctionNameBeforeFailure`
- `lastExceptionName`
- `lastExceptionMessage`
- `lastExceptionReasonCode`
- `stackOverflowDetected`
- `commandBridgePassed`
- `commandBridgeSource`
- `commandHasRawLeafletMapReference`
- `adapterEntryBridgeReceived`
- `adapterEntryBridgeSource`
- `adapterEntryRawLeafletMapReference`
- `snapshotCallbackExists`
- `snapshotCallbackCallable`
- `drawCallbackExists`
- `drawCallbackCallable`
- `handoffObjectCreated`
- `handoffObjectHasMap`
- `handoffObjectHasCanvas`
- last 100 calls

Manual Safari procedure

Open:

[http://127.0.0.1:8000](http://127.0.0.1:8000)

1. Hard reload the page.
2. Wait for the Leaflet map to initialize.
3. Reset the pre-snapshot handoff trace:

```js
window.GrowGoDeveloperDiagnostics
  .resetCustom25DOneFramePreSnapshotHandoffTrace("PHASE_211_50T_PREP")
```

4. Run the real one-frame command once.
5. Immediately capture:

```js
window.GrowGoDeveloperDiagnostics
  .getCustom25DOneFramePreSnapshotHandoffTrace()
```

Required Safari evidence to preserve

- full command result
- `lastFailedFunctionName`
- `previousFunctionNameBeforeFailure`
- `lastExceptionName`
- `lastExceptionMessage`
- `lastExceptionReasonCode`
- `commandBridgePassed`
- `commandBridgeSource`
- `commandHasRawLeafletMapReference`
- `adapterEntryBridgeReceived`
- `adapterEntryBridgeSource`
- `adapterEntryRawLeafletMapReference`
- `snapshotCallbackExists`
- `snapshotCallbackCallable`
- `drawCallbackExists`
- `drawCallbackCallable`
- `handoffObjectCreated`
- `handoffObjectHasMap`
- `handoffObjectHasCanvas`
- last 100 calls

Designed to answer

- what is the last function before failure?
- what was the previous function before failure?
- did the snapshot callback exist?
- was the snapshot callback callable?

Classification

- `PRE_SNAPSHOT_HANDOFF_FAILURE_IDENTIFIED`
