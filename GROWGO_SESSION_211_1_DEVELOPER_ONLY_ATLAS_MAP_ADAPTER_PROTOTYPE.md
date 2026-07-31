# GROWGO SESSION 211.1 — DEVELOPER-ONLY ATLAS MAP ADAPTER PROTOTYPE

## Goal

Implement the smallest real, read-only bridge between the existing GrowGo live map and Atlas.

## What Was Found First

- The live map still exists primarily in `script.js` through `initMap()` and a Leaflet `L.map("map", ...)` setup.
- The owner-adjacent `getGrowGoMap()` getter is not implemented yet.
- The codebase does already contain deterministic Atlas planning and simulation layers for:
  - approved region scope
  - approved regional package scope
  - recipe selection
  - runtime safety gating

## What Was Built

A developer-only diagnostic adapter with the narrow interface:

```js
getAtlasMapDiagnostic({
  latitude,
  longitude
})
```

Implemented in:

- `client/developer-only-atlas-map-adapter.mjs`

This adapter:

- accepts explicit manual diagnostic coordinates
- validates latitude and longitude
- resolves only the single approved Atlas region
- resolves only the single approved regional package
- resolves only `COASTAL_LOCATION_RECIPE_001`
- returns a read-only structured diagnostic result
- fails closed outside the approved scope
- performs no rendering, no map mutation, no DOM mutation, and no listener attachment

## Files Changed

- `client/developer-only-atlas-map-adapter.mjs`
- `tests/client-developer-only-atlas-map-adapter.test.mjs`
- `GROWGO_SESSION_211_1_DEVELOPER_ONLY_ATLAS_MAP_ADAPTER_PROTOTYPE.md`

## Safety

Confirmed preserved:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Still blocked:

- renderer attachment
- map attachment
- map downloads
- Blender
- GLBs
- asset modification

## Why This Matters

This phase creates the first real executable bridge from manual map coordinates into approved Atlas resolution logic without jumping ahead into live listeners, rendering, or runtime attachment.

It proves the core lookup path works:

coordinate
→ approved region
→ approved package
→ approved recipe
→ deterministic diagnostic result

## Readiness

This prototype is ready for explicit developer-only manual diagnostics.

It is not wired into live map events, does not invoke a live map getter, and does not attach Atlas to the player map yet.
