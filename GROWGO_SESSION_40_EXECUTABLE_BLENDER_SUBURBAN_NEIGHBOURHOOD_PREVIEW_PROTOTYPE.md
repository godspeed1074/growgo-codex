# GrowGo Session 40 - Executable Blender Suburban Neighbourhood Preview Prototype

## Session Scope

This session creates the first executable Blender preview prototype for the deterministic suburban neighbourhood preview.

Target output:

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001`

This session is a preview prototype only.

This session does not:

- create production neighbourhood assets
- modify registered buildings
- create new modules
- export final game assets
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## 1. Source of Truth

This implementation is based on:

- `GROWGO_SESSION_39_FIRST_VISUAL_SUBURBAN_NEIGHBOURHOOD_PREVIEW_CONSUMER.md`
- `GROWGO_SESSION_38_PROCEDURAL_NEIGHBOURHOOD_PREVIEW_ADAPTER_FOUNDATION.md`
- `GROWGO_SESSION_37_DETERMINISTIC_SUBURBAN_PREVIEW_GENERATOR.md`
- existing Asset Factory Blender production patterns

## 2. Prototype Components

The first executable prototype is implemented with:

- `asset-factory/suburban-neighbourhood-preview-consumer.mjs`
- `asset-factory/local-blender-scripts/generate_suburban_neighbourhood_preview_scene.py`

The generated prototype output directory is:

- `asset-factory-workspace/procedural-previews/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001/`

## 3. Input and Resolution

The prototype consumes:

- `asset-factory-workspace/procedural-previews/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001.json`

The prototype resolves registered building gameplay previews for:

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`

Each building instance reuses the registered gameplay GLB export and preserves:

- source position
- source rotation
- source scale
- lot identity

## 4. Blender Preview Approach

The Blender preview script builds a lightweight inspection scene containing:

- simple road representation
- north-up block framing
- visible lot boundaries
- lot labels
- imported residential building instances
- driveway path indicators
- fence boundary outlines
- simple landscape markers for grass, bushes, and trees
- debug validation markers

The prototype uses:

- instance reuse
- registered building GLBs
- preview-only overlays
- a small controlled six-lot scene

## 5. Debug and Inspection Layer

The preview includes visible helpers for:

- lot boundary outlines
- building orientation arrows
- driveway connection indicators
- validation markers

Debug colour rules:

- `GREEN`: valid placement state
- `RED`: invalid placement state

These helpers are intended for inspection only and are not production rendering outputs.

## 6. Preview Metadata and Validation Outputs

The generated prototype output includes:

- `preview-scene-metadata.json`
- `preview-scene-manifest.json`
- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_VALIDATION_001.json`
- `generate_suburban_neighbourhood_preview_scene.py`

The validation output checks:

- all building IDs resolve
- all lots are populated
- no placement overlap
- driveway connections are valid
- orientation is valid
- deterministic source matches

## 7. Validation Results

The current generated validation report passes:

- `allBuildingIdsResolve`: `PASS`
- `allLotsPopulated`: `PASS`
- `noPlacementOverlap`: `PASS`
- `drivewayConnectionsValid`: `PASS`
- `orientationValid`: `PASS`
- `deterministicSourceMatches`: `PASS`

Summary:

- validation passed
- building instance count: `6`
- lot count: `6`
- driveway connection count: `6`

## 8. Readiness

The first executable Blender suburban neighbourhood preview prototype is ready for:

- first controlled visual inspection of the six-lot preview block
- validation-aware placement review
- future Atlas Engine bridge work
- future larger procedural neighbourhood preview consumers

The next recommended step is:

- opening the prototype in Blender GUI mode to visually confirm lot spacing, driveway readability, house orientation, and fence alignment against the deterministic source preview
