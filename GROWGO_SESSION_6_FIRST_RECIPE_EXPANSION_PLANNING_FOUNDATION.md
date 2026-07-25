# GrowGo Session 6 - First Recipe Expansion Planning Foundation

## Session Scope

This document defines the first starter set of GrowGo production recipes that will validate the future Modular Asset Factory across multiple asset categories.

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

1. the starter recipe set
2. recipe dependency comparison
3. shared module opportunities
4. new module requirements
5. recommended production order
6. factory validation coverage

## 1. Source of Truth

This Session 6 planning document is governed by:

- `GROWGO_MODULAR_BIBLE_DESIGN_FOUNDATION.md`
- `GROWGO_SESSION_2_MODULAR_LIBRARY_AND_RECIPE_PLANNING.md`
- `GROWGO_SESSION_2_5_NAMING_METADATA_AND_BLENDER_HANDOFF_FOUNDATION.md`
- `GROWGO_SESSION_3_FIRST_PRODUCTION_BATCH_PLANNING_FOUNDATION.md`
- `GROWGO_SESSION_3_5_ASSET_FACTORY_PRODUCTION_RULES_FOUNDATION.md`
- `GROWGO_SESSION_4_FIRST_RECIPE_PRODUCTION_PLANNING_FOUNDATION.md`
- `GROWGO_SESSION_5_BLENDER_ASSET_FACTORY_ARCHITECTURE_FOUNDATION.md`

If a future planning document conflicts with these documents, those source documents remain authoritative unless explicitly updated.

## 2. Starter Recipe Set Overview

The starter recipe set is intended to validate the future Modular Asset Factory across:

- residential
- commercial
- civic
- service
- industrial
- accommodation
- landmark

The recommended starter recipe set contains ten recipes.

## 3. Starter Recipe Definitions

### 3.1 Residential

#### `RECIPE_HOUSE_COASTAL_COTTAGE_001`

- asset ID: `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- family: `FAMILY_HOUSE_COASTAL`
- footprint: small residential cottage
- required modules:
  - foundation
  - wall modules
  - corner walls
  - gable roof
  - residential windows
  - residential doors
  - verandah
  - driveway
  - path
  - fence
  - grass
  - bush
  - tree
- optional modules:
  - porch variation
  - alternate chimney
  - alternate garden composition
- identity modules:
  - none required at proof-recipe level
- existing reusable modules:
  - core house shell
  - core site kit
  - core landscape kit
- new modules required:
  - small coastal chimney
- future reuse opportunities:
  - other houses
  - motels
  - selected civic annexes
- estimated reuse percentage: `88%`

Purpose:

- proof residential asset

#### `RECIPE_HOUSE_SUBURBAN_BRICK_001`

- asset ID: `BUILDING_HOUSE_SUBURBAN_BRICK_001`
- family: `FAMILY_HOUSE_SUBURBAN`
- footprint: small to medium suburban house
- required modules:
  - standard foundation
  - brick wall variant
  - hip or gable roof
  - residential windows
  - residential doors
  - driveway
  - fence
  - grass
  - hedge
- optional modules:
  - porch variation
  - garage-side variation
  - alternate garden layout
- identity modules:
  - none required
- existing reusable modules:
  - foundation
  - openings
  - site modules
  - landscape modules
- new modules required:
  - suburban brick wall variation
  - suburban roof colour variation
- future reuse opportunities:
  - townhouse families
  - small civic houses
  - suburban motels
- estimated reuse percentage: `82%`

Purpose:

- tests variation using shared house modules

### 3.2 Commercial

#### `RECIPE_BAKERY_COASTAL_001`

- asset ID: `BUILDING_BAKERY_COASTAL_001`
- family: `FAMILY_COMMERCIAL_SHOP`
- footprint: small commercial frontage
- required modules:
  - commercial wall shell
  - flat or low roof
  - display windows
  - commercial door
  - awning
  - signage
  - path or pavement
  - planters
- optional modules:
  - side service door
  - hanging sign variation
  - outdoor display prop
- identity modules:
  - bakery sign module
- existing reusable modules:
  - commercial shell
  - display openings
  - awning
  - path
  - planter modules
- new modules required:
  - bakery identity sign
  - bakery display trim variation
- future reuse opportunities:
  - cafes
  - retail shops
  - sandwich shop
- estimated reuse percentage: `80%`

Purpose:

- tests commercial reuse

#### `RECIPE_CAFE_SMALL_TOWN_001`

- asset ID: `BUILDING_CAFE_SMALL_TOWN_001`
- family: `FAMILY_COMMERCIAL_HOSPITALITY`
- footprint: small hospitality frontage
- required modules:
  - commercial wall shell
  - storefront glazing
  - commercial door
  - awning
  - outdoor seating
  - signage
  - pavement
  - planters
- optional modules:
  - shade umbrella set
  - alternate seating arrangement
  - side wall sign
- identity modules:
  - cafe sign module
  - seating cluster identity set
- existing reusable modules:
  - storefront shell
  - awning
  - pavement
  - planters
- new modules required:
  - outdoor seating set
  - cafe sign set
- future reuse opportunities:
  - restaurants
  - bakeries
  - boutique hotel cafes
- estimated reuse percentage: `76%`

Purpose:

- tests hospitality assets

### 3.3 Civic

#### `RECIPE_SCHOOL_SMALL_TOWN_001`

- asset ID: `BUILDING_SCHOOL_SMALL_TOWN_001`
- family: `FAMILY_SCHOOL_SMALL_TOWN`
- footprint: medium civic campus
- required modules:
  - classroom wall modules
  - roof modules
  - school windows
  - entry modules
  - landscaping
  - fence
  - paths
- optional modules:
  - covered walkway
  - secondary classroom wing
  - playground edge landscaping
- identity modules:
  - school sign module
  - entry canopy marker
- existing reusable modules:
  - walls
  - roofs
  - windows
  - fence
  - path
  - landscaping
- new modules required:
  - school entry sign
  - classroom window grouping variation
- future reuse opportunities:
  - hospital
  - library
  - civic campus buildings
- estimated reuse percentage: `78%`

Purpose:

- tests larger footprint

#### `RECIPE_FIRE_STATION_SMALL_001`

- asset ID: `BUILDING_FIRE_STATION_SMALL_001`
- family: `FAMILY_FIRE_STATION`
- footprint: medium civic service site
- required modules:
  - civic shell
  - large bay opening
  - service doors
  - roof shell
  - signage
  - forecourt paving
  - site boundary
- optional modules:
  - second bay variation
  - small annex
  - side yard equipment pad
- identity modules:
  - fire bay door
  - fire service sign
- existing reusable modules:
  - foundation
  - walls
  - roof shell
  - paths
  - paving
- new modules required:
  - fire bay door module
  - fire station sign kit
- future reuse opportunities:
  - industrial depots
  - warehouse service shells
  - police support buildings
- estimated reuse percentage: `68%`

Purpose:

- tests identity modules

### 3.4 Service

#### `RECIPE_POLICE_STATION_SUBURBAN_001`

- asset ID: `BUILDING_POLICE_STATION_SUBURBAN_001`
- family: `FAMILY_POLICE_STATION`
- footprint: medium civic service lot
- required modules:
  - civic shell
  - secure entrance
  - windows
  - roof shell
  - signage
  - parking
  - paths
- optional modules:
  - fenced rear yard
  - evidence-entry side door
  - alternate frontage sign
- identity modules:
  - police sign
  - secure entrance treatment
- existing reusable modules:
  - walls
  - roofs
  - windows
  - parking
  - paving
- new modules required:
  - police sign kit
  - secure entry variation
- future reuse opportunities:
  - fire station
  - library service wing
  - civic offices
- estimated reuse percentage: `74%`

Purpose:

- tests civic identity

### 3.5 Industrial

#### `RECIPE_WAREHOUSE_SMALL_001`

- asset ID: `BUILDING_WAREHOUSE_SMALL_001`
- family: `FAMILY_WAREHOUSE`
- footprint: medium industrial lot
- required modules:
  - industrial shell
  - loading door
  - service door
  - roof shell
  - fencing
  - yard paving
  - site edge landscaping
- optional modules:
  - side loading dock
  - utility box
  - truck apron variation
- identity modules:
  - loading door module
- existing reusable modules:
  - walls
  - roofs
  - fence
  - paving
  - path and edge modules
- new modules required:
  - loading door system
  - industrial wall finish variation
- future reuse opportunities:
  - factories
  - depots
  - service yards
- estimated reuse percentage: `79%`

Purpose:

- tests industrial modules

### 3.6 Accommodation

#### `RECIPE_MOTEL_SMALL_COASTAL_001`

- asset ID: `BUILDING_MOTEL_SMALL_COASTAL_001`
- family: `FAMILY_MOTEL_COASTAL`
- footprint: medium accommodation strip
- required modules:
  - repeated room modules
  - walkway
  - parking
  - landscaping
  - signage
  - windows
  - doors
  - roof shell
- optional modules:
  - balcony run
  - courtyard tree
  - alternate parking layout
- identity modules:
  - motel sign kit
- existing reusable modules:
  - house openings
  - roof modules
  - path and parking modules
  - landscaping
- new modules required:
  - motel room repetition module
  - exterior walkway module
  - motel sign set
- future reuse opportunities:
  - hotels
  - apartments
  - holiday cabins
- estimated reuse percentage: `72%`

Purpose:

- tests repeated modular units

### 3.7 Landmark / Special

#### `RECIPE_LIGHTHOUSE_ISLAND_001`

- asset ID: `BUILDING_LIGHTHOUSE_ISLAND_001`
- family: `FAMILY_LIGHTHOUSE_COASTAL`
- footprint: landmark site
- required modules:
  - landmark shell
  - terrain base
  - pathway
  - vegetation
  - railings or boundary treatment
- optional modules:
  - signal-light accent
  - lookout fencing variation
  - alternate rock cluster placement
- identity modules:
  - lighthouse tower shell
  - lantern room shell
  - landmark path set
- existing reusable modules:
  - path
  - vegetation
  - fence logic
  - terrain edge logic
- new modules required:
  - lighthouse shell family
  - lantern room module
  - coastal rock landmark base
- future reuse opportunities:
  - other landmarks
  - lookout towers
  - museum grounds
- estimated reuse percentage: `58%`

Purpose:

- tests unique landmark assembly

## 4. Recipe Dependency Comparison

The starter set is intentionally diverse so the future factory is validated across multiple recipe shapes.

### Highest shell reuse

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`
- `RECIPE_HOUSE_SUBURBAN_BRICK_001`
- `RECIPE_BAKERY_COASTAL_001`
- `RECIPE_CAFE_SMALL_TOWN_001`
- `RECIPE_POLICE_STATION_SUBURBAN_001`

### Highest site and landscape reuse

- both house recipes
- school
- police station
- motel
- lighthouse

### Highest identity-module demand

- fire station
- police station
- bakery
- cafe
- lighthouse

### Highest repeated-unit demand

- motel
- school

### Highest landmark uniqueness

- lighthouse

## 5. Shared Module Opportunities

The starter recipes highlight the following high-value shared opportunities.

### Openings

- `MOD_WINDOW_STANDARD_001` style family
- residential doors
- commercial doors
- storefront glazing

Used by:

- houses
- bakery
- cafe
- school
- police station
- fire station
- motel

### Roofs

- gable roof
- hip roof
- flat roof
- skillion roof

Used by:

- houses
- bakery
- cafe
- school
- police station
- fire station
- warehouse
- motel

### Paths and site edges

- path
- pavement
- fence
- driveway

Used by:

- houses
- bakery
- cafe
- school
- police station
- fire station
- warehouse
- motel
- lighthouse

### Landscaping

- grass
- bush
- tree
- hedge
- planter

Used by:

- houses
- bakery
- cafe
- school
- police station
- motel
- lighthouse

## 6. New Module Requirements Summary

The starter recipe set introduces a manageable set of new reusable or identity-focused modules.

### High-priority new reusable modules

- suburban brick wall variation
- bakery sign kit
- outdoor seating set
- school sign and entry set
- fire bay door
- police secure-entry variation
- loading door system
- motel walkway module
- lighthouse shell family

### High-priority variation work

- service residential door variation
- porch variation
- roof finish variations
- commercial storefront trim variations

## 7. Module Reuse Comparison

### Example shared module comparison

#### `MOD_WINDOW_STANDARD_001`

Used by:

- houses
- bakery
- cafe
- school
- police station
- fire station
- motel

#### `MOD_PATH_STANDARD_001`

Used by:

- houses
- bakery
- cafe
- school
- police station
- fire station
- warehouse
- motel
- lighthouse

#### `MOD_ROOF_GABLE_STANDARD_001`

Used by:

- coastal cottage house
- suburban brick house
- school variants
- motel variants

### Module ranking criteria

Rank modules by:

- reuse count
- importance
- production priority

### Highest module reuse ranks

1. path / pavement family
2. wall shell family
3. roof shell family
4. windows
5. doors
6. fence
7. landscaping
8. signage systems

## 8. Recommended Production Order

Production order should be based on:

1. most reused modules
2. highest visual impact
3. best factory validation coverage

### Recommended build order

#### Stage 1 - Universal shared modules

- foundations
- walls
- roofs
- windows
- doors
- path
- pavement
- fence
- grass
- bush
- tree

#### Stage 2 - Proof residential recipes

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`
- `RECIPE_HOUSE_SUBURBAN_BRICK_001`

#### Stage 3 - Commercial frontage validation

- `RECIPE_BAKERY_COASTAL_001`
- `RECIPE_CAFE_SMALL_TOWN_001`

#### Stage 4 - Civic identity validation

- `RECIPE_SCHOOL_SMALL_TOWN_001`
- `RECIPE_FIRE_STATION_SMALL_001`
- `RECIPE_POLICE_STATION_SUBURBAN_001`

#### Stage 5 - Industrial and accommodation validation

- `RECIPE_WAREHOUSE_SMALL_001`
- `RECIPE_MOTEL_SMALL_COASTAL_001`

#### Stage 6 - Landmark validation

- `RECIPE_LIGHTHOUSE_ISLAND_001`

## 9. Factory Validation Coverage

The starter recipe set is intended to cover the first factory validation grid.

### Residential

- yes

### Commercial

- yes

### Civic

- yes

### Industrial

- yes

### Accommodation

- yes

### Landmark

- yes

### Coverage summary

The starter recipe set is broad enough to validate:

- shell reuse
- opening reuse
- path and site reuse
- landscape reuse
- identity-module handling
- repeated-unit handling
- larger-footprint handling
- landmark uniqueness handling

## 10. Production Recommendation

The recommended starter sequence is:

1. core shared modules
2. residential proof pair
3. commercial street pair
4. civic trio
5. warehouse
6. motel
7. lighthouse

This order provides the strongest mix of:

- reuse
- visual clarity
- category coverage
- early factory validation confidence

## 11. Readiness Statement

This document is ready to serve as the first recipe-expansion planning foundation for the GrowGo Modular Asset Factory.

It authorizes:

- starter recipe comparison
- dependency comparison
- module reuse planning
- production sequencing review

It does not authorize:

- Blender production
- GLB creation
- scripting
- runtime implementation
- gameplay systems
- backend systems
- OSM systems
