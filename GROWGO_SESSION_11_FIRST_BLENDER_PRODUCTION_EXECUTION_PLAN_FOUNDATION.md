# GrowGo Session 11 - First Blender Production Execution Plan Foundation

## Session Scope

This document defines the exact first Blender production execution plan for the GrowGo Modular Asset Factory proof build.

Production target:

- `BUILDING_HOUSE_COASTAL_COTTAGE_001`

Recipe:

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`

This is a final planning and specification phase before production.

This session does not:

- create Blender assets
- create GLB files
- run Blender automation
- write production scripts
- modify the renderer
- add gameplay systems
- add backend systems
- add OSM systems

The purpose of this session is to define:

1. the first production execution scope
2. the exact module build list
3. Codex task boundaries
4. Blender task boundaries
5. expected outputs
6. validation gates
7. commit checkpoints

Related follow-on planning document:

- `GROWGO_SESSION_12_FIRST_CONTROLLED_PRODUCTION_RUN_SETUP.md`

## 1. Source of Truth

This Session 11 planning document is governed by:

- `GROWGO_SESSION_8_FIRST_BLENDER_PRODUCTION_BATCH_SPECIFICATION_FOUNDATION.md`
- `GROWGO_SESSION_9_BLENDER_ASSET_FACTORY_IMPLEMENTATION_PLAN_FOUNDATION.md`
- `GROWGO_SESSION_10_RECIPE_EXPANSION_BATCH_1_FOUNDATION.md`
- `GROWGO_SESSION_7_5_CORE_LAYER_A_MODULE_SPECIFICATION_FOUNDATION.md`

If a future planning document conflicts with these documents, those source documents remain authoritative unless explicitly updated.

## 2. First Production Execution Scope

The first execution scope is intentionally narrow.

It exists to complete one full proof build path for the GrowGo Modular Asset Factory without introducing unrelated asset families or toolchain drift.

### 2.1 Execution target

Build the full Layer A set required to assemble:

- `BUILDING_HOUSE_COASTAL_COTTAGE_001`

using:

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`

### 2.2 Scope rule

Only the approved modules required by this recipe are in scope for the first production execution.

No commercial, civic, accommodation, landmark, or unrelated residential variation work should enter this batch unless it is explicitly required to unblock the proof build.

## 3. Exact Module Build List

### 3.1 Structure

- `MOD_FOUNDATION_STANDARD_RECT_001`
- `MOD_WALL_WEATHERBOARD_WHITE_001`
- `MOD_WALL_CORNER_STANDARD_001`
- `MOD_WALL_EXTENSION_SINGLE_BAY_001`

### 3.2 Roof

- `MOD_ROOF_GABLE_STANDARD_001`
- `MOD_CHIMNEY_COASTAL_SMALL_001`
- `MOD_TRIM_STANDARD_COASTAL_001`

### 3.3 Openings

- `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
- `MOD_DOOR_STANDARD_RESIDENTIAL_001`
- `MOD_DOOR_SERVICE_RESIDENTIAL_001`

### 3.4 Exterior

- `MOD_VERANDAH_STANDARD_TIMBER_001`
- `MOD_PORCH_COASTAL_SMALL_001`

### 3.5 Site

- `MOD_PATH_STANDARD_001`
- `MOD_DRIVEWAY_STANDARD_SINGLE_001`
- `MOD_FENCE_STANDARD_001`

### 3.6 Landscape

- `MOD_GROUND_GRASS_STANDARD_001`
- `MOD_BUSH_NATIVE_STANDARD_001`
- `MOD_TREE_EUCALYPTUS_STANDARD_001`
- `MOD_FLOWERBED_STANDARD_001`

### 3.7 Final assembly target

After the Layer A modules above are complete and validated, the execution path assembles:

- `BUILDING_HOUSE_COASTAL_COTTAGE_001`

## 4. First Production Sequence

The first production sequence should follow the dependency order already established in prior planning, but this session makes it execution-explicit.

### 4.1 Execution order

1. `MOD_FOUNDATION_STANDARD_RECT_001`
2. `MOD_WALL_WEATHERBOARD_WHITE_001`
3. `MOD_WALL_CORNER_STANDARD_001`
4. `MOD_WALL_EXTENSION_SINGLE_BAY_001`
5. wall socket validation review
6. `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
7. `MOD_DOOR_STANDARD_RESIDENTIAL_001`
8. `MOD_DOOR_SERVICE_RESIDENTIAL_001`
9. `MOD_ROOF_GABLE_STANDARD_001`
10. `MOD_CHIMNEY_COASTAL_SMALL_001`
11. `MOD_TRIM_STANDARD_COASTAL_001`
12. `MOD_VERANDAH_STANDARD_TIMBER_001`
13. `MOD_PORCH_COASTAL_SMALL_001`
14. `MOD_PATH_STANDARD_001`
15. `MOD_DRIVEWAY_STANDARD_SINGLE_001`
16. `MOD_FENCE_STANDARD_001`
17. `MOD_GROUND_GRASS_STANDARD_001`
18. `MOD_BUSH_NATIVE_STANDARD_001`
19. `MOD_TREE_EUCALYPTUS_STANDARD_001`
20. `MOD_FLOWERBED_STANDARD_001`
21. `RECIPE_HOUSE_COASTAL_COTTAGE_001` assembly pass
22. `BUILDING_HOUSE_COASTAL_COTTAGE_001` validation and export preparation

### 4.2 Execution discipline

- do not skip ahead to full assembly before opening sockets are reviewed
- do not finalize site and landscape before the house footprint and entry route are locked
- do not approve exports before all validation gates pass

## 5. Codex Task Boundaries

Codex is responsible for specification-following coordination, validation guidance, and scope control.

### 5.1 Codex should

- follow existing approved specifications
- inspect only required files and records
- create only approved modules and metadata records when production begins
- avoid unrelated repo changes
- avoid redesigning factory architecture
- run only required validation work
- preserve the existing naming, recipe, and material rule set
- keep the proof build scoped to the approved cottage recipe

### 5.2 Codex should not

- invent new assets
- change naming systems
- change recipe rules
- change style direction
- add extra families into the proof build
- widen the batch to commercial or civic work without a new approved session

### 5.3 Codex boundary rule

Codex is the specification and validation boundary keeper.

If a production decision would alter naming, recipe logic, module families, or visual direction, that change must be treated as out of scope for this first execution batch.

## 6. Blender Task Boundaries

Blender is responsible for producing the approved visual and structural module outputs once production begins.

### 6.1 Blender should

1. create module geometry
2. apply approved materials
3. create sockets
4. create LOD versions
5. validate scale
6. export approved files

### 6.2 Blender should not

- redesign module families
- invent replacement IDs
- bypass socket rules
- apply unapproved material families
- export incomplete LOD sets
- introduce unrelated decorative assets into the batch

### 6.3 Blender boundary rule

Blender executes the approved build plan.

It does not redefine the planning system.

## 7. Expected Outputs

The first production execution should yield both Layer A and Layer C outputs.

### 7.1 Layer A output examples

- `MOD_WALL_WEATHERBOARD_WHITE_001_LOD0.glb`
- `MOD_WALL_WEATHERBOARD_WHITE_001_LOD1.glb`
- `MOD_WALL_WEATHERBOARD_WHITE_001_LOD2.glb`
- `MOD_ROOF_GABLE_STANDARD_001_LOD1.glb`
- `MOD_PATH_STANDARD_001_LOD1.glb`

### 7.2 Layer C output example

- `BUILDING_HOUSE_COASTAL_COTTAGE_001_LOD1.glb`

### 7.3 Required metadata

Every approved output must include:

- asset ID
- recipe reference where applicable
- family reference
- material references
- LOD information
- validation status

Recommended additional metadata:

- dimensions
- footprint reference
- dependency set
- version reference
- export manifest reference

## 8. Validation Gates

The first production execution must pass four explicit gates.

## Gate 1 - Module Creation Complete

Check:

- naming is correct
- metadata is complete
- scale is correct
- sockets are present and correctly named

### Gate 1 rule

No module advances to recipe assembly until it passes the module-complete gate.

## Gate 2 - Assembly Complete

Check:

- recipe resolves successfully
- modules connect correctly
- footprint is correct
- orientation is correct
- road-facing entry logic is preserved

### Gate 2 rule

No export preparation begins until the recipe assembly is structurally correct.

## Gate 3 - Export Complete

Check:

- GLB is valid
- LODs are present
- metadata is attached
- export naming is correct

### Gate 3 rule

No visual approval is requested until technical export readiness is confirmed.

## Gate 4 - Visual Approval

Check:

- lighthouse art direction influence is visible
- papercut style is preserved
- mobile readability is strong
- north-facing overview readability is clear

### Gate 4 rule

The proof build is only considered complete when the export-ready asset also passes the visual style gate.

## 9. Commit Strategy

The first execution plan should use three main checkpoints.

## Commit 1 - Module Creation

Contains:

- Layer A module production completion
- module metadata completion
- socket definitions
- module-level validation status

## Commit 2 - Recipe Assembly

Contains:

- `RECIPE_HOUSE_COASTAL_COTTAGE_001` assembly completion
- house footprint verification
- module connection verification
- recipe-level validation status

## Commit 3 - Validation and Export

Contains:

- LOD verification
- export-readiness verification
- metadata attachment verification
- proof asset export completion
- final visual approval record

### Commit strategy rule

Do not compress the entire proof build into one checkpoint.

The three-checkpoint structure exists so module issues, assembly issues, and export issues can be isolated cleanly.

## 10. Production Readiness Status

This execution plan is now ready as the final planning layer before real production work.

Ready:

- exact scope
- exact module list
- Codex boundaries
- Blender boundaries
- output expectations
- validation gates
- commit checkpoints

Still intentionally deferred:

- Blender modeling
- LOD mesh creation
- GLB generation
- automation
- runtime integration

## 11. Session Outcome

Session 11 establishes the final pre-production execution plan for the GrowGo Modular Asset Factory proof build.

It turns the earlier batch, implementation, and recipe planning into a concrete execution boundary for the first real production target:

- `BUILDING_HOUSE_COASTAL_COTTAGE_001`

No Blender production is started in this session.
