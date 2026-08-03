# GROWGO SESSION 211.50B — MANUAL SAFARI ONE-FRAME ACTIVATION RETEST

## Goal

Preserve the second genuine Safari retest honestly after the Phase 211.50a recursion fix still failed in live Safari.

This phase does **not** run the live command automatically.

This phase does **not** fabricate Safari success evidence.

Confirmed second Safari retest truth:

- `executionStatus = FAIL`
- second Safari retest still produced `MAXIMUM_CALL_STACK_SIZE_EXCEEDED`
- `surfacePrepared = true`
- `frameSnapshotCreated = false`
- `drawAttemptCount = 0`
- `completedFrameCount = 0`
- `cleanupCompleted = true`
- `authorizationConsumed = true`
- no persistent Canvas, listener, pane, or overlay remained after cleanup

## Preflight

- current branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- `git status --short` before this phase:
  - clean
- Phase 211.50a checkpoint accepted:
  - verified by committed contents at `HEAD`
- checkpoint commit message:
  - long-form closeout message at `dece92c`
- checkpoint content verified:
  - `script.js` private implementation aliases present
  - one-way bridge delegation present
  - updated bridge, snapshot, adapter, and evidence tests present
  - `GROWGO_SESSION_211_50A_LIVE_ONE_FRAME_STACK_RECURSION_FIX.md` present
- focused one-frame command / adapter / bridge / snapshot / lifecycle suites:
  - `PASS`
- full filtered Phase 211.18 through 211.50 regression band:
  - `PASS`
- application implementation changes made in Phase 211.50b:
  - `none`

## Canonical Safety Truth

Canonical safety flags must remain exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

This retest must remain:

- developer-only
- explicit only
- one-shot only
- cleanup-mandatory
- no startup execution
- no moveend execution
- no zoomend execution
- no timer
- no polling

## Existing Browser Interfaces

Expected on the live page:

- `window.GrowGoDeveloperDiagnostics.getGrowGoMap()`
- `window.GrowGoDeveloperDiagnostics.getAtlasRendererHandoffReadiness()`
- `window.GrowGoDeveloperDiagnostics.authorizeAtlasRendererHandoffSession({ confirmation })`
- `window.GrowGoDeveloperDiagnostics.getAtlasRendererHandoffAuthorizationStatus()`
- `window.GrowGoDeveloperDiagnostics.getAtlasMapAttachmentStatus()`
- `window.GrowGoDeveloperDiagnostics.runAuthorizedAtlasCustom25DOneFrame({ confirmation })`

## Manual Browser Target

- browser: `Safari`
- page: `http://127.0.0.1:8000`
- execution date:
  - `SECOND_GENUINE_SAFARI_RETEST_COMPLETED_BEFORE_PHASE_211_50C`
- execution status:
  - `FAIL`

## Manual Safari Retest Procedure

1. Hard reload Safari.
2. Wait for the Leaflet map and diagnostics namespace to initialize.
3. Confirm:

```js
typeof window.GrowGoDeveloperDiagnostics
  ?.runAuthorizedAtlasCustom25DOneFrame
```

Expected:

```js
"function"
```

4. Move to the approved Bellarine coordinate:

```js
window.GrowGoDeveloperDiagnostics.getGrowGoMap().stop();
window.GrowGoDeveloperDiagnostics.getGrowGoMap().setView(
  [-38.12, 144.61],
  15,
  { animate: false }
);
```

5. Confirm readiness:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffReadiness()
```

Expected:

- `diagnosticStatus = resolved`
- `reasonCode = RESOLVED`
- `rendererHandoffStatus = ready_for_future_renderer_attachment`
- `rendererConsumerAvailable = true`
- `rendererIdentityValidated = true`

6. Authorize one renderer-handoff session:

```js
window.GrowGoDeveloperDiagnostics
  .authorizeAtlasRendererHandoffSession({
    confirmation:
      "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  })
```

Expected:

- `outcome = authorized`
- `reasonCode = AUTHORIZED_RENDERER_HANDOFF_ONE_SESSION`

7. Confirm authorization status:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffAuthorizationStatus()
```

Expected:

- `authorizationActive = true`
- `authorizationConsumed = false`
- `authorizationInvalidated = false`
- `currentReadinessMatchesAuthorization = true`
- `sessionId` non-null

8. Do **not** test the wrong command confirmation in this page instance.

9. Run the valid command directly with `await`:

```js
await window.GrowGoDeveloperDiagnostics
  .runAuthorizedAtlasCustom25DOneFrame({
    confirmation:
      "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
  })
```

Record the complete returned object.

Observed second Safari retest values:

- `outcome = failed_closed`
- `reasonCode = MAXIMUM_CALL_STACK_SIZE_EXCEEDED`
- `confirmationAccepted = true`
- `authorizationConsumed = true`
- `adapterInvoked = true`
- `surfacePrepared = true`
- `frameSnapshotCreated = false`
- `drawAttemptCount = 0`
- `completedFrameCount = 0`
- `cleanupAttemptCount = 1`
- `cleanupCompleted = true`
- `cleanupFailed = false`
- `referencesReleased = true`
- `permanentlyClosed = true`
- no snapshot object returned
- no draw attempted

10. Visual observation:

Recorded honestly:

- temporary one-frame surface was prepared
- frame snapshot was not created
- draw was not attempted
- cleanup completed
- authorization was consumed
- no persistent Canvas, listener, pane, overlay, or artifact remained

11. Check authorization after execution:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffAuthorizationStatus()
```

Expected:

- `authorizationConsumed = true`
- `authorizationActive = false`
- no effective renderer permission remains

12. Check attachment and cleanup:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasMapAttachmentStatus()
```

Expected:

- `attached = false`
- `ownedListenerCount = 0`
- `rendererActivity = false` after cleanup
- `overlayActivity = false`
- `networkActivity = false`
- `pollingOrTimerActivity = false`

13. Attempt second execution:

```js
await window.GrowGoDeveloperDiagnostics
  .runAuthorizedAtlasCustom25DOneFrame({
    confirmation:
      "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
  })
```

Expected:

- `outcome = blocked`
- `reasonCode = COMMAND_ALREADY_USED`
- no second surface
- no second draw
- no second cleanup

14. Reload the page.

15. After reload, confirm:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffAuthorizationStatus()
```

and:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasMapAttachmentStatus()
```

Expected:

- `authorizationActive = false`
- `authorizationConsumed = false`
- `authorizationInvalidated = false`
- `sessionId = null`
- `attached = false`
- `ownedListenerCount = 0`
- `diagnosticInvocationCount = 0`
- no temporary Canvas remains
- all four canonical safety flags remain false

## Required Operator Paste-Back Evidence

Paste back the genuine Safari outputs for:

- interface check
- approved readiness result
- authorization result
- pre-execution authorization status
- one-frame command result
- post-execution authorization status
- post-execution map attachment status
- second-execution result
- post-reload authorization status
- post-reload map attachment status
- any supporting environment warnings or errors actually observed

Also paste back short human observations for:

- whether the temporary one-frame appeared
- whether it was visible for one paint
- whether cleanup removed it
- whether the normal Leaflet map remained visible
- whether any artifact remained

## Structured Evidence Record Template

```json
{
  "phaseId": "211.50b",
  "executionStatus": "FAIL",
  "executionDateTime": "SECOND_GENUINE_SAFARI_RETEST_COMPLETED_BEFORE_PHASE_211_50C",
  "operator": "RECORDED_FROM_GENUINE_SAFARI_RETEST",
  "browser": "Safari",
  "pageAddress": "http://127.0.0.1:8000",
  "interfaceCheck": "CONFIRMED",
  "approvedReadinessResult": "CONFIRMED",
  "authorizationResult": "AUTHORIZED",
  "preExecutionAuthorizationStatus": "AUTHORIZATION_ACTIVE",
  "oneFrameCommandResult": "FAILED_CLOSED_MAXIMUM_CALL_STACK_SIZE_EXCEEDED",
  "visualObservation": {
    "temporaryOneFrameAppeared": "SURFACE_PREPARED_ONLY",
    "visibleForOnePaint": "NO",
    "disappearedAfterCleanup": "YES",
    "normalLeafletMapRemained": "YES",
    "artifactRemained": "NO"
  },
  "postExecutionAuthorizationStatus": "AUTHORIZATION_CONSUMED",
  "postExecutionMapAttachmentStatus": "CLEAN",
  "secondExecutionResult": "NOT_RUN_AFTER_FAILURE_DURING_SAME_RETEST",
  "postReloadAuthorizationStatus": "NOT_CAPTURED_IN_PHASE_211_50C",
  "postReloadMapAttachmentStatus": "NOT_CAPTURED_IN_PHASE_211_50C",
  "safetyFlagSnapshot": {
    "runtimeExecutionEnabled": false,
    "mapAttachmentAllowed": false,
    "automaticRendererExecutionAllowed": false,
    "lifecycleExecutionEnabled": false
  },
  "operatorConfirmation": {
    "usedSafari": "YES",
    "usedLocalhostPage": "YES",
    "usedExactCommandFunction": "YES",
    "approvedReadinessConfirmed": "YES",
    "freshAuthorizationConfirmed": "YES",
    "wrongConfirmationWasNotTestedInThisPageInstance": "YES",
    "oneSnapshotCompleted": "NO",
    "oneDrawCompleted": "NO",
    "oneCleanupCompleted": "YES",
    "secondExecutionBlocked": "NOT_RECORDED_IN_SECOND_FAILED_RETEST",
    "postReloadStateWasClean": "NOT_RECORDED_IN_PHASE_211_50C"
  },
  "observedSupportingEnvironmentErrors": "MAXIMUM_CALL_STACK_SIZE_EXCEEDED"
}
```

## Current Honest Status

Current state before the corrected Safari retest:

- recursion fix committed:
  - `yes`
- focused one-frame suites passing:
  - `yes`
- filtered Phase 211.18 through 211.50 regression band passing:
  - `yes`
- genuine corrected Safari retest output recorded:
  - `yes`
- overall Phase 211.50b:
  - `FAIL`

## What Must Not Be Claimed Yet

Do **not** claim yet that:

- the corrected one-frame command has passed in Safari
- the temporary frame became visible in Safari
- cleanup visually succeeded in Safari
- the second execution was genuinely blocked in Safari
- Phase 211.50b is PASS

Those require genuine Safari retest evidence pasted back from the operator.

## Next Step

Run the manual Safari retest above and paste back the exact outputs and visual observations for closeout.
