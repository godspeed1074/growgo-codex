# GROWGO Session 211.49 — Manual-Gated One-Frame Activation Command Implementation

Date: August 2, 2026
Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
Phase: `211.49 — Manual-Gated One-Frame Activation Command Implementation`

## ELI5

We added the real developer-only button for drawing exactly one Atlas custom 2.5D frame, but only after the page proves it is on localhost, approved, and still bound to the exact expected Atlas identity. The command draws one frame, keeps it visible for one browser paint, cleans up exactly once, then permanently closes so it cannot be reused.

## Outcome

Status: PASS

Exact closeout classification:

`MANUAL_GATED_ONE_FRAME_COMMAND_READY_FOR_SAFARI_VERIFICATION`

## Checkpoint acceptance

Phase 211.48 was accepted by exact commit title:

- verified commit: `7879dc6 docs(atlas): design manual-gated one-frame activation command`

Verified checkpoint contents:

- `GROWGO_SESSION_211_48_MANUAL_GATED_ONE_FRAME_ACTIVATION_COMMAND_DESIGN.md`
- `tests/client-developer-only-manual-gated-one-frame-activation-design.test.mjs`

Preflight status:

- initial branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
- initial `git status --short`: clean
- checkpoint verification method: exact title
- history remained unchanged: yes

Preflight regression result:

- focused Phase 211.18–211.48 band: passed before implementation

## Implemented command

New command module:

- `client/developer-only-atlas-custom25d-one-frame-command.mjs`

Exposed browser interface:

- `window.GrowGoDeveloperDiagnostics.runAuthorizedAtlasCustom25DOneFrame({`
- `  confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"`
- `})`

Implemented execution guarantees:

- localhost-style host required
- exact confirmation phrase required
- readiness validated before authorization consumption
- authorization binding validated exactly:
  - region ID
  - package ID
  - package version
  - package fingerprint
  - recipe ID
  - recipe version
  - selector seed
- adapter readiness validated before execution
- readiness revalidated before consumption
- authorization consumed exactly once
- adapter invoked exactly once
- exactly one `requestAnimationFrame` cleanup boundary used
- deferred cleanup completes exactly once
- references released
- permanent closure enforced
- second invocation blocked

## Narrow adapter support

Updated adapter:

- `client/developer-only-growgo-custom25d-live-one-frame-adapter.mjs`

Narrow change:

- supports deferred cleanup ownership for the manual command
- default disconnected behavior remains preserved
- no raw adapter methods are exposed publicly

## Exposure boundary

Allowed public exposure:

- `runAuthorizedAtlasCustom25DOneFrame(...)`

Still not exposed publicly:

- authorization consume seam
- raw adapter execution
- deferred cleanup handle
- surface preparation internals
- lifecycle registration internals
- frame snapshot bridge internals
- draw bridge internals
- `initCustom25DMapExperiment()`
- `custom25DMapLayer`
- continuous redraw controls

## Files changed

- `client/developer-only-atlas-custom25d-one-frame-command.mjs`
- `client/developer-only-growgo-custom25d-live-one-frame-adapter.mjs`
- `client/development-alpha-app.mjs`
- `tests/client-developer-only-atlas-custom25d-one-frame-command.test.mjs`
- `tests/client-developer-only-atlas-renderer-handoff-authorization.test.mjs`
- `tests/client-developer-only-growgo-custom25d-live-one-frame-adapter.test.mjs`
- `tests/client-developer-only-live-one-frame-adapter-implementation-review.test.mjs`
- `tests/client-developer-only-manual-gated-one-frame-activation-design.test.mjs`
- `tests/client-growgo-custom25d-live-one-frame-wiring-review.test.mjs`

## Validation

Focused implementation/review suites:

- 34 passed, 0 failed

Focused implementation suites:

- 25 passed, 0 failed

Full filtered Phase 211.18–211.49 regression band:

- 347 passed, 0 failed

## Safety

Canonical safety flags remained exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Additional safety confirmations:

- no startup invocation added
- no moveend or zoomend live renderer wiring added
- no real Safari execution performed in this phase
- no publishing
- no runtime activation

## Commit recommendation

Commit: YES

Suggested commit message:

- `feat(atlas): add manual-gated one-frame activation command`

## Next phase

- `211.50 — Manual Safari One-Frame Activation Verification`
