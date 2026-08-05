# GrowGo Session 211.50ae — Draw Operation To Surface Preparation Trace

Date: 2026-08-04
Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
Phase: `211.50ae`
Classification: `DRAW_OPERATION_CONTINUATION_IDENTIFIED`

## Goal

Trace the exact continuation after `adapter.createDrawOperation()` returns successfully and before payload assembly begins, without modifying:

- bridge behavior
- map acquisition
- snapshot implementation
- draw implementation
- authorization
- lifecycle policy
- cleanup ownership

## Confirmed starting point

Real Safari evidence already proved:

- the correct adapter module is executing
- the correct adapter execute function is executing
- bridge resolution starts
- snapshot bridge resolution starts
- draw bridge resolution starts
- the post-callback wrapper is entered
- `adapter.createDrawOperation()` succeeds and returns one object

Remaining live gap:

- payload assembly is not yet reached
- surface preparation path is not yet fully attributed statement-by-statement

## Direct continuation traced

The adapter now traces this exact continuation sequence after draw operation creation succeeds:

1. draw operation factory returned
2. drawOperation local variable assignment attempted
3. drawOperation local variable assignment completed
4. `currentRefs.map` assignment attempted
5. `currentRefs.map` assignment completed
6. `currentRefs.lifecycleOwner` assignment attempted
7. `currentRefs.lifecycleOwner` assignment completed
8. `currentRefs.drawOperation` assignment attempted
9. `currentRefs.drawOperation` assignment completed
10. `adapter.prepareOneFrameSurface` selected as the next function
11. `updateStatus({ surfacePreparationInputReady: true })` attempted
12. `updateStatus({ surfacePreparationInputReady: true })` completed
13. `surfaceOperations.prepareOneFrameSurface({ map })` attempted
14. `surfaceOperations.prepareOneFrameSurface({ map })` entered
15. `surfaceOperations.prepareOneFrameSurface({ map })` returned
16. payload assembly entry becomes the next expected step

## New developer-only trace fields

Added execution identity fields:

- `postDrawOperationContinuationEntered`
- `drawOperationLocalAssignmentAttempted`
- `drawOperationLocalAssignmentCompleted`
- `currentRefsMapAssignmentAttempted`
- `currentRefsMapAssignmentCompleted`
- `currentRefsLifecycleOwnerAssignmentAttempted`
- `currentRefsLifecycleOwnerAssignmentCompleted`
- `currentRefsDrawOperationAssignmentAttempted`
- `currentRefsDrawOperationAssignmentCompleted`
- `prepareOneFrameSurfaceSelected`
- `prepareOneFrameSurfaceCallAttempted`
- `prepareOneFrameSurfaceCallEntered`
- `prepareOneFrameSurfaceCallReturned`
- `prepareOneFrameSurfaceResultType`
- `surfacePreparationInputReadyStatusWriteAttempted`
- `surfacePreparationInputReadyStatusWriteCompleted`
- `postDrawOperationLastCompletedStep`
- `postDrawOperationNextExpectedStep`
- `postDrawOperationFailureFunction`
- `postDrawOperationExceptionName`
- `postDrawOperationExceptionMessage`
- `postDrawOperationExceptionReasonCode`

Also recorded as explicit booleans for this seam:

- `postDrawOperationPropertySetterInvoked`
- `postDrawOperationProxyTrapInvoked`
- `postDrawOperationGetterInvoked`
- `postDrawOperationDiagnosticsLookupInvoked`
- `postDrawOperationRecursiveCallbackInvoked`

## Boundary-specific failure attribution

The continuation trace now distinguishes these failure seams:

- `CURRENT_REFS_MAP_ASSIGNMENT_EXCEPTION`
- `CURRENT_REFS_LIFECYCLE_ASSIGNMENT_EXCEPTION`
- `CURRENT_REFS_DRAW_OPERATION_ASSIGNMENT_EXCEPTION`
- `SURFACE_PREPARATION_STATUS_WRITE_EXCEPTION`
- `SURFACE_PREPARATION_EXCEPTION`

This separates failure while writing `surfacePreparationInputReady` from failure while entering or executing `prepareOneFrameSurface`.

## Regression coverage

Focused regression coverage now proves:

- normal path completes all currentRefs assignments
- normal path completes the surface-preparation readiness status write
- normal path enters and returns from `prepareOneFrameSurface`
- normal path reaches payload assembly
- simulated map assignment failure is attributed exactly
- simulated lifecycle owner assignment failure is attributed exactly
- simulated draw operation assignment failure is attributed exactly
- simulated surface-preparation status-write failure is attributed exactly
- simulated surface-preparation entry failure is attributed exactly
- canonical safety flags remain false

## Safety

No renderer visuals were changed.

No lifecycle policy was changed.

No authorization behavior was changed.

No cleanup ownership behavior was changed.

## Next step

Collect the next real Safari trace using this narrower continuation instrumentation to determine whether the remaining live stop happens:

- during one of the currentRefs assignments
- during the `surfacePreparationInputReady` status write
- during `prepareOneFrameSurface`
- or immediately after surface preparation returns
