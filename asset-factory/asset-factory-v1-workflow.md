# Asset Factory v1 Production Workflow

Status: Locked workflow candidate  
Date: 2026-07-29

## Required Lifecycle

Specification  
↓  
Authoring Setup  
↓  
Blender Generation  
↓  
Source Verification  
↓  
Universal Export  
↓  
GLB Validation  
↓  
Visual Review  
↓  
Registration  
↓  
Promotion  
↓  
Recipe Ready

## Required Phases

1. Specification
   Define asset identity, recipe identity, dependency expectations, expected LODs, naming, and family placement.
2. Authoring Setup
   Prepare deterministic generator and export-resume workflows, authoring manifests, and identity-anchor expectations.
3. Blender Generation
   Create or refine the source blend without publishing, runtime activation, or unrelated asset changes.
4. Source Verification
   Confirm the correct blend exists in the correct family location and record its hash.
5. Universal Export
   Use the Asset Factory universal exporter to normalize objects, discover LODs, validate shared identity, collect metrics, and write an export manifest.
6. GLB Validation
   Confirm identity, recipe, dependency, metadata, anchors, LOD order, and absence of external dependencies.
7. Visual Review
   Perform manual Blender or approved visual inspection review before replacement or promotion.
8. Registration
   Register only validated outputs and their verified source records.
9. Promotion
   Advance the approved current development revision while preserving historical protected revisions.
10. Recipe Ready
    Treat the asset as available for recipe consumption only after all prior gates pass.

## Required Files

- `specification/family-specification.json`
- `specification/asset-production-workflow.md`
- `specification/production-checklist.md`
- `source/source-verification.json`
- `export/authoring-manifest.json`
- `export/export-manifest.json`
- `validation/preflight-validation.json`
- `validation/glb-validation.json`
- `validation/visual-review.json`
- `reports/verification-report.md`
- `reports/promotion-report.json`

## Validation Gates

- Preflight gate: asset identity, recipe identity, dependency identity, identity anchors, LOD roots, naming, metadata, and folder structure must all exist before export.
- Source gate: the source blend must exist in the correct family location and its hash must be recorded.
- Universal export gate: the exporter must validate identity and write a deterministic manifest.
- GLB gate: CLOSE complexity must exceed GAMEPLAY, and GAMEPLAY must exceed MAP; no external dependencies are allowed.
- Visual approval gate: manual visual review is mandatory before approval replacement or promotion.
- Registration gate: registration is allowed only after source, export, GLB, and visual review gates all pass.
- Promotion gate: promotion is allowed only after verification is complete and the previous approved revision remains protected.

## Registration Rules

- Registration must reference the verified source blend and validated GLB outputs only.
- Registration must record version, identity contract, dependency set, and deterministic fingerprints.
- Registration must not publish the asset.
- Registration must not activate runtime usage.

## Promotion Rules

- Promotion changes Asset Factory catalog state only.
- The promoted revision must have a completed verification record and passed visual review.
- The previous approved revision must remain historical and protected.
- Promotion must not overwrite protected historical source files or approved GLBs.

## Rollback Rules

- Rollback restores the previously protected approved revision without deleting history.
- Rollback preserves candidate verification evidence and prior approved hashes.
- Rollback is required if identity validation fails, visual approval fails, or golden regression checks fail.

## Golden Regression Assets

- `TREE_EUCALYPTUS_001_v001`
- `TREE_BOTTLEBRUSH_001_v002`
- `SHRUB_COASTAL_LOW_001_v001`

Future exporter or validator changes must be checked against these golden baselines for:

- identity preservation
- dependency identity preservation
- LOD order preservation
- no external dependencies
- manifest schema stability

## Production Checklist

- PASS when preflight identity and folder checks complete.
- PASS when the verified source blend exists and its hash is recorded.
- PASS when the universal exporter validates the asset and writes a manifest.
- PASS when GLB validation confirms identity, dependency, anchor, and LOD requirements.
- PASS when manual visual review explicitly approves the candidate.
- FAIL when any identity, dependency, naming, or LOD requirement fails.
- FAIL when approved binaries would need to be overwritten.

Codex should be used for specification drafting, authoring setup, validation preparation, manifest verification, registration preparation, promotion preparation, and regression tests.

Manual Blender review is required for visual approval and for any visible geometry refinement revision.

Promotion is allowed only after verification passes, visual review passes, and a rollback target remains protected.
