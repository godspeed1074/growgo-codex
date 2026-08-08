# GrowGo Atlas Phase 212.38 — Local Economy, Market Cycle, and Service-Place Hooks

Goal:
- add deterministic planning-only hooks for how places support local economies, services, and recurring market activity

Created:
- `client/developer-only-atlas-population-local-economy-service-hooks-rules.mjs`
- planner integration in `client/developer-only-atlas-world-population-planner.mjs`
- `tests/client-developer-only-atlas-local-economy-service-hooks-rules.test.mjs`

Supported service roles:
- cafe
- shop
- market
- tourism service
- community service

Supported economy profiles:
- coastal tourism
- rural local economy
- suburban services
- urban commerce

Supported market cycles:
- weekly
- seasonal
- event-based

Supported service relationships:
- residential access
- visitor access
- community importance

Diagnostics exposed:
- `serviceRoleId`
- `economyProfileId`
- `marketCycleProfileId`
- `serviceImportance`
- `economyReason`

Determinism contract:
- same input resolves the same service role
- same input resolves the same economy profile
- same input resolves the same market cycle profile
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
1. service roles stable
2. economy profiles deterministic
3. market cycles valid
4. same input same output
5. budgets preserved
6. automatic controller regression passes
