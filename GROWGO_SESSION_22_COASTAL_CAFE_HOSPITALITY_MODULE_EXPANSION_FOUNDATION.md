# GrowGo Session 22 - Coastal Cafe Hospitality Module Expansion Foundation

## Session Scope

This document defines the first reusable hospitality Layer A module expansion required for the future assembly of:

- `RECIPE_CAFE_COASTAL_001`
- `BUILDING_CAFE_COASTAL_001`

This session is planning and specification only.

This session does not:

- create Blender assets
- export GLBs
- create Layer C buildings
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## 1. Source of Truth

This Session 22 module foundation is based on:

- `GROWGO_SESSION_21_COASTAL_CAFE_RECIPE_ASSEMBLY_TEST_FOUNDATION.md`
- `GROWGO_SESSION_20_5_BEACH_BUNGALOW_VALIDATION_AND_BUILDING_LIBRARY_REGISTRATION.md`
- `GROWGO_SESSION_19_5_COASTAL_EXPANSION_VALIDATION_AND_LIBRARY_REGISTRATION.md`
- existing Modular Bible and Asset Factory specification documents for:
  - commercial facade planning
  - socket rules
  - LOD rules
  - reuse-first production logic

## 2. Expansion Purpose

The coastal cafe recipe foundation established that the first commercial coastal building can already reuse the current coastal shell, glazing, deck, path, trim, and landscape kit.

What is still missing is the small hospitality identity set that makes a cafe read clearly as:

- public
- welcoming
- service-oriented
- street-active
- reusable across future commercial families

This module batch exists to define those missing reusable Layer A hospitality pieces before Blender production begins.

## 3. Design Rules

### Visual style

All modules in this batch must follow:

- GrowGo papercut 2.5D
- lightweight mobile-first construction
- Australian coastal identity
- bright and welcoming presentation
- compatibility with the existing coastal asset family

### Performance rules

All modules in this batch must support:

- modular geometry
- shared materials
- low polygon counts
- instancing-friendly layouts where practical
- `LOD0`, `LOD1`, and `LOD2` readiness

### Reuse rules

All modules in this batch must be defined as reusable Layer A assets, not one-off cafe-only geometry when broader hospitality reuse is possible.

## 4. Target Future Building

### Future recipe

- `RECIPE_CAFE_COASTAL_001`

### Future building

- `BUILDING_CAFE_COASTAL_001`

### Primary hospitality needs this batch must support

- recognisable street-facing cafe frontage
- legible sign identity
- clear service-counter or service-window logic
- outdoor seating or social frontage zone

## 5. Module Specification - `MOD_AWNING_COASTAL_CAFE_001`

### Asset identity

- asset ID: `MOD_AWNING_COASTAL_CAFE_001`
- category: `EXTERIOR`
- family: `AWNING_COMMERCIAL_COASTAL`

### Purpose

- recognisable cafe frontage identity
- weather cover for glazing, entry, and seating edge

### Variants

- shallow cafe awning
- deep seating awning
- corner return awning
- striped coastal awning

### Dimensions

- standard frontage width coverage: `2.4m-4.8m`
- projection depth:
  - shallow: `0.9m-1.2m`
  - deep: `1.4m-1.8m`
- fascia depth: `0.25m-0.4m`

### Sockets

- `SOCKET_AWNING_EDGE`
- `SOCKET_SIGN_FACE`
- `SOCKET_WINDOW_LARGE`
- `SOCKET_DOOR_ENTRY`
- `SOCKET_COLUMN_SUPPORT`

### Socket rules

- must align cleanly with storefront or large-window facade rhythm
- must preserve sign band clearance
- must not block the entry read from the primary north-facing camera
- deeper variants must remain compatible with seating frontage zones

### Materials

- `MAT_AWNING_COASTAL_CANVAS_001`
- `MAT_AWNING_FRAME_WHITE_001`
- `MAT_AWNING_FRAME_COASTAL_BLUE_001`

### Polygon targets

- `LOD0`: `180-280`
- `LOD1`: `70-120`
- `LOD2`: `16-28`

### LOD requirements

- `LOD0`: canopy edge, fascia, and support read clearly
- `LOD1`: awning plane and frontage silhouette preserved
- `LOD2`: treated as a simple facade lip and hospitality marker

### Compatible recipes

- `RECIPE_CAFE_COASTAL_001`
- `RECIPE_BAKERY_COASTAL_001`
- future kiosk recipes
- future beach shop recipes
- future small restaurant recipes

### Reuse opportunities

- cafes
- bakeries
- kiosks
- beach shops
- markets
- restaurants

### Recipes unlocked

- first-pass coastal cafe frontage
- coastal bakery variants
- small hospitality strip variants

## 6. Module Specification - `MOD_CAFE_SIGN_STANDARD_001`

### Asset identity

- asset ID: `MOD_CAFE_SIGN_STANDARD_001`
- category: `EXTERIOR`
- family: `SIGNAGE_COMMERCIAL_COASTAL`

### Purpose

- commercial identity and signage anchor
- visual cue that distinguishes a hospitality frontage from residential and civic assets

### Sign variants

- hanging cafe sign
- wall fascia sign
- narrow vertical side sign
- simple bakery-cafe shared sign panel

### Mounting rules

- must attach to `MOD_SIGN_MOUNT_STANDARD_001` where available
- must also support direct facade-band mounting
- hanging variants require bracket clearance from glazing and door swing zones

### Orientation rules

- main readable face must favor the road-facing or pedestrian-facing facade
- side signs must remain readable from angled overview positions
- sign placement must avoid roofline clutter and preserve a clean papercut silhouette

### Sockets

- `SOCKET_SIGN_FACE`
- `SOCKET_SIGN_BRACKET`
- `SOCKET_FACADE_BAND`
- `SOCKET_AWNING_EDGE`

### Materials

- `MAT_SIGN_COASTAL_CREAM_001`
- `MAT_SIGN_COASTAL_BLUE_001`
- `MAT_SIGN_COASTAL_RED_001`
- `MAT_SIGN_FRAME_WHITE_001`

### Polygon targets

- `LOD0`: `90-160`
- `LOD1`: `36-72`
- `LOD2`: `8-20`

### LOD requirements

- `LOD0`: sign shape and bracket form readable
- `LOD1`: sign panel silhouette preserved
- `LOD2`: sign reduces to a simple readable identity block

### Compatible recipes

- `RECIPE_CAFE_COASTAL_001`
- `RECIPE_BAKERY_COASTAL_001`
- future kiosk recipes
- future market stall recipes
- future beach retail recipes

### Reuse opportunities

- cafes
- bakeries
- kiosks
- beach shops
- markets
- restaurants

### Recipes unlocked

- first-pass coastal cafe branding
- bakery and hospitality frontage branding
- future small commercial strip identity reuse

## 7. Module Specification - `MOD_SERVICE_WINDOW_CAFE_001`

### Asset identity

- asset ID: `MOD_SERVICE_WINDOW_CAFE_001`
- category: `OPENING`
- family: `WINDOW_SERVICE_HOSPITALITY`

### Purpose

- cafe and bakery service frontage opening
- supports takeaway, counter presentation, and service identity

### Window variants

- full-width service window
- split service/display window
- compact takeaway hatch
- bakery display counter opening

### Opening styles

- fixed glazed lower counter with open upper service band
- sliding service opening
- awning-style outward open service panel

### Counter relationship

- must support clear counter sill height
- must align with a customer-facing frontage zone
- must allow optional pairing with outdoor seating or queue path

### Sockets

- `SOCKET_WINDOW_LARGE`
- `SOCKET_SERVICE_COUNTER`
- `SOCKET_SIGN_FACE`
- `SOCKET_AWNING_EDGE`

### Socket rules

- must align with facade mullion rhythm
- must not conflict with entry-door placement
- sign band clearance must remain above the opening
- service sill must remain readable in 2.5D overview framing

### Materials

- `MAT_STORE_GLASS_COASTAL_001`
- `MAT_COUNTER_COASTAL_LIGHT_001`
- `MAT_FRAME_WHITE_001`

### Polygon targets

- `LOD0`: `160-240`
- `LOD1`: `72-120`
- `LOD2`: `18-32`

### LOD requirements

- `LOD0`: service opening and counter edge clearly visible
- `LOD1`: service-window rhythm preserved
- `LOD2`: simplified hospitality opening block

### Compatible recipes

- `RECIPE_CAFE_COASTAL_001`
- `RECIPE_BAKERY_COASTAL_001`
- future kiosk recipes
- future market-food recipes

### Reuse opportunities

- cafes
- bakeries
- kiosks
- market stalls
- food counters

### Recipes unlocked

- service-led coastal cafe facade
- bakery frontage with public counter identity

## 8. Module Specification - `MOD_OUTDOOR_TABLE_SEATING_COASTAL_001`

### Asset identity

- asset ID: `MOD_OUTDOOR_TABLE_SEATING_COASTAL_001`
- category: `SITE_PROP`
- family: `HOSPITALITY_SEATING_COASTAL`

### Purpose

- outdoor cafe gameplay and social area
- reusable seating cluster for hospitality frontage activation

### Seating variants

- two-seat round table set
- four-seat square table set
- bench-and-table set
- umbrella table variant

### Table and chair arrangements

- compact frontage pair
- standard social cluster
- edge-aligned deck cluster
- path-side terrace cluster

### Footprint

- two-seat set: `1.4m x 1.4m`
- four-seat set: `1.8m x 1.8m`
- bench cluster: `2.2m x 1.6m`
- umbrella clearance zone: up to `2.2m x 2.2m`

### Modular placement

- must place cleanly on deck or path-adjacent terrace pads
- must allow multiple clusters without overlap
- must remain readable from overview zoom without cluttering the facade

### Sockets

- `SOCKET_SEATING_PAD`
- `SOCKET_DECK_EDGE`
- `SOCKET_PATH_ENTRY`
- `SOCKET_SOCIAL_CLUSTER`

### Socket rules

- clusters must preserve entry access
- deck-edge placement must keep guard or facade clearance
- umbrella variants must not visually block the sign band from core overview angles

### Materials

- `MAT_TABLE_TOP_COASTAL_001`
- `MAT_CHAIR_COASTAL_WHITE_001`
- `MAT_CHAIR_COASTAL_BLUE_001`
- `MAT_UMBRELLA_COASTAL_STRIPE_001`

### Polygon targets

- `LOD0`: `220-360`
- `LOD1`: `90-150`
- `LOD2`: `20-40`

### LOD requirements

- `LOD0`: table and chair arrangement readable
- `LOD1`: seating cluster mass preserved
- `LOD2`: simplified hospitality cluster silhouette

### Compatible recipes

- `RECIPE_CAFE_COASTAL_001`
- `RECIPE_BAKERY_COASTAL_001`
- future motel dining recipes
- future resort hospitality recipes
- future market and beach-shop food frontage recipes

### Reuse opportunities

- cafes
- bakeries
- kiosks
- markets
- restaurants
- motel dining areas

### Recipes unlocked

- outdoor coastal cafe frontage
- bakery terrace variants
- broader hospitality public-space activation

## 9. Reuse Impact Analysis

### `MOD_AWNING_COASTAL_CAFE_001`

Primary impact:

- unlocks hospitality frontage identity across multiple commercial families

Future uses:

- cafes
- bakeries
- kiosks
- beach shops
- markets
- restaurants

### `MOD_CAFE_SIGN_STANDARD_001`

Primary impact:

- unlocks readable coastal hospitality branding without one-off sign modelling

Future uses:

- cafes
- bakeries
- kiosks
- beach shops
- markets

### `MOD_SERVICE_WINDOW_CAFE_001`

Primary impact:

- unlocks service-oriented facades and takeaway-read commercial fronts

Future uses:

- cafes
- bakeries
- kiosks
- market-food stalls

### `MOD_OUTDOOR_TABLE_SEATING_COASTAL_001`

Primary impact:

- unlocks a public-facing social frontage system for hospitality spaces

Future uses:

- cafes
- bakeries
- motels
- resorts
- restaurants

## 10. Production Priority

Recommended order:

1. `MOD_AWNING_COASTAL_CAFE_001`
2. `MOD_CAFE_SIGN_STANDARD_001`
3. `MOD_SERVICE_WINDOW_CAFE_001`
4. `MOD_OUTDOOR_TABLE_SEATING_COASTAL_001`

### Priority rationale

#### 1. `MOD_AWNING_COASTAL_CAFE_001`

- strongest facade identity value
- highest immediate hospitality read
- broadest crossover into bakery and beach-shop recipes

#### 2. `MOD_CAFE_SIGN_STANDARD_001`

- completes commercial identity readability
- lightweight module with broad reuse

#### 3. `MOD_SERVICE_WINDOW_CAFE_001`

- important for public-facing cafe and bakery behavior
- slightly more facade-specific than awning or sign systems

#### 4. `MOD_OUTDOOR_TABLE_SEATING_COASTAL_001`

- important for hospitality atmosphere
- can be added after the primary building frontage identity is resolved

## 11. Validation Requirements

Before Blender production approval, each module should validate:

### Geometry

- polygon budget within target
- clean topology
- stable silhouette in 2.5D overview

### Modularity

- socket compatibility
- attachment clarity
- repeatable placement rules

### Style

- papercut 2.5D readability
- coastal-family consistency
- bright, welcoming hospitality identity

### Technical

- naming compliance
- material naming compliance
- `LOD0`, `LOD1`, `LOD2` definition complete
- metadata readiness

### Reuse

- supports more than one hospitality recipe where practical
- does not duplicate an already-approved module

## 12. Readiness for Blender Production

### Current status

- module specifications: ready
- reuse analysis: ready
- production order: ready
- validation requirements: ready

### Remaining pre-production needs

- confirm exact commercial facade shell pairing for the first cafe build
- confirm whether sign mount is reused directly or wrapped by a cafe-specific sign variant
- confirm whether outdoor seating ships in one starter cluster or a broader set of variants

### Readiness summary

This hospitality module batch is ready for the next step:

- controlled Blender production planning for a commercial Layer A expansion batch

It is not yet a production execution session.

## 13. Session Outcome

This session establishes:

1. the first reusable hospitality Layer A module set for the coastal commercial family
2. the module-level rules required to support `BUILDING_CAFE_COASTAL_001`
3. a reuse-first commercial expansion path that stays consistent with the proven coastal residential workflow
