GROWGO SESSION 211.50ac — createDrawOperation Runtime Failure Trace

Date: Tuesday, August 4, 2026
Branch: feature/atlas-phase-211-6-gated-map-attachment-controller

Goal

Identify the exact runtime failure inside `adapter.createDrawOperation` or its direct factory seam.

Current confirmed Safari state entering this phase

Pass:

- `activeAdapterFunctionReferenceMatchesInstrumentedModuleExport = true`
- `adapterEntryReached = true`
- `bridgeResolutionStarted = true`
- `snapshotBridgeResolutionStarted = true`
- `drawBridgeResolutionStarted = true`
- `postCallbackInstrumentationWrapperEntered = true`

Critical finding:

- `postCallbackWrapperNextFunction = "adapter.createDrawOperation"`

But still:

- `payloadAssemblyGuardEvaluated = false`
- `payloadAssemblyInstrumentationEntered = false`
- `payloadAssemblySkippedReason = null`
- `postCallbackWrapperExitReason = null`
- `adapterEarlyReturnReason = null`

What this phase traces

Only the `adapter.createDrawOperation` seam:

- entry
- factory availability/callability
- input presence
- returned operation
- failure reason
- exception name/message
- last direct function marker

Execution identity fields to capture

- `createDrawOperationEntered`
- `createDrawOperationFunctionName`
- `createDrawOperationFactoryAvailable`
- `createDrawOperationFactoryCallable`
- `createDrawOperationInputCanvasPresent`
- `createDrawOperationInputMapPresent`
- `createDrawOperationInputDrawCallbackPresent`
- `createDrawOperationReturned`
- `createDrawOperationResultType`
- `createDrawOperationFailureReason`
- `createDrawOperationLastFunction`
- `createDrawOperationPreviousFunction`
- `createDrawOperationExceptionName`
- `createDrawOperationExceptionMessage`
- `createDrawOperationExceptionReasonCode`

Developer-only diagnostics used

Open:

[http://127.0.0.1:8000](http://127.0.0.1:8000)

Capture before and after one real command run:

```js
window.GrowGoDeveloperDiagnostics
  .getCustom25DOneFrameAdapterExecutionIdentity()
```

Required Safari evidence to preserve

- full command result
- `createDrawOperationEntered`
- `createDrawOperationFunctionName`
- `createDrawOperationFactoryAvailable`
- `createDrawOperationFactoryCallable`
- `createDrawOperationInputCanvasPresent`
- `createDrawOperationInputMapPresent`
- `createDrawOperationInputDrawCallbackPresent`
- `createDrawOperationReturned`
- `createDrawOperationResultType`
- `createDrawOperationFailureReason`
- `createDrawOperationLastFunction`
- `createDrawOperationPreviousFunction`
- `createDrawOperationExceptionName`
- `createDrawOperationExceptionMessage`
- `createDrawOperationExceptionReasonCode`

Classification target

- `CREATE_DRAW_OPERATION_FAILURE_IDENTIFIED`
