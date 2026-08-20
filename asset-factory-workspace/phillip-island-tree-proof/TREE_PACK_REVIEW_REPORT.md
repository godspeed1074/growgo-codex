# Phillip Island Camera-Authored Tree Proof Pack

Status: **PARTIAL — REVIEW_CANDIDATE / HUMAN VISUAL APPROVAL REQUIRED**

## Contract

This pack is governed by [`GROWGO_VEGETATION_GAMEPLAY_CAMERA_CONTRACT`](../../asset-factory/GROWGO_VEGETATION_GAMEPLAY_CAMERA_CONTRACT.md). The live Atlas authority is the fixed north-up oblique perspective path at 32° FOV. The Steam Deck review camera preserves that projection, FOV, and height-relative look-at ratio in Blender model space; it does not alter Atlas.

## Candidates

| ID | Purpose | LOD triangles (close / gameplay / map) | Gameplay cards | Exported materials / textures | State |
| --- | --- | ---: | ---: | ---: | --- |
| `TREE_EUCALYPTUS_COASTAL_002@1.0.0` | Alternate tall, split-trunk eucalyptus | 156 / 136 / 106 | 20 | 2 / 1 | `REVIEW_CANDIDATE` |
| `TREE_NATIVE_ROUNDED_001@1.0.0` | Dense, broad, darker native canopy | 132 / 112 / 82 | 20 | 2 / 1 | `REVIEW_CANDIDATE` |
| `TREE_COASTAL_WIND_001@1.0.0` | Lower asymmetric coastal tree | 156 / 136 / 106 | 20 | 2 / 1 | `REVIEW_CANDIDATE` |

Each uses the locked V6 transparent foliage atlas and a lightweight authored trunk/limb structure. No new foliage art was created; no Atlas registration, runtime profile, map population, or production approval was changed.

## Deterministic variants

- Horizontal mirror: allowed for all three candidates.
- Eucalyptus: uniform scale `0.91–1.08`, Y rotation `−12°..12°`.
- Rounded native: uniform scale `0.88–1.12`, Y rotation `−15°..15°`.
- Coastal wind: uniform scale `0.86–1.10`, Y rotation `−10°..10°`.
- Palette slots: `BASE`, `COOL`, `WARM`, `LIGHT`; final shading selection remains seed-derived and requires operator review before production registration.
- Canopy substitutions: deterministic selection from the shared V6 cluster atlas.

## Evidence

- [Gameplay-camera family board](./output/GROWGO_GAMEPLAY_CAMERA_TREE_PACK_REVIEW.png)
- [Developer-only deterministic mass-placement mockup](./output/GROWGO_DEVELOPER_ONLY_TREE_MASS_PLACEMENT_MOCKUP.png)
- [Worker receipt](./output/TREE_PACK_RECEIPT.json)
- [Performance proof](./output/TREE_PACK_PERFORMANCE_PROOF.json)

The mockup has 12 deterministic instances, three families, 240 visible gameplay cards, and 1,536 aggregate gameplay triangles. It is a developer-only composed review proof, not an Atlas population run.

## Validation

Focused pack validation: **21 / 21 passed**.

The Steam Deck worker ran Blender `5.2.0 LTS` in background mode, completed all three candidates, and exited cleanly. Export inspection confirms each GLB has two materials and one texture.

## Honest visual gate

The gameplay-camera board confirms three distinct silhouettes and a lightweight card/trunk construction. It does **not** automatically prove that the shapes meet the final GrowGo art bar: the eucalyptus is sparse, and the rounded native and wind-shaped silhouette need operator assessment at intended map scale. Therefore none is final-approved or ready for Phillip Island population.

## Invariants

- Atlas architecture: unchanged.
- Production map population: unchanged.
- Existing eucalyptus V4 carcass: unchanged.
- V6 foliage artwork and atlas: unchanged.
- Existing registered runtime asset IDs: unchanged.
- No commit, push, or merge was performed.
