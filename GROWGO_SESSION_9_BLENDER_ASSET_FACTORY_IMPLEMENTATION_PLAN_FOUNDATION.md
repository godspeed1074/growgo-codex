# GrowGo Session 9 - Blender Asset Factory Implementation Plan Foundation

## Session Scope

This document defines the implementation architecture for the future Blender Asset Factory.

This is a planning and specification phase only.

This session does not:

- create Blender files
- create GLB files
- write production scripts
- run Blender automation
- modify the renderer
- add gameplay systems
- add backend systems
- add OSM systems

The purpose of this session is to define:

1. the Blender Factory implementation architecture
2. script and module organization
3. the recipe loading system
4. the module library access system
5. the assembly system
6. the socket connection system
7. the material assignment system
8. the LOD generation workflow
9. the validation workflow
10. the export workflow

Related follow-on planning document:

- `GROWGO_SESSION_10_RECIPE_EXPANSION_BATCH_1_FOUNDATION.md`

## 1. Source of Truth

This Session 9 planning document is governed by:

- `GROWGO_SESSION_5_BLENDER_ASSET_FACTORY_ARCHITECTURE_FOUNDATION.md`
- `GROWGO_SESSION_8_FIRST_BLENDER_PRODUCTION_BATCH_SPECIFICATION_FOUNDATION.md`
- `GROWGO_SESSION_7_5_CORE_LAYER_A_MODULE_SPECIFICATION_FOUNDATION.md`
- `GROWGO_SESSION_3_5_ASSET_FACTORY_PRODUCTION_RULES_FOUNDATION.md`

If a future planning document conflicts with these documents, those source documents remain authoritative unless explicitly updated.

## 2. Implementation Plan Purpose

Session 5 defined the future Blender Asset Factory conceptually.

Session 8 defined the first proof-house production batch.

Session 9 bridges those planning layers by describing how the future implementation should be organized so the factory can be built in a controlled way later.

This document does not define executable code.

It defines the implementation boundaries, responsibilities, and handoff contracts that future Blender-side scripts and helpers must follow.

## 3. Blender Factory Implementation Architecture

The future implementation should be organized as a dedicated production workspace:

```text
GrowGo_Blender_Factory/
    recipes/
    modules/
    builders/
    validators/
    exporters/
    materials/
    metadata/
```

### 3.1 Architecture intent

Each folder represents a responsibility boundary.

The future implementation should avoid mixing:

- recipe data
- module metadata
- assembly logic
- validation logic
- export logic

This keeps the factory easier to extend, easier to test, and safer to evolve across multiple asset families.

## 4. Script and Module Organization

### 4.1 `recipes/`

Purpose:

- stores approved recipe input records
- stores recipe validation-ready payloads
- stores recipe profiles for production assembly

Expected future contents:

- recipe metadata files
- recipe schema definitions
- recipe profile references

Example target:

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`

### 4.2 `modules/`

Purpose:

- stores Layer A module references
- stores module metadata
- stores socket definitions
- stores module compatibility information

Expected future contents:

- module manifest records
- module lookup tables
- module dependency profiles

Example targets:

- `MOD_WALL_WEATHERBOARD_WHITE_001`
- `MOD_ROOF_GABLE_STANDARD_001`
- `MOD_PATH_STANDARD_001`

### 4.3 `builders/`

Purpose:

- contains future assembly orchestration logic
- resolves placement order
- applies module transforms
- assembles Layer C outputs from Layer A modules

Expected future responsibilities:

- recipe parsing orchestration
- dependency resolution
- assembly sequencing
- scene graph construction

### 4.4 `validators/`

Purpose:

- checks recipe validity
- checks module compatibility
- checks sockets
- checks LOD completeness
- checks export readiness

Expected future responsibilities:

- geometry validation
- style validation
- naming validation
- metadata validation
- assembly validation

### 4.5 `exporters/`

Purpose:

- prepares Layer A export sets
- prepares Layer C export sets
- attaches metadata
- enforces export naming rules

Expected future responsibilities:

- export group collection checks
- export payload generation
- GLB metadata bundling

### 4.6 `materials/`

Purpose:

- stores shared material definitions
- stores palette references
- stores atlas planning references

Expected future responsibilities:

- shared material lookup
- recipe-to-material profile mapping
- LOD material simplification profiles

### 4.7 `metadata/`

Purpose:

- stores factory-wide schema contracts
- stores batch validation summaries
- stores asset registration payloads

Expected future responsibilities:

- asset manifests
- build manifests
- export manifests
- validation records

## 5. Recipe Loading System

The future recipe loading system must translate an approved recipe ID into a deterministic assembly request.

### 5.1 Input example

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`

### 5.2 Recipe loading stages

1. load recipe
2. validate recipe schema
3. resolve dependencies
4. find required modules
5. check missing modules
6. load approved modules
7. assemble using sockets
8. apply materials
9. generate LODs
10. validate
11. export

### 5.3 Recipe payload requirements

Every production recipe payload should supply:

- `recipeID`
- `assetID`
- `familyID`
- `requiredModules`
- `optionalModules`
- `excludedModules`
- `footprint`
- `orientationRules`
- `placementRules`
- `materialProfile`
- `lodProfile`
- `validationProfile`

### 5.4 Recipe loading rules

- the loader must fail closed if required recipe fields are missing
- recipe loading must be deterministic for the same recipe version
- excluded modules must never be inserted implicitly
- optional modules may only be skipped if the recipe still satisfies style and functional rules

## 6. Module Library Access System

The module library system defines how the future factory finds, reads, and approves reusable Layer A content.

### 6.1 Required module fields

Each module record must include:

- asset ID
- file location
- metadata
- sockets
- scale
- orientation
- material references

### 6.2 Example module

- `MOD_WALL_WEATHERBOARD_WHITE_001`

### 6.3 Required module metadata

Each module metadata record should include:

- `assetID`
- `category`
- `family`
- `dimensions`
- `compatibleSockets`
- `compatibleRecipes`
- `lodAvailability`
- `materialReferences`
- `orientationRules`
- `reuseCountEstimate`

### 6.4 Module access rules

- only approved modules may enter recipe assembly
- module lookup must happen by permanent asset ID
- module versions must be explicit
- missing modules must be reported before assembly begins
- module access must not depend on manual scene browsing

## 7. Socket Connection System

The socket system is the core compatibility layer between reusable modules.

### 7.1 Standard socket examples

- `SOCKET_WALL_TOP`
- `SOCKET_WINDOW_STANDARD`
- `SOCKET_DOOR_STANDARD`
- `SOCKET_ROOF_RIDGE`
- `SOCKET_PATH_CONNECTION`
- `SOCKET_FENCE_CONNECTION`

### 7.2 GrowGo standardized socket mapping

To remain consistent with Session 7.5, the implementation should internally map these higher-level names to the established Layer A socket vocabulary where needed.

Examples:

- `SOCKET_WALL_TOP` maps to `SOCKET_TOP_EDGE`
- `SOCKET_PATH_CONNECTION` maps to `SOCKET_PATH_BRANCH`
- `SOCKET_FENCE_CONNECTION` maps to `SOCKET_FENCE_RUN`

### 7.3 Required socket fields

Every socket definition should include:

- `socketName`
- `position`
- `rotation`
- `scaleRule`
- `compatibilityRule`
- `orientationRule`

### 7.4 Socket compatibility rules

- sockets must connect only to approved compatible socket families
- socket transforms must be explicit
- mirrored geometry must preserve socket naming stability
- scale overrides must be declared, never guessed
- incompatible sockets must fail validation before final assembly

## 8. Assembly System

The assembly system combines approved Layer A modules into finished Layer C assets.

### 8.1 Example proof-house assembly order

Foundation  
↓  
Walls  
↓  
Windows and doors  
↓  
Roof  
↓  
Exterior  
↓  
Landscape

### 8.2 Assembly responsibilities

The future assembly system should control:

- placement order
- transform application
- socket-based alignment
- orientation checks
- collision checks
- overlap checks
- final assembly readiness

### 8.3 Assembly rules

- foundation sets the scene origin for the proof house
- walls must resolve before openings can lock
- openings must resolve before facade trim and porch review can pass
- roof attachment depends on a validated wall shell
- landscape may not obscure required entry and driveway routes
- final assembly must validate the road-facing orientation rules from the recipe

## 9. Material Assignment System

The material system must preserve the GrowGo Papercut 2.5D Diorama style while keeping mobile performance safe.

### 9.1 Material rules

- use shared materials wherever possible
- use texture atlases when repetition is high
- preserve palette consistency across families
- avoid one-off material duplication
- keep material counts low for mobile readability

### 9.2 Example shared material naming

- `MAT_WALL_WEATHERBOARD_WHITE_001`
- `MAT_ROOF_TILE_RED_001`
- `MAT_GRASS_COASTAL_001`

### 9.3 Material assignment flow

1. read recipe material profile
2. resolve module material references
3. apply shared material family
4. apply approved color variant if allowed
5. simplify material set for lower LODs

## 10. LOD Generation Workflow

The future factory must generate three standard LOD tiers.

### `LOD0`

Close view.

Must preserve:

- silhouette detail
- major trim
- window and door readability
- house identity elements

### `LOD1`

Gameplay view.

Must preserve:

- major silhouette
- color blocking
- roof and facade identity
- entry readability

### `LOD2`

Overview view.

Must preserve:

- footprint readability
- roof massing
- major facade tone separation
- landmark identity where applicable

### 10.1 LOD workflow stages

1. read recipe LOD profile
2. read module LOD availability
3. generate or resolve LOD variants
4. simplify geometry by approved rules
5. simplify material usage by approved rules
6. validate readability against target view distance

### 10.2 LOD rules

- LOD reduction must preserve recipe identity
- missing required LODs must fail validation
- lower LODs must preserve north-facing overview readability

## 11. Validation Workflow

Validation must happen before export.

### 11.1 Geometry validation

Check:

- polygon budget
- topology cleanliness
- scale correctness
- major collision failures

### 11.2 Style validation

Check:

- papercut consistency
- color rules
- silhouette readability
- lighthouse-influenced style continuity

### 11.3 Modularity validation

Check:

- socket validity
- module connectivity
- missing dependency failures
- overlap failures

### 11.4 Technical validation

Check:

- naming
- metadata completeness
- LOD completeness
- export readiness

### 11.5 Validation rule

Validation must produce an explicit readiness result.

The factory should never export assets whose validation status is ambiguous or partial.

## 12. Export Workflow

The export workflow converts validated assemblies into approved Layer A or Layer C deliverables.

### 12.1 Layer A output example

- `MOD_WALL_WEATHERBOARD_WHITE_001_LOD1.glb`

### 12.2 Layer C output example

- `BUILDING_HOUSE_COASTAL_COTTAGE_001_LOD1.glb`

### 12.3 Required export payload data

Each export should include:

- asset ID
- recipe ID where applicable
- metadata
- material references
- LOD information
- version reference
- validation status

### 12.4 Export workflow stages

1. verify export-ready validation state
2. prepare Layer A or Layer C export set
3. bind metadata payload
4. apply final naming
5. package export-ready object
6. record export manifest

## 13. First Implementation Target

The first future implementation target should be:

### Input

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`

### Expected output

- `BUILDING_HOUSE_COASTAL_COTTAGE_001`

### Success criteria

- modular assembly works
- sockets work
- export workflow works
- metadata workflow works

### Why this is the right first target

This recipe tests:

- structure
- roof
- openings
- verandah and porch logic
- site modules
- landscape modules
- orientation rules
- Batch 1 reuse assumptions

It is broad enough to validate the factory architecture without requiring a large commercial or civic batch first.

## 14. Production Readiness Status

The Blender Asset Factory is now defined at the implementation-plan level, but not yet at the executable level.

Ready:

- architecture boundaries
- folder responsibilities
- recipe flow
- module access rules
- socket system requirements
- assembly sequence
- material workflow
- LOD workflow
- validation workflow
- export workflow

Still intentionally deferred:

- executable scripts
- Blender automation
- GLB generation
- runtime integration
- real asset production

## 15. Session Outcome

Session 9 establishes the future implementation contract for the GrowGo Blender Asset Factory.

It turns the earlier conceptual factory planning into a concrete implementation blueprint that future production code can follow without changing the design rules already agreed.

No Blender production is started in this session.
