# GrowGo Atlas Session 212.73 — Controlled One-Asset Live Draw

Status: implementation ready for focused regression and manual Safari verification.

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

## ELI5

We built the narrow developer-only control for drawing one approved Atlas asset, one time, through the existing renderer handoff path. We kept it fenced in: one asset, one explicit authorization, one explicit draw command, and one explicit cleanup command.

## Scope

This phase is limited to:

- `TREE_EUCALYPTUS_001`
- existing 212.72 renderer handoff input
- explicit developer authorization
- one active drawn asset at a time
- explicit cleanup/unload

This phase does not:

- allow startup draw
- add no startup draw behavior
- enable automatic population
- enable polling or timers
- create a second renderer architecture
- change canonical safety flags

## Required flow

`valid 212.72 renderer handoff`
→ `explicit developer authorization`
→ `resolve existing approved GLB/LOD asset`
→ `load one asset`
→ `submit one draw`
→ `report draw status`
→ `explicit cleanup/unload`

## Commands

The controlled one-asset live draw command exposes:

- `authorizeControlledOneAssetLiveDraw(...)`
- `drawControlledOneAssetLive(...)`
- `clearControlledOneAssetLiveDraw(...)`
- `getControlledOneAssetLiveDrawStatus()`

Confirmation strings:

- `AUTHORIZE_CONTROLLED_ONE_ASSET_LIVE_DRAW_ONE_SESSION`
- `DRAW_CONTROLLED_ONE_ASSET_LIVE`
- `CLEAR_CONTROLLED_ONE_ASSET_LIVE_DRAW`

## Contract rules

The command fails closed unless all of the following are true:

- local developer hostname is approved
- persistent Atlas is already attached and idle
- authorization state is `attach_permission_consumed`
- redraw permission remains allowed
- lifecycle owner is present
- canonical safety flags remain false
- renderer handoff status is `ready_for_future_renderer_attachment`
- renderer placement descriptor remains valid
- selected asset is exactly `TREE_EUCALYPTUS_001`
- GLB identity matches the approved record
- LOD profile matches the approved record
- transform values are finite

## Diagnostics

Status/result fields include:

- `controlledLiveAssetDrawId`
- `selectedExistingAssetId`
- `resolvedGlbIdentity`
- `resolvedLodProfile`
- `assetLoadStatus`
- `rendererSubmitStatus`
- `renderedAssetCount`
- `cleanupStatus`
- `controlledLiveDrawStatus`
- `controlledLiveDrawReason`

All diagnostics remain frozen and serializable.

No raw map, Canvas, DOM, Leaflet, or live renderer objects are exposed.

## Safety preservation

Canonical safety flags remain:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Focused regression targets

- unauthorized draw fails closed
- valid eucalyptus handoff is accepted
- draw exactly ONE approved asset
- GLB mismatch fails closed
- LOD mismatch fails closed
- invalid transform fails closed
- cleanup releases created resources
- second draw without cleanup is rejected safely
- renderer handoff regression remains green
- persistent Atlas attachment assumptions remain unchanged

## Manual verification note

This phase prepares the developer-only one-asset live draw control and its guardrails. Manual Safari verification is still required to confirm the real browser path loads, submits, and clears the single asset cleanly through the existing controlled renderer architecture.
