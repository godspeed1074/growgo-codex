# GrowGo Session 1 - Modular Bible and Asset Factory Design Foundation

## Session Scope

This document defines the design specification foundation for the GrowGo Modular Bible before any new Blender asset production begins.

This is a planning and specification phase only.

This session does not:

- create Blender files
- generate GLB assets
- implement runtime systems
- redesign the renderer
- add gameplay systems
- add backend systems
- add OSM systems

The purpose of this session is to define the rules, naming systems, modular structure, approval process, and dependency model that all future GrowGo asset production must follow.

Related follow-on planning document:

- `GROWGO_SESSION_2_MODULAR_LIBRARY_AND_RECIPE_PLANNING.md`

## 1. Locked Visual Direction

GrowGo uses a locked visual direction:

- `GrowGo Papercut 2.5D Diorama Style`

This style is the single approved visual direction for future production assets unless a later explicit art-direction review replaces it.

### Core visual rules

- the lighthouse asset is the visual anchor for the overall style
- silhouettes must stay clean and immediately readable
- shapes must stay simple and friendly rather than highly technical
- shadows must be soft and supportive, not dramatic or heavy
- colours must remain bright, clear, and mobile-readable
- assets should contain slight 3D depth while still reading as papercut 2.5D forms
- visual design remains mobile-first
- the default review camera remains north-facing
- the camera uses a moderate downward angle
- all assets must read clearly from overview zoom

### Visual direction to avoid

- photorealism
- architectural rendering aesthetics
- excessive micro-detail
- realistic vehicle styling
- inconsistent art styles between asset families

### Review standard

Every future asset concept, recipe, module, and assembled asset must be evaluated against this question:

- does it clearly belong to the GrowGo Papercut 2.5D Diorama Style when seen at overview, neighbourhood, and close review distances?

If the answer is no, the asset is not approved for production.

## 2. Modular Bible Purpose

The Modular Bible is the permanent design source of truth for:

- shared visual rules
- shared modular components
- asset family definitions
- recipe assembly rules
- approval status
- dependency tracking
- future production handoff requirements

The Modular Bible must make it easy to answer:

- which modules already exist
- which modules are reusable
- which recipes are approved
- which asset families are active
- which new modules are required before a new asset can be assembled

## 3. Modular Asset Rule

All GrowGo assets must use shared modular components.

The architecture is permanently divided into three layers.

### Layer A - Universal reusable modules

Layer A contains shared modules that can be reused across many asset families.

#### Structure modules

- walls
- corners
- foundations
- extensions

#### Roof modules

- gable
- hip
- flat
- skillion
- towers
- domes

#### Opening modules

- windows
- doors
- shop fronts

#### Exterior modules

- awnings
- verandahs
- balconies
- stairs
- columns

#### Environment modules

- trees
- bushes
- hedges
- fences
- paths
- benches
- lighting
- landscaping

### Layer B - Recipes

Layer B defines recipes that assemble approved modules into a repeatable asset plan.

Recipes define:

- which modules are required
- which modules are optional
- orientation rules
- footprint rules
- road-facing rules
- surrounding space rules
- visual family rules

### Layer C - Finished assembled assets

Layer C contains complete approved asset assemblies built from Layer A modules through Layer B recipes.

Examples:

- a bakery asset
- a coastal cottage asset
- a garden apartment asset
- a fire station asset

### Reuse rule

A new asset must reuse existing modules whenever possible.

If a required module does not exist:

1. create the new shared module first
2. add it to the Modular Bible shared library
3. then reference it from recipes
4. then reuse it across future asset families

No asset should introduce a one-off bespoke form if an equivalent reusable module can be added instead.

## 4. Asset Approval Process

Every asset family follows the same approval path.

1. Present 3 numbered design options:
   - `1`
   - `2`
   - `3`
2. User selects:
   - one
   - multiple
   - none with feedback
3. Approved designs become recipe candidates
4. The recipe review must identify:
   - reused modules
   - new modules
5. New approved modules are added to the Modular Bible shared library

### Approval record requirements

Every reviewed asset family must record:

- review date
- family name
- design options shown
- approved option or options
- rejection notes if none are approved
- reused modules
- new modules required
- recipe readiness state

### Approval boundary

Approval of a design direction does not automatically authorize:

- Blender production
- GLB export
- runtime activation
- gameplay use

It only authorizes recipe and module planning unless a later production phase explicitly begins.

## 5. Approved Asset Family Index

This section records the approved family directions available at the design-foundation level.

### Residential

- Houses
  - large modular family system
  - many variants required

- Apartments
  - Coastal Contemporary
  - Garden Apartment
  - Town Centre Brick

### Commercial

- Bakery
- Cafe direction
- Kebab Shop
- Fast Food
  - Taco
  - Burger
  - Sandwich
- Retail Shops
- Bank
- Post Office
- Gas Stations

### Civic

- School
  - Small Town
  - Suburban
  - City High School direction
  - Modern school concepts
- Police Station
- Fire Station
- Hospital
- Library
- Museum/Cultural Centre direction
- Town Hall
  - Suburban approved
  - City approved
  - Small town needs redesign

### Accommodation

- Hotels
  - Boutique
  - Mid-size
  - Luxury

- Motels
  - Coastal Motor Inn
  - Retro Roadside
  - Garden Court

- Motel size variants
  - Small
  - Medium
  - Large
  - Two-storey

### Industrial

- Warehouse Family
- Factory Family

### Industrial district recipe groups

- factories
- warehouses
- storage
- utilities
- service buildings
- landscaping buffers

## 6. Vehicle Rule

Vehicles are optional.

Vehicles must not be created automatically for a family or scene.

Vehicles are only approved when they add clear identity value.

Examples of acceptable identity-driven vehicles:

- firetruck
- ambulance
- school bus
- city bus

Vehicle style rule:

- all vehicles must follow `GrowGo Papercut Vehicle Style`

Disallowed direction:

- realistic vehicle modelling
- realistic transport styling
- overly detailed vehicle interiors or mechanical surfaces

## 7. Asset ID Convention

All assets must use permanent, readable, structured IDs.

### Asset ID format

- `ASSETTYPE_FAMILY_VARIANT_SEQUENCE`

Example:

- `BUILDING_BAKERY_COASTAL_001`

### Asset ID rules

- use uppercase snake case
- start with the top-level asset type
- include family identity
- include style or variant identity where needed
- end with a three-digit sequence
- never recycle retired IDs
- keep IDs stable after approval

### Recommended type prefixes

- `BUILDING`
- `LANDMARK`
- `ROAD`
- `TERRAIN`
- `TREE`
- `BUSH`
- `FENCE`
- `PATH`
- `LIGHTING`
- `VEHICLE`

### Family examples

- `BUILDING_BAKERY_COASTAL_001`
- `BUILDING_APARTMENT_GARDEN_001`
- `BUILDING_MOTEL_RETRO_001`
- `LANDMARK_LIGHTHOUSE_COASTAL_001`
- `ROAD_SUBURBAN_MAIN_001`

## 8. Recipe Naming Rules

Recipes are the assembly layer between modules and finished assets.

### Recipe format

- `RECIPE_<FAMILY>_<VARIANT>_<SEQUENCE>`

Examples:

- `RECIPE_BAKERY_COASTAL_001`
- `RECIPE_HOUSE_COASTAL_COTTAGE_001`
- `RECIPE_APARTMENT_GARDEN_001`
- `RECIPE_TOWN_HALL_SUBURBAN_001`

### Recipe record requirements

Every recipe must define:

- `recipeId`
- related `assetId` or asset family target
- required modules
- optional modules
- footprint width
- footprint depth
- property requirements
- placement rules
- road-facing rules
- orientation rules
- surrounding space rules
- landscaping expectations
- signage expectations where relevant

### Recipe structure example

For `BUILDING_BAKERY_COASTAL_001`:

- required modules
  - walls
  - roof
  - windows
  - doors
  - landscaping
  - signage
- footprint
  - width
  - depth
  - frontage
- placement rules
  - road facing
  - orientation support
  - side clearance
  - rear clearance

## 9. Layer A Module Categories

The Layer A shared library must be tracked by category and subcategory.

### 9.1 Structure

- wall panel
- wall corner
- foundation slab
- extension wing
- vertical connector

### 9.2 Roof

- gable roof
- hip roof
- flat roof
- skillion roof
- tower roof
- dome roof
- verandah roof

### 9.3 Openings

- residential window
- shop window
- apartment window
- residential door
- civic door
- shop front

### 9.4 Exterior attachments

- awning
- verandah
- balcony
- stairs
- columns
- signage mount
- railing

### 9.5 Environment

- tree trunk and canopy families
- shrubs
- hedges
- fences
- paths
- benches
- lamps
- garden beds
- retaining edges

### 9.6 Landmark-specific shared modules

- tower body
- lantern room
- balcony ring
- rock base
- lookout path

Landmark-specific modules are still part of the shared library if they can be reused across multiple landmarks or landmark variants.

## 10. Dependency Tracking Approach

The Modular Bible must track dependency flow in a consistent way.

### Dependency chain

- visual direction
- module
- recipe
- assembled asset
- family group

### Each asset record must track

- reused modules
- newly required modules
- recipe dependencies
- environment dependencies
- placement dependencies
- style dependencies

### Dependency states

- `planned`
- `available`
- `approved`
- `blocked`
- `deprecated`

### Dependency rules

- no recipe can be approved if a required module is undefined
- no asset can move to production planning if its recipe is incomplete
- no production handoff can begin if dependency status is blocked
- reused module counts should be visible to encourage modular growth over bespoke duplication

## 11. Future Blender Factory Requirements

This session does not begin Blender production, but it defines the requirements future Blender work must follow.

### Future production handoff must include

- approved `assetId`
- approved `recipeId`
- module dependency list
- appearance direction
- silhouette notes
- orientation support
- LOD expectations
- mobile performance expectations
- validation checklist

### Blender-facing design requirements

- assets must preserve clean silhouettes
- shapes must remain readable from overview zoom
- depth must stay slight and controlled
- colour blocking must remain simple and bright
- materials must support the papercut 2.5D diorama language
- shadow shapes must stay soft and uncluttered

### Future production readiness checklist

- visual direction approved
- design option approved
- recipe approved
- reused modules identified
- new modules defined
- Layer A library updated
- footprint and placement rules documented
- mobile constraints documented

## 12. Lighthouse Anchor Rule

The lighthouse is the visual anchor for the GrowGo world style.

This means future families should be reviewed against lighthouse-led style consistency in:

- silhouette clarity
- colour language
- level of detail
- depth treatment
- shadow softness
- overview readability

The lighthouse does not require all other assets to look identical, but it defines the standard for:

- charm
- readability
- stylization level
- diorama depth

## 13. Session 1 Deliverable Summary

Session 1 establishes:

1. the Modular Bible structure
2. the asset family index
3. Layer A module categories
4. recipe naming rules
5. asset ID conventions
6. future Blender Factory requirements
7. the dependency tracking approach

## 14. Readiness Statement

This document is ready to serve as the blueprint for future GrowGo asset creation planning.

It authorizes:

- modular design planning
- family approval tracking
- recipe preparation
- shared module definition
- production dependency mapping

It does not authorize:

- Blender asset production
- GLB generation
- runtime implementation
- renderer redesign
- gameplay systems
- backend systems
- OSM systems
