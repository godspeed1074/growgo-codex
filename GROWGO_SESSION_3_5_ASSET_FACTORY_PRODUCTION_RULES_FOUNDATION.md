# GrowGo Session 3.5 - Asset Factory Production Rules Foundation

## Session Scope

This document defines the workflow logic and production rules for the future GrowGo Modular Asset Factory.

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

1. the Asset Factory workflow
2. recipe resolution logic
3. module dependency checking
4. missing module creation rules
5. assembly validation
6. asset registration process
7. library growth rules
8. approval gates

Related follow-on planning document:

- `GROWGO_SESSION_4_FIRST_RECIPE_PRODUCTION_PLANNING_FOUNDATION.md`

## 1. Source of Truth

This Session 3.5 document is governed by:

- `GROWGO_MODULAR_BIBLE_DESIGN_FOUNDATION.md`
- `GROWGO_SESSION_2_MODULAR_LIBRARY_AND_RECIPE_PLANNING.md`
- `GROWGO_SESSION_2_5_NAMING_METADATA_AND_BLENDER_HANDOFF_FOUNDATION.md`
- `GROWGO_SESSION_3_FIRST_PRODUCTION_BATCH_PLANNING_FOUNDATION.md`

If a future planning document conflicts with these documents, those source documents remain authoritative unless explicitly updated.

## 2. Asset Factory Workflow

The future Asset Factory workflow starts from an approved recipe ID.

### Example input

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`

### Workflow steps

1. load recipe
2. read required modules
3. check Layer A library
4. identify:
   - existing modules
   - missing modules
   - optional modules
5. create missing modules only where allowed by the dependency rules
6. assemble asset
7. validate:
   - style consistency
   - module compatibility
   - footprint
   - orientation
   - polygon budget
   - LOD requirements
8. register finished asset

### Workflow rule

The Asset Factory must always prefer:

- reuse
- controlled variation
- modular growth

before it permits new one-off asset creation.

## 3. Recipe Resolution Logic

Recipe resolution is the process of translating an approved recipe into an assembly-ready module list.

### Recipe resolution input

- `recipeID`
- required modules
- optional modules
- excluded modules
- footprint rules
- orientation rules
- placement rules

### Recipe resolution output

- resolved module list
- missing module list
- optional module list
- validation readiness summary

### Resolution rules

- required modules must all resolve before assembly planning can pass
- optional modules may be skipped when they do not break style or function
- excluded modules must never be substituted implicitly
- resolution must remain deterministic for the same recipe and version

## 4. Module Dependency System

Every recipe must know its module dependency structure.

### Example

For `RECIPE_HOUSE_COASTAL_COTTAGE_001`:

#### Structure

- `foundation_small`
- `wall_weatherboard`

#### Roof

- `roof_gable`

#### Openings

- `window_residential`
- `door_coastal`

#### Exterior

- `veranda_small`

#### Site

- `path`
- `fence`
- `garden`

### Dependency rules

- required modules must be explicitly named
- optional modules must be explicitly named
- dependencies must be grouped by module category
- no hidden module dependency is allowed
- recipes must declare their dependency intent before production planning begins

## 5. Missing Module Rule

Before the factory allows a new module to be created, it must evaluate a fixed sequence.

### Question 1

Does the module already exist?

- yes: reuse it
- no: continue

### Question 2

Can an existing module variation solve the need?

- yes: create a variation
- no: continue

### Question 3

Is this module reusable by future assets?

- yes: add it to Layer A library
- no: create it only as a limited identity module

### Missing module rule summary

The factory must always prefer:

1. reuse
2. variation
3. shared-library growth
4. limited identity modules only when justified

## 6. Asset Assembly Rules

Modules used in future production must carry enough structure to assemble safely and predictably.

### Required module assembly properties

- attachment points
- orientation rules
- scale rules
- material compatibility
- collision rules
- LOD compatibility

### Assembly validation requirements

Assemblies must validate:

- correct placement
- no overlaps
- correct facing
- correct footprint
- mobile performance compliance

### Assembly rule summary

No assembled asset should pass planning review if its module system cannot clearly answer:

- where pieces attach
- how pieces face
- how scale is maintained
- whether the asset remains mobile-safe

## 7. Variant Creation Rules

Variants should be created through modular variation, not careless duplication.

### Example family

- `HOUSE_COASTAL_001`

### Acceptable variants

- colour changes
- roof changes
- window changes
- garden changes
- porch changes

### Variant rule

Avoid creating duplicate assets when module swaps or recipe options can produce the same result.

### Preferred variant logic

- change modules first
- change recipe parameters second
- duplicate assembled assets only when the identity truly requires it

## 8. Approval System

The factory must support approval before and after production.

### Pre-production gate

Concept approval:

- `YES`
- `NO`

### Post-production gate

Asset review:

- `YES`
- `NO`

### Rejected assets

- do not enter the production library

### Approved assets

- receive final `Asset ID`
- enter the library

## 9. Library Growth Rules

Every approved asset can contribute to the Asset Factory library.

### Layer growth model

New modules:

- added to Layer A

Recipes:

- added to Layer B

Finished assets:

- added to Layer C

### Growth tracking fields

The library should track:

- reuse count
- compatible recipes
- family membership

### Growth rule summary

Approved assets should strengthen the reusable library, not bypass it.

## 10. Asset Registration Process

After validation and approval, the asset must be registered in the correct layer.

### Registration order

1. confirm approval result
2. assign final asset ID
3. attach metadata record
4. attach recipe linkage
5. attach module linkage
6. record family membership
7. record reuse count and compatibility notes
8. add to Layer C registry

### Registration rule

No asset enters the registered production library without:

- completed validation
- completed approval
- stable ID assignment
- linked dependencies

## 11. Production Gates

The factory must define explicit gates before an asset can enter the production library.

### Gate 1

Concept approved

### Gate 2

Recipe approved

### Gate 3

Dependencies complete

### Gate 4

Blender production approved

### Gate 5

Asset validation complete

### Gate 6

Library registration complete

### Gate rule summary

An asset must not skip gates.

Every gate should produce an explicit pass or fail result.

## 12. Production Readiness Status

This session prepares the rules that future production must follow.

### Ready after Session 3.5

- workflow definition
- dependency logic
- variant logic
- approval logic
- registration logic
- library growth rules

### Not authorized after Session 3.5

- Blender asset production
- GLB creation
- runtime integration
- gameplay systems
- backend systems
- OSM systems

## 13. Readiness Statement

This document is ready to serve as the production-rules foundation for the future GrowGo Modular Asset Factory.

It authorizes:

- workflow planning
- dependency planning
- approval gate planning
- registration planning

It does not authorize:

- asset creation
- Blender production
- GLB production
- runtime implementation
- gameplay systems
- backend systems
- OSM systems
