# GrowGo Session 8 - First Blender Production Batch Specification Foundation

## Session Scope

This document defines the first Blender production batch required to create the first GrowGo modular proof asset.

Proof asset:

- `BUILDING_HOUSE_COASTAL_COTTAGE_001`

Proof recipe:

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`

This is a production planning and specification phase only.

This session does not:

- create Blender files
- create GLB files
- write Blender scripts
- implement runtime systems
- modify the renderer
- add gameplay systems
- add backend systems
- add OSM systems

The purpose of this session is to define:

1. the first Blender production batch
2. the exact modules to create
3. the module creation order
4. dependency flow
5. expected outputs
6. the validation checklist
7. future reuse opportunities

## 1. Source of Truth

This Session 8 planning document is governed by:

- `GROWGO_MODULAR_BIBLE_DESIGN_FOUNDATION.md`
- `GROWGO_SESSION_2_5_NAMING_METADATA_AND_BLENDER_HANDOFF_FOUNDATION.md`
- `GROWGO_SESSION_3_5_ASSET_FACTORY_PRODUCTION_RULES_FOUNDATION.md`
- `GROWGO_SESSION_4_FIRST_RECIPE_PRODUCTION_PLANNING_FOUNDATION.md`
- `GROWGO_SESSION_5_BLENDER_ASSET_FACTORY_ARCHITECTURE_FOUNDATION.md`
- `GROWGO_SESSION_7_LAYER_A_UNIVERSAL_MODULE_PRODUCTION_PLANNING_FOUNDATION.md`
- `GROWGO_SESSION_7_5_CORE_LAYER_A_MODULE_SPECIFICATION_FOUNDATION.md`

If a future planning document conflicts with these documents, those source documents remain authoritative unless explicitly updated.

## 2. Batch 1 Purpose

Batch 1 is the minimum viable Blender production set required to assemble the first proof house while validating the entire modular planning chain.

This batch must prove:

- the Layer A module naming system
- the Layer A socket and attachment system
- the `RECIPE_HOUSE_COASTAL_COTTAGE_001` dependency graph
- the first Layer C assembly path for `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- the mobile-first GrowGo Papercut 2.5D style under real production constraints

Batch 1 is not intended to maximize visual variety.

Its role is to establish a stable production baseline that future house, shop, civic, and motel recipes can reuse.

## 3. Batch 1 Production Target

Batch 1 must define enough production-ready module work to assemble:

- `BUILDING_HOUSE_COASTAL_COTTAGE_001`

using:

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`

### 3.1 Canonical Batch 1 naming note

Some Batch 1 IDs below are more production-specific than the broader Session 7 inventory names.

For Batch 1 planning, these IDs should be treated as the canonical production targets for the first proof house batch.

Examples:

- `MOD_FOUNDATION_STANDARD_RECT_001` becomes the Batch 1 foundation target rather than the earlier more generic small-rect planning label
- `MOD_GROUND_GRASS_STANDARD_001` becomes the Batch 1 ground-cover target aligned to house-lot assembly
- `MOD_BUSH_NATIVE_STANDARD_001` becomes the Batch 1 native shrub target aligned to the coastal proof asset

This preserves the earlier planning intent while giving the first Blender batch an exact production naming set.

## 4. Exact Modules to Create

### 4.1 Structure

- `MOD_FOUNDATION_STANDARD_RECT_001`
- `MOD_WALL_WEATHERBOARD_WHITE_001`
- `MOD_WALL_CORNER_STANDARD_001`
- `MOD_WALL_EXTENSION_SINGLE_BAY_001`

### 4.2 Roof

- `MOD_ROOF_GABLE_STANDARD_001`
- `MOD_CHIMNEY_COASTAL_SMALL_001`
- `MOD_TRIM_STANDARD_COASTAL_001`

### 4.3 Openings

- `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
- `MOD_DOOR_STANDARD_RESIDENTIAL_001`
- `MOD_DOOR_SERVICE_RESIDENTIAL_001`

### 4.4 Exterior

- `MOD_VERANDAH_STANDARD_TIMBER_001`
- `MOD_PORCH_COASTAL_SMALL_001`

### 4.5 Site

- `MOD_PATH_STANDARD_001`
- `MOD_DRIVEWAY_STANDARD_SINGLE_001`
- `MOD_FENCE_STANDARD_001`

### 4.6 Landscape

- `MOD_GROUND_GRASS_STANDARD_001`
- `MOD_BUSH_NATIVE_STANDARD_001`
- `MOD_TREE_EUCALYPTUS_STANDARD_001`
- `MOD_FLOWERBED_STANDARD_001`

## 5. Module Role Definitions

### 5.1 Structure role set

#### `MOD_FOUNDATION_STANDARD_RECT_001`

- role: base structural footprint for the proof house
- dependency purpose:
  - establishes true footprint
  - establishes vertical origin for walls
  - establishes driveway and path offsets
  - establishes verandah and porch connection levels
- future reuse:
  - houses
  - bakery side-lot variants
  - cafe variants
  - motel room blocks

#### `MOD_WALL_WEATHERBOARD_WHITE_001`

- role: primary house enclosure wall module
- dependency purpose:
  - provides window and door mounting surfaces
  - defines primary papercut silhouette rhythm
  - connects directly to roof edge geometry
- future reuse:
  - coastal houses
  - holiday houses
  - motel units
  - lightweight civic annexes

#### `MOD_WALL_CORNER_STANDARD_001`

- role: reusable corner join for modular residential shells
- dependency purpose:
  - resolves perpendicular wall assembly
  - preserves trim continuity
  - validates corner socket alignment
- future reuse:
  - houses
  - shops
  - schools
  - police and fire side wings

#### `MOD_WALL_EXTENSION_SINGLE_BAY_001`

- role: one-bay extension unit for width/depth variation
- dependency purpose:
  - allows the proof house to validate future family growth
  - proves wall-bay scaling without changing base wall rules
- future reuse:
  - house families
  - motels
  - bakeries
  - cafes

### 5.2 Roof role set

#### `MOD_ROOF_GABLE_STANDARD_001`

- role: primary residential roof cap
- dependency purpose:
  - confirms roof-to-wall assembly
  - confirms silhouette readability from overview zoom
  - supports future chimney and trim attachments
- future reuse:
  - most houses
  - motels
  - selected civic annexes

#### `MOD_CHIMNEY_COASTAL_SMALL_001`

- role: small identity roof accent for the coastal cottage
- dependency purpose:
  - validates limited identity modules within a reusable recipe
  - proves roof-surface socket usage
- future reuse:
  - classic cottages
  - beach bungalow variants
  - selected bakery and motel variants

#### `MOD_TRIM_STANDARD_COASTAL_001`

- role: shared roof and facade trim detail set
- dependency purpose:
  - carries style cohesion across wall, verandah, porch, and roof edges
  - validates trim as a reusable Layer A production family
- future reuse:
  - houses
  - bakeries
  - cafes
  - motels

### 5.3 Opening role set

#### `MOD_WINDOW_RESIDENTIAL_STANDARD_001`

- role: default residential window
- dependency purpose:
  - validates wall socket standards
  - proves material variant readiness
  - establishes overview-scale readability
- future reuse:
  - houses
  - schools
  - police station support rooms
  - motels

#### `MOD_DOOR_STANDARD_RESIDENTIAL_001`

- role: main front entry door
- dependency purpose:
  - validates entry orientation
  - validates path-to-entry alignment
  - supports front elevation identity
- future reuse:
  - houses
  - motels
  - civic support entries

#### `MOD_DOOR_SERVICE_RESIDENTIAL_001`

- role: side or rear service door
- dependency purpose:
  - validates service access logic
  - proves secondary opening compatibility
- future reuse:
  - houses
  - shops
  - schools
  - civic service zones

### 5.4 Exterior role set

#### `MOD_VERANDAH_STANDARD_TIMBER_001`

- role: shared coastal frontage outdoor structure
- dependency purpose:
  - validates porch and facade attachment logic
  - proves readable layered depth in the 2.5D view
- future reuse:
  - coastal houses
  - cafes
  - motels
  - shops

#### `MOD_PORCH_COASTAL_SMALL_001`

- role: compact entry porch module
- dependency purpose:
  - proves the entry threshold layer between path and building shell
  - supports road-facing orientation clarity
- future reuse:
  - small houses
  - coastal cottages
  - service cottages

### 5.5 Site role set

#### `MOD_PATH_STANDARD_001`

- role: pedestrian connection module
- dependency purpose:
  - validates path sockets and entry routing
  - links road-facing lot rules to house entry geometry
- future reuse:
  - houses
  - bakery
  - cafe
  - school
  - police
  - fire
  - motel
  - lighthouse

#### `MOD_DRIVEWAY_STANDARD_SINGLE_001`

- role: single-vehicle residential driveway module
- dependency purpose:
  - validates lot-side vehicle access planning
  - confirms driveway-to-foundation and driveway-to-road offsets
- future reuse:
  - houses
  - motels
  - suburban civic support lots

#### `MOD_FENCE_STANDARD_001`

- role: boundary and frontage definition
- dependency purpose:
  - validates lot segmentation
  - preserves readable front-yard and backyard boundaries
- future reuse:
  - houses
  - schools
  - police
  - fire
  - motels
  - lighthouse path edge variants

### 5.6 Landscape role set

#### `MOD_GROUND_GRASS_STANDARD_001`

- role: default yard ground cover
- dependency purpose:
  - validates site fill around footprints, paths, and fences
  - preserves coastal lot readability
- future reuse:
  - houses
  - civic grounds
  - motel grounds
  - lighthouse surroundings

#### `MOD_BUSH_NATIVE_STANDARD_001`

- role: low native shrub planting module
- dependency purpose:
  - validates clustered small landscape dressing
  - supports coastal identity without excessive complexity
- future reuse:
  - houses
  - parks
  - schools
  - civic entries

#### `MOD_TREE_EUCALYPTUS_STANDARD_001`

- role: landmark native vegetation module
- dependency purpose:
  - validates larger vegetation scale against the proof house
  - preserves lighthouse-adjacent visual language
- future reuse:
  - houses
  - parks
  - schools
  - lighthouse lots
  - civic grounds

#### `MOD_FLOWERBED_STANDARD_001`

- role: small entry planting accent
- dependency purpose:
  - proves fine-grain site dressing within the mobile budget
  - adds front-entry readability
- future reuse:
  - houses
  - cafes
  - bakeries
  - schools
  - motels

## 6. Dependency Flow

Batch 1 should be treated as a dependency-driven Blender production sequence rather than a flat asset list.

### 6.1 Dependency graph

1. `MOD_FOUNDATION_STANDARD_RECT_001`
2. `MOD_WALL_WEATHERBOARD_WHITE_001`
3. `MOD_WALL_CORNER_STANDARD_001`
4. `MOD_WALL_EXTENSION_SINGLE_BAY_001`
5. `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
6. `MOD_DOOR_STANDARD_RESIDENTIAL_001`
7. `MOD_DOOR_SERVICE_RESIDENTIAL_001`
8. `MOD_ROOF_GABLE_STANDARD_001`
9. `MOD_CHIMNEY_COASTAL_SMALL_001`
10. `MOD_TRIM_STANDARD_COASTAL_001`
11. `MOD_VERANDAH_STANDARD_TIMBER_001`
12. `MOD_PORCH_COASTAL_SMALL_001`
13. `MOD_PATH_STANDARD_001`
14. `MOD_DRIVEWAY_STANDARD_SINGLE_001`
15. `MOD_FENCE_STANDARD_001`
16. `MOD_GROUND_GRASS_STANDARD_001`
17. `MOD_BUSH_NATIVE_STANDARD_001`
18. `MOD_TREE_EUCALYPTUS_STANDARD_001`
19. `MOD_FLOWERBED_STANDARD_001`
20. `BUILDING_HOUSE_COASTAL_COTTAGE_001` assembly validation

### 6.2 Dependency rule

No downstream module should be approved for production completion until its attachment host and required sockets are already defined and reviewed.

Examples:

- doors cannot be finalized until wall opening sockets are stable
- verandah cannot be finalized until wall edges and foundation height are stable
- roof trim cannot be finalized until roof edge logic is stable
- driveway cannot be finalized until lot frontage and path alignment are stable

## 7. Correct Creation Order

The recommended Batch 1 Blender production order is:

1. foundation
2. wall system
3. wall sockets and opening rules review
4. windows and doors
5. roof system
6. verandah and porch
7. path and driveway
8. fence
9. landscape modules
10. final house assembly

### 7.1 Why this order is correct

- foundation establishes origin, footprint, and vertical reference
- walls establish the main shell and opening rules
- wall sockets must be verified before opening production is treated as final
- roof depends on a stable shell
- verandah and porch depend on both foundation and facade conditions
- site modules depend on frontage, entry, and setback rules
- landscape should only be finalized once built geometry and site circulation are known
- full house assembly must happen last so unresolved socket issues are caught before export planning

## 8. Blender Collection Plan

The first Blender production batch should use a stable collection structure under:

- `GrowGo_Assets`

### 8.1 Top-level collections

- `00_REFERENCE`
- `01_MODULAR_LIBRARY`
- `02_RECIPE_ASSEMBLIES`
- `03_BUILDINGS`
- `04_ENVIRONMENT`
- `05_EXPORT_READY`

### 8.2 Batch 1 usage rules

#### `00_REFERENCE`

Contains:

- lighthouse style anchor references
- approved cottage concept references
- scale guides
- north-facing camera guides

#### `01_MODULAR_LIBRARY`

Contains:

- all Layer A Batch 1 modules
- working variant groups
- approved socket and attachment review objects

#### `02_RECIPE_ASSEMBLIES`

Contains:

- `RECIPE_HOUSE_COASTAL_COTTAGE_001` test assembly
- module compatibility staging scene
- orientation and footprint review assemblies

#### `03_BUILDINGS`

Contains:

- assembled `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- approved production-ready building variants for future batches

#### `04_ENVIRONMENT`

Contains:

- grass
- bush
- tree
- flowerbed
- site edge dressing used by the proof house lot

#### `05_EXPORT_READY`

Contains:

- approved Layer A export objects
- approved Layer C house export objects
- LOD-separated export sets
- metadata-linked export groups

## 9. Expected Outputs

Batch 1 should define two output layers.

### 9.1 Layer A outputs

Examples:

- `MOD_WALL_WEATHERBOARD_WHITE_001_LOD0.glb`
- `MOD_WALL_WEATHERBOARD_WHITE_001_LOD1.glb`
- `MOD_WALL_WEATHERBOARD_WHITE_001_LOD2.glb`
- `MOD_PATH_STANDARD_001_LOD1.glb`
- `MOD_TREE_EUCALYPTUS_STANDARD_001_LOD1.glb`

### 9.2 Layer C outputs

Examples:

- `BUILDING_HOUSE_COASTAL_COTTAGE_001_LOD0.glb`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001_LOD1.glb`
- `BUILDING_HOUSE_COASTAL_COTTAGE_001_LOD2.glb`

### 9.3 Required metadata with each approved output

- asset ID
- recipe reference where applicable
- family reference
- material references
- LOD information
- footprint metadata
- orientation metadata
- dependency metadata
- validation status

## 10. Validation Checklist

Before Batch 1 production approval, the proof house batch must pass the following planning checks.

### 10.1 Geometry

- polygon budget is within target
- topology is clean and production-ready
- scale is correct and consistent
- silhouettes remain readable from overview zoom

### 10.2 Style

- lighthouse art direction influence is visible
- papercut 2.5D style remains consistent
- color blocking remains bright and readable
- visual detail does not overwhelm the mobile-first style

### 10.3 Modularity

- sockets connect correctly
- modules join without visible mismatch
- corners resolve cleanly
- openings fit without custom one-off offsets
- reusable modules remain generic enough for future recipes

### 10.4 Technical

- naming follows the permanent naming system
- metadata is complete
- `LOD0`, `LOD1`, and `LOD2` are present where required
- export groups are structured correctly
- module references align with recipe dependency records

### 10.5 Proof asset assembly

- front of house faces the road
- front path aligns with entry
- driveway aligns with lot-side access
- verandah and porch read clearly from the north-facing camera
- yard modules remain within performance-safe limits

## 11. Future Reuse Analysis

### 11.1 Highest reuse Batch 1 modules

- `MOD_WALL_WEATHERBOARD_WHITE_001`
- `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
- `MOD_DOOR_STANDARD_RESIDENTIAL_001`
- `MOD_PATH_STANDARD_001`
- `MOD_FENCE_STANDARD_001`
- `MOD_GROUND_GRASS_STANDARD_001`
- `MOD_TREE_EUCALYPTUS_STANDARD_001`

### 11.2 Immediate post-house reuse

These modules unlock the fastest follow-on production opportunities:

- additional house family variants
- small motel variants
- bakery frontage with adapted site and sign systems
- cafe frontage with verandah and trim reuse
- school and police support landscape reuse

### 11.3 Module-by-module future reuse summary

| Module | Houses | Bakery | Cafe | School | Police | Fire | Motel | Lighthouse | Future assets |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `MOD_FOUNDATION_STANDARD_RECT_001` | yes | adapted | adapted | limited | limited | limited | yes | no | high |
| `MOD_WALL_WEATHERBOARD_WHITE_001` | yes | no | no | limited | limited | limited | yes | no | high |
| `MOD_WALL_CORNER_STANDARD_001` | yes | yes | yes | yes | yes | yes | yes | limited | very high |
| `MOD_WALL_EXTENSION_SINGLE_BAY_001` | yes | yes | yes | yes | yes | yes | yes | no | high |
| `MOD_ROOF_GABLE_STANDARD_001` | yes | limited | limited | limited | limited | limited | yes | no | high |
| `MOD_CHIMNEY_COASTAL_SMALL_001` | yes | limited | no | no | no | no | limited | no | medium |
| `MOD_TRIM_STANDARD_COASTAL_001` | yes | yes | yes | limited | limited | limited | yes | limited | high |
| `MOD_WINDOW_RESIDENTIAL_STANDARD_001` | yes | limited | limited | yes | yes | limited | yes | no | very high |
| `MOD_DOOR_STANDARD_RESIDENTIAL_001` | yes | limited | no | limited | limited | limited | yes | no | high |
| `MOD_DOOR_SERVICE_RESIDENTIAL_001` | yes | yes | yes | yes | yes | yes | yes | no | high |
| `MOD_VERANDAH_STANDARD_TIMBER_001` | yes | limited | yes | no | no | no | yes | limited | medium-high |
| `MOD_PORCH_COASTAL_SMALL_001` | yes | no | no | no | no | no | limited | no | medium |
| `MOD_PATH_STANDARD_001` | yes | yes | yes | yes | yes | yes | yes | yes | very high |
| `MOD_DRIVEWAY_STANDARD_SINGLE_001` | yes | limited | no | limited | yes | yes | yes | no | medium-high |
| `MOD_FENCE_STANDARD_001` | yes | limited | limited | yes | yes | yes | yes | yes | very high |
| `MOD_GROUND_GRASS_STANDARD_001` | yes | yes | yes | yes | yes | yes | yes | yes | very high |
| `MOD_BUSH_NATIVE_STANDARD_001` | yes | limited | yes | yes | yes | yes | yes | yes | high |
| `MOD_TREE_EUCALYPTUS_STANDARD_001` | yes | limited | limited | yes | yes | yes | yes | yes | high |
| `MOD_FLOWERBED_STANDARD_001` | yes | yes | yes | yes | limited | limited | yes | limited | high |

## 12. Production Readiness Status

Batch 1 is ready as a planning and production-definition package.

Ready:

- proof asset target locked
- recipe target locked
- exact Batch 1 module list defined
- creation order defined
- collection plan defined
- output structure defined
- validation checklist defined
- reuse path defined

Not yet intentionally started:

- Blender scene creation
- module modeling
- LOD mesh production
- material atlas creation
- export scripting
- GLB output
- runtime integration

## 13. Session Outcome

Session 8 defines the first Blender production batch needed to move the GrowGo Modular Asset Factory from planning into future controlled asset production for the proof house.

It provides:

- a concrete Batch 1 module list
- a dependency-aware production order
- a stable collection structure
- a clear output contract
- a reusable validation checklist

No Blender production assets are created in this session.
