# GrowGo Atlas Phase 212.43 — Festival, Questline, and Seasonal Destination Narrative Hooks

Goal:
- add deterministic planning-only hooks that connect traditions and destinations to future player experiences

Created:
- `client/developer-only-atlas-population-festival-quest-narrative-hooks-rules.mjs`
- planner integration in `client/developer-only-atlas-world-population-planner.mjs`
- `tests/client-developer-only-atlas-festival-quest-narrative-hooks-rules.test.mjs`

Supported festival profiles:
- heritage festivals
- seasonal celebrations
- community events
- tourism events

Supported quest narrative hooks:
- discovery chains
- destination sequences
- themed journeys

Supported seasonal destination narratives:
- season
- tradition
- route
- place memory

Supported achievement hooks:
- destination achievements
- collection chains
- exploration milestones

Diagnostics exposed:
- `festivalProfileId`
- `questNarrativeProfileId`
- `seasonalDestinationProfileId`
- `achievementHookProfileId`
- `narrativeReason`

Determinism contract:
- same input resolves the same festival profile
- same input resolves the same quest narrative profile
- same input resolves the same seasonal destination profile
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
1. festival selection stable
2. quest hooks deterministic
3. seasonal narratives valid
4. achievement hooks stable
5. same input same output
6. budgets preserved
7. automatic controller regression passes
