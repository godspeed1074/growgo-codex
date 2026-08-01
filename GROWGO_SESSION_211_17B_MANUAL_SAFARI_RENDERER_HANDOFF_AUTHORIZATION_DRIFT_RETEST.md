# GROWGO SESSION 211.17B — MANUAL SAFARI RENDERER HANDOFF AUTHORIZATION DRIFT RETEST

## Goal

Prepare the real Safari retest proving the renderer-handoff authorization now becomes permanently spoiled after the first readiness drift and does not recover when the map returns to the approved Bellarine coordinate.

## Preflight

- current branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- `git status --short` before this phase:
  - clean
- accepted Phase 211.17a checkpoint:
  - `d342055`
- checkpoint acceptance basis:
  - verified by content, not by commit message
- commit message accuracy:
  - inaccurate
- history rewritten:
  - `no`
- confirmed Phase 211.17a content inside `d342055`:
  - irreversible renderer-handoff authorization invalidation latch
  - focused readiness-drift regression tests
  - preserved failed Safari evidence in Phase 211.17
  - Phase 211.17a repair report
- focused renderer-handoff authorization and readiness regressions:
  - `PASS`
- previous failed Safari evidence remains preserved in:
  - [`GROWGO_SESSION_211_17_MANUAL_LOCALHOST_RENDERER_HANDOFF_AUTHORIZATION_VERIFICATION.md`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_211_17_MANUAL_LOCALHOST_RENDERER_HANDOFF_AUTHORIZATION_VERIFICATION.md)
- application implementation changes made in Phase 211.17b:
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
- renderer-free
- draw-free
- overlay-free
- listener-free
- network-free from the authorization path

## Browser Interfaces

Expected on the live page:

- `window.GrowGoDeveloperDiagnostics.getAtlasRendererHandoffReadiness()`
- `window.GrowGoDeveloperDiagnostics.authorizeAtlasRendererHandoffSession({ confirmation })`
- `window.GrowGoDeveloperDiagnostics.revokeAtlasRendererHandoffSession()`
- `window.GrowGoDeveloperDiagnostics.getAtlasRendererHandoffAuthorizationStatus()`

## Manual Browser Target

- browser: `Safari`
- page: `http://127.0.0.1:8000`
- execution status:
  - `PENDING_MANUAL_OPERATOR_EVIDENCE`

## Manual Safari Retest Procedure

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
    ?.revokeAtlasRendererHandoffSession,
  typeof window.GrowGoDeveloperDiagnostics
    ?.getAtlasRendererHandoffAuthorizationStatus
]
```

Expected:

```js
["function", "function", "function", "function"]
```

5. Confirm default authorization status:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffAuthorizationStatus()
```

Confirm:

- `authorizationActive = false`
- `authorizationConsumed = false`
- `authorizationInvalidated = false`
- `sessionId = null`
- `rendererInitializationAllowed = false`
- `rendererAttachmentAllowed = false`
- `drawAllowed = false`

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

7. Authorize the approved readiness result:

```js
window.GrowGoDeveloperDiagnostics
  .authorizeAtlasRendererHandoffSession({
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  })
```

Record:

- session ID
- `authorizationActive = true`
- `authorizationInvalidated = false`
- `currentReadinessMatchesAuthorization = true`
- `currentReadinessReasonCode = "READINESS_MATCHED"`
- `rendererInitializationAllowed = true`
- `rendererAttachmentAllowed = true`
- `drawAllowed = true`

8. Move the map clearly outside the approved scope.
9. Run:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffReadiness()
```

Then run:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffAuthorizationStatus()
```

Confirm:

- readiness fails closed with `REGION_OUT_OF_SCOPE`
- `authorizationInvalidated = true`
- `invalidationReasonCode = "REGION_OUT_OF_SCOPE"`
- `invalidatedAtReadinessReasonCode = "REGION_OUT_OF_SCOPE"`
- `currentReadinessMatchesAuthorization = false`
- `rendererInitializationAllowed = false`
- `rendererAttachmentAllowed = false`
- `drawAllowed = false`

10. Return the map to the approved Bellarine coordinate.
11. Run the readiness diagnostic again:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffReadiness()
```

Then run authorization status again:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffAuthorizationStatus()
```

Confirm the key correction:

- readiness itself returns to resolved
- the same session ID still exists until revoke
- `authorizationInvalidated` stays `true`
- `currentReadinessMatchesAuthorization` stays `false`
- `currentReadinessReasonCode` remains the first mismatch reason
- `rendererInitializationAllowed = false`
- `rendererAttachmentAllowed = false`
- `drawAllowed = false`
- permission did **not** heal automatically

12. Re-run status again without moving the map.

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffAuthorizationStatus()
```

Confirm repeated inspection does not clear invalidation.

13. Revoke the invalidated session:

```js
window.GrowGoDeveloperDiagnostics
  .revokeAtlasRendererHandoffSession()
```

Confirm:

- successful revoke
- invalidated session state cleared

14. With the map still at the approved Bellarine coordinate, authorize again:

```js
window.GrowGoDeveloperDiagnostics
  .authorizeAtlasRendererHandoffSession({
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  })
```

Confirm:

- new session ID differs from the first one
- `authorizationInvalidated = false`
- `currentReadinessMatchesAuthorization = true`
- fresh session does not inherit old invalidation

15. Revoke the fresh session safely.

16. Hard reload the page and confirm:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffAuthorizationStatus()
```

returns fresh unauthorized state.

17. Throughout the whole retest confirm:

- no renderer initialization occurred
- no renderer attachment occurred
- no draw occurred
- no canvas appeared
- no WebGL surface appeared
- no DOM overlay appeared
- no listener was added
- no polling or timer activity appeared
- no network request occurred
- no asset download occurred
- normal Leaflet map behavior remained unchanged

## Structured Evidence Record

Paste genuine Safari retest results here after manual execution:

```json
{
  "phaseId": "211.17b",
  "executionStatus": "PENDING_MANUAL_OPERATOR_EVIDENCE",
  "executionDateTime": "PENDING_MANUAL_OPERATOR_EVIDENCE",
  "browserUsed": "Safari",
  "developmentPageAddress": "http://127.0.0.1:8000",
  "interfaceAvailability": "PENDING_MANUAL_OPERATOR_EVIDENCE",
  "initialAuthorizationStatus": "PENDING_MANUAL_OPERATOR_EVIDENCE",
  "approvedReadinessResult": "PENDING_MANUAL_OPERATOR_EVIDENCE",
  "successfulAuthorizationResult": "PENDING_MANUAL_OPERATOR_EVIDENCE",
  "sessionOneAuthorizedStatus": "PENDING_MANUAL_OPERATOR_EVIDENCE",
  "outOfScopeReadinessResult": "PENDING_MANUAL_OPERATOR_EVIDENCE",
  "sessionOneDriftedStatus": "PENDING_MANUAL_OPERATOR_EVIDENCE",
  "restoredApprovedReadinessResult": "PENDING_MANUAL_OPERATOR_EVIDENCE",
  "sessionOneStillInvalidAfterReturnStatus": "PENDING_MANUAL_OPERATOR_EVIDENCE",
  "repeatedStatusInspectionResult": "PENDING_MANUAL_OPERATOR_EVIDENCE",
  "sessionOneRevokeResult": "PENDING_MANUAL_OPERATOR_EVIDENCE",
  "sessionTwoAuthorizationResult": "PENDING_MANUAL_OPERATOR_EVIDENCE",
  "sessionTwoFreshStatus": "PENDING_MANUAL_OPERATOR_EVIDENCE",
  "sessionTwoRevokeResult": "PENDING_MANUAL_OPERATOR_EVIDENCE",
  "postReloadAuthorizationStatus": "PENDING_MANUAL_OPERATOR_EVIDENCE",
  "canonicalSafetyFlagSnapshot": {
    "runtimeExecutionEnabled": false,
    "mapAttachmentAllowed": false,
    "automaticRendererExecutionAllowed": false,
    "lifecycleExecutionEnabled": false
  },
  "operatorConfirmation": {
    "permissionDidNotHealAfterReturningToApprovedScope": "PENDING_MANUAL_OPERATOR_EVIDENCE",
    "freshSessionUsedDistinctSessionId": "PENDING_MANUAL_OPERATOR_EVIDENCE",
    "noRendererInitializationOccurred": "PENDING_MANUAL_OPERATOR_EVIDENCE",
    "noRendererAttachmentOccurred": "PENDING_MANUAL_OPERATOR_EVIDENCE",
    "noDrawingOccurred": "PENDING_MANUAL_OPERATOR_EVIDENCE",
    "noCanvasAppeared": "PENDING_MANUAL_OPERATOR_EVIDENCE",
    "noWebglSurfaceAppeared": "PENDING_MANUAL_OPERATOR_EVIDENCE",
    "noDomOverlayAppeared": "PENDING_MANUAL_OPERATOR_EVIDENCE",
    "noListenerWasAdded": "PENDING_MANUAL_OPERATOR_EVIDENCE",
    "noPollingOrTimerActivityAppeared": "PENDING_MANUAL_OPERATOR_EVIDENCE",
    "noNetworkRequestOccurred": "PENDING_MANUAL_OPERATOR_EVIDENCE",
    "noAssetDownloadOccurred": "PENDING_MANUAL_OPERATOR_EVIDENCE",
    "normalLeafletMapBehaviorRemainedUnchanged": "PENDING_MANUAL_OPERATOR_EVIDENCE"
  }
}
```

## Required Manual Evidence Still Needed

Paste back the full Safari console results for:

1. interface availability
2. initial authorization status
3. approved readiness result
4. successful authorization result
5. authorized Session 1 status
6. out-of-scope readiness result
7. Session 1 drifted status
8. restored approved readiness result
9. Session 1 still-invalid status after return
10. repeated status inspection result
11. Session 1 revoke result
12. Session 2 authorization result
13. Session 2 fresh status
14. Session 2 revoke result
15. post-reload authorization status

Also confirm in plain language:

- whether permission stayed spoiled after returning to the approved coordinate
- whether the fresh session got a different session ID
- whether any renderer, canvas, WebGL, overlay, listener, timer, network, or asset activity occurred

## Status Breakdown

- evidence template:
  - `COMPLETE`
- manual Safari retest:
  - `PENDING`
- drift invalidation:
  - `PENDING`
- no automatic permission restoration:
  - `PENDING`
- fresh-session recovery:
  - `PENDING`
- renderer inactivity:
  - `PENDING`
- overall Phase 211.17b:
  - `PENDING_MANUAL_OPERATOR_EVIDENCE`
