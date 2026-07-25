# GrowGo Session 12 - First Controlled Production Run Setup

## Session Scope

This document prepares the first controlled production run of the GrowGo Modular Asset Factory proof asset.

Production target:

- `BUILDING_HOUSE_COASTAL_COTTAGE_001`

Recipe:

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`

This session prepares production execution.

This session does not:

- expand asset scope
- redesign the visual style
- add unrelated modules
- create gameplay systems
- modify the renderer
- add backend systems
- add OSM systems

The purpose of this session is to prepare:

1. the production workspace structure
2. the first module batch checklist
3. the recipe validation checklist
4. the output directory plan
5. the production safety rules

## 1. Source of Truth

This Session 12 planning document is governed by:

- `GROWGO_SESSION_11_FIRST_BLENDER_PRODUCTION_EXECUTION_PLAN_FOUNDATION.md`
- `GROWGO_SESSION_9_BLENDER_ASSET_FACTORY_IMPLEMENTATION_PLAN_FOUNDATION.md`
- `GROWGO_SESSION_8_FIRST_BLENDER_PRODUCTION_BATCH_SPECIFICATION_FOUNDATION.md`

If a future planning document conflicts with these documents, those source documents remain authoritative unless explicitly updated.

## 2. Controlled Production Run Purpose

The first controlled production run is the final setup layer before any real proof-build asset work begins.

Its purpose is to ensure:

- the scope is frozen
- the required module list is confirmed
- the recipe checklist is confirmed
- output locations are predetermined
- production safety rules are explicit

This session is still setup-only.

It does not authorize broader asset production beyond the approved proof house path.

## 3. Production Target

The proof asset for the first controlled run is:

- `BUILDING_HOUSE_COASTAL_COTTAGE_001`

using:

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`

### 3.1 Required module set

#### Structure

- `MOD_FOUNDATION_STANDARD_RECT_001`
- `MOD_WALL_WEATHERBOARD_WHITE_001`
- `MOD_WALL_CORNER_STANDARD_001`
- `MOD_WALL_EXTENSION_SINGLE_BAY_001`

#### Roof

- `MOD_ROOF_GABLE_STANDARD_001`
- `MOD_CHIMNEY_COASTAL_SMALL_001`
- `MOD_TRIM_STANDARD_COASTAL_001`

#### Openings

- `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
- `MOD_DOOR_STANDARD_RESIDENTIAL_001`
- `MOD_DOOR_SERVICE_RESIDENTIAL_001`

#### Exterior

- `MOD_VERANDAH_STANDARD_TIMBER_001`
- `MOD_PORCH_COASTAL_SMALL_001`

#### Site

- `MOD_PATH_STANDARD_001`
- `MOD_DRIVEWAY_STANDARD_SINGLE_001`
- `MOD_FENCE_STANDARD_001`

#### Landscape

- `MOD_GROUND_GRASS_STANDARD_001`
- `MOD_BUSH_NATIVE_STANDARD_001`
- `MOD_TREE_EUCALYPTUS_STANDARD_001`
- `MOD_FLOWERBED_STANDARD_001`

## 4. Production Workspace Structure

The first controlled production run should use a stable workspace shape derived from the implementation-plan architecture.

### 4.1 Production workspace layout

```text
GrowGo_Blender_Factory/
    recipes/
    modules/
    builders/
    validators/
    exporters/
    materials/
    metadata/
    runs/
```

### 4.2 Controlled run working structure

Inside `runs/`, the first controlled production run should be prepared as:

```text
runs/
    BUILDING_HOUSE_COASTAL_COTTAGE_001/
        checklists/
        inputs/
        reviews/
        exports/
        validation/
```

### 4.3 Folder responsibilities

#### `checklists/`

Contains:

- module batch checklist
- recipe checklist
- validation gate checklist
- signoff notes

#### `inputs/`

Contains:

- approved recipe reference
- approved module list
- material profile reference
- LOD profile reference

#### `reviews/`

Contains:

- style review notes
- socket review notes
- assembly review notes

#### `exports/`

Contains planned export destinations for:

- Layer A outputs
- Layer C outputs
- metadata manifests

#### `validation/`

Contains:

- module validation summaries
- recipe assembly validation summaries
- export validation summaries
- visual approval records

## 5. First Module Batch Checklist

The first production run should confirm the complete Layer A module batch before any production task is considered active.

### 5.1 Structure checklist

- `MOD_FOUNDATION_STANDARD_RECT_001`
- `MOD_WALL_WEATHERBOARD_WHITE_001`
- `MOD_WALL_CORNER_STANDARD_001`
- `MOD_WALL_EXTENSION_SINGLE_BAY_001`

### 5.2 Roof checklist

- `MOD_ROOF_GABLE_STANDARD_001`
- `MOD_CHIMNEY_COASTAL_SMALL_001`
- `MOD_TRIM_STANDARD_COASTAL_001`

### 5.3 Openings checklist

- `MOD_WINDOW_RESIDENTIAL_STANDARD_001`
- `MOD_DOOR_STANDARD_RESIDENTIAL_001`
- `MOD_DOOR_SERVICE_RESIDENTIAL_001`

### 5.4 Exterior checklist

- `MOD_VERANDAH_STANDARD_TIMBER_001`
- `MOD_PORCH_COASTAL_SMALL_001`

### 5.5 Site checklist

- `MOD_PATH_STANDARD_001`
- `MOD_DRIVEWAY_STANDARD_SINGLE_001`
- `MOD_FENCE_STANDARD_001`

### 5.6 Landscape checklist

- `MOD_GROUND_GRASS_STANDARD_001`
- `MOD_BUSH_NATIVE_STANDARD_001`
- `MOD_TREE_EUCALYPTUS_STANDARD_001`
- `MOD_FLOWERBED_STANDARD_001`

### 5.7 Module batch confirmation rule

The controlled run is not ready unless every required module is:

- approved in scope
- named correctly
- linked to the correct recipe dependency
- mapped to the correct validation gates

## 6. Recipe Validation Checklist

Before accepting the proof recipe into the controlled run, confirm the following for:

- `RECIPE_HOUSE_COASTAL_COTTAGE_001`

### 6.1 Identity

- recipe ID is correct
- building ID is correct
- family mapping is correct

### 6.2 Dependency completeness

- all required modules are present in the run scope
- optional modules are clearly marked
- no out-of-scope modules are silently introduced

### 6.3 Structural rules

- footprint is confirmed
- orientation rules are confirmed
- road-facing entry rule is confirmed
- front path alignment rule is confirmed

### 6.4 Style rules

- lighthouse visual language remains the anchor
- papercut 2.5D style remains locked
- north-facing camera expectations remain locked
- mobile readability remains a hard requirement

### 6.5 Technical rules

- naming matches approved IDs
- Session 7.5 socket vocabulary is preserved
- LOD expectations are present
- metadata requirements are present

## 7. Output Directory Plan

The first controlled production run should plan outputs before production begins.

### 7.1 Layer A output plan

Planned output structure:

```text
exports/
    layer-a/
        MOD_FOUNDATION_STANDARD_RECT_001/
        MOD_WALL_WEATHERBOARD_WHITE_001/
        MOD_WALL_CORNER_STANDARD_001/
        MOD_WALL_EXTENSION_SINGLE_BAY_001/
        MOD_ROOF_GABLE_STANDARD_001/
        MOD_CHIMNEY_COASTAL_SMALL_001/
        MOD_TRIM_STANDARD_COASTAL_001/
        MOD_WINDOW_RESIDENTIAL_STANDARD_001/
        MOD_DOOR_STANDARD_RESIDENTIAL_001/
        MOD_DOOR_SERVICE_RESIDENTIAL_001/
        MOD_VERANDAH_STANDARD_TIMBER_001/
        MOD_PORCH_COASTAL_SMALL_001/
        MOD_PATH_STANDARD_001/
        MOD_DRIVEWAY_STANDARD_SINGLE_001/
        MOD_FENCE_STANDARD_001/
        MOD_GROUND_GRASS_STANDARD_001/
        MOD_BUSH_NATIVE_STANDARD_001/
        MOD_TREE_EUCALYPTUS_STANDARD_001/
        MOD_FLOWERBED_STANDARD_001/
```

### 7.2 Layer C output plan

Planned output structure:

```text
exports/
    layer-c/
        BUILDING_HOUSE_COASTAL_COTTAGE_001/
```

### 7.3 Metadata output plan

Planned output structure:

```text
exports/
    metadata/
        layer-a/
        layer-c/
        manifests/
```

### 7.4 Output rule

No export destination should be invented ad hoc during production.

The first run should use the approved directory plan from the start so validation, review, and final packaging stay predictable.

## 8. Production Safety Rules

The first build must:

- use only approved IDs
- follow existing naming rules
- follow approved papercut style
- follow mobile polygon budgets
- use sockets from Session 7.5
- preserve recipe structure

### 8.1 Safety constraints

- no new design decisions during production
- no unrelated modules may enter the batch
- no naming substitutions are allowed
- no recipe rewrites are allowed
- no style redirection is allowed
- no silent expansion into new asset families is allowed

### 8.2 Controlled-run failure rule

If a required output depends on a new design choice, a renamed module, or a new family-level rule, the controlled run must stop and return to planning before production continues.

## 9. Validation Checklist

Before accepting output from the first controlled run, the following must be checked.

### 9.1 Style

- lighthouse visual language is present
- papercut 2.5D style is preserved
- correct camera direction is preserved

### 9.2 Modularity

- modules remain separate
- sockets are valid
- the recipe assembles correctly

### 9.3 Technical

- naming is correct
- metadata is complete
- LOD structure is correct

### 9.4 Performance

- polygon targets are met
- materials are reused appropriately

## 10. Ready / Not Ready Criteria

### Ready for first Blender build when

- production workspace structure is prepared
- required module checklist is confirmed
- recipe checklist is confirmed
- output directory plan is confirmed
- production safety rules are confirmed
- validation checklist is confirmed

### Not ready for first Blender build when

- any required module is ambiguous
- output locations are undefined
- socket rules are unclear
- recipe orientation rules are unclear
- visual direction is still under debate

## 11. Production Readiness Status

The first controlled production run is prepared at the documentation and setup level.

Prepared:

- production environment structure
- module checklist
- recipe checklist
- output directory plan
- safety rules
- validation checklist

Still intentionally not started:

- large asset production
- Blender geometry creation
- LOD generation
- GLB export
- automation

## 12. Session Outcome

Session 12 prepares the first controlled production run for:

- `BUILDING_HOUSE_COASTAL_COTTAGE_001`

It establishes the workspace structure, scope discipline, review structure, and acceptance checklists needed before the first Blender proof build begins.

No large asset production is started in this session.
