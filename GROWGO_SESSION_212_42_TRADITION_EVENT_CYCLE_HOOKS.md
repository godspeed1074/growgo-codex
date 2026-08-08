# GrowGo Atlas Phase 212.42 — Monthly Rhythm, Seasonal Event Cycle, and Community Tradition Hooks

Goal:
- add deterministic planning-only hooks for longer-term recurring traditions and seasonal community events

Created:
- `client/developer-only-atlas-population-tradition-event-cycle-hooks-rules.mjs`
- planner integration in `client/developer-only-atlas-world-population-planner.mjs`
- `tests/client-developer-only-atlas-tradition-event-cycle-hooks-rules.test.mjs`

Supported monthly rhythms:
- recurring events
- community activities

Supported seasonal event cycles:
- festivals
- tourism peaks
- harvest events
- seasonal gatherings

Supported community traditions:
- heritage celebrations
- recurring quests
- achievement hooks

Long-term identity inputs:
- settlement identity
- place memory
- recurrence

Diagnostics exposed:
- `traditionProfileId`
- `seasonalEventCycleId`
- `communityTraditionId`
- `eventImportance`
- `traditionReason`

Determinism contract:
- same input resolves the same tradition profile
- same input resolves the same seasonal event cycle
- same input resolves the same community tradition
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
1. tradition selection stable
2. seasonal events deterministic
3. community traditions valid
4. same input same output
5. budgets preserved
6. automatic controller regression passes
