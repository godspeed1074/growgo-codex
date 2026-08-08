# GrowGo Session Phase 212.17 — Contextual World-Fill Rules

Status: implemented as a developer-only contextual planning seam.

Goal:
- move Atlas population from isolated placements toward believable place context
- preserve deterministic output
- keep planning isolated from renderer/runtime activation

Supported contextual world-fill categories:

1. Residential context
- input: `building_footprint`
- outputs:
  - front setback context
  - backyard vegetation context
  - boundary placeholder context
- preserves road-facing orientation when present

2. Commercial context
- input: retail / shop / cafe classified building footprints
- outputs:
  - frontage relationship context
  - pedestrian-side preference context
  - open-space allowance context

3. Civic context
- input: `civic_site`, `sports_ground`
- outputs:
  - building anchor context
  - open surrounding area context
  - vegetation edge context

4. Park context
- input: `park`
- outputs:
  - edge planting context
  - open area preservation context

5. Coastal context
- input: `coastal_green`, `reserve`, `roadside_green`, `vegetation_area`
- outputs:
  - shrub-heavy transition context
  - reduced tree density context
  - deterministic coastal layout preservation

Diagnostics exposed:
- `contextRuleId`
- `worldFillCategory`
- `generatedSubRecipeCount`
- `childPlacementCount`
- `contextReason`

Preserved:
- deterministic generation
- command budgets
- developer-only activation
- renderer isolation
- no production runtime enablement

Safety flags:
- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`
