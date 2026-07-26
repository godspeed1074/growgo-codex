# GrowGo Session 35 - Suburban Neighbourhood Assembly Contract and Preview Block Foundation

## Session Scope

This document defines the first procedural neighbourhood assembly contract for the controlled suburban preview block.

Target system:

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001`

Purpose:

- first procedural suburban block preview system

This session is contract and foundation only.

This session does not:

- create final neighbourhood assets
- create Blender production files
- create new buildings
- create new modules
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## 1. Source of Truth

This Session 35 assembly contract is based on:

- `GROWGO_SESSION_34_SUBURBAN_NEIGHBOURHOOD_ASSEMBLY_FOUNDATION.md`
- `GROWGO_SESSION_33_5_SUBURBAN_BRICK_HOUSE_VALIDATION_AND_BUILDING_LIBRARY_REGISTRATION.md`
- existing Asset Factory building registration and module registration patterns

Relevant continuity:

- the suburban neighbourhood foundation already defined lot logic, road-facing rules, variation boundaries, and validation goals
- the validated residential building library now contains suburban, coastal cottage, and beach bungalow families
- the next step is a controlled contract that can describe a small preview block deterministically before any full procedural neighbourhood generation begins

## 2. Target Preview System

### System ID

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001`

### Preview purpose

- define the smallest useful procedural suburban preview block
- prove deterministic lot generation
- prove deterministic building resolution
- prove lot-safe placement and validation

### Preview intent

The first preview block should read clearly as:

- suburban
- low-density
- road-facing
- driveway-based
- fenced
- landscaped
- north-up compatible
- deterministic from the same seed

## 3. Preview Block Target

### Block size

The first preview block should be a:

- small controlled test area

Recommended first-pass physical scale:

- frontage span: `90m-130m`
- total depth span: `55m-85m`

### Lot count

The first preview block should support:

- `6 to 8` residential lots

Recommended first baseline:

- `3 to 4` lots per street side

### Required preview contents

The preview block must include:

- road segment
- sidewalks
- grass verges
- driveways
- fences
- houses
- landscaping

### First supported block profile

- `suburban_preview_straight_street`

This profile is recommended because it validates:

- basic lot rhythm
- road-facing building placement
- driveway spacing
- alternating frontage variation
- deterministic rebuild behavior

## 4. Neighbourhood Contract

### Required neighbourhood object

`NEIGHBOURHOOD_SUBURBAN_BLOCK_001` should define:

- `neighbourhoodId`
- `blockType`
- `seed`
- `previewProfile`
- `bounds`
- `roadSegment`
- `sidewalkLayout`
- `vergeLayout`
- `lots`
- `buildingPlacements`
- `sitePlacements`
- `landscapePlacements`
- `validationResult`

### Contract intent

This object exists to:

- describe the preview block completely
- remain deterministic
- separate lot generation from building resolution
- separate placement logic from validation logic

## 5. Lot Generator Contract

### Lot object ID

- `LOT_SUBURBAN_RESIDENTIAL_001`

### Lot object properties

Each lot object must contain:

- `lotId`
- `position`
- `width`
- `depth`
- `frontageDirection`
- `frontBoundary`
- `rearBoundary`
- `leftBoundary`
- `rightBoundary`
- `buildingSocket`
- `drivewaySocket`
- `fenceBoundary`
- `landscapingZones`
- `setbackProfile`
- `lotType`

### Position

`position` should represent:

- the lot origin in neighbourhood space
- deterministic placement anchor
- lot-local transform reference for building and site placements

### Width and depth

First-pass lot dimensions should remain inside the Session 34 suburban rules:

- narrow lot width: `12m-14m`
- standard lot width: `15m-18m`
- wide lot width: `19m-24m`
- depth range: `28m-48m`

### Frontage direction

`frontageDirection` must support:

- `north`
- `south`
- `east`
- `west`

The first preview block should primarily use:

- one pair of opposing directions along a straight street

### Building socket

`buildingSocket` should define:

- lot-local anchor for the house placement origin
- allowable rotation
- maximum footprint width
- maximum footprint depth
- permitted front setback range

### Driveway socket

`drivewaySocket` should define:

- road-edge connection point
- driveway-side preference
- garage-alignment direction
- exclusion zone overlap with entry path

### Fence boundary

`fenceBoundary` should define:

- front fence segment
- left side fence segment
- right side fence segment
- rear fence segment
- driveway opening allowance
- gate or entry allowance where required

### Landscaping zones

`landscapingZones` should define:

- `frontLawnZone`
- `entryPlantingZone`
- `sidePlantingZone`
- `backyardZone`
- `treeZone`
- `bushClusterZone`

## 6. Building Resolver Contract

### Resolver purpose

The building resolver must map:

- neighbourhood seed
- lot position
- neighbourhood theme

to:

- a deterministic residential building selection

### Resolver input

Required input:

- `seed`
- `lotId`
- `lotWidth`
- `lotDepth`
- `frontageDirection`
- `neighbourhoodTheme`
- `adjacentLotSelections`

### Resolver output

Required output:

- `buildingAssetId`
- `buildingFamily`
- `placementRotation`
- `setbackDistance`
- `drivewaySide`
- `variationProfile`
- `resolverReasoning`

### Supported building output pool

The resolver may select from:

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`

### Resolver rules

The first resolver must:

- avoid identical rows
- maintain neighbourhood style
- remain deterministic
- produce reproducible output

### Variation-prevention rules

The first resolver should prevent:

- the same house appearing three lots in a row
- mirrored duplication across directly opposite lots when avoidable
- a full block dominated by the same non-primary house type

### Neighbourhood style rules

The first preview block should use:

- suburban brick as the dominant identity
- coastal cottage as a compatible secondary variation
- beach bungalow as a limited tertiary variation

Recommended first weighting:

- suburban brick: `50-60%`
- coastal cottage: `20-30%`
- beach bungalow: `15-25%`

## 7. Placement Rules

### Building placement rules

Each placed building must define:

- `assetId`
- `lotId`
- `position`
- `rotation`
- `frontSetback`
- `leftSetback`
- `rightSetback`
- `rearClearance`
- `drivewayConnectionState`

### Setback distance

Use the approved suburban ranges:

- front setback: `4m-7m`
- side setback: `1.2m-2.5m`
- rear setback: `5m-9m`

### Rotation

Building rotation rules:

- front façade must face the assigned road
- mirrored placement is allowed when driveway and entry alignment remain valid
- no side-facing or rear-facing placements are allowed for the first preview block

### Road alignment

Road alignment rules:

- main façade faces the road edge
- entry path leads toward the frontage edge
- garage frontage aligns to the driveway side when relevant

### Driveway connection

Driveway rules:

- driveway must connect lot frontage to parking or garage edge
- driveway must not cross neighbouring lots
- driveway must not intersect fence segments except approved driveway opening

### Fence alignment

Fence rules:

- fence follows lot boundary
- fence leaves driveway gap where required
- rear and side boundaries remain continuous

## 8. Landscaping Contract

### Landscaping placement definition

Each landscaping placement should define:

- `assetId`
- `lotId`
- `zoneId`
- `position`
- `rotation`
- `scaleVariant`
- `landscapeType`

### Tree placement rules

Trees must:

- stay inside their assigned lot or verge zone
- avoid driveways
- avoid blocking entry paths
- avoid overlapping buildings and fences

### Bush placement rules

Bushes must:

- stay inside planting zones
- support front-yard and side-yard variation
- avoid the driveway and front-door access line

### Lawn rules

The system should assume:

- every lot has a front lawn presence
- lawn coverage may vary by lot width and house selection
- lawns should visually separate neighbours even before fence detail is read

### Variation rules

The first landscaping variation system should support:

- low tree density
- moderate tree density
- open front yard
- planted front yard
- heavier backyard planting

Variation must remain:

- deterministic
- lot-safe
- style-consistent

## 9. Validation Contract

### Automated validation checks

The preview block contract must support automated checks for:

Building:

- inside lot boundary
- correct orientation
- no overlap

Driveway:

- connects lot to road

Fence:

- follows lot boundary

Landscaping:

- stays inside lot

Neighbourhood:

- no collisions
- deterministic rebuild produces same result

### Required validation fields

The first validation object should define:

- `layoutValid`
- `lotDimensionsValid`
- `buildingInsideLotValid`
- `buildingOrientationValid`
- `buildingOverlapFree`
- `drivewayConnectivityValid`
- `fenceAlignmentValid`
- `landscapeContainmentValid`
- `neighbourhoodCollisionFree`
- `deterministicRebuildValid`
- `performanceWithinPreviewBudget`

### Deterministic rebuild rule

If these stay the same:

- neighbourhood seed
- block type
- lot count
- neighbourhood theme

then these must also stay the same:

- lot positions
- building choices
- driveway sides
- landscaping placements

### Collision rule

The first collision validator must detect:

- building-to-building overlap
- building-to-fence overlap
- driveway-to-neighbour-lot intrusion
- tree or bush placement intersecting restricted zones

## 10. Preview Block Specification

### First preview block profile

- `PREVIEW_SUBURBAN_BLOCK_SMALL_001`

### Suggested first preview parameters

- lot count: `6`
- road type: `straight_local_residential`
- theme: `suburban_mixed_residential_default`
- house dominance: suburban brick weighted
- landscaping density: moderate
- street-tree density: light to moderate

### Preview block contents

The preview block should include:

- `1` road segment spine
- `2` sidewalk runs
- `2` verge bands
- `6` residential lots
- `6` house placements
- `6` driveway placements
- `6` fence boundary sets
- deterministic landscaping per lot

### Preview success criteria

The first preview block is considered contract-ready when it can describe:

- lot generation clearly
- building resolution clearly
- placement transforms clearly
- validation rules clearly
- future expansion compatibility clearly

## 11. Future Procedural Expansion Path

This contract should explicitly support future growth into:

- larger suburbs
- villages
- coastal estates
- mixed residential districts
- commercial streets
- town centres

### Compatibility rules for expansion

To scale cleanly, future systems should keep separate:

- neighbourhood contract
- lot generation contract
- building resolver
- site resolver
- landscaping resolver
- validation contract

This allows:

- larger street blocks
- corner-lot handling
- cul-de-sac handling
- denser residential profiles
- mixed-use street edges
- future commercial strip insertion

## 12. Recommended Next Implementation Step

The next implementation stage after this contract should define:

1. a first machine-readable neighbourhood contract file
2. a deterministic lot generator for `6-8` lots
3. a first building resolver implementation using the three validated residential buildings
4. a first preview validation pass
5. a first controlled preview block output for inspection

## 13. Session Outcome

`NEIGHBOURHOOD_SUBURBAN_BLOCK_001` now has a controlled procedural assembly contract for the first preview block.

The system is ready for the next procedural preview step because it now has:

- a defined neighbourhood object
- a defined lot object contract
- a deterministic building resolver definition
- placement rules for houses, driveways, fences, and landscaping
- an explicit automated validation contract
- a preview-block profile that can scale into larger suburban and mixed neighbourhood systems later
