# GROWGO SESSION 53 — SUBURBAN STREET BLOCK THEME BUDGET AND LOT ROLE TUNING

## Goal

Tune `SUBURBAN_STREET_BLOCK_001_GENERATOR` so the deterministic `24` lot preview resolves closer to a believable Australian suburban composition before the next visual inspection pass.

## Composition Changes

### Block Theme Budget

Added an explicit block-level suburban budget layer ahead of per-lot building selection.

For `SUBURBAN_AUSTRALIA`:

- primary: `BUILDING_HOUSE_SUBURBAN_BRICK_001`
- secondary: `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- rare: `BUILDING_HOUSE_BEACH_BUNGALOW_001`

Current deterministic seed `10482` result now resolves to:

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`: `20`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001`: `3`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`: `1`

This now matches the block target count derived from the suburban theme budget rather than only passing a loose tolerance after rebalancing.

### Lot Role System

Added explicit lot roles:

- `STANDARD_LOT`
- `CORNER_LOT`
- `CUL_DE_SAC_LOT`
- `FEATURE_LOT`

Role assignment is now deterministic and happens before building selection.

Current deterministic role distribution:

- `STANDARD_LOT`: `6`
- `CORNER_LOT`: `13`
- `CUL_DE_SAC_LOT`: `4`
- `FEATURE_LOT`: `1`

Role intent:

- `STANDARD_LOT`:
  - highest-frequency suburban lot
  - suburban brick only for the current suburban budget profile

- `CORNER_LOT`:
  - supports suburban brick and controlled cottage variation

- `CUL_DE_SAC_LOT`:
  - supports suburban brick and controlled cottage variation
  - preserves special frontage and driveway logic

- `FEATURE_LOT`:
  - rare deterministic upgrade from an eligible corner or cul-de-sac lot
  - only role allowed to resolve the rare bungalow variant in the suburban profile

### Variation Budget

Added explicit suburban composition caps:

- maximum coastal cottages: `3`
- maximum beach bungalows: `1`
- maximum feature lots: `1`
- maximum unusual layouts: `5`

This prevents over-specialisation even when the lot geometry provides many corner and cul-de-sac opportunities.

## Resolver Changes

Resolver order is now:

1. `block theme`
2. `lot role`
3. `building budget`
4. `building selection`
5. `variation`

Main generator changes:

- lots now receive `baseLotRole` during lot generation
- deterministic block role planning promotes a limited set of eligible lots to `FEATURE_LOT`
- role-aware asset caps now gate which buildings can appear on each lot type
- the rebalance pass now respects lot roles and block budget constraints instead of swapping freely between any compatible house types

Result:

- standard suburban lots are no longer diluted by excess coastal identity
- rare coastal identity is now deliberate rather than emergent
- the block reads more like a suburban default with controlled exceptions

## Validation Updates

Added validation checks for:

- `blockThemeBudgetValidity`
- `lotRoleValidity`
- `featureLotLimitValidity`

Existing validation still confirms:

- deterministic rebuild stability
- frontage resolution
- adjacent repetition control
- corner-lot rules
- road and driveway validity

Current validation state for seed `10482`:

- `roadConnectivityValid`: `PASS`
- `intersectionValidity`: `PASS`
- `allLotsGenerated`: `PASS`
- `lotBoundaryValidity`: `PASS`
- `lotFrontageValidity`: `PASS`
- `validBuildingIds`: `PASS`
- `buildingPlacementValidity`: `PASS`
- `drivewayConnectionValidity`: `PASS`
- `frontageResolutionValidity`: `PASS`
- `blockThemeBudgetValidity`: `PASS`
- `lotRoleValidity`: `PASS`
- `featureLotLimitValidity`: `PASS`
- `suburbanWeightingValidity`: `PASS`
- `adjacentVariationValidity`: `PASS`
- `cornerLotRuleValidity`: `PASS`
- `streetFeatureContainmentValidity`: `PASS`
- `deterministicRebuildValidity`: `PASS`

Overall:

- `validationPassed: true`

## Expected Visual Improvements

The third `24` lot inspection should now see:

- stronger suburban brick dominance across the whole block
- fewer coastal houses appearing as ordinary background housing
- the bungalow variant reading as a deliberate rare event
- more believable separation between normal lots and special-condition lots
- less visual overstatement from side-street and cul-de-sac variation

## Files Changed

- `asset-factory/suburban-street-block-generator.mjs`
- `tests/asset-factory-suburban-street-block-generator.test.mjs`
- `asset-factory-workspace/procedural-previews/SUBURBAN_STREET_BLOCK_001_PREVIEW_001.json`
- `asset-factory-workspace/procedural-previews/SUBURBAN_STREET_BLOCK_001_PREVIEW_VALIDATION_001.json`
- `asset-factory-workspace/procedural-previews/SUBURBAN_STREET_BLOCK_001_PREVIEW_SCENE_001/preview-scene-metadata.json`

## Tests Run

- `node --test tests/asset-factory-suburban-street-block-generator.test.mjs tests/asset-factory-suburban-street-block-preview-consumer.test.mjs`

Result:

- `9 / 9` tests passed

## Readiness

Status:

- `READY FOR THIRD 24 LOT INSPECTION`

Meaning:

- block composition is now budget-driven
- lot roles are explicit and deterministic
- rare suburban variation is capped
- checked-in preview artifacts match the tuned generator output
