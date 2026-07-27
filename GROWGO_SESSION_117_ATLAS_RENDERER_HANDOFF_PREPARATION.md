# GROWGO SESSION 117 — ATLAS RENDERER HANDOFF PREPARATION

## Summary

Session 117 creates `ATLAS_RENDERER_HANDOFF_LAYER_001`, a non-rendering handoff layer that converts Atlas street-scene composition output into renderer-ready instruction payloads.

This layer prepares:

- asset references
- preserved geometry references
- transform references
- LOD selection
- material references
- layer ordering

It does not activate rendering, create WebGL or Canvas output, modify the production renderer, or alter authoritative real-world geometry.

## Files Created

- `asset-factory/atlas-renderer-handoff.mjs`
- `tests/asset-factory-atlas-renderer-handoff.test.mjs`
- `GROWGO_SESSION_117_ATLAS_RENDERER_HANDOFF_PREPARATION.md`

## Created System

### Layer

`ATLAS_RENDERER_HANDOFF_LAYER_001`

### Output Contract

`ATLAS_RENDER_INSTRUCTIONS_001`

Each scene handoff entry includes:

- `sceneId`
- `sceneType`
- `instructions`
- `sceneMetadata`

Each render instruction includes:

- `objectId`
- `sceneId`
- `assetReference`
- `transformReference`
- `geometryReference`
- `lodLevel`
- `materialReference`
- `renderLayer`
- `layerOrdering`
- `assetFamily`
- `role`

## Render Layers Supported

### `GROUND_LAYER`

Used for:

- terrain treatment
- parks
- reserves
- beaches
- water-adjacent ground treatment

### `ROAD_LAYER`

Used for:

- roads
- paths
- crossings
- transport-route scene geometry

### `OBJECT_LAYER`

Used for:

- buildings
- businesses
- landmarks

### `NATURE_LAYER`

Used for:

- trees
- vegetation

### `DETAIL_LAYER`

Reserved for:

- street furniture
- decorative detail references

## Handoff Conversion Approach

The handoff layer consumes `ATLAS_STREET_SCENE_PREVIEW_001` content and converts each scene into ordered renderer instructions.

Key behaviour:

- geometry references are passed through unchanged
- transform references are derived deterministically from source geometry anchors
- LOD selection is layer-aware
- material references are deterministic recipe/family-based placeholders for future renderer use
- layer ordering is explicit and stable

## LOD Strategy

Current layer-aware defaults:

- `GROUND_LAYER` → prefer `LOD_MAP`
- `ROAD_LAYER` → prefer `LOD_GAMEPLAY`
- `OBJECT_LAYER` → prefer `LOD_CLOSE`
- `NATURE_LAYER` → prefer `LOD_GAMEPLAY`
- `DETAIL_LAYER` → prefer `LOD_CLOSE`

If the preferred LOD is unavailable, the handoff falls back to the first available LOD rule from the source object preview contract.

## Validation Contract

Created:

`ATLAS_RENDER_HANDOFF_VALIDATION_001`

Validation checks confirm:

- every object has an asset reference
- geometry is preserved
- LOD exists
- render layer is valid
- deterministic output is maintained

## Testing Added

Added automated tests for:

- suburban handoff
- town street handoff
- coastal handoff
- LOD assignment
- deterministic instructions

## Validation Results

Executed on Monday, July 27, 2026:

- `tests/asset-factory-atlas-renderer-handoff.test.mjs` — 5/5 passing
- `tests/asset-factory-atlas-street-scene-composition.test.mjs` — passing
- `tests/asset-factory-atlas-environment-preview.test.mjs` — passing
- `tests/asset-factory-atlas-asset-recipe-resolver.test.mjs` — passing

## Readiness for Future Renderer Connection

Session 117 is ready for future renderer connection at the handoff-contract level.

The project now has a clean staged path:

- Atlas object preview
- street scene composition
- renderer handoff instruction generation

This gives the future renderer a deterministic, ordered, geometry-safe instruction surface without requiring any renderer activation in this session.
