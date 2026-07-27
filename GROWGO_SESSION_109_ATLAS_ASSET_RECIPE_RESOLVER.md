# GROWGO SESSION 109 — ATLAS ASSET RECIPE RESOLVER

Branch:
`feature/growgo-asset-factory-world-expansion`

## Goal

Create the layer that maps classified Atlas world objects to Asset Factory recipes and presentation choices.

## Scope Outcome

Created:

- `ATLAS_ASSET_RECIPE_RESOLVER_001`
- `ATLAS_ASSET_ASSIGNMENTS_001`
- `ATLAS_ASSET_ASSIGNMENT_VALIDATION_001`
- `asset-factory/atlas-asset-recipe-resolver.mjs`
- `tests/asset-factory-atlas-asset-recipe-resolver.test.mjs`

This session does not:

- create new assets
- modify renderer
- create gameplay
- import OSM

## Recipe Mappings

Supported direct mappings now include:

- `HOUSE`
  - `RECIPE_BUILDING_RESIDENTIAL_HOUSE_STANDARD_001`

- `BAKERY`
  - `RECIPE_BUILDING_BAKERY_SMALL_TOWN_001`

- `CAFE`
  - `RECIPE_BUILDING_CAFE_COASTAL_001`

- `PETROL_STATION`
  - `RECIPE_BUILDING_FUEL_STATION_STANDARD_001`

- `PARK`
  - `RECIPE_TREATMENT_PARK_STANDARD_001`

- `RESERVE`
  - `RECIPE_TREATMENT_RESERVE_STANDARD_001`

- `LIGHTHOUSE`
  - `RECIPE_LANDMARK_LIGHTHOUSE_001`

- `LOOKOUT`
  - `RECIPE_LANDMARK_LOOKOUT_001`

Fallback support also covers:

- generic landmarks
- natural features
- transport routes

## Assignment Output

Each `ATLAS_ASSET_ASSIGNMENTS_001` entry includes:

- object ID
- object type
- recipe ID
- asset family
- variant rules
- LOD rules
- preserved geometry reference
- preserved source reference

Relationship-aware variant expansion now supports:

- waterfront context
- business area context
- road served context
- trail connected context

## Validation

Assignment validation checks:

- recipe exists
- object type compatible
- geometry preserved
- deterministic assignment

## Tests Added

Created:

- [asset-factory-atlas-asset-recipe-resolver.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-atlas-asset-recipe-resolver.test.mjs)

Coverage:

- house assignment
- bakery assignment
- park assignment
- landmark assignment
- LOD assignment
- deterministic output
- explicit validation

## Files Created

- [atlas-asset-recipe-resolver.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/atlas-asset-recipe-resolver.mjs)
- [asset-factory-atlas-asset-recipe-resolver.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-atlas-asset-recipe-resolver.test.mjs)
- [GROWGO_SESSION_109_ATLAS_ASSET_RECIPE_RESOLVER.md](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_109_ATLAS_ASSET_RECIPE_RESOLVER.md)

## Readiness

`ATLAS_ASSET_RECIPE_RESOLVER_001` is ready for future Asset Factory expansion.

The Atlas pipeline now maps authoritative real-world objects to deterministic Asset Factory recipe assignments without changing location, geometry, or source truth.
