# GROWGO SESSION 184 — EUCALYPTUS TREE PRODUCTION AUTHORING

## Summary

This session prepares `TREE_EUCALYPTUS_001` for the proven manual Blender
workflow used by the pavilion, without launching Blender from Codex.

Codex work completed:

- audited the existing eucalyptus asset identity, recipes, modules, and files
- created a manual Blender generation script for a deterministic papercut tree
- created a manual Blender export-resume script for safe `.tmp.glb` exports
- created a Node-side verifier that does not launch Blender
- added focused tests for identity, filenames, temp naming, export order, and
  decreasing LOD complexity
- created a simple manual handoff document for the user

This session does **not** complete the tree.

Completion still requires:

1. manual Blender generation
2. manual save of `TREE_EUCALYPTUS_001_v001.blend`
3. manual export of the three final GLBs
4. Codex verification of the final outputs

## Session 184 Repair

Repair completed on Wednesday, July 29, 2026.

Exact cause:

- the manual generator was still relying on workspace-style output resolution
  without a hard repository guard
- when run inside Blender, that path could resolve relative to Blender's own
  protected application context instead of the GrowGo repository
- Blender then raised:
  `OSError: [Errno 30] Read-only file system: 'asset-factory-workspace'`

Repair applied:

- generator now resolves output through explicit absolute repository constants:
  `REPO_ROOT`, `WORKSPACE_ROOT`, and `EXPECTED_OUTPUT_DIR`
- generator prints the resolved output directory before writing
- generator refuses to write inside `/Applications`
- generator refuses to write outside the GrowGo repository
- generator creates the output directory safely inside the repo workspace
- generator no longer depends on Blender's current working directory
- resume export script now uses the same guarded absolute repository path model

## Files Created

- [tree-eucalyptus-production-run.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/tree-eucalyptus-production-run.mjs)
- [tree-eucalyptus-post-run-verify.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/tree-eucalyptus-post-run-verify.mjs)
- [generate_tree_eucalyptus_001.py](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/local-blender-scripts/generate_tree_eucalyptus_001.py)
- [resume_tree_eucalyptus_001_exports.py](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/local-blender-scripts/resume_tree_eucalyptus_001_exports.py)
- [asset-factory-tree-eucalyptus-production-run.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-tree-eucalyptus-production-run.test.mjs)
- [asset-factory-tree-eucalyptus-manual-resume.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-tree-eucalyptus-manual-resume.test.mjs)
- [GROWGO_SESSION_184_EUCALYPTUS_MANUAL_STEPS.md](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_184_EUCALYPTUS_MANUAL_STEPS.md)
- [GROWGO_SESSION_184_EUCALYPTUS_TREE_PRODUCTION_AUTHORING.md](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_184_EUCALYPTUS_TREE_PRODUCTION_AUTHORING.md)

## Files Changed In This Repair

- [generate_tree_eucalyptus_001.py](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/local-blender-scripts/generate_tree_eucalyptus_001.py)
- [resume_tree_eucalyptus_001_exports.py](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/local-blender-scripts/resume_tree_eucalyptus_001_exports.py)
- [asset-factory-tree-eucalyptus-production-run.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-tree-eucalyptus-production-run.test.mjs)
- [asset-factory-tree-eucalyptus-manual-resume.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-tree-eucalyptus-manual-resume.test.mjs)
- [GROWGO_SESSION_184_EUCALYPTUS_MANUAL_STEPS.md](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_184_EUCALYPTUS_MANUAL_STEPS.md)
- [GROWGO_SESSION_184_EUCALYPTUS_TREE_PRODUCTION_AUTHORING.md](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_184_EUCALYPTUS_TREE_PRODUCTION_AUTHORING.md)

## Existing Asset Audit

Permanent identity already present:

- asset ID: `TREE_EUCALYPTUS_001`
- source recipe ID: `TREE_EUCALYPTUS_RECIPE_001`
- registry recipe ID: `RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001`
- registry family ID: `TREE_ASSET_FAMILY_001`
- production family ID: `COASTAL_NATURE_FAMILY_001`
- variants: `windswept`, `upright`, `young_cluster`

Existing specification and compatibility references found:

- [asset-registry.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/asset-registry.mjs)
- [nature-asset-creation-pass.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/nature-asset-creation-pass.mjs)
- [asset-creation-specification.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/asset-creation-specification.mjs)
- [coastal-australia-asset-specification-pack.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/coastal-australia-asset-specification-pack.mjs)
- [coastal-starter-pack-production-queue-foundation.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/coastal-starter-pack-production-queue-foundation.mjs)
- [tree-eucalyptus-prototype-asset-package.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/tree-eucalyptus-prototype-asset-package.mjs)
- [tree-eucalyptus-local-generator.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/tree-eucalyptus-local-generator.mjs)

Existing generated files found:

- `TREE_EUCALYPTUS_001_LOD_CLOSE.glb`
- `TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb`
- `TREE_EUCALYPTUS_001_LOD_MAP.glb`
- `TREE_EUCALYPTUS_001_LOD_DISTANT_SILHOUETTE.glb`
- `tree-eucalyptus-manifest.json`
- `tree-eucalyptus-metadata.json`
- `tree-eucalyptus-validation.json`

Missing production file:

- `TREE_EUCALYPTUS_001_v001.blend`

Duplicate or legacy definitions identified:

- legacy generator script:
  [generate_tree_eucalyptus.py](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/local-blender-scripts/generate_tree_eucalyptus.py)
- legacy generator wrapper:
  [tree-eucalyptus-local-generator.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/tree-eucalyptus-local-generator.mjs)
- legacy extra LOD output:
  `TREE_EUCALYPTUS_001_LOD_DISTANT_SILHOUETTE.glb`

These legacy files were preserved. No duplicate registry entry was created.

Atlas compatibility rules preserved:

- `RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001`
- `RECIPE_NATURE_PARK_STANDARD_001`
- `RECIPE_NATURE_FOREST_ENVIRONMENT_STANDARD_001`

## Reusable Module Audit

Reusable modules and conventions:

- `TREE_EUCALYPTUS_TRUNK_001`
- `TREE_BRANCH_SMALL_001`
- `TREE_BRANCH_LARGE_001`
- `TREE_CANOPY_EUCALYPTUS_001`
- `TREE_LEAF_CLUSTER_001`
- ground socket pattern
- landscape socket pattern
- shared nature material strategy
- shared atlas-mobile-ready export assumptions
- LOD naming and progression rules

Missing reusable modules:

- `TREE_EUCALYPTUS_VARIANT_BENT_COASTAL_001`
- `TREE_EUCALYPTUS_VARIANT_STREET_COMPACT_001`
- `TREE_EUCALYPTUS_VARIANT_RESERVE_TALL_001`
- `TREE_EUCALYPTUS_SOCKET_STANDARDISED_001`

Estimated reuse percentage:

- `75%`

## Production Specification

Prepared tree design:

- lightweight papercut 2.5D eucalyptus silhouette
- deterministic trunk and branching
- layered canopy masses
- no photoreal interior-style detail
- shared materials only
- mobile-ready geometry

Approved material slots:

- `trunk`
- `branch`
- `canopy light`
- `canopy mid`
- `canopy dark`

Palette restrictions enforced:

- no bright pink foliage
- no neon blue foliage
- no pure black foliage
- no unrealistic random palettes

LOD contract prepared:

- `LOD_CLOSE`: strongest trunk, branch, and canopy silhouette detail
- `LOD_GAMEPLAY`: reduced branch detail and simplified canopy masses
- `LOD_MAP`: minimal trunk plus clear map-scale canopy masses

Complexity rule:

- `LOD_CLOSE > LOD_GAMEPLAY > LOD_MAP`

## Current Verified Truth

Running the new verifier against the current export folder today,
Wednesday, July 29, 2026, shows:

- `TREE_EUCALYPTUS_001_v001.blend`: `MISSING`
- `TREE_EUCALYPTUS_001_LOD_CLOSE.glb`: present but `CORRUPT` for current gate
- `TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb`: present but `CORRUPT` for current gate
- `TREE_EUCALYPTUS_001_LOD_MAP.glb`: present but `CORRUPT` for current gate

Why the current GLBs are blocked:

- they parse successfully
- they have no external dependencies
- they do show decreasing LOD complexity
- but they do **not** preserve embedded `TREE_EUCALYPTUS_001` identity under the
  new verifier contract
- and there is still no final verified `.blend`

Current registration blockers:

- `TREE_EUCALYPTUS_001_v001.blend:MISSING`
- `TREE_EUCALYPTUS_001_LOD_CLOSE.glb:CORRUPT`
- `TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb:CORRUPT`
- `TREE_EUCALYPTUS_001_LOD_MAP.glb:CORRUPT`
- `final_blend_missing_or_unverified`

## Safe Restart Instruction

The failed generator appears to have already created geometry in the currently
open Blender scene, but completeness cannot be proven from Codex.

Safest next action:

- start from a fresh Blender file
- rerun the repaired generator
- inspect the regenerated tree
- then save the final `.blend`

Do **not** continue from the partially failed scene.

## Expected Outputs After Manual Blender Execution

- `TREE_EUCALYPTUS_001_v001.blend`
- `TREE_EUCALYPTUS_001_LOD_CLOSE.glb`
- `TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb`
- `TREE_EUCALYPTUS_001_LOD_MAP.glb`

Temporary files must not count as final outputs.

The export script uses:

- `TREE_EUCALYPTUS_001_LOD_CLOSE.tmp.glb`
- `TREE_EUCALYPTUS_001_LOD_GAMEPLAY.tmp.glb`
- `TREE_EUCALYPTUS_001_LOD_MAP.tmp.glb`

## Manual Blender Steps

The simple user handoff is in:

- [GROWGO_SESSION_184_EUCALYPTUS_MANUAL_STEPS.md](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_184_EUCALYPTUS_MANUAL_STEPS.md)

Post-run Codex verification command:

```bash
node asset-factory/tree-eucalyptus-post-run-verify.mjs
```

## Tests Passed

Passed:

- `node --test tests/asset-factory-tree-eucalyptus-production-run.test.mjs tests/asset-factory-tree-eucalyptus-manual-resume.test.mjs`
- `PYTHONPYCACHEPREFIX=/private/tmp/growgo-tree-eucalyptus-pycache python3 -m py_compile asset-factory/local-blender-scripts/generate_tree_eucalyptus_001.py asset-factory/local-blender-scripts/resume_tree_eucalyptus_001_exports.py`

Focused coverage added:

- existing registry identity preserved
- no duplicate asset definition
- deterministic generation settings
- Blender script syntax
- exact final filenames
- `.tmp.glb` temporary naming
- no `.glb.tmp`
- export order
- stop-on-first-failure
- no Blender launch from Codex
- decreasing LOD complexity
- approved palette restrictions
- absolute repository output path
- no relative `asset-factory-workspace` path
- output path remains inside the GrowGo repository
- `/Applications` output is rejected
- generator and resume script share the same output directory
- deterministic path construction

## Readiness

`TREE_EUCALYPTUS_001` is ready for **manual generation**.

It is **not** complete yet, **not** validation-ready yet, and **not** ready for
registration or publishing.

The next step is the user’s manual Blender execution of the Session 184 scripts,
followed by Codex verification of the final `.blend` and three final GLBs.
