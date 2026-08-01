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
  - `PASS`

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

Recorded genuine Safari retest results:

```json
{
  "phaseId": "211.17b",
  "executionStatus": "PASS",
  "executionDateTime": "2026-08-01T00:00:00+10:00",
  "browserUsed": "Safari",
  "developmentPageAddress": "http://127.0.0.1:8000",
  "supportingEnvironmentWarning": {
    "http429Observed": true,
    "classification": "NON_BLOCKING_SUPPORTING_ENVIRONMENT_WARNING",
    "developerInterfacesLoadedCorrectly": true
  },
  "interfaceAvailability": [
    "function",
    "function",
    "function",
    "function"
  ],
  "initialAuthorizationStatus": {
    "schemaId": "ATLAS_RENDERER_HANDOFF_AUTHORIZATION_STATUS_001",
    "authorizationActive": false,
    "authorizationConsumed": false,
    "authorizationInvalidated": false,
    "authorizationRevoked": false,
    "authorizationSource": "canonical",
    "approvedReadinessBound": false,
    "sessionId": null,
    "rendererInitializationAllowed": false,
    "rendererAttachmentAllowed": false,
    "drawAllowed": false,
    "rendererInitialized": false,
    "rendererAttached": false,
    "drawRequested": false,
    "canvasCreated": false,
    "webglContextCreated": false,
    "overlayCreated": false,
    "listenerAdded": false,
    "networkRequested": false,
    "assetDownloadRequested": false,
    "persistentAuthorization": false,
    "storageUsed": false
  },
  "approvedReadinessResult": {
    "coordinate": {
      "latitude": -38.12,
      "longitude": 144.61,
      "latBucket": -38.12,
      "lngBucket": 144.61
    },
    "diagnosticStatus": "resolved",
    "reasonCode": "RESOLVED",
    "rendererHandoffStatus": "ready_for_future_renderer_attachment",
    "rendererConsumerAvailable": true,
    "rendererIdentityValidated": true,
    "regionId": "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
    "packageId": "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
    "packageVersion": "v001",
    "packageFingerprint": "94c447ae7b3c888b3df618ad2f1f45cf3ea9e7d0282cd49c2d56ed94fff06aed",
    "recipeId": "COASTAL_LOCATION_RECIPE_001",
    "recipeVersion": "v001",
    "selectorSeed": "baf38e127eee1e320570e2f02fc889cd1aaec4b9dfd7bee85bba4f10f30b6da0"
  },
  "successfulAuthorizationResult": {
    "operation": "authorize",
    "outcome": "authorized",
    "reasonCode": "AUTHORIZED_RENDERER_HANDOFF_ONE_SESSION",
    "sessionId": "ATLAS_RENDERER_HANDOFF_ONE_SESSION_001"
  },
  "sessionOneAuthorizedStatus": {
    "authorizationActive": true,
    "authorizationConsumed": false,
    "authorizationInvalidated": false,
    "approvedReadinessBound": true,
    "currentReadinessMatchesAuthorization": true,
    "currentReadinessReasonCode": "READINESS_MATCHED",
    "rendererInitializationAllowed": true,
    "rendererAttachmentAllowed": true,
    "drawAllowed": true,
    "rendererInitialized": false,
    "rendererAttached": false,
    "drawRequested": false,
    "canvasCreated": false,
    "webglContextCreated": false,
    "overlayCreated": false,
    "listenerAdded": false,
    "networkRequested": false,
    "assetDownloadRequested": false
  },
  "outOfScopeReadinessResult": {
    "coordinate": {
      "latitude": -38.45,
      "longitude": 145.22
    },
    "diagnosticStatus": "blocked",
    "reasonCode": "REGION_OUT_OF_SCOPE",
    "rendererHandoffStatus": "blocked",
    "resolvedRegion": null,
    "resolvedPackage": null,
    "resolvedRecipe": null,
    "selectorSeed": null
  },
  "sessionOneDriftedStatus": {
    "sessionId": "ATLAS_RENDERER_HANDOFF_ONE_SESSION_001",
    "authorizationActive": true,
    "authorizationInvalidated": true,
    "authorizationConsumed": false,
    "currentReadinessMatchesAuthorization": false,
    "currentReadinessReasonCode": "REGION_OUT_OF_SCOPE",
    "invalidationReasonCode": "REGION_OUT_OF_SCOPE",
    "invalidatedAtReadinessReasonCode": "REGION_OUT_OF_SCOPE",
    "rendererInitializationAllowed": false,
    "rendererAttachmentAllowed": false,
    "drawAllowed": false,
    "rendererInitialized": false,
    "rendererAttached": false,
    "drawRequested": false
  },
  "restoredApprovedReadinessResult": {
    "coordinate": {
      "latitude": -38.12,
      "longitude": 144.61
    },
    "diagnosticStatus": "resolved",
    "reasonCode": "RESOLVED",
    "rendererHandoffStatus": "ready_for_future_renderer_attachment",
    "rendererConsumerAvailable": true,
    "rendererIdentityValidated": true
  },
  "sessionOneStillInvalidAfterReturnStatus": {
    "sessionId": "ATLAS_RENDERER_HANDOFF_ONE_SESSION_001",
    "authorizationInvalidated": true,
    "currentReadinessMatchesAuthorization": false,
    "currentReadinessReasonCode": "REGION_OUT_OF_SCOPE",
    "invalidationReasonCode": "REGION_OUT_OF_SCOPE",
    "invalidatedAtReadinessReasonCode": "REGION_OUT_OF_SCOPE",
    "rendererInitializationAllowed": false,
    "rendererAttachmentAllowed": false,
    "drawAllowed": false
  },
  "repeatedStatusInspectionResult": {
    "operation": "authorize",
    "outcome": "noop",
    "reasonCode": "ALREADY_AUTHORIZED",
    "sessionOneNotRepaired": true,
    "replacementSessionCreated": false
  },
  "sessionOneRevokeResult": {
    "revoke": {
      "operation": "revoke",
      "outcome": "revoked",
      "reasonCode": "REVOKED",
      "authorizationActive": false,
      "authorizationSource": "canonical"
    },
    "repeatedRevoke": {
      "operation": "revoke",
      "outcome": "noop",
      "reasonCode": "ALREADY_REVOKED",
      "authorizationActive": false
    }
  },
  "sessionTwoAuthorizationResult": {
    "operation": "authorize",
    "outcome": "authorized",
    "reasonCode": "AUTHORIZED_RENDERER_HANDOFF_ONE_SESSION",
    "sessionId": "ATLAS_RENDERER_HANDOFF_ONE_SESSION_002"
  },
  "sessionTwoFreshStatus": {
    "authorizationActive": true,
    "authorizationConsumed": false,
    "authorizationInvalidated": false,
    "currentReadinessMatchesAuthorization": true,
    "currentReadinessReasonCode": "READINESS_MATCHED",
    "rendererInitializationAllowed": true,
    "rendererAttachmentAllowed": true,
    "drawAllowed": true,
    "rendererInitialized": false,
    "rendererAttached": false,
    "drawRequested": false,
    "canvasCreated": false,
    "webglContextCreated": false,
    "overlayCreated": false,
    "listenerAdded": false,
    "networkRequested": false,
    "assetDownloadRequested": false,
    "sessionOneId": "ATLAS_RENDERER_HANDOFF_ONE_SESSION_001",
    "sessionTwoId": "ATLAS_RENDERER_HANDOFF_ONE_SESSION_002",
    "distinctIdentity": true,
    "inheritedInvalidation": false
  },
  "sessionTwoRevokeResult": {
    "operation": "revoke",
    "outcome": "revoked",
    "reasonCode": "REVOKED",
    "authorizationActive": false,
    "authorizationSource": "canonical"
  },
  "postReloadAuthorizationStatus": {
    "authorizationActive": false,
    "authorizationConsumed": false,
    "authorizationInvalidated": false,
    "authorizationRevoked": false,
    "approvedReadinessBound": false,
    "sessionId": null,
    "rendererInitializationAllowed": false,
    "rendererAttachmentAllowed": false,
    "drawAllowed": false,
    "rendererInitialized": false,
    "rendererAttached": false,
    "drawRequested": false,
    "persistentAuthorization": false,
    "storageUsed": false
  },
  "postReloadAtlasAttachmentStatus": {
    "schemaId": "ATLAS_MAP_ATTACHMENT_CONTROLLER_STATUS_001",
    "attached": false,
    "ownedListenerCount": 0,
    "diagnosticInvocationCount": 0,
    "lastDiagnosticStatus": null,
    "lastReasonCode": null,
    "rendererActivity": false,
    "overlayActivity": false,
    "networkActivity": false,
    "pollingOrTimerActivity": false,
    "automaticStartupAttachment": false,
    "livePageDetachedByDefault": true
  },
  "canonicalSafetyFlagSnapshot": {
    "runtimeExecutionEnabled": false,
    "mapAttachmentAllowed": false,
    "automaticRendererExecutionAllowed": false,
    "lifecycleExecutionEnabled": false
  },
  "operatorConfirmation": {
    "sessionOneAuthorizedSuccessfully": true,
    "regionOutOfScopePermanentlyInvalidatedSessionOne": true,
    "permissionDidNotHealAfterReturningToApprovedScope": true,
    "duplicateAuthorizationDidNotRepairOrReplaceSessionOne": true,
    "explicitRevokeClearedSessionOne": true,
    "repeatedRevokeWasSafe": true,
    "freshSessionUsedDistinctSessionId": true,
    "sessionTwoInheritedNoInvalidation": true,
    "sessionTwoRevokeSucceeded": true,
    "reloadRestoredCleanUnauthorizedState": true,
    "noPermissionPersisted": true,
    "noRendererInitializationOccurred": true,
    "noRendererAttachmentOccurred": true,
    "noDrawingOccurred": true,
    "noCanvasAppeared": true,
    "noWebglSurfaceAppeared": true,
    "noDomOverlayAppeared": true,
    "noListenerWasAdded": true,
    "noPollingOrTimerActivityAppeared": true,
    "noNetworkRequestOccurred": true,
    "noAssetDownloadOccurred": true,
    "normalLeafletMapBehaviorRemainedUnchanged": true
  }
}
```

## Verified Manual Evidence Summary

- Session 1 authorized successfully for the approved Bellarine readiness.
- Moving out of scope to `-38.45, 145.22` permanently invalidated Session 1 with `REGION_OUT_OF_SCOPE`.
- Returning to the approved Bellarine coordinate restored readiness but did not repair Session 1.
- Duplicate authorization before revoke returned `ALREADY_AUTHORIZED` and did not create a replacement session.
- Explicit revoke cleared Session 1, and repeated revoke remained safe.
- Session 2 required fresh explicit authorization, received a distinct session ID, and inherited no invalidation.
- Reload restored a clean unauthorized state with no persistence.
- Renderer activity remained fully asleep throughout.

## Status Breakdown

- evidence template:
  - `COMPLETE`
- manual Safari retest:
  - `VERIFIED`
- drift invalidation:
  - `VERIFIED`
- no automatic permission restoration:
  - `VERIFIED`
- fresh-session recovery:
  - `VERIFIED`
- renderer inactivity:
  - `VERIFIED`
- overall Phase 211.17b:
  - `PASS`
