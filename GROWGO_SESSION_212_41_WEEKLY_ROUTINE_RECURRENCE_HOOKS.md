# GrowGo Atlas Phase 212.41 — Weekly Routine, Community Cadence, and Place Recurrence Hooks

Goal:
- add deterministic planning-only hooks for recurring place behaviour over weekly and seasonal cycles

Created:
- `client/developer-only-atlas-population-weekly-routine-recurrence-hooks-rules.mjs`
- planner integration in `client/developer-only-atlas-world-population-planner.mjs`
- `tests/client-developer-only-atlas-weekly-routine-recurrence-hooks-rules.test.mjs`

Supported weekly routines:
- weekday
- weekend
- recurring schedules

Supported community cadence:
- markets
- festivals
- traditions
- gatherings

Supported place recurrence:
- daily
- weekly
- monthly
- seasonal

Gameplay preparation hooks:
- quests
- achievements
- Farmer Markets
- events

Diagnostics exposed:
- `weeklyRoutineProfileId`
- `recurrencePatternId`
- `communityCadenceId`
- `eventFrequency`
- `recurrenceReason`

Determinism contract:
- same input resolves the same weekly routine profile
- same input resolves the same recurrence pattern
- same input resolves the same community cadence
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
1. recurrence stable
2. weekly patterns deterministic
3. event cadence valid
4. same input same output
5. budgets preserved
6. automatic controller regression passes
