# GrowGo Session 7.5 - Core Layer A Module Specification Foundation

## Session Scope

This document converts the Layer A universal module inventory into detailed production specifications for the highest-value reusable modules in the GrowGo Modular Asset Factory.

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

1. detailed module specifications
2. physical dimensions
3. attachment and socket rules
4. compatible recipe coverage
5. material and LOD expectations
6. reuse and production readiness guidance

## 1. Source of Truth

This Session 7.5 planning document is governed by:

- `GROWGO_MODULAR_BIBLE_DESIGN_FOUNDATION.md`
- `GROWGO_SESSION_2_MODULAR_LIBRARY_AND_RECIPE_PLANNING.md`
- `GROWGO_SESSION_2_5_NAMING_METADATA_AND_BLENDER_HANDOFF_FOUNDATION.md`
- `GROWGO_SESSION_5_BLENDER_ASSET_FACTORY_ARCHITECTURE_FOUNDATION.md`
- `GROWGO_SESSION_7_LAYER_A_UNIVERSAL_MODULE_PRODUCTION_PLANNING_FOUNDATION.md`

If a future planning document conflicts with these documents, those source documents remain authoritative unless explicitly updated.

## 2. Layer A Detailed Specification Purpose

The Layer A detailed specification layer translates the approved universal module inventory into Blender-ready planning records without starting production.

Each module specification in this document must provide:

- a permanent module ID
- a clear production purpose
- dimensions that support repeatable assembly
- attachment points and socket rules
- material and LOD expectations
- compatible recipe coverage
- reuse planning for future asset batches

These specifications are intended to reduce ambiguity before the first modular production batch begins.

## 3. Shared Metadata Standard

Every Layer A module specification must include the following metadata fields:

- `assetID`
- `category`
- `family`
- `description`
- `dimensions`
- `polygonTarget`
- `lodSupport`
- `materialReferences`
- `compatibleRecipes`
- `reuseCountEstimate`
- `attachmentPoints`

Recommended planning-only support fields for future production tracking:

- `socketRules`
- `variantSet`
- `orientationRules`
- `biomeCompatibility` where relevant
- `notes` for recipe-specific constraints

## 4. Shared Socket and Attachment Rule Set

All Layer A modules should use a consistent planning vocabulary for attachment and socket behavior.

### 4.1 Attachment point naming

- `SOCKET_TOP_EDGE`
- `SOCKET_BOTTOM_EDGE`
- `SOCKET_LEFT_EDGE`
- `SOCKET_RIGHT_EDGE`
- `SOCKET_CORNER_INNER`
- `SOCKET_CORNER_OUTER`
- `SOCKET_WINDOW_STANDARD`
- `SOCKET_WINDOW_LARGE`
- `SOCKET_DOOR_STANDARD`
- `SOCKET_DOOR_SERVICE`
- `SOCKET_DOOR_COMMERCIAL`
- `SOCKET_PATH_ENTRY`
- `SOCKET_PATH_BRANCH`
- `SOCKET_ROAD_FRONTAGE`
- `SOCKET_PROPERTY_EDGE`
- `SOCKET_FENCE_RUN`
- `SOCKET_FENCE_CORNER`
- `SOCKET_SIGN_FACE`
- `SOCKET_SIGN_BASE`
- `SOCKET_ROOF_RIDGE`
- `SOCKET_ROOF_EAVE`
- `SOCKET_LANDSCAPE_PATCH`

### 4.2 Socket rules

- sockets must represent explicit connection intent rather than inferred placement
- mirrored module variants must retain stable socket naming
- path, fence, and roof sockets must support chained assembly
- opening sockets must declare both size class and placement height
- no module should require hidden manual offsets that are absent from metadata

## 5. Shared LOD Rules

All modules in this planning set are expected to support the same three production LOD tiers:

### `LOD0`

Close inspection view.

Retains:

- silhouette detail
- readable trim breaks
- meaningful attachment geometry
- major facade and edge articulation

### `LOD1`

Gameplay view.

Retains:

- identity silhouette
- primary material blocks
- large openings and form changes
- necessary sockets for recipe assembly validation

### `LOD2`

Overview view.

Retains:

- essential footprint
- roof or canopy massing
- major colour separation
- minimal landmark identity where needed

Planning rule:

Each module specification must define what remains visible in `LOD0`, `LOD1`, and `LOD2`, even when detailed geometry is removed.

## 6. Shared Material Rules

Layer A modules must preserve the GrowGo Papercut 2.5D Diorama style through a controlled material system.

Rules:

- prefer shared material families over module-specific one-off materials
- use texture atlases where repetition is high
- keep colour variation readable from overview zoom
- avoid photoreal detail and noisy surfaces
- preserve clean silhouettes and soft value shifts
- keep material counts low for mobile performance

Recommended shared material families:

- `MAT_PATH_STONE_NEUTRAL_001`
- `MAT_PATH_CONCRETE_LIGHT_001`
- `MAT_WEATHERBOARD_WHITE_001`
- `MAT_BRICK_RED_001`
- `MAT_RENDER_CREAM_001`
- `MAT_STORE_GLASS_COASTAL_001`
- `MAT_INDUSTRIAL_PANEL_BLUE_GREY_001`
- `MAT_WINDOW_FRAME_WHITE_001`
- `MAT_WINDOW_FRAME_TIMBER_001`
- `MAT_WINDOW_FRAME_DARK_001`
- `MAT_DOOR_PAINT_COASTAL_001`
- `MAT_DOOR_SERVICE_NEUTRAL_001`
- `MAT_METAL_ROLLER_GREY_001`
- `MAT_ROOF_TILE_RED_001`
- `MAT_ROOF_METAL_SILVER_001`
- `MAT_ROOF_DARK_CHARCOAL_001`
- `MAT_GRASS_COASTAL_001`
- `MAT_BUSH_STANDARD_001`
- `MAT_TREE_EUCALYPTUS_TRUNK_001`
- `MAT_TREE_EUCALYPTUS_LEAF_001`
- `MAT_FENCE_TIMBER_001`
- `MAT_FENCE_METAL_001`
- `MAT_SIGN_PAINT_NEUTRAL_001`

## 7. Module Group 1 - Path System

### 7.1 `MOD_PATH_STANDARD_001`

- category: `SITE`
- family: `PATH`
- purpose: universal property and civic path module for pedestrian circulation and entry definition
- description: a modular path system that connects roads, entries, public edges, and property routes across residential, commercial, civic, motel, lighthouse, and park recipes
- dimensions:
  - standard width: `1.5m`
  - driveway connection width: `2.8m`
  - thickness: `0.12m`
  - standard straight segment length: `2.0m`
- attachment points:
  - `SOCKET_PATH_BRANCH`
  - `SOCKET_PATH_ENTRY`
  - `SOCKET_ROAD_FRONTAGE`
  - `SOCKET_PROPERTY_EDGE`
- socket rules:
  - straight and corner segments must terminate on a centered path socket
  - T junction and driveway variants must expose at least three compatible path sockets
  - entrance path variant must expose one property-entry socket and one facade-entry socket
  - driveway connection variant may widen only on branch segments and must still connect back to the standard path width
- variants:
  - straight path
  - corner path
  - T junction
  - driveway connection
  - entrance path
- material references:
  - `MAT_PATH_STONE_NEUTRAL_001`
  - `MAT_PATH_CONCRETE_LIGHT_001`
- polygon targets:
  - `LOD0`: `120-220` triangles per 2m segment
  - `LOD1`: `40-100` triangles per 2m segment
  - `LOD2`: `8-24` triangles per 2m segment
- LOD requirements:
  - `LOD0`: edge bevels, slight stepping, curb readability where applicable
  - `LOD1`: clean top surface, readable border, no bevel dependency
  - `LOD2`: flat silhouette strip with retained route width
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_BAKERY_COASTAL_001`
  - `RECIPE_CAFE_SMALL_TOWN_001`
  - `RECIPE_SCHOOL_SMALL_TOWN_001`
  - `RECIPE_POLICE_STATION_SUBURBAN_001`
  - `RECIPE_FIRE_STATION_SMALL_001`
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
  - `RECIPE_LIGHTHOUSE_ISLAND_001`
- reuse opportunities:
  - front entry paths for houses and shops
  - public circulation paths for schools and civic lots
  - forecourt and walkway routes for motels and landmarks
- reuse count estimate: very high

## 8. Module Group 2 - Wall System

### 8.1 `MOD_WALL_WEATHERBOARD_WHITE_001`

- category: `STRUCTURE`
- family: `WALL_RESIDENTIAL`
- purpose: primary coastal and suburban house wall module
- description: weatherboard wall module for cottages, coastal homes, motels, and adaptable civic side structures
- dimensions:
  - width: `3.0m`
  - height: `2.8m`
  - thickness: `0.2m`
- attachment points:
  - `SOCKET_TOP_EDGE`
  - `SOCKET_BOTTOM_EDGE`
  - `SOCKET_LEFT_EDGE`
  - `SOCKET_RIGHT_EDGE`
  - `SOCKET_WINDOW_STANDARD`
  - `SOCKET_DOOR_STANDARD`
  - `SOCKET_DOOR_SERVICE`
- socket rules:
  - must connect to standard residential foundation widths
  - must accept corner and extension wall joins on left and right edges
  - window sockets must support sill height at `0.9m`
  - door sockets must remain centered or offset according to recipe metadata
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
- variants:
  - blank wall
  - standard window wall
  - front-entry wall
  - side-service wall
- material references:
  - `MAT_WEATHERBOARD_WHITE_001`
  - `MAT_WINDOW_FRAME_WHITE_001`
  - `MAT_DOOR_PAINT_COASTAL_001`
- polygon targets:
  - `LOD0`: `280-420`
  - `LOD1`: `140-220`
  - `LOD2`: `40-80`
- LOD requirements:
  - `LOD0`: board rhythm and trim depth remain visible
  - `LOD1`: board rhythm simplified into broader surface breaks
  - `LOD2`: only silhouette and major opening voids remain
- reuse opportunities:
  - coastal cottages
  - holiday houses
  - motel room blocks
  - lightweight civic annexes
- reuse count estimate: very high

### 8.2 `MOD_WALL_BRICK_RED_001`

- category: `STRUCTURE`
- family: `WALL_RESIDENTIAL`
- purpose: suburban and small-town masonry wall module
- description: red brick wall system for suburban homes, civic buildings, police stations, and schools
- dimensions:
  - width: `3.0m`
  - height: `3.0m`
  - thickness: `0.22m`
- attachment points:
  - `SOCKET_TOP_EDGE`
  - `SOCKET_BOTTOM_EDGE`
  - `SOCKET_LEFT_EDGE`
  - `SOCKET_RIGHT_EDGE`
  - `SOCKET_WINDOW_STANDARD`
  - `SOCKET_WINDOW_LARGE`
  - `SOCKET_DOOR_STANDARD`
- socket rules:
  - corner modules must preserve brick wrap continuity
  - large window socket variants support school and civic facade use
  - door sockets must allow front entries and side entries without scale changes
- compatible recipes:
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_SCHOOL_SMALL_TOWN_001`
  - `RECIPE_POLICE_STATION_SUBURBAN_001`
- variants:
  - blank wall
  - standard window wall
  - large civic window wall
  - entry wall
- material references:
  - `MAT_BRICK_RED_001`
  - `MAT_WINDOW_FRAME_DARK_001`
- polygon targets:
  - `LOD0`: `260-380`
  - `LOD1`: `130-210`
  - `LOD2`: `36-72`
- LOD requirements:
  - `LOD0`: lintels and sill depth visible
  - `LOD1`: lintel rhythm retained in simplified form
  - `LOD2`: flat silhouette with readable opening placement
- reuse opportunities:
  - suburban houses
  - schools
  - police and fire station side walls
- reuse count estimate: high

### 8.3 `MOD_WALL_RENDER_CREAM_001`

- category: `STRUCTURE`
- family: `WALL_GENERAL`
- purpose: smooth rendered facade for civic, hospitality, and modern residential use
- description: simple rendered wall system for cleaner papercut silhouettes and brighter facade colour control
- dimensions:
  - width: `3.0m`
  - height: `3.0m`
  - thickness: `0.2m`
- attachment points:
  - `SOCKET_TOP_EDGE`
  - `SOCKET_BOTTOM_EDGE`
  - `SOCKET_LEFT_EDGE`
  - `SOCKET_RIGHT_EDGE`
  - `SOCKET_WINDOW_STANDARD`
  - `SOCKET_WINDOW_LARGE`
  - `SOCKET_DOOR_STANDARD`
  - `SOCKET_DOOR_COMMERCIAL`
- socket rules:
  - render modules may be paired with residential or commercial opening sets
  - vertical trim bands must not change socket positions
- compatible recipes:
  - `RECIPE_CAFE_SMALL_TOWN_001`
  - `RECIPE_LIBRARY_SMALL_TOWN` 
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
- variants:
  - blank render wall
  - standard window wall
  - commercial entry wall
- material references:
  - `MAT_RENDER_CREAM_001`
- polygon targets:
  - `LOD0`: `220-340`
  - `LOD1`: `110-180`
  - `LOD2`: `30-64`
- LOD requirements:
  - `LOD0`: trim bands and reveal depth readable
  - `LOD1`: surface mostly flat with visible openings
  - `LOD2`: silhouette only with colour block identity
- reuse opportunities:
  - cafes
  - libraries
  - civic buildings
  - modern house variants
- reuse count estimate: medium-high

### 8.4 `MOD_WALL_STORE_FRONT_001`

- category: `STRUCTURE`
- family: `WALL_COMMERCIAL`
- purpose: small-shop and hospitality street-facing facade base
- description: storefront wall module with glazing, sign band support, and commercial entry compatibility
- dimensions:
  - width: `4.0m`
  - height: `3.4m`
  - thickness: `0.24m`
- attachment points:
  - `SOCKET_TOP_EDGE`
  - `SOCKET_BOTTOM_EDGE`
  - `SOCKET_LEFT_EDGE`
  - `SOCKET_RIGHT_EDGE`
  - `SOCKET_DOOR_COMMERCIAL`
  - `SOCKET_SIGN_FACE`
- socket rules:
  - must align with awning and sign mount systems
  - commercial door socket must preserve glazing symmetry options
  - side edges must join parapet and flat-roof wall variants cleanly
- compatible recipes:
  - `RECIPE_BAKERY_COASTAL_001`
  - `RECIPE_CAFE_SMALL_TOWN_001`
- variants:
  - centered entry
  - offset entry
  - full glazing
  - display window emphasis
- material references:
  - `MAT_STORE_GLASS_COASTAL_001`
  - `MAT_RENDER_CREAM_001`
- polygon targets:
  - `LOD0`: `420-620`
  - `LOD1`: `220-340`
  - `LOD2`: `60-120`
- LOD requirements:
  - `LOD0`: mullions, sign band depth, and glazing rhythm readable
  - `LOD1`: glazing pattern simplified
  - `LOD2`: shopfront block and entry rhythm retained
- reuse opportunities:
  - bakery
  - cafe
  - future retail shops
  - post office and bank adaptations
- reuse count estimate: high

### 8.5 `MOD_WALL_PANEL_INDUSTRIAL_001`

- category: `STRUCTURE`
- family: `WALL_INDUSTRIAL`
- purpose: industrial shell wall for warehouses and service buildings
- description: modular panel wall system for warehouse, service yard, and industrial district recipes
- dimensions:
  - width: `4.0m`
  - height: `4.2m`
  - thickness: `0.24m`
- attachment points:
  - `SOCKET_TOP_EDGE`
  - `SOCKET_BOTTOM_EDGE`
  - `SOCKET_LEFT_EDGE`
  - `SOCKET_RIGHT_EDGE`
  - `SOCKET_DOOR_ROLLER`
- socket rules:
  - panel seams must remain aligned across chained segments
  - roller door socket must match industrial frontage bay width
- compatible recipes:
  - `RECIPE_WAREHOUSE_SMALL_001`
  - future factory and storage recipes
- variants:
  - blank panel wall
  - roller entry wall
  - service entry wall
- material references:
  - `MAT_INDUSTRIAL_PANEL_BLUE_GREY_001`
  - `MAT_METAL_ROLLER_GREY_001`
- polygon targets:
  - `LOD0`: `260-360`
  - `LOD1`: `110-170`
  - `LOD2`: `28-52`
- LOD requirements:
  - `LOD0`: panel breaks visible
  - `LOD1`: broad panel rhythm retained
  - `LOD2`: solid industrial massing only
- reuse opportunities:
  - warehouses
  - storage buildings
  - utility compounds
- reuse count estimate: medium-high

## 9. Module Group 3 - Window System

### 9.1 `MOD_WINDOW_RESIDENTIAL_STANDARD_001`

- category: `OPENING`
- family: `WINDOW_RESIDENTIAL`
- purpose: default house and motel window module
- dimensions:
  - width: `1.2m`
  - height: `1.4m`
  - depth: `0.16m`
- attachment points:
  - `SOCKET_WINDOW_STANDARD`
- socket rules:
  - installs into residential wall sockets only
  - standard sill height target: `0.9m`
  - may mirror left/right without changing frame proportions
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
- variants:
  - white frame
  - timber frame
  - dark frame
- material references:
  - `MAT_WINDOW_FRAME_WHITE_001`
  - `MAT_WINDOW_FRAME_TIMBER_001`
  - `MAT_WINDOW_FRAME_DARK_001`
- polygon targets:
  - `LOD0`: `120-180`
  - `LOD1`: `60-100`
  - `LOD2`: `12-24`
- LOD requirements:
  - `LOD0`: frame depth and sill read clearly
  - `LOD1`: simplified frame blocks
  - `LOD2`: dark opening block only
- reuse opportunities:
  - houses
  - motels
  - schools
  - police station side rooms
- reuse count estimate: very high

### 9.2 `MOD_WINDOW_RESIDENTIAL_LARGE_001`

- category: `OPENING`
- family: `WINDOW_RESIDENTIAL`
- purpose: wider living room and feature window
- dimensions:
  - width: `1.8m`
  - height: `1.5m`
  - depth: `0.16m`
- attachment points:
  - `SOCKET_WINDOW_LARGE`
- socket rules:
  - requires large-window wall variant
  - placement height target: `0.75m`
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
- variants:
  - white frame
  - dark frame
- material references:
  - `MAT_WINDOW_FRAME_WHITE_001`
  - `MAT_WINDOW_FRAME_DARK_001`
- polygon targets:
  - `LOD0`: `140-220`
  - `LOD1`: `70-120`
  - `LOD2`: `16-28`
- LOD requirements:
  - `LOD0`: mullion spacing visible
  - `LOD1`: broad glazing split retained
  - `LOD2`: simple horizontal opening block
- reuse opportunities:
  - houses
  - civic lounges
  - motel reception
- reuse count estimate: high

### 9.3 `MOD_WINDOW_BAY_STANDARD_001`

- category: `OPENING`
- family: `WINDOW_RESIDENTIAL`
- purpose: identity window for select residential variants
- dimensions:
  - width: `2.2m`
  - height: `1.6m`
  - projection: `0.45m`
- attachment points:
  - `SOCKET_WINDOW_LARGE`
- socket rules:
  - only valid on wall variants marked bay-compatible
  - projection clearance required in footprint metadata
- compatible recipes:
  - future coastal and suburban house variants
- variants:
  - white frame
  - timber frame
- material references:
  - `MAT_WINDOW_FRAME_WHITE_001`
  - `MAT_WINDOW_FRAME_TIMBER_001`
- polygon targets:
  - `LOD0`: `220-320`
  - `LOD1`: `100-160`
  - `LOD2`: `24-40`
- LOD requirements:
  - `LOD0`: projection geometry intact
  - `LOD1`: projection simplified
  - `LOD2`: treated as widened window mass
- reuse opportunities:
  - premium house variants
  - boutique motel units
- reuse count estimate: medium

### 9.4 `MOD_WINDOW_STOREFRONT_GLAZING_001`

- category: `OPENING`
- family: `WINDOW_COMMERCIAL`
- purpose: commercial glazing insert for bakery, cafe, and retail facades
- dimensions:
  - width: `2.4m`
  - height: `2.2m`
  - depth: `0.18m`
- attachment points:
  - `SOCKET_WINDOW_LARGE`
  - `SOCKET_SIGN_FACE`
- socket rules:
  - must align with storefront wall mullion spacing
  - sign band clearance required above
- compatible recipes:
  - `RECIPE_BAKERY_COASTAL_001`
  - `RECIPE_CAFE_SMALL_TOWN_001`
- variants:
  - full pane
  - split pane
  - display base
- material references:
  - `MAT_STORE_GLASS_COASTAL_001`
- polygon targets:
  - `LOD0`: `180-260`
  - `LOD1`: `90-140`
  - `LOD2`: `20-36`
- LOD requirements:
  - `LOD0`: mullion rhythm visible
  - `LOD1`: reduced mullion count
  - `LOD2`: single glazed opening block
- reuse opportunities:
  - bakery
  - cafe
  - bank
  - post office
  - retail shops
- reuse count estimate: high

### 9.5 `MOD_WINDOW_CIVIC_STANDARD_001`

- category: `OPENING`
- family: `WINDOW_CIVIC`
- purpose: larger institutional window for schools and civic buildings
- dimensions:
  - width: `2.0m`
  - height: `1.8m`
  - depth: `0.18m`
- attachment points:
  - `SOCKET_WINDOW_LARGE`
- socket rules:
  - requires civic or brick wall large-window sockets
  - placement height target: `0.85m`
- compatible recipes:
  - `RECIPE_SCHOOL_SMALL_TOWN_001`
  - `RECIPE_POLICE_STATION_SUBURBAN_001`
  - future library and hospital recipes
- variants:
  - white frame
  - dark civic frame
- material references:
  - `MAT_WINDOW_FRAME_WHITE_001`
  - `MAT_WINDOW_FRAME_DARK_001`
- polygon targets:
  - `LOD0`: `150-230`
  - `LOD1`: `80-120`
  - `LOD2`: `18-30`
- LOD requirements:
  - `LOD0`: frame division visible
  - `LOD1`: simplified frame block
  - `LOD2`: opening block only
- reuse opportunities:
  - schools
  - police stations
  - libraries
  - museums
- reuse count estimate: medium-high

## 10. Module Group 4 - Door System

### 10.1 `MOD_DOOR_STANDARD_RESIDENTIAL_001`

- category: `OPENING`
- family: `DOOR_RESIDENTIAL`
- purpose: primary front entry door for houses and motel rooms
- dimensions:
  - width: `0.95m`
  - height: `2.1m`
  - depth: `0.12m`
- attachment points:
  - `SOCKET_DOOR_STANDARD`
- socket rules:
  - fits standard residential door sockets only
  - threshold height fixed to foundation top plane
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
- variants:
  - painted coastal
  - timber
  - dark neutral
- material references:
  - `MAT_DOOR_PAINT_COASTAL_001`
- polygon targets:
  - `LOD0`: `100-160`
  - `LOD1`: `48-80`
  - `LOD2`: `10-20`
- LOD requirements:
  - `LOD0`: panel rhythm readable
  - `LOD1`: panel rhythm simplified
  - `LOD2`: single door colour block
- reuse opportunities:
  - houses
  - motels
  - civic side entries
- reuse count estimate: very high

### 10.2 `MOD_DOOR_SERVICE_RESIDENTIAL_001`

- category: `OPENING`
- family: `DOOR_RESIDENTIAL`
- purpose: side and service door for houses and back-of-house layouts
- dimensions:
  - width: `0.85m`
  - height: `2.0m`
  - depth: `0.1m`
- attachment points:
  - `SOCKET_DOOR_SERVICE`
- socket rules:
  - only valid on side-service wall variants
  - keeps simpler trim profile than front entry
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_BAKERY_COASTAL_001`
- variants:
  - plain painted
  - half-glazed service
- material references:
  - `MAT_DOOR_SERVICE_NEUTRAL_001`
- polygon targets:
  - `LOD0`: `80-130`
  - `LOD1`: `36-64`
  - `LOD2`: `8-16`
- LOD requirements:
  - `LOD0`: frame and handle area read
  - `LOD1`: simplified slab
  - `LOD2`: flat service door block
- reuse opportunities:
  - houses
  - shops
  - schools
  - civic service entries
- reuse count estimate: high

### 10.3 `MOD_DOOR_GLASS_ENTRY_001`

- category: `OPENING`
- family: `DOOR_COMMERCIAL`
- purpose: front commercial glass entry
- dimensions:
  - width: `1.2m`
  - height: `2.3m`
  - depth: `0.12m`
- attachment points:
  - `SOCKET_DOOR_COMMERCIAL`
- socket rules:
  - must align with storefront glazing grid
  - may be centered or offset by recipe
- compatible recipes:
  - `RECIPE_BAKERY_COASTAL_001`
  - `RECIPE_CAFE_SMALL_TOWN_001`
  - future retail and bank recipes
- variants:
  - single leaf
  - double leaf
- material references:
  - `MAT_STORE_GLASS_COASTAL_001`
- polygon targets:
  - `LOD0`: `110-180`
  - `LOD1`: `50-90`
  - `LOD2`: `12-22`
- LOD requirements:
  - `LOD0`: frame and handle visible
  - `LOD1`: simplified frame
  - `LOD2`: vertical glass block
- reuse opportunities:
  - bakery
  - cafe
  - shops
  - bank
  - post office
- reuse count estimate: high

### 10.4 `MOD_DOOR_ROLLER_001`

- category: `OPENING`
- family: `DOOR_INDUSTRIAL`
- purpose: industrial or service bay door
- dimensions:
  - width: `3.2m`
  - height: `3.2m`
  - depth: `0.16m`
- attachment points:
  - `SOCKET_DOOR_ROLLER`
- socket rules:
  - requires industrial frontage bay wall variant
  - panel rhythm must align with industrial wall panels
- compatible recipes:
  - `RECIPE_WAREHOUSE_SMALL_001`
  - future fire station and utility recipes
- variants:
  - closed
  - vented
- material references:
  - `MAT_METAL_ROLLER_GREY_001`
- polygon targets:
  - `LOD0`: `120-180`
  - `LOD1`: `48-84`
  - `LOD2`: `10-18`
- LOD requirements:
  - `LOD0`: slat rhythm readable
  - `LOD1`: broad rib pattern only
  - `LOD2`: solid industrial opening
- reuse opportunities:
  - warehouses
  - fire station vehicle bays
  - service depots
- reuse count estimate: medium-high

## 11. Module Group 5 - Roof System

### 11.1 `MOD_ROOF_GABLE_STANDARD_001`

- category: `ROOF`
- family: `ROOF_RESIDENTIAL`
- purpose: default small-house roof module
- dimensions:
  - base coverage: `6.0m x 8.0m` scalable in 1-bay increments
  - pitch: `28-35 degrees`
- attachment points:
  - `SOCKET_ROOF_EAVE`
  - `SOCKET_ROOF_RIDGE`
  - `SOCKET_TOP_EDGE`
- socket rules:
  - must attach to standard residential wall perimeter
  - ridge line must stay centered unless recipe authorizes asymmetry
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
- variants:
  - red tile
  - silver metal
  - dark charcoal
- material references:
  - `MAT_ROOF_TILE_RED_001`
  - `MAT_ROOF_METAL_SILVER_001`
  - `MAT_ROOF_DARK_CHARCOAL_001`
- polygon targets:
  - `LOD0`: `300-460`
  - `LOD1`: `140-220`
  - `LOD2`: `32-60`
- LOD requirements:
  - `LOD0`: ridge, eaves, and fascia read clearly
  - `LOD1`: primary pitch and eaves retained
  - `LOD2`: roof wedge silhouette only
- reuse opportunities:
  - most houses
  - motels
  - select civic annexes
- reuse count estimate: very high

### 11.2 `MOD_ROOF_HIP_STANDARD_001`

- category: `ROOF`
- family: `ROOF_RESIDENTIAL`
- purpose: suburban and larger residential roof form
- dimensions:
  - base coverage: `7.0m x 9.0m` scalable
  - pitch: `24-30 degrees`
- attachment points:
  - `SOCKET_ROOF_EAVE`
  - `SOCKET_TOP_EDGE`
- socket rules:
  - all four wall edges must align with roof edge bounds
  - compatible only with rectangular and near-rectangular plans
- compatible recipes:
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - future apartments and civic houses
- variants:
  - tile
  - metal
- material references:
  - `MAT_ROOF_TILE_RED_001`
  - `MAT_ROOF_DARK_CHARCOAL_001`
- polygon targets:
  - `LOD0`: `320-500`
  - `LOD1`: `150-240`
  - `LOD2`: `36-64`
- LOD requirements:
  - `LOD0`: hip breaks readable
  - `LOD1`: hip massing preserved
  - `LOD2`: simplified capped mass
- reuse opportunities:
  - suburban houses
  - accommodation
  - civic support buildings
- reuse count estimate: high

### 11.3 `MOD_ROOF_SKILLION_STANDARD_001`

- category: `ROOF`
- family: `ROOF_RESIDENTIAL`
- purpose: modern or lightweight coastal roof variation
- dimensions:
  - base coverage: `5.5m x 8.0m`
  - pitch: `10-18 degrees`
- attachment points:
  - `SOCKET_ROOF_EAVE`
  - `SOCKET_TOP_EDGE`
- socket rules:
  - fall direction must be declared in recipe orientation metadata
  - not valid for symmetrical bay-window compositions without extension rule
- compatible recipes:
  - future modern coastal house variants
  - cafes
  - utility shelters
- variants:
  - mono slope left
  - mono slope right
- material references:
  - `MAT_ROOF_METAL_SILVER_001`
  - `MAT_ROOF_DARK_CHARCOAL_001`
- polygon targets:
  - `LOD0`: `220-320`
  - `LOD1`: `100-160`
  - `LOD2`: `24-44`
- LOD requirements:
  - `LOD0`: fascia and offset eaves preserved
  - `LOD1`: single-slope silhouette retained
  - `LOD2`: flat directional wedge
- reuse opportunities:
  - modern houses
  - cafes
  - utility outbuildings
- reuse count estimate: medium-high

### 11.4 `MOD_ROOF_FLAT_COMMERCIAL_001`

- category: `ROOF`
- family: `ROOF_COMMERCIAL`
- purpose: simple flat roof for small commercial and civic buildings
- dimensions:
  - base coverage: `6.0m x 10.0m` scalable by frontage bay
  - pitch: `0-3 degrees`
- attachment points:
  - `SOCKET_TOP_EDGE`
  - `SOCKET_ROOF_EAVE`
- socket rules:
  - must align with commercial parapet or flat edge wall set
  - drainage direction hidden from camera where possible
- compatible recipes:
  - `RECIPE_BAKERY_COASTAL_001`
  - `RECIPE_CAFE_SMALL_TOWN_001`
  - future bank and post office recipes
- variants:
  - shallow edge
  - awning-ready edge
- material references:
  - `MAT_ROOF_DARK_CHARCOAL_001`
- polygon targets:
  - `LOD0`: `180-260`
  - `LOD1`: `80-120`
  - `LOD2`: `16-28`
- LOD requirements:
  - `LOD0`: coping and edge depth visible
  - `LOD1`: plain roof cap
  - `LOD2`: flat slab silhouette
- reuse opportunities:
  - commercial strip
  - civic low-rise
- reuse count estimate: high

### 11.5 `MOD_ROOF_PARAPET_COMMERCIAL_001`

- category: `ROOF`
- family: `ROOF_COMMERCIAL`
- purpose: commercial street-facing parapet roof cap
- dimensions:
  - base coverage: `6.0m x 10.0m` scalable
  - parapet height above roof plane: `0.7m`
- attachment points:
  - `SOCKET_TOP_EDGE`
  - `SOCKET_SIGN_FACE`
- socket rules:
  - front parapet face must align with storefront sign zone
  - side parapets must step cleanly between adjoining shop widths
- compatible recipes:
  - `RECIPE_BAKERY_COASTAL_001`
  - `RECIPE_CAFE_SMALL_TOWN_001`
  - future retail and town-centre recipes
- variants:
  - straight parapet
  - stepped parapet
- material references:
  - `MAT_RENDER_CREAM_001`
  - `MAT_BRICK_RED_001`
- polygon targets:
  - `LOD0`: `220-320`
  - `LOD1`: `90-150`
  - `LOD2`: `20-36`
- LOD requirements:
  - `LOD0`: parapet step and cap depth remain visible
  - `LOD1`: parapet mass retained
  - `LOD2`: simple facade cap silhouette
- reuse opportunities:
  - bakery
  - cafe
  - retail
  - bank
  - post office
- reuse count estimate: high

## 12. Module Group 6 - Landscape System

### 12.1 `MOD_GRASS_COASTAL_001`

- category: `LANDSCAPE`
- family: `GROUND_COVER`
- purpose: default coastal grass coverage module
- dimensions:
  - tile size: `2.0m x 2.0m`
  - thickness: `0.05m`
- attachment points:
  - `SOCKET_LANDSCAPE_PATCH`
  - `SOCKET_PATH_ENTRY`
- socket rules:
  - tile edges must support seamless patching
  - path and fence interfaces must align to property-edge offsets
- compatible recipes:
  - all residential recipes
  - civic lots
  - motel grounds
  - lighthouse surrounds
- variants:
  - trimmed
  - natural
  - dry edge
- material references:
  - `MAT_GRASS_COASTAL_001`
- polygon targets:
  - `LOD0`: `40-120`
  - `LOD1`: `12-40`
  - `LOD2`: `2-8`
- LOD requirements:
  - `LOD0`: slight edge variation and cut pattern
  - `LOD1`: flat textured patch
  - `LOD2`: colour block only
- biome compatibility:
  - coastal
  - suburban
  - parkland
- density rules:
  - high around residential yards
  - medium around civic edges
  - reduced near road shoulders
- placement rules:
  - avoid hard overlap with paths, drives, and structure footprints
- reuse opportunities:
  - yards
  - civic grounds
  - landscape filler
- reuse count estimate: very high

### 12.2 `MOD_BUSH_STANDARD_001`

- category: `LANDSCAPE`
- family: `VEGETATION`
- purpose: low shrub for property edges and civic landscaping
- dimensions:
  - small radius: `0.45m`
  - medium radius: `0.7m`
  - height range: `0.5m-0.9m`
- attachment points:
  - `SOCKET_LANDSCAPE_PATCH`
- socket rules:
  - may cluster with grass, flowerbed, and fence-edge sockets
  - must not block path entry sockets
- compatible recipes:
  - houses
  - schools
  - police
  - fire station
  - motel
- variants:
  - rounded shrub
  - native low shrub
  - clipped shrub
- material references:
  - `MAT_BUSH_STANDARD_001`
- polygon targets:
  - `LOD0`: `160-280`
  - `LOD1`: `70-140`
  - `LOD2`: `12-28`
- LOD requirements:
  - `LOD0`: layered volume preserved
  - `LOD1`: reduced clump silhouette
  - `LOD2`: single organic mass
- biome compatibility:
  - coastal
  - suburban
  - civic gardens
- density rules:
  - cluster in groups of 1-3 for houses
  - larger grouped masses for schools and civic entries
- placement rules:
  - maintain edge clearance from main doors and driveways
- reuse opportunities:
  - all landscaped lots
- reuse count estimate: very high

### 12.3 `MOD_TREE_EUCALYPTUS_STANDARD_001`

- category: `LANDSCAPE`
- family: `VEGETATION_TREE`
- purpose: signature native tree module for coastal identity
- dimensions:
  - small height: `4.5m`
  - medium height: `6.5m`
  - canopy spread: `2.8m-4.5m`
- attachment points:
  - `SOCKET_LANDSCAPE_PATCH`
- socket rules:
  - trunk pivot remains centered at ground contact
  - canopy spread metadata must be respected by placement spacing checks
- compatible recipes:
  - houses
  - parks
  - schools
  - civic grounds
  - lighthouse landscape
- variants:
  - small
  - medium
  - windswept coastal
- material references:
  - `MAT_TREE_EUCALYPTUS_TRUNK_001`
  - `MAT_TREE_EUCALYPTUS_LEAF_001`
- polygon targets:
  - `LOD0`: `900-1600`
  - `LOD1`: `450-900`
  - `LOD2`: `80-180`
- LOD requirements:
  - `LOD0`: trunk branching and canopy break-up visible
  - `LOD1`: trunk and canopy silhouette retained
  - `LOD2`: simplified crown and trunk mass
- biome compatibility:
  - coastal
  - parkland
  - suburban
- density rules:
  - low density in yards
  - medium in park edges
  - accent placement at landmarks
- placement rules:
  - preserve building setback clearance
  - avoid direct overlap with fence lines and roads
- reuse opportunities:
  - houses
  - parks
  - lighthouse setting
  - schools
- reuse count estimate: high

### 12.4 `MOD_HEDGE_STANDARD_001`

- category: `LANDSCAPE`
- family: `VEGETATION_STRUCTURED`
- purpose: low linear planting for lot separation
- dimensions:
  - segment length: `1.5m`
  - width: `0.45m`
  - height: `0.8m`
- attachment points:
  - `SOCKET_FENCE_RUN`
  - `SOCKET_LANDSCAPE_PATCH`
- socket rules:
  - segment ends must chain like fence segments
  - corner pieces must support 90-degree turns
- compatible recipes:
  - houses
  - motels
  - civic gardens
- variants:
  - clipped hedge
  - loose native hedge
- material references:
  - `MAT_BUSH_STANDARD_001`
- polygon targets:
  - `LOD0`: `180-260`
  - `LOD1`: `80-120`
  - `LOD2`: `14-24`
- LOD requirements:
  - `LOD0`: clipped silhouette visible
  - `LOD1`: linear organic mass retained
  - `LOD2`: short strip mass only
- biome compatibility:
  - suburban
  - coastal
- density rules:
  - low to medium depending on property profile
- placement rules:
  - maintain path openings and driveway breaks
- reuse opportunities:
  - residential fronts
  - motels
  - civic garden edges
- reuse count estimate: medium-high

### 12.5 `MOD_FLOWERBED_STANDARD_001`

- category: `LANDSCAPE`
- family: `GROUND_ACCENT`
- purpose: accent planting bed for frontages and civic entries
- dimensions:
  - patch size: `1.2m x 0.8m`
  - height: `0.3m-0.5m`
- attachment points:
  - `SOCKET_LANDSCAPE_PATCH`
  - `SOCKET_PATH_ENTRY`
- socket rules:
  - used as a non-blocking detail element beside paths and porches
  - must not intrude into door swing or driveway zone
- compatible recipes:
  - houses
  - bakery
  - cafe
  - school
  - motel
- variants:
  - native flowers
  - coastal colour bed
  - low mixed planting
- material references:
  - `MAT_BUSH_STANDARD_001`
  - `MAT_GRASS_COASTAL_001`
- polygon targets:
  - `LOD0`: `160-260`
  - `LOD1`: `60-120`
  - `LOD2`: `10-22`
- LOD requirements:
  - `LOD0`: clump variation visible
  - `LOD1`: simple colour and silhouette grouping
  - `LOD2`: colour patch only
- biome compatibility:
  - coastal
  - suburban
  - civic entries
- density rules:
  - used sparingly as frontage emphasis
- placement rules:
  - prioritize entries and landmark routes
- reuse opportunities:
  - houses
  - cafes
  - schools
  - civic buildings
- reuse count estimate: medium-high

## 13. Module Group 7 - Fence System

### 13.1 `MOD_FENCE_STANDARD_001`

- category: `SITE`
- family: `FENCE`
- purpose: universal boundary and frontage fence module
- dimensions:
  - segment length: `2.0m`
  - standard height: `1.2m`
  - security height: `1.8m`
  - thickness: `0.08m`
- attachment points:
  - `SOCKET_FENCE_RUN`
  - `SOCKET_FENCE_CORNER`
  - `SOCKET_PATH_ENTRY`
- socket rules:
  - straight segments must chain at both ends
  - corner segments must support inside and outside turns
  - gate-compatible runs must leave a path or drive opening
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_SCHOOL_SMALL_TOWN_001`
  - `RECIPE_POLICE_STATION_SUBURBAN_001`
  - `RECIPE_FIRE_STATION_SMALL_001`
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
  - `RECIPE_LIGHTHOUSE_ISLAND_001`
- variants:
  - timber fence
  - metal fence
  - security fence
  - decorative fence
- material references:
  - `MAT_FENCE_TIMBER_001`
  - `MAT_FENCE_METAL_001`
- polygon targets:
  - `LOD0`: `140-260`
  - `LOD1`: `60-120`
  - `LOD2`: `12-28`
- LOD requirements:
  - `LOD0`: slat or rail rhythm visible
  - `LOD1`: broad fence rhythm retained
  - `LOD2`: single fence strip silhouette
- gate compatibility:
  - pedestrian gate
  - driveway gate
  - service gate
- reuse opportunities:
  - houses
  - schools
  - police and fire lots
  - lighthouse path boundaries
- reuse count estimate: very high

## 14. Module Group 8 - Signage System

### 14.1 `MOD_SIGN_MOUNT_STANDARD_001`

- category: `EXTERIOR`
- family: `SIGNAGE`
- purpose: shared sign support for commercial, civic, and service identity
- dimensions:
  - wall sign width range: `1.2m-2.4m`
  - pole sign height: `2.8m`
  - freestanding sign width: `1.4m`
- attachment points:
  - `SOCKET_SIGN_FACE`
  - `SOCKET_SIGN_BASE`
- socket rules:
  - wall sign variants require facade sign-face sockets
  - pole and freestanding variants require ground base sockets
  - sign mount does not include branded face art in Layer A
- compatible recipes:
  - `RECIPE_BAKERY_COASTAL_001`
  - `RECIPE_CAFE_SMALL_TOWN_001`
  - future bank, post office, police, fire, hospital, and retail recipes
- variants:
  - wall sign
  - pole sign
  - freestanding sign
- material references:
  - `MAT_SIGN_PAINT_NEUTRAL_001`
  - `MAT_FENCE_METAL_001`
- polygon targets:
  - `LOD0`: `100-220`
  - `LOD1`: `40-90`
  - `LOD2`: `8-18`
- LOD requirements:
  - `LOD0`: sign support shape and trim visible
  - `LOD1`: sign silhouette and post readable
  - `LOD2`: flat marker silhouette only
- reuse opportunities:
  - bakery
  - cafe
  - bank
  - post office
  - police
  - fire station
  - hospital
  - shops
- reuse count estimate: high

## 15. Compatible Recipe Summary

The highest-value Layer A modules in this document collectively support the starter recipe set across:

- residential
- commercial
- civic
- service
- industrial
- accommodation
- landmark

The strongest cross-category reuse appears in:

1. `MOD_PATH_STANDARD_001`
2. `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
3. `MOD_DOOR_STANDARD_RESIDENTIAL_001`
4. `MOD_ROOF_GABLE_STANDARD_001`
5. `MOD_FENCE_STANDARD_001`
6. `MOD_GRASS_COASTAL_001`
7. `MOD_BUSH_STANDARD_001`
8. `MOD_SIGN_MOUNT_STANDARD_001`

## 16. Reuse Summary

### Very high reuse modules

- `MOD_PATH_STANDARD_001`
- `MOD_WALL_WEATHERBOARD_WHITE_001`
- `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
- `MOD_DOOR_STANDARD_RESIDENTIAL_001`
- `MOD_ROOF_GABLE_STANDARD_001`
- `MOD_GRASS_COASTAL_001`
- `MOD_FENCE_STANDARD_001`

### High reuse modules

- `MOD_WALL_BRICK_RED_001`
- `MOD_WALL_STORE_FRONT_001`
- `MOD_WINDOW_RESIDENTIAL_LARGE_001`
- `MOD_WINDOW_STOREFRONT_GLAZING_001`
- `MOD_DOOR_SERVICE_RESIDENTIAL_001`
- `MOD_DOOR_GLASS_ENTRY_001`
- `MOD_ROOF_HIP_STANDARD_001`
- `MOD_ROOF_FLAT_COMMERCIAL_001`
- `MOD_ROOF_PARAPET_COMMERCIAL_001`
- `MOD_BUSH_STANDARD_001`
- `MOD_TREE_EUCALYPTUS_STANDARD_001`
- `MOD_SIGN_MOUNT_STANDARD_001`

### Medium to medium-high reuse modules

- `MOD_WALL_RENDER_CREAM_001`
- `MOD_WALL_PANEL_INDUSTRIAL_001`
- `MOD_WINDOW_BAY_STANDARD_001`
- `MOD_WINDOW_CIVIC_STANDARD_001`
- `MOD_DOOR_ROLLER_001`
- `MOD_ROOF_SKILLION_STANDARD_001`
- `MOD_HEDGE_STANDARD_001`
- `MOD_FLOWERBED_STANDARD_001`

## 17. Blender Readiness Status

This planning set is ready to support future Blender production preparation, but it is not yet a production instruction set.

Ready in planning terms:

- permanent module IDs defined
- categories and families defined
- dimensions defined
- socket and attachment logic defined
- material references identified
- polygon targets and LOD expectations defined
- compatible recipe coverage defined

Still intentionally deferred:

- Blender scene files
- module meshes
- material atlases
- export scripts
- validation code
- GLB assets

## 18. Session Outcome

Session 7.5 establishes the first detailed Layer A module specification contract for the GrowGo Modular Asset Factory.

It gives the production planning layer enough structure to begin future Blender batch planning while preserving:

- the GrowGo Papercut 2.5D style direction
- mobile-first constraints
- reusable module growth
- deterministic recipe assembly expectations

No production assets are created in this session.
