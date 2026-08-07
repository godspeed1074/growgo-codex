Phase 212.5d — Live Preview Snapshot Bounds Shape Trace

Date:
- 2026-08-07

Branch:
- feature/atlas-phase-211-6-gated-map-attachment-controller

Goal:
- Expose the exact scalar bounds shape used by the live Atlas population preview path at each snapshot-to-draw boundary.
- Do not change snapshot normalization behavior.
- Do not change draw behavior.

Observed live Safari blocker before this phase:
- previewAtlasAssetPopulation(...)
- outcome = failed_closed
- reasonCode = FRAME_VIEWPORT_SNAPSHOT_BOUNDS_INVALID

Why this phase was needed:
- Phase 212.5c preserved already-normalized projected viewport bounds.
- The live Safari preview still failed with the same reason.
- That means the remaining mismatch is likely a specific live bounds shape that existing focused tests did not yet reproduce.

Implemented diagnostics:
- Added preview snapshot trace API through the local developer diagnostics namespace:
  - getAtlasAssetPopulationPreviewSnapshotTrace()
  - resetAtlasAssetPopulationPreviewSnapshotTrace(reasonCode)

Trace contract:
- schemaId
- previewTraceActive
- previewTraceCompleted
- populationPlanId
- batchId
- snapshotId
- snapshotGenerationId
- normalizationStage
- boundsValidationPassed
- boundsFailureReason
- lastFailureReason

Traced stages:
- one_frame_snapshot_created
- persistent_normalization_input
- persistent_normalization_output
- draw_contract_conversion_input
- draw_contract_conversion_output
- bounds_validation

Per-stage scalar-only bounds metadata:
- boundsPresent
- boundsType
- boundsKeys
- northWestLatitude
- northWestLongitude
- southEastLatitude
- southEastLongitude
- north
- south
- east
- west

Privacy/safety constraints preserved:
- No raw Leaflet Bounds exposed
- No raw map exposed
- No Canvas exposed
- No pane exposed
- No callbacks exposed
- No mutable snapshot object exposed
- All canonical safety flags remain false

Files changed:
- client/developer-only-atlas-asset-population-preview.mjs
- client/developer-only-persistent-atlas-frame-snapshot-provider.mjs
- client/development-alpha-app.mjs
- tests/client-developer-only-atlas-asset-population-preview.test.mjs
- tests/client-developer-only-persistent-atlas-frame-snapshot-provider.test.mjs

Focused validation run:
- node --test tests/client-developer-only-atlas-asset-population-preview.test.mjs
- node --test tests/client-developer-only-atlas-population-draw-integration.test.mjs
- node --test tests/client-developer-only-persistent-atlas-frame-snapshot-provider.test.mjs
- node --test tests/client-developer-only-persistent-atlas-frame-draw-provider.test.mjs

Result:
- Focused tests passed.

Next required manual step:
- In Safari, rerun:
  - previewAtlasAssetPopulation(...)
- Then read:
  - window.GrowGoDeveloperDiagnostics.getAtlasAssetPopulationPreviewSnapshotTrace()

Expected value of this phase:
- The next Safari result should tell us exactly which stage and scalar bounds shape still produce FRAME_VIEWPORT_SNAPSHOT_BOUNDS_INVALID.
