# Next Camera-Authored Tree Families — Review Report

State: **REVIEW_CANDIDATE — HUMAN VISUAL APPROVAL REQUIRED**

## Locked method

Both candidates use `GROWGO_CAMERA_AUTHORED_ILLUSTRATED_FOLIAGE_CLUSTER_METHOD@1.0.0`: a lightweight structural trunk plus approved rich illustrated raster foliage cards, authored for `GROWGO_VEGETATION_GAMEPLAY_CAMERA_CONTRACT@1.0.0`.

## Coastal Eucalyptus 002

- Runtime ID/version: `TREE_EUCALYPTUS_COASTAL_002@2.0.0`
- Form: taller, open asymmetric eucalyptus with visible trunk/branch gaps.
- Source-art review: `next-family-rich-output/TREE_EUCALYPTUS_COASTAL_002_RICH_SOURCE_REVIEW.png`
- Gameplay review: `next-family-rich-output/worker-output/TREE_EUCALYPTUS_COASTAL_002_GROWGO_GAMEPLAY_CAMERA_REVIEW.png`
- LOD: Close 12 cards / 144 triangles; Gameplay 8 / 136; Map 3 / 126.
- Materials/textures: 2 / 1 shared rich foliage atlas; approximate ten-instance gameplay geometry: 80 cards, 1,360 triangles, one shared foliage texture.

## Coastal Wind 001

- Runtime ID/version: `TREE_COASTAL_WIND_001@2.0.0`
- Form: lower, wider, deliberately wind-driven lateral crown.
- Source-art review: `next-family-rich-output/TREE_COASTAL_WIND_001_RICH_SOURCE_REVIEW.png`
- Gameplay review: `next-family-rich-output/worker-output/TREE_COASTAL_WIND_001_GROWGO_GAMEPLAY_CAMERA_REVIEW.png`
- LOD: Close 12 cards / 144 triangles; Gameplay 8 / 136; Map 3 / 126.
- Materials/textures: 2 / 1. Coastal Wind uses an approved connected-component extraction of the rich source to prevent detached alpha fragments; it does not redraw or simplify the foliage artwork.

## Shared validation

- Real worker: Steam Deck Blender 5.2.0 LTS.
- Rich illustrated raster foliage: PASS.
- Procedural polygon foliage at Close/Gameplay: NOT USED.
- Anonymous geometry: 0.
- Deterministic variation: mirror, bounded scale, bounded yaw, and BASE/COOL/WARM/LIGHT are recorded for both candidates.
- Atlas architecture modified: NO.
- Production Atlas enabled: NO.
- Focused validation: 37/37 PASS.

## Human review package

- Combined context: `next-family-rich-output/worker-output/GROWGO_APPROVED_TREE_METHOD_NEXT_FAMILIES_CONTEXT.png`
- Mobile: `next-family-rich-output/worker-output/GROWGO_NEXT_TREE_FAMILIES_MOBILE_REVIEW.png`
- Mass variation: `next-family-rich-output/worker-output/GROWGO_TREE_FAMILY_MASS_VARIATION_REVIEW.png`

No Paperbark, Moonah, Banksia, or Monterey Cypress work is included.
