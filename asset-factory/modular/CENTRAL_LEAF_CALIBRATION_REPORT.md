# Central Target Leaf Calibration

Status: **PASS — ISOLATED LEAF ONLY**

This proof calibrates only `LEAF_001` (`TALLEST_CENTRE`). The other 25 leaves, all flowers, the planter, the shop, and eucalyptus were not edited.

## What was tested

- Authoritative reference: `CENTRAL_TARGET_LEAF_REFERENCE.png`
- Isolated mask: `CENTRAL_TARGET_LEAF_VISIBLE_MASK.png`
- Contour candidates: 8, 10, 12, 16, 20, 24, 28, 32 vertices
- Additional target-specific candidates: closed RDP traces, partition hull, and a bounded 24/28/32-vertex local shoulder/base sweep
- Selected contour: `TARGET_SPECIFIC_OCCLUSION_CLEANED_TRACE`, 28 vertices, best rendered target IoU `0.9643` (28 and 32 tie; 28 uses fewer vertices)
- Blender: Steam Deck `flatpak run org.blender.Blender`, Blender `5.2.0 LTS`
- Beauty renders contain no target texture and no visible reference plane

## Gate result

The Steam Deck proof completed and exited cleanly. The isolated mesh has a locked front contour, internal ridge-only depth, and no changes to other plant components.

The final micro-calibration passes the cleaned target-specific mask: rendered geometry IoU `0.9643`, centre error `0.430 px`, width error `0%`, height error `0%`, tip error `0.500 px`, and angle error `0.773°`. The raw partition mask remains separately recorded at `0.9117` because it contains neighboring pixels at the occluded base; it is not used as the leaf's clean visible boundary. The target-specific trace's raw-partition audit score is `0.9114`; the clean visible mask and rendered component-ID mask are the pass source.

Direct review passes for the overall leaf, tip, both shoulders, base taper, asymmetry, ridge/facets, and papercut character. Generic-leaf appearance is **NO**.

`PLANT_TARGET_SPECIFIC_LEAF_RECONSTRUCTION_METHOD_V1` was not created, and no other leaves were generalized from this candidate. This response stops at the isolated proof as required.

## Evidence

- [CENTRAL_LEAF_EXACT_RECONSTRUCTION_BOARD.png](./CENTRAL_LEAF_EXACT_RECONSTRUCTION_BOARD.png)
- [LEAF_001_FINAL_CALIBRATION_BOARD.png](./LEAF_001_FINAL_CALIBRATION_BOARD.png)
- [CENTRAL_LEAF_CALIBRATION_REPORT.json](./CENTRAL_LEAF_CALIBRATION_REPORT.json)
- [CENTRAL_TARGET_LEAF_CONTOUR.json](./CENTRAL_TARGET_LEAF_CONTOUR.json)

Recommended next step: operator-confirm this isolated `LEAF_001` board, then (only if approved) test the same measured front-contour method on two additional leaves. Do not generalize automatically.
