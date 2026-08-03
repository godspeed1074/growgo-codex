# GrowGo Session 211.50j — getGrowGoMap Recursion Fix

Date: August 3, 2026
Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
Phase: `211.50j — Fix Safari getGrowGoMap recursion`
Classification: `GET_GROWGO_MAP_RECURSION_IDENTIFIED`

## Safari truth entering this phase

Real Safari trace identified the repeated chain:

- `getGrowGoMap`
- `getGrowGoMap`
- repeating

Observed Safari result remained:

- `outcome = failed_closed`
- `reasonCode = MAXIMUM_CALL_STACK_SIZE_EXCEEDED`
- `adapterInvoked = true`
- `surfacePrepared = true`
- `authorizationConsumed = true`
- `frameSnapshotCreated = false`
- `drawAttemptCount = 0`
- `completedFrameCount = 0`
- `realDrawFunctionCalled = false`
- `cleanupCompleted = true`
- `referencesReleased = true`

## Root cause

The one-frame runtime lane still allowed the live adapter to depend on a public diagnostics-shaped map getter identity.

That meant the real Safari path could still resolve:

- public `getGrowGoMap`
- rebound `getGrowGoMap`
- recursive `getGrowGoMap`

instead of a once-captured internal raw Leaflet map provider.

## Correction

The one-frame path now captures once:

- `rawLeafletMapProvider`

Then runs:

- command
- adapter
- stable raw map provider
- snapshot creation
- draw

Snapshot creation must not call:

- `window.GrowGoDeveloperDiagnostics.getGrowGoMap()`

Snapshot creation must not resolve:

- public diagnostics namespace
- lazy bridge getter
- rebound map getter

## Files changed

- `client/development-alpha-app.mjs`
- `client/developer-only-growgo-custom25d-live-one-frame-adapter.mjs`
- `tests/client-browser-shaped-atlas-one-frame-recursion.test.mjs`
- `tests/client-developer-only-growgo-custom25d-live-one-frame-adapter.test.mjs`
- `tests/client-developer-only-live-one-frame-adapter-implementation-review.test.mjs`

## Regression proof target

### before fix shape

- public diagnostics getter recursion can be reproduced
- repeated chain:
  - `reboundPublicGetGrowGoMap`
  - `reboundPublicGetGrowGoMap`

### after fix shape

- one raw map provider call
- one snapshot
- one draw
- one cleanup
- no public `getGrowGoMap` recursion in the one-frame path

## Safety preserved

No changes made to:

- authorization
- lifecycle
- draw seam
- renderer visuals

Canonical safety flags remain false:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`
