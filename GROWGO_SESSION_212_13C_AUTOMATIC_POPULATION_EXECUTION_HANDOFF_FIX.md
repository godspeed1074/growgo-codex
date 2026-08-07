# GROWGO SESSION 212.13C — AUTOMATIC POPULATION EXECUTION HANDOFF FIX

## Goal

Connect the already-proven live automatic population event adapter to the already-proven controller queue runner so approved viewport events can move from:

- event received
- refresh queued

to:

- feature read
- planning
- submission
- draw
- population replacement

without adding timers, polling, startup execution, or autonomous background loops.

## Root cause

The live-event adapter correctly called:

- `requestAutomaticViewportPopulationRefresh(...)`

and the controller correctly queued a viewport generation.

But no narrow execution seam ever invoked:

- `runQueuedAutomaticViewportPopulationRefresh(...)`

So the live system stalled at:

- `refreshRequestedCount = 1`
- `refreshQueuedCount = 1`
- `refreshStartedCount = 0`
- `refreshCompletedCount = 0`

## Fix applied

Updated:

- [client/developer-only-atlas-automatic-population-live-event-adapter.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-automatic-population-live-event-adapter.mjs)

The adapter now performs a narrow controlled execution handoff:

1. receive approved completed viewport event
2. forward request into controller queue
3. schedule exactly one microtask execution handoff for the current burst
4. invoke the existing queued controller runner
5. let the existing controller state machine perform:
   - `reading_features`
   - `planning`
   - `submitting`
   - `drawing`
   - `replacing_population`
6. return to `attached_idle` when complete

## Why this stays within scope

This phase does **not** add:

- `setTimeout`
- `setInterval`
- polling
- startup hooks
- automatic startup execution
- hidden perpetual loops

The handoff uses one controlled microtask per event burst only to bridge:

- queued controller work
- existing controller runner

This preserves coalescing while avoiding timer-driven behavior.

## Added execution diagnostics

The adapter status now also records:

- `refreshExecutionRequestedCount`
- `refreshExecutionStartedCount`
- `refreshExecutionCompletedCount`
- `executionBlockedCount`
- `lastExecutionReason`

These remain frozen and serializable only.

## Proven behavior

Focused regression now proves:

- moveend queues refresh
- queued refresh execution starts
- feature read begins
- planning begins
- submission begins
- draw begins
- replacement completes
- controller returns to `attached_idle`
- second and third events in the same burst coalesce before one execution pass
- stale generation discard still works
- failure still preserves the last good population
- disable still prevents further execution
- invalidation still prevents further execution
- no timer used
- no polling used
- no startup execution
- all canonical safety flags remain false

## Safety

Canonical safety flags remain false:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Next step

Manual Safari retry is still required to confirm the live automatic repopulation path now moves from:

- `moveend received`
- `refresh queued`

to:

- `refresh started`
- `refresh completed`
- deterministic population replacement

