# GROWGO SESSION 211.9 — MANUAL LOCALHOST ONE-SESSION ATLAS ATTACHMENT VERIFICATION

## Goal

Record the genuine Safari results proving one temporary Atlas attachment session worked, detached safely, revoked itself, and disappeared completely after page reload.

## Preflight

- current branch remained: `feature/atlas-phase-211-6-gated-map-attachment-controller`
- required Phase 211.8 commit confirmed:
  - `feat(atlas): add one-session developer attachment authorization`
- `git status --short` before closeout:
  - `?? GROWGO_SESSION_211_9_MANUAL_LOCALHOST_ONE_SESSION_ATLAS_ATTACHMENT_VERIFICATION.md`
  - `?? tests/client-manual-localhost-one-session-atlas-attachment-evidence.test.mjs`
- Phase 211.9 pending evidence template existed before closeout
- Phase 211.9 focused evidence-contract test existed before closeout
- application implementation changes in Phase 211.10 closeout: `none`

## Canonical Safety Truth

Canonical safety flags remained exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Existing Developer Interfaces

Verified on the live page:

- `window.GrowGoDeveloperDiagnostics.getAtlasMapAttachmentAuthorizationStatus()`
- `window.GrowGoDeveloperDiagnostics.authorizeAtlasMapAttachmentSession({ confirmation })`
- `window.GrowGoDeveloperDiagnostics.attachAtlasMapDiagnostic()`
- `window.GrowGoDeveloperDiagnostics.getAtlasMapAttachmentStatus()`
- `window.GrowGoDeveloperDiagnostics.detachAtlasMapDiagnostic()`
- `window.GrowGoDeveloperDiagnostics.revokeAtlasMapAttachmentSession()`
- exact confirmation token used for the one-session authorization:
  - `AUTHORIZE_ATLAS_ONE_SESSION`

## Manual Browser Target

- browser: `Safari`
- development page: `http://127.0.0.1:8000`
- execution date: `Saturday, August 1, 2026`

## Structured Evidence Record

```json
{
  "phaseId": "211.9",
  "executionStatus": "PASS",
  "executionDateTime": "Saturday, August 1, 2026",
  "browserUsed": "Safari",
  "developmentPageAddress": "http://127.0.0.1:8000",
  "initialAuthorizationStatus": {
    "schemaId": "ATLAS_MAP_ATTACHMENT_AUTHORIZATION_STATUS_001",
    "authorizationActive": false,
    "authorizationSource": "canonical",
    "localDevelopmentHost": true,
    "confirmationAccepted": false,
    "canonicalMapAttachmentAllowed": false,
    "effectiveMapAttachmentAllowed": false,
    "attachAllowed": false,
    "currentAttachmentState": false,
    "sessionId": null,
    "successfulAttachmentConsumed": false,
    "automaticAuthorization": false,
    "persistentAuthorization": false,
    "storageUsed": false
  },
  "preAuthorizationAttachResult": {
    "operation": "attach",
    "outcome": "blocked",
    "reasonCode": "MAP_ATTACHMENT_NOT_AUTHORIZED",
    "status": {
      "attached": false,
      "ownedListenerCount": 0
    }
  },
  "incorrectConfirmationResult": {
    "operation": "authorize",
    "outcome": "blocked",
    "reasonCode": "INVALID_CONFIRMATION",
    "authorizationStatus": {
      "authorizationActive": false,
      "authorizationSource": "canonical",
      "confirmationAccepted": false
    }
  },
  "successfulAuthorizationResult": {
    "operation": "authorize",
    "outcome": "authorized",
    "reasonCode": "AUTHORIZED_ONE_SESSION",
    "authorizationStatus": {
      "authorizationActive": true,
      "authorizationSource": "developer-one-session-local",
      "confirmationAccepted": true,
      "canonicalMapAttachmentAllowed": false,
      "effectiveMapAttachmentAllowed": true,
      "attachAllowed": true,
      "persistentAuthorization": false,
      "storageUsed": false
    }
  },
  "successfulAttachResult": {
    "operation": "attach",
    "outcome": "attached",
    "reasonCode": "ATTACHED",
    "status": {
      "attached": true,
      "listenerEventName": "moveend",
      "ownedListenerCount": 1
    }
  },
  "duplicateAttachResult": {
    "operation": "attach",
    "outcome": "noop",
    "reasonCode": "ALREADY_ATTACHED",
    "status": {
      "attached": true,
      "ownedListenerCount": 1
    }
  },
  "attachedBaselineBeforeMovement": {
    "attached": true,
    "ownedListenerCount": 1,
    "diagnosticInvocationCount": 0,
    "lastDiagnosticStatus": null,
    "lastReasonCode": null,
    "authorizationSource": "developer-one-session-local",
    "canonicalMapAttachmentAllowed": false,
    "effectiveMapAttachmentAllowed": true
  },
  "outOfScopeDiagnosticObservation": {
    "diagnosticStatus": "blocked",
    "reasonCode": "REGION_OUT_OF_SCOPE",
    "resolvedRegion": null,
    "resolvedPackage": null,
    "resolvedRecipe": null,
    "controllerRemainedAttached": true,
    "ownedListenerCountRemained": 1
  },
  "approvedBellarineCoastDiagnostic": {
    "coordinate": {
      "latitude": -38.12436167080344,
      "longitude": 144.609432220459,
      "latBucket": -38.12,
      "lngBucket": 144.61
    },
    "diagnosticStatus": "resolved",
    "reasonCode": "RESOLVED",
    "resolvedRegion": {
      "regionId": "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
      "environmentProfile": "COASTAL_EXPLORATION"
    },
    "resolvedPackage": {
      "packageId": "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
      "packageVersion": "v001"
    },
    "resolvedRecipe": {
      "recipeId": "COASTAL_LOCATION_RECIPE_001",
      "selectedVersion": "v001",
      "confidenceScore": 100,
      "fallbackApplied": false
    }
  },
  "controlledEventProof": {
    "beforeExplicitMoveend": {
      "diagnosticInvocationCount": 42,
      "ownedListenerCount": 1
    },
    "explicitEvent": "getGrowGoMap().fire(\"moveend\")",
    "afterExplicitMoveend": {
      "diagnosticInvocationCount": 43,
      "ownedListenerCount": 1,
      "attached": true,
      "lastDiagnosticStatus": "resolved",
      "lastReasonCode": "RESOLVED"
    }
  },
  "detachResult": {
    "operation": "detach",
    "outcome": "detached",
    "reasonCode": "DETACHED",
    "status": {
      "attached": false,
      "ownedListenerCount": 0
    }
  },
  "postDetachAuthorizationStatus": {
    "authorizationActive": false,
    "authorizationSource": "canonical",
    "confirmationAccepted": false,
    "effectiveMapAttachmentAllowed": false,
    "attachAllowed": false
  },
  "reattachWithoutReauthorizationResult": {
    "operation": "attach",
    "outcome": "blocked",
    "reasonCode": "MAP_ATTACHMENT_NOT_AUTHORIZED",
    "status": {
      "attached": false,
      "ownedListenerCount": 0
    }
  },
  "repeatedDetachResult": {
    "operation": "detach",
    "outcome": "noop",
    "reasonCode": "ALREADY_DETACHED",
    "status": {
      "attached": false,
      "ownedListenerCount": 0
    }
  },
  "postReloadAuthorizationStatus": {
    "schemaId": "ATLAS_MAP_ATTACHMENT_AUTHORIZATION_STATUS_001",
    "authorizationActive": false,
    "authorizationSource": "canonical",
    "localDevelopmentHost": true,
    "confirmationAccepted": false,
    "canonicalMapAttachmentAllowed": false,
    "effectiveMapAttachmentAllowed": false,
    "attachAllowed": false,
    "currentAttachmentState": false,
    "sessionId": null,
    "successfulAttachmentConsumed": false,
    "automaticAuthorization": false,
    "persistentAuthorization": false,
    "storageUsed": false
  },
  "postReloadControllerStatus": {
    "schemaId": "ATLAS_MAP_ATTACHMENT_CONTROLLER_STATUS_001",
    "attached": false,
    "authorizationState": {
      "source": "canonical",
      "seamApplied": false,
      "canonicalMapAttachmentAllowed": false,
      "effectiveMapAttachmentAllowed": false,
      "attachAllowed": false
    },
    "listenerEventName": "moveend",
    "ownedListenerCount": 0,
    "diagnosticInvocationCount": 0,
    "lastDiagnosticStatus": null,
    "lastReasonCode": null,
    "automaticStartupAttachment": false,
    "livePageDetachedByDefault": true,
    "rendererActivity": false,
    "overlayActivity": false,
    "networkActivity": false,
    "pollingOrTimerActivity": false
  },
  "canonicalSafetyFlagSnapshot": {
    "runtimeExecutionEnabled": false,
    "mapAttachmentAllowed": false,
    "automaticRendererExecutionAllowed": false,
    "lifecycleExecutionEnabled": false
  },
  "approvedDeveloperOnlyScope": {
    "regionId": "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
    "packageId": "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
    "recipeId": "COASTAL_LOCATION_RECIPE_001",
    "internalDeveloperOnly": true
  },
  "operatorConfirmation": {
    "oneTemporaryLocalAuthorizationCreated": true,
    "oneControllerOwnedMoveendListenerAttached": true,
    "duplicateAttachAddedNoSecondListener": true,
    "approvedScopeResolvedCorrectly": true,
    "unsupportedScopeFailedClosed": true,
    "oneExplicitlyEmittedMoveendCausedExactlyOneDiagnostic": true,
    "detachRemovedTheExactControllerListener": true,
    "detachRevokedTheTemporaryAuthorization": true,
    "reattachmentWithoutAuthorizationBlocked": true,
    "repeatedDetachSafe": true,
    "pageReloadRestoredFreshUnauthorizedState": true,
    "authorizationDidNotPersist": true,
    "rendererActivated": false,
    "canvasWebglOrDomOverlayAppeared": false,
    "atlasNetworkRequestOccurred": false
  }
}
```

## Honest Browser Observation

Normal map movements emitted multiple Leaflet `moveend` events during testing, so the accumulated invocation count increased more than once during ordinary navigation. The explicit controlled event proved exactly one diagnostic invocation for one emitted `moveend` event, while the controller continued to own exactly one listener.

## Evidence Status

- evidence template: `COMPLETE`
- contract tests: `PASS`
- initial authorization status: `VERIFIED`
- pre-authorization attach denial: `VERIFIED`
- incorrect confirmation block: `VERIFIED`
- one-session authorization: `VERIFIED`
- single-listener attachment: `VERIFIED`
- duplicate attach no-op: `VERIFIED`
- movement-triggered diagnostics: `VERIFIED`
- detach and relock behaviour: `VERIFIED`
- reload resets authorization and controller state: `VERIFIED`
- overall Phase 211.9: `PASS`

## Completion Truth

At the current truthful state:

- application implementation changes for Phase 211.10 closeout: `none`
- real browser evidence recorded: `yes`
- overall Phase 211.9: `PASS`
