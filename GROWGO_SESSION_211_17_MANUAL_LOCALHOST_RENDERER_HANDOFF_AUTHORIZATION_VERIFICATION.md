# GROWGO SESSION 211.17 — MANUAL LOCALHOST RENDERER HANDOFF AUTHORIZATION VERIFICATION

## Goal

This record now preserves the first genuine Safari attempt. That attempt discovered a real defect: once readiness drifted out of scope and then returned to the approved Bellarine location, the same session regained effective permission. This file remains as failure evidence and must not be overwritten with invented corrected results.

## Preflight

- current branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- `git status --short` before this phase:
  - clean
- required Phase 211.16 commit confirmed at `HEAD`:
  - `c11a1cc feat(atlas): add one-session developer renderer handoff authorization`
- focused Phase 211.12 through 211.16 tests:
  - `PASS`
- application implementation changes made in the original Phase 211.17 evidence-preparation step:
  - `none`

## Canonical Safety Truth

Canonical safety flags must remain exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

This manual phase must remain:

- explicit only
- developer-only
- read-only with respect to renderer state
- detached
- draw-free
- overlay-free
- listener-free
- network-free from the authorization path

## Existing Browser Interfaces

Expected on the live page:

- `window.GrowGoDeveloperDiagnostics.getAtlasRendererHandoffReadiness()`
- `window.GrowGoDeveloperDiagnostics.authorizeAtlasRendererHandoffSession({ confirmation })`
- `window.GrowGoDeveloperDiagnostics.revokeAtlasRendererHandoffSession()`
- `window.GrowGoDeveloperDiagnostics.getAtlasRendererHandoffAuthorizationStatus()`

## Manual Browser Target

- browser: `Safari`
- page: `http://127.0.0.1:8000`
- first live execution status:
  - `FAIL — READINESS_DRIFT_PERMISSION_RESTORED`

## First Safari Attempt Findings

Observed session:

- `ATLAS_RENDERER_HANDOFF_ONE_SESSION_001`

Initial approved state was correct:

- `authorizationActive = true`
- `authorizationConsumed = false`
- `currentReadinessMatchesAuthorization = true`
- `currentReadinessReasonCode = READINESS_MATCHED`
- `rendererInitializationAllowed = true`
- `rendererAttachmentAllowed = true`
- `drawAllowed = true`

Drift state was also correct at first:

- `currentReadinessMatchesAuthorization = false`
- `currentReadinessReasonCode = REGION_OUT_OF_SCOPE`
- `rendererInitializationAllowed = false`
- `rendererAttachmentAllowed = false`
- `drawAllowed = false`

Defect:

- the same session ID remained active:
  - `ATLAS_RENDERER_HANDOFF_ONE_SESSION_001`
- after returning to the approved Bellarine coordinate:
  - `currentReadinessMatchesAuthorization` returned to `true`
  - `rendererInitializationAllowed` returned to `true`
  - `rendererAttachmentAllowed` returned to `true`
  - `drawAllowed` returned to `true`

That behavior violates the intended one-session drift contract.

## Manual Safari Procedure

1. Hard reload `http://127.0.0.1:8000`.
2. Wait for the Leaflet map to initialize.
3. Open Safari Developer Tools.
4. Confirm the interfaces exist:

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

5. Confirm the default authorization state:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffAuthorizationStatus()
```

Confirm:

- `authorizationActive = false`
- `sessionId = null`
- `authorizationConsumed = false`
- `authorizationRevoked = false`
- `currentReadinessMatchesAuthorization = false`
- `rendererInitializationAllowed = false`
- `rendererAttachmentAllowed = false`
- `drawAllowed = false`
- all four canonical flags remain `false`

6. Confirm the approved Bellarine readiness result:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffReadiness()
```

Confirm:

- `diagnosticStatus = "resolved"`
- `reasonCode = "RESOLVED"`
- `rendererHandoffStatus = "ready_for_future_renderer_attachment"`
- `rendererConsumerAvailable = true`
- `rendererIdentityValidated = true`
- approved region, package, version, fingerprint, recipe, version, and selector seed all match

7. Try authorization with missing confirmation:

```js
window.GrowGoDeveloperDiagnostics
  .authorizeAtlasRendererHandoffSession()
```

Expected:

- blocked
- `reasonCode = "MISSING_CONFIRMATION"`

8. Try authorization with incorrect confirmation:

```js
window.GrowGoDeveloperDiagnostics
  .authorizeAtlasRendererHandoffSession({
    confirmation: "WRONG"
  })
```

Expected:

- blocked
- `reasonCode = "INVALID_CONFIRMATION"`

9. Authorize the exact approved readiness result:

```js
window.GrowGoDeveloperDiagnostics
  .authorizeAtlasRendererHandoffSession({
    confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"
  })
```

Confirm:

- `outcome = "authorized"`
- `reasonCode = "AUTHORIZED_RENDERER_HANDOFF_ONE_SESSION"`
- a non-null `sessionId` is returned
- bound region, package, version, fingerprint, recipe, version, and selector seed match the approved readiness result
- `rendererInitializationAllowed = true`
- `rendererAttachmentAllowed = true`
- `drawAllowed = true`
- renderer still remains inactive

10. Read authorization status again:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffAuthorizationStatus()
```

Confirm:

- `authorizationActive = true`
- `currentReadinessMatchesAuthorization = true`
- no consumption occurred
- no renderer work occurred

11. Move the map clearly outside approved scope, then run:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffReadiness()
```

and then:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffAuthorizationStatus()
```

Confirm:

- readiness fails closed with `REGION_OUT_OF_SCOPE`
- authorization remains bound to the original snapshot
- `currentReadinessMatchesAuthorization = false`
- no renderer work occurred

12. Return the map to the approved Bellarine coordinate and run:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffReadiness()
```

and then:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffAuthorizationStatus()
```

Confirm:

- readiness returns to resolved
- `currentReadinessMatchesAuthorization = true`
- no stale blocked state remains

13. Revoke authorization:

```js
window.GrowGoDeveloperDiagnostics
  .revokeAtlasRendererHandoffSession()
```

Confirm:

- `reasonCode = "REVOKED"` or equivalent successful revoke result
- next status shows inactive authorization
- no renderer work occurred

14. Run revoke again:

```js
window.GrowGoDeveloperDiagnostics
  .revokeAtlasRendererHandoffSession()
```

Confirm:

- idempotent safe result
- `reasonCode = "ALREADY_REVOKED"`

15. Hard reload the page and confirm:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasRendererHandoffAuthorizationStatus()
```

returns fresh unauthorized state with:

- `authorizationActive = false`
- `sessionId = null`
- `authorizationConsumed = false`
- no persisted authorization

16. Throughout the whole procedure confirm:

- no renderer initialization occurred
- no renderer attachment occurred
- no draw call occurred
- no canvas appeared
- no WebGL surface appeared
- no DOM overlay appeared
- no map listener was added
- no polling or timer activity appeared
- no Atlas network request occurred
- no asset download occurred
- normal Leaflet map behavior remained unchanged

## Structured Evidence Record

Recorded genuine Safari defect evidence:

```json
{
  "phaseId": "211.17",
  "executionStatus": "FAIL — READINESS_DRIFT_PERMISSION_RESTORED",
  "executionDateTime": "Saturday, August 1, 2026",
  "browserUsed": "Safari",
  "developmentPageAddress": "http://127.0.0.1:8000",
  "defectSessionId": "ATLAS_RENDERER_HANDOFF_ONE_SESSION_001",
  "initialApprovedAuthorizationState": {
    "authorizationActive": true,
    "authorizationConsumed": false,
    "currentReadinessMatchesAuthorization": true,
    "currentReadinessReasonCode": "READINESS_MATCHED",
    "rendererInitializationAllowed": true,
    "rendererAttachmentAllowed": true,
    "drawAllowed": true
  },
  "driftedAuthorizationState": {
    "currentReadinessMatchesAuthorization": false,
    "currentReadinessReasonCode": "REGION_OUT_OF_SCOPE",
    "rendererInitializationAllowed": false,
    "rendererAttachmentAllowed": false,
    "drawAllowed": false
  },
  "defectAfterReturningToApprovedScope": {
    "sessionIdStillActive": "ATLAS_RENDERER_HANDOFF_ONE_SESSION_001",
    "currentReadinessMatchesAuthorization": true,
    "rendererInitializationAllowed": true,
    "rendererAttachmentAllowed": true,
    "drawAllowed": true
  },
  "canonicalSafetyFlagSnapshot": {
    "runtimeExecutionEnabled": false,
    "mapAttachmentAllowed": false,
    "automaticRendererExecutionAllowed": false,
    "lifecycleExecutionEnabled": false
  },
  "operatorConfirmation": {
    "firstSafariAttemptDiscoveredDefect": true,
    "freshSafariRetestRequiredAfterPhase21117a": true
  }
}
```

## Correction Required

The authorization session must become permanently invalid for that session after the first readiness mismatch.

Returning to approved scope must not restore:

- `currentReadinessMatchesAuthorization`
- `rendererInitializationAllowed`
- `rendererAttachmentAllowed`
- `drawAllowed`

The developer must revoke and explicitly create a fresh session.

## Fresh Safari Retest Still Needed

After the 211.17a fix lands, a new Safari verification is required to confirm:

1. first drift permanently invalidates the active session
2. returning to approved readiness does not restore permission
3. explicit revoke clears invalidated state
4. a fresh explicit authorization gets a distinct new session ID
5. renderer remains asleep throughout

## Status Breakdown

- evidence template:
  - `COMPLETE`
- manual Safari verification:
-  `COMPLETE`
- first Safari attempt:
  - `FAIL — READINESS_DRIFT_PERMISSION_RESTORED`
- defect preserved:
  - `YES`
- fresh Safari retest required:
  - `YES`
- renderer inactivity:
  - `NOT_FULLY_REVIEWED_IN_THIS_RECORD`
- overall Phase 211.17:
  - `FAIL — READINESS_DRIFT_PERMISSION_RESTORED`
