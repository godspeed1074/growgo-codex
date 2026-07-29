# GROWGO SESSION 187.2 — BOTTLEBRUSH METADATA IDENTITY FIX

## Goal

Fix `TREE_BOTTLEBRUSH_001` GLB metadata preservation validation so recipe identity and dependency identity are recognised correctly without touching renderer, map, publishing, runtime, pavilion, or eucalyptus assets.

## Exact Cause

The bottlebrush GLBs were not missing metadata.

The exported `.glb` files already contained:

- `growgo_recipe_id`
- `growgo_palette_id`
- `growgo_lod_profile`
- `growgo_dependencies`
- `growgo_dependency_id`
- `growgo_identity_contract_v2`

The failure was architectural on the Node-side validation path:

- the shared `asset-identity-contract.mjs` metadata scanner only descended into metadata keys matching camel-case patterns like `*Id`
- Blender exports these Asset Factory fields as snake-case `growgo_*`
- as a result, recipe and dependency metadata existed in the GLB extras but were not counted by the shared validator

## Fix Applied

Updated the shared metadata scanner in:

- `asset-factory/asset-identity-contract.mjs`

Changes:

- scan `growgo_*` metadata keys
- scan snake-case `_id` metadata keys
- treat metadata-derived dependency hits as real dependency identity evidence

No Blender script changes were required for this repair because the current bottlebrush exports already preserve the required metadata.

## Files Changed

- `asset-factory/asset-identity-contract.mjs`
- `tests/asset-factory-asset-identity-contract.test.mjs`

## Tests

Passed:

- `tests/asset-factory-asset-identity-contract.test.mjs`
- `tests/asset-factory-tree-bottlebrush-post-run-verify.test.mjs`

Regression check passed:

- `asset-factory/tree-eucalyptus-post-run-verify.mjs`

## Verified Outcome

After the shared validator fix:

- `TREE_BOTTLEBRUSH_001_LOD_CLOSE.glb` verifies complete
- `TREE_BOTTLEBRUSH_001_LOD_GAMEPLAY.glb` verifies complete
- `TREE_BOTTLEBRUSH_001_LOD_MAP.glb` verifies complete
- registration gate now reports `ready: true`

## Readiness

`TREE_BOTTLEBRUSH_001` is ready for the next registration step.

Another export attempt is **not required** for this specific metadata issue because the current GLBs already contain the needed recipe and dependency identity data.

## Safety

- No Blender launch
- No bottlebrush regeneration
- No publishing
- No approval changes
- No pavilion record changes
- No eucalyptus asset modifications
