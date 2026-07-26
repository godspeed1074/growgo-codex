# GrowGo Session 38 - Procedural Neighbourhood Preview Adapter Foundation

## Session Scope

This document defines the first preview adapter foundation for converting deterministic procedural neighbourhood data into a visual inspection-ready preview contract.

Target system:

- `NEIGHBOURHOOD_PREVIEW_ADAPTER_001`

Purpose:

- convert procedural neighbourhood JSON output into a visual preview contract

This session is adapter and foundation only.

This session does not:

- create final neighbourhood assets
- create new buildings
- create new modules
- modify existing GLBs
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## 1. Source of Truth

This Session 38 preview adapter foundation is based on:

- `GROWGO_SESSION_37_DETERMINISTIC_SUBURBAN_PREVIEW_GENERATOR.md`
- `GROWGO_SESSION_36_MACHINE_READABLE_SUBURBAN_NEIGHBOURHOOD_GENERATOR_CONTRACT.md`
- `GROWGO_SESSION_35_SUBURBAN_NEIGHBOURHOOD_ASSEMBLY_CONTRACT_FOUNDATION.md`
- existing Asset Factory building registration and placement patterns

Relevant continuity:

- Session 35 defined the controlled suburban preview block in assembly terms
- Session 36 defined the machine-readable neighbourhood schemas
- Session 37 produced the first executable six-lot deterministic preview JSON
- the next step is a visual-preview adapter that can consume that JSON without introducing renderer or asset-production changes

## 2. Target Adapter System

### Adapter ID

- `NEIGHBOURHOOD_PREVIEW_ADAPTER_001`

### Adapter purpose

The adapter exists to transform:

- neighbourhood lot data
- building placement data
- landscape placement data
- road frontage connections
- validation results

into:

- a visual inspection-ready preview scene contract

### First supported preview scene

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001`

### First supported source input

- `asset-factory-workspace/procedural-previews/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001.json`

## 3. Adapter Goals

The first preview adapter must support:

- deterministic read of the generated neighbourhood preview JSON
- asset lookup for registered residential building IDs
- transform-safe building placement conversion
- visual overlay generation for lots, roads, driveways, and debug markers
- validation-state presentation for inspection
- future compatibility with Atlas Engine, Blender preview generation, town previews, district previews, and procedural test tooling

The adapter should remain:

- machine-readable
- non-destructive
- renderer-independent
- instance-based
- suitable for debugging and inspection before final scene integration

## 4. Adapter Input Contract

### Input source

The adapter reads one deterministic neighbourhood preview object with:

- `schemaId`
- `neighbourhoodId`
- `previewId`
- `seedConfig`
- `themeProfile`
- `bounds`
- `roadLayout`
- `lots`
- `buildingPlacements`
- `landscapePlacements`
- `roadFrontageConnections`
- `validationContract`
- `validationResult`

### Adapter read responsibilities

The adapter must read and preserve:

- lot boundary and frontage definitions
- lot-local building identity and variation metadata
- building placement transforms
- landscape placement transforms
- road frontage and driveway relationships
- pass or fail validation status

### Adapter read constraints

The adapter must not:

- change building selection results
- re-resolve lots
- regenerate geometry
- rewrite validation outcomes
- create duplicate building assets

## 5. Preview Output Contract

### Preview scene ID

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001`

### Required preview scene fields

- `sceneId`
- `adapterId`
- `sourcePreviewId`
- `previewType`
- `bounds`
- `cameraProfile`
- `roadRepresentation`
- `lotBoundaryRepresentation`
- `buildingInstances`
- `drivewayRepresentations`
- `fenceRepresentations`
- `landscapeInstances`
- `debugMarkers`
- `validationDisplay`
- `performanceProfile`

### Output intent

The preview scene contract exists to describe:

- what the visual inspection layer should show
- where registered building assets should appear
- where non-GLB debug overlays should appear
- how validation status should be surfaced to a human reviewer

### Suggested machine-readable shape

```json
{
  "sceneId": "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001",
  "adapterId": "NEIGHBOURHOOD_PREVIEW_ADAPTER_001",
  "sourcePreviewId": "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001",
  "previewType": "suburban_neighbourhood_visual_inspection",
  "bounds": {},
  "cameraProfile": {},
  "roadRepresentation": {},
  "lotBoundaryRepresentation": [],
  "buildingInstances": [],
  "drivewayRepresentations": [],
  "fenceRepresentations": [],
  "landscapeInstances": [],
  "debugMarkers": [],
  "validationDisplay": {},
  "performanceProfile": {}
}
```

## 6. Building Resolution Rules

### Supported registered building IDs

The first adapter must resolve:

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`

### Asset lookup contract

Each supported building ID should resolve through a lookup record containing:

- `assetId`
- `familyId`
- `registeredStatus`
- `defaultPreviewLOD`
- `instanceCategory`
- `boundsProfile`

### Example lookup shape

```json
{
  "BUILDING_HOUSE_SUBURBAN_BRICK_001": {
    "assetId": "BUILDING_HOUSE_SUBURBAN_BRICK_001",
    "familyId": "FAMILY_HOUSE_SUBURBAN_BRICK",
    "registeredStatus": "SUCCESSFUL",
    "defaultPreviewLOD": "LOD_GAMEPLAY",
    "instanceCategory": "residential_building",
    "boundsProfile": "suburban_standard"
  }
}
```

### Placement transform rules

For each building placement:

- `position` is copied directly from the deterministic placement output
- `rotation.yawDegrees` is preserved exactly
- `scale` defaults to the source placement scale
- `lodProfile` defaults to the source placement LOD unless a preview override is supplied

### Rotation handling

The adapter must preserve the visual road-facing relationship:

- `NORTH` frontage placements remain road-facing with `yawDegrees: 180`
- `SOUTH` frontage placements remain road-facing with `yawDegrees: 0`
- future east-west support must remain compatible with the same transform contract

## 7. Preview Representation Rules

### Road representation

The preview contract should represent the road as:

- road centre strip
- road edges
- sidewalk bands
- verge bands

This is a preview-only representation and does not require final road GLB generation.

### Lot boundary representation

Each lot should expose:

- boundary polyline
- frontage edge
- driveway opening edge
- lot ID label anchor

### Building instances

Each building instance should include:

- `instanceId`
- `assetId`
- `position`
- `rotation`
- `scale`
- `lodProfile`
- `lotId`
- `sourcePlacementId`
- `variationProfile`

### Driveway representations

Each driveway connection should expose:

- driveway start point at lot edge
- driveway end point at road frontage
- connection state
- lot ownership

### Fence representations

Each lot fence preview should expose:

- side and rear fence segments
- front fence state
- driveway gap
- alignment state

### Landscape instances

Each landscape instance should include:

- `instanceId`
- `assetId`
- `landscapeType`
- `zoneId`
- `position`
- `rotation`
- `variationSeed`
- `lotId`

## 8. Debug Visualization Contract

The first adapter should define these visual helpers:

- lot boundary outline
- road frontage markers
- driveway connection markers
- invalid placement indicators
- orientation arrows

### Lot boundary outline

Purpose:

- show whether the building footprint visually sits inside the lot

### Road frontage markers

Purpose:

- show where the lot legally connects to the road

### Driveway connection markers

Purpose:

- show that driveway-side resolution matches road and garage logic

### Invalid placement indicators

Purpose:

- highlight validation failures without changing source data

Recommended states:

- hidden when validation passes
- visible and color-coded when validation fails

### Orientation arrows

Purpose:

- show building facing direction
- help reviewers confirm north-up road alignment

## 9. Validation Display Contract

### Validation display purpose

The preview layer should make procedural validation human-readable.

### Required pass or fail display states

The preview contract should expose:

- `overlap`
- `lotContainment`
- `drivewayConnection`
- `fenceAlignment`
- `deterministicRebuild`

### Suggested validation display shape

```json
{
  "overlap": { "status": "PASS", "markerCount": 0 },
  "lotContainment": { "status": "PASS", "markerCount": 0 },
  "drivewayConnection": { "status": "PASS", "markerCount": 0 },
  "fenceAlignment": { "status": "PASS", "markerCount": 0 },
  "deterministicRebuild": { "status": "PASS", "markerCount": 0 }
}
```

### Validation marker rules

If a validation state fails:

- markers must reference the affected lot or placement
- the adapter must not mutate the underlying neighbourhood data
- the preview output should remain readable enough for inspection

## 10. Performance Rules

The first preview adapter must remain lightweight.

### Required performance boundaries

- reuse registered assets only
- no duplicate geometry generation
- instance-based building placement
- instance-based landscape placement
- debug overlays must stay simple and line-based where possible

### Preview object limits

For the first six-lot preview:

- building instances: `6`
- lot outlines: `6`
- driveway markers: `6`
- fence previews: `6`
- landscape instances: derived directly from source placements only

### LOD guidance

Default first-pass preview behavior:

- buildings use `LOD_GAMEPLAY`
- landscape uses source preview density only
- debug markers stay procedural and lightweight

## 11. Future Compatibility

This adapter foundation should remain compatible with:

- Atlas Engine preview scene ingestion
- Blender preview generation from the same contract
- larger suburban blocks
- mixed district previews
- automated procedural inspection tests

### Atlas Engine compatibility

Recommended future adapter outputs:

- instance list
- transform list
- debug overlay list
- validation panel data

### Blender preview compatibility

Recommended future adapter outputs:

- instance transform export
- camera framing hints
- review overlay definitions

## 12. First Preview Readiness

The first preview adapter foundation is ready to support:

- the current six-lot deterministic suburban block preview
- visual inspection of lot boundaries and building orientation
- debug presentation of driveway and fence relationships
- validation-aware preview output

The next recommended step is:

- implementing the first executable preview adapter consumer that reads `NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001.json` and emits `NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001` as a machine-readable preview scene contract
