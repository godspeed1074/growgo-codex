# GrowGo Session 36 - Machine Readable Suburban Neighbourhood Generator Contract

## Session Scope

This document defines the machine-readable procedural contract for the first deterministic suburban neighbourhood generator.

Target system:

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001`

Purpose:

- deterministic machine-readable neighbourhood generation contract

This session creates procedural data contracts only.

This session does not:

- create Blender assets
- create GLB exports
- create final neighbourhood scenes
- modify existing buildings
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## 1. Source of Truth

This Session 36 generator contract is based on:

- `GROWGO_SESSION_35_SUBURBAN_NEIGHBOURHOOD_ASSEMBLY_CONTRACT_FOUNDATION.md`
- `GROWGO_SESSION_33_5_SUBURBAN_BRICK_HOUSE_VALIDATION_AND_BUILDING_LIBRARY_REGISTRATION.md`
- existing Asset Factory recipe, validation, and registration patterns

Relevant continuity:

- Session 35 defined the preview-block contract in design terms
- the residential building library already contains the validated suburban, coastal cottage, and beach bungalow houses
- the next implementation step needs a deterministic, machine-readable schema set before any procedural block generator is written

## 2. Contract Goals

The machine-readable contract must support:

- deterministic lot generation
- deterministic building selection
- deterministic placement transforms
- deterministic landscape variation
- validation before rendering or scene export
- future expansion to larger suburbs, villages, mixed residential districts, and town centres

The contract should be readable by:

- future generator scripts
- future validation scripts
- future preview/block assembly systems

## 3. Schema Set

The first neighbourhood generator contract defines these schemas:

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001`
- `LOT_SUBURBAN_RESIDENTIAL_001`
- `BUILDING_PLACEMENT_INSTANCE_001`
- `LANDSCAPE_PLACEMENT_INSTANCE_001`
- `ROAD_FRONTAGE_CONNECTION_001`

## 4. Neighbourhood Schema

### Schema ID

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001`

### Required fields

- `schemaId`
- `neighbourhoodId`
- `previewId`
- `blockType`
- `seedConfig`
- `themeProfile`
- `bounds`
- `roadLayout`
- `lotCount`
- `lots`
- `buildingPlacements`
- `landscapePlacements`
- `roadFrontageConnections`
- `validationContract`
- `validationResult`

### Field intent

- `schemaId`: versioned contract identity
- `neighbourhoodId`: deterministic neighbourhood identity
- `previewId`: preview-specific output identity
- `blockType`: street/block profile
- `seedConfig`: machine-readable seed inputs
- `themeProfile`: suburban/coastal weighting and density profile
- `bounds`: preview block spatial limits
- `roadLayout`: machine-readable road structure
- `lotCount`: explicit lot count
- `lots`: lot objects
- `buildingPlacements`: resolved house placements
- `landscapePlacements`: resolved plant and verge placements
- `roadFrontageConnections`: lot-to-road relationship records
- `validationContract`: expected rule set
- `validationResult`: generated-state validation summary

### Suggested machine-readable shape

```json
{
  "schemaId": "NEIGHBOURHOOD_SUBURBAN_BLOCK_001",
  "neighbourhoodId": "NEIGHBOURHOOD_SUBURBAN_BLOCK_PREVIEW_001",
  "previewId": "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001",
  "blockType": "suburban_preview_straight_street",
  "seedConfig": {},
  "themeProfile": {},
  "bounds": {},
  "roadLayout": {},
  "lotCount": 6,
  "lots": [],
  "buildingPlacements": [],
  "landscapePlacements": [],
  "roadFrontageConnections": [],
  "validationContract": {},
  "validationResult": {}
}
```

## 5. Lot Schema

### Schema ID

- `LOT_SUBURBAN_RESIDENTIAL_001`

### Required fields

- `schemaId`
- `lotId`
- `position`
- `size`
- `frontageDirection`
- `lotType`
- `setbackProfile`
- `buildingSocket`
- `drivewaySocket`
- `fenceBoundary`
- `landscapingZones`
- `resolverInputs`
- `landscapingSeed`

### Field intent

- `position`: lot origin in block space
- `size`: width and depth
- `frontageDirection`: north/south/east/west
- `lotType`: narrow, standard, or wide
- `setbackProfile`: front, side, and rear setbacks
- `buildingSocket`: allowed house placement area
- `drivewaySocket`: road-facing driveway alignment point
- `fenceBoundary`: front, side, rear fence segments
- `landscapingZones`: front lawn, side planting, backyard, tree zones
- `resolverInputs`: machine-readable inputs for building selection
- `landscapingSeed`: deterministic per-lot landscaping seed

### Suggested machine-readable shape

```json
{
  "schemaId": "LOT_SUBURBAN_RESIDENTIAL_001",
  "lotId": "LOT_SUBURBAN_RESIDENTIAL_001_A",
  "position": { "x": 0, "y": 0, "z": 0 },
  "size": { "width": 16, "depth": 36 },
  "frontageDirection": "north",
  "lotType": "standard",
  "setbackProfile": {
    "front": 5.5,
    "left": 1.8,
    "right": 1.8,
    "rear": 6.5
  },
  "buildingSocket": {},
  "drivewaySocket": {},
  "fenceBoundary": {},
  "landscapingZones": {},
  "resolverInputs": {},
  "landscapingSeed": "LANDSCAPE_SEED_LOT_A_001"
}
```

## 6. Building Placement Schema

### Schema ID

- `BUILDING_PLACEMENT_INSTANCE_001`

### Required fields

- `schemaId`
- `placementId`
- `lotId`
- `assetId`
- `familyId`
- `position`
- `rotation`
- `scale`
- `lodProfile`
- `frontSetback`
- `drivewaySide`
- `variationProfile`
- `resolverMetadata`

### Supported initial asset IDs

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`

### Field intent

- `position`: final house placement origin
- `rotation`: deterministic road-facing rotation
- `scale`: typically `1,1,1`, but explicit for future flexibility
- `lodProfile`: preferred preview LOD per zoom context
- `frontSetback`: applied setback from road edge
- `drivewaySide`: left/right/front-connected logic
- `variationProfile`: controlled colour/yard/fence variation tags
- `resolverMetadata`: why the building was chosen

### Suggested machine-readable shape

```json
{
  "schemaId": "BUILDING_PLACEMENT_INSTANCE_001",
  "placementId": "BUILDING_PLACEMENT_LOT_A_001",
  "lotId": "LOT_SUBURBAN_RESIDENTIAL_001_A",
  "assetId": "BUILDING_HOUSE_SUBURBAN_BRICK_001",
  "familyId": "FAMILY_HOUSE_SUBURBAN_BRICK",
  "position": { "x": 2.4, "y": 4.9, "z": 0 },
  "rotation": { "yawDegrees": 180 },
  "scale": { "x": 1, "y": 1, "z": 1 },
  "lodProfile": "LOD_GAMEPLAY",
  "frontSetback": 5.5,
  "drivewaySide": "right",
  "variationProfile": {
    "roofTone": "charcoal",
    "fenceStyle": "timber_standard",
    "yardDensity": "moderate"
  },
  "resolverMetadata": {
    "themeWeight": "suburban_primary",
    "duplicatePreventionApplied": true
  }
}
```

## 7. Landscape Placement Schema

### Schema ID

- `LANDSCAPE_PLACEMENT_INSTANCE_001`

### Required fields

- `schemaId`
- `placementId`
- `lotId`
- `assetId`
- `landscapeType`
- `zoneId`
- `position`
- `rotation`
- `variationSeed`
- `placementRules`

### Supported initial landscape assets

- `MOD_GROUND_GRASS_STANDARD_001`
- `MOD_BUSH_NATIVE_STANDARD_001`
- `MOD_TREE_EUCALYPTUS_STANDARD_001`

### Field intent

- `landscapeType`: grass, bush, tree, verge, hedge cluster
- `zoneId`: front lawn, backyard, side planting, verge, tree zone
- `variationSeed`: deterministic plant variation input
- `placementRules`: containment and exclusion requirements

### Suggested machine-readable shape

```json
{
  "schemaId": "LANDSCAPE_PLACEMENT_INSTANCE_001",
  "placementId": "LANDSCAPE_LOT_A_TREE_001",
  "lotId": "LOT_SUBURBAN_RESIDENTIAL_001_A",
  "assetId": "MOD_TREE_EUCALYPTUS_STANDARD_001",
  "landscapeType": "tree",
  "zoneId": "backyardTreeZone",
  "position": { "x": 5.2, "y": 18.4, "z": 0 },
  "rotation": { "yawDegrees": 35 },
  "variationSeed": "TREE_VARIATION_A_001",
  "placementRules": {
    "insideLotBoundary": true,
    "outsideDrivewayExclusion": true,
    "outsideBuildingFootprint": true
  }
}
```

## 8. Road Relationship Schema

### Schema ID

- `ROAD_FRONTAGE_CONNECTION_001`

### Required fields

- `schemaId`
- `connectionId`
- `lotId`
- `roadSegmentId`
- `frontageDirection`
- `connectionPoint`
- `drivewayLink`
- `entryPathLink`
- `vergeProfile`

### Field intent

- `roadSegmentId`: links a lot to a specific road segment
- `frontageDirection`: authoritative facing direction
- `connectionPoint`: frontage anchor in road/block space
- `drivewayLink`: deterministic driveway relationship
- `entryPathLink`: optional pedestrian path relationship
- `vergeProfile`: verge width and planting treatment

### Suggested machine-readable shape

```json
{
  "schemaId": "ROAD_FRONTAGE_CONNECTION_001",
  "connectionId": "ROAD_FRONTAGE_CONNECTION_LOT_A_001",
  "lotId": "LOT_SUBURBAN_RESIDENTIAL_001_A",
  "roadSegmentId": "ROAD_SEGMENT_STRAIGHT_001",
  "frontageDirection": "north",
  "connectionPoint": { "x": 8, "y": 0, "z": 0 },
  "drivewayLink": {
    "drivewaySide": "right",
    "roadAligned": true
  },
  "entryPathLink": {
    "connected": true,
    "frontDoorFacingRoad": true
  },
  "vergeProfile": {
    "grassVergeWidth": 1.8,
    "sidewalkWidth": 1.6
  }
}
```

## 9. Seed System

### Required seed inputs

The generator contract must support:

- `neighbourhoodSeed`
- `regionSeed`
- `themeSeed`

### Deterministic seed rule

The same combination of:

- neighbourhood seed
- region seed
- biome/theme seed

must always produce the same:

- lots
- buildings
- rotations
- variations

### Seed usage roles

- `neighbourhoodSeed`: high-level preview identity and block-wide ordering
- `regionSeed`: region-appropriate biasing and future large-scale expansion grouping
- `themeSeed`: suburban/coastal weighting and presentation variation

### Suggested machine-readable seed block

```json
{
  "seedConfig": {
    "neighbourhoodSeed": "SUBURBAN_BLOCK_PREVIEW_SEED_001",
    "regionSeed": "REGION_SUBURBAN_AU_001",
    "themeSeed": "THEME_SUBURBAN_MIXED_001"
  }
}
```

## 10. Lot Generator Contract

### Generator inputs

- `blockSize`
- `roadLayout`
- `lotCount`
- `densityRules`
- `neighbourhoodTheme`

### Generator outputs

For each lot:

- `lotId`
- `position`
- `size`
- `frontageDirection`
- `buildingRecipe`
- `rotation`
- `drivewaySide`
- `fenceConfiguration`
- `landscapingSeed`

### First-pass generator rules

- block size remains small and controlled
- lots must stay inside the neighbourhood bounds
- lot frontage must align to the road spine
- lots must satisfy the supported building footprint ranges
- driveway side must remain valid for the resolved building type
- landscaping seed must be deterministic per lot

### Suggested generator contract

```json
{
  "lotGeneratorContract": {
    "inputs": {
      "blockSize": "small",
      "roadLayout": "straight_local_residential",
      "lotCount": 6,
      "densityRules": "low_density_suburban",
      "neighbourhoodTheme": "suburban_mixed_residential_default"
    },
    "outputsPerLot": [
      "lotId",
      "position",
      "size",
      "frontageDirection",
      "buildingRecipe",
      "rotation",
      "drivewaySide",
      "fenceConfiguration",
      "landscapingSeed"
    ]
  }
}
```

## 11. Building Resolver Contract

### Resolver input

- `lotData`
- `neighbourhoodStyle`
- `seed`

### Resolver output

- `buildingAssetId`
- `weightingRuleApplied`
- `variationRuleApplied`
- `duplicatePreventionRuleApplied`
- `rotation`
- `drivewaySide`

### Supported building outputs

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- `BUILDING_HOUSE_BEACH_BUNGALOW_001`

### Weighting rules

First-pass default:

- suburban brick: dominant
- coastal cottage: secondary
- beach bungalow: tertiary

Suggested contract values:

```json
{
  "buildingResolver": {
    "weights": {
      "BUILDING_HOUSE_SUBURBAN_BRICK_001": 0.55,
      "BUILDING_HOUSE_COASTAL_COTTAGE_001": 0.25,
      "BUILDING_HOUSE_BEACH_BUNGALOW_001": 0.20
    }
  }
}
```

### Variation rules

The resolver should support deterministic variation tags for:

- roof tone
- yard density
- fence style
- driveway side
- tree count

### Duplicate-prevention rules

The resolver must prevent:

- the same building appearing three lots in a row
- identical mirrored rows across directly opposite lots when avoidable
- full-block loss of suburban identity

## 12. Placement Data Contract

### Building placement records

Each building record must include:

- `assetId`
- `position`
- `rotation`
- `scale`
- `lodProfile`

### Landscape placement records

Each landscape record must include:

- `assetId`
- `position`
- `rotation`
- `variationSeed`

### Road relationship records

Each road record must include:

- `connectionPoint`
- `frontageDirection`
- `drivewayLinks`

### Suggested placement grouping

```json
{
  "placementContracts": {
    "building": [
      "assetId",
      "position",
      "rotation",
      "scale",
      "lodProfile"
    ],
    "landscape": [
      "assetId",
      "position",
      "rotation",
      "variationSeed"
    ],
    "roadRelationship": [
      "connectionPoint",
      "frontageDirection",
      "drivewayLinks"
    ]
  }
}
```

## 13. Validation Contract

### Required machine-readable validation rules

The generator contract must support validation for:

- no overlap
- valid lot boundaries
- valid road connections
- valid driveway connections
- valid building orientation
- deterministic output

### Required validation fields

- `noOverlap`
- `validLotBoundaries`
- `validRoadConnections`
- `validDrivewayConnections`
- `validBuildingOrientation`
- `deterministicOutput`

### Suggested validation object

```json
{
  "validationContract": {
    "checks": {
      "noOverlap": true,
      "validLotBoundaries": true,
      "validRoadConnections": true,
      "validDrivewayConnections": true,
      "validBuildingOrientation": true,
      "deterministicOutput": true
    }
  }
}
```

### Deterministic validation rule

Two generator passes with the same seed inputs must produce identical:

- lot positions
- house selections
- house rotations
- driveway sides
- landscaping seeds

## 14. Preview Output Example

### Preview ID

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001`

### Preview intent

This example preview output defines a first machine-readable six-lot test block.

### Suggested preview example

```json
{
  "schemaId": "NEIGHBOURHOOD_SUBURBAN_BLOCK_001",
  "neighbourhoodId": "NEIGHBOURHOOD_SUBURBAN_BLOCK_PREVIEW_001",
  "previewId": "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001",
  "blockType": "suburban_preview_straight_street",
  "seedConfig": {
    "neighbourhoodSeed": "SUBURBAN_BLOCK_PREVIEW_SEED_001",
    "regionSeed": "REGION_SUBURBAN_AU_001",
    "themeSeed": "THEME_SUBURBAN_MIXED_001"
  },
  "lotCount": 6,
  "lots": [
    {
      "lotId": "LOT_A",
      "position": { "x": 0, "y": 0, "z": 0 },
      "size": { "width": 16, "depth": 36 },
      "frontageDirection": "north",
      "buildingRecipe": "RECIPE_HOUSE_SUBURBAN_BRICK_001",
      "rotation": 180,
      "drivewaySide": "right",
      "fenceConfiguration": "standard_suburban_side_and_rear",
      "landscapingSeed": "LANDSCAPE_A_001"
    },
    {
      "lotId": "LOT_B",
      "position": { "x": 18, "y": 0, "z": 0 },
      "size": { "width": 14, "depth": 34 },
      "frontageDirection": "north",
      "buildingRecipe": "RECIPE_HOUSE_COASTAL_COTTAGE_001",
      "rotation": 180,
      "drivewaySide": "left",
      "fenceConfiguration": "standard_suburban_side_and_rear",
      "landscapingSeed": "LANDSCAPE_B_001"
    },
    {
      "lotId": "LOT_C",
      "position": { "x": 34, "y": 0, "z": 0 },
      "size": { "width": 18, "depth": 38 },
      "frontageDirection": "north",
      "buildingRecipe": "RECIPE_HOUSE_BEACH_BUNGALOW_001",
      "rotation": 180,
      "drivewaySide": "right",
      "fenceConfiguration": "standard_suburban_side_and_rear",
      "landscapingSeed": "LANDSCAPE_C_001"
    },
    {
      "lotId": "LOT_D",
      "position": { "x": 0, "y": 44, "z": 0 },
      "size": { "width": 16, "depth": 36 },
      "frontageDirection": "south",
      "buildingRecipe": "RECIPE_HOUSE_SUBURBAN_BRICK_001",
      "rotation": 0,
      "drivewaySide": "left",
      "fenceConfiguration": "standard_suburban_side_and_rear",
      "landscapingSeed": "LANDSCAPE_D_001"
    },
    {
      "lotId": "LOT_E",
      "position": { "x": 18, "y": 44, "z": 0 },
      "size": { "width": 15, "depth": 35 },
      "frontageDirection": "south",
      "buildingRecipe": "RECIPE_HOUSE_COASTAL_COTTAGE_001",
      "rotation": 0,
      "drivewaySide": "right",
      "fenceConfiguration": "standard_suburban_side_and_rear",
      "landscapingSeed": "LANDSCAPE_E_001"
    },
    {
      "lotId": "LOT_F",
      "position": { "x": 35, "y": 44, "z": 0 },
      "size": { "width": 19, "depth": 40 },
      "frontageDirection": "south",
      "buildingRecipe": "RECIPE_HOUSE_SUBURBAN_BRICK_001",
      "rotation": 0,
      "drivewaySide": "left",
      "fenceConfiguration": "standard_suburban_side_and_rear",
      "landscapingSeed": "LANDSCAPE_F_001"
    }
  ]
}
```

## 15. Future Expansion Path

This machine-readable contract should explicitly support future growth into:

- larger suburbs
- villages
- coastal estates
- mixed residential districts
- commercial streets
- town centres

### Expansion-ready design rules

To remain scalable, future systems should be able to extend:

- neighbourhood schema without breaking lot schema
- building resolver without changing validation contract
- landscape resolver without changing road relationship schema
- preview block examples into larger district examples

## 16. Implementation Readiness

This contract is ready for implementation because it now provides:

- schema identities
- field-level machine-readable shapes
- deterministic seed rules
- lot generator inputs and outputs
- building resolver weighting and duplicate-prevention rules
- placement record contracts
- machine-readable validation contracts
- a first preview example

Recommended next implementation step:

1. create a machine-readable contract file in code or structured data form
2. build a deterministic lot generator for the six-lot preview
3. implement the building resolver against the validated residential library
4. implement validation checks before any preview rendering

## 17. Session Outcome

`NEIGHBOURHOOD_SUBURBAN_BLOCK_001` now has a deterministic machine-readable generator contract.

The system is ready for the first procedural implementation phase because it has:

- schemas
- seed rules
- resolver logic
- placement contracts
- validation contracts
- a preview example
- a clear future expansion path
