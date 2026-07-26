# GROWGO SESSION 60 — SUBURBAN DISTRICT RULE CORRECTIONS AND PREVIEW IMPROVEMENTS

## Goal

Improve `SUBURBAN_DISTRICT_001` generation and preview fidelity using the issues identified in Session 59, without creating new assets, new modules, new buildings, renderer changes, gameplay changes, backend changes, or OSM changes.

## Files Changed

- `asset-factory/suburban-district-generator.mjs`
- `asset-factory/suburban-district-preview-consumer.mjs`
- `asset-factory/local-blender-scripts/generate_suburban_district_preview_scene.py`
- `tests/asset-factory-suburban-district-generator.test.mjs`
- `tests/asset-factory-suburban-district-preview-consumer.test.mjs`
- `asset-factory-workspace/procedural-previews/SUBURBAN_DISTRICT_001_PREVIEW_001.json`
- `asset-factory-workspace/procedural-previews/SUBURBAN_DISTRICT_001_VALIDATION_001.json`
- `asset-factory-workspace/procedural-previews/SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001/preview-scene-metadata.json`
- `asset-factory-workspace/procedural-previews/SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001/preview-scene-manifest.json`
- `asset-factory-workspace/procedural-previews/SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001/SUBURBAN_DISTRICT_001_PREVIEW_VALIDATION_001.json`
- `asset-factory-workspace/procedural-previews/SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001/generate_suburban_district_preview_scene.py`
- `GROWGO_SESSION_60_SUBURBAN_DISTRICT_RULE_CORRECTIONS_AND_PREVIEW_IMPROVEMENTS.md`

## Issue Corrections

### ISSUE_DISTRICT_001 — Central Seam Treatment

Added a real district seam contract:

- `DISTRICT_SEAM_001`

The seam now resolves the central north/south block-row gap as:

- `green_pedestrian_spine`

The seam defines:

- an explicit boundary
- supported uses
- connected zones
- connected open spaces
- connected destination reserves
- access rules preventing unusable leftover space

Result:

- the previous undefined central gap is now represented as intended public green connector space

### ISSUE_DISTRICT_002 — Pedestrian Continuity

Added deterministic pedestrian network records:

- `PED_LINK_001`
- `PED_LINK_002`
- `PED_LINK_003`
- `PED_LINK_004`
- `PED_LINK_005`

These now cover:

- district seam spine continuity
- park access
- community/school access
- commercial edge access
- sports reserve access

Result:

- district walking logic is now explicit rather than implied

### ISSUE_DISTRICT_003 — Preview Fidelity

Improved the preview system so the inspection contract communicates more than simple block boxes.

Enhancements include:

- road connector start/end coordinates in the generator output
- seam layer metadata
- pedestrian layer metadata
- richer road readability metadata
- block visual hierarchy metadata
- preview fidelity metadata for angled inspection usefulness
- Blender preview support for:
  - seam outline
  - pedestrian links
  - lot-weighted block massing
  - real connector geometry from generated endpoints

Result:

- the district preview remains an inspection tool, but it now carries clearer structural and visual guidance for the next review pass

## District Rule Changes

Generator updates in `asset-factory/suburban-district-generator.mjs` now include:

- seam-aware district configuration:
  - `seamCorridorDepth`
  - `seamSpineWidth`
- connector endpoint generation for district preview rendering
- central seam boundary generation
- seam-linked green corridor placement
- seam-to-edge walking link positioning
- pedestrian network generation
- expanded deterministic signature coverage for:
  - seam treatment
  - pedestrian network

The default district still remains:

- `4` blocks
- `108` estimated lots
- `5` road connectors
- `8` land-use zones
- `3` open-space placements
- `3` destination reserves

But it now also includes:

- `1` seam treatment contract
- `5` pedestrian links

## Preview Improvements

Preview consumer updates in `asset-factory/suburban-district-preview-consumer.mjs` now expose:

- `seamLayer`
- `pedestrianLayer`
- enhanced `roadConnectorLayer` readability
- enhanced `blockLayer` hierarchy hints
- enhanced `openSpaceLayer` accessibility hints
- `previewFidelityLayer`

Updated preview version:

- `SESSION_60_DISTRICT_REFINEMENT_PASS`

The preview script now draws:

- seam boundary
- pedestrian links
- connector geometry from real start/end points
- stronger block massing variation by estimated lot load

## Validation Updates

Added generator validation checks for:

- `seamTreatmentValid`
- `pedestrianConnectivityValid`
- `greenCorridorConnectivityValid`
- `destinationAccessibilityValid`
- `previewLayerCompletenessValid`

These now sit alongside the existing checks for:

- block placement
- road connectivity
- land use
- open space
- reserve containment
- determinism
- streaming boundaries
- instance reuse

Current validation result:

- all generator checks: `PASS`
- all preview consumer checks: `PASS`

## Testing

Ran:

- `node --test tests/asset-factory-suburban-district-generator.test.mjs tests/asset-factory-suburban-district-preview-consumer.test.mjs`
- `PYTHONPYCACHEPREFIX=/tmp python3 -m py_compile asset-factory/local-blender-scripts/generate_suburban_district_preview_scene.py`

Result:

- `9 / 9` focused tests passed

## Readiness

Status:

- `READY FOR SECOND DISTRICT INSPECTION`

Meaning:

- the district now has explicit seam treatment
- pedestrian continuity is machine-readable and validated
- green-space and destination accessibility are checked
- the preview consumer exposes more useful district inspection layers
- the next review should be able to judge district composition with better structural clarity and better preview readability
