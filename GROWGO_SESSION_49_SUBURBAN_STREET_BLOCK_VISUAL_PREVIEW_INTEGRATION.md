# GROWGO SESSION 49 — SUBURBAN STREET BLOCK VISUAL PREVIEW INTEGRATION

## Goal

Create the first visual preview consumer for `SUBURBAN_STREET_BLOCK_001_PREVIEW_001` without changing generation, assets, renderer behaviour, gameplay, backend, or OSM systems.

## Files Created

- `asset-factory/suburban-street-block-preview-consumer.mjs`
- `asset-factory/local-blender-scripts/generate_suburban_street_block_preview_scene.py`
- `tests/asset-factory-suburban-street-block-preview-consumer.test.mjs`
- `asset-factory-workspace/procedural-previews/SUBURBAN_STREET_BLOCK_001_PREVIEW_SCENE_001/preview-scene-metadata.json`
- `asset-factory-workspace/procedural-previews/SUBURBAN_STREET_BLOCK_001_PREVIEW_SCENE_001/preview-scene-manifest.json`
- `asset-factory-workspace/procedural-previews/SUBURBAN_STREET_BLOCK_001_PREVIEW_SCENE_001/SUBURBAN_STREET_BLOCK_001_PREVIEW_VALIDATION_001.json`
- `asset-factory-workspace/procedural-previews/SUBURBAN_STREET_BLOCK_001_PREVIEW_SCENE_001/generate_suburban_street_block_preview_scene.py`

## Preview Consumer Design

The Session 49 consumer introduces `SUBURBAN_STREET_BLOCK_001_PREVIEW_CONSUMER_001` as the bridge from deterministic 24-lot procedural data into a visual inspection contract.

The consumer:

- reads `SUBURBAN_STREET_BLOCK_001_PREVIEW_001.json`
- resolves registered building assets for:
  - `BUILDING_HOUSE_SUBURBAN_BRICK_001`
  - `BUILDING_HOUSE_COASTAL_COTTAGE_001`
  - `BUILDING_HOUSE_BEACH_BUNGALOW_001`
- preserves the generator’s road graph, lot, driveway, fence, and street-feature placements
- emits scene metadata, validation output, and a Blender wrapper entry point for `SUBURBAN_STREET_BLOCK_001_PREVIEW_SCENE_001`

The preview metadata records:

- 6 road segments
- 3 intersections
- 7 road nodes
- 24 lots
- 24 building instances
- 24 driveway connections
- 69 street feature instances

## Blender Integration Approach

The Blender preview prototype for the street block follows the existing neighbourhood preview pattern, extended for the larger multi-street layout.

The script:

- draws road segments from the machine-readable road graph
- marks road nodes and intersection labels for graph inspection
- renders lot boundaries, lot IDs, and corner-lot markers
- imports registered building GLBs with deterministic transforms
- renders driveway lines from frontage connection records
- renders fence boundaries with driveway and pedestrian openings
- renders street features:
  - sidewalks
  - grass verges
  - street trees
  - street signs
  - mailbox preview markers
- renders simple lot landscape zones for front lawn, backyard, side planting, and tree zones

## Camera Profiles

The preview contract defines three inspection cameras:

- `TOP_DOWN_BLOCK_INSPECTION`
- `ANGLED_2_5D_BLOCK_INSPECTION`
- `STREET_LEVEL_BLOCK_INSPECTION`

Each records:

- camera position
- camera rotation
- seed `10482`
- preview version `SESSION_49_BLOCK_PREVIEW_INTEGRATION`

## Validation Results

Generated validation for `SUBURBAN_STREET_BLOCK_001_PREVIEW_VALIDATION_001` reports:

- road connected network: PASS
- valid intersections: PASS
- all lots populated: PASS
- lot boundaries valid: PASS
- all building IDs resolve: PASS
- no building overlap: PASS
- orientation valid: PASS
- driveways connected: PASS
- street features contained: PASS
- camera profiles valid: PASS
- deterministic source matches: PASS

## Readiness

The 24-lot street block now has a repository-tracked visual preview consumer and Blender preview contract ready for inspection work.

This pass keeps the scope limited to preview integration only:

- no new modules
- no new buildings
- no production suburb
- no renderer, gameplay, backend, or OSM changes

## Tests Run

- `node --test tests/asset-factory-suburban-street-block-generator.test.mjs tests/asset-factory-suburban-street-block-preview-consumer.test.mjs`
- Python syntax compile check for `asset-factory/local-blender-scripts/generate_suburban_street_block_preview_scene.py`
