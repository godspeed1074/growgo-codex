# GROWGO SESSION 51 — SUBURBAN STREET BLOCK RULE CORRECTIONS

## Goal

Correct the procedural street-block generation issues identified during Session 50 and prepare the `24` lot suburban block for a second visual inspection pass.

Target updated:

- `SUBURBAN_STREET_BLOCK_001_GENERATOR`

## Issues Corrected

### ISSUE_NBH_009 — Street Frontage Resolution

Corrected by:

- distributing frontage lots across all active street segments instead of leaving the side streets visually empty
- adding lot frontage metadata for:
  - frontage road
  - frontage relationship
  - building facing direction
  - driveway street
  - garage relationship
- adding explicit cul-de-sac frontage metadata with:
  - `cul_de_sac_radial_frontage`
  - inward-facing road relationship
  - radial driveway alignment mode
- adding corner-aware frontage handling for side-facing garage logic

Result:

- the generated block now resolves `4` lots each on:
  - `SEGMENT_001`
  - `SEGMENT_002`
  - `SEGMENT_003`
  - `SEGMENT_004`
  - `SEGMENT_005`
  - `SEGMENT_006`

### ISSUE_NBH_010 — Suburban Weighting Enforcement

Corrected by:

- replacing the old loose theme rebalance with deterministic target-count tracking
- applying target-aware asset selection during lot resolution
- adding a deterministic post-pass rebalance step to pull the final building mix back toward the suburban profile tolerance

Current deterministic seed `10482` result:

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`: `18`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001`: `4`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`: `2`

This passes the configured suburban tolerance layer used by validation.

### ISSUE_NBH_011 — Repetition Control

Corrected by:

- moving from absolute duplicate blocking to road-aware repetition control
- preventing bland repetition instead of forbidding all repeated building types
- varying:
  - roof tone
  - colour variant
  - yard density
  - landscaping sequence
- validating against excessive adjacent facade repetition and repeated landscaping patterns

Result:

- deterministic variation remains stable
- adjacent variation validation now passes for the default seed and the alternate test seed

### ISSUE_NBH_012 — Corner Lot Rules

Corrected by:

- adding corner-specific setback handling
- adding corner frontage garden and visibility planting zones
- adding side-facing garage alignment for corner-side conditions
- adding cul-de-sac-specific corner handling

Result:

- corner lot validation now passes
- corner and cul-de-sac lots carry distinct frontage metadata and landscaping treatment

### ISSUE_NBH_013 — Preview Instance Efficiency

Corrected by updating the preview contract in:

- `asset-factory/suburban-street-block-preview-consumer.mjs`

Added:

- `asset_reference_plus_transform` placement mode
- building asset reference catalog
- per-instance `assetReferenceId`
- explicit preview-performance flags for:
  - asset reference transforms only
  - future Atlas Engine instanced preview readiness

Result:

- the preview contract now records reusable asset references separately from instance transforms
- this is a cleaner bridge for future Atlas Engine-compatible instanced preview consumption

## Generator Changes

Updated:

- `asset-factory/suburban-street-block-generator.mjs`

Main generator changes:

1. Street-edge definitions were redistributed so the block uses:
   - collector frontage
   - local north street frontage
   - local south street frontage
   - cul-de-sac frontage

2. Lot records now include:
   - `frontageRelationship`
   - `garageRelationship`
   - `streetContext`

3. Side-street and cul-de-sac lots now resolve:
   - `EAST` / `WEST` frontage directions
   - side-aware driveway sockets
   - radial driveway alignment where required

4. Validation now includes:
   - `frontageResolutionValidity`
   - `suburbanWeightingValidity`
   - `adjacentVariationValidity`
   - `cornerLotRuleValidity`

5. Road-aware overlap validation now checks conflict domains more appropriately for the preview contract.

## Validation Changes

Current default-seed validation result:

- `roadConnectivityValid`: `PASS`
- `intersectionValidity`: `PASS`
- `allLotsGenerated`: `PASS`
- `lotBoundaryValidity`: `PASS`
- `lotFrontageValidity`: `PASS`
- `validBuildingIds`: `PASS`
- `buildingPlacementValidity`: `PASS`
- `drivewayConnectionValidity`: `PASS`
- `frontageResolutionValidity`: `PASS`
- `suburbanWeightingValidity`: `PASS`
- `adjacentVariationValidity`: `PASS`
- `cornerLotRuleValidity`: `PASS`
- `streetFeatureContainmentValidity`: `PASS`
- `deterministicRebuildValidity`: `PASS`

Overall:

- `validationPassed: true`

## Preview Contract Changes

Updated:

- `asset-factory/suburban-street-block-preview-consumer.mjs`
- `asset-factory-workspace/procedural-previews/SUBURBAN_STREET_BLOCK_001_PREVIEW_SCENE_001/preview-scene-metadata.json`

Preview contract improvements:

- building instances now reference shared asset entries
- transforms remain instance-specific
- preview metadata explicitly records instanced-preview intent

## Expected Visual Improvements

The next inspection pass should see:

- active residential frontage on the local street and cul-de-sac segments
- stronger suburban dominance across the full block
- more believable corner-lot identity
- clearer driveway and garage relationships on side streets
- less obviously patterned frontage repetition
- cleaner preview-contract readiness for future instanced consumers

## Files Changed

- `asset-factory/suburban-street-block-generator.mjs`
- `tests/asset-factory-suburban-street-block-generator.test.mjs`
- `asset-factory/suburban-street-block-preview-consumer.mjs`
- `asset-factory-workspace/procedural-previews/SUBURBAN_STREET_BLOCK_001_PREVIEW_001.json`
- `asset-factory-workspace/procedural-previews/SUBURBAN_STREET_BLOCK_001_PREVIEW_VALIDATION_001.json`
- `asset-factory-workspace/procedural-previews/SUBURBAN_STREET_BLOCK_001_PREVIEW_SCENE_001/preview-scene-metadata.json`

## Tests Run

- `node --test tests/asset-factory-suburban-street-block-generator.test.mjs tests/asset-factory-suburban-street-block-preview-consumer.test.mjs`

Result:

- `9 / 9` tests passed

## Readiness

Status:

- `READY FOR SECOND 24 LOT INSPECTION`

Meaning:

- the generator corrections are in place
- the preview contract has been updated
- the deterministic block output and preview metadata are refreshed
- the next step should be the second visual inspection pass against the corrected `24` lot block
