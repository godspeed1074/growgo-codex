# GROWGO SESSION 161 — ASSET FACTORY DEPENDENCY MANAGEMENT FOUNDATION

## Summary

Created `ASSET_DEPENDENCY_MANAGEMENT_LAYER_001`, a deterministic dependency tracking layer that maps how Asset Factory assets relate to recipes, variants, environments, Atlas usage, and supporting lifecycle records.

This layer:

- builds a dependency graph from existing Asset Factory data
- records explicit dependency relationships
- validates references and dependency types
- detects invalid circular chains
- resolves downstream dependency chains deterministically

It does not modify assets, bypass approval, or change Atlas truth.

## Files Changed

- `asset-factory/asset-dependency-management.mjs`
- `tests/asset-factory-asset-dependency-management.test.mjs`
- `GROWGO_SESSION_161_ASSET_DEPENDENCY_MANAGEMENT_FOUNDATION.md`

## Target System

Created:

- `ASSET_DEPENDENCY_MANAGEMENT_LAYER_001`

Output:

- `ASSET_DEPENDENCY_RECORD_001`
- `ASSET_DEPENDENCY_VALIDATION_001`

## Input

Consumes:

- asset registry
- recipes
- variants
- version records
- change records

The layer derives dependency edges from the current registry and pack recipes, variant definitions, and lifecycle context already established in previous sessions.

## Dependency Record Structure

Each `ASSET_DEPENDENCY_RECORD_001` includes:

- source ID
- target ID
- dependency type
- dependency reason
- impact level

## Dependency Types

Supported:

- `ASSET_USES_RECIPE`
- `RECIPE_USES_ASSET`
- `VARIANT_DEPENDS_ON_ASSET`
- `ASSET_USED_BY_ENVIRONMENT`
- `ASSET_USED_BY_ATLAS`

## Dependency Model

The graph currently models:

- direct asset -> primary recipe ownership
- direct recipe -> owning asset links
- variant node -> target asset links
- asset -> environment usage links
- asset -> Atlas usage links

To keep the graph structurally stable, `RECIPE_USES_ASSET` is intentionally limited to direct primary recipe ownership rather than broad family compatibility. That keeps the dependency graph traceable and avoids false circular chains caused by general compatibility metadata.

## Default Verified Graph

Verified example asset:

- `GROUND_BEACH_SAND_001`

Direct dependencies include:

- `ASSET_USES_RECIPE` -> `BEACH_ENVIRONMENT_RECIPE_001`
- `ASSET_USED_BY_ENVIRONMENT` -> `ENVIRONMENT::BEACH_GROUND_COVER`
- `ASSET_USED_BY_ENVIRONMENT` -> `ENVIRONMENT::DUNE_EDGE_TREATMENT`
- `ASSET_USED_BY_ENVIRONMENT` -> `ENVIRONMENT::SHORELINE_TRANSITION`
- `ASSET_USED_BY_ATLAS` -> `ATLAS::BEACH`
- `ASSET_USED_BY_ATLAS` -> `ATLAS::COASTLINE`
- `ASSET_USED_BY_ATLAS` -> `ATLAS::SHORELINE`

## Dependency Chain Resolution

The layer supports deterministic dependency-chain resolution from any valid source node.

Verified chain behavior:

- recipe link resolution works
- environment usage links are preserved
- Atlas usage links are preserved
- variant-derived asset dependencies remain traversable

## Cycle Handling

The dependency graph explicitly checks for invalid cycles.

Behavior:

- intentional direct asset <-> recipe mirror links are tolerated
- larger circular chains are rejected
- cycles are never accepted silently

This keeps the graph useful for management without misclassifying the normal recipe ownership mirror as a failure.

## Validation

Created:

- `ASSET_DEPENDENCY_VALIDATION_001`

Checks passed:

- references exist
- dependency type valid
- no invalid cycles
- deterministic graph output

Deterministic graph hash is stored on the validation record.

## Test Results

Added coverage for:

- create dependency
- resolve dependency chain
- invalid reference handling
- cycle detection
- deterministic output
- explicit validation

Focused supporting test pass completed successfully.

Result:

- `19` tests passed
- `0` tests failed

## Readiness

`ASSET_DEPENDENCY_MANAGEMENT_LAYER_001` is ready to support larger-scale Asset Factory management by exposing a deterministic, validated dependency graph across assets, recipes, variants, environment usage, and Atlas usage.
