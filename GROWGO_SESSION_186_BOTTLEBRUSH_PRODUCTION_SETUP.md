# GROWGO SESSION 186 — TREE_BOTTLEBRUSH_001 ASSET FACTORY PRODUCTION SETUP

Branch:
`feature/growgo-asset-factory-town-expansion`

Date:
Wednesday, July 29, 2026

## Goal

Prepare `TREE_BOTTLEBRUSH_001` as the first new asset set up using the completed GrowGo Asset Factory reference pipeline, without launching Blender, generating binaries, or modifying any existing pavilion or eucalyptus asset records.

## Files Created

- `asset-factory/tree-bottlebrush-production-setup.mjs`
- `asset-factory/local-blender-scripts/generate_tree_bottlebrush_001.py`
- `asset-factory/local-blender-scripts/resume_tree_bottlebrush_001_exports.py`
- `tests/asset-factory-tree-bottlebrush-production-setup.test.mjs`
- `GROWGO_SESSION_186_BOTTLEBRUSH_PRODUCTION_SETUP.md`

## Asset Setup

Asset:
`TREE_BOTTLEBRUSH_001`

Category:
`nature`

Recipe definition:

- `assetId`: `TREE_BOTTLEBRUSH_001`
- `recipeId`: `TREE_BOTTLEBRUSH_RECIPE_001`
- `registryRecipeId`: `RECIPE_NATURE_ROADSIDE_NATIVE_STANDARD_001`
- `version`: `v001`
- `variantId`: `DEFAULT`
- `paletteId`: `AU_BOTTLEBRUSH_NATIVE_001`
- `lodProfile`: `NATURE_STANDARD_001`

## Expected LODs

Defined:

- `LOD_CLOSE`
- `LOD_GAMEPLAY`
- `LOD_MAP`

Each LOD already has a reserved root and identity-anchor naming pattern through the setup definition.

## Visual Targets

Defined visual goals:

- GrowGo papercut 2.5D style
- lightweight mobile geometry
- Australian native vegetation identity
- road/trail placement suitability

## Reusable Dependencies

Prepared dependency set:

- `MOD_TREE_TRUNK_BOTTLEBRUSH_001`
- `MOD_TREE_BRANCH_BOTTLEBRUSH_001`
- `MOD_TREE_LEAF_CLUSTER_BOTTLEBRUSH_001`
- `MOD_TREE_FLOWER_CLUSTER_BOTTLEBRUSH_001`
- `MOD_TREE_GROUND_SOCKET_001`

These are declared as reusable dependency placeholders for future authoring and identity-aware export work.

## Placeholder Workflow

Prepared:

- generator placeholder structure
- export workflow placeholder
- validation placeholder definition
- registration placeholder definition
- visual review placeholder definition

These are setup contracts only.

They do not:

- generate geometry
- write production GLBs
- write production registration records
- create publish state

## Blender Workflow Preparation

The placeholder Blender scripts already reserve the permanent workflow shape:

- bootstrap loader required
- shared helper loading required
- identity-anchor workflow reserved
- deterministic LOD export sequence reserved
- Blender 4.2 LTS compatibility context reserved

## Tests Run

Focused setup tests:

- `tests/asset-factory-tree-bottlebrush-production-setup.test.mjs`

Coverage:

- recipe and identity fields
- required LOD definition
- reusable dependencies
- placeholder Blender script syntax
- manual authoring readiness without binaries or publishing

## Safety Confirmation

This setup did not:

- launch Blender
- create final assets
- create binary outputs
- modify eucalyptus files
- modify pavilion files
- modify renderer systems
- modify map systems
- publish anything

## Outcome

`TREE_BOTTLEBRUSH_001` is now prepared as a clean reference-pipeline setup asset and is ready for future manual Blender authoring.
