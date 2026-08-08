# GrowGo Atlas Phase 212.40 — Time-of-Day Presence, Occupancy Rhythm, and Place Liveness Hooks

Goal:
- add deterministic planning-only hooks for when places feel active, quiet, social, or event-driven

Created:
- `client/developer-only-atlas-population-place-liveness-hooks-rules.mjs`
- planner integration in `client/developer-only-atlas-world-population-planner.mjs`
- `tests/client-developer-only-atlas-place-liveness-hooks-rules.test.mjs`

Supported occupancy profiles:
- quiet
- moderate
- busy
- peak_event

Supported time presence:
- morning
- daytime
- evening
- night

Supported liveness categories:
- social
- commercial
- recreation
- civic
- visitor

Supported event presence:
- markets
- festivals
- community gatherings
- seasonal events

Diagnostics exposed:
- `occupancyProfileId`
- `timePresenceProfile`
- `livenessCategory`
- `peakActivityWindow`
- `presenceReason`

Determinism contract:
- same input resolves the same occupancy profile
- same input resolves the same time-presence profile
- same input resolves the same peak-activity window
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
1. occupancy stable
2. time presence deterministic
3. liveness categories valid
4. event presence stable
5. same input same output
6. budgets preserved
7. automatic controller regression passes
