# Central Target Leaf Calibration

Status: **BLOCKED**

This proof calibrates only `LEAF_001` (`TALLEST_CENTRE`). The other 25 leaves, all flowers, the planter, the shop, and eucalyptus were not edited.

## What was tested

- Authoritative reference: `CENTRAL_TARGET_LEAF_REFERENCE.png`
- Isolated mask: `CENTRAL_TARGET_LEAF_VISIBLE_MASK.png`
- Contour candidates: 8, 10, 12, 16, 20, 24, 32 vertices
- Additional target-specific candidates: closed RDP traces, partition hull, and a 22-vertex occlusion-cleaned trace
- Selected contour: `TARGET_SPECIFIC_OCCLUSION_CLEANED_TRACE`, 22 vertices, target contour IoU `0.9264`
- Blender: Steam Deck `flatpak run org.blender.Blender`, Blender `5.2.0 LTS`
- Beauty renders contain no target texture and no visible reference plane

## Gate result

The Steam Deck proof completed and exited cleanly. The isolated mesh has a locked front contour, internal ridge-only depth, and no changes to other plant components.

The calibration remains blocked because the rendered component-ID mask is `0.9050` IoU against the current conservative visible mask, below the required `0.92`. Width error is `4.348%` against the mask, also above the `3%` gate. Direct review still finds a generic-leaf appearance: the shoulders, asymmetry, and occluded base do not yet match the target closely enough.

The target-specific contour score is useful evidence, but it is not a substitute for the rendered gate. `PLANT_TARGET_SPECIFIC_LEAF_RECONSTRUCTION_METHOD_V1` was not created, and no other leaves were generalized from this candidate.

## Evidence

- [CENTRAL_LEAF_EXACT_RECONSTRUCTION_BOARD.png](./CENTRAL_LEAF_EXACT_RECONSTRUCTION_BOARD.png)
- [CENTRAL_LEAF_CALIBRATION_REPORT.json](./CENTRAL_LEAF_CALIBRATION_REPORT.json)
- [CENTRAL_TARGET_LEAF_CONTOUR.json](./CENTRAL_TARGET_LEAF_CONTOUR.json)

Recommended next step: refine the true visible-edge mask/contour for `LEAF_001` only, then rerun the isolated Steam Deck proof until both the rendered numeric gates and direct visual gate pass.
