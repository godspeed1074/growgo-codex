# GROWGO SESSION 211.3 — EXPLICIT DEVELOPER-ONLY LIVE MAP CENTRE ATLAS DIAGNOSTIC BRIDGE

## Goal

Create the smallest explicit developer-only bridge from the existing live Leaflet map centre into the Atlas diagnostic adapter.

## What Was Implemented

Developer-facing function:

- `window.GrowGoDeveloperDiagnostics.getAtlasDiagnosticForCurrentMapCentre()`

Flow:

- explicit manual developer call
- `getGrowGoMap()`
- `map.getCenter()`
- `{ latitude, longitude }`
- Atlas diagnostic adapter
- immutable structured diagnostic result

## Architecture

### Existing live map owner

- top-level `let map;` in [`script.js`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/script.js:12201)
- created inside `initMap()` in [`script.js`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/script.js:275623)

### Existing explicit getter

- `getGrowGoMap()` remains owner-adjacent in [`script.js`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/script.js:12208)

### New bridge

- bridge implementation in [client/developer-only-live-map-centre-atlas-bridge.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-live-map-centre-atlas-bridge.mjs:51)
- developer namespace installation in [client/development-alpha-app.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/development-alpha-app.mjs:10)

### Atlas adapter reuse

- shared adapter core in [client/developer-only-atlas-map-adapter-core.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-map-adapter-core.mjs:314)
- file-backed Node adapter kept in [client/developer-only-atlas-map-adapter.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-map-adapter.mjs:83)
- browser-safe approved-scope contract in [client/developer-only-atlas-browser-contract.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-browser-contract.mjs:1)

## Behaviour

The explicit bridge:

- runs only when manually called
- fails closed when no live map exists
- fails closed when `getCenter()` is missing
- fails closed when `getCenter()` returns malformed coordinates
- reads the live centre exactly once per call
- reuses the Atlas adapter seam
- adds no listeners
- performs no map mutation
- performs no renderer work
- performs no network requests
- preserves existing map startup and lifecycle behaviour

## Sample successful result shape

```json
{
  "schemaId": "ATLAS_LIVE_MAP_CENTRE_DIAGNOSTIC_RESULT_001",
  "diagnosticStatus": "resolved",
  "reasonCode": "RESOLVED",
  "coordinate": {
    "latitude": -38.12,
    "longitude": 144.61,
    "latBucket": -38.12,
    "lngBucket": 144.61
  },
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
}
```

## Files Changed

- [client/developer-only-atlas-map-adapter-core.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-map-adapter-core.mjs:1)
- [client/developer-only-atlas-map-adapter.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-map-adapter.mjs:1)
- [client/developer-only-atlas-browser-contract.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-browser-contract.mjs:1)
- [client/developer-only-live-map-centre-atlas-bridge.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-live-map-centre-atlas-bridge.mjs:1)
- [client/development-alpha-app.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/development-alpha-app.mjs:1)
- [tests/client-developer-only-live-map-centre-atlas-bridge.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-live-map-centre-atlas-bridge.test.mjs:1)
- [GROWGO_SESSION_211_3_EXPLICIT_DEVELOPER_ONLY_LIVE_MAP_CENTRE_ATLAS_DIAGNOSTIC_BRIDGE.md](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_211_3_EXPLICIT_DEVELOPER_ONLY_LIVE_MAP_CENTRE_ATLAS_DIAGNOSTIC_BRIDGE.md:1)

## Tests

Focused test command:

```bash
node --test tests/client-developer-only-atlas-map-adapter.test.mjs tests/client-growgo-map-getter.test.mjs tests/client-developer-only-live-map-centre-atlas-bridge.test.mjs
```

Result:

- 27 passed
- 0 failed

## Safety

Confirmed preserved:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Confirmed absent:

- no automatic invocation
- no movement listeners
- no GPS coupling
- no polling
- no renderer handoff
- no map mutation
- no network path inside the bridge

## Next Smallest Safe Phase

- explicit manual developer invocation procedure and inspection note for the live page, still without automatic attachment or movement listeners
