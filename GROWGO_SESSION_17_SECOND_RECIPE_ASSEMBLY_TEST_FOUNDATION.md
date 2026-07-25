# GrowGo Session 17 - Second Recipe Assembly Test Foundation

## Session Scope

This document defines the first true recipe-reuse validation for the GrowGo Asset Factory by planning the assembly of a second residential asset from the existing Layer A module library.

Target:

- `BUILDING_HOUSE_BEACH_BUNGALOW_001`

Recipe:

- `RECIPE_HOUSE_BEACH_BUNGALOW_001`

This is a documentation and planning session only.

This session does not:

- create duplicate existing modules
- redesign existing modules
- change naming conventions
- create unrelated buildings
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

The purpose of this session is reuse validation.

## 1. Source of Truth

This Session 17 planning document is governed by:

- `GROWGO_SESSION_10_RECIPE_EXPANSION_BATCH_1_FOUNDATION.md`
- `GROWGO_SESSION_16_5_LAYER_A_EXPANSION_VALIDATION_AND_LIBRARY_REGISTRATION.md`
- `GROWGO_SESSION_15_LAYER_A_EXPANSION_BATCH_1_PRODUCTION_PLAN.md`
- `GROWGO_SESSION_9_BLENDER_ASSET_FACTORY_IMPLEMENTATION_PLAN_FOUNDATION.md`

Related follow-on planning document:

- `GROWGO_SESSION_18_COASTAL_BUNGALOW_MODULE_EXPANSION_FOUNDATION.md`

If a future planning document conflicts with these documents, those source documents remain authoritative unless explicitly updated.

## 2. Reuse Validation Purpose

The coastal cottage proof build validated that the first house could be assembled through a controlled Layer A workflow.

Session 17 tests the next question:

- can a second residential asset be planned primarily through reuse of the now-registered Layer A library?

This reuse test must validate:

1. dependency resolution against the current Layer A library
2. missing-module detection without duplicate module creation
3. coastal identity continuity across a second recipe
4. a controlled path from recipe definition to future assembly planning

## 3. Recipe Definition

### Recipe identity

- `recipeID`: `RECIPE_HOUSE_BEACH_BUNGALOW_001`
- `buildingID`: `BUILDING_HOUSE_BEACH_BUNGALOW_001`
- `family`: `FAMILY_HOUSE_COASTAL`

### Purpose

- Australian coastal holiday bungalow

### Style

- GrowGo Papercut 2.5D coastal residential

### Asset intent

The bungalow should read as a lighter, more open, more holiday-oriented coastal house than the cottage proof build while still using the same shared module logic wherever possible.

## 4. Recipe Output Definition

### Footprint

- width: `8m-11m`
- depth: `10m-13m`
- lot type: beachside or foreshore-adjacent lot

### Required modules

- raised coastal foundation module
- `MOD_WALL_WEATHERBOARD_WHITE_001`
- `MOD_WALL_CORNER_STANDARD_001`
- `MOD_ROOF_GABLE_STANDARD_001`
- `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
- large residential window variation or module
- `MOD_DOOR_STANDARD_RESIDENTIAL_001`
- `MOD_VERANDAH_STANDARD_TIMBER_001`
- timber deck module
- `MOD_PATH_STANDARD_001`
- `MOD_FENCE_STANDARD_001`
- `MOD_GROUND_GRASS_STANDARD_001`
- `MOD_BUSH_NATIVE_STANDARD_001`
- `MOD_TREE_EUCALYPTUS_STANDARD_001`

### Optional modules

- `MOD_CHIMNEY_COASTAL_SMALL_001`
- `MOD_TRIM_STANDARD_COASTAL_001`
- coastal stair access module
- `MOD_FLOWERBED_STANDARD_001`
- driveway where lot conditions support it
- porch variant for compact bungalow entries

### Identity modules

- raised coastal foundation module
- timber deck module

### Reused modules

- `MOD_WALL_WEATHERBOARD_WHITE_001`
- `MOD_WALL_CORNER_STANDARD_001`
- `MOD_ROOF_GABLE_STANDARD_001`
- `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
- `MOD_DOOR_STANDARD_RESIDENTIAL_001`
- `MOD_VERANDAH_STANDARD_TIMBER_001`
- `MOD_PATH_STANDARD_001`
- `MOD_FENCE_STANDARD_001`
- `MOD_GROUND_GRASS_STANDARD_001`
- `MOD_BUSH_NATIVE_STANDARD_001`
- `MOD_TREE_EUCALYPTUS_STANDARD_001`

### New modules required

- `MOD_FOUNDATION_RAISED_COASTAL_001`
- `MOD_DECK_TIMBER_COASTAL_001`
- `MOD_WINDOW_RESIDENTIAL_LARGE_001`

### Variation modules required

- `MOD_STAIR_COASTAL_ENTRY_001` as an optional access variation
- verandah layout variation resolved through existing `MOD_VERANDAH_STANDARD_TIMBER_001` configuration before any new verandah module is approved

### Reuse percentage

- required-module reuse estimate: `79%`

Calculation basis:

- 11 required modules reused from the current Layer A library
- 3 required modules currently missing and recommended as new reusable additions
- 11 reused out of 14 required modules = `78.6%`, rounded to `79%`

## 5. Reuse Analysis

### Reused modules

#### Structure

- `MOD_WALL_WEATHERBOARD_WHITE_001`
- `MOD_WALL_CORNER_STANDARD_001`

#### Openings

- `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
- `MOD_DOOR_STANDARD_RESIDENTIAL_001`

#### Roof

- `MOD_ROOF_GABLE_STANDARD_001`

#### Site

- `MOD_PATH_STANDARD_001`
- `MOD_FENCE_STANDARD_001`

#### Landscape

- `MOD_GROUND_GRASS_STANDARD_001`
- `MOD_BUSH_NATIVE_STANDARD_001`
- `MOD_TREE_EUCALYPTUS_STANDARD_001`

#### Exterior

- `MOD_VERANDAH_STANDARD_TIMBER_001`

### New modules required

#### `MOD_FOUNDATION_RAISED_COASTAL_001`

Create only because:

- the existing standard rectangular foundation does not satisfy the elevated coastal bungalow requirement
- a raised coastal foundation is reusable for:
  - beach bungalows
  - raised holiday houses
  - elevated coastal cabins
  - boardwalk-adjacent homes

#### `MOD_DECK_TIMBER_COASTAL_001`

Create only because:

- the current verandah module does not fully cover broader open-air deck use
- a dedicated deck module is reusable for:
  - beach bungalows
  - raised coastal homes
  - motels
  - cafes with outdoor frontage

#### `MOD_WINDOW_RESIDENTIAL_LARGE_001`

Create only because:

- the bungalow silhouette depends on a more open coastal facade
- this module is reusable for:
  - beach bungalows
  - suburban family homes
  - motels
  - civic/community buildings needing larger openings

### Variation modules required

#### `MOD_STAIR_COASTAL_ENTRY_001`

Status:

- optional variation module

Reason:

- stair access supports raised foundations and improves beach-lot plausibility
- should be approved only if the raised-foundation assembly requires a repeatable entry solution across multiple coastal recipes

#### Beach-style verandah variation

Status:

- variation check only, not a new approved module yet

Reason:

- the current `MOD_VERANDAH_STANDARD_TIMBER_001` already supports front, side, and wrap-around use
- a new verandah module should not be created unless assembly testing proves the existing module cannot achieve the intended bungalow frontage cleanly

## 6. Missing Module Detection Result

### Existing Layer A library resolves successfully for

- weatherboard wall system
- standard corner wall
- gable roof
- standard residential window
- standard residential door
- timber verandah
- path system
- fence system
- grass ground cover
- native bush planting
- eucalyptus planting

### Missing from the current registered library

- raised coastal foundation
- dedicated coastal timber deck
- large residential window

### Not approved as required new modules at this stage

- duplicate wall modules
- duplicate gable roof modules
- duplicate site modules
- duplicate landscape modules
- duplicate verandah family modules

## 7. Assembly Validation Flow

The reuse test should follow the approved Asset Factory implementation order:

Recipe

↓

Dependency Resolver

↓

Existing Layer A Library

↓

Missing Module Detection

↓

Assembly Plan

### Expected validation outcome

#### Reuse

- existing modules should satisfy the majority of the bungalow shell, site, and landscape requirements

#### Modularity

- no duplicate Layer A modules should be introduced where the current library already covers the need

#### Style

- the bungalow must remain visibly coastal
- the asset must still align with GrowGo Papercut 2.5D readability

#### Technical

- naming must remain permanent-ID compliant
- metadata must remain recipe-driven
- LOD expectations must mirror the current Layer A standards

## 8. Coastal Identity and Style Safeguards

The bungalow must remain a coastal-family asset, not just a cottage with a new label.

It should differ from the cottage through:

- raised living posture
- stronger outdoor living through deck use
- larger openings for a lighter facade
- beach-lot relationship

It should not diverge from the approved style through:

- photorealism
- over-detailed structure
- a new incompatible roof language
- a one-off module set that cannot serve future coastal-family recipes

## 9. Recommended Production Order

Only after Session 17 planning is approved, the recommended next production order is:

1. `MOD_FOUNDATION_RAISED_COASTAL_001`
2. `MOD_WINDOW_RESIDENTIAL_LARGE_001`
3. `MOD_DECK_TIMBER_COASTAL_001`
4. optional evaluation of `MOD_STAIR_COASTAL_ENTRY_001`
5. recipe assembly test for `RECIPE_HOUSE_BEACH_BUNGALOW_001`
6. bungalow shell validation before any landscaping or optional detail expansion

### Production-order rationale

- raised foundation is the key identity blocker
- large window unlocks both bungalow readability and wider future house-family reuse
- deck module completes the holiday-house frontage language
- stair access is useful but should remain conditional

## 10. Session Outcome

Session 17 defines the second recipe assembly test as a controlled reuse-validation milestone for the GrowGo Asset Factory.

It confirms that:

- the current Layer A library is strong enough to support most of a second residential recipe
- the bungalow can be planned primarily through reuse
- only a small set of new reusable modules are justified
- the factory dependency system is ready for a real second-recipe reuse test

No Blender production is performed in this session.
