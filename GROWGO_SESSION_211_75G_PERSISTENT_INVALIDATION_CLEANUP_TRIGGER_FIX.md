# GrowGo Session 211.75g — Persistent Invalidation Cleanup Trigger Fix

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

Date:
August 7, 2026

Status:
PASS

Classification:
`PERSISTENT_INVALIDATION_NOW_TRIGGERS_CONTROLLED_CLEANUP`

Goal:
Ensure that any persistent invalidation which occurs while Atlas is attached immediately routes through the already-proven controlled cleanup/detach sequence, while preserving the exact invalidation reason and leaving all safety gates unchanged.

Observed live failure before this phase

Safari proved the invalidation decision itself was correct:

- `authorizationState = invalidated`
- `redrawPermissionAllowed = false`
- `integrationState = invalidated`

But cleanup had not been triggered:

- `attached = true`
- `ownedCanvasCount = 1`
- `ownedPaneCount = 1`
- `ownedListenerCount = 3`
- `cleanupAttemptCount = 0`
- `cleanupCompleted = false`
- `referencesReleased = false`

Root cause

The integration was already watching for:

- scheduler failure
- scheduler invalidation

and automatically cleaning up in that path.

But broader attached invalidation cases such as:

- readiness blocked / region out of scope
- authorization invalidation
- identity drift propagation

could leave the integration in an invalidated-yet-still-attached state because the automatic cleanup trigger was not firing for the full attached invalidation state.

There was also a second state-retention issue:

- after cleanup, current map/identity/lifecycle references could remain in integration memory unless they were explicitly cleared

Exact fix

1. Added a dedicated invalidation cleanup path.
   - when the integration is invalidated while still attached, it now immediately:
     - denies redraw
     - triggers controlled cleanup
     - releases retained surface ownership
     - drops attached state

2. Preserved the exact invalidation reason.
   - cleanup now carries forward the most specific invalidation reason available, preferring:
     - authorization invalidation reason
     - scheduler failure/invalidation reason
     - prior integration failure reason

3. Cleared retained runtime references after invalidation cleanup.
   - map reference
   - identity reference
   - lifecycle owner reference
   - lifecycle owner id
   - retained surface snapshot

4. Reused the existing proven cleanup orchestration.
   - no new cleanup order was introduced
   - no retry loop was introduced
   - no auto-reattach or auto-reauthorization was introduced

Files changed

- `client/developer-only-controlled-persistent-atlas-contract-integration.mjs`
- `tests/client-developer-only-controlled-persistent-atlas-contract-integration.test.mjs`

Invalidation cleanup proof

Focused attached invalidation coverage now proves:

- readiness invalidation while attached triggers cleanup
- map identity drift while attached triggers cleanup
- region/package/recipe identity drift while attached triggers cleanup
- lifecycle-owner invalidation reason while attached triggers cleanup
- manual invalidation while attached triggers cleanup
- repeated invalidation is harmless
- invalidation while already detached creates no resources

Reason preservation proof

The integration now preserves the originating invalidation reason after cleanup.

Covered examples:

- readiness blocked path returns a redraw block while preserving the more specific integration failure reason after cleanup
- `REGION_OUT_OF_SCOPE` is preserved as the attached invalidation reason in integration status
- `STALE_MAP_IDENTITY` remains preserved
- `STALE_REGION_PACKAGE_RECIPE_IDENTITY` remains preserved
- `LIFECYCLE_OWNER_MISMATCH` remains preserved

Zero-ownership proof

After attached invalidation cleanup:

- `attached = false`
- `ownedCanvasCount = 0`
- `ownedPaneCount = 0`
- `ownedListenerCount = 0`
- `queuedFrameCount = 0`
- `cleanupCompleted = true`
- `referencesReleased = true`

Focused regression band

Passed:

- persistent manual command
- persistent authorization provider
- scheduler/listener wrappers
- retained surface wrapper
- lifecycle owner wrapper
- cleanup provider
- contract integration
- hybrid verification
- first-draw trace
- Safari one-frame regression band

Result:

- 194 passed
- 0 failed

Canonical safety flags remained false

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Manual follow-up

Safari retry is still required.

This phase fixes cleanup triggering on attached invalidation only. It does not broaden readiness, weaken identity rules, alter snapshot/draw logic, introduce retries, enable startup behavior, or change canonical safety flags.
