# GROWGO SESSION 116 — ATLAS STREET SCENE COMPOSITION FOUNDATION

## Summary

Session 116 creates `ATLAS_STREET_SCENE_COMPOSITION_LAYER_001`, a composition layer that groups existing Atlas preview objects into coherent inspection-ready street scenes while preserving authoritative real-world layout.

This layer composes:

- real roads
- real object locations
- real object relationships
- existing Asset Factory preview assignments

It does not move objects, resize objects, invent buildings, or activate any renderer path.

## Files Created

- `asset-factory/atlas-street-scene-composition.mjs`
- `tests/asset-factory-atlas-street-scene-composition.test.mjs`
- `GROWGO_SESSION_116_ATLAS_STREET_SCENE_COMPOSITION_FOUNDATION.md`

## Created System

### Layer

`ATLAS_STREET_SCENE_COMPOSITION_LAYER_001`

### Output Contract

`ATLAS_STREET_SCENE_PREVIEW_001`

Each composed street scene includes:

- `roadLayoutReference`
- `objectList`
- `assetAssignments`
- `relationshipGraph`
- `sceneMetadata`

### Validation Contract

`ATLAS_STREET_SCENE_VALIDATION_001`

## Scene Types Supported

### `SUBURBAN_STREET_SCENE`

Composition focus:

- houses
- gardens / greenspace context
- road presence
- tree-capable preview context from nature assignments

The scene is derived from residential preview objects plus related transport and nearby greenspace objects.

### `TOWN_MAIN_STREET_SCENE`

Composition focus:

- shops and businesses
- road-served frontage
- pedestrian-facing commercial context
- future street furniture reference support

The scene is derived from commercial preview objects plus transport-linked relationship context.

### `COASTAL_STREET_SCENE`

Composition focus:

- coastal buildings and landmarks
- beach / waterfront relationships
- coastal vegetation and park context
- road access to waterfront objects

The scene is derived from coastal preview objects plus waterfront, reachable, and connected relationship context.

## Composition Approach

The composition layer sits above the existing preview foundation.

Inputs consumed:

- classified world objects
- object relationships
- environment preview objects

If an environment preview layer is not supplied, the composition layer can derive one from the same world-object and relationship inputs.

This keeps Session 116 aligned with the existing Atlas preview pipeline instead of introducing parallel scene logic.

## Validation Rules Added

Validation checks now confirm:

- objects belong to the composed scene
- relationships inside the scene remain valid
- asset assignments remain valid
- source geometry is preserved
- deterministic output is maintained

The composition validation is intentionally structural and preview-focused. It verifies scene integrity without introducing any renderer-specific assumptions.

## Testing Added

Added automated tests for:

- suburban scene composition
- town main street scene composition
- coastal scene composition
- scene validation
- deterministic composition

## Validation Results

Executed on Monday, July 27, 2026:

- `tests/asset-factory-atlas-street-scene-composition.test.mjs` — 5/5 passing
- `tests/asset-factory-atlas-environment-preview.test.mjs` — passing
- `tests/asset-factory-atlas-object-relationship.test.mjs` — passing
- `tests/asset-factory-atlas-asset-recipe-resolver.test.mjs` — passing

## Readiness for Future Renderer Connection

Session 116 is ready for future renderer connection at the scene-composition contract level.

The project now has a street-scene preview layer that can assemble:

- residential frontage scenes
- commercial street scenes
- coastal street scenes

from existing Atlas objects and preview assignments without changing authoritative real-world placement.
