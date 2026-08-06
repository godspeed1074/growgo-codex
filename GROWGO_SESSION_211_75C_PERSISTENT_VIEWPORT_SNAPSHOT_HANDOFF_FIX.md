# GrowGo Session 211.75c — Persistent Viewport Snapshot Handoff Fix

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

Date:
August 6, 2026

Status:
PASS

Classification:
`PERSISTENT_VIEWPORT_SNAPSHOT_HANDOFF_ALIGNED_WITH_ONE_FRAME_CONTRACT`

Goal:
Fix the narrow persistent first-draw failure where the persistent live seam reached draw but handed the wrong viewport snapshot shape into the proven one-frame draw contract.

Observed Safari failure before this phase

- attach succeeded
- retained surface acquired
- lifecycle owner acquired
- initial redraw requested
- cleanup completed successfully
- no cleanup failures
- originating failure reason:
  `FRAME_VIEWPORT_SNAPSHOT_VALUES_INVALID`
- snapshot trace identity values remained null:
  - `snapshotId`
  - `snapshotGenerationId`
  - `canvasIdentityId`

Root cause

The persistent live path was mixing two different snapshot shapes:

1. The real one-frame snapshot creator returned a wrapped result:
   - `outcome`
   - `reasonCode`
   - `frameViewportSnapshot`

2. The real draw seam expected the inner one-frame viewport snapshot contract with fields such as:
   - `logicalWidth`
   - `logicalHeight`
   - `backingWidth`
   - `backingHeight`
   - `devicePixelRatio`
   - `bounds`
   - `northWestCoordinate`
   - `canvasLayerPosition`
   - `zoom`

The persistent live path was not aligning those shapes cleanly. That caused the draw seam to validate the wrong payload and fail closed with:

- `FRAME_VIEWPORT_SNAPSHOT_VALUES_INVALID`

It also meant the persistent trace could not carry persistent snapshot identity fields because the live snapshot object never became the normalized persistent snapshot contract.

Exact fix

1. Normalized one-frame viewport snapshots into the persistent snapshot contract.
   - Added compatibility normalization so the persistent snapshot provider accepts the real one-frame viewport snapshot contract directly.
   - Supported real one-frame fields such as:
     - `logicalWidth`
     - `logicalHeight`
     - `devicePixelRatio`
     - `bounds`
     - `canvasLayerPosition`

2. Converted persistent normalized snapshots back into the exact one-frame draw contract at draw time.
   - Added a narrow contract converter for the real draw seam.
   - Ensured the draw seam receives the exact expected `frameViewportSnapshot` payload rather than a persistent wrapper/status object.

3. Fixed persistent live app composition.
   - Unwrapped the real one-frame snapshot result and normalized only the inner `frameViewportSnapshot`.
   - Preserved:
     - `snapshotId`
     - `snapshotGenerationId`
     - redraw reason
     - persistent lifecycle/surface identity

4. Improved first-draw trace identity propagation.
   - Snapshot IDs now propagate into the first-draw trace.
   - Canvas identity now propagates from the retained-surface wrapper status as a serializable token.

Files changed

- `client/development-alpha-app.mjs`
- `client/developer-only-persistent-atlas-frame-snapshot-provider.mjs`
- `client/developer-only-controlled-persistent-atlas-retained-surface-wrapper.mjs`
- `tests/client-controlled-persistent-atlas-first-draw-trace.test.mjs`
- `tests/client-developer-only-persistent-atlas-frame-snapshot-provider.test.mjs`
- `tests/client-persistent-atlas-hybrid-verification.test.mjs`

Contract compatibility proof

- one-frame viewport snapshot contract now normalizes into persistent scalar snapshot fields
- persistent normalized snapshot now converts back into the exact one-frame draw contract
- logical size, pixel ratio, bounds, and canvas position remain compatible in both directions

Trace identity propagation proof

- `snapshotId` is non-null in the persistent first-draw trace
- `snapshotGenerationId` is non-null in the persistent first-draw trace
- `canvasIdentityId` is non-null when a retained canvas exists

Safety preserved

- no raw Leaflet objects introduced into the persistent snapshot
- no raw browser objects introduced into diagnostics
- no draw mutation of the frozen snapshot
- no authorization, listener, scheduler, cleanup-order, or safety-flag changes

Regression band

Passed:

- persistent first-draw trace
- persistent snapshot wrapper
- persistent draw wrapper
- persistent contract integration
- persistent manual command
- persistent hybrid verification
- one-frame draw-map snapshot contract
- one-frame snapshot-aware draw seam
- persistent cleanup wrapper

Result:
- 208 passed
- 0 failed

Canonical safety flags remained false

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Manual follow-up

Safari retry is still required.

This phase fixes the viewport snapshot handoff and trace identity propagation. It does not enable any automatic runtime behavior.
