# GROWGO SESSION 211.4 — MANUAL LIVE-PAGE ATLAS DIAGNOSTIC VERIFICATION PROCEDURE

## Goal

Prove the existing developer-only live-map-centre Atlas diagnostic can be invoked safely from the real GrowGo page without creating automatic map attachment.

## Current Verified Interfaces

Available after page initialization:

- `window.GrowGoDeveloperDiagnostics.getGrowGoMap()`
- `window.GrowGoDeveloperDiagnostics.getAtlasDiagnosticForCurrentMapCentre()`

Safety flags must remain:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Established Local Page Workflow

The repository already supports two valid local page workflows:

1. Open [`index.html`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/index.html) directly in a browser.
2. Serve the repo root with a simple static web server, then open the page in the browser.

The README confirms both paths.

## Exact Manual Browser Steps

1. Open the GrowGo page using one of the established local workflows:
   - direct open of [`index.html`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/index.html), or
   - local static server from the repo root
2. Wait for the page to finish loading.
3. Wait for the live Leaflet map to appear and become interactive.
4. Open browser developer tools.
5. Run:

```js
window.GrowGoDeveloperDiagnostics.getGrowGoMap()
```

6. Confirm the returned value is the existing Leaflet map object:
   - not `null`
   - has `getCenter()`
   - has normal Leaflet methods such as `panTo()` or `setView()`
7. Without moving the map yet, run:

```js
window.GrowGoDeveloperDiagnostics.getAtlasDiagnosticForCurrentMapCentre()
```

8. Capture the returned structured result.
9. Confirm that when the map is centred in the approved area, the result is:
   - `diagnosticStatus: "resolved"`
   - `resolvedRegion.regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION"`
   - `resolvedPackage.packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001"`
   - `resolvedRecipe.recipeId: "COASTAL_LOCATION_RECIPE_001"`
10. Manually pan the map outside the approved area.
11. Run again:

```js
window.GrowGoDeveloperDiagnostics.getAtlasDiagnosticForCurrentMapCentre()
```

12. Confirm the second result fails closed:
   - `diagnosticStatus: "blocked"`
   - `reasonCode: "REGION_OUT_OF_SCOPE"`
13. After that, pan or zoom again without calling the diagnostic.
14. Confirm no Atlas diagnostic runs automatically, no overlay is drawn, and no extra map behaviour appears.

## Live-Page Verification Checklist

Use this exact checklist during manual review:

- page loaded successfully
- live Leaflet map visible
- `window.GrowGoDeveloperDiagnostics` exists
- `getGrowGoMap()` exists
- `getAtlasDiagnosticForCurrentMapCentre()` exists
- `getGrowGoMap()` returns current Leaflet map instance
- approved centre resolves expected region
- approved centre resolves expected package
- approved centre resolves expected recipe
- unsupported centre fails closed
- pan alone does not trigger Atlas
- zoom alone does not trigger Atlas
- no listeners were added by the Atlas bridge
- no map mutation caused by diagnostic calls
- no renderer work
- no network request from the bridge path
- all safety flags remain false

## Developer Diagnostic Result Capture Format

Record live-page manual evidence in this format:

```json
{
  "pageWorkflow": "direct-index-open | static-server",
  "pageLoaded": true,
  "mapInitialized": true,
  "getterAvailable": true,
  "centreDiagnosticAvailable": true,
  "approvedCentreResult": {
    "diagnosticStatus": "resolved",
    "resolvedRegionId": "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
    "resolvedPackageId": "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
    "resolvedRecipeId": "COASTAL_LOCATION_RECIPE_001"
  },
  "unsupportedCentreResult": {
    "diagnosticStatus": "blocked",
    "reasonCode": "REGION_OUT_OF_SCOPE"
  },
  "automaticInvocationObservedAfterPan": false,
  "automaticInvocationObservedAfterZoom": false,
  "mapMutationObserved": false,
  "rendererWorkObserved": false,
  "bridgeNetworkRequestObserved": false,
  "safetyFlags": {
    "runtimeExecutionEnabled": false,
    "mapAttachmentAllowed": false,
    "automaticRendererExecutionAllowed": false,
    "lifecycleExecutionEnabled": false
  },
  "notes": ""
}
```

## Fail-Closed Unsupported-Centre Procedure

Use this exact unsupported-area check:

1. Start from a successful approved-centre diagnostic.
2. Pan the live map clearly away from the approved Bellarine coast centre.
3. Re-run:

```js
window.GrowGoDeveloperDiagnostics.getAtlasDiagnosticForCurrentMapCentre()
```

4. Confirm:

```json
{
  "diagnosticStatus": "blocked",
  "reasonCode": "REGION_OUT_OF_SCOPE"
}
```

5. If any resolved recipe is returned outside the approved area, stop and treat it as a regression.

## Focused Automated Verification Added

Added:

- [tests/client-live-map-atlas-diagnostic-procedure-contract.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-live-map-atlas-diagnostic-procedure-contract.test.mjs)
- [tests/live-map-atlas-diagnostic-manual-webkit-check.js](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/live-map-atlas-diagnostic-manual-webkit-check.js)

What is automatically verified here:

- the procedure references the exact live developer calls
- the fail-closed expectation is documented
- the manual harness uses the repository’s existing local page pattern
- the manual harness stays explicit-only
- the bridge remains non-listening and non-polling

## Browser-Level Verification Practicality

A real browser harness was added using the repository’s existing lightweight WebKit pattern.

In this Codex environment:

- direct local HTTP serving was blocked by sandbox binding permissions
- file-based page opening was attempted instead
- Playwright WebKit launch aborted before page verification could complete

That means:

- browser-level live-page verification procedure is prepared
- focused contract tests passed
- real manual browser execution is still the authoritative verification path for this phase

## Expected Approved-Centre Result

```json
{
  "diagnosticStatus": "resolved",
  "resolvedRegion": {
    "regionId": "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION"
  },
  "resolvedPackage": {
    "packageId": "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001"
  },
  "resolvedRecipe": {
    "recipeId": "COASTAL_LOCATION_RECIPE_001"
  }
}
```

## Expected Unsupported-Centre Result

```json
{
  "diagnosticStatus": "blocked",
  "reasonCode": "REGION_OUT_OF_SCOPE"
}
```

## Non-Automatic Behaviour Confirmation

This phase preserves:

- no startup diagnostic invocation
- no pan-triggered diagnostic invocation
- no zoom-triggered diagnostic invocation
- no listener-based map attachment
- no renderer handoff
- no runtime flag change
