# GrowGo Session 211.50ag — Payload Guard Trace

Date: 2026-08-04
Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
Phase: `211.50ag`
Classification: `PAYLOAD_GUARD_BOUNDARY_IDENTIFIED`

## Goal

Trace only the seam from payload assembly entry to payload guard evaluation and the first post-guard handoff step.

This phase does not modify:

- bridge
- map
- draw
- snapshot
- lifecycle
- authorization
- cleanup

## Confirmed starting point

Before this phase, browser-shaped and Safari evidence already showed:

- `prepareOneFrameSurface` returned
- prepared-surface assignment completed
- prepared-surface property reads completed
- payload assembly entry was attempted and completed

Remaining unknown:

- whether payload context creation completes
- whether payload guard evaluation completes
- whether the runtime reaches handoff creation after the guard

## Added execution identity fields

- `payloadAssemblyEntryFunction`
- `payloadAssemblyContextCreationAttempted`
- `payloadAssemblyContextCreationCompleted`
- `payloadGuardEvaluationAttempted`
- `payloadGuardEvaluationCompleted`
- `payloadGuardResult`
- `payloadGuardFailureReason`
- `payloadContextHasMap`
- `payloadContextHasCanvas`
- `payloadContextHasViewport`
- `payloadContextHasDrawOperation`
- `payloadContextHasCallbacks`
- `handoffCreationAfterGuardAttempted`
- `handoffCreationAfterGuardCompleted`
- `payloadAssemblyNextFunction`
- `payloadAssemblyLastCompletedStep`
- `payloadAssemblyFailureFunction`
- `payloadAssemblyExceptionName`
- `payloadAssemblyExceptionMessage`
- `payloadAssemblyExceptionReasonCode`
- `payloadAssemblyGetterInvoked`
- `payloadAssemblyProxyTrapInvoked`
- `payloadAssemblyRecursiveCallbackInvoked`
- `payloadAssemblyDiagnosticsLookupInvoked`

## Exact seam now traced

1. payload assembly entry function recorded
2. payload context creation attempted
3. payload context creation completed
4. payload guard evaluation attempted
5. payload guard evaluation completed
6. payload guard result recorded
7. handoff creation after guard attempted
8. handoff creation after guard completed or skipped

## What the trace now distinguishes

- `BLOCKED_BY_PAYLOAD_CONTEXT_CREATION`
- `BLOCKED_BY_PAYLOAD_GUARD`
- `BLOCKED_AFTER_PAYLOAD_GUARD_BEFORE_HANDOFF`
- successful continuation into handoff creation

## Browser-shaped coverage

Focused tests now prove:

- normal payload context creation completes
- normal payload guard evaluation completes
- normal payload context fields are populated
- normal path reaches handoff creation after the guard
- guard-blocked path records explicit failure reason and skip boundary
- earlier prepared-surface getter failure still stops before payload context creation
- no renderer visual behavior changed
- no lifecycle policy changed
- all four canonical safety flags remain false

## Next step

Collect the next real Safari trace and compare:

- whether payload context creation is reached
- whether payload guard evaluation completes
- whether handoff creation after the guard begins
