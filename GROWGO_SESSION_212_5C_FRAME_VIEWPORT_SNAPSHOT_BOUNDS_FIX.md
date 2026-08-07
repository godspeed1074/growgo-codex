Phase 212.5c — Live Asset Population Preview Snapshot Bounds Fix

Date:
- 2026-08-07

Branch:
- feature/atlas-phase-211-6-gated-map-attachment-controller

Context:
- Real Safari preview command reached the live persistent preview snapshot path.
- The command failed closed with:
  - outcome = failed_closed
  - reasonCode = FRAME_VIEWPORT_SNAPSHOT_BOUNDS_INVALID
- Safety flags remained:
  - runtimeExecutionEnabled = false
  - mapAttachmentAllowed = false
  - automaticRendererExecutionAllowed = false
  - lifecycleExecutionEnabled = false

Observed root cause:
- The live preview seam already normalized the one-frame snapshot through:
  - normalizePersistentAtlasFrameSnapshotForContract(...)
- The persistent snapshot provider then normalized that result again inside:
  - buildNormalizedSnapshot(...)
- On the second normalization pass, projected viewport bounds already in scalar form:
  - northWestLatitude
  - northWestLongitude
  - southEastLatitude
  - southEastLongitude
  were not recognized by the bounds normalization branch.
- That caused projectedViewportBounds to collapse to null, which later produced an invalid frame viewport bounds contract for draw.

Fix applied:
- Updated:
  - client/developer-only-persistent-atlas-frame-snapshot-provider.mjs
- Added explicit support for already-normalized scalar projected viewport bounds during snapshot normalization.
- The provider now preserves scalar bounds when a raw snapshot has already been normalized upstream.

Focused regression coverage added:
- tests/client-developer-only-persistent-atlas-frame-snapshot-provider.test.mjs
  - added:
    - already-normalized projected viewport bounds survive provider normalization

Validation run:
- node --test tests/client-developer-only-persistent-atlas-frame-snapshot-provider.test.mjs
- node --test tests/client-developer-only-atlas-population-draw-integration.test.mjs
- node --test tests/client-developer-only-atlas-asset-population-preview.test.mjs

Result:
- All focused tests passed.

Safety:
- No renderer startup enabled.
- No automatic spawning added.
- No persistent attachment policy changed.
- No safety flags changed.

Next required step:
- Manual Safari retry of:
  - previewAtlasAssetPopulation

Expected effect:
- The preview path should now preserve valid viewport bounds through the persistent snapshot seam instead of failing with FRAME_VIEWPORT_SNAPSHOT_BOUNDS_INVALID.
