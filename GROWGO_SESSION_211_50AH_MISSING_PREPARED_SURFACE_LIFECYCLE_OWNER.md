# GrowGo Session 211.50ah — Missing Prepared-Surface Lifecycle Owner

Date: 2026-08-05
Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
Phase: `211.50ah`
Classification: `LIFECYCLE_OWNER_SOURCE_IDENTIFIED`

## Goal

Diagnose why the prepared surface exposes:

- canvas
- map

but does not expose the lifecycle owner immediately before payload assembly.

## Diagnosis

The prepared-surface contract used by the adapter does not normally carry a lifecycle owner field.

In the current one-frame flow:

1. a lifecycle owner is created earlier
2. that same lifecycle owner is assigned into `currentRefs.lifecycleOwner`
3. surface preparation returns a prepared-surface payload with surface resources
4. lifecycle translation still receives the lifecycle owner separately

That means the authoritative lifecycle owner already exists before payload assembly and is intentionally retained outside the prepared-surface payload.

## What was confirmed

Prepared-surface diagnostics now distinguish:

- whether a lifecycle owner exists directly on `preparedSurface.surface.lifecycleOwner`
- whether it exists on `preparedSurface.lifecycleOwner`
- whether it exists in nested `operationState.lifecycleOwner`
- whether `currentRefs.lifecycleOwner` is still present after surface preparation

Normal result:

- prepared-surface lifecycle owner: not present
- nested prepared-surface lifecycle owner: not present
- `currentRefs.lifecycleOwner`: present

## Resolution rule

Payload lifecycle owner resolution now uses exactly one existing owner:

- authoritative source: `currentRefs.lifecycleOwner`
- fallback source: prepared-surface lifecycle owner only if `currentRefs.lifecycleOwner` is absent

This preserves:

- one lifecycle owner
- one cleanup owner
- one-frame-only execution
- existing lifecycle policy
- all safety gates

## Added diagnostics

- `preparedSurfaceLifecycleOwnerSource`
- `preparedSurfaceLifecycleOwnerPropertyName`
- `preparedSurfaceNestedLifecycleOwnerPresent`
- `currentRefsLifecycleOwnerPresentAfterSurfacePreparation`
- `payloadLifecycleOwnerResolved`
- `payloadLifecycleOwnerResolutionSource`
- `payloadLifecycleOwnerResolutionFailureReason`

## Regression coverage

Focused tests now prove:

- prepared surface can omit lifecycle owner while still carrying canvas and map
- `currentRefs.lifecycleOwner` remains present after surface preparation
- payload lifecycle owner resolves from `currentRefs.lifecycleOwner`
- payload assembly entry begins after lifecycle-owner resolution
- payload context creation begins
- payload guard evaluates
- no duplicate lifecycle owner is created
- cleanup still uses the same lifecycle owner exactly once
- all four canonical safety flags remain false

## Outcome

The issue is not a missing second lifecycle owner.

The issue is a source mismatch:

- prepared surface is not the authoritative lifecycle-owner source
- `currentRefs.lifecycleOwner` is

That source is now identified and recorded explicitly for the payload continuation path.
