# GrowGo Session 2.5 - Asset Naming, Metadata and Blender Handoff Foundation

## Session Scope

This document defines the naming, metadata, file organization, and Blender handoff rules for the future GrowGo Modular Asset Factory.

This is a documentation and specification phase only.

This session does not:

- create Blender assets
- create GLB files
- modify the renderer
- implement runtime systems
- add gameplay systems
- add backend systems
- add OSM systems

The purpose of this session is to establish the permanent rules that future asset production must follow for:

- asset IDs
- module naming
- recipe naming
- building naming
- version control
- Blender collection structure
- export naming
- LOD naming
- material naming
- metadata schema

## 1. Source of Truth

This Session 2.5 document is governed by:

- `GROWGO_MODULAR_BIBLE_DESIGN_FOUNDATION.md`
- `GROWGO_SESSION_2_MODULAR_LIBRARY_AND_RECIPE_PLANNING.md`
- `ASSET_FACTORY_FOUNDATION.md`

If a future document conflicts with these documents, those source documents remain authoritative unless explicitly updated.

## 2. Permanent Naming System

GrowGo asset planning uses permanent readable IDs that separate reusable modules, assembled buildings, recipes, and families.

### 2.1 ID categories

#### `MOD`

Used for universal modular assets.

Examples:

- `MOD_WALL_WEATHERBOARD_WHITE_001`
- `MOD_ROOF_GABLE_TILE_RED_001`
- `MOD_WINDOW_RESIDENTIAL_DOUBLE_001`
- `MOD_DOOR_COASTAL_FRONT_001`
- `MOD_TREE_EUCALYPTUS_SMALL_001`

#### `BUILDING`

Used for finished assembled assets.

Examples:

- `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- `BUILDING_BAKERY_COASTAL_001`
- `BUILDING_POLICE_SUBURBAN_001`

#### `RECIPE`

Used for assembly instructions.

Examples:

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`
- `RECIPE_SCHOOL_SUBURBAN_001`

#### `FAMILY`

Used for asset groups and planning families.

Examples:

- `FAMILY_HOUSE_COASTAL`
- `FAMILY_APARTMENT_MEDIUM`
- `FAMILY_COMMERCIAL_SHOP`

## 3. Asset ID Rules

### 3.1 General rules

- IDs are permanent after approval
- IDs must use uppercase snake case
- IDs must remain human-readable
- IDs must not be recycled
- IDs must include enough semantic information to identify type, family, and variant
- sequence numbers must use a three-digit numeric suffix

### 3.2 Recommended ID structure

#### Module pattern

- `MOD_<CATEGORY>_<STYLE_OR_FUNCTION>_<VARIANT>_<SEQUENCE>`

Examples:

- `MOD_WALL_WEATHERBOARD_WHITE_001`
- `MOD_WINDOW_COMMERCIAL_DISPLAY_001`
- `MOD_SIGN_POLICE_ENTRY_001`

#### Building pattern

- `BUILDING_<FAMILY>_<STYLE_OR_LOCATION>_<VARIANT>_<SEQUENCE>`

Examples:

- `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- `BUILDING_LIBRARY_SUBURBAN_001`
- `BUILDING_MOTEL_RETRO_ROADSIDE_001`

#### Recipe pattern

- `RECIPE_<FAMILY>_<STYLE_OR_VARIANT>_<SEQUENCE>`

Examples:

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`
- `RECIPE_TOWN_HALL_SUBURBAN_001`
- `RECIPE_FACTORY_STANDARD_001`

#### Family pattern

- `FAMILY_<GROUP>_<STYLE_OR_SCALE>`

Examples:

- `FAMILY_HOUSE_COASTAL`
- `FAMILY_APARTMENT_MEDIUM`
- `FAMILY_CIVIC_MID_SIZE`

## 4. Module Naming Rules

Modules must be named so they can be understood, reused, and filtered quickly inside the Modular Bible and future Blender library.

### Required naming properties

- declare module type
- declare function or style
- declare variant when needed
- stay compatible with future sorting and search

### Recommended module type vocabulary

- `WALL`
- `CORNER`
- `FOUNDATION`
- `EXTENSION`
- `FLOOR`
- `COLUMN`
- `ROOF`
- `WINDOW`
- `DOOR`
- `STOREFRONT`
- `AWNING`
- `VERANDAH`
- `BALCONY`
- `TRIM`
- `SIGN`
- `TREE`
- `BUSH`
- `HEDGE`
- `FLOWER`
- `PLANTER`
- `ROCK`
- `PATH`
- `PAVEMENT`
- `FENCE`
- `DRIVEWAY`
- `PARKING`
- `BENCH`
- `BIN`
- `LIGHT`
- `SHELTER`

### Module naming examples

- `MOD_WALL_CIVIC_BRICK_001`
- `MOD_ROOF_HIP_STANDARD_001`
- `MOD_WINDOW_RESIDENTIAL_DOUBLE_001`
- `MOD_DOOR_CIVIC_ENTRY_001`
- `MOD_AWNING_SHOP_STANDARD_001`
- `MOD_TREE_EUCALYPTUS_SMALL_001`

## 5. Building Naming Rules

Finished assembled assets should always read like final catalog items rather than generic library pieces.

### Naming goals

- clearly identify building type
- clearly identify style or district variant
- support future families and subfamilies
- remain stable after approval

### Building naming examples

- `BUILDING_HOUSE_COASTAL_COTTAGE_001`
- `BUILDING_APARTMENT_GARDEN_MEDIUM_001`
- `BUILDING_BAKERY_COASTAL_001`
- `BUILDING_POLICE_SUBURBAN_001`
- `BUILDING_FIRE_TOWN_001`
- `BUILDING_HOSPITAL_MODERN_001`

## 6. Recipe Naming Rules

Recipes define how approved modular pieces assemble into finished assets.

Every recipe must have:

- a permanent `recipeID`
- a linked family
- a linked asset target or asset class
- a clear variant identity

### Recipe naming examples

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`
- `RECIPE_SCHOOL_SUBURBAN_001`
- `RECIPE_BAKERY_COASTAL_001`
- `RECIPE_WAREHOUSE_STANDARD_001`

## 7. Version Control Rules

Version tracking must preserve identity while allowing controlled updates.

### Required version fields

- `version`
- `schemaVersion`
- `recipeVersion`
- `moduleVersion`

### Rules

- `assetID` does not change when version changes
- breaking geometry, attachment, or compatibility changes require a version bump
- recipe changes require recipe version updates
- module changes require module version updates
- metadata schema changes require schema version updates
- deprecated entries remain queryable and should not be renamed

### Recommended version format

- `v1`
- `v2`
- `v3`

or

- `1.0.0`
- `1.1.0`
- `2.0.0`

The exact format may be chosen later, but it must remain consistent across the entire Asset Factory.

## 8. Blender Collection Structure

Future Blender work must use a predictable scene organization.

### Project root

- `GrowGo_Assets`

### Top-level collections

- `00_REFERENCE`
- `01_MODULAR_LIBRARY`
- `02_BUILDING_RECIPES`
- `03_ENVIRONMENT`
- `04_VEHICLES`
- `05_LANDMARKS`
- `06_EXPORT_READY`

### Required internal structure

Inside `01_MODULAR_LIBRARY`, group assets by reusable category:

- `Walls`
- `Roofs`
- `Windows`
- `Doors`
- `Vegetation`
- `Props`

### Intent of each collection

- `00_REFERENCE`: style boards, scale guides, and approved concept references
- `01_MODULAR_LIBRARY`: all reusable Layer A modules
- `02_BUILDING_RECIPES`: assembled family review scenes and recipe prototypes
- `03_ENVIRONMENT`: shared environmental modules and landscape setups
- `04_VEHICLES`: optional approved papercut vehicle assets only
- `05_LANDMARKS`: anchor landmarks and special hero assemblies
- `06_EXPORT_READY`: validated export-ready production scenes only

## 9. Export Naming Rules

Export naming must remain deterministic and human-readable.

### GLB export pattern

- `<ASSET_ID>_<LOD_NAME>.glb`

Example:

- `BUILDING_HOUSE_COASTAL_001_LOD1.glb`

### Export rules

- export names must exactly match approved asset IDs
- LOD suffixes must be explicit
- exports must not use casual or temporary names
- exports must preserve orientation and origin expectations from metadata

## 10. LOD Naming Rules

GrowGo production assets must support mobile-safe LOD planning.

### Standard LOD names

- `LOD0`
- `LOD1`
- `LOD2`

### LOD intent

- `LOD0`: close inspection
- `LOD1`: gameplay view
- `LOD2`: overview and map view

### Future rule

Every production asset must support:

- mobile performance targets
- object count limits
- shared materials
- efficient geometry

### LOD examples

- `BUILDING_BAKERY_COASTAL_001_LOD0.glb`
- `BUILDING_BAKERY_COASTAL_001_LOD1.glb`
- `BUILDING_BAKERY_COASTAL_001_LOD2.glb`

## 11. Polygon Guidelines

These are target planning budgets, not production guarantees.

### Buildings

- `LOD0`: higher detail review tier
- `LOD1`: `4,000-6,000` triangles target
- `LOD2`: simplified silhouette

### Trees

- `500-2,000` triangles

### Props

- `100-500` triangles

### Landmarks

- `5,000-15,000` triangles

### Polygon planning rule

If a design direction cannot read clearly within these budgets, the design should be simplified before production begins.

## 12. Material Naming Rules

Material naming must support reuse, atlas organization, and colour consistency.

### Material rules

- shared materials are preferred
- texture atlas usage is preferred
- material count must stay limited
- colours must remain consistent with the papercut style
- materials must support bright readable colour blocking
- materials must avoid photoreal surface complexity

### Recommended material naming pattern

- `MAT_<SURFACE>_<STYLE_OR_COLOR>_<SEQUENCE>`

Examples:

- `MAT_WALL_WEATHERBOARD_WHITE_001`
- `MAT_ROOF_TILE_RED_001`
- `MAT_WINDOW_FRAME_CREAM_001`
- `MAT_TREE_EUCALYPTUS_LEAF_001`

## 13. Metadata Schema Foundation

Every modular asset must contain a minimum metadata record.

### 13.1 Required module metadata

- `assetID`
- `category`
- `family`
- `description`
- `dimensions`
- `polygonBudget`
- `materialReferences`
- `lodAvailability`
- `compatibleRecipes`
- `orientationRules`
- `attachmentPoints`
- `reuseLocations`

### Example

#### `MOD_WINDOW_STANDARD_001`

- type: `window`
- size: `2m x 1.5m`
- used by:
  - houses
  - schools
  - shops
  - civic buildings

### 13.2 Required recipe metadata

Every recipe must define:

- `recipeID`
- `family`
- `footprintSize`
- `requiredModules`
- `optionalModules`
- `excludedModules`
- `orientationRules`
- `placementRules`
- `propertyRequirements`

### Example

#### `RECIPE_HOUSE_COASTAL_001`

Requires:

- wall module
- roof module
- window module
- door module
- fence module
- landscaping module

## 14. Blender Handoff Rules

Before any future Blender asset production begins, the handoff package must include:

- approved `assetID`
- approved `family`
- approved `recipeID` if applicable
- module dependency list
- polygon budget target
- material naming expectations
- LOD requirements
- orientation rules
- origin rules
- metadata schema requirements

### Handoff checklist

1. confirm the module does not already exist
2. confirm an existing module cannot be reused
3. confirm a small modification cannot create a reusable module
4. only then authorize a new module

This is the required dependency gate before any new asset creation.

## 15. Production Readiness Rules

An asset is only ready for future production planning when:

- the family is approved
- the recipe is defined
- required modules are identified
- reusable modules are checked first
- new module gaps are documented
- naming conventions are assigned
- metadata expectations are assigned
- Blender handoff fields are complete

## 16. Readiness Statement

This document is ready to serve as the naming, metadata, file organization, and Blender handoff standard for future GrowGo asset production.

It authorizes:

- naming system planning
- metadata planning
- export structure planning
- Blender handoff preparation

It does not authorize:

- Blender production
- GLB production
- runtime implementation
- gameplay systems
- backend systems
- OSM systems
