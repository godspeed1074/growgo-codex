# Exact Per-Leaf Contour + Tonal Reconstruction — Front Fidelity Gate

Status: **BLOCKED**

## Explain like I’m 5

We measured each of the 26 visible leaves from the reference and made 26 separate Blender leaf meshes. Blender rendered them without using the reference picture as a texture. The outlines are measurable, but the plant still has too many white gaps and not enough of the target’s layered green tone, so it is not approved yet.

## Evidence

- Reference checksum: `4a0bd6fb6eb6aaf8e835dededc004e48c3c459d9824eaf4d3b51a1aba150aacf`
- Target crops/masks: `PLANT_TARGET_LEAF_001.png` … `PLANT_TARGET_LEAF_026.png`
- Target contour specification: [PLANT_TARGET_LEAF_CONTOURS.json](PLANT_TARGET_LEAF_CONTOURS.json)
- 26-leaf target atlas: [PLANT_26_LEAF_TARGET_ATLAS.png](PLANT_26_LEAF_TARGET_ATLAS.png)
- Blender beauty: `/Users/michaelpeterson/.codex/.chatgpt-projects/g-p-6863f0a29ae08191b7d09cf52fb8aa46/test-output/plant-26leaf-geometry-only/PLANT_26LEAF_GEOMETRY_FRONT.png`
- Component IDs: `/Users/michaelpeterson/.codex/.chatgpt-projects/g-p-6863f0a29ae08191b7d09cf52fb8aa46/test-output/plant-26leaf-geometry-only/PLANT_26LEAF_COMPONENT_ID.png`
- Required 13-panel board: [PLANT_GEOMETRY_FRONT_FIDELITY_BOARD.png](PLANT_GEOMETRY_FRONT_FIDELITY_BOARD.png)

## Per-leaf contour result

| Measure | Result |
|---|---:|
| Independent visible leaves | 26 |
| Dominant leaves | 19 |
| Secondary/occluded leaves | 7 |
| Mean all-leaf IoU | 0.658 |
| Mean dominant-leaf IoU | 0.658 |
| Lowest leaf IoU | 0.177 (LEAF_019) |
| Contour status | BLOCKED_TARGET_CONTOUR_OVERLAP |

The per-leaf landmarks remain within the measured transform tolerances. IoU is reported from the projected Blender mesh polygons against the independently generated target masks; it is not a visual score substitute.

## Direct visual result

- Front silhouette: **NEEDS_CORRECTION** — outer envelope is close, but the interior foliage occupancy is visibly too sparse.
- Dominant central/tall leaf: **PASS landmark / NEEDS_CORRECTION visual** — position is correct; tonal edge and layered overlap are weaker.
- Leaf contour character: **NEEDS_CORRECTION** — the same-ID backing rings improve overlap edges, but several contours still read as broad flat cutouts rather than the target’s hand-shaped lobes.
- Tonal reconstruction: **NEEDS_CORRECTION** — family values exist, but the front lacks the target’s light/dark leaf separation.
- Flowers: **NEEDS_CORRECTION** — real geometry exists, but the clusters remain too symbolic.
- Planter: **PASS technical / NEEDS_CORRECTION visual** — real layered planter geometry is present, but front panel and rim shading are flatter than the target.
- Geometry-only compliance: **PASS** — no reference texture, reference plane, foliage composite, or target bake enters the beauty render.
- Anonymous geometry: **0**
- Depth/sides/shop/eucalyptus: **NOT STARTED**

## Authority decision

`PLANT_GEOMETRY_FRONT_AUTHORITY_LOCK_V1`: **NOT CREATED**

The front is not yet a direct visual pass. No depth inference may begin until the foliage occupancy, per-leaf contour character, tonal separation, flower geometry, and planter front all pass the operator board.

## Next bounded correction

Keep the same 26 IDs and camera. Correct only the front geometry/material presentation: recover the observed interior foliage occupancy from the target masks, preserve each measured tip/centre, increase restrained leaf-family contrast, and refine the three flower clusters and planter front. Then rerun the same board and contour report. Do not change depth, shop assembly, Atlas, or eucalyptus.
