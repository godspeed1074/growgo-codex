# GrowGo Session 31 - Suburban Brick House Identity Module Expansion Foundation

## Session Scope

This document defines the reusable Layer A suburban residential identity modules required for the future assembly of:

- `RECIPE_HOUSE_SUBURBAN_BRICK_001`
- `BUILDING_HOUSE_SUBURBAN_BRICK_001`

Family:

- `FAMILY_HOUSE_SUBURBAN_BRICK`

This session is specification only.

This session does not:

- create Blender assets
- export GLBs
- create a Layer C suburban house
- modify existing registered modules
- duplicate coastal modules unnecessarily
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## 1. Source of Truth

This Session 31 module foundation is based on:

- `GROWGO_SESSION_30_SUBURBAN_BRICK_HOUSE_RECIPE_ASSEMBLY_TEST_FOUNDATION.md`
- `GROWGO_SESSION_29_5_SMALL_TOWN_BAKERY_VALIDATION_AND_BUILDING_LIBRARY_REGISTRATION.md`
- `GROWGO_SESSION_20_5_BEACH_BUNGALOW_VALIDATION_AND_BUILDING_LIBRARY_REGISTRATION.md`
- existing Modular Bible and Asset Factory Layer A reuse rules

Relevant continuity:

- the residential path already proved reuse through coastal cottage and beach bungalow builds
- the commercial path already proved shared factory architecture through cafe and bakery builds
- the suburban path should extend the residential library through new identity modules, while continuing to reuse the shared site and landscape kit

## 2. Expansion Purpose

The suburban brick recipe foundation established that the suburban house can already reuse:

- path logic
- fence logic
- driveway logic
- lawn and garden support
- large-window logic

What is still missing is the suburban identity layer that makes the building read clearly as:

- brick suburban house
- tiled roof family home
- garage-and-driveway frontage
- letterbox and front-path street edge
- modular residential system reusable beyond a single recipe

This module batch exists to define those missing reusable Layer A suburban pieces before Blender production begins.

## 3. Style Requirements

All modules in this batch must follow:

- GrowGo papercut 2.5D
- lightweight mobile-first construction
- Australian suburban feel
- simple readable silhouettes
- modular construction
- shared materials

The suburban identity set should feel:

- calmer and more domestic than the commercial sets
- more structured and street-oriented than the coastal house family
- readable from overview zoom without requiring dense façade detail

## 4. Performance Requirements

All modules in this batch must support:

- low polygon budgets
- limited material counts
- shared residential material strategy
- clear `LOD_CLOSE`, `LOD_GAMEPLAY`, and `LOD_MAP` behavior
- instancing-friendly layouts where repetition is useful

### Shared material strategy

Recommended material behavior for the full batch:

- reuse shared neutral residential frames and trim where possible
- prefer a compact suburban palette:
  - red brick
  - cream brick/render
  - charcoal roof
  - terracotta roof
  - concrete path
  - white and dark window trims

### Material limits

Recommended limits:

- wall modules: `1-2`
- roof modules: `1-2`
- garage and letterbox modules: `1-2`
- entry path modules: `1`

### Instancing strategy

- brick rhythm should be represented through simplified repeating structure rather than dense individual bricks
- tiled roof read should prioritize silhouette and directional surface rhythm over detailed tile geometry
- letterbox and path variants should be swappable rather than uniquely sculpted per lot

## 5. Target Future Building

### Future recipe

- `RECIPE_HOUSE_SUBURBAN_BRICK_001`

### Future building

- `BUILDING_HOUSE_SUBURBAN_BRICK_001`

### Suburban identity needs this batch must support

- strong brick house façade
- tiled roof silhouette
- driveway-to-garage relationship
- everyday suburban window rhythm
- front-boundary letterbox identity
- clean suburban entry path logic

## 6. Module Specification - `MOD_WALL_BRICK_SUBURBAN_001`

### Asset identity

- asset ID: `MOD_WALL_BRICK_SUBURBAN_001`
- category: `STRUCTURE`
- family: `WALL_RESIDENTIAL_SUBURBAN`

### Purpose

- primary suburban house identity
- masonry façade module for suburban homes and other brick-based residential derivatives

### Brick style variants

- standard red brick wall
- darker suburban brick wall
- cream brick suburban wall
- mixed brick-and-render frontage wall

### Colour variants

- red brick
- warm brown brick
- cream brick
- muted orange brick

### Dimensions

- width: `3.0m`
- height: `3.0m`
- thickness: `0.22m`

### Wall socket rules

- must support standard wall chaining along rectangular suburban footprints
- must expose large-window, standard-window, and entry-door sockets
- must preserve façade alignment across garage-adjacent and entry-adjacent walls

### Corner and end variants

- blank wall
- standard window wall
- large front-window wall
- entry wall
- corner brick wall
- end-cap wall

### Sockets

- `SOCKET_TOP_EDGE`
- `SOCKET_BOTTOM_EDGE`
- `SOCKET_LEFT_EDGE`
- `SOCKET_RIGHT_EDGE`
- `SOCKET_WINDOW_STANDARD`
- `SOCKET_WINDOW_LARGE`
- `SOCKET_DOOR_STANDARD`

### Materials

- `MAT_BRICK_RED_001`
- `MAT_BRICK_CREAM_001`
- `MAT_BRICK_BROWN_001`
- `MAT_WINDOW_FRAME_DARK_001`

### Polygon targets

- `LOD_CLOSE`: `260-380`
- `LOD_GAMEPLAY`: `130-210`
- `LOD_MAP`: `36-72`

### LOD requirements

- `LOD_CLOSE`: brick rhythm, sill depth, and lintel breaks remain readable
- `LOD_GAMEPLAY`: brick massing and opening placement remain identifiable
- `LOD_MAP`: simplified suburban wall silhouette with readable opening zones

### Compatible recipes

- `RECIPE_HOUSE_SUBURBAN_BRICK_001`
- future suburban duplex recipes
- future townhouse recipes
- future apartment frontage recipes

### Reuse opportunities

- suburban homes
- townhouses
- duplexes
- apartments

### Possible commercial or resort reuse

- low-rise serviced apartments
- resort villas
- suburban retail side walls where appropriate

### Recipes unlocked

- first suburban brick house
- future suburban residential street families
- brick-based townhouse and duplex variants

## 7. Module Specification - `MOD_ROOF_TILE_STANDARD_001`

### Asset identity

- asset ID: `MOD_ROOF_TILE_STANDARD_001`
- category: `ROOF`
- family: `ROOF_RESIDENTIAL_SUBURBAN`

### Purpose

- Australian suburban tiled roof identity

### Roof variants

- hip roof
- gable-tile hybrid
- garage-integrated roof
- wider double-front roof

### Tile styles

- terracotta tile
- red tile
- charcoal tile
- muted brown tile

### Pitch options

- low suburban pitch: `22-24 degrees`
- standard suburban pitch: `24-28 degrees`
- steeper family-home pitch: `28-30 degrees`

### Dimensions

- base coverage: `7.0m x 9.0m` scalable
- compatible with `10m-13m` wide house footprints via modular scaling

### Roof socket rules

- must align cleanly with rectangular and near-rectangular suburban plans
- garage roof edges must connect without breaking the main roof silhouette
- eaves should preserve readable domestic overhangs from the north-facing camera

### Sockets

- `SOCKET_ROOF_EAVE`
- `SOCKET_TOP_EDGE`
- `SOCKET_GARAGE_ROOF_EDGE`

### Materials

- `MAT_ROOF_TILE_RED_001`
- `MAT_ROOF_TILE_TERRACOTTA_001`
- `MAT_ROOF_DARK_CHARCOAL_001`

### Polygon targets

- `LOD_CLOSE`: `320-500`
- `LOD_GAMEPLAY`: `150-240`
- `LOD_MAP`: `36-64`

### LOD requirements

- `LOD_CLOSE`: roof breaks and tile direction remain readable
- `LOD_GAMEPLAY`: roof massing and pitch profile remain clear
- `LOD_MAP`: simplified capped suburban roof silhouette

### Reuse opportunities

- suburban homes
- townhouses
- villas

### Possible commercial or resort reuse

- resort villas
- motel roof variants
- small-town residential service buildings

### Recipes unlocked

- suburban family homes
- suburban duplexes
- tiled-roof villa variants

## 8. Module Specification - `MOD_GARAGE_RESIDENTIAL_STANDARD_001`

### Asset identity

- asset ID: `MOD_GARAGE_RESIDENTIAL_STANDARD_001`
- category: `EXTERIOR_FRONTAGE`
- family: `GARAGE_RESIDENTIAL_SUBURBAN`

### Purpose

- Australian suburban garage frontage

### Variants

- single garage
- double garage
- recessed garage
- garage with side access

### Roller door variants

- plain panel door
- segmented suburban roller door
- framed garage door

### Placement rules

- should sit on the road-facing edge of the lot
- should align directly with driveway logic
- should remain subordinate to the full house identity, not consume the entire frontage

### Driveway connection

- must connect directly to `MOD_DRIVEWAY_STANDARD_SINGLE_001`
- should support single-width and broader future suburban driveway variants

### Sockets

- `SOCKET_GARAGE_FRONT`
- `SOCKET_DRIVEWAY_ENTRY`
- `SOCKET_WALL_LEFT_EDGE`
- `SOCKET_WALL_RIGHT_EDGE`
- `SOCKET_ROOF_EAVE`

### Materials

- `MAT_GARAGE_PANEL_CREAM_001`
- `MAT_GARAGE_PANEL_WHITE_001`
- `MAT_GARAGE_PANEL_CHARCOAL_001`

### Polygon targets

- `LOD_CLOSE`: `240-360`
- `LOD_GAMEPLAY`: `110-180`
- `LOD_MAP`: `24-48`

### LOD requirements

- `LOD_CLOSE`: door-panel rhythm and garage opening remain readable
- `LOD_GAMEPLAY`: garage box silhouette and driveway relationship remain readable
- `LOD_MAP`: simplified front-access volume only

### Reuse opportunities

- houses
- townhouses
- workshops

### Possible commercial or resort reuse

- service sheds
- maintenance workshops
- villa carport adaptations

### Recipes unlocked

- suburban family-home façades
- townhouse garage-front variants
- duplex street-access variants

## 9. Module Specification - `MOD_WINDOW_RESIDENTIAL_STANDARD_001`

### Asset identity

- asset ID: `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
- category: `OPENING`
- family: `WINDOW_RESIDENTIAL_STANDARD`

### Purpose

- everyday suburban window identity

### Window variants

- single suburban window
- double suburban window
- tall narrow suburban window
- dark-frame suburban window

### Frame styles

- white frame
- dark frame
- timber-tone frame

### Sizes

- width: `1.2m-1.8m`
- height: `1.2m-1.6m`

### Placement rules

- supports bedroom, side-elevation, and garage-adjacent window use
- should align cleanly with brick wall modules
- should allow front-facing paired-window logic without duplicating large-window identity

### Sockets

- `SOCKET_WINDOW_STANDARD`
- `SOCKET_WALL_LEFT_EDGE`
- `SOCKET_WALL_RIGHT_EDGE`

### Materials

- `MAT_WINDOW_FRAME_WHITE_001`
- `MAT_WINDOW_FRAME_DARK_001`
- `MAT_GLASS_RESIDENTIAL_001`

### Polygon targets

- `LOD_CLOSE`: `140-220`
- `LOD_GAMEPLAY`: `70-120`
- `LOD_MAP`: `18-36`

### LOD requirements

- `LOD_CLOSE`: frame divisions and sill depth remain readable
- `LOD_GAMEPLAY`: opening silhouette and frame color remain clear
- `LOD_MAP`: simplified opening read only

### Reuse opportunities

- suburban houses
- apartments
- offices

### Possible commercial or resort reuse

- resort villas
- suburban office annexes
- low-rise apartment facades

### Recipes unlocked

- suburban brick houses
- apartments
- duplexes
- townhouse bedroom-window variants

## 10. Module Specification - `MOD_LETTERBOX_STANDARD_001`

### Asset identity

- asset ID: `MOD_LETTERBOX_STANDARD_001`
- category: `STREET_EDGE_PROP`
- family: `LETTERBOX_RESIDENTIAL_STANDARD`

### Purpose

- Australian residential street identity

### Letterbox variants

- brick pillar letterbox
- rendered suburban letterbox
- post-mounted letterbox
- low garden-edge letterbox

### Mounting rules

- should sit on the front boundary near the path or driveway edge
- must remain readable without crowding the entry path
- should support standalone and fence-adjacent placement

### Fence compatibility

- compatible with `MOD_FENCE_STANDARD_001`
- should allow gate-adjacent placement
- should not require full boundary fencing to function

### Sockets

- `SOCKET_FRONT_BOUNDARY`
- `SOCKET_PATH_EDGE`
- `SOCKET_VERGE_EDGE`
- `SOCKET_FENCE_CONNECTION`

### Materials

- `MAT_BRICK_RED_001`
- `MAT_RENDER_CREAM_001`
- `MAT_MAILBOX_DARK_001`

### Polygon targets

- `LOD_CLOSE`: `80-140`
- `LOD_GAMEPLAY`: `30-60`
- `LOD_MAP`: `6-16`

### LOD requirements

- `LOD_CLOSE`: mailbox slot and profile remain readable
- `LOD_GAMEPLAY`: residential street marker silhouette remains visible
- `LOD_MAP`: optional omission or minimal street-edge accent

### Reuse opportunities

- residential streets
- estates
- villas

### Possible commercial or resort reuse

- villa compounds
- serviced residential resorts

### Recipes unlocked

- suburban street-edge identity
- estate-house frontage packs
- duplex and townhouse boundary variants

## 11. Module Specification - `MOD_ENTRY_PATH_SUBURBAN_001`

### Asset identity

- asset ID: `MOD_ENTRY_PATH_SUBURBAN_001`
- category: `SITE_CONNECTION`
- family: `PATH_RESIDENTIAL_SUBURBAN`

### Purpose

- front entrance connection

### Path variants

- straight suburban entry path
- driveway-to-porch connector
- split path with lawn divider
- offset front-entry path

### Widths

- `1.0m`
- `1.2m`
- `1.4m`

### Materials

- `MAT_PATH_CONCRETE_LIGHT_001`
- `MAT_PATH_PAVER_SUBURBAN_001`

### Driveway relationship

- must work alongside `MOD_DRIVEWAY_STANDARD_SINGLE_001`
- should preserve a clear distinction between pedestrian path and vehicle access

### Sockets

- `SOCKET_PATH_ENTRY`
- `SOCKET_DRIVEWAY_EDGE`
- `SOCKET_PORCH_ENTRY`
- `SOCKET_FRONT_BOUNDARY`

### Polygon targets

- `LOD_CLOSE`: `90-150`
- `LOD_GAMEPLAY`: `36-72`
- `LOD_MAP`: `10-20`

### LOD requirements

- `LOD_CLOSE`: entry-path edge definition and junction behavior remain readable
- `LOD_GAMEPLAY`: path direction and entry connection remain clear
- `LOD_MAP`: simplified connector silhouette only

### Reuse opportunities

- suburban houses
- duplexes
- townhouses

### Possible commercial or resort reuse

- villa entry paths
- low-density residential resort paths

### Recipes unlocked

- suburban front-yard entry logic
- duplex and townhouse path systems
- broader planned suburban neighborhood kits

## 12. Validation Requirements

Before production approval, each module should validate:

- naming compliance
- socket compatibility
- compatible recipe list
- style consistency with the residential family
- shared material compliance
- polygon target readiness
- LOD readiness
- export readiness

### Batch-level validation

The suburban identity module batch should also validate:

- no duplicate coastal modules are recreated where shared site modules already solve the need
- each suburban-specific module adds real identity separation from the coastal family
- the suburban path remains compatible with the validated residential site and landscape kit
- future reuse across residential and civic recipes is documented

## 13. Reuse Impact

### Primary recipes unlocked

- `RECIPE_HOUSE_SUBURBAN_BRICK_001`
- future suburban duplex recipes
- future townhouse recipes
- future low-rise apartment frontage recipes

### Broader residential reuse impact

This batch also supports future:

- suburban street families
- villa clusters
- estate-house variants
- mixed residential neighborhood recipes

### Possible commercial or resort crossover

Where appropriate, parts of this batch may also support:

- resort villas
- low-rise serviced apartments
- small office annexes
- workshop or service-garage side buildings

## 14. Production Priority

Recommended order:

1. `MOD_WALL_BRICK_SUBURBAN_001`
2. `MOD_ROOF_TILE_STANDARD_001`
3. `MOD_GARAGE_RESIDENTIAL_STANDARD_001`
4. `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
5. `MOD_ENTRY_PATH_SUBURBAN_001`
6. `MOD_LETTERBOX_STANDARD_001`

### Priority rationale

#### 1. Brick wall

- strongest suburban identity separator from coastal houses
- highest broader reuse across residential and civic recipes

#### 2. Tiled roof

- creates the clearest suburban silhouette shift
- high value across future suburban and villa families

#### 3. Garage

- gives the house its strongest road-facing suburban cue
- essential for driveway-front residential layouts

#### 4. Standard residential window

- fills out the everyday suburban façade system
- broad reuse across multiple future residential categories

#### 5. Entry path

- improves lot readability and suburban frontage organization

#### 6. Letterbox

- strong local suburban flavor, but not a core structural blocker

## 15. Readiness for Blender Production

This module foundation is ready for the next controlled planning or production step with these constraints:

- reuse the validated shared site, fence, driveway, and landscape kit first
- add suburban-specific modules only where they create real and reusable identity value
- keep the set mobile-safe and LOD-first
- avoid decorative one-off additions until the core suburban shell is proven

### Current readiness status

- module specifications: `READY`
- reuse impact analysis: `READY`
- production priority: `READY`
- validation requirements: `READY`
- Blender production readiness: `READY FOR SUBURBAN IDENTITY MODULE FOUNDATION`
