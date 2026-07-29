# GROWGO SESSION 188.1 — SHRUB_COASTAL_LOW_001 Manual Authoring Setup

## Goal

Create the manual Blender authoring workflow for
`SHRUB_COASTAL_LOW_001_v001` without launching Blender, generating final
outputs, registering the asset, publishing, or activating runtime usage.

## Reference workflows

The setup follows the established patterns from:

- `TREE_EUCALYPTUS_001`
- `TREE_BOTTLEBRUSH_001`

It reuses the shared Blender bootstrap and asset identity-anchor helper.

## Generator

Created:

- `asset-factory/local-blender-scripts/generate_shrub_coastal_low_001.py`

The generator prepares:

- deterministic low coastal shrub geometry
- shallow, non-planar papercut 2.5D depth
- mobile-first six-sided branch forms
- low-subdivision foliage and flower forms
- four shared matte materials
- CLOSE, GAMEPLAY, and MAP LOD roots
- permanent asset, recipe, palette, dependency, and metadata identity

Required identity anchors:

- `SHRUB_COASTAL_LOW_001_LOD_CLOSE_IDENTITY_ANCHOR`
- `SHRUB_COASTAL_LOW_001_LOD_GAMEPLAY_IDENTITY_ANCHOR`
- `SHRUB_COASTAL_LOW_001_LOD_MAP_IDENTITY_ANCHOR`

The generator does not export GLBs or automatically save a blend. The user
must inspect the result and manually save:

- `SHRUB_COASTAL_LOW_001_v001.blend`

## Export resume workflow

Created:

- `asset-factory/local-blender-scripts/resume_shrub_coastal_low_001_exports.py`

The script is prepared for a later manual Blender run after the blend is saved.
It:

- requires Blender 4.2 LTS
- requires the exact saved blend filename
- checks asset, recipe, dependency, and anchor identity
- exports selected LOD object sets through temporary GLBs
- validates embedded identity and absence of external dependencies
- finalizes outputs only after validation
- verifies decreasing triangle complexity

It has no registration, publishing, or runtime activation path.

## Files created

- `asset-factory/local-blender-scripts/generate_shrub_coastal_low_001.py`
- `asset-factory/local-blender-scripts/resume_shrub_coastal_low_001_exports.py`
- `asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/validation/manual-authoring-setup.json`
- `tests/asset-factory-shrub-coastal-low-manual-authoring.test.mjs`
- `GROWGO_SESSION_188_1_SHRUB_COASTAL_LOW_MANUAL_AUTHORING_SETUP.md`

## Safety

- Blender not launched
- no blend created
- no GLBs created
- no asset registration
- no publishing
- no runtime activation
- existing assets untouched

## Next Blender generation step

1. Open a fresh Blender 4.2 LTS file.
2. Run `generate_shrub_coastal_low_001.py` inside Blender.
3. Inspect the CLOSE, GAMEPLAY, and MAP shrub silhouettes and anchors.
4. Manually save the file as `SHRUB_COASTAL_LOW_001_v001.blend` in the
   `COASTAL_SHRUB_FAMILY_001/export` directory.
5. Stop before running the export-resume script and return for source
   verification.
