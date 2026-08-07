# GrowGo Session 212.5 — Safari Live Asset Population Preview Verification

Status: BLOCKED

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

Commit tested:
`5ec246f feat(atlas): add developer asset population preview`

Verification browser:
- `Safari`

Safari version:
- `26.6`

Development page:
- `http://127.0.0.1:8000`

Approved map scope:
- `Bellarine`

## ELI5

Safari proved the new persistent Atlas path can wake up safely, attach one retained Canvas, and draw its first attached frame at the approved Bellarine point. The blocker is narrower than rendering now: the live preview command is still rejecting the attached session as `ATLAS_NOT_AUTHORIZED`, so the asset population preview never starts even though Atlas itself is attached and healthy.

## Real Safari verification sequence

1. Opened `http://127.0.0.1:8000` in Safari.
2. Confirmed the local diagnostics namespace was available.
3. Confirmed startup status was detached and idle with zero owned Canvas, pane, and listeners.
4. Confirmed the first attempted preview-fixture coordinate `[-38.1264, 144.6134]` remained out of scope because it bucketed to `latBucket = -38.13`.
5. Retried at the approved Bellarine readiness coordinate:
   - `[-38.12436167080344, 144.609432220459]`
   - `latBucket = -38.12`
   - `lngBucket = 144.61`
6. Confirmed live readiness resolved.
7. Authorized one persistent developer session.
8. Attached persistent Atlas.
9. Verified the initial attach frame completed.
10. Ran the manual preview command for:
    - `ATLAS_POPULATION_PREVIEW_BELLARINE_001`
11. Confirmed the preview command failed closed as `ATLAS_NOT_AUTHORIZED`.
12. Verified Atlas stayed attached and stable after the failed preview command.
13. Verified duplicate preview and clear commands also failed closed as `ATLAS_NOT_AUTHORIZED`.
14. Detached Atlas and confirmed zero ownership cleanup.

## Startup proof

- `commandAvailable = true`
- `localDevelopmentEligible = true`
- `authorizationState = inactive`
- `attached = false`
- `ownedCanvasCount = 0`
- `ownedPaneCount = 0`
- `ownedListenerCount = 0`
- `previewAvailable = true`
- `previewActive = false`

## Readiness proof

Initial live map check before repositioning:

- `diagnosticStatus = blocked`
- `reasonCode = REGION_OUT_OF_SCOPE`

Approved Bellarine retry:

- approved Bellarine coordinate used during live verification:
  - `[-38.12436167080344, 144.609432220459]`
- `diagnosticStatus = resolved`
- `reasonCode = RESOLVED`
- `rendererHandoffStatus = ready_for_future_renderer_attachment`
- `reasonCode = HANDOFF_READY`
- `rendererIdentityValidated = true`
- `regionId = REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION`
- `packageId = ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001`
- `recipeId = COASTAL_LOCATION_RECIPE_001`
- `selectorSeed = baf38e127eee1e320570e2f02fc889cd1aaec4b9dfd7bee85bba4f10f30b6da0`

## Authorization proof

- `outcome = authorized`
- `reasonCode = AUTHORIZED_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION`
- `commandState = completed`
- status immediately after authorization:
  - `authorizationState = active`
  - `integrationState = authorized`
  - `attachPermissionConsumed = false`
  - `redrawPermissionAllowed = false`

## Attach proof

- `outcome = attached`
- `reasonCode = ATTACH_COMPLETED`
- `commandState = completed`
- `sessionId = LIVE_PERSISTENT_ATLAS_SESSION_001`
- `integrationState = redraw_queued`
- `authorizationState = attach_permission_consumed`
- `ownedCanvasCount = 1`
- `ownedPaneCount = 1`
- `ownedListenerCount = 3`
- `queuedFrameCount = 1`

Stable attached status after the initial retained draw completed:

- `integrationState = attached_idle`
- `authorizationState = attach_permission_consumed`
- `attachPermissionConsumed = true`
- `redrawPermissionAllowed = true`
- `attached = true`
- `ownedCanvasCount = 1`
- `ownedPaneCount = 1`
- `ownedListenerCount = 3`
- `snapshotCompletedCount = 1`
- `drawCompletedCount = 1`
- `lastCompletedRedrawReason = initial_attach`
- `lastFailure = null`

## Preview command proof

The live developer-only preview command was invoked with:

- `previewFixtureId = ATLAS_POPULATION_PREVIEW_BELLARINE_001`
- confirmation:
  - `PREVIEW_CONTROLLED_ATLAS_ASSET_POPULATION`

Returned result:

- `command = previewAtlasAssetPopulation`
- `outcome = failed_closed`
- `reasonCode = ATLAS_NOT_AUTHORIZED`

Preview status immediately after the failed command:

- `previewAvailable = true`
- `previewActive = false`
- `previewFixtureId = null`
- `populationPlanId = null`
- `batchId = null`
- `plannedCommandCount = 0`
- `submittedCommandCount = 0`
- `drawCompleted = false`
- `previewReferenceCount = 0`
- `lastFailureReason = ATLAS_NOT_AUTHORIZED`

## Population-plan and draw proof

What Safari proved live:

- persistent Atlas itself attached successfully
- exactly one retained Canvas existed
- exactly one retained pane existed
- exactly three approved listeners existed
- one attach-time snapshot completed
- one attach-time draw completed

What Safari did **not** prove because the preview command failed before population submission:

- no live preview population plan was created
- no preview batch was created
- no preview commands were submitted
- no preview draw completed
- no preview asset visuals were shown

## Duplicate protection proof

Duplicate preview retry result:

- `outcome = failed_closed`
- `reasonCode = ATLAS_NOT_AUTHORIZED`
- `previewReferenceCount = 0`

The failed preview did not create duplicate retained resources:

- attached status remained:
  - `ownedCanvasCount = 1`
  - `ownedPaneCount = 1`
  - `ownedListenerCount = 3`
- `drawCompletedCount` remained the single attach-time draw:
  - `drawCompletedCount = 1`
- `snapshotCompletedCount = 1`
- `lastFailure = null`

## Clear proof

Clear command result:

- `command = clearAtlasAssetPopulationPreview`
- `outcome = failed_closed`
- `reasonCode = ATLAS_NOT_AUTHORIZED`

Because no preview became active:

- `previewClearCompleted = false`
- `previewReferenceCount = 0`
- `previewActive = false`

## Post-clear Atlas proof

After the failed clear command, persistent Atlas still remained healthy and attached:

- `integrationState = attached_idle`
- `attached = true`
- `ownedCanvasCount = 1`
- `ownedPaneCount = 1`
- `ownedListenerCount = 3`
- `drawCompletedCount = 1`
- `snapshotCompletedCount = 1`
- `lastFailure = null`

## Final detach proof

Detach result:

- `outcome = released`
- `reasonCode = RELEASED`
- `cleanupCompleted = true`
- `referencesReleased = true`
- `ownedCanvasCount = 0`
- `ownedPaneCount = 0`
- `ownedListenerCount = 0`

Final detached status:

- `attached = false`
- `ownedCanvasCount = 0`
- `ownedPaneCount = 0`
- `ownedListenerCount = 0`
- `cleanupCompleted = true`
- `referencesReleased = true`
- `lastFailure = null`

## Visual proof

Live visual preview classification:

- `PREVIEW_COMMAND_BLOCKED_BEFORE_POPULATION_DRAW`

Reason:

- the retained Atlas layer attached and completed its initial attach-time draw
- but the population preview command failed closed before any preview plan or batch was created
- therefore no honest claim can be made that live asset preview visuals were rendered in Safari during Phase 212.5

## Console errors

No separate browser-console crash or draw exception was required to explain the live blocker.

The relevant live failure was returned as a structured command result:

- `reasonCode = ATLAS_NOT_AUTHORIZED`

## Safety proof

Canonical safety flags remained false throughout:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Also preserved:

- no startup activation
- no automatic asset spawning
- no extra Canvas ownership beyond the single retained persistent Canvas
- no duplicate listener set
- no automatic reattach after failure

## Root cause narrowed by live Safari evidence

This phase does **not** prove a rendering failure.

It proves a narrower live-seam mismatch:

- readiness resolves the approved live Bellarine scope
- authorization succeeds
- attach succeeds
- the initial attach-time snapshot and draw succeed
- but `previewAtlasAssetPopulation(...)` still rejects the attached session as:
  - `ATLAS_NOT_AUTHORIZED`

That means the live preview command is not honoring the already-valid attached persistent authorization state.

## Final classification

- `BLOCKED_BY_LIVE_PREVIEW_AUTHORIZATION_MISMATCH`

## Structured evidence snapshot

```json
{
  "browserUsed": "Safari",
  "browserVersion": "26.6",
  "developmentPageAddress": "http://127.0.0.1:8000",
  "commitTested": "5ec246f feat(atlas): add developer asset population preview",
  "initialOutOfScopeCoordinate": [-38.1264, 144.6134],
  "approvedBellarineCoordinate": [-38.12436167080344, 144.609432220459],
  "readinessResolved": true,
  "rendererHandoffStatus": "ready_for_future_renderer_attachment",
  "authorizationSucceeded": true,
  "attachSucceeded": true,
  "attachOwnedCanvasCount": 1,
  "attachOwnedPaneCount": 1,
  "attachOwnedListenerCount": 3,
  "attachInitialSnapshotCompletedCount": 1,
  "attachInitialDrawCompletedCount": 1,
  "previewCommandOutcome": "failed_closed",
  "previewCommandReasonCode": "ATLAS_NOT_AUTHORIZED",
  "previewPlanCreated": false,
  "previewBatchCreated": false,
  "previewDrawCompleted": false,
  "duplicatePreviewBlocked": true,
  "clearReturnedBlocked": true,
  "detachCleanupCompleted": true,
  "detachReferencesReleased": true,
  "finalOwnedCanvasCount": 0,
  "finalOwnedPaneCount": 0,
  "finalOwnedListenerCount": 0,
  "runtimeExecutionEnabled": false,
  "mapAttachmentAllowed": false,
  "automaticRendererExecutionAllowed": false,
  "lifecycleExecutionEnabled": false,
  "classification": "BLOCKED_BY_LIVE_PREVIEW_AUTHORIZATION_MISMATCH"
}
```

## Result

Phase 212.5 did produce real Safari evidence, but the phase is blocked instead of pass-complete.

What is now proven live:

- Bellarine readiness works at the approved coordinate
- persistent Atlas authorization works
- persistent Atlas attach works
- the retained surface/listener/lifecycle path draws its initial attach frame successfully
- detach and cleanup return to zero ownership cleanly

What remains blocked:

- the manual asset population preview command still fails closed as `ATLAS_NOT_AUTHORIZED`

Recommended next phase:

- `212.5a — Persistent Live Preview Authorization Alignment Fix`
