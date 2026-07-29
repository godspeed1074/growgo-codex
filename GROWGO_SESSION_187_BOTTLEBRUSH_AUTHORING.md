# GROWGO SESSION 187 — TREE_BOTTLEBRUSH_001 BLENDER AUTHORING WORKFLOW

Branch:
`feature/growgo-asset-factory-town-expansion`

Date:
Wednesday, July 29, 2026

## Goal

Prepare the manual Blender authoring workflow for `TREE_BOTTLEBRUSH_001` using the completed GrowGo Asset Factory pipeline, without launching Blender, generating binaries, registering the asset, or publishing anything.

## Files Changed

- `asset-factory/local-blender-scripts/generate_tree_bottlebrush_001.py`
- `asset-factory/local-blender-scripts/resume_tree_bottlebrush_001_exports.py`

## Files Created

- `tests/asset-factory-tree-bottlebrush-manual-authoring.test.mjs`
- `GROWGO_SESSION_187_BOTTLEBRUSH_AUTHORING.md`

## Blender Generator Workflow

The bottlebrush generator is now a real manual-authoring script rather than a placeholder.

It now:

- uses `growgo_blender_bootstrap.py`
- uses Asset Identity Anchor v2
- defines:
  - `TREE_BOTTLEBRUSH_001_LOD_CLOSE_ROOT`
  - `TREE_BOTTLEBRUSH_001_LOD_GAMEPLAY_ROOT`
  - `TREE_BOTTLEBRUSH_001_LOD_MAP_ROOT`
- writes repository-side setup metadata
- creates identity-aware collections, materials, scene metadata, and LOD roots
- creates per-LOD identity anchors
- reserves dependency-aware component roles for:
  - trunk
  - branch
  - leaf cluster
  - flower cluster
  - ground socket

The script is manual-authoring ready, but it has not been executed in Blender during this phase.

## Export Workflow

The bottlebrush export workflow is now a real guarded resume/export script.

It now includes:

- deterministic export selection
- Blender 4.2 compatible glTF argument handling
- extras metadata export
- asset identity validation
- dependency identity validation
- palette identity validation
- per-LOD identity anchor validation
- atomic `.tmp.glb` export finalisation
- stop-on-first-failure behaviour

This workflow is prepared for future manual Blender use only.

## Safety Preserved

This phase did not:

- launch Blender
- create GLBs
- create a `.blend`
- register the bottlebrush asset
- publish anything
- modify eucalyptus assets
- modify pavilion assets

## Tests Run

Focused bottlebrush setup tests:

- `tests/asset-factory-tree-bottlebrush-production-setup.test.mjs`
  - 5 passed
  - 0 failed

Focused bottlebrush authoring workflow tests:

- `tests/asset-factory-tree-bottlebrush-manual-authoring.test.mjs`
  - verifies Python syntax
  - verifies bootstrap usage
  - verifies identity-anchor usage
  - verifies LOD root naming
  - verifies metadata and dependency expectations
  - verifies Blender 4.2-safe export argument handling

## Outcome

`TREE_BOTTLEBRUSH_001` is now ready for a future manual Blender run through the GrowGo Asset Factory reference pipeline.

The workflow is prepared, validated at the source level, and still safely non-executed.
