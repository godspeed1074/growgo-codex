# GrowGo Session 34 - Suburban Neighbourhood Assembly Foundation

## Session Scope

This document defines the first procedural suburban neighbourhood assembly foundation for GrowGo.

Target system:

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001`

Purpose:

- procedural Australian suburban street block generation

This session is planning and specification only.

This session does not:

- create Blender assets
- export GLBs
- create final neighbourhood scenes
- modify existing buildings
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## 1. Source of Truth

This Session 34 neighbourhood foundation is based on:

- `GROWGO_SESSION_33_5_SUBURBAN_BRICK_HOUSE_VALIDATION_AND_BUILDING_LIBRARY_REGISTRATION.md`
- `GROWGO_SESSION_30_SUBURBAN_BRICK_HOUSE_RECIPE_ASSEMBLY_TEST_FOUNDATION.md`
- `GROWGO_MODULAR_BIBLE_DESIGN_FOUNDATION.md`
- `ASSET_FACTORY_FOUNDATION.md`
- existing GrowGo modular reuse rules and procedural assembly direction

Relevant continuity:

- the building library now contains validated coastal, bungalow, suburban, café, and bakery building assets
- the suburban residential family now has a reusable identity kit plus shared site and landscape support
- the next procedural step is not a new building, but a deterministic assembly system that places validated buildings and support assets into readable neighbourhood blocks

## 2. Target System Identity

### System ID

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001`

### System purpose

- assemble the first procedural Australian suburban block from validated building-library outputs and supporting site assets

### Assembly intent

The system should generate a neighbourhood that reads clearly as:

- suburban
- low-density residential
- road-facing
- driveway-based
- fenced and landscaped
- readable in north-up 2.5D overview
- deterministic from the same input seed

### First supported building set

Residential buildings:

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`

Supporting assets:

- roads
- sidewalks
- driveways
- fences
- grass verges
- trees
- bushes
- letterboxes
- street furniture

## 3. Neighbourhood Assembly Goal

`NEIGHBOURHOOD_SUBURBAN_BLOCK_001` should define how the system combines:

1. a road layout
2. a lot layout
3. a building resolver
4. a frontage resolver
5. a landscaping resolver
6. a validation pass

The first block should prioritize:

- clear frontage rhythm
- realistic suburban setback spacing
- no building overlap
- lot-contained landscaping
- driveway-to-road continuity
- visible variation without random visual chaos

## 4. Neighbourhood Structure

### Required neighbourhood state

The first neighbourhood assembly contract should define:

- `neighbourhoodId`
- `blockType`
- `seed`
- `roadProfile`
- `lotLayout`
- `buildingPlacements`
- `sitePlacements`
- `landscapePlacements`
- `validationResult`

### First block type

- `suburban_straight_block`

This first block type is the recommended baseline because it validates:

- repetitive lot placement
- road-facing house logic
- driveway spacing
- fence boundary continuity
- landscaping repetition with controlled variation

Future block types can extend the same contract.

## 5. Lot System

### Lot sizing rules

The first suburban block should support a controlled lot range rather than arbitrary sizes.

Recommended lot width ranges:

- narrow lot: `12m-14m`
- standard lot: `15m-18m`
- wide lot: `19m-24m`

Recommended lot depth ranges:

- compact depth: `28m-32m`
- standard depth: `33m-40m`
- deep suburban lot: `41m-48m`

### Frontage width rules

Lot frontage must be wide enough to support:

- house footprint
- driveway
- front-garden transition
- side setbacks

Recommended frontage rules:

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`: prefers standard and wide lots
- `BUILDING_HOUSE_COASTAL_COTTAGE_001`: may appear on narrow or standard lots
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`: prefers standard or wide lots

### House placement rules

Each lot must define:

- front boundary
- rear boundary
- left setback
- right setback
- buildable footprint zone
- driveway side
- front-entry zone

### Setback distances

Recommended first-pass suburban setback rules:

- front setback: `4m-7m`
- side setback: `1.2m-2.5m`
- rear setback: `5m-9m`

### Driveway placement

Driveways should:

- originate from the road edge
- connect to the garage or parking edge of the selected house
- not intersect neighbouring lot zones
- remain on the same side as the resolved garage frontage when required

### Fence boundaries

Fences should:

- define lot edges clearly
- remain aligned with lot boundaries
- avoid blocking driveway access
- support front fence, side fence, and rear fence variants

### Garden zones

Each lot should support:

- front lawn zone
- feature planting zone
- entry planting zone
- side planting strip

### Backyard zones

Each lot should support:

- private rear yard
- secondary tree zone
- optional bush or hedge cluster
- no building placement beyond the rear setback envelope

## 6. Road Orientation and Street Rules

### North-up compatibility

The system must remain compatible with:

- north-up neighbourhood display
- road-aligned camera framing
- future procedural map overlays

### Road-facing building rules

Every house must face the nearest assigned road frontage.

This means:

- the front door and main façade face the lot’s frontage road
- garages align to the road-facing side where applicable
- entry paths lead from the front door toward the frontage edge

### Driveway alignment

Driveways must:

- connect physically and visually from lot frontage to the garage or parking side
- avoid crossing fences or neighboring lots
- preserve readable curb spacing

### Corner lots

Corner lots are future-supported but should already have rules defined:

- primary frontage road
- secondary frontage edge
- fence turn logic
- house rotation rule
- driveway choice priority

Recommended first-pass behavior:

- primary frontage remains deterministic
- driveway prefers the quieter or longer frontage edge when both are valid

### Cul-de-sacs

Future-supported rules:

- wedge-shaped lot tolerance
- center-turning road frontage
- curved fence alignment
- reduced repeated façade patterns around the turning circle

### Straight streets

Straight streets are the first required street type and should define:

- lot rhythm on both sides of the road
- alternating driveway positions where possible
- varied but deterministic house selection
- consistent road verge spacing

## 7. Building Resolver Rules

### Building choice inputs

The building resolver should consider:

- lot width
- lot depth
- road type
- density profile
- suburban vs coastal weighting
- recent placement history
- random seed

### Supported building pool

The initial pool:

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`

### Residential density rules

The first system should support:

- low-density suburban default
- moderate coastal-suburban mix
- future compact estate profile

### Coastal vs suburban weighting

Recommended default weighting for `NEIGHBOURHOOD_SUBURBAN_BLOCK_001`:

- suburban brick house: high priority
- coastal cottage: medium support
- beach bungalow: lower but meaningful support

Suggested first baseline:

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`: `50-60%`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001`: `20-30%`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`: `15-25%`

### Variation prevention

The resolver should avoid:

- identical adjacent house types on both sides of the street
- repeating the same house three lots in a row
- mirror-free repetition where every lot looks cloned

### Deterministic placement

The same:

- `neighbourhoodId`
- `seed`
- road layout
- lot layout

must always generate the same:

- building sequence
- building rotations
- driveway side choices
- planting layout decisions

## 8. Variation System

### House rotation rules

Allowed:

- road-facing flips when geometry permits
- mirrored driveway-side logic when building type supports it

Not allowed:

- random rotation away from frontage
- rear-facing placement
- sideways placement that breaks road readability

### Colour variations

The system should support controlled variation through metadata, not ad hoc asset duplication.

Examples:

- brick tone variation
- roof tone variation
- fence finish variation
- garden palette variation

### Landscaping variations

Lot variation can come from:

- front-lawn width
- bush cluster count
- tree count
- edge planting density
- open-yard vs planted-yard balance

### Fence variations

Allow:

- timber fence
- decorative low front fence
- side privacy fence

Fence variation must remain:

- compatible with the selected lot profile
- compatible with driveway placement
- deterministic from seed

### Tree placement rules

Trees should:

- stay inside lot boundaries
- respect setback and driveway exclusion zones
- avoid blocking front-entry visibility
- avoid floating or clipping through roofs and fences

### Mailbox placement rules

Letterboxes should:

- sit near the road frontage
- align with entry or driveway logic
- remain inside the lot boundary
- not block fence gates or driveway entrances

## 9. Supporting Asset Resolver

### Road assets

The first system should support:

- straight road segments
- curb or verge logic
- sidewalk or simplified footpath edge treatment

### Site assets

The site resolver should place:

- driveway asset
- fence runs
- front-entry path
- front verge grass

### Landscape assets

The landscape resolver should place:

- grass base
- bushes
- trees
- front yard and backyard planting clusters

### Street furniture

Street furniture is optional for the first block but should be supported in the contract:

- benches
- signs
- lights
- bins

The first foundation should treat them as:

- low-priority decorative or readability-enhancing placements
- separate from essential residential-lot validation

## 10. Performance Rules

### Maximum buildings per block

Recommended first-pass limits:

- small block: `6-8` homes
- standard block: `8-12` homes
- upper safe first-pass cap: `12` homes

### LOD transition rules

The block system should use:

- `LOD_MAP` for overview and far neighbourhood read
- `LOD_GAMEPLAY` for street and interaction distance
- `LOD_CLOSE` for focused property or inspection contexts

### Instance reuse

Neighbourhood assembly should strongly prefer:

- repeated validated building exports
- repeated fence segments
- repeated path logic
- repeated vegetation assets

### Mobile performance limits

The system should define:

- capped active building count per block
- controlled vegetation density
- road and fence repetition through instancing
- predictable object-count ceilings

Recommended first-pass safety goals:

- no unconstrained decoration spawning
- no unique geometry per lot when a reusable asset exists
- keep the first neighbourhood block inside a single mobile-safe residential preview budget

## 11. Validation System

The neighbourhood validator should check:

- no building overlap
- no floating assets
- driveway connects to road
- house faces correct direction
- fences align with lots
- trees stay inside lot boundaries

### Required validation outputs

The first assembly validator should record:

- `layoutValid`
- `buildingFacingValid`
- `drivewayConnectivityValid`
- `lotBoundaryValid`
- `landscapeContainmentValid`
- `overlapFree`
- `performanceWithinBudget`

### Overlap rules

Invalid:

- building-to-building overlap
- house-to-fence penetration
- tree trunk inside roof or wall geometry
- driveway cutting through neighbouring lot footprint

### Floating asset rules

Invalid:

- trees above terrain
- fences not grounded to lot edge
- letterboxes floating above verge
- driveways not aligned to the ground plane

## 12. First Block Profiles

### Recommended first profile

- `suburban_mixed_residential_default`

Characteristics:

- suburban brick weighted
- occasional coastal cottage
- occasional beach bungalow
- standard suburban lot sizes
- straight street
- moderate front-yard planting

### Optional future profiles

- `suburban_brick_dominant`
- `coastal_estate_mixed`
- `compact_estate_low_yard`
- `tree_lined_family_street`

## 13. Future Expansion Path

This first system should explicitly support future procedural expansion into:

- suburban streets
- villages
- coastal estates
- apartment blocks
- commercial strips

### Expansion compatibility rules

To support growth cleanly, the assembly system should keep separate:

- road layout rules
- lot rules
- building resolver rules
- frontage resolver rules
- landscape resolver rules
- validation rules

This separation allows:

- apartment-only block profiles
- mixed-use suburban-commercial strips
- larger coastal estates
- village and small-town variants

## 14. Recommended Next Implementation Phase

The next implementation stage after this foundation should define:

1. a neighbourhood assembly contract file
2. deterministic lot-generation metadata
3. a first building resolver using the three validated residential building assets
4. a first validation pass for overlap, frontage, and driveway connectivity
5. a first controlled preview block

## 15. Session Outcome

`NEIGHBOURHOOD_SUBURBAN_BLOCK_001` is now defined as the first procedural suburban neighbourhood assembly foundation for GrowGo.

The system is ready for future procedural assembly work because it now has:

- a lot system definition
- road-facing placement rules
- building resolver rules
- deterministic variation rules
- performance boundaries
- validation rules
- a future-compatible path toward suburban streets, estates, villages, mixed neighbourhoods, and larger town generation
