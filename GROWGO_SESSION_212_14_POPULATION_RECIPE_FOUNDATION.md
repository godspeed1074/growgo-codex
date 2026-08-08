# GrowGo Session Phase 212.14 — Population Recipe Foundation

Status: PASS

## Goal

Create the first deterministic bridge from normalized Atlas features into GrowGo population commands.

## Problem addressed

The live Atlas feature path already proved:

- developer scope
- renderer handoff
- Custom25D feature source
- live feature adapter
- normalized features

But live population planning could still stop at:

- `normalizedFeatureCount > 0`
- `populationPlanId = null`
- `plannedCommandCount = 0`

because no explicit population recipe layer existed between normalized feature classes and asset command generation.

## Foundation added

Created the first developer-only population recipe foundation:

- population recipe registry
- deterministic recipe resolver
- feature-class to recipe mapping
- asset command generation bridge

## Initial supported mappings

### 1. Park

Input:

- `featureClass = park`

Output:

- `PARK_PUBLIC_GREEN_RECIPE_001`

Assets:

- `TREE_EUCALYPTUS_001`
- `SHRUB_COASTAL_LOW_001`

### 2. Coastal vegetation

Input:

- `featureClass = vegetation_area`
- `featureClass = coastal_green`
- `featureClass = roadside_green`
- `featureClass = reserve`

Output:

- `COASTAL_GREEN_RECIPE_001`

Assets:

- `TREE_BOTTLEBRUSH_001`
- `SHRUB_COASTAL_LOW_001`

### 3. Civic building

Input:

- `featureClass = civic_site`
- `featureClass = sports_ground`

Output:

- `BUILDING_CIVIC_RECIPE_001`

Asset:

- `BUILDING_CIVIC_SPORTS_PAVILION_001`

### 4. Generic building placeholder

Input:

- `featureClass = building_footprint`

Output:

- `BUILDING_GENERIC_RECIPE_001`

Visible asset:

- none yet

## Diagnostics

Planner/registry diagnostics now expose:

- `matchedRecipeId`
- `matchedFeatureClass`
- `generatedCommandCount`
- `rejectedRecipeCount`

## Preserved behavior

- deterministic output only
- stable IDs
- no random placement
- no player runtime activation
- no renderer changes
- no scope changes
- all four canonical safety flags remain false

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Follow-up

This phase establishes the first recipe bridge only.
Safari/manual automatic-population retesting remains required to confirm the live normalized feature stream now produces non-zero population commands end-to-end.
