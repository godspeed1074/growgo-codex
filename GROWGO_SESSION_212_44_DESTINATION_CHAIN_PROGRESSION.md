# GrowGo Atlas Phase 212.44 — Destination Chain Progression, Reward Arc, and Exploration Campaign Hooks

Goal:
- add deterministic planning-only hooks that connect multiple destinations into exploration journeys and future gameplay campaigns

Created:
- `client/developer-only-atlas-population-exploration-progression-hooks-rules.mjs`
- planner integration in `client/developer-only-atlas-world-population-planner.mjs`
- `tests/client-developer-only-atlas-exploration-progression-hooks-rules.test.mjs`

Supported destination chains:
- coastal trails
- heritage routes
- nature discovery chains
- themed journeys

Supported reward arcs:
- discovery milestones
- completion rewards
- progression tiers

Supported exploration campaigns:
- seasonal events
- regional challenges
- collections

Supported progression hooks:
- destination importance
- route priority
- achievement connections

Diagnostics exposed:
- `campaignProfileId`
- `destinationChainId`
- `rewardArcProfileId`
- `progressionTier`
- `explorationReason`

Determinism contract:
- same input resolves the same campaign profile
- same input resolves the same destination chain
- same input resolves the same reward arc
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
1. destination chains stable
2. reward arcs deterministic
3. campaigns valid
4. progression tiers stable
5. same input same output
6. budgets preserved
7. automatic controller regression passes
