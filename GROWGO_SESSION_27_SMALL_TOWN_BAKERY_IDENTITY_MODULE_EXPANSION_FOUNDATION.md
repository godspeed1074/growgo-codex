# GrowGo Session 27 - Small Town Bakery Identity Module Expansion Foundation

## Session Scope

This document defines the reusable Layer A bakery identity modules required for the future assembly of:

- `RECIPE_BAKERY_SMALL_TOWN_001`
- `BUILDING_BAKERY_SMALL_TOWN_001`

Family:

- `FAMILY_COMMERCIAL_SMALL_TOWN`

This session is specification only.

This session does not:

- create Blender assets
- export GLBs
- create a Layer C bakery building
- duplicate cafe modules
- modify existing Layer A modules
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## 1. Source of Truth

This Session 27 module foundation is based on:

- `GROWGO_SESSION_26_SMALL_TOWN_BAKERY_RECIPE_ASSEMBLY_TEST_FOUNDATION.md`
- `GROWGO_SESSION_25_5_COASTAL_CAFE_VALIDATION_AND_BUILDING_LIBRARY_REGISTRATION.md`
- `GROWGO_SESSION_23_5_COASTAL_CAFE_HOSPITALITY_MODULE_VALIDATION_AND_LIBRARY_REGISTRATION.md`
- existing Modular Bible and Asset Factory Layer A reuse rules

Relevant continuity:

- the cafe path proved that commercial buildings can be assembled from shared Layer A modules
- the hospitality module batch already established a reusable frontage identity pattern
- the bakery path should extend that pattern with bakery-specific identity pieces, not one-off geometry

## 2. Expansion Purpose

The bakery recipe foundation established that the small-town bakery can already reuse the current commercial shell, path, landscape, roof, and large-window vocabulary.

What is still missing is the bakery identity layer that makes the building read clearly as:

- bakery-first
- display-led
- counter-service oriented
- readable from overview, gameplay, and map distance
- reusable across future small food-retail buildings

This module batch exists to define those missing reusable Layer A commercial identity pieces before Blender production begins.

## 3. Style Requirements

All modules in this batch must follow:

- GrowGo papercut 2.5D
- lightweight mobile-first construction
- Australian small-town commercial identity
- bright welcoming colors
- simple readable silhouettes
- reusable modular construction

The bakery identity set should feel:

- warmer and more retail-focused than the cafe hospitality set
- still compatible with the existing coastal and small-town commercial family
- strong enough to differentiate bakery from cafe without breaking the shared commercial language

## 4. Performance Requirements

All modules in this batch must support:

- low polygon budgets
- limited material counts
- shared material strategy with the existing commercial library
- clear `LOD_CLOSE`, `LOD_GAMEPLAY`, and `LOD_MAP` behavior
- instancing-friendly layouts where repetition is helpful

### Shared material strategy

Recommended material behavior for the full batch:

- reuse existing commercial facade and sign palette where possible
- prefer a small shared bakery accent palette:
  - cream
  - warm red
  - warm yellow
  - soft brown
  - white trim
- avoid introducing unique materials per variant when color variation can be handled through a shared palette

### Material limits

Recommended limits:

- facade-facing module materials: `1-2`
- sign/icon modules: `1-2`
- counter/display modules: `1-2`

### Instancing approach

- repeated trays, loaves, or small display accents should be planned as instancing-friendly sub-elements where practical
- rooftop icons should be treated as optional identity accents rather than dense unique geometry
- counter and display arrangements should prefer swappable layout variants over bespoke meshes per recipe

## 5. Target Future Building

### Future recipe

- `RECIPE_BAKERY_SMALL_TOWN_001`

### Future building

- `BUILDING_BAKERY_SMALL_TOWN_001`

### Bakery identity needs this batch must support

- strong customer-facing display frontage
- direct bakery sign identity
- obvious counter-service read
- long-distance bakery recognition option

## 6. Module Specification - `MOD_BAKERY_DISPLAY_WINDOW_001`

### Asset identity

- asset ID: `MOD_BAKERY_DISPLAY_WINDOW_001`
- category: `OPENING`
- family: `DISPLAY_WINDOW_COMMERCIAL_SMALL_TOWN`

### Purpose

- primary bakery identity feature
- stronger retail display read than the existing cafe service-window logic

### Variants

- single large display window
- double-pane bakery display window
- corner display frontage
- narrow pastry-display window

### Dimensions

- standard width range: `1.8m-3.2m`
- standard height range: `1.6m-2.2m`
- sill/counter height: `0.8m-1.0m`
- display depth zone: `0.35m-0.6m`

### Display arrangements

- bread-led display
- pastry-led display
- cake-shop display
- mixed small-town bakery display

### Glass and display rules

- glazing must remain clear and readable from the north-facing gameplay camera
- display contents should read as simplified silhouette clusters, not dense micro-detail
- display depth must support a retail read without creating heavy geometry
- corner variants must preserve facade rhythm and sign visibility

### Socket requirements

- `SOCKET_WINDOW_LARGE`
- `SOCKET_DISPLAY_WINDOW`
- `SOCKET_COUNTER_FRONTAGE`
- `SOCKET_FACADE_BAND`

### Socket rules

- must attach cleanly to existing large-window facade openings
- must preserve entry clearance and sign readability
- must support adjacency with a customer-facing counter module

### Materials

- `MAT_GLASS_COMMERCIAL_CLEAR_001`
- `MAT_FRAME_BAKERY_CREAM_001`
- `MAT_FRAME_BAKERY_RED_001`
- `MAT_DISPLAY_WOOD_LIGHT_001`

### Polygon targets

- `LOD_CLOSE`: `220-360`
- `LOD_GAMEPLAY`: `90-160`
- `LOD_MAP`: `18-32`

### LOD expectations

- `LOD_CLOSE`: frame, glazing, and simplified display silhouette all readable
- `LOD_GAMEPLAY`: frame and display band remain identifiable
- `LOD_MAP`: reduced to a clean storefront display block

### Compatible recipes

- `RECIPE_BAKERY_SMALL_TOWN_001`
- future coastal bakery recipes
- future pastry shop recipes
- future cake shop recipes
- future small food-store recipes

### Reuse opportunities

- bakeries
- pastry shops
- cake shops
- small food stores
- deli-style storefronts

### Seasonal and event uses

- holiday bakery fronts
- festival market bakery stalls
- special-event dessert storefronts

### Recipes unlocked

- first small-town bakery
- bakery variants across coastal and town commercial families
- pastry-led food-retail storefront recipes

## 7. Module Specification - `MOD_BAKERY_SIGN_STANDARD_001`

### Asset identity

- asset ID: `MOD_BAKERY_SIGN_STANDARD_001`
- category: `EXTERIOR`
- family: `SIGNAGE_COMMERCIAL_SMALL_TOWN`

### Purpose

- recognizable bakery frontage identity
- clearer bakery-specific branding than the existing cafe sign family

### Sign variants

- fascia bakery sign
- hanging bakery sign
- narrow vertical bakery sign
- compact corner bakery sign

### Mounting methods

- direct facade-band mount
- awning-adjacent mount
- bracket-mounted hanging sign
- corner-face mounting for angled pedestrian visibility

### Orientation rules

- primary sign face must favor the road-facing or pedestrian-facing frontage
- hanging variants should remain readable from angled overview views
- signage must not block display-window visibility or break the clean roof silhouette

### Socket requirements

- `SOCKET_SIGN_FACE`
- `SOCKET_SIGN_BRACKET`
- `SOCKET_FACADE_BAND`
- `SOCKET_AWNING_EDGE`

### Materials

- `MAT_SIGN_BAKERY_CREAM_001`
- `MAT_SIGN_BAKERY_RED_001`
- `MAT_SIGN_BAKERY_YELLOW_001`
- `MAT_SIGN_FRAME_WHITE_001`

### Polygon targets

- `LOD_CLOSE`: `100-170`
- `LOD_GAMEPLAY`: `40-80`
- `LOD_MAP`: `8-20`

### LOD expectations

- `LOD_CLOSE`: sign face and bracket shape readable
- `LOD_GAMEPLAY`: sign silhouette and bakery color block preserved
- `LOD_MAP`: reduced to a simple bakery identity marker

### Reuse opportunities

- bakeries
- cafes
- markets
- food stalls
- pastry kiosks

### Seasonal and event uses

- seasonal bakery branding
- farmers market signage
- festival food-stall signage

### Recipes unlocked

- small-town bakery frontage branding
- future bakery variants
- shared small food-retail sign identity family

## 8. Module Specification - `MOD_BAKERY_COUNTER_FRONTAGE_001`

### Asset identity

- asset ID: `MOD_BAKERY_COUNTER_FRONTAGE_001`
- category: `INTERIOR_FRONTAGE`
- family: `COUNTER_COMMERCIAL_SMALL_TOWN`

### Purpose

- customer interaction and front-counter identity
- clearer bakery service read than the cafe service-window module alone

### Counter variants

- straight bakery counter
- glass-front pastry counter
- compact corner service counter
- takeaway-led compact counter

### Service layouts

- entry-adjacent counter
- display-window-backed counter
- side-service compact counter
- corner queue-friendly counter

### Placement rules

- counter must align to the main customer frontage
- counter should remain visible from the entry and gameplay camera
- placement must not obstruct path of travel from door to service zone
- counter should pair cleanly with `MOD_BAKERY_DISPLAY_WINDOW_001` where used

### Sockets

- `SOCKET_SERVICE_COUNTER`
- `SOCKET_COUNTER_FRONTAGE`
- `SOCKET_DISPLAY_WINDOW`
- `SOCKET_FLOOR_EDGE`

### Materials

- `MAT_COUNTER_WOOD_LIGHT_001`
- `MAT_COUNTER_TRIM_CREAM_001`
- `MAT_COUNTER_GLASS_CLEAR_001`

### Polygon targets

- `LOD_CLOSE`: `180-300`
- `LOD_GAMEPLAY`: `70-130`
- `LOD_MAP`: `12-24`

### LOD expectations

- `LOD_CLOSE`: counter profile and service-face read preserved
- `LOD_GAMEPLAY`: counter silhouette and customer-facing edge preserved
- `LOD_MAP`: reduced to a simple frontage-service block if visible at all

### Reuse opportunities

- bakeries
- cafes
- kiosks
- takeaway shops
- pastry counters

### Seasonal and event uses

- pop-up food counters
- market kiosks
- event bakery stands

### Recipes unlocked

- bakery service-front recipes
- pastry and takeaway counter variants
- future small kiosk and market food-retail paths

## 9. Module Specification - `MOD_BAKERY_ROOFTOP_ICON_001`

### Asset identity

- asset ID: `MOD_BAKERY_ROOFTOP_ICON_001`
- category: `LANDMARK_IDENTITY`
- family: `ICON_COMMERCIAL_SMALL_TOWN`

### Purpose

- long-distance recognition marker
- optional bakery-specific silhouette accent for gameplay and POI readability

### Icon variants

- bread loaf icon
- rolling-pin icon
- pastry crest icon
- wheat bundle icon

### Size

- icon width: `0.8m-1.6m`
- icon height: `0.6m-1.4m`
- support height above roofline: `0.25m-0.6m`

### Mounting rules

- must attach to a stable roof ridge or facade-top mount point
- should preserve clean roof silhouette from the main camera
- should only be used where the building benefits from extra long-distance identity

### Visibility rules

- icon should improve recognition at distance without becoming visually noisy
- must not overpower the primary sign or the display-window identity
- should be optional in recipes where the bakery already reads clearly

### Socket requirements

- `SOCKET_ROOF_RIDGE`
- `SOCKET_ICON_TOP`
- `SOCKET_FACADE_TOP`

### Materials

- `MAT_ICON_BAKERY_CREAM_001`
- `MAT_ICON_BAKERY_RED_001`
- `MAT_ICON_FRAME_WHITE_001`

### Polygon targets

- `LOD_CLOSE`: `90-150`
- `LOD_GAMEPLAY`: `32-60`
- `LOD_MAP`: `6-14`

### LOD expectations

- `LOD_CLOSE`: icon silhouette and support shape readable
- `LOD_GAMEPLAY`: icon silhouette preserved
- `LOD_MAP`: simplified to a minimal POI recognition accent or omitted if unnecessary

### Reuse opportunities

- bakery landmarks
- food landmarks
- POI recognition
- festival food nodes

### Seasonal and event uses

- seasonal market roofs
- event food landmarks
- holiday bakery promotion variants

### Recipes unlocked

- bakery POI-enhanced variants
- special bakery landmark recipes
- event-focused food storefront variants

## 10. Validation Requirements

Before production approval, each module should validate:

- naming compliance
- socket compatibility
- compatible recipe list
- style consistency with the commercial family
- shared material compliance
- polygon target readiness
- LOD readiness
- export readiness

### Batch-level validation

The bakery identity module batch should also validate:

- no duplicate cafe modules are recreated
- each bakery-specific module adds real identity separation
- the bakery path remains compatible with the existing commercial shell
- future reuse across food-retail recipes is documented

## 11. Reuse Impact

### Primary recipes unlocked

- `RECIPE_BAKERY_SMALL_TOWN_001`
- future coastal bakery recipes
- future pastry-shop recipes
- future cake-shop recipes

### Broader commercial reuse impact

This batch also supports future:

- cafes with bakery crossover identity
- markets
- food stalls
- kiosks
- takeaway shop fronts
- seasonal commercial POIs

### Small-town commercial value

This batch strengthens the Asset Factory by:

- extending commercial identity beyond cafe-only frontage language
- improving display-led storefront variety
- creating reusable food-retail modules that can power multiple future recipes

## 12. Production Priority

Recommended order:

1. `MOD_BAKERY_DISPLAY_WINDOW_001`
2. `MOD_BAKERY_SIGN_STANDARD_001`
3. `MOD_BAKERY_COUNTER_FRONTAGE_001`
4. `MOD_BAKERY_ROOFTOP_ICON_001`

### Priority rationale

#### 1. Display window

- strongest bakery identity shift from the validated cafe path
- highest impact on storefront readability
- unlocks the core bakery retail look

#### 2. Bakery sign

- clearest public-facing identity marker
- high reuse across bakery and food-retail recipes
- pairs directly with existing commercial frontage logic

#### 3. Counter frontage

- strongest gameplay and customer-service read
- valuable across multiple food-retail categories
- secondary to display and sign in silhouette impact

#### 4. Rooftop icon

- useful long-distance accent
- optional rather than essential
- should only follow once the core storefront identity is already strong

## 13. Readiness for Blender Production

This module foundation is ready for the next controlled planning or production step with these constraints:

- reuse the validated commercial shell and hospitality support where appropriate
- add bakery-specific modules only where they create real, reusable identity value
- keep the batch mobile-safe and LOD-first
- avoid decorative one-off geometry that does not return value to the Layer A library

### Current readiness status

- module specifications: `READY`
- reuse impact analysis: `READY`
- production priority: `READY`
- validation requirements: `READY`
- Blender production readiness: `READY FOR BAKERY IDENTITY MODULE FOUNDATION`
