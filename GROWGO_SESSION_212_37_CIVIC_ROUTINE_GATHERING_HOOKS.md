# GrowGo Atlas Phase 212.37 — Civic Routine, Local Gathering, and Temporal Place-Use Hooks

Goal:
- add deterministic planning-only hooks for how communities use important places over time

Created:
- `client/developer-only-atlas-population-civic-routine-gathering-hooks-rules.mjs`
- planner integration in `client/developer-only-atlas-world-population-planner.mjs`
- `tests/client-developer-only-atlas-civic-routine-gathering-hooks-rules.test.mjs`

Supported civic routines:
- schools
- sports grounds
- community centres
- town squares

Supported gathering patterns:
- markets
- festivals
- community events
- meetups

Supported temporal use:
- morning
- daytime
- evening
- seasonal periods

Supported community roles:
- local hub
- visitor attraction
- neighbourhood gathering point

Diagnostics exposed:
- `civicRoutineProfileId`
- `gatheringPatternId`
- `temporalUseProfile`
- `communityRole`
- `routineReason`

Determinism contract:
- same input resolves the same civic routine profile
- same input resolves the same gathering pattern
- same input resolves the same temporal use profile
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
1. civic routines stable
2. gathering patterns deterministic
3. temporal use stable
4. community roles valid
5. budgets preserved
6. automatic controller regression passes
