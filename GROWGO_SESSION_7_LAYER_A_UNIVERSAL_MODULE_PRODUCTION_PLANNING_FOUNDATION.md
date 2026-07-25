# GrowGo Session 7 - Layer A Universal Module Production Planning Foundation

## Session Scope

This document defines the first production-ready Layer A universal modular asset library for GrowGo.

This is a planning and specification phase only.

This session does not:

- create Blender assets
- create GLB files
- write production scripts
- implement runtime systems
- modify the renderer
- add gameplay systems
- add backend systems
- add OSM systems

The purpose of this session is to define:

1. the first Layer A production list
2. module variants
3. module IDs
4. recipe compatibility
5. reuse ranking
6. production order

Related follow-on planning document:

- `GROWGO_SESSION_7_5_CORE_LAYER_A_MODULE_SPECIFICATION_FOUNDATION.md`

## 1. Source of Truth

This Session 7 planning document is governed by:

- `GROWGO_MODULAR_BIBLE_DESIGN_FOUNDATION.md`
- `GROWGO_SESSION_2_MODULAR_LIBRARY_AND_RECIPE_PLANNING.md`
- `GROWGO_SESSION_2_5_NAMING_METADATA_AND_BLENDER_HANDOFF_FOUNDATION.md`
- `GROWGO_SESSION_3_FIRST_PRODUCTION_BATCH_PLANNING_FOUNDATION.md`
- `GROWGO_SESSION_3_5_ASSET_FACTORY_PRODUCTION_RULES_FOUNDATION.md`
- `GROWGO_SESSION_4_FIRST_RECIPE_PRODUCTION_PLANNING_FOUNDATION.md`
- `GROWGO_SESSION_5_BLENDER_ASSET_FACTORY_ARCHITECTURE_FOUNDATION.md`
- `GROWGO_SESSION_6_FIRST_RECIPE_EXPANSION_PLANNING_FOUNDATION.md`

If a future planning document conflicts with these documents, those source documents remain authoritative unless explicitly updated.

## 2. Layer A Production Library Purpose

The Layer A production library is the first reusable universal module set that future GrowGo assets will draw from.

This library must:

- maximize reuse across recipes
- preserve the GrowGo Papercut 2.5D style
- remain mobile-first
- support future Blender production batching
- provide predictable IDs, LODs, and compatibility rules

## 3. First Layer A Production List

The first production-ready Layer A library should be organized into six categories:

1. Structure
2. Roofs
3. Openings
4. Exterior
5. Landscape
6. Street

For every module below, the planning record defines:

- Asset ID
- Purpose
- Variants
- Polygon target
- LOD requirement
- Compatible recipes
- Reuse potential

## 4. Module Category 1 - Structure

### 4.1 Foundations

#### `MOD_FOUNDATION_SMALL_RECT_001`

- purpose: small residential and compact commercial base
- variants:
  - narrow lot
  - standard lot
- polygon target:
  - `LOD0`: light structural detail
  - `LOD1`: simple support geometry
  - `LOD2`: simplified slab silhouette
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_BAKERY_COASTAL_001`
  - `RECIPE_CAFE_SMALL_TOWN_001`
- reuse potential: very high

#### `MOD_FOUNDATION_MEDIUM_RECT_001`

- purpose: medium civic, service, motel, and industrial base
- variants:
  - civic setback
  - service lot
  - motel strip base
- polygon target:
  - `LOD0`: moderate edge definition
  - `LOD1`: simple perimeter and slab
  - `LOD2`: simplified block base
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_SCHOOL_SMALL_TOWN_001`
  - `RECIPE_FIRE_STATION_SMALL_001`
  - `RECIPE_POLICE_STATION_SUBURBAN_001`
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
  - `RECIPE_WAREHOUSE_SMALL_001`
- reuse potential: very high

#### `MOD_FOUNDATION_COMMERCIAL_001`

- purpose: shopfront and paved commercial frontage base
- variants:
  - zero-setback frontage
  - shallow-entry frontage
- polygon target:
  - `LOD0`: light frontage step detail
  - `LOD1`: simplified slab and curb edge
  - `LOD2`: silhouette-only frontage
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_BAKERY_COASTAL_001`
  - `RECIPE_CAFE_SMALL_TOWN_001`
- reuse potential: high

### 4.2 Wall Modules

#### `MOD_WALL_WEATHERBOARD_WHITE_001`

- purpose: core coastal residential wall shell
- variants:
  - standard panel
  - porch-facing panel
  - blank side panel
- polygon target:
  - `LOD0`: moderate surface break-up
  - `LOD1`: simplified board rhythm
  - `LOD2`: wall silhouette with colour block
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
- reuse potential: high

#### `MOD_WALL_BRICK_RED_001`

- purpose: suburban and civic brick wall variant
- variants:
  - standard panel
  - window-ready panel
  - corner-adjacent panel
- polygon target:
  - `LOD0`: simplified brick rhythm
  - `LOD1`: broad masonry pattern
  - `LOD2`: brick colour silhouette
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_SCHOOL_SMALL_TOWN_001`
  - `RECIPE_POLICE_STATION_SUBURBAN_001`
- reuse potential: high

#### `MOD_WALL_RENDER_CREAM_001`

- purpose: generic rendered wall shell for civic and hospitality variants
- variants:
  - standard panel
  - entrance panel
  - long facade panel
- polygon target:
  - `LOD0`: subtle trim-ready surface
  - `LOD1`: flat render block
  - `LOD2`: minimal surface block
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_CAFE_SMALL_TOWN_001`
  - `RECIPE_FIRE_STATION_SMALL_001`
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
- reuse potential: medium-high

#### `MOD_WALL_INDUSTRIAL_PANEL_001`

- purpose: industrial shell panel for warehouse and service buildings
- variants:
  - solid panel
  - service-door panel
  - loading-side panel
- polygon target:
  - `LOD0`: ribbed panel suggestion
  - `LOD1`: simplified industrial seams
  - `LOD2`: flat industrial silhouette
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_WAREHOUSE_SMALL_001`
  - future factory and depot recipes
- reuse potential: medium-high

### 4.3 Corner Modules

#### `MOD_WALL_CORNER_STANDARD_001`

- purpose: universal exterior corner connector
- variants:
  - right-hand corner
  - left-hand corner
  - softened corner
- polygon target:
  - `LOD0`: clear structural transition
  - `LOD1`: simplified connector mass
  - `LOD2`: silhouette join only
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - all building recipes using panel-based walls
- reuse potential: highest

### 4.4 Extension Modules

#### `MOD_WALL_EXTENSION_SINGLE_BAY_001`

- purpose: universal small extension bay for houses and civic shells
- variants:
  - front bay
  - side bay
  - rear bay
- polygon target:
  - `LOD0`: readable extended volume
  - `LOD1`: simplified bay geometry
  - `LOD2`: minimal projected mass
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_SCHOOL_SMALL_TOWN_001`
- reuse potential: high

## 5. Module Category 2 - Roofs

### Residential

#### `MOD_ROOF_GABLE_STANDARD_001`

- purpose: primary house roof shell
- variants:
  - short span
  - medium span
  - porch-integrated span
- polygon target:
  - `LOD0`: ridge and overhang readability
  - `LOD1`: simplified roof planes
  - `LOD2`: roof silhouette block
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_SCHOOL_SMALL_TOWN_001`
- reuse potential: highest

#### `MOD_ROOF_HIP_STANDARD_001`

- purpose: suburban and broader civic roof option
- variants:
  - compact hip
  - broad hip
- polygon target:
  - `LOD0`: readable multi-plane form
  - `LOD1`: simplified roof planes
  - `LOD2`: mass-only roof silhouette
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_POLICE_STATION_SUBURBAN_001`
- reuse potential: high

#### `MOD_ROOF_SKILLION_STANDARD_001`

- purpose: modern and service-leaning roof variation
- variants:
  - left fall
  - right fall
  - shallow fall
- polygon target:
  - `LOD0`: crisp single-slope form
  - `LOD1`: simplified plane
  - `LOD2`: single-angle silhouette
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_CAFE_SMALL_TOWN_001`
- reuse potential: medium-high

### Commercial

#### `MOD_ROOF_FLAT_STANDARD_001`

- purpose: simple flat commercial roof
- variants:
  - plain flat
  - shallow parapet-ready
- polygon target:
  - `LOD0`: edge trim and slight roof lip
  - `LOD1`: simple roof slab
  - `LOD2`: flat silhouette
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_BAKERY_COASTAL_001`
  - `RECIPE_CAFE_SMALL_TOWN_001`
  - `RECIPE_WAREHOUSE_SMALL_001`
- reuse potential: high

#### `MOD_ROOF_PARAPET_STANDARD_001`

- purpose: commercial street and civic frontage roof cap
- variants:
  - low parapet
  - stepped parapet
- polygon target:
  - `LOD0`: clear street-facing cap
  - `LOD1`: simplified parapet lip
  - `LOD2`: silhouette cap only
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_BAKERY_COASTAL_001`
  - `RECIPE_CAFE_SMALL_TOWN_001`
  - future retail shop recipes
- reuse potential: medium-high

### Civic

#### `MOD_ROOF_TOWER_CIVIC_001`

- purpose: tower-style civic accent roof
- variants:
  - short tower
  - medium tower
- polygon target:
  - `LOD0`: clear civic landmark cap
  - `LOD1`: simplified tower roof
  - `LOD2`: landmark silhouette accent
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - future town hall
  - future civic landmark variants
- reuse potential: medium

#### `MOD_ROOF_DOME_CIVIC_001`

- purpose: specialized civic cultural roof
- variants:
  - shallow dome
  - lantern dome
- polygon target:
  - `LOD0`: simple readable curved cap
  - `LOD1`: reduced faceted dome
  - `LOD2`: iconic silhouette mass
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - future museum
  - future cultural centre
- reuse potential: medium-low

### Industrial

#### `MOD_ROOF_WAREHOUSE_STANDARD_001`

- purpose: industrial shed roof
- variants:
  - broad shed
  - raised ridge shed
- polygon target:
  - `LOD0`: readable industrial profile
  - `LOD1`: simplified shell
  - `LOD2`: large roof silhouette
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_WAREHOUSE_SMALL_001`
  - future factory recipes
- reuse potential: medium-high

#### `MOD_ROOF_FACTORY_STANDARD_001`

- purpose: industrial factory roof shell
- variants:
  - vent-ready roof
  - sawtooth-ready roof
- polygon target:
  - `LOD0`: industrial rhythm hint
  - `LOD1`: simplified roof mass
  - `LOD2`: large-block silhouette
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - future factory recipes
  - future depot variants
- reuse potential: medium

## 6. Module Category 3 - Openings

### Windows

#### `MOD_WINDOW_RESIDENTIAL_STANDARD_001`

- purpose: universal house and small civic window
- variants:
  - single
  - double
  - porch-facing
- polygon target:
  - `LOD0`: frame and sill readability
  - `LOD1`: simplified inset opening
  - `LOD2`: colour-block opening mark
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_SCHOOL_SMALL_TOWN_001`
  - `RECIPE_POLICE_STATION_SUBURBAN_001`
  - `RECIPE_FIRE_STATION_SMALL_001`
- reuse potential: highest

#### `MOD_WINDOW_RESIDENTIAL_LARGE_001`

- purpose: broader residential or motel opening
- variants:
  - wide frame
  - grouped pair
- polygon target:
  - `LOD0`: large frame readability
  - `LOD1`: grouped opening form
  - `LOD2`: large window colour block
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
- reuse potential: medium-high

#### `MOD_WINDOW_BAY_STANDARD_001`

- purpose: character window accent for houses and cafes
- variants:
  - shallow bay
  - projecting bay
- polygon target:
  - `LOD0`: readable bay shape
  - `LOD1`: simplified projecting form
  - `LOD2`: frontage silhouette accent
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_CAFE_SMALL_TOWN_001`
- reuse potential: medium

#### `MOD_STOREFRONT_GLAZING_STANDARD_001`

- purpose: universal commercial display frontage
- variants:
  - full width
  - split display
  - recessed entry glazing
- polygon target:
  - `LOD0`: strong frame and display read
  - `LOD1`: simplified glazing bands
  - `LOD2`: major dark/light storefront block
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_BAKERY_COASTAL_001`
  - `RECIPE_CAFE_SMALL_TOWN_001`
  - future shop recipes
- reuse potential: highest

#### `MOD_WINDOW_CIVIC_LARGE_001`

- purpose: larger institutional opening
- variants:
  - tall frame
  - grouped civic pair
- polygon target:
  - `LOD0`: tall opening clarity
  - `LOD1`: grouped vertical opening
  - `LOD2`: civic window band
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_SCHOOL_SMALL_TOWN_001`
  - `RECIPE_POLICE_STATION_SUBURBAN_001`
  - `RECIPE_FIRE_STATION_SMALL_001`
- reuse potential: high

### Doors

#### `MOD_DOOR_RESIDENTIAL_FRONT_001`

- purpose: universal front-door module
- variants:
  - centered
  - sidelight-ready
  - porch-ready
- polygon target:
  - `LOD0`: clear entry identity
  - `LOD1`: simplified door inset
  - `LOD2`: entry contrast mark
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
- reuse potential: highest

#### `MOD_DOOR_RESIDENTIAL_SERVICE_001`

- purpose: side or rear service entry
- variants:
  - plain service
  - narrow service
- polygon target:
  - `LOD0`: simple utility door read
  - `LOD1`: flat service inset
  - `LOD2`: minimal contrast panel
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
- reuse potential: high

#### `MOD_DOOR_GLASS_ENTRY_001`

- purpose: commercial glazed front entry
- variants:
  - centered glass
  - offset glass
- polygon target:
  - `LOD0`: crisp commercial entry read
  - `LOD1`: simplified glazed panel
  - `LOD2`: entry contrast mark
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_BAKERY_COASTAL_001`
  - `RECIPE_CAFE_SMALL_TOWN_001`
- reuse potential: high

#### `MOD_DOOR_ROLLER_INDUSTRIAL_001`

- purpose: industrial loading or service roller door
- variants:
  - medium roller
  - large roller
- polygon target:
  - `LOD0`: panel rhythm hint
  - `LOD1`: broad roller geometry
  - `LOD2`: simple industrial opening block
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_WAREHOUSE_SMALL_001`
  - future factory recipes
- reuse potential: medium-high

## 7. Module Category 4 - Exterior

#### `MOD_VERANDAH_STANDARD_001`

- purpose: universal residential frontage veranda
- variants:
  - narrow
  - full-width
- polygon target:
  - `LOD0`: posts, roof edge, and floor read
  - `LOD1`: simplified veranda mass
  - `LOD2`: frontage silhouette extension
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
- reuse potential: high

#### `MOD_PORCH_STANDARD_001`

- purpose: compact entrance porch
- variants:
  - single-step
  - raised step
- polygon target:
  - `LOD0`: clear entry projection
  - `LOD1`: reduced porch block
  - `LOD2`: small entry mass
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - both house recipes
  - future civic house-type assets
- reuse potential: medium-high

#### `MOD_BALCONY_STANDARD_001`

- purpose: upper-level linear balcony
- variants:
  - short
  - room-run
- polygon target:
  - `LOD0`: railing and slab clarity
  - `LOD1`: simplified balcony line
  - `LOD2`: silhouette shelf
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
  - future apartments
- reuse potential: medium-high

#### `MOD_AWNING_STANDARD_001`

- purpose: commercial weather cover
- variants:
  - shallow shop awning
  - deeper cafe awning
- polygon target:
  - `LOD0`: crisp street-edge form
  - `LOD1`: simple canopy plane
  - `LOD2`: frontage silhouette lip
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - `RECIPE_BAKERY_COASTAL_001`
  - `RECIPE_CAFE_SMALL_TOWN_001`
- reuse potential: high

#### `MOD_COLUMN_STANDARD_001`

- purpose: universal veranda and civic support post
- variants:
  - plain
  - capped
- polygon target:
  - `LOD0`: readable support post
  - `LOD1`: simplified vertical post
  - `LOD2`: minimal support silhouette
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - house variants
  - school entrance
  - civic entry variants
- reuse potential: medium-high

#### `MOD_TRIM_STANDARD_001`

- purpose: universal edge trim and fascia language
- variants:
  - weatherboard trim
  - civic trim
  - commercial fascia trim
- polygon target:
  - `LOD0`: subtle but readable trim edges
  - `LOD1`: simplified trim bands
  - `LOD2`: colour accent edges only
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - houses
  - bakery
  - cafe
  - school
  - police
  - fire station
- reuse potential: highest

#### `MOD_SIGN_MOUNT_STANDARD_001`

- purpose: reusable sign attachment support
- variants:
  - hanging mount
  - wall mount
  - freestanding mount
- polygon target:
  - `LOD0`: clear readable bracket form
  - `LOD1`: simplified support arm
  - `LOD2`: minimal sign silhouette support
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - bakery
  - cafe
  - police
  - fire station
  - school
  - lighthouse
- reuse potential: high

## 8. Module Category 5 - Landscape

### Vegetation

#### `MOD_GRASS_COASTAL_001`

- purpose: universal ground cover
- variants:
  - trimmed lot grass
  - rough edge grass
- polygon target:
  - `LOD0`: layered patch variation
  - `LOD1`: simple low ground forms
  - `LOD2`: colour block ground treatment
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - most residential, civic, motel, and landmark recipes
- reuse potential: highest

#### `MOD_BUSH_STANDARD_001`

- purpose: universal low vegetation cluster
- variants:
  - round bush
  - elongated shrub
- polygon target:
  - `LOD0`: layered bush mass
  - `LOD1`: simplified low cluster
  - `LOD2`: single silhouette blob
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - houses
  - bakery
  - cafe
  - school
  - motel
  - lighthouse
- reuse potential: highest

#### `MOD_HEDGE_STANDARD_001`

- purpose: lot-edge and civic-boundary greenery
- variants:
  - low hedge
  - medium hedge
- polygon target:
  - `LOD0`: trimmed edge readability
  - `LOD1`: simple linear green block
  - `LOD2`: flat boundary greenery
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - houses
  - school
  - police
  - motel
- reuse potential: medium-high

#### `MOD_TREE_EUCALYPTUS_STANDARD_001`

- purpose: universal signature tree
- variants:
  - small
  - medium
  - lot-edge placement
- polygon target:
  - `LOD0`: richer canopy and trunk form
  - `LOD1`: optimized canopy identity
  - `LOD2`: simplified tree silhouette
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - houses
  - school
  - motel
  - lighthouse
- reuse potential: highest

#### `MOD_FLOWERBED_STANDARD_001`

- purpose: frontage and civic accent planting
- variants:
  - narrow strip
  - clustered bed
- polygon target:
  - `LOD0`: grouped flowers and border
  - `LOD1`: simplified accent patch
  - `LOD2`: small colour accent only
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - houses
  - bakery
  - cafe
  - school
- reuse potential: medium

### Site

#### `MOD_PATH_STANDARD_001`

- purpose: universal lot-to-entry path
- variants:
  - straight
  - gentle bend
- polygon target:
  - `LOD0`: path edge clarity
  - `LOD1`: simplified strip
  - `LOD2`: entry guide line
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - almost all starter recipes
- reuse potential: highest

#### `MOD_PAVEMENT_STANDARD_001`

- purpose: commercial, civic, and industrial hardscape
- variants:
  - frontage slab
  - court slab
  - service slab
- polygon target:
  - `LOD0`: surface edge and cut pattern hints
  - `LOD1`: simplified surface block
  - `LOD2`: major ground colour block
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - bakery
  - cafe
  - school
  - police
  - fire station
  - warehouse
- reuse potential: highest

#### `MOD_DRIVEWAY_STANDARD_001`

- purpose: universal residential and motel vehicle access strip
- variants:
  - single
  - side-lot
- polygon target:
  - `LOD0`: edge and apron definition
  - `LOD1`: simplified paved strip
  - `LOD2`: broad access block
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - both house recipes
  - motel
- reuse potential: medium-high

#### `MOD_FENCE_STANDARD_001`

- purpose: lot and site boundary definition
- variants:
  - timber
  - wire
  - civic low fence
- polygon target:
  - `LOD0`: clear post rhythm
  - `LOD1`: simplified fence run
  - `LOD2`: low boundary line
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - houses
  - school
  - police
  - warehouse
  - motel
  - lighthouse path edge
- reuse potential: highest

#### `MOD_RETAINING_WALL_STANDARD_001`

- purpose: terrain control for sloped and edge lots
- variants:
  - short wall
  - stepped wall
- polygon target:
  - `LOD0`: readable stepped edge
  - `LOD1`: simplified support mass
  - `LOD2`: edge block silhouette
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - coastal house variants
  - lighthouse
  - future slope lots
- reuse potential: medium

## 9. Module Category 6 - Street

#### `MOD_BENCH_STANDARD_001`

- purpose: universal public seating prop
- variants:
  - park bench
  - street bench
- polygon target:
  - `LOD0`: simple seat/slat read
  - `LOD1`: reduced seat form
  - `LOD2`: small public-space silhouette
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - school
  - cafe exterior
  - lighthouse path
  - future civic streets
- reuse potential: medium-high

#### `MOD_BIN_STANDARD_001`

- purpose: universal public utility bin
- variants:
  - street bin
  - park bin
- polygon target:
  - `LOD0`: simple prop clarity
  - `LOD1`: reduced utility block
  - `LOD2`: omit unless required
- LOD requirement: `LOD0`, `LOD1`, optional `LOD2`
- compatible recipes:
  - school
  - cafe exterior
  - civic lots
- reuse potential: medium

#### `MOD_LAMP_STANDARD_001`

- purpose: universal public and lot-edge lamp
- variants:
  - street lamp
  - pathway lamp
- polygon target:
  - `LOD0`: clean vertical light identity
  - `LOD1`: simplified pole and lamp head
  - `LOD2`: minimal vertical marker
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - school
  - police
  - motel
  - lighthouse path
  - future civic streets
- reuse potential: medium-high

#### `MOD_SIGN_STANDARD_001`

- purpose: universal freestanding sign prop
- variants:
  - roadside
  - wayfinding
  - property entry
- polygon target:
  - `LOD0`: readable sign panel and support
  - `LOD1`: reduced sign silhouette
  - `LOD2`: major sign block only
- LOD requirement: `LOD0`, `LOD1`, `LOD2`
- compatible recipes:
  - school
  - police
  - fire station
  - lighthouse
  - future bus stops
- reuse potential: high

#### `MOD_BUS_STOP_COMPONENT_STANDARD_001`

- purpose: starter transit street component family
- variants:
  - post only
  - seat + post
- polygon target:
  - `LOD0`: simple stop identity
  - `LOD1`: reduced transit marker
  - `LOD2`: omit unless route-critical
- LOD requirement: `LOD0`, `LOD1`, optional `LOD2`
- compatible recipes:
  - future suburban and civic streets
- reuse potential: medium-low

## 10. Recipe Compatibility Summary

### Highest-compatibility modules

- `MOD_WALL_CORNER_STANDARD_001`
- `MOD_ROOF_GABLE_STANDARD_001`
- `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
- `MOD_TRIM_STANDARD_001`
- `MOD_PATH_STANDARD_001`
- `MOD_PAVEMENT_STANDARD_001`
- `MOD_FENCE_STANDARD_001`
- `MOD_GRASS_COASTAL_001`
- `MOD_BUSH_STANDARD_001`

### Compatibility rule

Modules should be prioritized when they unlock:

- more than one category
- more than one recipe family
- both proof assets and expansion recipes

## 11. Reuse Analysis

### Highest reuse examples

#### `MOD_WINDOW_RESIDENTIAL_STANDARD_001`

Used by:

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`
- `RECIPE_HOUSE_SUBURBAN_BRICK_001`
- `RECIPE_SCHOOL_SMALL_TOWN_001`
- `RECIPE_POLICE_STATION_SUBURBAN_001`
- `RECIPE_FIRE_STATION_SMALL_001`

#### `MOD_STOREFRONT_GLAZING_STANDARD_001`

Used by:

- `RECIPE_BAKERY_COASTAL_001`
- `RECIPE_CAFE_SMALL_TOWN_001`
- future retail shop recipes

#### `MOD_PATH_STANDARD_001`

Used by:

- both house recipes
- bakery
- cafe
- school
- police
- fire station
- motel
- lighthouse

#### `MOD_FENCE_STANDARD_001`

Used by:

- both house recipes
- school
- police
- warehouse
- motel
- lighthouse edge conditions

### Reuse ranking

1. `MOD_PATH_STANDARD_001`
2. `MOD_WALL_CORNER_STANDARD_001`
3. `MOD_TRIM_STANDARD_001`
4. `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
5. `MOD_FENCE_STANDARD_001`
6. `MOD_GRASS_COASTAL_001`
7. `MOD_BUSH_STANDARD_001`
8. `MOD_ROOF_GABLE_STANDARD_001`
9. `MOD_PAVEMENT_STANDARD_001`
10. `MOD_STOREFRONT_GLAZING_STANDARD_001`

## 12. Production Order

### Batch A - Most reused modules

- `MOD_PATH_STANDARD_001`
- `MOD_WALL_CORNER_STANDARD_001`
- `MOD_TRIM_STANDARD_001`
- `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
- `MOD_FENCE_STANDARD_001`
- `MOD_GRASS_COASTAL_001`
- `MOD_BUSH_STANDARD_001`
- `MOD_PAVEMENT_STANDARD_001`

### Batch B - Residential modules

- `MOD_FOUNDATION_SMALL_RECT_001`
- `MOD_WALL_WEATHERBOARD_WHITE_001`
- `MOD_WALL_BRICK_RED_001`
- `MOD_ROOF_GABLE_STANDARD_001`
- `MOD_ROOF_HIP_STANDARD_001`
- `MOD_DOOR_RESIDENTIAL_FRONT_001`
- `MOD_DOOR_RESIDENTIAL_SERVICE_001`
- `MOD_VERANDAH_STANDARD_001`
- `MOD_PORCH_STANDARD_001`
- `MOD_DRIVEWAY_STANDARD_001`

### Batch C - Commercial modules

- `MOD_FOUNDATION_COMMERCIAL_001`
- `MOD_STOREFRONT_GLAZING_STANDARD_001`
- `MOD_DOOR_GLASS_ENTRY_001`
- `MOD_ROOF_FLAT_STANDARD_001`
- `MOD_ROOF_PARAPET_STANDARD_001`
- `MOD_AWNING_STANDARD_001`
- `MOD_SIGN_MOUNT_STANDARD_001`

### Batch D - Civic modules

- `MOD_FOUNDATION_MEDIUM_RECT_001`
- `MOD_WINDOW_CIVIC_LARGE_001`
- `MOD_COLUMN_STANDARD_001`
- `MOD_SIGN_STANDARD_001`
- `MOD_LAMP_STANDARD_001`

### Batch E - Industrial modules

- `MOD_WALL_INDUSTRIAL_PANEL_001`
- `MOD_DOOR_ROLLER_INDUSTRIAL_001`
- `MOD_ROOF_WAREHOUSE_STANDARD_001`
- `MOD_ROOF_FACTORY_STANDARD_001`
- `MOD_RETAINING_WALL_STANDARD_001`

## 13. Recommended Blender Production Order

The future Blender production order should follow:

1. Batch A
2. Batch B
3. Batch C
4. Batch D
5. Batch E

### Rationale

- Batch A creates the broadest library unlocks
- Batch B validates the first proof house and residential family reuse
- Batch C opens the commercial street set
- Batch D validates civic scale and identity
- Batch E validates industrial specialization after the shared systems are stable

## 14. Readiness Statement

This document is ready to serve as the first Layer A universal module production planning foundation for GrowGo.

It authorizes:

- Layer A module review
- reuse ranking review
- production sequencing review
- future Blender handoff preparation

It does not authorize:

- Blender production
- GLB creation
- scripting
- runtime implementation
- gameplay systems
- backend systems
- OSM systems
