GROWGO SESSION 211.50x — Trace Adapter Return Path After Callback Resolution

Date: Tuesday, August 4, 2026
Branch: feature/atlas-phase-211-6-gated-map-attachment-controller

Goal

Identify the exact adapter branch that exits after callback resolution and before payload assembly begins.

Current confirmed Safari state entering this phase

Pass:

- `commandBridgePassed = true`
- `adapterEntryBridgeReceived = true`
- `adapterEntryRawLeafletMapReference = true`
- `snapshotCallbackExists = true`
- `snapshotCallbackCallable = true`
- `drawCallbackExists = true`
- `drawCallbackCallable = true`

Still failing:

- `handoffObjectCreated = false`
- payload assembly not reached
- `lastExceptionName = null`
- `totalExceptionCount = 0`

Current observed last calls

- `adapter.resolveFrameSnapshotBridge`
- `adapter.resolveFrameSnapshotBridge`
- `adapter.resolveDrawBridge`
- `adapter.resolveDrawBridge`

What this phase traces

Only the adapter return seam after callback resolution:

- next step after callback resolution
- early return reason
- execution completion reason
- whether execution reaches:
  - payload assembly
  - handoff creation
  - snapshot invocation

Trace payload additions

- `adapterPostCallbackResolutionNextStep`
- `adapterEarlyReturnReason`
- `adapterExecutionCompletionReason`

Designed to answer

- what exact branch is chosen immediately after callback resolution?
- if the adapter exits early, what exact reason does it return with?
- does execution ever reach payload assembly?
- does execution ever reach handoff creation?
- does execution ever reach snapshot invocation?

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
  .resetCustom25DOneFramePreSnapshotHandoffTrace("PHASE_211_50X_PREP")
```

4. Run the real one-frame command once.
5. Immediately capture:

```js
window.GrowGoDeveloperDiagnostics
  .getCustom25DOneFramePreSnapshotHandoffTrace()
```

Required Safari evidence to preserve

- full command result
- `adapterPostCallbackResolutionNextStep`
- `adapterEarlyReturnReason`
- `adapterExecutionCompletionReason`
- `payloadAssemblyEntryMarked`
- `handoffPayloadAssemblyStarted`
- `handoffObjectCreated`
- `lastFailedFunctionName`
- `previousFunctionNameBeforeFailure`
- last 100 calls

Classification target

- `ADAPTER_POST_CALLBACK_RETURN_BRANCH_IDENTIFIED`
