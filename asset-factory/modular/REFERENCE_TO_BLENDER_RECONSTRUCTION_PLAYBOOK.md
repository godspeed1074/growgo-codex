# Reference-to-Blender Reconstruction Playbook

## Governing rule

Observed pixels are constraints. Hidden geometry is inference. Never sacrifice observed constraints to improve inferred geometry.

## Fast, repeatable workflow

1. Crop and checksum the supplied reference. Preserve it unchanged.
2. Establish a locked orthographic front camera before modelling.
3. Trace only the visible high-value forms first: silhouette, major layer boundaries, and readable accents.
4. Give each observed form a stable semantic identity (`LEAF_001`, `PLANTER_RIM`, `FLOWER_GROUP_LEFT_PRIMARY`, and so on).
5. Render the front and compare it against the crop. Freeze it only after the measurable front gate passes.
6. Make depth a separate, non-destructive stage. Keep every observed front projection fixed; infer only rear depth, folds, and invisible support.
7. Use a direct orbit around the authored vertical axis. Test front, ±15°, and ±30° before claiming a 3D presentation result.
8. Produce a versioned `.blend`, evidence renders, component map, and review board. Do not overwrite the frozen source.

## Camera safeguard

For this plant source, Blender axes are explicit: X is image horizontal, Y is image vertical, and Z is hidden depth. A direct Y-axis orthographic orbit preserves screen-up. Do not remap those axes or use a tracking quaternion until a camera calibration image proves no roll; both previously produced a false tall/floating planter failure.

## Acceptance gates

- Exact locked-front checksum remains unchanged.
- Visible components retain stable IDs.
- Plant-to-planter anchor remains intact at all review angles.
- Four deterministic review views exist.
- Side presentation does not introduce a second planter, helper geometry, or a silhouette regression.
- Any result that passes mechanics but fails visual review remains unapproved.

## Asset-specific result

`GG-VEG-PLANTER-SHRUB-001_FRONT_AUTHORITY_2_5D_1.0.0.blend` is a camera-authoritative 2.5D Blender asset. The source front contains the observed leaf/flower geometry; its shallow physical planter is reusable. The side imagery is deliberately a presentation derivative because the source image provides no evidence for botanical backside geometry.
