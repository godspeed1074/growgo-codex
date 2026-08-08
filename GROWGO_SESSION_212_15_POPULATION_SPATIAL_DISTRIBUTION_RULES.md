# GrowGo Session Phase 212.15 — Population Spatial Distribution Rules

Status: implemented as a developer-only planning seam.

Goal:
- add deterministic spatial placement rules between recipe resolution and Atlas asset command generation
- preserve the existing render-command-only pipeline
- keep all runtime safety gates false

Foundation:
- normalized Atlas features
- population recipe resolution
- asset command pipeline foundation

New distribution rule coverage:

1. `PARK_PUBLIC_GREEN_RECIPE_001`
- deterministic tree spacing
- shrubs use edge clustering
- placements stay inside green-area bounds
- lower shrub density than tree spacing rhythm

2. `COASTAL_GREEN_RECIPE_001`
- deterministic coastal vegetation spacing
- shrubs prefer edge/boundary-biased positions
- trees stay inside the valid green area

3. `BUILDING_CIVIC_RECIPE_001`
- deterministic building anchor
- footprint-centroid-with-setback placement
- deterministic orientation handoff

4. `BUILDING_GENERIC_RECIPE_001`
- deterministic placeholder anchor logic
- no visible asset command required yet

Diagnostics exposed:
- `distributionRuleId`
- `generatedPlacementCount`
- `rejectedPlacementCount`
- `rejectionReasons`
- `densityTier`

Deterministic density tiers:
- `small`
- `medium`
- `large`

Density derives from:
- feature size
- matched recipe
- deterministic selector seed

Behavior preserved:
- deterministic output
- command budgets preserved
- developer-only activation only
- no renderer changes
- no scope changes
- no player runtime activation

Safety flags:
- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`
