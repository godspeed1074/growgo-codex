# GROWGO SESSION 76 — REGION VISUAL PREVIEW CONSUMER

## Session Scope

This session creates the first visual preview consumer for:

- `REGION_LAYOUT_001_PREVIEW_001`

Output scene:

- `REGION_LAYOUT_001_PREVIEW_SCENE_001`

This session is a preview integration pass only.

This session does not:

- create production world assets
- create new buildings
- create new modules
- modify registered GLBs
- create final world scenes
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## Files Created

- `asset-factory/region-preview-consumer.mjs`
- `tests/asset-factory-region-preview-consumer.test.mjs`
- `asset-factory-workspace/procedural-previews/REGION_LAYOUT_001_PREVIEW_SCENE_001/preview-scene-metadata.json`
- `asset-factory-workspace/procedural-previews/REGION_LAYOUT_001_PREVIEW_SCENE_001/preview-scene-manifest.json`
- `asset-factory-workspace/procedural-previews/REGION_LAYOUT_001_PREVIEW_SCENE_001/REGION_LAYOUT_001_PREVIEW_VALIDATION_001.json`
- `GROWGO_SESSION_76_REGION_VISUAL_PREVIEW_CONSUMER.md`

## Files Changed

- none

## Preview Consumer Design

Implemented:

- `REGION_LAYOUT_001_PREVIEW_CONSUMER_001`

The consumer converts:

- `REGION_LAYOUT_001_PREVIEW_001.json`

into a preview-scene contract for:

- `REGION_LAYOUT_001_PREVIEW_SCENE_001`

The consumer resolves:

- region boundary and profile identity
- natural-zone overlays for coastline, forest, farmland, wetlands, and protected areas
- settlement markers for major towns, regional towns, coastal towns, villages, and hamlets
- transport hierarchy for highways, major roads, local roads, railway placeholders, and coastal routes
- landmark reserve markers
- exploration-route overlays and discovery corridors
- validation and debug overlays

Important preview rule:

- region preview remains reference-based and inspection-only
- no production settlement geometry is generated
- no duplicate world geometry is created
- settlement display remains marker and contract driven

## Visual Output Approach

The region preview consumer emits scene metadata describing:

- the full region outline
- terrain and profile extent
- natural-zone boundaries and labels
- settlement locations, types, and hierarchy
- inter-settlement transport structure
- landmark destinations
- exploration route relationships
- validation indicators

The generated preview bundle stays at preview level only:

- no production region assets
- no new GLBs
- no world-scene exports
- no new registered world content

## Camera Profiles

Defined:

- `TOP_DOWN_REGION_INSPECTION`
- `ANGLED_REGION_2_5D_INSPECTION`
- `SETTLEMENT_NETWORK_OVERVIEW_INSPECTION`

Each capture profile records:

- camera position
- camera rotation
- region seed
- region profile
- preview version
- validation result

Preview version:

- `SESSION_76_REGION_PREVIEW_CONSUMER`

## Validation Results

Generated:

- `REGION_LAYOUT_001_PREVIEW_VALIDATION_001`

Validation result:

- `regionBoundaryValid`: `PASS`
- `naturalZonesValid`: `PASS`
- `settlementsValid`: `PASS`
- `corridorsConnected`: `PASS`
- `settlementsLinked`: `PASS`
- `landmarksAccessible`: `PASS`
- `routeCompatible`: `PASS`
- `explorationRoutesValid`: `PASS`
- `deterministicSourceMatches`: `PASS`
- `referenceBasedPlacement`: `PASS`
- `streamingReadyStructure`: `PASS`
- `noDuplicateGeometryGeneration`: `PASS`
- `cameraProfileValid`: `PASS`

Region summary:

- `5` settlements
- `6` natural zones
- `6` transport corridors
- `5` landmark reserves
- `6` exploration routes

Overall result:

- `validationPassed: true`

## Test Results

Passed:

- `tests/asset-factory-region-preview-consumer.test.mjs`

Validated scenarios:

- Blender preview command built correctly
- region preview metadata resolves the scene contract
- preview validation passes against the deterministic region source
- checked-in preview artifacts match generated metadata and validation output

## Region Inspection Readiness

Status:

- `READY FOR REGION INSPECTION`

Meaning:

- deterministic region JSON can now be consumed as a visual preview contract
- natural systems, settlements, transport, landmarks, and exploration routes are readable for inspection
- preview stays reference-based and streaming-safe
- the next recommended step is the first region visual inspection pass
