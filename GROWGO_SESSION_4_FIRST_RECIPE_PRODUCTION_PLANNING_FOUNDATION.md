# GrowGo Session 4 - First Recipe Production Planning Foundation

## Session Scope

This document fully defines the first GrowGo proof asset recipe before any Blender production begins.

Proof asset:

- `BUILDING_HOUSE_COASTAL_COTTAGE_001`

Proof recipe:

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`

This is a planning and specification phase only.

This session does not:

- create Blender assets
- create GLB files
- implement factory code
- modify the renderer
- add gameplay systems
- add backend systems
- add OSM systems

The purpose of this session is to define:

1. the complete house recipe
2. required Layer A modules
3. optional modules
4. missing modules
5. reuse opportunities
6. property footprint
7. orientation rules
8. LOD requirements
9. the variant roadmap

## 1. Source of Truth

This Session 4 planning document is governed by:

- `GROWGO_MODULAR_BIBLE_DESIGN_FOUNDATION.md`
- `GROWGO_SESSION_2_MODULAR_LIBRARY_AND_RECIPE_PLANNING.md`
- `GROWGO_SESSION_2_5_NAMING_METADATA_AND_BLENDER_HANDOFF_FOUNDATION.md`
- `GROWGO_SESSION_3_FIRST_PRODUCTION_BATCH_PLANNING_FOUNDATION.md`
- `GROWGO_SESSION_3_5_ASSET_FACTORY_PRODUCTION_RULES_FOUNDATION.md`

If a future planning document conflicts with these documents, those source documents remain authoritative unless explicitly updated.

## 2. Asset Identity

### Building

- `BUILDING_HOUSE_COASTAL_COTTAGE_001`

### Recipe

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`

### Family

- `FAMILY_HOUSE_COASTAL`

## 3. House Design Rules

The proof house must follow:

- `GrowGo Papercut 2.5D Style`

### Required visual rules

- it must carry the lighthouse visual language in charm, silhouette clarity, and stylized depth
- the silhouette must remain simple and readable
- it must remain mobile optimized
- it must read correctly from the north-facing camera
- it must read correctly from a slight downward view
- it must use modular construction

### Style validation rule

If the proof house cannot read clearly at overview scale with simplified silhouette logic, the recipe is not ready for production planning.

## 4. Final Recipe Definition

### Recipe ID

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`

### Recipe purpose

This recipe defines the first proof asset assembly for the coastal house family.

It is intended to validate:

- shared module naming
- batch-one dependency sequencing
- residential lot logic
- site integration
- overview readability
- future variation rules

### Recipe summary

- family: `FAMILY_HOUSE_COASTAL`
- target asset: `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- footprint class: small residential cottage
- placement class: residential roadside lot
- style class: papercut 2.5D coastal house

## 5. Property Footprint Rules

### Building footprint

Recommended planning footprint:

- width: `8m to 10m`
- depth: `6m to 8m`

This range is intended to keep the house readable, mobile-safe, and easy to vary without losing the cottage identity.

### Lot planning

The lot must support:

- front yard
- backyard
- side setbacks
- driveway location
- fence boundaries

### Lot layout rules

- the front yard must remain visually readable from the road
- the backyard must remain secondary and more private
- side setbacks must preserve separation between adjacent houses
- the driveway must connect cleanly to the road-facing side of the lot
- fence boundaries must define property edges without overpowering the silhouette

### Recommended lot distribution

- front yard: modest, visible, identity-supporting
- backyard: slightly larger than front yard
- left setback: narrow but readable
- right setback: narrow but readable
- driveway: single-side placement, not central

## 6. Orientation Rules

### Core orientation rule

The front of the house must face the nearest road.

### Residential block rule

Homes must be back-to-back when placed in residential blocks.

### Facing examples

- north road: house faces north
- south road: house faces south
- east road: house faces east
- west road: house faces west

### Backyard rule

No house should face another home’s backyard.

### Placement logic summary

- front facade always addresses the closest road
- backyard remains opposite the road-facing facade
- adjacent lots should preserve a coherent neighbourhood structure
- driveway position should reinforce lot orientation, not confuse it

## 7. Required Layer A Modules

These are the required planning dependencies for the proof recipe.

### 7.1 Structure

- foundation
- wall modules
- corner walls
- extension walls

Recommended required module targets:

- `MOD_FOUNDATION_STANDARD_RECT_001`
- `MOD_WALL_WEATHERBOARD_WHITE_001`
- `MOD_WALL_CORNER_STANDARD_001`
- `MOD_WALL_EXTENSION_SINGLE_BAY_001`

### 7.2 Roof

- roof style
- chimney
- fascia

Recommended required module targets:

- `MOD_ROOF_GABLE_STANDARD_001`
- `MOD_CHIMNEY_COASTAL_SMALL_001`
- `MOD_TRIM_STANDARD_COASTAL_001`

### 7.3 Openings

- windows
- front door
- side door

Recommended required module targets:

- `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
- `MOD_DOOR_STANDARD_RESIDENTIAL_001`
- `MOD_DOOR_SERVICE_RESIDENTIAL_001`

### 7.4 Exterior

- veranda
- porch
- trim

Recommended required module targets:

- `MOD_VERANDAH_STANDARD_TIMBER_001`
- `MOD_PORCH_COASTAL_SMALL_001`
- `MOD_TRIM_STANDARD_COASTAL_001`

### 7.5 Site

- driveway
- path
- fence

Recommended required module targets:

- `MOD_DRIVEWAY_STANDARD_SINGLE_001`
- `MOD_PATH_STANDARD_001`
- `MOD_FENCE_STANDARD_TIMBER_001`

### 7.6 Landscape

- grass
- bush
- tree
- garden

Recommended required module targets:

- `MOD_GROUND_GRASS_STANDARD_001`
- `MOD_BUSH_NATIVE_STANDARD_001`
- `MOD_TREE_EUCALYPTUS_STANDARD_001`
- `MOD_FLOWERBED_STANDARD_001`

## 8. Optional Modules

Optional modules allow controlled variation without breaking the core recipe.

### Optional module candidates

- alternate window trim
- alternate roof material variant
- alternate porch width
- alternate fence style
- alternate garden composition
- alternate tree placement count
- alternate chimney presence

### Optional module rule

Optional modules must never break:

- silhouette readability
- road-facing identity
- mobile performance
- papercut style consistency

## 9. Missing Module Analysis

Every required module is classified as:

- `EXISTS`
- `VARIATION`
- `NEW`
- `IDENTITY`

### Structure

- `MOD_FOUNDATION_STANDARD_RECT_001` -> `EXISTS`
- `MOD_WALL_WEATHERBOARD_WHITE_001` -> `EXISTS`
- `MOD_WALL_CORNER_STANDARD_001` -> `EXISTS`
- `MOD_WALL_EXTENSION_SINGLE_BAY_001` -> `EXISTS`

### Roof

- `MOD_ROOF_GABLE_STANDARD_001` -> `EXISTS`
- `MOD_CHIMNEY_COASTAL_SMALL_001` -> `NEW`
- `MOD_TRIM_STANDARD_COASTAL_001` -> `EXISTS`

### Openings

- `MOD_WINDOW_RESIDENTIAL_STANDARD_001` -> `EXISTS`
- `MOD_DOOR_STANDARD_RESIDENTIAL_001` -> `EXISTS`
- `MOD_DOOR_SERVICE_RESIDENTIAL_001` -> `VARIATION`

### Exterior

- `MOD_VERANDAH_STANDARD_TIMBER_001` -> `EXISTS`
- `MOD_PORCH_COASTAL_SMALL_001` -> `VARIATION`
- `MOD_TRIM_STANDARD_COASTAL_001` -> `EXISTS`

### Site

- `MOD_DRIVEWAY_STANDARD_SINGLE_001` -> `EXISTS`
- `MOD_PATH_STANDARD_001` -> `EXISTS`
- `MOD_FENCE_STANDARD_TIMBER_001` -> `EXISTS`

### Landscape

- `MOD_GROUND_GRASS_STANDARD_001` -> `EXISTS`
- `MOD_BUSH_NATIVE_STANDARD_001` -> `EXISTS`
- `MOD_TREE_EUCALYPTUS_STANDARD_001` -> `EXISTS`
- `MOD_FLOWERBED_STANDARD_001` -> `EXISTS`

### Missing module summary

#### New reusable modules required

- `MOD_CHIMNEY_COASTAL_SMALL_001`

#### Variation-based modules required

- `MOD_DOOR_SERVICE_RESIDENTIAL_001`
- `MOD_PORCH_COASTAL_SMALL_001`

#### Identity-only modules required

- none currently justified at proof-recipe level

## 10. Reuse Opportunities

The proof recipe should maximize reuse across the future library.

### Reusable by other houses

- foundation
- wall modules
- corner walls
- gable roof
- windows
- residential doors
- verandah
- trim
- path
- driveway
- fence
- grass
- bush
- tree

### Reusable by bakeries and shops

- foundation
- some wall extension logic
- trim
- path
- fence edge logic
- landscaping

### Reusable by schools and civic buildings

- foundation logic
- wall corner logic
- trim
- paths
- fences
- landscaping

### Reuse estimate

- reused or broadly reusable: `88%`
- new or variation work: `12%`

### New work summary

- one clearly reusable chimney module
- one service-door variation
- one porch variation

## 11. LOD Planning

### LOD0

- purpose: close view
- geometry expectation: strongest version of the simplified cottage form
- material expectation: full approved papercut colour blocking
- vegetation visibility: full lot vegetation set may remain visible

### LOD1

- purpose: gameplay view
- geometry expectation: simplified but still expressive silhouette
- material expectation: shared materials only, with reduced visual complexity
- vegetation visibility: keep major tree, bush, fence, driveway, and front path visible

### LOD2

- purpose: overview view
- geometry expectation: silhouette-first simplified volume
- material expectation: minimal material set with strong roof-wall-ground contrast
- vegetation visibility: retain only the most legible lot-defining pieces

### LOD planning rule

The house must remain identifiable at all three levels:

- roof shape
- wall body
- road-facing front
- lot access path
- one or more readable landscape cues

## 12. Variant Roadmap

The proof recipe belongs to the future `HOUSE_COASTAL_FAMILY`.

### Planned variants

1. Classic Weatherboard Cottage
2. Beach Bungalow
3. Raised Coastal Home
4. Modern Coastal Home
5. Small Holiday House

### Shared reuse across variants

Every variant should reuse:

- walls
- roofs
- windows
- doors
- landscaping

### Variant driver categories

- colour changes
- roof changes
- window changes
- garden changes
- porch changes

### Variant rule

Variants should be created by swapping or adapting modules and recipe settings rather than duplicating full assets unnecessarily.

## 13. Production Readiness

### Ready after Session 4

- proof asset identity defined
- proof recipe identity defined
- lot and orientation rules defined
- required module dependencies defined
- optional modules defined
- missing-module analysis defined
- LOD planning defined
- variant roadmap defined

### Not authorized after Session 4

- Blender production
- GLB generation
- runtime implementation
- gameplay systems
- backend systems
- OSM systems

## 14. Readiness Statement

This document is ready to serve as the first proof-recipe production planning foundation for GrowGo.

It authorizes:

- proof recipe review
- dependency review
- LOD planning review
- future production handoff preparation

It does not authorize:

- Blender production
- GLB creation
- runtime implementation
- gameplay systems
- backend systems
- OSM systems
