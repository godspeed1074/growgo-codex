# GROWGO SESSION 211.50C — ACTUAL SAFARI STACK RECURSION DIAGNOSIS

## Status

- branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- diagnosis status:
  - `PASS`
- live Safari execution performed during this coding phase:
  - `no`

## Honest baseline

Phase 211.50a did **not** remove the real Safari recursion.

The second genuine Safari retest still failed with:

- `reasonCode = MAXIMUM_CALL_STACK_SIZE_EXCEEDED`
- `surfacePrepared = true`
- `frameSnapshotCreated = false`
- `drawAttemptCount = 0`
- `completedFrameCount = 0`
- `cleanupCompleted = true`
- `authorizationConsumed = true`

## Actual repeated call chain

The browser-shaped regression reproduced the unsafe rebound pattern as:

1. `runAuthorizedAtlasCustom25DOneFrame`
2. `getAtlasRendererHandoffReadiness`
3. `getAtlasDiagnosticForCurrentMapCentre`
4. `publicDiagnosticsGetGrowGoMap`
5. `reboundGrowGoMapGetter`
6. `publicDiagnosticsGetGrowGoMap`
7. repeat until stack exhaustion

The trace also records the repeated chain as:

- `publicDiagnosticsGetGrowGoMap`
- `reboundGrowGoMapGetter`
- `publicDiagnosticsGetGrowGoMap`

## Exact root cause

The unsafe live path was not the private snapshot alias itself.

The real problem was public diagnostics namespace rebound risk:

- the live Atlas module re-read `GrowGoDeveloperDiagnostics` during execution
- the live one-frame path depended on public getters instead of captured script-owned getters
- if the public getter path resolved back through the same namespace again, the browser could recurse before the snapshot bridge ever returned

That matches the genuine Safari evidence:

- surface preparation succeeded
- snapshot creation never completed
- draw never began

## Why Phase 211.50a missed it

Phase 211.50a tested isolated helpers and private-alias direction.

Those tests did **not** load the browser-global wiring shape that combines:

- `script.js`
- local diagnostics namespace bootstrapping
- development-alpha installation
- public namespace command invocation

So the earlier regression band proved the isolated bridge shape, but not the rebound public getter risk present in browser wiring.

## Correction

The live Atlas setup now captures the original script diagnostics functions once and reuses those stable references for:

- `getGrowGoMap`
- `getCustom25DOneFrameBridge`
- live one-frame snapshot bridge access
- live one-frame draw bridge access

It no longer relies on repeated public namespace lookups during the active one-frame execution path.

## Developer-only recursion tracing

Added local-development-only trace support that:

- records function entry and exit
- records call depth
- records the last 30 function names
- records the repeated call chain
- fails closed at a small safe depth before uncontrolled recursion

Exposed developer diagnostic:

- `window.GrowGoDeveloperDiagnostics.getAtlasCustom25DOneFrameExecutionTrace()`

## Browser wrapper return fix

The namespace-installed Safari command now explicitly returns the underlying command promise result.

Expected returned command identity:

- `ATLAS_CUSTOM25D_ONE_FRAME_COMMAND_RESULT_001`

The browser-shaped regression proves the broken non-returning wrapper resolves to `undefined`, while the corrected wrapper returns the real result object.

## Regression proof

Browser-shaped regression now proves:

1. unsafe rebound public getter wiring reproduces recursion
2. trace captures the repeated call chain
3. corrected captured-getter wiring completes exactly:
   - one snapshot
   - one draw
   - one cleanup
4. canonical safety flags remain false
5. public Safari command returns its real result object

## Files changed in this phase

- `client/development-alpha-app.mjs`
- `client/developer-only-atlas-custom25d-one-frame-command.mjs`
- `client/developer-only-atlas-custom25d-one-frame-execution-trace.mjs`
- `tests/client-browser-shaped-atlas-one-frame-recursion.test.mjs`
- `tests/client-developer-only-atlas-custom25d-one-frame-command.test.mjs`
- `tests/client-developer-only-live-one-frame-adapter-implementation-review.test.mjs`
- `GROWGO_SESSION_211_50B_MANUAL_SAFARI_ONE_FRAME_ACTIVATION_RETEST.md`
- `GROWGO_SESSION_211_50C_ACTUAL_SAFARI_STACK_RECURSION_DIAGNOSIS.md`

## Next phase

- `211.50d — Manual Safari One-Frame Retest`
