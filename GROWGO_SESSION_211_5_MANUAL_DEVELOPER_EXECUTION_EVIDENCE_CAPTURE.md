# GROWGO SESSION 211.5 — MANUAL DEVELOPER EXECUTION EVIDENCE CAPTURE

## Goal

Capture real browser evidence for the existing developer-only live-map Atlas diagnostic without adding automatic attachment, listeners, renderer work, or new Atlas functionality.

## Verification Scope

This phase is verification-only.

Already implemented and contract-tested:

- `window.GrowGoDeveloperDiagnostics.getGrowGoMap()`
- `window.GrowGoDeveloperDiagnostics.getAtlasDiagnosticForCurrentMapCentre()`

Known browser automation limitation:

- Playwright WebKit in this host environment is `BLOCKED_BY_HOST_BROWSER_LAUNCH_FAILURE`
- no automated browser proof is claimed in this phase
- do not fabricate browser results

## Contract Test Status

- Phase 211.1 through 211.4 focused tests: `PASS`
- application code changes in Phase 211.5: `NO`

## Evidence Status

- contract tests: `PASS`
- evidence template: `COMPLETE`
- approved live diagnostic: `VERIFIED`
- unsupported live diagnostic: `VERIFIED`
- no-automatic-invocation observation: `VERIFIED`
- overall phase: `PASS`

## Required Manual Browser Procedure

Use the existing GrowGo development page in the user’s normal browser.

1. Start the existing GrowGo development page using the repository’s established local workflow.
2. Wait until the Leaflet map is fully initialized.
3. Open browser Developer Tools.
4. Run:

```js
window.GrowGoDeveloperDiagnostics.getGrowGoMap()
```

5. Confirm it returns the existing Leaflet map instance.
6. Centre the map at the approved test coordinate:
   - latitude: `-38.12`
   - longitude: `144.61`
7. Run:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasDiagnosticForCurrentMapCentre()
```

8. Copy the complete returned diagnostic into the approved result section below.
9. Move the map clearly outside the approved region.
10. Run the same diagnostic again.
11. Copy the complete returned diagnostic into the unsupported result section below.
12. Pan and zoom several times without invoking the diagnostic again.
13. Confirm no Atlas diagnostic runs automatically, no Atlas listener appears, no polling or timer starts, no renderer activates, no new Canvas or DOM overlay appears, and normal map behaviour remains unchanged.

## Expected Approved Result

The approved-centre diagnostic must confirm:

- `diagnosticStatus = resolved`
- `regionId = REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION`
- `packageId = ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001`
- `recipeId = COASTAL_LOCATION_RECIPE_001`

## Expected Unsupported Result

The unsupported-centre diagnostic must confirm:

- `diagnosticStatus = blocked`
- `reasonCode = REGION_OUT_OF_SCOPE`

## Structured Evidence Record

Recorded genuine manual Safari browser evidence:

```json
{
  "phaseId": "211.5",
  "executionStatus": "PASS",
  "executionDateTime": "2026-07-31",
  "browserUsed": "Safari",
  "developmentPageAddress": "http://127.0.0.1:8000",
  "approvedCoordinate": {
    "latitude": -38.11993893426189,
    "longitude": 144.61003303527835
  },
  "approvedDiagnosticStatus": "VERIFIED",
  "approvedDiagnosticResult": {
    "schemaId": "ATLAS_LIVE_MAP_CENTRE_DIAGNOSTIC_RESULT_001",
    "diagnosticStatus": "resolved",
    "reasonCode": "RESOLVED",
    "coordinate": {
      "latitude": -38.11993893426189,
      "longitude": 144.61003303527835
    },
    "latBucket": -38.12,
    "lngBucket": 144.61,
    "resolvedRegion": {
      "regionId": "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION"
    },
    "resolvedPackage": {
      "packageId": "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
      "packageVersion": "v001"
    },
    "resolvedRecipe": {
      "recipeId": "COASTAL_LOCATION_RECIPE_001",
      "selectedVersion": "v001"
    },
    "confidenceScore": 100,
    "fallbackApplied": false
  },
  "unsupportedCoordinate": {
    "latitude": "MANUALLY_MOVED_OUTSIDE_APPROVED_REGION",
    "longitude": "MANUALLY_MOVED_OUTSIDE_APPROVED_REGION"
  },
  "unsupportedDiagnosticStatus": "VERIFIED",
  "unsupportedDiagnosticResult": {
    "diagnosticStatus": "blocked",
    "reasonCode": "REGION_OUT_OF_SCOPE"
  },
  "panZoomObservationStatus": "VERIFIED",
  "panZoomObservation": {
    "automaticAtlasInvocationObserved": false,
    "atlasListenerInstalled": false,
    "pollingOrTimerObserved": false,
    "rendererActivated": false,
    "newCanvasObserved": false,
    "newDomOverlayObserved": false,
    "normalMapBehaviourUnchanged": true
  },
  "safetyFlagSnapshot": {
    "runtimeExecutionEnabled": false,
    "mapAttachmentAllowed": false,
    "automaticRendererExecutionAllowed": false,
    "lifecycleExecutionEnabled": false
  },
  "operatorConfirmation": "YES"
}
```

## Verified Browser Results

Recorded browser:

- `Safari`
- page: `http://127.0.0.1:8000`

Approved-centre live diagnostic verified:

- `schemaId = ATLAS_LIVE_MAP_CENTRE_DIAGNOSTIC_RESULT_001`
- `diagnosticStatus = resolved`
- `reasonCode = RESOLVED`
- `coordinate latitude = -38.11993893426189`
- `coordinate longitude = 144.61003303527835`
- `latBucket = -38.12`
- `lngBucket = 144.61`
- `regionId = REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION`
- `packageId = ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001`
- `packageVersion = v001`
- `recipeId = COASTAL_LOCATION_RECIPE_001`
- `selectedVersion = v001`
- `confidenceScore = 100`
- `fallbackApplied = false`

Unsupported live diagnostic verified:

- `diagnosticStatus = blocked`
- `reasonCode = REGION_OUT_OF_SCOPE`

Pan/zoom observation verified:

- no automatic Atlas invocation
- no Atlas listener installation
- no polling or timer activity
- no renderer activation
- no new overlay
- normal map behaviour unchanged

## Non-Blocking External / Local Environment Observations

These live-session observations were present in Safari during the manual verification session and are classified as non-blocking external or local-environment conditions for Phase 211.5:

- Firebase Auth Emulator at `127.0.0.1:9099` was unavailable
- Firebase Functions Emulator at `127.0.0.1:5003` was unavailable
- public Overpass requests returned `429 Too Many Requests`
- some OpenStreetMap tile requests at zoom `20` returned `400`
- `favicon.ico` returned `404`

These observations did not prevent:

- the live Leaflet map getter from returning the existing map
- explicit Atlas diagnostic invocation
- approved-region resolution
- out-of-scope fail-closed verification
- confirmation that Atlas added no listeners, renderer work, polling, or overlays

No Atlas or map application code changes are required from these observations for Phase 211.5.

## Validation Rules

The phase is correctly marked `PASS` because all of the following are real observed browser evidence:

- approved-centre live diagnostic: `VERIFIED`
- unsupported-centre live diagnostic: `VERIFIED`
- no-automatic-invocation observation: `VERIFIED`

## Safety Flags

These must remain exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Current Truth

At the end of this Codex phase:

- evidence record is complete
- contract tests are still passing
- no application code was changed
- no browser results have been fabricated
- real manual execution evidence has been recorded
