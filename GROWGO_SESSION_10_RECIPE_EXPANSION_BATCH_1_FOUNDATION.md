# GrowGo Session 10 - Recipe Expansion Batch 1 Foundation

## Session Scope

This document expands the first production recipe library across multiple asset families to validate modular reuse before Blender production begins.

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

1. residential recipes
2. commercial recipes
3. civic recipes
4. accommodation recipes
5. landmark recipes
6. module reuse analysis
7. the recommended first production module set

Related follow-on planning document:

- `GROWGO_SESSION_11_FIRST_BLENDER_PRODUCTION_EXECUTION_PLAN_FOUNDATION.md`

## 1. Source of Truth

This Session 10 planning document is governed by:

- `GROWGO_SESSION_4_FIRST_RECIPE_PRODUCTION_PLANNING_FOUNDATION.md`
- `GROWGO_SESSION_6_FIRST_RECIPE_EXPANSION_PLANNING_FOUNDATION.md`
- `GROWGO_SESSION_7_LAYER_A_UNIVERSAL_MODULE_PRODUCTION_PLANNING_FOUNDATION.md`
- `GROWGO_SESSION_7_5_CORE_LAYER_A_MODULE_SPECIFICATION_FOUNDATION.md`
- `GROWGO_SESSION_8_FIRST_BLENDER_PRODUCTION_BATCH_SPECIFICATION_FOUNDATION.md`
- `GROWGO_SESSION_9_BLENDER_ASSET_FACTORY_IMPLEMENTATION_PLAN_FOUNDATION.md`

If a future planning document conflicts with these documents, those source documents remain authoritative unless explicitly updated.

## 2. Batch 1 Expanded Recipe Library Purpose

The Batch 1 expanded recipe library is intended to prove that the same Layer A modular system can support multiple families before Blender production begins.

The library must demonstrate:

- residential reuse
- commercial frontage reuse
- civic identity reuse
- accommodation repetition logic
- landmark exception handling within the same factory rules

This batch is still planning-only.

Its purpose is to show where reuse is strong, where identity modules are justified, and which modules should be built first to unlock the broadest future asset coverage.

## 3. Expanded Recipe Library

For each recipe below, the following planning fields are defined:

- `recipeID`
- `buildingID`
- `family`
- `purpose`
- `footprint`
- `requiredModules`
- `optionalModules`
- `identityModules`
- `reusedModules`
- `newModulesRequired`
- `reusePercentage`
- `futureVariants`

## 4. Recipe Group 1 - Residential

### 4.1 `RECIPE_HOUSE_COASTAL_COTTAGE_001`

- recipeID: `RECIPE_HOUSE_COASTAL_COTTAGE_001`
- buildingID: `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- family: `FAMILY_HOUSE_COASTAL`
- purpose: first proof residential asset and core coastal modular benchmark
- footprint:
  - width: `8m-10m`
  - depth: `10m-12m`
  - lot type: compact coastal residential lot
- requiredModules:
  - `MOD_FOUNDATION_STANDARD_RECT_001`
  - `MOD_WALL_WEATHERBOARD_WHITE_001`
  - `MOD_WALL_CORNER_STANDARD_001`
  - `MOD_WALL_EXTENSION_SINGLE_BAY_001`
  - `MOD_ROOF_GABLE_STANDARD_001`
  - `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
  - `MOD_DOOR_STANDARD_RESIDENTIAL_001`
  - `MOD_DOOR_SERVICE_RESIDENTIAL_001`
  - `MOD_VERANDAH_STANDARD_TIMBER_001`
  - `MOD_PORCH_COASTAL_SMALL_001`
  - `MOD_PATH_STANDARD_001`
  - `MOD_DRIVEWAY_STANDARD_SINGLE_001`
  - `MOD_FENCE_STANDARD_001`
  - `MOD_GROUND_GRASS_STANDARD_001`
  - `MOD_BUSH_NATIVE_STANDARD_001`
  - `MOD_TREE_EUCALYPTUS_STANDARD_001`
  - `MOD_FLOWERBED_STANDARD_001`
- optionalModules:
  - `MOD_CHIMNEY_COASTAL_SMALL_001`
  - `MOD_TRIM_STANDARD_COASTAL_001`
  - alternate verandah configuration
  - alternate garden composition
- identityModules:
  - `MOD_CHIMNEY_COASTAL_SMALL_001`
- reusedModules:
  - core residential shell
  - core site kit
  - core coastal landscape kit
- newModulesRequired:
  - `MOD_WALL_CORNER_STANDARD_001`
  - `MOD_WALL_EXTENSION_SINGLE_BAY_001`
  - `MOD_VERANDAH_STANDARD_TIMBER_001`
  - `MOD_PORCH_COASTAL_SMALL_001`
  - `MOD_DRIVEWAY_STANDARD_SINGLE_001`
  - `MOD_CHIMNEY_COASTAL_SMALL_001`
- reusePercentage: `82%`
- futureVariants:
  - classic weatherboard cottage
  - painted beach cottage
  - holiday rental cottage
  - small raised coastal cottage

### 4.2 `RECIPE_HOUSE_SUBURBAN_BRICK_001`

- recipeID: `RECIPE_HOUSE_SUBURBAN_BRICK_001`
- buildingID: `BUILDING_HOUSE_SUBURBAN_BRICK_001`
- family: `FAMILY_HOUSE_SUBURBAN`
- purpose: Australian suburban family home recipe that proves wall, roof, and yard variation on the house system
- footprint:
  - width: `10m-13m`
  - depth: `12m-15m`
  - lot type: standard suburban residential lot
- requiredModules:
  - `MOD_FOUNDATION_STANDARD_RECT_001`
  - `MOD_WALL_BRICK_RED_001`
  - `MOD_WALL_CORNER_STANDARD_001`
  - `MOD_WALL_EXTENSION_SINGLE_BAY_001`
  - `MOD_ROOF_HIP_STANDARD_001`
  - `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
  - `MOD_WINDOW_RESIDENTIAL_LARGE_001`
  - `MOD_DOOR_STANDARD_RESIDENTIAL_001`
  - `MOD_PATH_STANDARD_001`
  - `MOD_DRIVEWAY_STANDARD_SINGLE_001`
  - `MOD_FENCE_STANDARD_001`
  - `MOD_GROUND_GRASS_STANDARD_001`
  - `MOD_HEDGE_STANDARD_001`
  - `MOD_BUSH_NATIVE_STANDARD_001`
  - `MOD_FLOWERBED_STANDARD_001`
- optionalModules:
  - garage or carport frontage
  - porch variant
  - bay window upgrade
  - second tree placement
- identityModules:
  - suburban garage or carport module
- reusedModules:
  - foundation
  - openings
  - site modules
  - shared landscape modules
- newModulesRequired:
  - `MOD_WALL_BRICK_RED_001`
  - `MOD_ROOF_HIP_STANDARD_001`
  - suburban garage or carport module
  - suburban roof colour variation
- reusePercentage: `78%`
- futureVariants:
  - brick veneer suburban house
  - corner-lot suburban house
  - double-front suburban family home
  - attached townhouse adaptation

### 4.3 `RECIPE_HOUSE_BEACH_BUNGALOW_001`

- recipeID: `RECIPE_HOUSE_BEACH_BUNGALOW_001`
- buildingID: `BUILDING_HOUSE_BEACH_BUNGALOW_001`
- family: `FAMILY_HOUSE_COASTAL`
- purpose: coastal holiday home that proves raised foundations, deck logic, and stronger open-front outdoor living
- footprint:
  - width: `8m-11m`
  - depth: `10m-13m`
  - lot type: beachside or foreshore-adjacent lot
- requiredModules:
  - raised foundation module
  - `MOD_WALL_WEATHERBOARD_WHITE_001`
  - `MOD_WALL_CORNER_STANDARD_001`
  - `MOD_ROOF_GABLE_STANDARD_001`
  - `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
  - `MOD_WINDOW_RESIDENTIAL_LARGE_001`
  - `MOD_DOOR_STANDARD_RESIDENTIAL_001`
  - `MOD_VERANDAH_STANDARD_TIMBER_001`
  - deck module
  - `MOD_PATH_STANDARD_001`
  - `MOD_FENCE_STANDARD_001`
  - `MOD_GROUND_GRASS_STANDARD_001`
  - `MOD_BUSH_NATIVE_STANDARD_001`
  - `MOD_TREE_EUCALYPTUS_STANDARD_001`
- optionalModules:
  - chimney
  - louvre window variant
  - side stair access
  - coastal screening
- identityModules:
  - raised foundation module
  - deck module
- reusedModules:
  - coastal wall system
  - core openings
  - verandah
  - path and landscape kit
- newModulesRequired:
  - raised foundation module
  - deck module
  - optional stair access module
- reusePercentage: `74%`
- futureVariants:
  - surf bungalow
  - elevated boardwalk bungalow
  - compact beach rental
  - modern beach cabin

### 4.4 `RECIPE_HOUSE_RURAL_COTTAGE_001`

- recipeID: `RECIPE_HOUSE_RURAL_COTTAGE_001`
- buildingID: `BUILDING_HOUSE_RURAL_COTTAGE_001`
- family: `FAMILY_HOUSE_RURAL`
- purpose: farm and country dwelling recipe with simpler structure and broader yard conditions
- footprint:
  - width: `8m-10m`
  - depth: `10m-12m`
  - lot type: large rural property
- requiredModules:
  - `MOD_FOUNDATION_STANDARD_RECT_001`
  - `MOD_WALL_WEATHERBOARD_WHITE_001`
  - `MOD_WALL_CORNER_STANDARD_001`
  - `MOD_ROOF_GABLE_STANDARD_001`
  - `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
  - `MOD_DOOR_STANDARD_RESIDENTIAL_001`
  - `MOD_PATH_STANDARD_001`
  - rural fence variation
  - `MOD_GROUND_GRASS_STANDARD_001`
  - `MOD_BUSH_NATIVE_STANDARD_001`
  - `MOD_TREE_EUCALYPTUS_STANDARD_001`
- optionalModules:
  - service porch
  - shed connector
  - water tank placeholder
  - gravel driveway variation
- identityModules:
  - rural fence variation
  - shed compatibility anchor
- reusedModules:
  - foundation
  - walls
  - gable roof
  - openings
  - landscape core
- newModulesRequired:
  - rural fence variation
  - gravel driveway variant
  - shed compatibility anchor
- reusePercentage: `76%`
- futureVariants:
  - weatherboard farm cottage
  - small homestead cottage
  - paddock-edge worker cottage
  - rural outpost residence

## 5. Recipe Group 2 - Commercial

### 5.1 `RECIPE_BAKERY_COASTAL_001`

- recipeID: `RECIPE_BAKERY_COASTAL_001`
- buildingID: `BUILDING_BAKERY_COASTAL_001`
- family: `FAMILY_COMMERCIAL_BAKERY`
- purpose: compact bakery recipe that proves storefront reuse, signage, and awning-led street identity
- footprint:
  - width: `6m-8m`
  - depth: `9m-12m`
  - lot type: small coastal main street lot
- requiredModules:
  - `MOD_FOUNDATION_STANDARD_RECT_001`
  - `MOD_WALL_STORE_FRONT_001`
  - `MOD_WALL_RENDER_CREAM_001`
  - `MOD_WALL_CORNER_STANDARD_001`
  - `MOD_ROOF_FLAT_COMMERCIAL_001`
  - `MOD_ROOF_PARAPET_COMMERCIAL_001`
  - `MOD_WINDOW_STOREFRONT_GLAZING_001`
  - `MOD_DOOR_GLASS_ENTRY_001`
  - awning module
  - `MOD_SIGN_MOUNT_STANDARD_001`
  - `MOD_PATH_STANDARD_001`
  - pavement module
  - `MOD_FLOWERBED_STANDARD_001`
- optionalModules:
  - side service door
  - outdoor display crate zone
  - rear yard service enclosure
- identityModules:
  - bakery sign face
  - bakery awning treatment
- reusedModules:
  - foundation
  - corner logic
  - storefront glazing
  - sign mount
  - path
- newModulesRequired:
  - awning module
  - pavement module
  - bakery sign face
- reusePercentage: `68%`
- futureVariants:
  - beach bakery
  - town bakery
  - attached bakery row shop
  - corner bakery

### 5.2 `RECIPE_CAFE_SMALL_TOWN_001`

- recipeID: `RECIPE_CAFE_SMALL_TOWN_001`
- buildingID: `BUILDING_CAFE_SMALL_TOWN_001`
- family: `FAMILY_COMMERCIAL_CAFE`
- purpose: hospitality recipe proving storefront reuse plus outdoor seating and footpath activation
- footprint:
  - width: `6m-9m`
  - depth: `8m-11m`
  - lot type: small-town main street frontage
- requiredModules:
  - `MOD_FOUNDATION_STANDARD_RECT_001`
  - `MOD_WALL_STORE_FRONT_001`
  - `MOD_WALL_RENDER_CREAM_001`
  - `MOD_WALL_CORNER_STANDARD_001`
  - `MOD_ROOF_FLAT_COMMERCIAL_001`
  - `MOD_WINDOW_STOREFRONT_GLAZING_001`
  - `MOD_DOOR_GLASS_ENTRY_001`
  - awning module
  - outdoor seating module
  - `MOD_SIGN_MOUNT_STANDARD_001`
  - `MOD_PATH_STANDARD_001`
  - pavement module
  - `MOD_FLOWERBED_STANDARD_001`
- optionalModules:
  - verandah edge treatment
  - planter boxes
  - rear service door
- identityModules:
  - outdoor seating module
  - cafe sign face
- reusedModules:
  - storefront shell
  - glazing
  - commercial roof
  - sign mount
  - path and pavement edge
- newModulesRequired:
  - outdoor seating module
  - cafe sign face
  - pavement module
- reusePercentage: `70%`
- futureVariants:
  - small coastal cafe
  - small-town corner cafe
  - espresso bar
  - dining terrace cafe

### 5.3 `RECIPE_SHOP_MAIN_STREET_001`

- recipeID: `RECIPE_SHOP_MAIN_STREET_001`
- buildingID: `BUILDING_SHOP_MAIN_STREET_001`
- family: `FAMILY_COMMERCIAL_SHOP`
- purpose: generic attached shopfront recipe for repeatable high-reuse retail streets
- footprint:
  - width: `5m-7m`
  - depth: `8m-10m`
  - lot type: attached main street frontage
- requiredModules:
  - `MOD_FOUNDATION_STANDARD_RECT_001`
  - `MOD_WALL_STORE_FRONT_001`
  - `MOD_WALL_RENDER_CREAM_001`
  - `MOD_WALL_CORNER_STANDARD_001`
  - `MOD_ROOF_PARAPET_COMMERCIAL_001`
  - `MOD_WINDOW_STOREFRONT_GLAZING_001`
  - `MOD_DOOR_GLASS_ENTRY_001`
  - awning module
  - `MOD_SIGN_MOUNT_STANDARD_001`
  - pavement module
- optionalModules:
  - rear service door
  - side access lane
  - display plinth
- identityModules:
  - none required beyond branded sign face
- reusedModules:
  - full commercial frontage shell
  - sign mount
  - glazing
  - parapet roof
- newModulesRequired:
  - retail sign face set
  - attached sidewall alignment variant
- reusePercentage: `77%`
- futureVariants:
  - retail boutique
  - general store
  - bank frontage
  - post office frontage

## 6. Recipe Group 3 - Civic

### 6.1 `RECIPE_SCHOOL_SMALL_TOWN_001`

- recipeID: `RECIPE_SCHOOL_SMALL_TOWN_001`
- buildingID: `BUILDING_SCHOOL_SMALL_TOWN_001`
- family: `FAMILY_CIVIC_SCHOOL`
- purpose: civic recipe proving repeated classroom modules, larger site logic, and controlled institutional identity
- footprint:
  - width: `16m-28m`
  - depth: `14m-24m`
  - lot type: small-town civic campus lot
- requiredModules:
  - `MOD_FOUNDATION_STANDARD_RECT_001`
  - medium civic foundation extension
  - `MOD_WALL_BRICK_RED_001`
  - `MOD_WALL_CORNER_STANDARD_001`
  - `MOD_WALL_EXTENSION_SINGLE_BAY_001`
  - classroom bay module
  - `MOD_ROOF_HIP_STANDARD_001`
  - `MOD_WINDOW_CIVIC_STANDARD_001`
  - `MOD_DOOR_STANDARD_RESIDENTIAL_001`
  - civic entrance module
  - `MOD_PATH_STANDARD_001`
  - `MOD_FENCE_STANDARD_001`
  - `MOD_GROUND_GRASS_STANDARD_001`
  - `MOD_BUSH_NATIVE_STANDARD_001`
  - `MOD_TREE_EUCALYPTUS_STANDARD_001`
- optionalModules:
  - covered walkway
  - assembly wing extension
  - play area marker set
- identityModules:
  - civic entrance module
  - classroom bay module
- reusedModules:
  - brick walls
  - corner and extension modules
  - civic windows
  - path and fence
  - landscape modules
- newModulesRequired:
  - medium civic foundation extension
  - classroom bay module
  - civic entrance module
- reusePercentage: `66%`
- futureVariants:
  - primary school
  - country school
  - suburban school
  - high school wing system

### 6.2 `RECIPE_FIRE_STATION_SMALL_001`

- recipeID: `RECIPE_FIRE_STATION_SMALL_001`
- buildingID: `BUILDING_FIRE_STATION_SMALL_001`
- family: `FAMILY_CIVIC_FIRE`
- purpose: service-civic recipe proving vehicle bay identity within a shared modular shell
- footprint:
  - width: `12m-18m`
  - depth: `12m-16m`
  - lot type: suburban or town service lot
- requiredModules:
  - `MOD_FOUNDATION_STANDARD_RECT_001`
  - service foundation extension
  - `MOD_WALL_BRICK_RED_001`
  - `MOD_WALL_RENDER_CREAM_001`
  - `MOD_WALL_CORNER_STANDARD_001`
  - `MOD_ROOF_FLAT_COMMERCIAL_001`
  - `MOD_WINDOW_CIVIC_STANDARD_001`
  - `MOD_DOOR_STANDARD_RESIDENTIAL_001`
  - `MOD_DOOR_ROLLER_001`
  - emergency signage module
  - parking pad module
  - `MOD_PATH_STANDARD_001`
  - `MOD_FENCE_STANDARD_001`
- optionalModules:
  - equipment yard
  - training side bay
  - service awning
- identityModules:
  - emergency signage module
  - vehicle bay frontage
- reusedModules:
  - brick/render wall system
  - corner logic
  - flat roof
  - civic openings
  - path and fence
- newModulesRequired:
  - service foundation extension
  - emergency signage module
  - parking pad module
  - vehicle bay frontage variant
- reusePercentage: `61%`
- futureVariants:
  - volunteer fire station
  - suburban fire station
  - dual-bay fire station
  - emergency services depot

### 6.3 `RECIPE_POLICE_STATION_SUBURBAN_001`

- recipeID: `RECIPE_POLICE_STATION_SUBURBAN_001`
- buildingID: `BUILDING_POLICE_STATION_SUBURBAN_001`
- family: `FAMILY_CIVIC_POLICE`
- purpose: civic-service recipe proving secure entry identity on top of a shared institutional shell
- footprint:
  - width: `12m-18m`
  - depth: `12m-18m`
  - lot type: suburban service lot
- requiredModules:
  - `MOD_FOUNDATION_STANDARD_RECT_001`
  - service foundation extension
  - `MOD_WALL_BRICK_RED_001`
  - `MOD_WALL_RENDER_CREAM_001`
  - `MOD_WALL_CORNER_STANDARD_001`
  - `MOD_ROOF_FLAT_COMMERCIAL_001`
  - `MOD_WINDOW_CIVIC_STANDARD_001`
  - secure entrance module
  - `MOD_DOOR_SERVICE_RESIDENTIAL_001`
  - `MOD_SIGN_MOUNT_STANDARD_001`
  - parking pad module
  - `MOD_PATH_STANDARD_001`
  - `MOD_FENCE_STANDARD_001`
  - `MOD_GROUND_GRASS_STANDARD_001`
- optionalModules:
  - rear secure yard
  - covered entry
  - staff parking extension
- identityModules:
  - secure entrance module
  - police sign face
- reusedModules:
  - civic wall shell
  - flat roof
  - civic windows
  - path/fence/ground cover
- newModulesRequired:
  - secure entrance module
  - police sign face
  - parking pad module
- reusePercentage: `64%`
- futureVariants:
  - suburban police station
  - town police outpost
  - civic services office
  - justice support building

## 7. Recipe Group 4 - Accommodation

### 7.1 `RECIPE_MOTEL_SMALL_COASTAL_001`

- recipeID: `RECIPE_MOTEL_SMALL_COASTAL_001`
- buildingID: `BUILDING_MOTEL_SMALL_COASTAL_001`
- family: `FAMILY_ACCOMMODATION_MOTEL`
- purpose: accommodation recipe proving repeated room modules, walkway logic, and parking-led frontage planning
- footprint:
  - width: `18m-30m`
  - depth: `12m-18m`
  - lot type: linear roadside accommodation lot
- requiredModules:
  - `MOD_FOUNDATION_STANDARD_RECT_001`
  - motel room bay module
  - `MOD_WALL_WEATHERBOARD_WHITE_001`
  - `MOD_WALL_CORNER_STANDARD_001`
  - `MOD_WALL_EXTENSION_SINGLE_BAY_001`
  - `MOD_ROOF_GABLE_STANDARD_001`
  - `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
  - `MOD_DOOR_STANDARD_RESIDENTIAL_001`
  - walkway module
  - motel sign module
  - parking pad module
  - `MOD_PATH_STANDARD_001`
  - `MOD_GROUND_GRASS_STANDARD_001`
  - `MOD_BUSH_NATIVE_STANDARD_001`
  - `MOD_TREE_EUCALYPTUS_STANDARD_001`
- optionalModules:
  - reception office module
  - verandah screening
  - pool placeholder zone
- identityModules:
  - motel room bay module
  - walkway module
  - motel sign module
- reusedModules:
  - residential wall and roof system
  - openings
  - path
  - landscape modules
- newModulesRequired:
  - motel room bay module
  - walkway module
  - motel sign module
  - parking pad module
- reusePercentage: `69%`
- futureVariants:
  - roadside coastal motel
  - garden court motel
  - retro motor inn
  - two-storey motel expansion

## 8. Recipe Group 5 - Landmark

### 8.1 `RECIPE_LIGHTHOUSE_ISLAND_001`

- recipeID: `RECIPE_LIGHTHOUSE_ISLAND_001`
- buildingID: `BUILDING_LIGHTHOUSE_ISLAND_001`
- family: `FAMILY_LANDMARK_LIGHTHOUSE`
- purpose: landmark recipe proving controlled identity-module assembly within the same modular production system
- footprint:
  - width: `12m-20m`
  - depth: `12m-20m`
  - lot type: isolated landmark site
- requiredModules:
  - landmark foundation base
  - lighthouse tower shell module
  - lantern room module
  - roof cap module
  - rock base module
  - `MOD_PATH_STANDARD_001`
  - `MOD_FENCE_STANDARD_001`
  - `MOD_GROUND_GRASS_STANDARD_001`
  - `MOD_BUSH_NATIVE_STANDARD_001`
  - `MOD_TREE_EUCALYPTUS_STANDARD_001`
- optionalModules:
  - light beam placeholder
  - cliff edge treatment
  - sign marker
- identityModules:
  - lighthouse tower shell module
  - lantern room module
  - roof cap module
  - rock base module
- reusedModules:
  - path
  - fence
  - ground cover
  - bush
  - tree
- newModulesRequired:
  - landmark foundation base
  - lighthouse tower shell module
  - lantern room module
  - roof cap module
  - rock base module
- reusePercentage: `42%`
- futureVariants:
  - classic island lighthouse
  - harbour lighthouse
  - coastal beacon variant
  - storm-watch lighthouse

## 9. Module Reuse Analysis

After defining the expanded library, the following modules emerge as the most important shared production targets.

### 9.1 Highest recipe-count reuse

#### `MOD_PATH_STANDARD_001`

Used by:

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`
- `RECIPE_HOUSE_SUBURBAN_BRICK_001`
- `RECIPE_HOUSE_BEACH_BUNGALOW_001`
- `RECIPE_HOUSE_RURAL_COTTAGE_001`
- `RECIPE_BAKERY_COASTAL_001`
- `RECIPE_CAFE_SMALL_TOWN_001`
- `RECIPE_FIRE_STATION_SMALL_001`
- `RECIPE_POLICE_STATION_SUBURBAN_001`
- `RECIPE_MOTEL_SMALL_COASTAL_001`
- `RECIPE_LIGHTHOUSE_ISLAND_001`

#### `MOD_FOUNDATION_STANDARD_RECT_001`

Used by:

- all house recipes
- bakery
- cafe
- shop
- school
- fire station
- police station
- motel

#### `MOD_FENCE_STANDARD_001`

Used by:

- coastal house
- suburban house
- beach bungalow
- school
- fire station
- police station
- lighthouse

#### `MOD_GROUND_GRASS_STANDARD_001`

Used by:

- all residential recipes
- police station
- motel
- lighthouse

#### `MOD_WINDOW_RESIDENTIAL_STANDARD_001`

Used by:

- coastal cottage
- suburban brick house
- beach bungalow
- rural cottage
- motel

### 9.2 Module ranking

Rank modules by:

1. number of recipes using them
2. production importance
3. visual importance

#### Rank 1 - universal production unlockers

- `MOD_PATH_STANDARD_001`
- `MOD_FOUNDATION_STANDARD_RECT_001`
- `MOD_WALL_CORNER_STANDARD_001`
- `MOD_WALL_EXTENSION_SINGLE_BAY_001`
- `MOD_FENCE_STANDARD_001`

#### Rank 2 - core house and accommodation unlockers

- `MOD_WALL_WEATHERBOARD_WHITE_001`
- `MOD_ROOF_GABLE_STANDARD_001`
- `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
- `MOD_DOOR_STANDARD_RESIDENTIAL_001`
- `MOD_GROUND_GRASS_STANDARD_001`
- `MOD_BUSH_NATIVE_STANDARD_001`
- `MOD_TREE_EUCALYPTUS_STANDARD_001`

#### Rank 3 - commercial and civic unlockers

- `MOD_WALL_BRICK_RED_001`
- `MOD_WALL_RENDER_CREAM_001`
- `MOD_WALL_STORE_FRONT_001`
- `MOD_ROOF_FLAT_COMMERCIAL_001`
- `MOD_ROOF_PARAPET_COMMERCIAL_001`
- `MOD_WINDOW_STOREFRONT_GLAZING_001`
- `MOD_WINDOW_CIVIC_STANDARD_001`
- `MOD_DOOR_GLASS_ENTRY_001`
- `MOD_SIGN_MOUNT_STANDARD_001`

#### Rank 4 - identity and recipe-special modules

- `MOD_VERANDAH_STANDARD_TIMBER_001`
- `MOD_PORCH_COASTAL_SMALL_001`
- `MOD_DRIVEWAY_STANDARD_SINGLE_001`
- `MOD_HEDGE_STANDARD_001`
- awning module
- pavement module
- outdoor seating module
- classroom bay module
- secure entrance module
- motel room bay module
- lighthouse tower shell module

## 10. Variant Roadmap

### 10.1 House variants

- coastal
- suburban
- rural
- modern

### 10.2 Commercial variants

- bakery
- cafe
- restaurant
- retail

### 10.3 Civic variants

- primary school
- high school
- university
- civic service branches

### 10.4 Accommodation variants

- motel
- hotel
- resort

### 10.5 Landmark variants

- lighthouse
- beacon
- harbour tower
- civic monument

## 11. Recommended First Production Modules

Based on cross-family reuse, production importance, and visual impact, the recommended first production modules are:

1. `MOD_FOUNDATION_STANDARD_RECT_001`
2. `MOD_PATH_STANDARD_001`
3. `MOD_WALL_CORNER_STANDARD_001`
4. `MOD_WALL_EXTENSION_SINGLE_BAY_001`
5. `MOD_WALL_WEATHERBOARD_WHITE_001`
6. `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
7. `MOD_DOOR_STANDARD_RESIDENTIAL_001`
8. `MOD_FENCE_STANDARD_001`
9. `MOD_GROUND_GRASS_STANDARD_001`
10. `MOD_BUSH_NATIVE_STANDARD_001`
11. `MOD_TREE_EUCALYPTUS_STANDARD_001`
12. `MOD_ROOF_GABLE_STANDARD_001`

Follow immediately with:

- `MOD_WALL_BRICK_RED_001`
- `MOD_WALL_RENDER_CREAM_001`
- `MOD_WALL_STORE_FRONT_001`
- `MOD_ROOF_FLAT_COMMERCIAL_001`
- `MOD_WINDOW_STOREFRONT_GLAZING_001`
- `MOD_SIGN_MOUNT_STANDARD_001`

## 12. Recipe Expansion Summary

The Batch 1 expanded recipe library now covers:

- 4 residential recipes
- 3 commercial recipes
- 3 civic recipes
- 1 accommodation recipe
- 1 landmark recipe

This is enough planning coverage to validate:

- reusable house infrastructure
- shared commercial frontage systems
- shared civic shell logic
- repeated accommodation bays
- landmark exception handling

## 13. Production Readiness Status

This recipe library is ready as a planning and pre-production dependency layer.

Ready:

- expanded recipe identities
- reused vs new module mapping
- family coverage
- reuse ranking
- first production module recommendation

Still intentionally deferred:

- Blender production
- module modeling
- scripting
- validation code
- exports

## 14. Session Outcome

Session 10 establishes the first expanded multi-family recipe library for GrowGo before Blender production begins.

It shows where reuse is already strong, where new identity modules are justified, and which module families should be built first to unlock the broadest future asset coverage.

No Blender production is started in this session.
