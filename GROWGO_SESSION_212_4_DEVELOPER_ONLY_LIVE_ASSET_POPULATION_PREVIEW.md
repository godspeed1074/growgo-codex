# GrowGo Session 212.4 — Developer-Only Live Asset Population Preview

Status: PASS

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

## Goal

Add one explicit developer-only manual preview command that:

fixture
→ deterministic world population plan
→ validated population draw batch
→ existing persistent Atlas snapshot/draw path
→ live retained-Canvas preview
→ safe preview clear

This phase does not add automatic viewport population, startup spawning, player runtime activation, or renderer auto-attachment.

## Created

- `client/developer-only-atlas-asset-population-preview.mjs`
- `tests/client-developer-only-atlas-asset-population-preview.test.mjs`

## Preview API

The existing local diagnostics namespace is extended with:

- `previewAtlasAssetPopulation(...)`
- `getAtlasAssetPopulationPreviewStatus()`
- `clearAtlasAssetPopulationPreview(...)`

Required confirmations:

- preview: `PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION`
- clear: `CLEAR_CONTROLLED_ATLAS_ASSET_POPULATION_PREVIEW`

## Built-in first preview fixture

Developer fixture:

- `ATLAS_POPULATION_PREVIEW_BELLARINE_001`

It uses approved lightweight normalized feature classes only:

- `park`
- `coastal_green`
- `vegetation_area`
- `sports_ground`

Approved assets reached through the deterministic pipeline:

- `TREE_EUCALYPTUS_001`
- `TREE_BOTTLEBRUSH_001`
- `SHRUB_COASTAL_LOW_001`
- `BUILDING_CIVIC_SPORTS_PAVILION_001`

## Preconditions

Preview requires:

- local development host
- persistent Atlas already authorized
- persistent Atlas already attached
- integration state `attached_idle`
- redraw permission allowed
- valid identity/readiness state
- exactly one owned Canvas
- exactly one owned pane
- exactly three approved listeners
- no failed-closed state

## Preview behavior

Preview:

- creates a deterministic Phase 212.2 population plan
- validates it through Phase 212.3 population draw integration
- submits one lightweight population batch
- uses the existing retained Canvas
- preserves command identity/order
- stores only safe preview status

Duplicate preview policy:

- same fixture + same selector seed while already active returns deterministic reuse
- no duplicate asset instances
- no duplicate batch retention
- no second draw submission

## Clear behavior

Clear:

- submits an empty/no-preview batch through the same draw lane
- keeps Atlas attached
- keeps Canvas, pane, listeners, and lifecycle owner
- clears preview references only
- returns to attached idle preview state

## Diagnostics

Frozen serializable preview status includes:

- `previewAvailable`
- `previewActive`
- `previewFixtureId`
- `populationPlanId`
- `batchId`
- `plannedCommandCount`
- `submittedCommandCount`
- `drawCompleted`
- `lastPreviewReason`
- `previewClearCompleted`
- `previewReferenceCount`
- `currentAssetIds`
- `currentInstanceIds`
- `lastFailureReason`
- canonical safety flags

No raw Canvas, renderer, DOM, Leaflet, GLB, model, texture, snapshot internals, or mutable draw-batch objects are exposed.

## Safety

Canonical safety flags remain:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

No startup preview, no automatic viewport population, no timers, and no polling were introduced.

## Result

Phase 212.4 proves one approved deterministic asset-population fixture can be previewed manually through the existing persistent Atlas draw path and then cleared safely, while keeping the entire system developer-only and manually gated.
