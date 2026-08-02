# GROWGO Session 211.48 — Manual-Gated One-Frame Activation Command Design

Date: August 2, 2026
Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
Phase: `211.48 — Manual-Gated One-Frame Activation Command Design`

## Outcome

Status: PASS

Exact closeout classification:

`LIVE_ONE_FRAME_ADAPTER_READY_FOR_MANUAL_GATING`

## Checkpoint acceptance

Phase 211.47 was accepted by exact commit title:

- verified commit: `29804c2 feat(atlas): add developer-only live one-frame adapter`

Verified checkpoint contents:

- `client/developer-only-growgo-custom25d-live-one-frame-adapter.mjs`
- `tests/client-developer-only-growgo-custom25d-live-one-frame-adapter.test.mjs`
- `GROWGO_SESSION_211_47_DEVELOPER_ONLY_LIVE_ONE_FRAME_ADAPTER_IMPLEMENTATION.md`
- narrow one-frame bridge in `script.js`
- updated live-map-centre bridge regression expectation

Preflight regression result:

- focused Phase 211.18–211.47 band: 333 passed, 0 failed

## Phase boundary

This phase is design-only and passive-contract validation only.

Not allowed in this phase:

- expose the command in Safari
- invoke the real adapter
- consume live authorization
- create a real Canvas
- draw a real frame

## Preferred future command

Preferred browser interface:

`window.GrowGoDeveloperDiagnostics.runAuthorizedAtlasCustom25DOneFrame({`
`  confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"`
`})`

Chosen because it matches the current developer-diagnostics naming style:

- explicit verb-first command naming
- Atlas/custom25D scope included
- one-frame scope included
- authorization requirement made obvious in the name

## Required command characteristics

- local-development hosts only
- explicit manual invocation only
- exact confirmation phrase required: `RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME`
- no automatic startup call
- no moveend call
- no zoomend call
- no polling
- no timer
- no normal-player UI access
- one invocation attempt only
- one authorization session only
- one frame only
- mandatory cleanup
- permanent closure
- immutable result

## Required pre-execution ordering

The future command must execute in this exact order:

1. Confirm local host.
2. Validate exact confirmation phrase.
3. Confirm the command has not already run.
4. Read current Atlas renderer-handoff readiness.
5. Require:
   - `diagnosticStatus = resolved`
   - `reasonCode = RESOLVED`
   - `rendererHandoffStatus = ready_for_future_renderer_attachment`
   - `rendererConsumerAvailable = true`
   - `rendererIdentityValidated = true`
6. Read renderer-handoff authorization status.
7. Require:
   - `authorizationActive = true`
   - `authorizationConsumed = false`
   - `authorizationInvalidated = false`
   - `approvedReadinessBound = true`
   - `currentReadinessMatchesAuthorization = true`
8. Verify exact bound:
   - region ID
   - package ID
   - package version
   - package fingerprint
   - recipe ID
   - recipe version
   - selector seed
9. Validate that the Phase 211.47 live one-frame adapter is ready.
10. Re-read readiness.
11. Block on any drift.
12. Only then allow the internal authorization-consumption seam to be used.
13. Invoke the adapter exactly once.
14. Require:
   - one surface
   - one lifecycle registration
   - one frame snapshot
   - one draw
   - one completed frame
   - one cleanup
   - references released
15. Permanently close the command.
16. Block second execution.

## Required command result fields

- schemaId
- operation
- outcome
- reasonCode
- commandState
- confirmationAccepted
- localDevelopmentHost
- executionAttemptCount
- readinessReadCount
- readinessRevalidationCount
- authorizationValidated
- authorizationSessionId
- authorizationConsumed
- adapterReady
- adapterInvoked
- surfacePrepared
- lifecycleRegistered
- frameSnapshotCreated
- drawAttemptCount
- completedFrameCount
- cleanupAttemptCount
- cleanupCompleted
- cleanupFailureReasons
- referencesReleased
- permanentlyClosed
- secondExecutionBlocked
- boundRegionId
- boundPackageId
- boundPackageVersion
- boundPackageFingerprint
- boundRecipeId
- boundRecipeVersion
- boundSelectorSeed
- realRendererInvoked
- realDrawFunctionCalled
- realCanvasCreated
- realPaneCreated
- realWebglContextCreated
- realOverlayCreated
- realListenerAdded
- retentionWritten
- networkRequested
- assetDownloadRequested
- automaticInvocation
- exact canonical safety flag snapshot

## Required blocked cases

- non-local host
- missing confirmation
- incorrect confirmation
- command already used
- missing readiness
- out-of-scope readiness
- renderer consumer unavailable
- renderer identity mismatch
- inactive authorization
- invalidated authorization
- consumed authorization
- readiness mismatch
- any bound identity mismatch
- adapter unavailable
- adapter not ready
- readiness drift before execution

## Required failure behavior after adapter invocation

- surface failure:
  - zero frames
  - permanently closed
- translation or lifecycle failure:
  - cleanup attempted
  - zero frames
  - permanently closed
- snapshot failure:
  - cleanup attempted
  - zero frames
- draw failure:
  - one draw attempt
  - zero completed frames
  - cleanup attempted
- cleanup failure:
  - preserve exact failure reasons
  - references released where safely possible
  - command remains permanently closed
- exception:
  - structured fail-closed result
  - no retry

## Required exposure boundary

The final future browser interface may expose only the manual command.

It must not expose:

- internal authorization consumption
- raw adapter execution
- surface operations
- lifecycle registration
- frame snapshot bridge internals
- draw bridge internals
- `initCustom25DMapExperiment()`
- `custom25DMapLayer`
- continuous redraw controls

## One-frame visibility decision

The frame should remain visible for exactly one post-draw browser paint.

Chosen cleanup rule:

- keep the temporary Canvas present through the first paint after the draw completes
- then schedule cleanup on a single `requestAnimationFrame` cleanup boundary
- do not use `setTimeout`
- do not use `setInterval`
- do not use polling

Reason:

- cleanup in the same task risks the frame never becoming visibly observable
- a single post-draw paint makes the manual evidence step realistic
- a one-shot `requestAnimationFrame` boundary preserves the “one frame only” contract without introducing continuous execution

## Future Safari evidence procedure

Exact future manual evidence sequence:

1. hard reload
2. confirm command is absent before implementation
3. move to approved Bellarine coordinate
4. verify readiness
5. authorize one renderer-handoff session
6. verify adapter-ready status
7. run exact one-frame command
8. visually confirm one temporary 2.5D frame appears
9. confirm cleanup removes the temporary Canvas
10. confirm no listener remains
11. confirm authorization is consumed
12. confirm second command attempt is blocked
13. confirm page reload restores a clean state
14. confirm all canonical flags remain false

## Canonical safety flags

These must remain exactly false before, during, and after the future manual command:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Validation added in this phase

Added focused passive design coverage:

- `tests/client-developer-only-manual-gated-one-frame-activation-design.test.mjs`

This suite verifies:

- the exact future command name and confirmation phrase are documented
- the required ordering, blocked cases, and result fields are documented
- the command remains absent from current live sources
- internal authorization consumption remains unexposed
- the one-frame visibility decision is defined without timers or polling
- canonical safety flags remain false

## Files created

- `GROWGO_SESSION_211_48_MANUAL_GATED_ONE_FRAME_ACTIVATION_COMMAND_DESIGN.md`
- `tests/client-developer-only-manual-gated-one-frame-activation-design.test.mjs`

## Files changed

None outside the new passive design artifacts.

## Next smallest safe phase

Implement the manual-gated browser command only after this design is accepted, keeping it:

- developer-only
- explicit-only
- single-use
- single-frame
- cleanup-mandatory
- permanently closed after first terminal result
