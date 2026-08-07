# GrowGo Session 212.2 — Atlas Asset Spatial Rules and World Population

Status: PASS

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

## Goal

Build the first planning-only Atlas world-population layer above the Phase 212.1 multi-asset placement system.

This phase does not attach Atlas automatically, does not create browser-owned rendering resources, and does not activate startup spawning. It converts approved lightweight world features into deterministic Atlas render commands only.

## Scope

Approved Atlas assets in the first spatial-rule registry:

- `TREE_EUCALYPTUS_001`
- `TREE_BOTTLEBRUSH_001`
- `SHRUB_COASTAL_LOW_001`
- `BUILDING_CIVIC_SPORTS_PAVILION_001`

Created modules:

- `client/developer-only-atlas-spatial-rule-registry.mjs`
- `client/developer-only-atlas-world-population-planner.mjs`

Created focused tests:

- `tests/client-developer-only-atlas-world-population-planner.test.mjs`

## Pipeline

The planning-only flow is:

Feature input
→ spatial rule lookup
→ feature-class eligibility
→ density expansion
→ exclusion-radius evaluation
→ minimum-spacing evaluation
→ deterministic multi-asset placement
→ lightweight batch-compatible Atlas render commands

## Spatial rule registry contract

Each approved asset rule defines:

- `ruleId`
- `ruleVersion`
- `assetId`
- `assetCategory`
- `supportedAssetFamilies`
- `allowedFeatureClasses`
- `prohibitedFeatureClasses`
- `minimumSpacing`
- `maximumDensity`
- `orientationPolicy`
- `scalePolicy`
- `lodPolicy`
- `exclusionRadiusRules`
- `regionConstraints`
- `deterministicRuleSeed`
- `status`

## World population planner behavior

The planner accepts:

- `regionId`
- `packageId`
- `recipeId`
- `selectorSeed`
- `viewportId` or tile identity
- lightweight feature descriptions
- performance budget

The planner returns a frozen world population plan containing:

- deterministic `populationPlanId`
- ordered render-command list
- rejected candidate list with explicit reason codes

The planner intentionally returns commands only. It does not expose:

- raw geometry payloads
- textures
- Blender data
- DOM objects
- Leaflet objects
- Canvas objects
- renderer instances

## Proven rules in this phase

### Vegetation

- vegetation features can resolve to eucalyptus, bottlebrush, and shrub candidates depending on feature class
- shrub placement can expand density deterministically on larger eligible areas
- tree spacing blocks overly dense duplicate tree placements
- shrub spacing stays separate from tree spacing so shrub density does not collapse valid tree placement rules

### Buildings

- civic and sports features can resolve to the pavilion asset
- undersized building footprints fail closed
- one deterministic building candidate is produced per eligible feature

### Exclusion and spacing

- vegetation can be rejected near building-footprint exclusions
- minimum spacing is enforced deterministically
- command, vegetation, and building budgets fail closed with explicit rejection reasons

## Atlas integration contract

This phase reuses the Phase 212.1 multi-asset placement system and remains compatible with Atlas render-command handoff.

The output shape stays lightweight:

- `assetId`
- `instanceId`
- `position`
- `scale`
- `rotation`
- `lod`

No second renderer, no direct DOM drawing path, and no map-attachment bypass were added.

## Diagnostics

Frozen planner status exposes only safe scalar data:

- registry version
- rule count
- population plan id
- candidate/accepted/rejected counts
- vegetation/building counts
- budget status
- last rejected reason
- last failure reason
- canonical safety flags

## Safety

Canonical safety flags remain:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

No startup activation, no automatic spawning, and no live world population were introduced in this phase.

## Result

Phase 212.2 proves Atlas can plan deterministic multi-asset world population using approved spatial rules while remaining planning-only, lightweight, and compatible with the existing Atlas render-command pipeline.
