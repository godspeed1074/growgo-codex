# GrowGo Modular Bible - Asset Factory Foundation

## Phase 1 Scope

This document defines the permanent architecture contract for the GrowGo Asset Factory.

Phase 1 is documentation only. It does not create game assets, renderer systems, gameplay systems, backend systems, or validation code. It defines the rules and structure that future implementation phases must follow.

## 1. Purpose and Rules

The Asset Factory exists to define how GrowGo creates, stores, validates, versions, assembles, and reuses assets across the game.

Permanent rules:

- assets must be modular and reusable
- assets must be safe for mobile performance
- assets must be versioned without losing identity
- assets must be deterministically reproducible when generation rules apply
- assets must be discoverable through a registry
- asset recipes must be separable from asset components
- asset validation must happen before an asset can be marked production-ready
- no asset may rely on hidden runtime mutation for its identity

Phase 1 does not authorize runtime generation, live assembly, or renderer attachment.

## 2. Permanent Asset ID System

Asset IDs are permanent, stable identifiers. They do not change when an asset display name, description, or art direction label changes.

Examples:

- `BUILDING_BAKERY_001`
- `TREE_EUCALYPTUS_001`
- `ROAD_CURVE_SMALL_001`
- `NPC_SHOPKEEPER_001`

Permanent ID rules:

- every asset has exactly one permanent `assetId`
- `assetId` values are immutable once assigned
- display names may change without changing `assetId`
- versions are tracked separately from `assetId`
- retired assets keep their IDs and are marked inactive rather than renamed into reuse
- IDs are uppercase snake case with a category prefix and numeric sequence suffix
- IDs must remain human-auditable

Recommended general pattern:

- `<CATEGORY>_<NAME>_<SEQUENCE>`

Examples by type:

- `BUILDING_BAKERY_001`
- `ROAD_CURVE_SMALL_001`
- `TERRAIN_GRASS_PATCH_001`
- `VEHICLE_TRUCK_SMALL_001`

## 3. Asset Categories

Permanent top-level categories:

- buildings
- terrain
- roads
- rail
- nature
- landmarks
- NPCs
- animals
- vehicles
- decorations
- seasonal assets

Categories may gain subcategories later, but these top-level categories remain the canonical first-level grouping for the registry.

## 4. Asset Metadata Schema

Every asset must carry a metadata record with the following required fields:

- `assetId`
- `category`
- `version`
- `creatorSource`
- `performanceTargets`
- `lod`
- `components`
- `tags`
- `validationState`

Required field contract:

- `assetId`: permanent immutable ID string
- `category`: one canonical top-level asset category
- `version`: semantic or structured asset version identifier
- `creatorSource`: origin record such as internal author, toolchain, or licensed source
- `performanceTargets`: platform-facing budget metadata for storage, memory, draw cost, and texture usage
- `lod`: level-of-detail description and thresholds
- `components`: declared component dependencies and composition parts
- `tags`: searchable descriptive labels
- `validationState`: authoritative validation status

Recommended metadata extension fields for later phases:

- `displayName`
- `description`
- `recipeId`
- `deprecated`
- `replacementAssetId`
- `compatibilityProfile`
- `renderingNotes`
- `generationSeedRules`
- `boundingProfile`

## 5. Component and Module System

The Asset Factory must support reusable components as first-class building blocks.

Core reusable module groups include:

- walls
- roofs
- windows
- doors
- terrain pieces
- vegetation pieces
- road pieces

Component rules:

- components must have their own stable component IDs
- components may be reused by many assets
- component compatibility must be explicit, not implied
- components may declare attachment points, dimensions, and orientation rules
- components may have independent validation and versioning
- complete assets must declare which component versions they require

Phase 1 does not define runtime attachment code. It defines only the architecture contract.

## 6. Recipe System

A recipe defines how complete assets are assembled from validated components.

Example:

- `BAKERY_RECIPE_456`

Uses:

- wall module
- door module
- roof module
- sign module

Recipe rules:

- recipes have stable `recipeId` values
- recipes reference component IDs and component versions
- recipes define placement, orientation, scale rules, and optional deterministic variations
- recipes may declare allowed theme variants
- recipes must not silently substitute incompatible components
- recipe changes produce a new recipe version
- recipe resolution must remain deterministic

Recipe outputs:

- a recipe may describe one complete asset
- multiple assets may share component families while using different recipes
- recipes may be location-aware only through explicit deterministic inputs, never live hidden state

## 7. Asset Registry Structure

The future registry must support discovery, validation, and assembly planning.

Required registry indexing dimensions:

- by `assetId`
- by category
- by version
- by tag
- by validation state
- by component dependency
- by recipe dependency
- by performance profile

Registry structure expectations:

- one authoritative registry entry per asset
- separate registry data for components and recipes
- explicit references between assets, components, and recipes
- support for active, deprecated, retired, and draft states
- support for deterministic discovery by exact ID and filtered lookup by metadata

Phase 1 prepares the structure for a future Asset Registry implementation. It does not implement the registry itself.

## 8. Versioning Rules

Versioning must preserve identity while allowing controlled evolution.

Rules:

- `assetId` is permanent
- version changes do not create a new `assetId`
- breaking structural changes increment the asset version
- component version changes that affect compatibility must be explicit
- recipe version changes must be explicit
- validation must run against the exact declared versions
- deprecated assets remain queryable for migration and compatibility review

Recommended version tracking levels:

- asset version
- component version
- recipe version
- validation schema version

## 9. Mobile Performance Requirements

The Asset Factory must be designed for mobile-first performance.

Priority requirements:

- low storage footprint
- low RAM usage
- low GPU usage
- texture reuse
- instancing where compatible
- LOD support
- batching-friendly assembly

Permanent performance rules:

- avoid unique textures when shared atlases or reusable materials are sufficient
- prefer reusable geometry modules over duplicated bespoke meshes
- keep per-asset metadata small and structured
- define LOD fallbacks for heavier assets
- support batching and instancing through repeated component usage
- validation must reject assets that exceed agreed mobile budgets

## 10. Deterministic Generation Rules

When an asset or assembled object depends on generation, it must be deterministic.

The same:

- location
- seed
- recipe version

must produce the same result for all players.

Deterministic rules:

- deterministic inputs must be explicit
- no hidden runtime randomness may affect authoritative outcomes
- no player-local device differences may affect the final assembled result
- recipe resolution must be version-pinned
- deterministic generation must use canonical coordinate and seed rules

## 11. Validation Rules

Assets, components, and recipes must pass validation before they are marked ready.

Validation must include:

- naming validation
- missing component checks
- performance budget checks
- compatibility checks

Minimum validation expectations:

- naming validation confirms permanent ID shape and category consistency
- missing component checks reject unresolved recipe or asset dependencies
- performance budget checks reject assets outside storage, memory, or draw-cost budgets
- compatibility checks reject invalid component combinations, mismatched versions, and unsupported LOD pairings

Recommended future validation outputs:

- `draft`
- `validated`
- `deprecated`
- `retired`
- `blocked`

## 12. Future Implementation Boundaries

This Phase 1 architecture is ready for later implementation work in the following bounded order:

1. component and recipe schema definition
2. asset registry implementation
3. validation pipeline implementation
4. deterministic assembly tooling
5. renderer-facing integration planning

Phase 1 does not authorize implementation of those systems yet.

## 13. Readiness Statement

This document is ready to serve as the foundation for a future Asset Registry implementation.

It establishes:

- permanent asset identity
- canonical categories
- required metadata
- component and recipe architecture
- deterministic generation rules
- mobile performance expectations
- validation boundaries

No gameplay, backend, renderer, or live asset behavior is changed by this phase.
