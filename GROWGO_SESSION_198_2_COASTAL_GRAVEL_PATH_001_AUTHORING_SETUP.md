# GrowGo Session 198.2 — COASTAL_GRAVEL_PATH_001 Authoring Setup

Date: 2026-07-30  
Branch: `feature/growgo-asset-factory-town-expansion`

## Scope

Prepare the Asset Factory v1 manual authoring workflow for `COASTAL_GRAVEL_PATH_001_v001` without generating final GLBs, registering the asset, promoting the asset, or modifying any approved asset.

## Created

- `asset-factory/local-blender-scripts/generate_coastal_gravel_path_001.py`
- `asset-factory/local-blender-scripts/resume_coastal_gravel_path_001_exports.py`
- `asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/validation/coastal-gravel-path-manual-authoring-setup.json`
- `asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/validation/coastal-gravel-path-authoring-manifest.json`
- `tests/asset-factory-coastal-gravel-path-manual-authoring.test.mjs`

## Authoring guarantees

- deterministic manual Blender generator
- CLOSE, GAMEPLAY, and MAP LOD roots
- identity anchor per LOD
- source/export separation preserved
- papercut 2.5D path style
- lightweight mobile geometry
- modular path pieces
- snap-compatible placement
- repeated placement readiness
- deterministic placement compatibility
- compatibility with `COASTAL_NATURE_FAMILY_001` assets

## Safety

- no Blender source file created in this phase
- no GLBs exported in this phase
- no registration record created
- no promotion record created
- no approved asset modified

## Outcome

`COASTAL_GRAVEL_PATH_001_v001` is ready for manual Blender generation under the Asset Factory v1 authoring lane.
