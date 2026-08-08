# GrowGo Atlas Phase 212.46 — Cross-Region Journey, Meta-Collection, and World Exploration Cohesion Hooks

Goal:
- add deterministic planning-only hooks for connecting regional expeditions into larger world-scale exploration systems

Created:
- `client/developer-only-atlas-population-world-exploration-cohesion-hooks-rules.mjs`
- planner integration in `client/developer-only-atlas-world-population-planner.mjs`
- `tests/client-developer-only-atlas-world-exploration-cohesion-hooks-rules.test.mjs`

Supported cross-region journeys:
- national routes
- multi-region expeditions
- global exploration paths

Supported meta collections:
- expedition collections
- achievement collections
- regional completion sets

Supported world cohesion:
- consistent progression
- regional identity preservation
- exploration tiers

Supported large-scale achievement hooks:
- Australia Big Lap
- Route 66
- Camino-style journeys
- global campaigns

Diagnostics exposed:
- `worldJourneyProfileId`
- `metaCollectionId`
- `crossRegionCampaignId`
- `explorationTier`
- `worldCohesionReason`

Determinism contract:
- same input resolves the same world journey profile
- same input resolves the same meta collection
- same input resolves the same cross-region campaign
- unsupported contexts fail closed without runtime activation

Safety:
- planning-only
- renderer isolation preserved
- no startup activation
- no automatic spawning
- no live browser object exposure
- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Verification targets:
1. cross-region journeys stable
2. meta collections deterministic
3. world progression valid
4. same input same output
5. budgets preserved
6. automatic controller regression passes
