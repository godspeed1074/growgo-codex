# GrowGo Atlas Phase 212.36 — Recurring Activity, Social Rhythm, and Living-Place Hooks

Goal:
- add deterministic planning-only hooks for recurring activity patterns, community character, and living-place rhythm

Created:
- `client/developer-only-atlas-population-activity-social-rhythm-hooks-rules.mjs`
- planner integration in `client/developer-only-atlas-world-population-planner.mjs`
- `tests/client-developer-only-atlas-activity-social-rhythm-hooks-rules.test.mjs`

Supported activity/rhythm outcomes:
- quiet
- social
- tourist
- community
- seasonal
- event-based

Supported living-place inputs:
- settlement identity
- place memory
- seasonal story memory
- season profile
- return-visit category

Diagnostics exposed:
- `activityProfileId`
- `socialRhythmId`
- `timeContextProfile`
- `activityReason`
- `communityImportance`

Determinism contract:
- same input resolves the same activity profile
- same input resolves the same social rhythm
- same input resolves the same time-context profile
- unsupported contexts fail closed without activating runtime behavior

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
1. activity selection stable
2. rhythms deterministic
3. social hooks valid
4. same input same output
5. budgets preserved
6. automatic controller regression passes
