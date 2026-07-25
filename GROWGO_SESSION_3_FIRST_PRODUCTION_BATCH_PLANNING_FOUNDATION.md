# GrowGo Session 3 - First Production Batch Planning Foundation

## Session Scope

This document defines the first production batch plan for the future GrowGo Modular Asset Factory.

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

1. the first Layer A production batch plan
2. the first proof recipe plan
3. the module dependency order
4. the Blender production preparation checklist
5. the future asset batch roadmap

Related follow-on planning document:

- `GROWGO_SESSION_3_5_ASSET_FACTORY_PRODUCTION_RULES_FOUNDATION.md`

## 1. Source of Truth

This Session 3 planning document is governed by:

- `GROWGO_MODULAR_BIBLE_DESIGN_FOUNDATION.md`
- `GROWGO_SESSION_2_MODULAR_LIBRARY_AND_RECIPE_PLANNING.md`
- `GROWGO_SESSION_2_5_NAMING_METADATA_AND_BLENDER_HANDOFF_FOUNDATION.md`

If a future planning document conflicts with these documents, those source documents remain authoritative unless explicitly updated.

## 2. Production Philosophy

Production planning priorities must be evaluated in this order:

1. highest reuse value
2. number of recipes unlocked
3. visual importance
4. mobile performance
5. difficulty

### Planning rule

Modules that unlock many families and remain easy to optimize for mobile should be prioritized ahead of high-complexity identity pieces.

## 3. Batch 1 - Universal Core Modules

Batch 1 is the first production-preparation batch for shared Layer A modules.

The goal of Batch 1 is to unlock the broadest number of future recipes with the smallest foundational module set.

### 3.1 Structure

Batch 1 structure modules:

- foundations
- wall modules
- corner walls
- extension walls

Recommended first structure batch entries:

- `MOD_FOUNDATION_STANDARD_RECT_001`
- `MOD_WALL_WEATHERBOARD_WHITE_001`
- `MOD_WALL_COMMERCIAL_PLAIN_001`
- `MOD_WALL_CORNER_STANDARD_001`
- `MOD_WALL_EXTENSION_SINGLE_BAY_001`

### 3.2 Roof

Batch 1 roof modules:

- gable roof
- hip roof
- flat roof
- skillion roof

Recommended first roof batch entries:

- `MOD_ROOF_GABLE_STANDARD_001`
- `MOD_ROOF_HIP_STANDARD_001`
- `MOD_ROOF_FLAT_STANDARD_001`
- `MOD_ROOF_SKILLION_STANDARD_001`

### 3.3 Openings

Batch 1 opening modules:

- residential window
- commercial window
- glass storefront
- standard door
- commercial door

Recommended first opening batch entries:

- `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
- `MOD_WINDOW_COMMERCIAL_STANDARD_001`
- `MOD_STOREFRONT_GLAZED_STANDARD_001`
- `MOD_DOOR_STANDARD_RESIDENTIAL_001`
- `MOD_DOOR_STANDARD_COMMERCIAL_001`

### 3.4 Exterior

Batch 1 exterior modules:

- verandah
- awning
- balcony
- trim

Recommended first exterior batch entries:

- `MOD_VERANDAH_STANDARD_TIMBER_001`
- `MOD_AWNING_STANDARD_SHOP_001`
- `MOD_BALCONY_STANDARD_LINEAR_001`
- `MOD_TRIM_STANDARD_COASTAL_001`

### 3.5 Landscape

Batch 1 landscape modules:

- grass
- bush
- tree
- hedge
- flower bed

Recommended first landscape batch entries:

- `MOD_GROUND_GRASS_STANDARD_001`
- `MOD_BUSH_NATIVE_STANDARD_001`
- `MOD_TREE_EUCALYPTUS_STANDARD_001`
- `MOD_HEDGE_STANDARD_LOW_001`
- `MOD_FLOWERBED_STANDARD_001`

### 3.6 Site

Batch 1 site modules:

- path
- pavement
- driveway
- fence

Recommended first site batch entries:

- `MOD_PATH_STANDARD_001`
- `MOD_PAVEMENT_STANDARD_001`
- `MOD_DRIVEWAY_STANDARD_SINGLE_001`
- `MOD_FENCE_STANDARD_TIMBER_001`

### 3.7 Street

Batch 1 street modules:

- bench
- lamp
- sign mount

Recommended first street batch entries:

- `MOD_BENCH_STANDARD_001`
- `MOD_LAMP_STANDARD_001`
- `MOD_SIGN_MOUNT_STANDARD_001`

## 4. Batch 1 Production Intent

Batch 1 should be treated as the shared unlock layer for:

- house families
- small commercial buildings
- early civic buildings
- motel and apartment derivatives

### Batch 1 success criteria

Batch 1 is successful when:

- core shell modules exist
- the proof house recipe is fully mappable
- at least one complete proof asset can be planned without unresolved foundational gaps
- the module list is reusable across residential and commercial directions

## 5. Proof Asset Plan

The recommended first complete building recipe is:

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`

### Why this is the first proof recipe

It tests:

- walls
- roof
- windows
- doors
- landscaping
- fencing
- paths
- property footprint
- orientation rules

It also provides a strong early validation of:

- the locked papercut 2.5D style
- residential readability at overview zoom
- mobile-first asset budgeting
- module reuse value across later families

## 6. House Production Plan

### Proof building target

- `BUILDING_HOUSE_COASTAL_COTTAGE_001`

### Proof recipe target

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`

### Footprint planning

- footprint size: small residential lot
- orientation: road-facing
- frontage: front yard visible from road
- rear zone: fenced or landscaped rear yard

### Road-facing rules

- front door should clearly face the road
- verandah and frontage details should support overview readability
- primary facade should be identifiable at neighbourhood and overview zoom

### Front and back yard rules

- front yard uses simplified landscape readability
- rear yard remains lighter-detail and secondary
- paths and fencing should support lot identity without crowding the silhouette

### Required modular dependencies

#### Structure

- `MOD_WALL_WEATHERBOARD_WHITE_001`
- `MOD_WALL_CORNER_STANDARD_001`
- `MOD_FOUNDATION_STANDARD_RECT_001`

#### Roof

- `MOD_ROOF_GABLE_STANDARD_001`

#### Openings

- `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
- `MOD_DOOR_STANDARD_RESIDENTIAL_001`

#### Exterior

- `MOD_VERANDAH_STANDARD_TIMBER_001`
- `MOD_TRIM_STANDARD_COASTAL_001`

#### Landscape

- `MOD_BUSH_NATIVE_STANDARD_001`
- `MOD_TREE_EUCALYPTUS_STANDARD_001`
- `MOD_HEDGE_STANDARD_LOW_001`

#### Site

- `MOD_PATH_STANDARD_001`
- `MOD_DRIVEWAY_STANDARD_SINGLE_001`
- `MOD_FENCE_STANDARD_TIMBER_001`

### Optional variants

- alternate weatherboard colour variants
- alternate gable treatment variants
- alternate verandah width variants
- alternate yard landscape mixes

## 7. Module Dependency Order

The first dependency order should follow the proof asset and high-reuse unlock logic.

### Recommended dependency order

1. foundations
2. wall modules
3. corner walls
4. residential windows
5. residential doors
6. gable roof
7. verandah
8. trim
9. path
10. fence
11. driveway
12. bush
13. tree
14. hedge
15. flower bed
16. commercial openings
17. flat and skillion roofs
18. awnings
19. balcony
20. street furniture

### Dependency reasoning

- the proof house cannot proceed without core shell and opening modules
- site modules must exist early because they define lot readability
- landscape modules must exist early because they are part of the papercut silhouette language
- commercial openings and awnings come immediately after the proof house because they unlock the commercial street families

## 8. Asset Factory Production Checklist

Before any production work begins on Batch 1, verify:

1. asset IDs are defined
2. metadata is defined
3. LOD targets are defined
4. material rules are defined
5. export rules are defined
6. recipe dependencies are known
7. reuse opportunities are documented

### Batch 1 preparation checklist

- proof recipe chosen
- module IDs reserved
- family IDs reserved
- footprint rules documented
- orientation rules documented
- material naming standards assigned
- LOD expectations assigned
- Blender collection targets assigned
- export naming assigned
- missing dependencies clearly marked

## 9. Blender Production Preparation Checklist

This phase does not begin Blender production, but it defines what must be ready first.

### Required before first Blender work

- approved proof recipe
- complete Batch 1 dependency list
- metadata schema assigned
- polygon targets assigned
- material naming assigned
- collection placement assigned
- export naming assigned
- orientation and origin rules assigned

### Required review questions

- does this module already exist
- can an existing module be reused directly
- can a small modification create a reusable module
- is the new module genuinely a universal Batch 1 unlock

If the answer to the first three questions is yes, a new module should not be created yet.

## 10. Future Asset Batch Roadmap

### Batch 1

- universal modules
- first house proof recipe

### Batch 2

- additional house families
- frontage and roof variants
- townhouse and residential derivatives

### Batch 3

- commercial street
- bakery
- cafe
- retail shop shells
- storefront identity modules

### Batch 4

- civic buildings
- schools
- library
- police station
- fire station

### Batch 5

- industrial
- warehouses
- factories
- service yards

### Batch 6

- accommodation
- motels
- hotels
- apartment derivatives

### Batch 7

- large landmarks
- large civic anchors
- more complex hero assets

## 11. Module Priority Summary

Highest Batch 1 priority modules:

1. foundations
2. wall modules
3. corner walls
4. residential windows
5. residential doors
6. gable roof
7. verandah
8. path
9. fence
10. tree

These modules are prioritized because they:

- unlock the proof house recipe
- unlock later residential reuse
- support early visual identity
- remain manageable for mobile-first performance

## 12. Proof Asset Summary

The first proof asset plan is:

- `BUILDING_HOUSE_COASTAL_COTTAGE_001`

The first proof recipe plan is:

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`

This asset is the recommended first proof asset because it validates:

- shared module naming
- recipe dependency logic
- orientation rules
- site and landscape integration
- overview readability
- Batch 1 production sequencing

## 13. Readiness Statement

This document is ready to guide the first production-preparation phase of the GrowGo Modular Asset Factory.

It authorizes:

- Batch 1 planning
- dependency sequencing
- proof recipe planning
- Blender production preparation review

It does not authorize:

- Blender production
- GLB creation
- runtime systems
- gameplay systems
- backend systems
- OSM systems
