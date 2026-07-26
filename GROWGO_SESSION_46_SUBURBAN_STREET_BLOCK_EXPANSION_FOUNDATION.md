# GrowGo Session 46 - Suburban Street Block Expansion Foundation

## Session Scope

This session defines the procedural foundation for scaling the first six-lot suburban neighbourhood preview into a larger multi-street suburban block system.

Target system:

- `SUBURBAN_STREET_BLOCK_001`

Purpose:

- procedural Australian suburban street block generation

This session is planning and specification only.

This session does not:

- create Blender assets
- create exports
- create new buildings
- create new modules
- modify registered GLBs
- create a final suburb
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## 1. Source of Truth

This expansion foundation is based on:

- `GROWGO_SESSION_45_FINAL_SUBURBAN_NEIGHBOURHOOD_PREVIEW_APPROVAL_INSPECTION.md`
- `GROWGO_SESSION_45_5_LIVE_BLENDER_SUBURBAN_NEIGHBOURHOOD_CAPTURE_SIGNOFF.md`
- `GROWGO_SESSION_44_SUBURBAN_NEIGHBOURHOOD_PREVIEW_POLISH_AND_THEME_TUNING.md`
- `GROWGO_SESSION_36_MACHINE_READABLE_SUBURBAN_NEIGHBOURHOOD_GENERATOR_CONTRACT.md`

Continuity assumptions:

- the six-lot preview contract remains the validated base unit
- the current suburban identity weighting remains the default suburban production direction
- Blender capture remains operationally blocked on Sunday, July 26, 2026, so this session should not depend on live viewport output
- expansion planning must stay machine-readable and deterministic

## 2. Scaling Goal

Expand from:

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001`
- `6` lots

Expand to:

- `SUBURBAN_STREET_BLOCK_001`
- `20-50` lots

The scaled system should preserve:

- deterministic rebuild
- suburban identity control
- driveway and fence logic
- verge and footpath consistency
- preview-first validation before any larger visual assembly

## 3. Street Block Definition

### System ID

- `SUBURBAN_STREET_BLOCK_001`

### Purpose

`SUBURBAN_STREET_BLOCK_001` is the first procedural street-block contract that combines multiple residential street segments into a readable, validation-friendly suburban district unit.

### Core responsibilities

- generate multiple connected streets
- generate 20-50 residential lots
- resolve supported house assets deterministically
- support corner and internal lots
- expose road, footpath, verge, driveway, fence, and landscaping relationships
- validate the generated block before any preview consumer or scene assembly step

## 4. Proposed Machine-Readable Expansion Schema

### Primary schema ID

- `SUBURBAN_STREET_BLOCK_001`

### Supporting schema set

Recommended new schema identities:

- `SUBURBAN_STREET_SEGMENT_001`
- `SUBURBAN_INTERSECTION_NODE_001`
- `SUBURBAN_CORNER_LOT_001`
- `SUBURBAN_STREET_FEATURE_INSTANCE_001`

### Required top-level fields

- `schemaId`
- `streetBlockId`
- `generationProfile`
- `seedConfig`
- `themeProfile`
- `roadNetwork`
- `streetSegments`
- `intersectionNodes`
- `lotCount`
- `lots`
- `buildingPlacements`
- `landscapePlacements`
- `streetFeaturePlacements`
- `roadFrontageConnections`
- `validationContract`
- `validationResult`

### Suggested top-level shape

```json
{
  "schemaId": "SUBURBAN_STREET_BLOCK_001",
  "streetBlockId": "SUBURBAN_STREET_BLOCK_001_A",
  "generationProfile": "suburban_multi_street_default",
  "seedConfig": {},
  "themeProfile": {},
  "roadNetwork": {},
  "streetSegments": [],
  "intersectionNodes": [],
  "lotCount": 24,
  "lots": [],
  "buildingPlacements": [],
  "landscapePlacements": [],
  "streetFeaturePlacements": [],
  "roadFrontageConnections": [],
  "validationContract": {},
  "validationResult": {}
}
```

## 5. Street Network Rules

### Street forms supported

The first expansion foundation should support:

- straight streets
- corner streets
- four-way intersections
- T intersections
- cul-de-sacs

### Road hierarchy

Recommended first hierarchy:

1. `local_residential_street`
2. `collector_residential_street`
3. `cul_de_sac_residential_loop`

Meaning:

- local streets host most lots directly
- collectors connect local streets and define larger block structure
- cul-de-sacs provide controlled variation and lower-density lot groupings

### Orientation rules

- system remains north-up
- each street segment declares its orientation explicitly
- lot frontage direction must be derived from the street edge it faces
- corner lots may choose between two legal street faces, but must resolve deterministically

### Connectivity rules

Each street segment must define:

- `streetSegmentId`
- `roadType`
- `startNodeId`
- `endNodeId`
- `orientation`
- `length`
- `roadWidth`
- `sidewalkWidth`
- `vergeWidth`
- `adjacentLotRanges`

Each intersection node must define:

- `nodeId`
- `nodeType`
- `position`
- `connectedStreetSegmentIds`
- `turnRules`

## 6. Lot Generation Rules

### Lot count and distribution

The system should support:

- minimum: `20` lots
- maximum: `50` lots

Recommended first implementation bands:

- small block: `20-24`
- medium block: `25-36`
- large block: `37-50`

### Lot types

The expanded system should resolve:

- interior standard lots
- narrow lots
- wide lots
- corner lots
- cul-de-sac lots

### Lot frontage

Lot frontage widths should vary within controlled suburban bands:

- narrow: `12-14m`
- standard: `15-18m`
- wide: `19-24m`
- corner lots: variable, depending on secondary street edge

### Setback rules

The current setback pattern should expand into profile-based rules:

- standard suburban profile
- wide-lot suburban profile
- corner-lot suburban profile
- cul-de-sac suburban profile

Each profile should define:

- front setback
- rear setback
- primary side setback
- secondary side setback
- visibility buffer for corner conditions

### Driveway positioning

Driveways must continue to be:

- side-aware
- garage-aligned
- road-connected
- non-crossing with neighbouring lots

Additional scaling rules:

- corner lots may have an alternate driveway street
- cul-de-sac lots may prefer curved or fan-shaped frontage alignment
- driveway spacing should avoid repetitive left-right striping across entire streets

### Fence rules

Fence expansion should preserve:

- front boundary logic
- side and rear boundaries
- driveway openings
- pedestrian access openings

Additional scaling rules:

- corner lots need dual frontage fence treatment
- collector-adjacent lots may use more open front presentation
- rear-lane support may be added later, but is not part of `SUBURBAN_STREET_BLOCK_001`

### Landscaping zones

Each lot should continue to expose:

- front lawn zone
- backyard zone
- side planting zone
- tree zone

Additional optional zones for expansion:

- corner visibility planting zone
- driveway edge planting zone
- mailbox verge zone

## 7. Building Resolver Expansion

### Supported buildings

The first expanded street block continues to use:

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`

### Default suburban weighting

Recommended default `SUBURBAN_AUSTRALIA` production weighting remains:

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`: `85%`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001`: `12%`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`: `3%`

### Resolver expansion goals

The resolver must expand to support:

- street-by-street variation
- corner-lot variation
- cul-de-sac variation
- row repetition prevention
- cross-street repetition prevention

### Repetition prevention rules

Recommended first rules:

- no identical adjacent houses on the same street side
- no identical facing pairs across a street when avoidable
- no more than two identical houses within a short local cluster
- corner lots should bias toward higher-identity placements when available

### Resolver profiles

Suggested resolver tags:

- `suburban_primary_row`
- `suburban_secondary_row`
- `corner_lot_emphasis`
- `cul_de_sac_mix`
- `collector_edge_mix`

These tags should explain why a house was chosen, not just which one was chosen.

## 8. Street Feature Foundation

### Features to support

The street block contract should reserve support for:

- sidewalks
- grass verges
- street trees
- street signs
- mailboxes
- bins
- street furniture

### First-phase rule boundary

For `SUBURBAN_STREET_BLOCK_001`, these features should be defined as machine-readable placement classes before any new assets are introduced.

Meaning:

- the contract should describe where and why these features belong
- future sessions may connect actual asset instances to those placement rules

### Suggested feature schema fields

Each street feature placement should define:

- `featurePlacementId`
- `featureType`
- `streetSegmentId`
- `relatedLotId`
- `position`
- `rotation`
- `placementRule`
- `spacingRule`
- `validationTags`

## 9. Performance Foundation

### Performance targets

The street block expansion must remain compatible with:

- preview-first generation
- instance reuse
- mobile-friendly complexity

### Proposed performance rules

- maximum visible buildings in preview mode: `50`
- use instance reuse for every repeated building asset
- use instance reuse for landscape and future street-feature placements
- prefer LOD gameplay representations during block preview
- reserve detailed close inspection for future focused camera slices, not full-block overview

### Preview limits

Recommended preview bands:

- implementation preview: `20-24` lots
- mid-scale preview: `25-36` lots
- upper preview limit before further review: `50` lots

### LOD expectations

At block scale:

- buildings: `LOD_GAMEPLAY`
- landscape: gameplay or map-friendly preview representations
- street furniture: simplified placement markers until dedicated asset sessions exist

## 10. Expanded Validation Approach

### Validation goals

The expanded system must validate:

- road connectivity
- lot boundaries
- building spacing
- driveway access
- pedestrian access
- street consistency
- deterministic rebuild

### Required validation checks

Recommended first validation set:

- `roadConnectivityValid`
- `intersectionNodeConsistencyValid`
- `lotBoundaryValidity`
- `cornerLotValidity`
- `buildingSpacingValid`
- `drivewayAccessValid`
- `pedestrianAccessValid`
- `fenceOpeningValidity`
- `streetThemeWeightingValid`
- `streetIdentityScoreValid`
- `streetTreeContainmentValid`
- `vergeAlignmentValid`
- `footpathAlignmentValid`
- `deterministicRebuildValid`

### Validation meanings

- road connectivity:
  every street segment terminates at valid nodes
- lot boundaries:
  lots do not overlap and remain inside block bounds
- building spacing:
  building footprints do not collide and respect setbacks
- driveway access:
  each lot has a valid driveway path to its chosen street
- pedestrian access:
  footpath and pedestrian opening logic remain readable and legal
- street consistency:
  street-level building mix aligns with the active suburban theme
- deterministic rebuild:
  same seed always regenerates the same street block

## 11. Scaling Strategy

### Recommended implementation sequence

1. Define `SUBURBAN_STREET_BLOCK_001` top-level schema
2. Define street segment and intersection contracts
3. Expand lot generation from single street to multi-street layout
4. Expand building resolver to street-aware and corner-aware logic
5. Expand validation to connectivity and block-scale spacing
6. Produce a first machine-readable `20-24` lot preview before attempting upper-range lot counts

### Suggested first controlled expansion size

Recommended first implementation target:

- `24` lots

Reason:

- large enough to prove multi-street logic
- small enough to inspect deterministically
- manageable for preview validation before moving toward `50` lots

## 12. Future Expansion Support

This foundation should explicitly leave room for:

- larger suburbs
- neighbourhood clusters
- town districts
- commercial streets
- schools
- parks
- transport corridors

Future compatibility expectations:

- residential-only logic in `SUBURBAN_STREET_BLOCK_001` should be extensible, not rewritten
- mixed-use additions should connect through street and lot contracts rather than bypassing them
- later civic, school, and park generators should attach to the same road network and validation framework

## 13. Readiness

Status:

- `READY FOR IMPLEMENTATION PLANNING`

Meaning:

- the six-lot suburban preview has now been translated into a scalable street-block design direction
- the next practical step is to create the machine-readable street-block contract and a first controlled `20-24` lot implementation target
- no new buildings or modules are required before that contract work begins
