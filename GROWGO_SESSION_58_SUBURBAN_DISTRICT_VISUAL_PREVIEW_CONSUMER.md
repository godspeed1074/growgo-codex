# GROWGO SESSION 58 — SUBURBAN DISTRICT VISUAL PREVIEW CONSUMER

## Goal

Create the first visual preview consumer for `SUBURBAN_DISTRICT_001_PREVIEW_001` without creating production district assets, new buildings, new modules, renderer changes, gameplay changes, backend changes, or OSM changes.

## Files Created

- `asset-factory/suburban-district-preview-consumer.mjs`
- `asset-factory/local-blender-scripts/generate_suburban_district_preview_scene.py`
- `tests/asset-factory-suburban-district-preview-consumer.test.mjs`
- `asset-factory-workspace/procedural-previews/SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001/preview-scene-metadata.json`
- `asset-factory-workspace/procedural-previews/SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001/preview-scene-manifest.json`
- `asset-factory-workspace/procedural-previews/SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001/SUBURBAN_DISTRICT_001_PREVIEW_VALIDATION_001.json`
- `asset-factory-workspace/procedural-previews/SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001/generate_suburban_district_preview_scene.py`

## Files Changed

- `asset-factory/suburban-district-preview-consumer.mjs`
- `asset-factory/local-blender-scripts/generate_suburban_district_preview_scene.py`
- `tests/asset-factory-suburban-district-preview-consumer.test.mjs`
- `asset-factory-workspace/procedural-previews/SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001/preview-scene-metadata.json`
- `asset-factory-workspace/procedural-previews/SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001/preview-scene-manifest.json`
- `asset-factory-workspace/procedural-previews/SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001/SUBURBAN_DISTRICT_001_PREVIEW_VALIDATION_001.json`
- `asset-factory-workspace/procedural-previews/SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001/generate_suburban_district_preview_scene.py`
- `GROWGO_SESSION_58_SUBURBAN_DISTRICT_VISUAL_PREVIEW_CONSUMER.md`

## Preview Consumer Design

Implemented:

- `SUBURBAN_DISTRICT_001_PREVIEW_CONSUMER_001`

The consumer converts:

- `SUBURBAN_DISTRICT_001_PREVIEW_001.json`

into a repository-tracked district preview scene contract for:

- `SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001`

The consumer resolves:

- street block references using `SUBURBAN_STREET_BLOCK_001`
- district block placements
- road connectors
- land-use zones
- open-space placements
- destination reserve placeholders
- debug and validation overlays

Important preview rule:

- street blocks remain preview-scene instance references
- no block geometry is regenerated inside the district consumer
- no duplicate building or neighbourhood geometry is created

## Visual Output Approach

The district preview consumer emits scene metadata describing:

- district boundary outline
- individual block boundaries and block IDs
- local roads
- collector connectors
- future arterial placeholders
- residential zoning overlays
- open-space and park overlays
- destination reserve placeholders for schools, shopping, and sports
- validation markers

The Blender preview script builds a visual inspection scene with:

- a north-up district frame
- preview-only block massing boxes
- connector lines by road hierarchy
- zone boundary overlays
- open-space fill boxes
- reserve boundary placeholders
- debug labels for blocks, connectors, zones, and reserves

This stays at preview level only:

- no production district assets
- no new GLBs
- no new registered building content

## Camera Profiles

Defined:

- `TOP_DOWN_DISTRICT_INSPECTION`
- `ANGLED_DISTRICT_2_5D_INSPECTION`
- `STREET_BLOCK_OVERVIEW_INSPECTION`

Each capture profile records:

- camera position
- camera rotation
- district seed
- preview version
- validation result

Preview version:

- `SESSION_58_DISTRICT_PREVIEW_CONSUMER`

## Validation Results

Generated:

- `SUBURBAN_DISTRICT_001_PREVIEW_VALIDATION_001`

Validation result:

- `blocksInsideBoundary`: `PASS`
- `streetBlocksResolve`: `PASS`
- `blocksDoNotOverlap`: `PASS`
- `roadsConnected`: `PASS`
- `zonesValid`: `PASS`
- `openSpaceConnected`: `PASS`
- `destinationReservesValid`: `PASS`
- `cameraProfileValid`: `PASS`
- `deterministicSourceMatches`: `PASS`
- `instanceReferenceModeValid`: `PASS`

District summary:

- `4` street blocks
- `108` estimated lots
- `5` road connectors
- `8` land-use zones
- `3` open spaces
- `3` destination reserves

Overall result:

- `validationPassed: true`

## Tests Run

- `node --test tests/asset-factory-suburban-district-generator.test.mjs tests/asset-factory-suburban-district-preview-consumer.test.mjs`
- `PYTHONPYCACHEPREFIX=/tmp python3 -m py_compile asset-factory/local-blender-scripts/generate_suburban_district_preview_scene.py`

Result:

- `9 / 9` focused tests passed

## Readiness

Status:

- `READY FOR DISTRICT INSPECTION`

Meaning:

- the first district preview consumer now exists
- deterministic district JSON can be converted into a visual inspection contract
- street blocks are reused as preview references instead of duplicated geometry
- road, zone, open-space, and reserve relationships are visible for review
- the next recommended step is the first district visual inspection pass
