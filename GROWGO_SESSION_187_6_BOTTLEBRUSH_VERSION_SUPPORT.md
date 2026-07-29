## GROWGO SESSION 187.6 — TREE_BOTTLEBRUSH_001 Visual Refinement Version Support

### Goal

Create a safe revision workflow for `TREE_BOTTLEBRUSH_001` geometry refinement without overwriting the existing registered `v001` package.

### Exact issue addressed

The bottlebrush manual authoring and export scripts were still hard-wired to `v001`. That meant a refinement pass risked colliding with the existing registered source filename and generic output records.

### Files changed

- `asset-factory/local-blender-scripts/generate_tree_bottlebrush_001.py`
- `asset-factory/local-blender-scripts/resume_tree_bottlebrush_001_exports.py`
- `tests/asset-factory-tree-bottlebrush-manual-authoring.test.mjs`

### What changed

The bottlebrush refinement workflow now targets a new revision lane:

- source blend target:
  - `TREE_BOTTLEBRUSH_001_v002.blend`
- export targets:
  - `TREE_BOTTLEBRUSH_001_v002_LOD_CLOSE.glb`
  - `TREE_BOTTLEBRUSH_001_v002_LOD_GAMEPLAY.glb`
  - `TREE_BOTTLEBRUSH_001_v002_LOD_MAP.glb`

The scripts now preserve:

- asset ID
- recipe ID
- identity anchors
- dependency identity
- LOD roots
- deterministic export validation

The generator also writes revision-side metadata records so a `v002` preparation pass does not overwrite the existing `v001` package records:

- `tree-bottlebrush-v002-manifest.json`
- `tree-bottlebrush-v002-metadata.json`
- `tree-bottlebrush-v002-validation.json`

### Safety outcome

`v001` remains preserved as the previously registered source and is not changed by this refinement workflow.

No registration, validation record replacement, or visual review replacement for `v001` should occur until `v002` completes:

1. generation
2. export validation
3. registration checks
4. manual visual review

### Manual Blender steps for v002

1. Open a fresh Blender 4.2 LTS file.
2. Run `asset-factory/local-blender-scripts/generate_tree_bottlebrush_001.py`.
3. Inspect the refined canopy and flower visibility.
4. Save the scene as:
   - `TREE_BOTTLEBRUSH_001_v002.blend`
5. Run:
   - `asset-factory/local-blender-scripts/resume_tree_bottlebrush_001_exports.py`
6. Return for post-run verification before any registration changes.

### Status

- `v001` preserved: yes
- `v002` ready for manual Blender generation: yes
- renderer/map/runtime/publishing changes: none
- eucalyptus touched: no
- pavilion touched: no
