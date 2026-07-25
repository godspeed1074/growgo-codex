# GrowGo Session 18 - Coastal Bungalow Module Expansion Foundation

## Session Scope

This document defines the missing reusable Layer A modules required to unlock:

- `BUILDING_HOUSE_BEACH_BUNGALOW_001`

using the approved reuse analysis from Session 17.

This is a documentation and planning session only.

This session does not:

- create the bungalow building
- create new recipes
- redesign existing modules
- duplicate existing modules
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

This session is for Layer A modules only.

## 1. Source of Truth

This Session 18 planning document is governed by:

- `GROWGO_SESSION_17_SECOND_RECIPE_ASSEMBLY_TEST_FOUNDATION.md`
- `GROWGO_SESSION_16_5_LAYER_A_EXPANSION_VALIDATION_AND_LIBRARY_REGISTRATION.md`
- `GROWGO_SESSION_15_LAYER_A_EXPANSION_BATCH_1_PRODUCTION_PLAN.md`
- `GROWGO_SESSION_7_5_CORE_LAYER_A_MODULE_SPECIFICATION_FOUNDATION.md`

Related follow-on validation document:

- `GROWGO_SESSION_19_5_COASTAL_EXPANSION_VALIDATION_AND_LIBRARY_REGISTRATION.md`

If a future planning document conflicts with these documents, those source documents remain authoritative unless explicitly updated.

## 2. Expansion Purpose

Session 17 confirmed that the beach bungalow can be planned primarily through reuse of the current Layer A library.

The remaining blocker is small but important:

- three missing reusable modules prevent full bungalow assembly planning from resolving cleanly through the existing dependency system

Session 18 defines those missing modules as reusable Layer A assets rather than recipe-specific exceptions.

This module expansion must:

1. preserve the established coastal-family style
2. avoid duplication of existing cottage and site modules
3. unlock multiple future coastal and hospitality recipes
4. remain export-ready under the same Layer A naming, socket, and LOD rules

## 3. Target Module Set

Only the following approved missing reusable modules are in scope:

1. `MOD_FOUNDATION_RAISED_COASTAL_001`
2. `MOD_WINDOW_RESIDENTIAL_LARGE_001`
3. `MOD_DECK_TIMBER_COASTAL_001`

No other Layer A modules are added in this session.

## 4. Module Specification - `MOD_FOUNDATION_RAISED_COASTAL_001`

### Asset ID

- `MOD_FOUNDATION_RAISED_COASTAL_001`

### Category

- `STRUCTURE`

### Family

- `FOUNDATION`

### Purpose

- raised coastal residential foundation system for elevated homes in beachside, flood-prone, stilt-adjacent, and holiday-house settings

### Description

This module creates the elevated base condition required for beach bungalows and similar coastal-family assets while keeping wall attachment, entry alignment, and deck connection logic compatible with the existing house system.

### Dimensions

- base footprint compatibility:
  - width range: `8m-11m`
  - depth range: `10m-13m`
- platform height variants:
  - low raised: `0.7m`
  - medium raised: `1.2m`
  - coastal stilt: `1.8m`
- support spacing:
  - standard bay spacing: `2.0m-2.6m`

### Variants

- low raised
- medium raised
- coastal stilt

### Support style

- enclosed low subfloor skirt
- open framed support grid
- simplified stilt support rhythm

### Attachment points

- `SOCKET_TOP_EDGE`
- `SOCKET_BOTTOM_EDGE`
- `SOCKET_LEFT_EDGE`
- `SOCKET_RIGHT_EDGE`
- `SOCKET_PATH_ENTRY`
- `SOCKET_PROPERTY_EDGE`
- `SOCKET_WALL_TOP`

### Socket rules

- top platform must expose stable wall-mounting sockets compatible with the existing weatherboard wall system
- entry side must align to path and optional stair access
- side edges must support deck attachment on one or more faces
- socket positions must remain centered and deterministic across all height variants

### Compatible wall connections

- `MOD_WALL_WEATHERBOARD_WHITE_001`
- `MOD_WALL_CORNER_STANDARD_001`
- future compatible coastal wall variations that keep the same wall socket class

### Compatible recipes

- `RECIPE_HOUSE_BEACH_BUNGALOW_001`
- future raised holiday house recipes
- future waterfront house recipes
- future stilt-style coastal accommodation recipes

### Material references

- `MAT_FOUNDATION_STANDARD_001`
- `MAT_TRIM_STANDARD_COASTAL_001`
- `MAT_TIMBER_DECK_STANDARD_001` for exposed support or landing conditions

### Polygon targets

- `LOD0`: `500-900`
- `LOD1`: `220-420`
- `LOD2`: `50-120`

### LOD requirements

- `LOD0`: readable support rhythm, platform edge, and elevation logic preserved
- `LOD1`: raised form, primary support massing, and entry alignment preserved
- `LOD2`: silhouette height and elevated footprint preserved without fine support detail

### Reuse opportunities

- beach houses
- waterfront homes
- flood-prone homes
- stilt-style buildings
- holiday houses
- future raised motel or resort modules

### Reuse impact

- high coastal-family value
- medium broader world-generation value
- strong identity unlock for elevated homes

## 5. Module Specification - `MOD_WINDOW_RESIDENTIAL_LARGE_001`

### Asset ID

- `MOD_WINDOW_RESIDENTIAL_LARGE_001`

### Category

- `OPENINGS`

### Family

- `WINDOW`

### Purpose

- large residential glazing module for coastal homes, villas, modern houses, cafes, and apartments

### Description

This module expands the current residential opening set with a larger, lighter facade option suited to coastal living and broader view-oriented buildings while preserving the same planning vocabulary as the existing standard residential window.

### Dimensions

- standard width: `1.8m`
- double panel width: `2.4m`
- panoramic width: `3.2m`
- standard height: `1.4m`
- placement sill height: `0.75m-0.95m`

### Variants

- large single window
- double panel
- coastal panoramic

### Wall socket compatibility

- `SOCKET_WINDOW_LARGE`
- compatible with wall modules that expose large-window-ready opening sockets

### Placement height

- standard residential facade placement
- elevated coastal front-facing placement
- view-oriented side-facade placement

### Frame variants

- white frame
- timber frame
- dark frame

### Glass style

- standard clear coastal glazing
- wide double-panel glazing
- panoramic glazing with simplified papercut framing

### Attachment points

- `SOCKET_WINDOW_LARGE`
- `SOCKET_LEFT_EDGE`
- `SOCKET_RIGHT_EDGE`

### Socket rules

- module must fit within large-opening wall sockets without manual scaling
- panoramic variant must preserve frame rhythm at overview zoom
- all variants must retain deterministic frame boundaries for recipe assembly

### Compatible recipes

- `RECIPE_HOUSE_BEACH_BUNGALOW_001`
- `RECIPE_HOUSE_SUBURBAN_BRICK_001`
- future villa recipes
- future apartment recipes
- `RECIPE_CAFE_SMALL_TOWN_001`

### Material references

- `MAT_WINDOW_FRAME_WHITE_001`
- `MAT_WINDOW_FRAME_TIMBER_001`
- `MAT_WINDOW_FRAME_DARK_001`
- `MAT_STORE_GLASS_COASTAL_001`

### Polygon targets

- `LOD0`: `120-240`
- `LOD1`: `60-120`
- `LOD2`: `16-32`

### LOD requirements

- `LOD0`: clear frame divisions and readable glass proportion
- `LOD1`: broad opening shape and frame silhouette preserved
- `LOD2`: simplified opening and colour block preserved

### Reuse opportunities

- beach houses
- modern homes
- villas
- cafes
- apartments
- civic/community facades that need larger glazing

### Reuse impact

- very high cross-recipe value
- high world-generation value for facade variation
- strong visual payoff with low module-count cost

## 6. Module Specification - `MOD_DECK_TIMBER_COASTAL_001`

### Asset ID

- `MOD_DECK_TIMBER_COASTAL_001`

### Category

- `EXTERIOR`

### Family

- `DECK`

### Purpose

- reusable timber deck system for beach houses, holiday homes, resorts, cafes, and outdoor living areas

### Description

This module fills the gap between entry porches and verandahs by providing a more open platform surface suited to coastal bungalows and future hospitality assets. It must connect cleanly to raised foundations, walls, optional stairs, and rail systems without replacing the current verandah module.

### Dimensions

- small deck: `2.4m x 2.0m`
- medium deck: `4.0m x 2.8m`
- wrap deck run: `6.0m x 2.2m` equivalent connected span
- walking surface height aligned to raised foundation top

### Variants

- small deck
- medium deck
- wrap deck

### Attachment points

- `SOCKET_TOP_EDGE`
- `SOCKET_BOTTOM_EDGE`
- `SOCKET_LEFT_EDGE`
- `SOCKET_RIGHT_EDGE`
- `SOCKET_PATH_ENTRY`
- `SOCKET_PROPERTY_EDGE`

### Wall connection

- connects to wall-facing facade edge
- aligns to raised coastal foundation platform height
- supports direct handoff from main structure to open-air living edge

### Railing compatibility

- must support future railing or edge-guard attachment without changing deck footprint
- edge conditions should remain optional to allow open holiday-house compositions

### Stair compatibility

- primary entry edge should support future `MOD_STAIR_COASTAL_ENTRY_001` if approved
- must also function cleanly without stairs when used at low-raised height

### Extension rules

- straight extension should preserve plank direction and socket spacing
- wrap deck variant should support corner continuation without manual geometry edits
- medium and wrap variants must remain decomposable into repeatable deck spans for future assembly tools

### Sockets

- `SOCKET_PATH_ENTRY`
- `SOCKET_PROPERTY_EDGE`
- `SOCKET_LEFT_EDGE`
- `SOCKET_RIGHT_EDGE`
- `SOCKET_TOP_EDGE`
- `SOCKET_BOTTOM_EDGE`

### Socket rules

- edge sockets must remain stable across all three size variants
- wall-facing side must align deterministically with bungalow facade modules
- deck extension sockets must allow chained spans without hidden offsets

### Compatible recipes

- `RECIPE_HOUSE_BEACH_BUNGALOW_001`
- future beach house recipes
- future holiday house recipes
- future resort and motel outdoor-frontage recipes
- `RECIPE_CAFE_SMALL_TOWN_001` outdoor seating adaptations

### Material references

- `MAT_TIMBER_DECK_STANDARD_001`
- `MAT_TRIM_STANDARD_COASTAL_001`

### Polygon targets

- `LOD0`: `220-420`
- `LOD1`: `100-220`
- `LOD2`: `24-60`

### LOD requirements

- `LOD0`: deck edge, plank direction, and support silhouette preserved
- `LOD1`: deck footprint and outer edge rhythm preserved
- `LOD2`: simplified platform mass and frontage contribution preserved

### Reuse opportunities

- beach houses
- holiday homes
- resorts
- cafes
- outdoor areas
- raised accommodation assets

### Reuse impact

- high coastal-family value
- high hospitality reuse value
- high production priority because it unlocks both bungalow identity and future outdoor-living assets

## 7. Reuse Analysis Ranking

The three modules are ranked by:

1. number of future recipes unlocked
2. importance to world generation
3. production priority

### Ranked result

1. `MOD_WINDOW_RESIDENTIAL_LARGE_001`
2. `MOD_DECK_TIMBER_COASTAL_001`
3. `MOD_FOUNDATION_RAISED_COASTAL_001`

### Ranking rationale

#### `MOD_WINDOW_RESIDENTIAL_LARGE_001`

- broadest recipe reach across houses, apartments, cafes, villas, and community buildings
- strongest general-purpose facade unlock
- easiest transition into multiple future families

#### `MOD_DECK_TIMBER_COASTAL_001`

- strong coastal-family and hospitality reuse
- directly improves outdoor-living readability in world generation
- supports future resort, motel, cafe, and raised-home recipes

#### `MOD_FOUNDATION_RAISED_COASTAL_001`

- slightly narrower family spread than the other two
- essential for elevated coastal building logic
- critical to bungalow unlock even if broader reuse count is lower

## 8. Production Order

The recommended production order remains:

1. `MOD_FOUNDATION_RAISED_COASTAL_001`
2. `MOD_WINDOW_RESIDENTIAL_LARGE_001`
3. `MOD_DECK_TIMBER_COASTAL_001`

### Production-order rationale

- the raised foundation is the primary bungalow identity blocker
- the large window is the strongest facade reuse unlock after the foundation is resolved
- the deck completes the outdoor-living system once elevated assembly is available

## 9. Validation Requirements Before Production Approval

Before any production approval, each module must pass:

### Naming

- permanent ID format is correct
- category and family alignment remain consistent

### Socket compatibility

- sockets use existing Layer A vocabulary
- socket positions are deterministic across variants
- no hidden manual offsets are required

### Recipe compatibility

- bungalow recipe can resolve dependencies through the current library plus these three modules
- future recipe reuse is clearly documented

### Style consistency

- module reads as coastal-family content
- GrowGo Papercut 2.5D silhouette clarity is preserved
- no photoreal or one-off detailing drifts into the module family

### LOD readiness

- `LOD0`, `LOD1`, and `LOD2` expectations are fully defined
- overview readability remains intact

### Export readiness

- module naming supports standard Layer A export patterns
- metadata fields can follow the existing batch registration system

## 10. Readiness Status

Session 18 is production-planning ready.

Ready:

- missing modules are identified
- purposes are defined
- dimensions are defined
- variants are defined
- socket and attachment rules are defined
- recipe compatibility is defined
- production order is defined

Deferred intentionally:

- Blender production
- GLB export generation
- bungalow assembly
- optional stair module approval

## 11. Session Outcome

Session 18 defines the three reusable Layer A modules required to unlock the beach bungalow assembly path without duplicating the current cottage-era library.

It confirms that the bungalow does not require a new architecture.

It requires only:

- one raised foundation system
- one large residential window system
- one dedicated coastal deck system

No Blender production is performed in this session.
