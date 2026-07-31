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
- approved live diagnostic: `PENDING`
- unsupported live diagnostic: `PENDING`
- no-automatic-invocation observation: `PENDING`
- overall phase: `PENDING_MANUAL_OPERATOR_EVIDENCE`

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

Paste real browser evidence into this record after manual execution.

```json
{
  "phaseId": "211.5",
  "executionStatus": "PENDING_MANUAL_OPERATOR_EVIDENCE",
  "executionDateTime": "PENDING",
  "browserUsed": "PENDING",
  "developmentPageAddress": "PENDING",
  "approvedCoordinate": {
    "latitude": -38.12,
    "longitude": 144.61
  },
  "approvedDiagnosticStatus": "PENDING",
  "approvedDiagnosticResult": "PASTE_COMPLETE_CONSOLE_RESULT_HERE",
  "unsupportedCoordinate": {
    "latitude": "PENDING_MANUAL_OPERATOR_VALUE",
    "longitude": "PENDING_MANUAL_OPERATOR_VALUE"
  },
  "unsupportedDiagnosticStatus": "PENDING",
  "unsupportedDiagnosticResult": "PASTE_COMPLETE_CONSOLE_RESULT_HERE",
  "panZoomObservationStatus": "PENDING",
  "panZoomObservation": {
    "automaticAtlasInvocationObserved": "PENDING",
    "atlasListenerInstalled": "PENDING",
    "pollingOrTimerObserved": "PENDING",
    "rendererActivated": "PENDING",
    "newCanvasObserved": "PENDING",
    "newDomOverlayObserved": "PENDING",
    "normalMapBehaviourUnchanged": "PENDING"
  },
  "safetyFlagSnapshot": {
    "runtimeExecutionEnabled": false,
    "mapAttachmentAllowed": false,
    "automaticRendererExecutionAllowed": false,
    "lifecycleExecutionEnabled": false
  },
  "operatorConfirmation": "PENDING"
}
```

## Paste-Back Requirements

To complete this phase, paste back all of the following:

1. browser used
2. development page address
3. complete console result from:

```js
window.GrowGoDeveloperDiagnostics
  .getAtlasDiagnosticForCurrentMapCentre()
```

when the map is centred at `-38.12, 144.61`

4. complete console result from the same diagnostic after moving clearly outside the approved region
5. one short confirmation covering:
   - no automatic Atlas invocation after pan/zoom
   - no listener installation observed
   - no renderer activation
   - no new Canvas or DOM overlay
   - normal map behaviour unchanged

## Validation Rules

The phase may be marked `PASS` only when all of the following are real observed browser evidence:

- approved-centre live diagnostic: `VERIFIED`
- unsupported-centre live diagnostic: `VERIFIED`
- no-automatic-invocation observation: `VERIFIED`

Until then, the correct phase status remains:

- `PENDING_MANUAL_OPERATOR_EVIDENCE`

## Safety Flags

These must remain exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Current Truth

At the end of this Codex phase:

- evidence template is ready
- contract tests are still passing
- no application code was changed
- no browser results have been fabricated
- real manual execution evidence is still required
