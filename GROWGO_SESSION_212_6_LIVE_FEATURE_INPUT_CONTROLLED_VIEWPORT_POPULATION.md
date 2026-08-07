# GrowGo Session 212.6 — Live Feature Input and Controlled Viewport Population

Status: implementation complete for developer-only manual preview wiring.

What changed

- Added a live feature input adapter in [client/developer-only-atlas-live-feature-input-adapter.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-live-feature-input-adapter.mjs)
- Added a controlled live viewport preview command in [client/developer-only-atlas-controlled-viewport-population-preview.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-controlled-viewport-population-preview.mjs)
- Wired the live feature seam into [client/development-alpha-app.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/development-alpha-app.mjs)
- Exposed the script-side current feature source through `getCustom25DCurrentViewportFeatureSource()` in [script.js](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/script.js)

Live feature source used

The preview does not invent map data and does not fetch public Overpass/OSM from the new command path.

It reuses the already-loaded lightweight custom 2.5D feature seam:

- `custom25DZoneFeatures`
- `custom25DBuildingFeatures`
- `custom25DRoadFeatures`

Those are exposed through a local-developer diagnostics getter that returns only frozen plain-data snapshots.

Controlled vocabulary

The adapter normalizes live viewport features into:

- `vegetation_area`
- `park`
- `reserve`
- `coastal_green`
- `roadside_green`
- `civic_site`
- `sports_ground`
- `building_footprint`
- `unsupported`

Preview flow

Manual command only:

- `window.GrowGoDeveloperDiagnostics.previewAtlasCurrentViewportPopulation({ confirmation: "PREVIEW_CONTROLLED_ATLAS_CURRENT_VIEWPORT_POPULATION" })`

Clear command:

- `window.GrowGoDeveloperDiagnostics.clearAtlasCurrentViewportPopulationPreview({ confirmation: "CLEAR_CONTROLLED_ATLAS_CURRENT_VIEWPORT_POPULATION_PREVIEW" })`

Runtime path:

approved attached persistent Atlas
→ current live viewport bounds
→ current script-side feature source
→ lightweight normalization
→ deterministic Phase 212.2 population plan
→ existing Phase 212.3/212.4 draw integration
→ retained Atlas Canvas reuse

Safety guarantees preserved

- no automatic viewport population
- no startup population
- no new network requests
- no second renderer
- no second Canvas
- no Leaflet marker/layer path
- no raw OSM/Leaflet/DOM/Canvas objects passed into the planner

Canonical safety flags remain:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Diagnostics exposed

- `getAtlasLiveFeatureInputAdapterStatus()`
- `getAtlasCurrentViewportPopulationPreviewStatus()`

Both return frozen serializable scalar status only.

Manual Safari verification remains required

This phase stops at implementation and focused regression coverage.

Next manual verification should confirm:

1. current Bellarine viewport feature extraction works with real loaded data
2. classification counts are honest for the live viewport
3. one deterministic population plan is created
4. batch reaches the retained draw path
5. clear removes preview population while Atlas stays attached
