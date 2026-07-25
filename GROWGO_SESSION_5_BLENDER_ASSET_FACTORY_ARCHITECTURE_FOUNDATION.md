# GrowGo Session 5 - Blender Asset Factory Architecture Foundation

## Session Scope

This document defines the future Blender Asset Factory architecture that converts approved GrowGo recipes into assembled modular assets.

This is a planning and specification phase only.

This session does not:

- create Blender files
- create GLB files
- write production scripts
- implement runtime systems
- modify the renderer
- add gameplay systems
- add backend systems
- add OSM systems

The purpose of this session is to define:

1. Blender factory architecture
2. recipe input format
3. module loading system
4. assembly pipeline
5. variant generation approach
6. LOD generation approach
7. material handling
8. export pipeline
9. validation workflow

## 1. Source of Truth

This Session 5 planning document is governed by:

- `GROWGO_MODULAR_BIBLE_DESIGN_FOUNDATION.md`
- `GROWGO_SESSION_2_MODULAR_LIBRARY_AND_RECIPE_PLANNING.md`
- `GROWGO_SESSION_2_5_NAMING_METADATA_AND_BLENDER_HANDOFF_FOUNDATION.md`
- `GROWGO_SESSION_3_FIRST_PRODUCTION_BATCH_PLANNING_FOUNDATION.md`
- `GROWGO_SESSION_3_5_ASSET_FACTORY_PRODUCTION_RULES_FOUNDATION.md`
- `GROWGO_SESSION_4_FIRST_RECIPE_PRODUCTION_PLANNING_FOUNDATION.md`

If a future planning document conflicts with these documents, those source documents remain authoritative unless explicitly updated.

## 2. Blender Factory Overview

The future Blender Asset Factory should follow this conceptual pipeline:

Recipe

↓

Recipe Parser

↓

Dependency Resolver

↓

Module Loader

↓

Assembly System

↓

Material Assignment

↓

LOD Generator

↓

Validation

↓

GLB Export

↓

Asset Library Registration

### Pipeline rule

Each stage must produce an explicit output contract for the next stage.

No stage should rely on hidden state or manual assumptions that are not represented in recipe or module metadata.

## 3. Recipe Input Format

The Blender Asset Factory receives approved recipe definitions as structured input.

### Example input recipe

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`

### Required recipe input fields

- asset ID
- footprint
- required modules
- optional modules
- orientation rules
- scale rules
- material profile
- LOD profile

### Recommended recipe payload structure

- `recipeID`
- `assetID`
- `familyID`
- `footprint`
- `requiredModules`
- `optionalModules`
- `orientationRules`
- `scaleRules`
- `materialProfile`
- `lodProfile`
- `placementProfile`
- `validationProfile`

### Input rule

The Blender factory should never guess missing recipe data.

If any required field is absent, the recipe must fail readiness before assembly begins.

## 4. Recipe Parser

The recipe parser converts the approved recipe record into assembly-ready instructions.

### Parser responsibilities

- verify recipe ID validity
- verify asset ID linkage
- normalize module dependency groups
- normalize optional module groups
- normalize footprint and scale data
- forward structured module requests to the dependency resolver

### Parser outputs

- normalized recipe payload
- dependency request list
- assembly instruction seed
- validation precheck summary

## 5. Dependency Resolver

The dependency resolver compares the recipe payload against the approved Layer A library.

### Resolver responsibilities

- check whether each required module exists
- check whether optional modules exist
- identify missing modules
- identify valid variation candidates
- identify blocked dependencies

### Resolver outputs

- resolved required module set
- resolved optional module set
- missing module report
- variation candidate report
- assembly readiness status

### Resolver rule

The dependency resolver must follow the production rules already defined:

1. reuse existing module
2. use or create variation where valid
3. add a new reusable module if justified
4. allow limited identity modules only when justified

## 6. Module Loading System

The module loader is responsible for locating and preparing approved modules for assembly.

### Module loading responsibilities

- find module in the approved asset library
- load the approved module version
- verify compatibility with the recipe
- prepare placement metadata
- expose attachment points and sockets

### Module loading rules

1. check Asset Library
2. load approved module
3. verify compatibility
4. place using attachment points

### Module categories to support

- walls
- roofs
- windows
- doors
- landscaping
- props

### Loader outputs

- loaded module set
- compatibility report
- unresolved socket report
- assembly-ready module payload

## 7. Assembly System

The assembly system connects loaded modules into a complete approved asset.

### Required assembly properties

Modules need:

- anchor points
- sockets
- orientation data
- scale rules
- placement rules

### Connection examples

#### Roof

Connects to:

- wall top edge

#### Window

Connects to:

- wall opening socket

#### Door

Connects to:

- entrance socket

#### Fence

Connects to:

- property boundary

### Assembly responsibilities

- attach structure modules
- place openings into prepared sockets
- attach roof modules to the structure shell
- place exterior modules such as verandahs and trims
- place site and landscape modules according to lot rules
- verify scale and orientation

### Assembly outputs

- assembled asset scene
- socket resolution report
- placement validation report
- pre-LOD master assembly

## 8. Variant Generation Approach

Variants should be generated through modular combinations rather than duplicated asset authoring.

### Example family

- `HOUSE_COASTAL_FAMILY`

### Example variants

- different roofs
- different walls
- different windows
- different gardens
- different colours

### Variant rules

- do not create duplicates
- prefer module combinations
- preserve silhouette clarity
- preserve the papercut 2.5D style
- preserve mobile performance requirements

### Variant generation responsibilities

- choose allowed module alternatives
- apply approved colour and material profiles
- apply approved landscape swaps
- keep the base footprint and orientation logic intact

## 9. LOD Generation Approach

The Blender factory must support a consistent LOD pipeline for future assets.

### LOD0

Purpose:

- close inspection

Includes:

- detailed modules
- extra props
- richer vegetation

### LOD1

Purpose:

- gameplay

Includes:

- required identity
- optimized geometry

### LOD2

Purpose:

- overview

Includes:

- silhouette
- major colour blocks
- minimal geometry

### LOD generation responsibilities

- preserve asset identity at every level
- simplify geometry by stage
- reduce accessory clutter as distance increases
- preserve roof, wall, and lot readability
- preserve material consistency across levels

### LOD outputs

- `LOD0` assembly
- `LOD1` assembly
- `LOD2` assembly
- LOD validation summary

## 10. Material System

The Blender factory must assign materials using the shared material rules from earlier sessions.

### Material rules

- shared materials
- texture atlases
- limited material count
- consistent palette

### Example materials

- `MAT_WALL_WEATHERBOARD_WHITE_001`
- `MAT_ROOF_TILE_RED_001`
- `MAT_GRASS_COASTAL_001`

### Material responsibilities

- load approved shared materials
- apply material profile from recipe
- verify material count stays within limits
- preserve palette consistency across modules
- preserve papercut readability

### Material outputs

- material assignment report
- per-LOD material usage summary
- atlas usage summary

## 11. Export Pipeline

The export pipeline defines how validated assemblies become future asset packages.

### Example output

- `BUILDING_HOUSE_COASTAL_COTTAGE_001_LOD1.glb`

### Export payload must include

- metadata
- asset ID
- recipe reference
- material references
- LOD information

### Export responsibilities

- export each approved LOD output
- attach naming-compliant identifiers
- attach metadata references
- preserve orientation and origin rules
- preserve recipe linkage

### Export outputs

- asset package manifest
- LOD export set
- metadata bundle
- material reference bundle

## 12. Validation Workflow

Validation happens before export and before library registration.

### Validation checks

- module compatibility
- style consistency
- polygon budget
- LOD presence
- naming compliance
- orientation
- footprint

### Validation stages

1. recipe validation
2. dependency validation
3. assembly validation
4. material validation
5. LOD validation
6. export readiness validation

### Validation rule

If any required validation fails, the asset must not proceed to export or library registration.

## 13. Asset Library Registration

After export readiness succeeds, the asset package can enter the future asset library.

### Registration responsibilities

- attach final asset ID
- attach recipe reference
- attach module dependency summary
- attach material references
- attach LOD package references
- record family membership
- record compatibility and reuse metadata

### Registration outputs

- Layer C asset registration record
- dependency trace record
- reuse trace record
- production package summary

## 14. Production Readiness Status

### Ready after Session 5

- Blender-side architecture definition
- recipe flow definition
- dependency loading definition
- assembly architecture definition
- LOD architecture definition
- material handling definition
- export architecture definition
- validation workflow definition

### Not authorized after Session 5

- Blender file creation
- GLB creation
- production scripts
- runtime systems
- gameplay systems
- backend systems
- OSM systems

## 15. Readiness Statement

This document is ready to serve as the Blender Asset Factory architecture foundation for future GrowGo asset production.

It authorizes:

- architecture review
- pipeline review
- validation review
- future production handoff preparation

It does not authorize:

- Blender production
- GLB creation
- production scripting
- runtime implementation
- gameplay systems
- backend systems
- OSM systems
