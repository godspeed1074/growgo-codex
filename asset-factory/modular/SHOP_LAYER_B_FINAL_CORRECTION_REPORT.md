# Layer B Shop Final Controlled Correction

Status: **NEEDS_CORRECTION**

This was the single approved correction iteration. It ran through the real Steam Deck worker using `flatpak run org.blender.Blender`. No new geometry, modules, recipe identity, Golden Reference, camera contract, Atlas, live map, or production asset was changed.

## Before

- Materials: **139** in the original assembled build; **46** after the prior LOD/palette correction.
- Objects: **124** original; **31** after the prior correction.
- Triangles: **1,488**.
- Vertices: **992**.
- Visual issues: weak fascia/sign hierarchy, weak awning projection, weak window/door readability, weak planter relationship, and an overall low-contrast silhouette.

## After

- Materials: **7** (`GG_MAT_WALL_WARM_BROWN_001`, `GG_MAT_FASCIA_NAVY_001`, `GG_MAT_AWNING_PLUM_001`, `GG_MAT_GLASS_TEAL_001`, `GG_MAT_TRIM_CREAM_001`, `GG_MAT_FOUNDATION_GRAY_001`, `GG_MAT_VEGETATION_GREEN_001`).
- Objects: **31**.
- Triangles: **1,488**.
- Vertices: **992**.
- Anonymous geometry: **0**.
- File size: **149,606 bytes**.
- Recipe: unchanged (`GG-REC-BLD-SIMPLE-SHOP-GROWGO-001@1.0.0`).
- Blender: Steam Deck / Blender **5.2.0 LTS**.
- Component-ID map: all required aliases present (WALL, DOOR, WINDOW, AWNING, FASCIA, SIGN, TRIM, FOUNDATION, PLANTER, SHRUB).
- Four-side outputs: generated as `SHOP_FINAL_FRONT.png`, `SHOP_FINAL_BACK.png`, `SHOP_FINAL_LEFT.png`, `SHOP_FINAL_RIGHT.png`, and `SHOP_FINAL_FOUR_SIDE_BOARD.png`.

## Decision

The material budget passes (`7 <= 32`) and module/component identity gates pass. The render remains **NEEDS_CORRECTION** on visual review: the facade is still too flat and low contrast compared with the approved reference, and the storefront hierarchy is not yet operator-approvable. No `KNOWN_GOOD_BUILD_ID` was assigned.

The one-iteration limit is exhausted; do not start another broad correction loop. Further work requires a new operator-approved phase with a narrowly scoped visual decision.
