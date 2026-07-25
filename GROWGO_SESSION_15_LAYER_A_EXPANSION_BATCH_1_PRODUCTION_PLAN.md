# GrowGo Session 15 - Layer A Expansion Batch 1 Production Plan

## Session Scope

This document defines the first Layer A expansion batch after successful validation of:

- `BUILDING_HOUSE_COASTAL_COTTAGE_001`

The focus of this session is to identify and plan the highest-value reusable modules that both improve the proof asset and unlock future recipes.

This is a documentation and production-planning phase only.

This session does not:

- create new building recipes
- redesign existing modules
- change asset naming
- change Layer A architecture
- modify the renderer
- add gameplay systems
- add backend systems
- add OSM systems

Only approved Layer A modules are expanded in this session.

## 1. Source of Truth

This Session 15 planning document is governed by:

- `GROWGO_SESSION_14_5_FIRST_ASSET_FACTORY_PROOF_VALIDATION_AND_REGISTRATION.md`
- `GROWGO_SESSION_7_5_CORE_LAYER_A_MODULE_SPECIFICATION_FOUNDATION.md`
- `GROWGO_SESSION_10_RECIPE_EXPANSION_BATCH_1_FOUNDATION.md`
- `GROWGO_SESSION_11_FIRST_BLENDER_PRODUCTION_EXECUTION_PLAN_FOUNDATION.md`

If a future planning document conflicts with these documents, those source documents remain authoritative unless explicitly updated.

## 2. Expansion Batch Purpose

The first proof build validated the core cottage path.

The next highest-value move is not to create new buildings immediately, but to strengthen the reusable Layer A library in the areas with the largest cross-family payoff.

This batch has three goals:

1. improve the visual and functional completeness of the cottage proof asset
2. unlock the next wave of residential, commercial, civic, accommodation, and landmark recipes
3. increase Layer A reuse so future production is less dependent on recipe-specific one-off work

## 3. Batch 1 Target Module List

The following modules are in scope for this Layer A expansion batch.

### Site modules

1. `MOD_PATH_STANDARD_001`
2. `MOD_DRIVEWAY_STANDARD_SINGLE_001`
3. `MOD_FENCE_STANDARD_001`

### Landscape modules

4. `MOD_GROUND_GRASS_STANDARD_001`
5. `MOD_BUSH_NATIVE_STANDARD_001`
6. `MOD_TREE_EUCALYPTUS_STANDARD_001`
7. `MOD_FLOWERBED_STANDARD_001`

### House improvement modules

8. `MOD_VERANDAH_STANDARD_TIMBER_001`
9. `MOD_PORCH_COASTAL_SMALL_001`
10. `MOD_TRIM_STANDARD_COASTAL_001`
11. `MOD_CHIMNEY_COASTAL_SMALL_001`

## 4. Site Module Production Plan

### 4.1 `MOD_PATH_STANDARD_001`

- asset ID: `MOD_PATH_STANDARD_001`
- category: `SITE`
- dimensions:
  - standard width: `1.5m`
  - thickness: `0.12m`
  - segment length: `2.0m`
- variants:
  - straight
  - corner
  - junction
  - entrance path
- sockets:
  - `SOCKET_PATH_BRANCH`
  - `SOCKET_PATH_ENTRY`
  - `SOCKET_ROAD_FRONTAGE`
  - `SOCKET_PROPERTY_EDGE`
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_HOUSE_BEACH_BUNGALOW_001`
  - `RECIPE_HOUSE_RURAL_COTTAGE_001`
  - `RECIPE_BAKERY_COASTAL_001`
  - `RECIPE_CAFE_SMALL_TOWN_001`
  - `RECIPE_SCHOOL_SMALL_TOWN_001`
  - `RECIPE_POLICE_STATION_SUBURBAN_001`
  - `RECIPE_FIRE_STATION_SMALL_001`
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
  - `RECIPE_LIGHTHOUSE_ISLAND_001`
- LOD requirements:
  - `LOD0`: edge definition and clean path seams
  - `LOD1`: path width and route legibility preserved
  - `LOD2`: simple planar route silhouette
- polygon targets:
  - `LOD0`: `120-220`
  - `LOD1`: `40-100`
  - `LOD2`: `8-24`
- materials:
  - `MAT_PATH_STONE_NEUTRAL_001`
  - `MAT_PATH_CONCRETE_LIGHT_001`
- reuse opportunities:
  - all current houses
  - all current commercial frontage recipes
  - civic campus circulation
  - motel and lighthouse access routes

### 4.2 `MOD_DRIVEWAY_STANDARD_SINGLE_001`

- asset ID: `MOD_DRIVEWAY_STANDARD_SINGLE_001`
- category: `SITE`
- dimensions:
  - width: `2.8m`
  - thickness: `0.08m`
  - segment length: `4.0m-6.0m`
- variants:
  - residential driveway
  - commercial driveway
- sockets:
  - `SOCKET_ROAD_FRONTAGE`
  - `SOCKET_PROPERTY_EDGE`
  - `SOCKET_PATH_ENTRY`
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_HOUSE_RURAL_COTTAGE_001`
  - `RECIPE_SHOP_MAIN_STREET_001`
  - `RECIPE_SCHOOL_SMALL_TOWN_001`
  - `RECIPE_POLICE_STATION_SUBURBAN_001`
  - `RECIPE_FIRE_STATION_SMALL_001`
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
- LOD requirements:
  - `LOD0`: driveway edge, width, and entry taper preserved
  - `LOD1`: route and frontage logic preserved
  - `LOD2`: simplified site strip
- polygon targets:
  - `LOD0`: `90-180`
  - `LOD1`: `32-72`
  - `LOD2`: `8-18`
- materials:
  - `MAT_PATH_CONCRETE_LIGHT_001`
  - `MAT_FENCE_METAL_001` for edge transitions where needed
- reuse opportunities:
  - all vehicle-access residential lots
  - service and civic frontage lots
  - motel access planning

### 4.3 `MOD_FENCE_STANDARD_001`

- asset ID: `MOD_FENCE_STANDARD_001`
- category: `SITE`
- dimensions:
  - segment length: `2.0m`
  - standard height: `1.2m`
  - security height: `1.8m`
- variants:
  - timber fence
  - decorative fence
  - security fence
- sockets:
  - `SOCKET_FENCE_RUN`
  - `SOCKET_FENCE_CORNER`
  - `SOCKET_PATH_ENTRY`
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_HOUSE_BEACH_BUNGALOW_001`
  - `RECIPE_HOUSE_RURAL_COTTAGE_001`
  - `RECIPE_SCHOOL_SMALL_TOWN_001`
  - `RECIPE_POLICE_STATION_SUBURBAN_001`
  - `RECIPE_WAREHOUSE_SMALL_001`
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
  - `RECIPE_LIGHTHOUSE_ISLAND_001`
- LOD requirements:
  - `LOD0`: slat or rail rhythm visible
  - `LOD1`: broad fence read preserved
  - `LOD2`: boundary strip silhouette only
- polygon targets:
  - `LOD0`: `140-260`
  - `LOD1`: `60-120`
  - `LOD2`: `12-28`
- materials:
  - `MAT_FENCE_TIMBER_001`
  - `MAT_FENCE_METAL_001`
- reuse opportunities:
  - residential lot edges
  - school and police boundaries
  - warehouse perimeter control
  - motel privacy edges

## 5. Landscape Module Production Plan

### 5.1 `MOD_GROUND_GRASS_STANDARD_001`

- asset ID: `MOD_GROUND_GRASS_STANDARD_001`
- category: `LANDSCAPE`
- dimensions:
  - tile size: `2.0m x 2.0m`
  - thickness: `0.05m`
- variants:
  - residential grass
  - park grass
  - civic grass
- sockets:
  - `SOCKET_LANDSCAPE_PATCH`
  - `SOCKET_PATH_ENTRY`
- compatible recipes:
  - all current residential recipes
  - `RECIPE_SCHOOL_SMALL_TOWN_001`
  - `RECIPE_POLICE_STATION_SUBURBAN_001`
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
  - `RECIPE_LIGHTHOUSE_ISLAND_001`
- LOD requirements:
  - `LOD0`: patch edge variation preserved
  - `LOD1`: broad surface colour and parcel logic preserved
  - `LOD2`: simple terrain colour field
- polygon targets:
  - `LOD0`: `40-120`
  - `LOD1`: `12-40`
  - `LOD2`: `2-8`
- materials:
  - `MAT_GRASS_COASTAL_001`
- reuse opportunities:
  - residential yards
  - park edges
  - civic grounds
  - motel and lighthouse landscape fill

### 5.2 `MOD_BUSH_NATIVE_STANDARD_001`

- asset ID: `MOD_BUSH_NATIVE_STANDARD_001`
- category: `LANDSCAPE`
- dimensions:
  - small radius: `0.45m`
  - medium radius: `0.7m`
  - height range: `0.5m-0.9m`
- variants:
  - small bush
  - medium bush
  - hedge cluster
- sockets:
  - `SOCKET_LANDSCAPE_PATCH`
  - `SOCKET_FENCE_RUN`
- compatible recipes:
  - all current residential recipes
  - `RECIPE_BAKERY_COASTAL_001`
  - `RECIPE_CAFE_SMALL_TOWN_001`
  - `RECIPE_SCHOOL_SMALL_TOWN_001`
  - `RECIPE_POLICE_STATION_SUBURBAN_001`
  - `RECIPE_FIRE_STATION_SMALL_001`
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
  - `RECIPE_LIGHTHOUSE_ISLAND_001`
- LOD requirements:
  - `LOD0`: clustered organic form preserved
  - `LOD1`: silhouette mass preserved
  - `LOD2`: single simple organic block
- polygon targets:
  - `LOD0`: `160-280`
  - `LOD1`: `70-140`
  - `LOD2`: `12-28`
- materials:
  - `MAT_BUSH_STANDARD_001`
- reuse opportunities:
  - house frontage planting
  - civic entry landscaping
  - commercial softening
  - motel and lighthouse site planting

### 5.3 `MOD_TREE_EUCALYPTUS_STANDARD_001`

- asset ID: `MOD_TREE_EUCALYPTUS_STANDARD_001`
- category: `LANDSCAPE`
- dimensions:
  - young height: `4.5m`
  - mature height: `6.5m`
  - roadside canopy spread: `2.8m-4.5m`
- variants:
  - young tree
  - mature tree
  - roadside tree
- sockets:
  - `SOCKET_LANDSCAPE_PATCH`
- compatible recipes:
  - all current residential recipes
  - `RECIPE_SCHOOL_SMALL_TOWN_001`
  - `RECIPE_POLICE_STATION_SUBURBAN_001`
  - `RECIPE_FIRE_STATION_SMALL_001`
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
  - `RECIPE_LIGHTHOUSE_ISLAND_001`
- LOD requirements:
  - `LOD0`: trunk and canopy breakup preserved
  - `LOD1`: silhouette and crown preserved
  - `LOD2`: simplified tree mass preserved
- polygon targets:
  - `LOD0`: `900-1600`
  - `LOD1`: `450-900`
  - `LOD2`: `80-180`
- materials:
  - `MAT_TREE_EUCALYPTUS_TRUNK_001`
  - `MAT_TREE_EUCALYPTUS_LEAF_001`
- reuse opportunities:
  - coastal identity planting
  - roadside rhythm
  - landmark framing
  - civic grounds

### 5.4 `MOD_FLOWERBED_STANDARD_001`

- asset ID: `MOD_FLOWERBED_STANDARD_001`
- category: `LANDSCAPE`
- dimensions:
  - patch size: `1.2m x 0.8m`
  - height: `0.3m-0.5m`
- variants:
  - small garden bed
  - civic planting
  - commercial planter
- sockets:
  - `SOCKET_LANDSCAPE_PATCH`
  - `SOCKET_PATH_ENTRY`
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_BAKERY_COASTAL_001`
  - `RECIPE_CAFE_SMALL_TOWN_001`
  - `RECIPE_SCHOOL_SMALL_TOWN_001`
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
- LOD requirements:
  - `LOD0`: planting cluster readability preserved
  - `LOD1`: broad colour mass preserved
  - `LOD2`: simple accent patch
- polygon targets:
  - `LOD0`: `160-260`
  - `LOD1`: `60-120`
  - `LOD2`: `10-22`
- materials:
  - `MAT_BUSH_STANDARD_001`
  - `MAT_GRASS_COASTAL_001`
- reuse opportunities:
  - cottage and suburban fronts
  - civic entry softening
  - commercial frontage polish

## 6. House Improvement Module Production Plan

### 6.1 `MOD_VERANDAH_STANDARD_TIMBER_001`

- asset ID: `MOD_VERANDAH_STANDARD_TIMBER_001`
- category: `EXTERIOR`
- dimensions:
  - depth: `1.6m-2.0m`
  - standard run: `3.0m-6.0m`
  - walking surface height aligned to foundation top
- variants:
  - front verandah
  - side verandah
  - wrap-around option
- sockets:
  - `SOCKET_PATH_ENTRY`
  - `SOCKET_PROPERTY_EDGE`
  - `SOCKET_BOTTOM_EDGE`
  - `SOCKET_LEFT_EDGE`
  - `SOCKET_RIGHT_EDGE`
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_BEACH_BUNGALOW_001`
  - `RECIPE_CAFE_SMALL_TOWN_001`
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
- LOD requirements:
  - `LOD0`: post rhythm and deck layering preserved
  - `LOD1`: deck depth and cover silhouette preserved
  - `LOD2`: frontage shade silhouette only
- polygon targets:
  - `LOD0`: `260-420`
  - `LOD1`: `120-220`
  - `LOD2`: `24-50`
- materials:
  - `MAT_TIMBER_DECK_STANDARD_001`
  - `MAT_TRIM_STANDARD_COASTAL_001`
- reuse opportunities:
  - coastal homes
  - beach bungalows
  - hospitality frontages
  - motel access strips

### 6.2 `MOD_PORCH_COASTAL_SMALL_001`

- asset ID: `MOD_PORCH_COASTAL_SMALL_001`
- category: `EXTERIOR`
- dimensions:
  - width: `1.4m-2.0m`
  - depth: `0.8m-1.2m`
  - height aligned to entry threshold
- variants:
  - small entrance porch
  - coastal style
- sockets:
  - `SOCKET_PATH_ENTRY`
  - `SOCKET_DOOR_STANDARD`
  - `SOCKET_BOTTOM_EDGE`
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_SUBURBAN_BRICK_001`
  - `RECIPE_HOUSE_BEACH_BUNGALOW_001`
- LOD requirements:
  - `LOD0`: threshold depth and step logic preserved
  - `LOD1`: porch silhouette preserved
  - `LOD2`: entry platform preserved
- polygon targets:
  - `LOD0`: `120-220`
  - `LOD1`: `56-100`
  - `LOD2`: `12-20`
- materials:
  - `MAT_TIMBER_DECK_STANDARD_001`
  - `MAT_TRIM_STANDARD_COASTAL_001`
- reuse opportunities:
  - all small-house entry variations
  - suburban house entry upgrades

### 6.3 `MOD_TRIM_STANDARD_COASTAL_001`

- asset ID: `MOD_TRIM_STANDARD_COASTAL_001`
- category: `EXTERIOR`
- dimensions:
  - trim strip depth: `0.04m-0.08m`
  - profile width varies by application
- variants:
  - roof trim
  - window trim
  - decorative trim
- sockets:
  - `SOCKET_TOP_EDGE`
  - `SOCKET_WINDOW_STANDARD`
  - `SOCKET_WINDOW_LARGE`
  - `SOCKET_ROOF_EAVE`
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_BEACH_BUNGALOW_001`
  - `RECIPE_BAKERY_COASTAL_001`
  - `RECIPE_CAFE_SMALL_TOWN_001`
  - `RECIPE_MOTEL_SMALL_COASTAL_001`
- LOD requirements:
  - `LOD0`: trim profile and edge separation preserved
  - `LOD1`: broad trim read preserved
  - `LOD2`: merged decorative edge treatment only
- polygon targets:
  - `LOD0`: `80-180` per trim application
  - `LOD1`: `30-70`
  - `LOD2`: `6-18`
- materials:
  - `MAT_TRIM_STANDARD_COASTAL_001`
  - `MAT_WINDOW_FRAME_WHITE_001`
- reuse opportunities:
  - coastal houses
  - beach bungalows
  - bakery and cafe polish
  - motel room frontage cleanup

### 6.4 `MOD_CHIMNEY_COASTAL_SMALL_001`

- asset ID: `MOD_CHIMNEY_COASTAL_SMALL_001`
- category: `ROOF`
- dimensions:
  - width: `0.4m-0.6m`
  - depth: `0.4m-0.6m`
  - height above roof plane: `0.8m-1.2m`
- variants:
  - small chimney
  - roof compatibility variant
- sockets:
  - `SOCKET_ROOF_RIDGE`
  - `SOCKET_ROOF_EAVE` for offset mounting rules
- compatible recipes:
  - `RECIPE_HOUSE_COASTAL_COTTAGE_001`
  - `RECIPE_HOUSE_BEACH_BUNGALOW_001`
  - selected future cottage and bakery variants
- LOD requirements:
  - `LOD0`: chimney form and cap preserved
  - `LOD1`: silhouette and roof read preserved
  - `LOD2`: simplified vertical roof accent
- polygon targets:
  - `LOD0`: `90-160`
  - `LOD1`: `36-70`
  - `LOD2`: `8-16`
- materials:
  - `MAT_BRICK_RED_001`
  - `MAT_RENDER_CREAM_001`
  - `MAT_TRIM_STANDARD_COASTAL_001`
- reuse opportunities:
  - cottages
  - beach bungalows
  - selected hospitality and bakery identity accents

## 7. Production Priority Ranking

Modules are ranked by:

1. number of future recipes unlocked
2. visual impact
3. performance value

### Priority tier 1 - widest unlock value

1. `MOD_PATH_STANDARD_001`
2. `MOD_FENCE_STANDARD_001`
3. `MOD_GROUND_GRASS_STANDARD_001`
4. `MOD_BUSH_NATIVE_STANDARD_001`
5. `MOD_TREE_EUCALYPTUS_STANDARD_001`

### Priority tier 2 - residential and civic lot completion

6. `MOD_DRIVEWAY_STANDARD_SINGLE_001`
7. `MOD_FLOWERBED_STANDARD_001`
8. `MOD_VERANDAH_STANDARD_TIMBER_001`

### Priority tier 3 - cottage polish and future frontage value

9. `MOD_PORCH_COASTAL_SMALL_001`
10. `MOD_TRIM_STANDARD_COASTAL_001`
11. `MOD_CHIMNEY_COASTAL_SMALL_001`

## 8. Future Recipe Impact

### Strongest unlock impact

These modules have the broadest near-term impact:

- `MOD_PATH_STANDARD_001`
- `MOD_FENCE_STANDARD_001`
- `MOD_GROUND_GRASS_STANDARD_001`
- `MOD_BUSH_NATIVE_STANDARD_001`
- `MOD_TREE_EUCALYPTUS_STANDARD_001`

They directly improve:

- current coastal cottage quality
- suburban house completion
- beach bungalow completion
- civic lot readability
- motel and lighthouse site composition

### Secondary unlock impact

These modules improve asset character and finish:

- `MOD_VERANDAH_STANDARD_TIMBER_001`
- `MOD_PORCH_COASTAL_SMALL_001`
- `MOD_TRIM_STANDARD_COASTAL_001`
- `MOD_CHIMNEY_COASTAL_SMALL_001`

They matter most for:

- cottage identity
- beach bungalow variation
- cafe and bakery frontage polish
- motel and coastal family consistency

## 9. Validation Requirements After Production

After these modules are produced, validate:

- module naming
- socket compatibility
- reuse potential
- style consistency
- LOD readiness
- export readiness

### Validation rule

No module in this expansion batch should be accepted purely because it looks complete in isolation.

Each module must be judged by:

- compatibility with existing recipe rules
- compatibility with Session 7.5 socket definitions
- future reuse impact
- proof-build style continuity

## 10. Production Task Breakdown

The following production tasks convert the Session 15 plan into an execution-ready batch without changing architecture or asset scope.

### Task group A - site circulation and boundary kit

Create and validate:

1. `MOD_PATH_STANDARD_001`
2. `MOD_DRIVEWAY_STANDARD_SINGLE_001`
3. `MOD_FENCE_STANDARD_001`

Execution purpose:

- unlock lot circulation for residential, civic, and accommodation recipes
- complete frontage and property edge logic for the existing coastal cottage
- establish shared site sockets before broader building-family expansion

### Task group B - base landscape kit

Create and validate:

1. `MOD_GROUND_GRASS_STANDARD_001`
2. `MOD_BUSH_NATIVE_STANDARD_001`
3. `MOD_TREE_EUCALYPTUS_STANDARD_001`
4. `MOD_FLOWERBED_STANDARD_001`

Execution purpose:

- complete the core coastal landscape language
- improve residential lot readability
- unlock reusable planting for civic, hospitality, and landmark recipes

### Task group C - house frontage and detail kit

Create and validate:

1. `MOD_VERANDAH_STANDARD_TIMBER_001`
2. `MOD_PORCH_COASTAL_SMALL_001`
3. `MOD_TRIM_STANDARD_COASTAL_001`
4. `MOD_CHIMNEY_COASTAL_SMALL_001`

Execution purpose:

- improve proof-asset finish quality
- unlock future coastal-house variants
- provide transferable frontage detail for bakery, cafe, motel, and bungalow recipes

### Task group D - proof asset regression validation

After Task groups A-C are complete, run a controlled validation pass against:

- `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- `RECIPE_HOUSE_COASTAL_COTTAGE_001`

Regression checks:

- existing cottage naming unchanged
- existing cottage assembly logic unchanged
- new modules connect without socket conflicts
- LOD expectations remain consistent
- export readiness remains intact

## 11. Production Readiness Status

This Layer A expansion batch is ready as a production-planning package.

Ready:

- module list is locked
- variants are defined
- sockets are defined
- recipe compatibility is defined
- LOD expectations are defined
- priority order is defined

Still intentionally deferred:

- actual module production
- Blender execution
- export validation runs

## 12. Session Outcome

Session 15 defines the first high-value Layer A expansion batch after the successful cottage proof build.

It preserves the approved architecture and naming system while focusing the next production effort on reusable modules with the strongest future recipe impact.

No new buildings are created in this session.
