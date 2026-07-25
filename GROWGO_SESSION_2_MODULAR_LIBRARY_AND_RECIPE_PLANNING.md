# GrowGo Session 2 - Modular Library Inventory and Recipe Dependency Planning

## Session Scope

This document defines the planning structure that connects approved GrowGo asset designs to the future Modular Asset Factory.

This is a specification and inventory phase only.

This session does not:

- create Blender assets
- generate GLB files
- implement runtime rendering
- add gameplay systems
- add backend systems
- add OSM systems
- redesign renderer architecture

The purpose of this session is to define:

- the master Layer A modular library inventory
- the asset family recipe registry
- module dependency mapping
- reuse analysis
- future production priority

## 1. Source of Truth

This Session 2 planning document is governed by:

- `GROWGO_MODULAR_BIBLE_DESIGN_FOUNDATION.md`
- `ASSET_FACTORY_FOUNDATION.md`

If a future planning document conflicts with those documents, those source documents remain authoritative unless explicitly updated.

## 2. Session 2 Deliverables

This session establishes:

1. the Master Layer A Modular Library Inventory
2. the Asset Family Recipe Registry
3. the Module Dependency Mapping approach
4. the Reuse Analysis framework
5. the Future Production Priority List

Related follow-on planning document:

- `GROWGO_SESSION_2_5_NAMING_METADATA_AND_BLENDER_HANDOFF_FOUNDATION.md`

## 3. Master Layer A Modular Library Inventory

Layer A remains the universal reusable module library.

All modules in this inventory are planning entries, not production assets.

Each module category below should eventually support:

- `moduleId`
- category
- subcategory
- visual style compatibility
- reuse scope
- current status
- dependent recipes
- future production notes

### 3.1 Structure Modules

Core planning inventory:

- walls
- corners
- foundations
- extensions
- floors
- columns

Recommended planning subgroups:

- residential wall modules
- commercial wall modules
- civic wall modules
- industrial wall modules
- corner transitions
- stepped foundations
- slab foundations
- pier foundations
- frontage extensions
- side wing extensions

High-value shared examples:

- `MODULE_WALL_RESIDENTIAL_WEATHERBOARD_001`
- `MODULE_WALL_COMMERCIAL_SHOPFRONT_BASE_001`
- `MODULE_FOUNDATION_STANDARD_RECT_001`
- `MODULE_COLUMN_VERANDAH_TIMBER_001`

### 3.2 Roof Modules

Core planning inventory:

- gable
- hip
- flat
- skillion
- tower
- dome

Recommended planning subgroups:

- small-house roof modules
- apartment roof modules
- civic roof modules
- commercial awning roof modules
- industrial shed roof modules
- landmark tower roof modules

High-value shared examples:

- `MODULE_ROOF_GABLE_SMALL_001`
- `MODULE_ROOF_HIP_STANDARD_001`
- `MODULE_ROOF_FLAT_COMMERCIAL_001`
- `MODULE_ROOF_SKILLION_COASTAL_001`
- `MODULE_ROOF_TOWER_CIVIC_001`

### 3.3 Opening Modules

Core planning inventory:

- residential windows
- commercial windows
- doors
- glass storefronts
- shutters

Recommended planning subgroups:

- cottage windows
- apartment windows
- school windows
- civic entry doors
- commercial glazed doors
- service doors
- display storefront glazing
- roller shutters

High-value shared examples:

- `MODULE_WINDOW_RESIDENTIAL_DOUBLE_001`
- `MODULE_WINDOW_COMMERCIAL_DISPLAY_001`
- `MODULE_DOOR_RESIDENTIAL_FRONT_001`
- `MODULE_DOOR_CIVIC_ENTRY_001`
- `MODULE_STOREFRONT_GLAZED_FULLWIDTH_001`

### 3.4 Facade Modules

Core planning inventory:

- awnings
- verandahs
- balconies
- trims
- signs
- canopies

Recommended planning subgroups:

- shop awnings
- house verandahs
- motel balcony runs
- parapet trims
- fascia trims
- small business sign mounts
- civic canopy entries

High-value shared examples:

- `MODULE_AWNING_SHOP_STANDARD_001`
- `MODULE_VERANDAH_SMALL_TIMBER_001`
- `MODULE_BALCONY_APARTMENT_LINEAR_001`
- `MODULE_TRIM_COASTAL_WEATHERBOARD_001`
- `MODULE_CANOPY_CIVIC_ENTRY_001`

### 3.5 Landscape Modules

Core planning inventory:

- trees
- bushes
- hedges
- flowers
- planters
- rocks

Recommended planning subgroups:

- coastal trees
- suburban street trees
- civic garden shrubs
- commercial planters
- landmark rocks
- motel courtyard landscaping

High-value shared examples:

- `MODULE_TREE_EUCALYPTUS_MEDIUM_001`
- `MODULE_BUSH_COASTAL_LOW_001`
- `MODULE_HEDGE_SUBURBAN_STANDARD_001`
- `MODULE_PLANTER_COMMERCIAL_RECT_001`
- `MODULE_ROCK_COASTAL_CLUSTER_001`

### 3.6 Site Modules

Core planning inventory:

- paths
- pavement
- fences
- walls
- parking
- driveways

Recommended planning subgroups:

- footpaths
- civic walkways
- courtyard paving
- residential driveways
- motel parking bays
- industrial perimeter fencing
- retaining walls

High-value shared examples:

- `MODULE_PATH_STANDARD_PAVEMENT_001`
- `MODULE_PATH_GARDEN_CURVE_001`
- `MODULE_FENCE_TIMBER_STANDARD_001`
- `MODULE_DRIVEWAY_RESIDENTIAL_SINGLE_001`
- `MODULE_PARKING_STANDARD_BAY_001`

### 3.7 Street Modules

Core planning inventory:

- benches
- bins
- lights
- signs
- bus shelters

Recommended planning subgroups:

- neighbourhood furniture
- civic furniture
- transit furniture
- coastal wayfinding
- commercial street furniture

High-value shared examples:

- `MODULE_BENCH_PARK_STANDARD_001`
- `MODULE_BIN_STREET_STANDARD_001`
- `MODULE_LIGHT_POLE_COASTAL_001`
- `MODULE_SIGN_WAYFINDING_STANDARD_001`
- `MODULE_BUS_SHELTER_BASIC_001`

### 3.8 Special Identity Modules

These modules are more specific, but still belong in the shared library if they can unlock multiple recipes or family variations.

Core planning inventory:

- bakery signs
- police signs
- fire station doors
- hospital signage
- postal boxes

Recommended planning rule:

- identity modules should be introduced only when the generic module set is insufficient for family readability

High-value shared examples:

- `MODULE_SIGN_BAKERY_HANGING_001`
- `MODULE_SIGN_POLICE_ENTRY_001`
- `MODULE_DOOR_FIRE_STATION_BAY_001`
- `MODULE_SIGN_HOSPITAL_ENTRY_001`
- `MODULE_POSTAL_BOX_STREET_001`

## 4. Asset Family Recipe Registry

Every approved family must be represented by planning-level recipe entries.

Each recipe record should include:

- `assetId`
- family
- footprint
- required modules
- new modules required
- existing modules reused
- potential future reuse
- reuse percentage estimate
- new-module percentage estimate

## 5. Recipe Registry Entries

The following entries are design and dependency planning records, not production-ready recipes.

### 5.1 Residential

#### `BUILDING_HOUSE_FAMILY_COASTAL_001`

- family: Residential
- footprint: Small / Medium
- required modules:
  - residential walls
  - small gable or hip roofs
  - residential windows
  - residential doors
  - verandahs
  - fences
  - paths
  - landscaping
- new modules required:
  - coastal wall trim variants
  - small porch variants
- existing modules reused:
  - walls
  - roofs
  - windows
  - doors
  - paths
  - fences
  - landscape modules
- potential future reuse:
  - townhouses
  - motels
  - civic annex buildings
- reuse estimate: 85%
- new estimate: 15%

#### `BUILDING_APARTMENT_MEDIUM_FAMILY_001`

- family: Residential
- footprint: Medium / Large
- required modules:
  - apartment walls
  - flat and hip roof combinations
  - apartment windows
  - entry doors
  - balconies
  - landscaping
  - parking
  - paths
- new modules required:
  - balcony run variants
  - apartment entry canopy variants
- existing modules reused:
  - walls
  - roofs
  - windows
  - paths
  - parking
  - landscape modules
- potential future reuse:
  - hotels
  - motels
  - townhouses
- reuse estimate: 78%
- new estimate: 22%

#### `BUILDING_TOWNHOUSE_FAMILY_001`

- family: Residential
- footprint: Small / Medium
- required modules:
  - shared walls
  - repeated roof modules
  - residential windows
  - residential doors
  - fences
  - driveways
  - landscape modules
- new modules required:
  - row-house frontage patterns
- existing modules reused:
  - walls
  - roofs
  - windows
  - doors
  - fences
  - driveways
- potential future reuse:
  - apartments
  - motels
  - mixed-use rows
- reuse estimate: 82%
- new estimate: 18%

### 5.2 Commercial

#### `BUILDING_BAKERY_COASTAL_001`

- family: Commercial
- footprint: Small
- required modules:
  - commercial walls
  - commercial roof
  - display windows
  - entry door
  - awning
  - signage
  - planters
  - paths
- new modules required:
  - bakery sign
  - bakery display window trim
- existing modules reused:
  - walls
  - roof
  - storefront glazing
  - door
  - awning
  - path
  - planter modules
- potential future reuse:
  - cafe
  - kebab shop
  - sandwich shop
  - retail shops
- reuse estimate: 80%
- new estimate: 20%

#### `BUILDING_CAFE_DIRECTION_001`

- family: Commercial
- footprint: Small / Medium
- required modules:
  - commercial walls
  - roof
  - display windows
  - entry door
  - awning
  - seating frontage
  - signage
  - planters
- new modules required:
  - cafe sign variants
  - outdoor seating modules
- existing modules reused:
  - bakery-style shop shell
  - storefront glazing
  - awnings
  - paths
  - planters
- potential future reuse:
  - restaurants
  - sandwich shop
  - boutique hotel frontage
- reuse estimate: 76%
- new estimate: 24%

#### `BUILDING_KEBAB_SHOP_001`

- family: Commercial
- footprint: Small
- required modules:
  - commercial walls
  - flat roof
  - glass storefront
  - service entry
  - awning
  - signage
- new modules required:
  - kebab identity sign
- existing modules reused:
  - storefront shell
  - glazing
  - awning
  - commercial door
- potential future reuse:
  - fast food
  - retail micro-shops
- reuse estimate: 84%
- new estimate: 16%

#### `BUILDING_FAST_FOOD_FAMILY_001`

- family: Commercial
- footprint: Small / Medium
- required modules:
  - commercial walls
  - flat or skillion roof
  - storefront windows
  - entry doors
  - signs
  - canopies
  - parking
  - paths
- new modules required:
  - family-specific sign kits
  - queue canopy variants
- existing modules reused:
  - walls
  - roofs
  - storefronts
  - parking
  - paths
- potential future reuse:
  - takeaway shops
  - suburban retail
- reuse estimate: 79%
- new estimate: 21%

#### `BUILDING_RETAIL_SHOP_FAMILY_001`

- family: Commercial
- footprint: Small / Medium
- required modules:
  - commercial walls
  - flat roof
  - storefront glazing
  - doors
  - awnings
  - signs
  - planters
- new modules required:
  - retail sign families
- existing modules reused:
  - storefronts
  - awnings
  - walls
  - roofs
  - paths
- potential future reuse:
  - bakery
  - cafe
  - post office
  - bank
- reuse estimate: 88%
- new estimate: 12%

#### `BUILDING_BANK_001`

- family: Commercial
- footprint: Medium
- required modules:
  - commercial/civic walls
  - flat roof
  - civic entry
  - windows
  - sign
  - pavement
- new modules required:
  - bank sign
  - ATM facade module
- existing modules reused:
  - walls
  - doors
  - windows
  - canopies
  - pavement
- potential future reuse:
  - post office
  - library annex
  - town centre civic buildings
- reuse estimate: 74%
- new estimate: 26%

#### `BUILDING_POST_OFFICE_001`

- family: Commercial
- footprint: Medium
- required modules:
  - civic/commercial walls
  - roof
  - windows
  - civic door
  - signage
  - postal boxes
  - pavement
- new modules required:
  - postal boxes
  - post office sign kit
- existing modules reused:
  - walls
  - roof
  - windows
  - door
  - pavement
- potential future reuse:
  - civic service buildings
  - museum annexes
- reuse estimate: 72%
- new estimate: 28%

#### `BUILDING_GAS_STATION_001`

- family: Commercial
- footprint: Medium / Large
- required modules:
  - small retail shell
  - canopy
  - forecourt paving
  - signage
  - parking
  - service paths
- new modules required:
  - fuel canopy system
  - pump islands
  - price signage
- existing modules reused:
  - retail shell
  - glazing
  - doors
  - parking
  - signs
- potential future reuse:
  - roadside motels
  - industrial service sites
- reuse estimate: 65%
- new estimate: 35%

### 5.3 Civic

#### `BUILDING_SCHOOL_FAMILY_001`

- family: Civic
- footprint: Medium / Large
- required modules:
  - civic walls
  - roof modules
  - classroom windows
  - entry doors
  - canopies
  - fences
  - paths
  - landscaping
- new modules required:
  - school frontage identity kit
  - covered walkway modules
- existing modules reused:
  - walls
  - roofs
  - windows
  - doors
  - fences
  - paths
  - landscaping
- potential future reuse:
  - hospital
  - library
  - museum
- reuse estimate: 81%
- new estimate: 19%

#### `BUILDING_POLICE_STATION_001`

- family: Civic
- footprint: Medium
- required modules:
  - civic walls
  - roof
  - windows
  - civic doors
  - signage
  - parking
  - fences
- new modules required:
  - police sign kit
  - secure frontage detail modules
- existing modules reused:
  - walls
  - roofs
  - windows
  - doors
  - parking
  - fencing
- potential future reuse:
  - fire station
  - hospital service wings
- reuse estimate: 77%
- new estimate: 23%

#### `BUILDING_FIRE_STATION_001`

- family: Civic
- footprint: Medium / Large
- required modules:
  - civic walls
  - roof
  - large bay doors
  - windows
  - signage
  - forecourt paving
- new modules required:
  - fire station bay doors
  - fire sign kit
- existing modules reused:
  - walls
  - roofs
  - windows
  - paving
- potential future reuse:
  - industrial depots
  - service buildings
- reuse estimate: 68%
- new estimate: 32%

#### `BUILDING_HOSPITAL_001`

- family: Civic
- footprint: Large
- required modules:
  - civic walls
  - flat roof
  - medical windows
  - entry canopies
  - signage
  - parking
  - paths
  - landscaping
- new modules required:
  - hospital sign kit
  - emergency entry canopy
- existing modules reused:
  - walls
  - flat roofs
  - windows
  - parking
  - paths
  - landscaping
- potential future reuse:
  - schools
  - apartments
  - civic campuses
- reuse estimate: 79%
- new estimate: 21%

#### `BUILDING_LIBRARY_001`

- family: Civic
- footprint: Medium
- required modules:
  - civic walls
  - roof
  - large windows
  - civic doors
  - signage
  - paths
  - planters
- new modules required:
  - library sign kit
- existing modules reused:
  - walls
  - roofs
  - windows
  - doors
  - planters
  - paths
- potential future reuse:
  - museum
  - cultural centre
  - town hall annexes
- reuse estimate: 83%
- new estimate: 17%

#### `BUILDING_MUSEUM_CULTURAL_CENTRE_001`

- family: Civic
- footprint: Medium / Large
- required modules:
  - civic walls
  - roof
  - feature windows
  - entry canopy
  - signage
  - plaza paving
  - landscaping
- new modules required:
  - cultural banner/sign module
  - showcase facade accent kit
- existing modules reused:
  - walls
  - roofs
  - windows
  - paths
  - planters
- potential future reuse:
  - library
  - town hall
  - boutique hotel
- reuse estimate: 73%
- new estimate: 27%

#### `BUILDING_TOWN_HALL_FAMILY_001`

- family: Civic
- footprint: Medium / Large
- required modules:
  - civic walls
  - roof or tower roof
  - civic entry
  - windows
  - signage
  - plaza paving
  - landscaping
- new modules required:
  - small-town redesign kit
  - civic crest/sign module
- existing modules reused:
  - walls
  - roofs
  - doors
  - windows
  - paving
  - landscaping
- potential future reuse:
  - library
  - museum
  - schools
- reuse estimate: 75%
- new estimate: 25%

### 5.4 Accommodation

#### `BUILDING_HOTEL_FAMILY_001`

- family: Accommodation
- footprint: Medium / Large
- required modules:
  - apartment-style walls
  - roof variants
  - balcony systems
  - windows
  - entry canopies
  - signage
  - landscaping
  - parking
- new modules required:
  - hotel entry identity set
- existing modules reused:
  - apartment modules
  - balconies
  - windows
  - parking
  - landscaping
- potential future reuse:
  - apartments
  - motels
  - mixed-use accommodation
- reuse estimate: 84%
- new estimate: 16%

#### `BUILDING_MOTEL_FAMILY_001`

- family: Accommodation
- footprint: Medium / Large
- required modules:
  - repeated room wall modules
  - balcony/verandah modules
  - windows
  - doors
  - parking
  - courtyard landscaping
  - signage
- new modules required:
  - motel identity sign set
  - exterior corridor patterns
- existing modules reused:
  - walls
  - roofs
  - doors
  - windows
  - parking
  - landscaping
- potential future reuse:
  - apartments
  - hotels
  - roadside service buildings
- reuse estimate: 82%
- new estimate: 18%

### 5.5 Industrial

#### `BUILDING_WAREHOUSE_FAMILY_001`

- family: Industrial
- footprint: Large
- required modules:
  - industrial walls
  - shed roofs
  - service doors
  - loading openings
  - fencing
  - parking
  - service paving
- new modules required:
  - loading dock kit
- existing modules reused:
  - wall panels
  - roof modules
  - doors
  - fences
  - paving
- potential future reuse:
  - factories
  - service depots
  - fire station support buildings
- reuse estimate: 86%
- new estimate: 14%

#### `BUILDING_FACTORY_FAMILY_001`

- family: Industrial
- footprint: Large
- required modules:
  - industrial walls
  - industrial roofs
  - service openings
  - chimneys or vent towers
  - fences
  - yards
  - parking
- new modules required:
  - vent/chimney identity kit
  - industrial utility add-ons
- existing modules reused:
  - walls
  - roofs
  - fences
  - parking
  - paths
- potential future reuse:
  - warehouse family
  - utility buildings
  - industrial district recipes
- reuse estimate: 74%
- new estimate: 26%

#### `DISTRICT_INDUSTRIAL_FAMILY_001`

- family: Industrial District
- footprint: Large district
- required modules:
  - warehouse modules
  - factory modules
  - storage yards
  - utility sheds
  - fences
  - service roads
  - landscape buffers
- new modules required:
  - utility yard identity modules
  - service buffer landscaping kit
- existing modules reused:
  - warehouse family
  - factory family
  - fences
  - roads
  - parking
  - landscaping
- potential future reuse:
  - logistics yards
  - civic service compounds
- reuse estimate: 88%
- new estimate: 12%

## 6. Module Dependency Mapping

The dependency planning model for GrowGo assets is:

- approved family direction
- recipe entry
- required Layer A modules
- new shared modules
- assembled asset candidate

### Dependency mapping rules

- every recipe must explicitly name reused modules
- every recipe must explicitly name new module gaps
- new module gaps must be added to the Layer A inventory before production planning
- modules that unlock multiple families should be marked as high-priority unlocks
- identity modules should only be introduced after generic modules are maximally reused

### Dependency priority labels

- `core-unlock`
- `family-unlock`
- `identity-unlock`
- `optional-enhancement`

## 7. Reuse Analysis Summary

### Highest reuse family groups

- house families
- retail shop families
- school and civic mid-size families
- motel/hotel families
- warehouse/industrial families

### Highest reuse module groups

- windows
- doors
- roofs
- walls
- landscaping
- paths
- fences
- signs

### Typical high-reuse patterns

- a bakery, cafe, kebab shop, and small retail shop can share most of the same storefront shell
- hotels, motels, apartments, and townhouses can share many window, balcony, roof, and path systems
- police, library, town hall, museum, and school families can share large portions of the same civic shell language
- warehouse and factory systems can share core industrial shells, fences, paving, and utility edge modules

## 8. Future Production Priority List

Production priority should be based on reuse value first.

### Recommended module-first order

1. windows
2. doors
3. roofs
4. walls
5. landscaping
6. paths
7. fences
8. signs
9. awnings and verandahs
10. parking and driveways
11. balcony systems
12. identity modules

### Recommended family production order

After the highest-value shared modules exist, the recommended family order is:

1. house families
2. retail shop family shells
3. bakery and cafe family
4. civic mid-size buildings
5. motel family
6. apartment family
7. warehouse family
8. factory family
9. gas station family
10. larger accommodation and district assemblies

### Why this order is recommended

- houses unlock broad residential reuse
- shopfront families unlock most early commercial families
- civic buildings heavily reuse walls, roofs, windows, doors, and signage
- motel and apartment families benefit from already-built opening and balcony systems
- industrial families become cheaper once doors, walls, roofs, fencing, and paving are already solved

## 9. Inventory Summary

Session 2 establishes a planning-level inventory for:

- structure modules
- roof modules
- opening modules
- facade modules
- landscape modules
- site modules
- street modules
- special identity modules

It also establishes a recipe planning registry for:

- residential families
- commercial families
- civic families
- accommodation families
- industrial families

## 10. Readiness Statement

This document is ready to guide the next bounded planning and production-preparation phases.

It authorizes:

- modular inventory review
- recipe dependency review
- reuse planning
- production ordering discussion

It does not authorize:

- Blender production
- GLB generation
- runtime rendering work
- gameplay systems
- backend systems
- OSM systems
