# Camera-First Tree Pack V2

Status: **PARTIAL — HUMAN REVIEW REQUIRED**

## What changed

- The isolated V1 board was replaced by real Steam Deck gameplay-scale, portrait mobile-scale, and mass-placement Blender scenes.
- Each crown now uses 4–7 dominant canopy masses and three overlapping camera-facing card layers at Close and Gameplay LODs.
- Gameplay card density increased from 20 cards per asset to 54 cards for eucalyptus/wind and 63 cards for the rounded native. Map LOD remains one card per mass.
- The scene includes a road and intentionally simple developer-only shop shells. It does not use, modify, or register a production map asset.

## Evidence

- [In-game-scale review](./output/GROWGO_TREE_PACK_V2_IN_GAME_SCALE_REVIEW.png)
- [Portrait mobile-scale review](./output/GROWGO_TREE_PACK_V2_MOBILE_SCALE_REVIEW.png)
- [Deterministic mass-placement review](./output/GROWGO_TREE_PACK_V2_MASS_PLACEMENT_REVIEW.png)
- [Steam Deck receipt](./output/TREE_PACK_RECEIPT.json)

## Honest visual gate

| Gate | Result |
| --- | --- |
| Substantial tree at gameplay scale | YES — materially fuller than V1 |
| Foliage dominates bare branches | YES |
| Distinct family silhouettes | YES |
| Lightweight LOD construction | YES — cards and triangles remain low |
| Convincing 3D from locked camera | NEEDS HUMAN REVIEW |
| Obvious flat-card/twig artifacts | **NO PASS** — repeated brown branchlet tips remain visible in canopy cards |
| Works beside shop shells | NEEDS HUMAN REVIEW |
| Final approval | **NO — all remain REVIEW_CANDIDATE** |

The V6 source atlas remains unmodified. The residual twig artifacts are caused by its visible branchlet pixels in the sampled cluster regions. This V2 result establishes that stronger camera-facing overlap solves the sparse-tree failure, but the card-art/crop treatment must be refined before production approval.

## Invariants

- `GROWGO_VEGETATION_GAMEPLAY_CAMERA_CONTRACT` unchanged.
- Atlas architecture and registry unchanged.
- No Phillip Island population run.
- No Paperbark, Moonah, Banksia, or Cypress work started.
- Steam Deck Blender: `5.2.0 LTS`.
