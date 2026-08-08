# GrowGo Atlas Session 212.49 — World Legacy, Player Memory, and Persistent Discovery Cohesion Hooks

Status: PASS

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
Add a developer-only deterministic legacy-cohesion layer that turns proven world-wonder, signature-route, collection, and cross-generation memory signals into long-term world legacy hooks while keeping player progress separate.

What was added:

- `client/developer-only-atlas-population-world-legacy-discovery-cohesion-hooks-rules.mjs`
- `tests/client-developer-only-atlas-world-legacy-discovery-cohesion-hooks-rules.test.mjs`
- planner integration in `client/developer-only-atlas-world-population-planner.mjs`

Developer-only legacy cohesion outputs:

- `worldLegacyProfileId`
- `discoveryCohesionId`
- `legacyTier`
- `memoryCategory`
- `legacyReason`

Deterministic rule coverage:

1. Coastal icons and expedition collections
2. Heritage destinations and landmark collections
3. Community routes and local memory collections
4. Mythic discovery odysseys and milestone collections

World vs player separation:

- this layer consumes only world-level identity inputs
- it does not depend on player-specific progress state
- memory cohesion remains anchored to world identity, collections, wonders, and shared discovery meaning

Planner integration:

- The world population planner now resolves world-legacy cohesion after:
  - world exploration cohesion
  - signature route legacy
  - world wonder discovery memory
- The planner now emits:
  - `worldLegacyDiscoveryCohesionDecisions`
- Resolved feature recipe entries and accepted placements carry the same legacy cohesion diagnostics.

Safety:

- planning only
- deterministic output preserved
- command budgets preserved
- renderer isolation preserved
- developer-only activation preserved
- no startup behavior added
- no automatic spawning added

Canonical safety flags:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Proof summary:

- same legacy-cohesion inputs produce the same world legacy outputs
- supported world identity families resolve to stable cohesion identities
- world/player separation remains explicit
- planner status exposes frozen serializable cohesion diagnostics
- no raw renderer, DOM, Canvas, or browser references are exposed

Suggested commit:

`feat(atlas): add world legacy cohesion hooks`
