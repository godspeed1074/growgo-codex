# GROWGO SESSION 211.50 — MANUAL SAFARI ONE-FRAME ACTIVATION VERIFICATION

## Goal

Prepare the exact honest Safari checklist and evidence record for the first real developer-only Atlas custom 2.5D one-frame execution.

This phase does **not** run the live command automatically.

This phase does **not** fabricate evidence.

Until genuine Safari output is supplied:

- `executionStatus = PENDING_MANUAL_OPERATOR_EVIDENCE`
- overall verification is **not** PASS yet

## Preflight

- current branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- `git status --short` before this phase:
  - clean
- required Phase 211.49 commit confirmed at `HEAD`:
  - `f7dc8fa feat(atlas): add manual-gated one-frame activation command`
- working tree clean before authoring:
  - `yes`
- accepted Phase 211.49 classification:
  - `MANUAL_GATED_ONE_FRAME_COMMAND_READY_FOR_SAFARI_VERIFICATION`
- focused Phase 211.18 through 211.49 regression band:
  - `PASS`
- application implementation changes made in Phase 211.50:
  - `none`

## Canonical Safety Truth

Canonical safety flags must remain exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

This manual verification must remain:

- developer-only
- explicit only
- single-frame only
- one-shot only
- cleanup-mandatory
- no startup invocation
- no moveend invocation
- no zoomend invocation
- no timer
- no polling

## Existing Browser Interfaces

Expected on the live page:

- `window.GrowGoDeveloperDiagnostics.getAtlasRendererHandoffReadiness()`
- `window.GrowGoDeveloperDiagnostics.authorizeAtlasRendererHandoffSession({ confirmation })`
- `window.GrowGoDeveloperDiagnostics.getAtlasRendererHandoffAuthorizationStatus()`
- `window.GrowGoDeveloperDiagnostics.runAuthorizedAtlasCustom25DOneFrame({ confirmation })`

## Manual Browser Target

- browser: `Safari`
- page: `http://127.0.0.1:8000`
- execution date:
  - `PENDING_GENUINE_SAFARI_RUN`
- manual Safari verification:
  - `PENDING_MANUAL_OPERATOR_EVIDENCE`

## Manual Safari Procedure

1. Hard reload `http://127.0.0.1:8000`.
2. Wait for the Leaflet map to initialize.
3. Open Safari Developer Tools.
4. Confirm the required interfaces exist:

```js
[
  typeof window.GrowGoDeveloperDiagnostics
    ?.getAtlasRendererHandoffReadiness,
  typeof window.GrowGoDeveloperDiagnostics
    ?.authorizeAtlasRendererHandoffSession,
  typeof window.GrowGoDeveloperDiagnostics
    ?.getAtlasRendererHandoffAuthorizationStatus,
  typeof window.GrowGoDeveloperDiagnostics
    ?.runAuthorizedAtlasCustom25DOneFrame
]
```

Expected:

```js
["function", "function", "function", "function"]
```

5. Confirm the one-frame command exists directly:

```js
typeof window.GrowGoDeveloperDiagnostics
  ?.runAuthorizedAtlasCustom25DOneFrame
```

Expected:

```js
"function"
```

6. Confirm approved Bellarine readiness:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffReadiness()
```

Confirm:

- `diagnosticStatus = "resolved"`
- `reasonCode = "RESOLVED"`
- `rendererHandoffStatus = "ready_for_future_renderer_attachment"`
- approved region/package/recipe/seed match expected values

7. Authorize one renderer-handoff session:

```js
window.GrowGoDeveloperDiagnostics
  .authorizeAtlasRendererHandoffSession({
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  })
```

Record:

- authorization result object
- returned session ID

8. Confirm authorization status before running the frame:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffAuthorizationStatus()
```

Confirm:

- `authorizationActive = true`
- `authorizationConsumed = false`
- `authorizationInvalidated = false`
- `approvedReadinessBound = true`
- `currentReadinessMatchesAuthorization = true`
- `rendererInitializationAllowed = true`
- `rendererAttachmentAllowed = true`
- `drawAllowed = true`

9. Run the exact manual command:

```js
window.GrowGoDeveloperDiagnostics
  .runAuthorizedAtlasCustom25DOneFrame({
    confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
  })
```

Record the full returned object.

10. Visually confirm the one-frame behavior:

- one temporary Atlas custom 2.5D frame appeared
- it was visible for one browser paint
- it did not become a continuous animation loop
- it cleaned itself up

11. Confirm post-run authorization state:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffAuthorizationStatus()
```

Confirm:

- `authorizationConsumed = true`
- the original session ID remains the bound session identity
- no new authorization session appeared automatically

12. Attempt the command a second time:

```js
window.GrowGoDeveloperDiagnostics
  .runAuthorizedAtlasCustom25DOneFrame({
    confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
  })
```

Confirm:

- second invocation is blocked
- no second frame appears

13. Hard reload the page again.
14. Reconfirm clean post-reload state:

```js
[
  window.GrowGoDeveloperDiagnostics
    .getAtlasRendererHandoffAuthorizationStatus(),
  window.GrowGoDeveloperDiagnostics
    .getAtlasRendererHandoffReadiness()
]
```

Confirm:

- authorization state is fresh and inactive again
- readiness remains explicit-only
- no stale one-frame state remains

15. Record whether all canonical safety flags remained false before, during, and after the command.

## Required Operator Paste-Back Evidence

Paste back the genuine Safari outputs for:

- interface existence array
- direct command existence check
- approved readiness result
- authorization result
- authorization status before run
- first one-frame command result
- post-run authorization status
- second one-frame command result
- post-reload authorization status
- post-reload readiness result
- any Safari console warnings or environment anomalies actually observed

Also paste back a short human observation for:

- whether one temporary frame became visible
- whether cleanup removed it
- whether any continuous redraw occurred
- whether any unexpected canvas, overlay, listener, timer, network, or asset activity was observed

## Structured Evidence Record Template

```json
{
  "phaseId": "211.50",
  "executionStatus": "PENDING_MANUAL_OPERATOR_EVIDENCE",
  "executionDateTime": "PENDING_GENUINE_SAFARI_RUN",
  "browserUsed": "Safari",
  "developmentPageAddress": "http://127.0.0.1:8000",
  "requiredInterfacesPresent": "PENDING_OPERATOR_PASTE",
  "commandExistsResult": "PENDING_OPERATOR_PASTE",
  "approvedReadinessResult": "PENDING_OPERATOR_PASTE",
  "authorizationResult": "PENDING_OPERATOR_PASTE",
  "preRunAuthorizationStatus": "PENDING_OPERATOR_PASTE",
  "firstOneFrameCommandResult": "PENDING_OPERATOR_PASTE",
  "visualObservation": {
    "temporaryOneFrameAppeared": "PENDING_OPERATOR_CONFIRMATION",
    "visibleForOnePaint": "PENDING_OPERATOR_CONFIRMATION",
    "cleanupRemovedTemporaryFrame": "PENDING_OPERATOR_CONFIRMATION",
    "continuousAnimationObserved": "PENDING_OPERATOR_CONFIRMATION"
  },
  "postRunAuthorizationStatus": "PENDING_OPERATOR_PASTE",
  "secondOneFrameCommandResult": "PENDING_OPERATOR_PASTE",
  "postReloadAuthorizationStatus": "PENDING_OPERATOR_PASTE",
  "postReloadReadinessResult": "PENDING_OPERATOR_PASTE",
  "canonicalSafetyFlagSnapshot": {
    "runtimeExecutionEnabled": false,
    "mapAttachmentAllowed": false,
    "automaticRendererExecutionAllowed": false,
    "lifecycleExecutionEnabled": false
  },
  "operatorConfirmation": {
    "commandWasNotRunAutomatically": "PENDING_OPERATOR_CONFIRMATION",
    "noMoveendTriggeredExecutionOccurred": "PENDING_OPERATOR_CONFIRMATION",
    "noZoomendTriggeredExecutionOccurred": "PENDING_OPERATOR_CONFIRMATION",
    "noTimerOrPollingExecutionOccurred": "PENDING_OPERATOR_CONFIRMATION",
    "authorizationConsumedExactlyOnce": "PENDING_OPERATOR_CONFIRMATION",
    "secondInvocationWasBlocked": "PENDING_OPERATOR_CONFIRMATION",
    "postReloadStateWasClean": "PENDING_OPERATOR_CONFIRMATION"
  },
  "nonBlockingObservedConditions": "PENDING_OPERATOR_PASTE_IF_ANY"
}
```

## Current Honest Status

Current state before real Safari evidence:

- command implementation prepared:
  - `yes`
- manual Safari checklist prepared:
  - `yes`
- evidence template prepared:
  - `yes`
- genuine Safari live command output recorded:
  - `no`
- overall Phase 211.50:
  - `PENDING_MANUAL_OPERATOR_EVIDENCE`

## What Must Not Be Claimed Yet

Do **not** claim yet that:

- the frame visibly appeared in Safari
- cleanup visibly succeeded in Safari
- second invocation was genuinely blocked in Safari
- reload genuinely restored clean state in Safari
- Phase 211.50 is PASS

Those require real operator evidence pasted back from Safari.

## Next Step

Run the manual Safari procedure above and paste back the exact outputs and observations for closeout.
