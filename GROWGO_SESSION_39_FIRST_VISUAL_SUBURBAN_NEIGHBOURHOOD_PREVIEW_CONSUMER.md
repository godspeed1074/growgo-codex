# GrowGo Session 39 - First Visual Suburban Neighbourhood Preview Consumer

## Session Scope

This document defines the first visual preview consumer for the deterministic suburban neighbourhood preview.

Target system:

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_CONSUMER_001`

Purpose:

- convert deterministic placement data into an inspectable visual preview

This session is a preview consumer foundation.

This session does not:

- create production neighbourhood assets
- create new buildings
- create new modules
- modify registered GLBs
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## 1. Source of Truth

This Session 39 preview consumer is based on:

- `GROWGO_SESSION_38_PROCEDURAL_NEIGHBOURHOOD_PREVIEW_ADAPTER_FOUNDATION.md`
- `GROWGO_SESSION_37_DETERMINISTIC_SUBURBAN_PREVIEW_GENERATOR.md`
- `GROWGO_SESSION_35_SUBURBAN_NEIGHBOURHOOD_ASSEMBLY_CONTRACT_FOUNDATION.md`
- existing Asset Factory building registration patterns

Relevant continuity:

- Session 35 defined the controlled preview block layout and placement intent
- Session 37 produced the first executable six-lot deterministic preview JSON
- Session 38 defined the adapter contract that maps procedural output into a visual preview scene contract
- Session 39 defines the first consumer that turns that contract into something a human can inspect clearly

## 2. Target Consumer

### Consumer ID

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_CONSUMER_001`

### Consumer purpose

The consumer exists to read:

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001.json`

and produce:

- a first inspectable visual neighbourhood preview
- a companion preview validation report

### First validation report ID

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_VALIDATION_001`

### Consumer boundaries

The consumer must:

- preserve the source placement data
- preserve registered building identity
- preserve deterministic transforms
- add only preview-layer visual inspection aids

The consumer must not:

- generate new buildings
- alter registered assets
- re-resolve procedural choices
- become a production town or district system

## 3. Input Contract

### Source preview input

The consumer reads:

- `asset-factory-workspace/procedural-previews/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001.json`

### Required input sections

The consumer must read:

- `lots`
- `buildingPlacements`
- `landscapePlacements`
- `roadFrontageConnections`
- `validationContract`
- `validationResult`

### Required building asset IDs

The consumer must resolve:

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`

### Input safety rules

The consumer should fail clearly if:

- a building ID does not resolve
- a lot has no building placement
- a placement transform is incomplete
- validation state and source scene identity do not agree

## 4. Consumer Output Contract

### Primary preview scene

The first consumer output should be:

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001`

### Required output fields

- `sceneId`
- `consumerId`
- `sourcePreviewId`
- `sourceSeed`
- `cameraProfile`
- `roadLayer`
- `lotLayer`
- `buildingLayer`
- `drivewayLayer`
- `fenceLayer`
- `landscapeLayer`
- `debugLayer`
- `validationLayer`
- `performanceProfile`

### Suggested machine-readable shape

```json
{
  "sceneId": "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001",
  "consumerId": "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_CONSUMER_001",
  "sourcePreviewId": "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001",
  "sourceSeed": 10482,
  "cameraProfile": {},
  "roadLayer": {},
  "lotLayer": {},
  "buildingLayer": {},
  "drivewayLayer": {},
  "fenceLayer": {},
  "landscapeLayer": {},
  "debugLayer": {},
  "validationLayer": {},
  "performanceProfile": {}
}
```

## 5. Visual Output Approach

### Visual inspection intent

The first preview should make it easy to inspect:

- building spacing
- road alignment
- driveway placement
- house orientation
- fence placement
- landscaping containment

### Preview composition

The consumer should present the neighbourhood as layered inspection data:

- road and frontage base
- lots and lot IDs
- registered building instances
- driveway and fence alignment overlays
- landscaping placements
- debug and validation markers

### Camera framing

The default camera profile should:

- show the full six-lot block
- remain north-up compatible
- keep road alignment obvious
- make building spacing and driveway relationships readable

Recommended first-pass framing:

- elevated inspection angle
- moderate downward tilt
- whole-block framing with slight padding

## 6. Road and Frontage Layer

### Road requirements

The preview must show:

- street segment
- road edges
- frontage relationship

### Road layer contents

The road layer should expose:

- road footprint
- frontage edge references for each lot
- sidewalk and verge bands where available from preview data

### Frontage readability

The road representation should make it immediately clear:

- which side of each lot faces the street
- which building orientation is correct
- where each driveway must connect

## 7. Lot Layer

### Lot requirements

The preview must show:

- visible lot boundaries
- lot IDs

### Lot layer contents

Each lot preview should expose:

- lot outline polyline
- frontage edge highlight
- driveway opening marker
- lot label anchor

### Inspection goal

The lot layer exists to confirm:

- no building sits outside its lot
- no fence drifts outside the lot boundary
- landscaping remains inside allowed zones

## 8. Building Layer

### Building instance requirements

Buildings must appear with:

- correct position
- correct rotation
- correct scale

### Building resolution rules

For each source placement:

- `assetId` resolves through the registered building library
- `position` is copied directly from source placement data
- `rotation.yawDegrees` is preserved exactly
- `scale` remains source-defined
- `lodProfile` defaults to preview-safe gameplay inspection level

### Building layer contents

Each building instance should expose:

- `instanceId`
- `assetId`
- `lotId`
- `position`
- `rotation`
- `scale`
- `lodProfile`
- `variationProfile`

### Building inspection goals

The building layer should make it easy to confirm:

- spacing between neighbouring homes
- consistent road-facing orientation
- no unexpected asset substitution
- no duplicate geometry generation

## 9. Driveway Layer

### Driveway requirements

Driveways must appear:

- connected to road

### Driveway layer contents

Each driveway preview should expose:

- lot-side start point
- road-side connection point
- driveway side identity
- alignment status

### Driveway inspection goals

The driveway layer should make it easy to confirm:

- each lot has the expected driveway side
- the driveway points toward the correct road frontage
- no driveway disconnects from the road

## 10. Fence Layer

### Fence requirements

Fences must appear:

- aligned to lot boundaries

### Fence layer contents

Each lot fence preview should expose:

- rear boundary segment
- left side segment
- right side segment
- front boundary state
- driveway opening gap

### Fence inspection goals

The fence layer should make it easy to confirm:

- fences stay on lot boundaries
- driveway gaps are placed on the correct side
- no fence crosses into neighbouring lots

## 11. Landscape Layer

### Landscaping requirements

The preview must include:

- trees
- bushes
- lawn areas

### Landscape layer contents

Each landscape instance should expose:

- `instanceId`
- `assetId`
- `landscapeType`
- `lotId`
- `zoneId`
- `position`
- `rotation`
- `variationSeed`

### Landscape inspection goals

The landscape layer should make it easy to confirm:

- trees remain inside tree zones
- bushes remain inside planting zones
- lawn areas stay inside front or backyard zones
- landscaping does not overlap building footprints

## 12. Debug Visualization

### Required debug helpers

The consumer should include:

- lot boundary markers
- building orientation arrows
- driveway connection indicators
- validation status markers

### Lot boundary markers

Purpose:

- make lot containment visible without inspecting raw numbers

### Building orientation arrows

Purpose:

- show house facing direction at a glance

### Driveway connection indicators

Purpose:

- show whether the lot-to-road driveway relationship is valid

### Validation status markers

Purpose:

- show pass or fail states directly in the preview

### Marker colour rules

Recommended first-pass marker states:

- `GREEN`: PASS
- `RED`: FAIL

These colours are debug-only and should not imply final production styling.

## 13. Validation Report Contract

### Validation report ID

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_VALIDATION_001`

### Required validation checks

The consumer should generate a preview validation report that checks:

- all building IDs resolve
- all lots contain buildings
- no placement overlap
- all driveways connect
- deterministic output matches source JSON

### Suggested report shape

```json
{
  "validationId": "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_VALIDATION_001",
  "sourcePreviewId": "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001",
  "checks": {
    "buildingIdsResolve": "PASS",
    "lotsContainBuildings": "PASS",
    "noPlacementOverlap": "PASS",
    "allDrivewaysConnect": "PASS",
    "deterministicSourceMatch": "PASS"
  },
  "markerSummary": {
    "passMarkers": 0,
    "failMarkers": 0
  }
}
```

### Validation layer intent

The validation layer should support:

- fast procedural inspection
- comparison between source procedural state and preview-consumer state
- confidence before future Atlas or Blender preview integration

## 14. Performance Rules

The first preview consumer must remain lightweight and controlled.

### Required performance boundaries

- instance reuse
- no duplicate building geometry
- preview-only assets and overlays
- small controlled scene size

### First-pass object scale

The first preview consumer should stay limited to:

- one six-lot preview block
- six building instances
- six lot outlines
- six driveway connection previews
- six fence previews
- source-driven landscaping instances only

### Reuse rule

The consumer should always reference:

- registered building assets
- preview overlay primitives

and should never create duplicate residential building geometry per lot.

## 15. Readiness and Future Use

The first visual suburban neighbourhood preview consumer is ready to support:

- the first inspectable six-lot suburban block
- visual review of procedural spacing and orientation
- debug review of driveway, fence, and lot containment logic
- future adaptation into Atlas Engine or Blender preview tooling

The next recommended step is:

- implementing the first executable preview consumer that reads `NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001.json`, resolves the registered house set, emits `NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001`, and generates `NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_VALIDATION_001`
