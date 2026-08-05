GROWGO SESSION 211.50w — Payload Assembly Not Reached Trace

Date: Tuesday, August 4, 2026
Branch: feature/atlas-phase-211-6-gated-map-attachment-controller

Goal

Identify the exact branch after callback resolution that returns before payload assembly begins.

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
- `lastExceptionName = null`
- `totalExceptionCount = 0`

Current observed last calls

- `adapter.resolveFrameSnapshotBridge`
- `adapter.resolveFrameSnapshotBridge`
- `adapter.resolveDrawBridge`
- `adapter.resolveDrawBridge`

What this phase traces

Only the branch immediately after callback resolution:

- next function after draw bridge resolution
- whether payload assembly entry was ever reached
- exact branch reason if execution returns earlier
- exact adapter return reason if execution exits earlier

Trace payload additions

- `payloadAssemblyEntryMarked`
- `payloadAssemblyEntryFunction`
- `payloadAssemblyNotReachedBranchReason`
- `payloadAssemblyNotReachedReturnReason`
- `postDrawBridgeNextFunction`

Designed to answer

- does the adapter stop at draw operation creation?
- does it stop at surface preparation?
- does it stop at lifecycle translation?
- does it stop at snapshot map normalization?
- does it ever reach the payload assembly entry marker?

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
  .resetCustom25DOneFramePreSnapshotHandoffTrace("PHASE_211_50W_PREP")
```

4. Run the real one-frame command once.
5. Immediately capture:

```js
window.GrowGoDeveloperDiagnostics
  .getCustom25DOneFramePreSnapshotHandoffTrace()
```

Required Safari evidence to preserve

- full command result
- `payloadAssemblyEntryMarked`
- `payloadAssemblyEntryFunction`
- `payloadAssemblyNotReachedBranchReason`
- `payloadAssemblyNotReachedReturnReason`
- `postDrawBridgeNextFunction`
- `handoffPayloadAssemblyStarted`
- `handoffObjectCreated`
- `lastFailedFunctionName`
- `previousFunctionNameBeforeFailure`
- last 100 calls

Classification target

- `PAYLOAD_ASSEMBLY_NOT_REACHED_BRANCH_IDENTIFIED`
