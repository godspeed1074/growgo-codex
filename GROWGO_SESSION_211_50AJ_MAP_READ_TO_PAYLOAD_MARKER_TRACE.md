# GrowGo Session 211.50aj — Map Read To Payload Marker Trace

Date: 2026-08-05
Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
Phase: `211.50aj`
Classification: `POST_MAP_READ_CONTINUATION_IDENTIFIED`

## Goal

Trace the exact continuation after prepared-surface map read completes and before the payload-entry marker is written.

## What this phase traces

After `preparedSurface.surface.map` is read successfully, the adapter now traces:

1. prepared-surface payload local creation
2. prepared-surface map local assignment
3. prepared-surface canvas local assignment
4. prepared-surface owner local assignment
5. prepared-surface validity gate
6. `currentRefs.surface` assignment
7. surface-preparation completion milestones
8. `surfacePrepared` status write
9. lifecycle translation
10. lifecycle registration state derivation
11. lifecycle translation gate
12. `lifecycleRegistered` status write
13. snapshot-compatible map normalization
14. payload-entry trace mutation
15. payload-entry marker write

## Added developer-only identity fields

- `postPreparedSurfaceMapReadContinuationEntered`
- `postPreparedSurfaceMapReadNextFunction`
- `preparedSurfacePayloadLocalCreationAttempted`
- `preparedSurfacePayloadLocalCreationCompleted`
- `preparedSurfacePayloadLocalType`
- `preparedSurfaceMapLocalAssignmentAttempted`
- `preparedSurfaceMapLocalAssignmentCompleted`
- `preparedSurfaceCanvasLocalAssignmentAttempted`
- `preparedSurfaceCanvasLocalAssignmentCompleted`
- `preparedSurfaceOwnerLocalAssignmentAttempted`
- `preparedSurfaceOwnerLocalAssignmentCompleted`
- `payloadEntryTraceMutationAttempted`
- `payloadEntryTraceMutationCompleted`
- `postMapReadLastCompletedStatement`
- `postMapReadNextExpectedStatement`
- `postMapReadFailureFunction`
- `postMapReadExceptionName`
- `postMapReadExceptionMessage`
- `postMapReadExceptionReasonCode`
- `postMapReadObjectSpreadInvoked`
- `postMapReadStructuredCloneInvoked`
- `postMapReadObjectFreezeInvoked`
- `postMapReadJsonSerializationInvoked`
- `postMapReadPropertyEnumerationInvoked`
- `postMapReadGetterInvoked`
- `postMapReadSetterInvoked`
- `postMapReadProxyTrapInvoked`
- `postMapReadRecursiveCallbackInvoked`
- `postMapReadDiagnosticsLookupInvoked`

## Key finding

The gap between map read and payload-entry marker is not empty. It still includes:

- lifecycle translation
- lifecycle registration bookkeeping
- snapshot-compatible map normalization
- trace/status mutation immediately before the payload-entry marker

That makes the trace/status mutation seam a valid candidate boundary for Safari-only failures even when all prepared-surface reads succeed.

## Browser-shaped regression coverage

Focused tests now prove:

- map read completes
- the following statements are traced individually
- simulated complex-object-spread-style failure identifies the exact pre-marker seam
- simulated trace/status-mutation failure identifies the same exact boundary
- normal path writes the payload-entry marker
- normal path enters payload-context construction
- no behavior or visual output changes
- all four canonical safety flags remain false

## Outcome

The runtime can now distinguish:

- `BLOCKED_BY_PAYLOAD_LOCAL_CREATION`
- `BLOCKED_BY_COMPLEX_OBJECT_SPREAD`
- `BLOCKED_BY_TRACE_STATUS_MUTATION`
- `BLOCKED_BY_PAYLOAD_ENTRY_MARKER_WRITE`
