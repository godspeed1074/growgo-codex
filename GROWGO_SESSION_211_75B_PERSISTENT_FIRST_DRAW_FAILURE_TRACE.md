# GrowGo Session 211.75b — Persistent First-Draw Failure Trace

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

Date:
August 6, 2026

Status:
PASS

Classification:
`PERSISTENT_FIRST_DRAW_FAILURE_TRACE_READY_FOR_SAFARI_RETRY`

Goal:
Preserve the exact first persistent snapshot-to-draw failure seam and originating reason before fail-closed cleanup removes ownership, without changing persistent draw behavior.

What changed

- Added a developer-only persistent first-draw trace store in the controlled persistent Atlas integration.
- Added narrow queued-frame trace entry for:
  - `frame_callback_entered`
  - `redraw_permission_validated`
- Added narrow persistent draw-wrapper step tracing for:
  - `surface_validated`
  - `lifecycle_validated`
  - `snapshot_validated`
  - `mutable_draw_state_created`
  - `canvas_position_adapted`
  - `draw_provider_entered`
  - `draw_provider_completed`
  - `draw_state_release_started`
  - `draw_state_release_completed`
- Added cleanup handoff trace preservation for:
  - `cleanup_handoff_started`
  - `cleanup_handoff_completed`
- Preserved the originating first thrown reason in trace state even if cleanup later reports separate failures.
- Exposed the trace through the local developer diagnostics namespace via the persistent manual command surface.

Trace API

- `window.GrowGoDeveloperDiagnostics.getControlledPersistentAtlasFirstDrawTrace()`

Trace guarantees

- frozen
- serializable
- no raw map references
- no raw Canvas references
- no raw snapshot references
- no browser object leakage
- canonical safety flags remain false

Originating-failure preservation

- The first draw failure reason is stored as `originatingFailureReason`.
- Cleanup status is tracked separately through:
  - `cleanupStarted`
  - `cleanupCompleted`
  - `cleanupFailureReasons`
- Cleanup no longer erases the original failure from the trace.

Files changed

- `client/developer-only-controlled-persistent-atlas-contract-integration.mjs`
- `client/developer-only-controlled-persistent-atlas-manual-command.mjs`
- `client/developer-only-controlled-persistent-atlas-scheduler-listener-contract.mjs`
- `client/developer-only-persistent-atlas-frame-draw-provider.mjs`
- `tests/client-controlled-persistent-atlas-first-draw-trace.test.mjs`
- `tests/client-developer-only-persistent-atlas-frame-draw-provider.test.mjs`

Focused proof added

- successful fake first draw records a frozen serializable trace
- snapshot failure preserves originating failure before cleanup
- draw-provider failure preserves originating failure separately from cleanup failures
- diagnostics namespace exposes the first-draw trace getter
- draw wrapper step trace records mutable draw-state and Canvas-position boundaries
- draw wrapper step trace preserves exact Canvas-position failure boundary

Regression band run

- persistent manual command
- persistent snapshot wrapper
- persistent draw wrapper
- persistent cleanup wrapper
- persistent real-seam composition
- persistent hybrid verification
- one-frame live draw operation regression

Result:
- 201 passed
- 0 failed

Safety

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Next step

Retry the persistent manual Safari attach flow and capture:

- command result
- `window.GrowGoDeveloperDiagnostics.getControlledPersistentAtlasFirstDrawTrace()`

This phase does not fix the persistent first draw. It makes the real failure boundary observable before cleanup runs.
