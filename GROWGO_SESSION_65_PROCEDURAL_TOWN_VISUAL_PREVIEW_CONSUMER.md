# GROWGO SESSION 65 — PROCEDURAL TOWN VISUAL PREVIEW CONSUMER

## Session Scope

This session creates the first visual preview consumer for:

- `TOWN_LAYOUT_001_PREVIEW_001`

Output scene:

- `TOWN_LAYOUT_001_PREVIEW_SCENE_001`

This session is a preview integration pass only.

This session does not:

- create production town assets
- create new buildings
- create new modules
- modify registered GLBs
- create final town scenes
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## Files Created

- `asset-factory/town-preview-consumer.mjs`
- `asset-factory/local-blender-scripts/generate_town_layout_preview_scene.py`
- `tests/asset-factory-town-preview-consumer.test.mjs`
- `asset-factory-workspace/procedural-previews/TOWN_LAYOUT_001_PREVIEW_SCENE_001/preview-scene-metadata.json`
- `asset-factory-workspace/procedural-previews/TOWN_LAYOUT_001_PREVIEW_SCENE_001/preview-scene-manifest.json`
- `asset-factory-workspace/procedural-previews/TOWN_LAYOUT_001_PREVIEW_SCENE_001/TOWN_LAYOUT_001_PREVIEW_VALIDATION_001.json`
- `asset-factory-workspace/procedural-previews/TOWN_LAYOUT_001_PREVIEW_SCENE_001/generate_town_layout_preview_scene.py`
- `GROWGO_SESSION_65_PROCEDURAL_TOWN_VISUAL_PREVIEW_CONSUMER.md`

## Preview Consumer Design

Implemented:

- `TOWN_LAYOUT_001_PREVIEW_CONSUMER_001`

The consumer converts:

- `TOWN_LAYOUT_001_PREVIEW_001.json`

into a preview-scene contract for:

- `TOWN_LAYOUT_001_PREVIEW_SCENE_001`

The consumer resolves:

- district preview references using `SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001`
- town boundary and rural transition extents
- district boundaries, IDs, density profiles, and relationships
- town centre boundary and pedestrian-priority area
- commercial zone placement and access relationships
- civic reserve locations
- transport hierarchy, collector routes, bus loop, and future rail spine
- recreation zones
- landmark reserves
- validation and debug overlays

Important preview rule:

- districts remain preview-scene instance references
- no district geometry is regenerated inside the town consumer
- no duplicate town, district, or building geometry is created

## Visual Output Approach

The town preview consumer emits scene metadata describing:

- the full town outline
- rural transition zones
- district boundaries and labels
- district-to-centre relationships
- town centre location and activity zone
- commercial strip placement
- civic service reserve placeholders
- collector, arterial, bus, and future rail corridors
- recreation overlays for parks, sports fields, green corridors, and trails
- landmark exploration points
- validation indicators

The Blender preview script builds a preview-only inspection scene with:

- a north-up town frame
- district massing boxes using instance-reference semantics
- centre, commercial, civic, and landmark placeholders
- transport corridor linework by hierarchy
- rural transition overlays
- debug labels for districts, corridors, and reserved zones

This stays at preview level only:

- no production town assets
- no new GLBs
- no new registered world content

## Camera Profiles

Defined:

- `TOP_DOWN_TOWN_INSPECTION`
- `ANGLED_TOWN_2_5D_INSPECTION`
- `CENTRE_AND_DISTRICT_OVERVIEW_INSPECTION`

Each capture profile records:

- camera position
- camera rotation
- town seed
- preview version
- validation result

Preview version:

- `SESSION_65_TOWN_PREVIEW_CONSUMER`

## Validation Results

Generated:

- `TOWN_LAYOUT_001_PREVIEW_VALIDATION_001`

Validation result:

- `townBoundaryValid`: `PASS`
- `districtsPlaced`: `PASS`
- `zonesValid`: `PASS`
- `districtPreviewsResolve`: `PASS`
- `townCentreAccessible`: `PASS`
- `townCentreConnected`: `PASS`
- `commercialSensibleLocation`: `PASS`
- `civicAccessible`: `PASS`
- `transportConnectedHierarchy`: `PASS`
- `recreationValid`: `PASS`
- `landmarksValid`: `PASS`
- `deterministicSourceMatches`: `PASS`
- `referenceBasedPlacement`: `PASS`
- `noDuplicateGeometryGeneration`: `PASS`
- `cameraProfileValid`: `PASS`

Town summary:

- `3` districts
- `336` estimated district lots
- `1` town centre
- `1` commercial zone
- `4` civic reserves
- `6` transport corridors
- `4` recreation zones
- `2` landmark reserves

Overall result:

- `validationPassed: true`

## Visual Preview Readiness

Status:

- `READY FOR TOWN INSPECTION`

Meaning:

- deterministic town JSON can now be consumed as a visual preview contract
- district previews are reused as scene references rather than duplicated
- centre, commercial, civic, transport, recreation, and landmark relationships are visible for review
- the next recommended step is the first town visual inspection pass
