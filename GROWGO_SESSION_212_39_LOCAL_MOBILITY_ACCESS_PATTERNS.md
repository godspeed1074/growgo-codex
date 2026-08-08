# GrowGo Atlas Phase 212.39 — Local Mobility, Daily Flow, and Access Pattern Hooks

Goal:
- add deterministic planning-only hooks for how people access and move between places

Created:
- `client/developer-only-atlas-population-local-mobility-access-hooks-rules.mjs`
- planner integration in `client/developer-only-atlas-world-population-planner.mjs`
- `tests/client-developer-only-atlas-local-mobility-access-hooks-rules.test.mjs`

Supported access patterns:
- residential
- commercial
- civic
- visitor
- recreation

Supported mobility profiles:
- walking
- driving
- mixed
- tourism
- recreation

Supported daily flow:
- morning
- daytime
- evening
- seasonal movement

Supported accessibility:
- path priority
- entrance access
- connection priority

Diagnostics exposed:
- `mobilityProfileId`
- `accessPatternId`
- `flowPriority`
- `movementReason`
- `accessibilityProfile`

Determinism contract:
- same input resolves the same mobility profile
- same input resolves the same access pattern
- same input resolves the same flow priority
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
1. mobility selection stable
2. access patterns deterministic
3. daily flows valid
4. accessibility rules stable
5. budgets preserved
6. automatic controller regression passes
