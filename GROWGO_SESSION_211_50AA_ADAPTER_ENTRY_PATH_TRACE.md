GROWGO SESSION 211.50aa — Adapter Entry Path Trace

Date: Tuesday, August 4, 2026
Branch: feature/atlas-phase-211-6-gated-map-attachment-controller

Goal

Identify the exact branch between adapter entry and callback instrumentation.

Current confirmed Safari state entering this phase

Confirmed:

- `adapterExecuteFunctionName = executeDeveloperOnlyLiveOneFrameAdapter`
- `adapterExecuteFunctionSourceTag = client/developer-only-growgo-custom25d-live-one-frame-adapter.mjs?v=atlas21150x`
- `activeAdapterFunctionReferenceMatchesInstrumentedModuleExport = true`

But after a real command run:

- `postCallbackInstrumentationWrapperEntered = false`
- `payloadAssemblyInstrumentationEntered = false`

Previous live trace still showed:

- `adapter.resolveFrameSnapshotBridge`
- `adapter.resolveDrawBridge`

What this phase traces

Only the path from adapter entry through the last branch before callback instrumentation:

- `adapterEntryReached`
- `adapterEntryFunctionName`
- `adapterEntryReturnPath`
- `adapterEarlyReturnReason`
- `nextFunctionAfterAdapterEntry`
- `bridgeResolutionStarted`
- `snapshotBridgeResolutionStarted`
- `drawBridgeResolutionStarted`

Designed to answer

- did the live command reach the instrumented adapter execute entry?
- what exact function came next after entry?
- did bridge resolution start?
- did snapshot bridge resolution start?
- did draw bridge resolution start?
- what exact return path or reason happened before callback instrumentation?

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
- `adapterEntryReached`
- `adapterEntryFunctionName`
- `adapterEntryReturnPath`
- `adapterEarlyReturnReason`
- `nextFunctionAfterAdapterEntry`
- `bridgeResolutionStarted`
- `snapshotBridgeResolutionStarted`
- `drawBridgeResolutionStarted`
- `postCallbackInstrumentationWrapperEntered`
- `payloadAssemblyInstrumentationEntered`

Classification target

- `ADAPTER_ENTRY_PATH_BEFORE_CALLBACK_INSTRUMENTATION_IDENTIFIED`
