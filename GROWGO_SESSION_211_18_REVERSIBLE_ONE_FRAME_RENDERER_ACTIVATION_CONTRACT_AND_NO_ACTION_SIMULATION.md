# GROWGO SESSION 211.18 — REVERSIBLE ONE-FRAME RENDERER ACTIVATION CONTRACT AND NO-ACTION SIMULATION

## Goal

Create the smallest developer-only contract that can validate Atlas readiness and renderer-handoff authorization, consume that authorization exactly once, simulate one frame through injected fake renderer dependencies, and end in a closed state with mandatory cleanup.

This phase stays fully isolated:

- no `script.js` changes
- no browser exposure changes
- no live renderer adapter
- no real Canvas
- no real WebGL
- no real Leaflet attachment

## Preflight

- branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- required Phase 211.17b checkpoint:
  - `f98d9e0`
- checkpoint message:
  - `test(atlas): close out renderer authorization drift retest evidence`
- initial `git status --short`:
  - clean
- focused Phase 211.12–211.17b regressions:
  - `PASS`

## Repository Discovery

- renderer owner:
  - [`script.js`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/script.js)
- initialization entry:
  - `initCustom25DMapExperiment()`
- draw entry:
  - `drawCustom25DMapCanvas(canvas)`
- retained runtime ownership:
  - `custom25DMapLayer`
- cleanup/disposal ownership discovered:
  - retained by `script.js` and the Leaflet layer/pane lifecycle around `custom25DMapLayer`
- authorization consumption seam reused:
  - `consumeAuthorizedRendererHandoffAttempt()` from [`client/developer-only-atlas-renderer-handoff-authorization.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-renderer-handoff-authorization.mjs)

## Implementation

Created:

- [`client/developer-only-atlas-one-frame-renderer-activation-contract.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-one-frame-renderer-activation-contract.mjs)
- [`tests/client-developer-only-atlas-one-frame-renderer-activation-contract.test.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-atlas-one-frame-renderer-activation-contract.test.mjs)

Contract factory:

- `createDeveloperOnlyAtlasOneFrameRendererActivationContract({ ... })`

Exposed contract methods:

- `simulateOneFrameActivation()`
- `getActivationStatus()`

## Contract Rules

The contract proves this guarded sequence:

1. explicit activation request
2. local-development-only host validation
3. fresh readiness validation
4. authorization status validation
5. exact bound identity comparison
6. fake renderer adapter identity validation
7. second readiness check immediately before consume
8. exact one-time authorization consume
9. exactly one fake initialization
10. exactly one fake frame draw
11. mandatory fake disposal
12. permanently closed post-activation state

## State Model

Implemented states:

- `idle`
- `blocked`
- `failed_closed`
- `disposed`

The contract closes after the first attempt and blocks a second frame or second activation from the same contract instance.

## Focused Simulation Coverage

Covered in focused tests:

- fresh contract starts idle
- successful isolated one-frame simulation
- authorization consumed exactly once
- exactly one initialization attempt
- exactly one draw attempt
- exactly one completed frame
- cleanup/disposal runs
- second frame is blocked
- second activation with consumed session is blocked
- status inspection is side-effect free
- missing readiness blocks
- out-of-scope readiness blocks
- invalid diagnostic blocks
- renderer unavailable blocks
- renderer identity mismatch blocks
- inactive authorization blocks
- invalidated authorization blocks
- consumed authorization blocks
- every bound identity mismatch blocks
- readiness drift before consumption blocks
- drift before consumption does not consume authorization
- initialization failure prevents draw
- draw failure triggers cleanup
- disposal failure remains closed
- injected exceptions fail closed
- results are deeply immutable
- no real renderer path is wired or invoked

## Successful Simulation Summary

Representative successful simulation:

- activation ID:
  - `TEST_ACTIVATION_001`
- authorization consumption count:
  - `1`
- initialization count:
  - `1`
- draw count:
  - `1`
- completed frame count:
  - `1`
- disposal count:
  - `1`
- cleanup result:
  - `completed`
- second-frame result:
  - `blocked`

## Blocked Simulation Summary

Verified blocked cases:

- readiness drift before consumption:
  - blocked
- invalidated authorization:
  - blocked
- consumed authorization:
  - blocked
- identity mismatch:
  - blocked

## Failure Simulation Summary

Verified failure paths:

- initialization failure:
  - no draw
  - cleanup attempted when requested
- draw failure:
  - one initialization
  - one draw attempt
  - cleanup required
- disposal failure:
  - precise fail-closed result
  - contract stays closed
- injected exception handling:
  - fail closed
  - no retry

## Safety Truth

Canonical safety flags remained exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Still true:

- real renderer initialized:
  - `no`
- real renderer attached:
  - `no`
- real draw called:
  - `no`
- real Canvas created:
  - `no`
- real WebGL created:
  - `no`
- real overlay created:
  - `no`
- listeners added:
  - `no`
- network requested:
  - `no`
- asset download requested:
  - `no`
- automatic invocation:
  - `no`

## Files Changed

- [`client/developer-only-atlas-one-frame-renderer-activation-contract.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-one-frame-renderer-activation-contract.mjs)
- [`tests/client-developer-only-atlas-one-frame-renderer-activation-contract.test.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-atlas-one-frame-renderer-activation-contract.test.mjs)
- [`GROWGO_SESSION_211_18_REVERSIBLE_ONE_FRAME_RENDERER_ACTIVATION_CONTRACT_AND_NO_ACTION_SIMULATION.md`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_211_18_REVERSIBLE_ONE_FRAME_RENDERER_ACTIVATION_CONTRACT_AND_NO_ACTION_SIMULATION.md)

## Ready State

Phase 211.18 is complete when the injected fake one-frame lifecycle and all fail-closed boundaries pass focused tests while the real renderer remains fully asleep.
