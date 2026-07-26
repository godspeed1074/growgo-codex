# GrowGo Session 42 - Suburban Neighbourhood Preview Rule Corrections

## Session Scope

This session implements the first controlled rule-correction pass for:

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SYSTEM`

This session corrects issues identified in:

- `GROWGO_SESSION_41_BLENDER_SUBURBAN_NEIGHBOURHOOD_VISUAL_INSPECTION_REPORT.md`

This session does not:

- create new buildings
- create new Layer A modules
- modify registered GLBs
- expand neighbourhood size
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## 1. Corrected Issues

This pass addresses:

- `ISSUE_NBH_001` - driveway side logic
- `ISSUE_NBH_002` - fence opening logic
- `ISSUE_NBH_003` - real landscaping resolution
- `ISSUE_NBH_004` - neighbourhood theme weighting
- `ISSUE_NBH_005` - visual capture workflow

## 2. Rules Added and Implemented

### Correction 1 - Driveway Side Logic

Implemented:

- lot `drivewaySide` now determines the driveway anchor X position
- lot `drivewaySocket` now records:
  - driveway X position
  - frontage Y position
  - driveway side
  - garage side
- road frontage connection records now preserve:
  - driveway side
  - garage side
  - driveway-side-specific road connection point
  - non-crossing requirement

Validation added:

- driveway connection must align with the expected driveway-side anchor
- driveway must not cross neighbouring lots
- driveway side must match garage side

Expected visual improvement:

- driveway previews will sit on the correct side of each lot
- driveway-to-garage relationships become inspectable instead of centreline-only

### Correction 2 - Fence Opening Logic

Implemented:

- lot fence metadata now supports:
  - driveway opening side
  - driveway opening width
  - pedestrian access side
  - pedestrian access width
- road frontage connection records now expose fence opening data
- Blender fence preview logic now draws:
  - side boundaries
  - rear boundary
  - segmented front boundary with visible opening gaps

Validation added:

- driveway opening must exist
- pedestrian opening must exist
- pedestrian opening must be on the opposite side from the driveway opening
- opening widths must remain valid

Expected visual improvement:

- vehicle access is no longer visually blocked
- front boundary readability is improved

### Correction 3 - Real Landscaping Resolution

Implemented:

- landscape placement logic now resolves grass, bush, and tree placements from explicit lot zones
- bush placements remain tied to `MOD_BUSH_NATIVE_STANDARD_001`
- tree placements remain tied to `MOD_TREE_EUCALYPTUS_STANDARD_001`
- Blender preview now imports registered bush and tree GLBs rather than using placeholder boxes

Validation added:

- every landscape placement must remain inside its intended zone
- every landscape placement must remain inside its lot

Expected visual improvement:

- inspection scene now uses real registered vegetation assets for bush and tree checks
- landscape containment is more trustworthy

### Correction 4 - Neighbourhood Theme Weighting

Implemented theme profiles:

#### `SUBURBAN_AUSTRALIA`

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`: `70%`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001`: `25%`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`: `5%`

#### `COASTAL_ESTATES`

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`: `20%`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001`: `50%`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`: `30%`

Implemented:

- theme profile resolution from `themeSeed`
- deterministic weighted building selection using active theme weights
- explicit validation that theme weights sum correctly

Expected visual improvement:

- default suburban preview now biases more clearly toward suburban identity
- coastal-estate previews can use a different but still deterministic building mix

### Correction 5 - Visual Capture Workflow

Implemented:

- preview capture workflow metadata now records:
  - preview version
  - seed
  - top-down capture profile
  - angled 2.5D capture profile
  - street-level capture profile
- Blender prototype now creates:
  - `CAPTURE_TOP_DOWN`
  - `CAPTURE_ANGLED_25D`
  - `CAPTURE_STREET_LEVEL`

Expected visual improvement:

- the next live inspection pass can capture consistent views
- visual QA becomes reproducible across seeds and preview revisions

## 3. Validation Changes

Validation now includes:

- driveway connection validity
- fence opening validity
- landscape containment validity
- theme weighting validity
- deterministic rebuild validity

Preview validation output now checks:

- `fenceOpeningsValid`
- `landscapeContainment`
- `themeWeightingValid`

Preview consumer validation now reports:

- `fenceOpeningsValid`
- `landscapeContainmentValid`
- `themeWeightingValid`

## 4. Files Updated

Updated implementation:

- `asset-factory/suburban-neighbourhood-preview-generator.mjs`
- `asset-factory/suburban-neighbourhood-preview-consumer.mjs`
- `asset-factory/local-blender-scripts/generate_suburban_neighbourhood_preview_scene.py`

Updated tests:

- `tests/asset-factory-suburban-neighbourhood-preview-generator.test.mjs`
- `tests/asset-factory-suburban-neighbourhood-preview-consumer.test.mjs`

Updated generated preview artifacts:

- `asset-factory-workspace/procedural-previews/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001.json`
- `asset-factory-workspace/procedural-previews/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001/preview-scene-metadata.json`
- `asset-factory-workspace/procedural-previews/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001/preview-scene-manifest.json`
- `asset-factory-workspace/procedural-previews/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_VALIDATION_001.json`

## 5. Expected Visual Improvements

The next preview iteration should show:

- driveway paths offset to the correct lot side
- front fences with readable vehicle and pedestrian openings
- real registered tree and bush instances in the inspection scene
- a more clearly suburban default neighbourhood mix
- repeatable top-down, angled, and street-level capture views

## 6. Readiness

Status:

- `READY FOR SECOND PREVIEW ITERATION`

Meaning:

- the first round of structural preview-rule corrections is now implemented
- the deterministic generator, preview consumer, and Blender prototype remain aligned
- the system is ready for a second neighbourhood preview inspection pass focused on visual improvement rather than missing rules
