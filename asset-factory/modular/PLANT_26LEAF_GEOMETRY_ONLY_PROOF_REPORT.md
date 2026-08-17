# Critical Proof — 26 Independent Blender Leaves

Status: **BLOCKED**

## Explain like I’m 5

The leaves are real Blender meshes, not a hidden picture. Blender produced 26 separately named leaf objects, a real planter, and real flower geometry. The target-specific contour pass now uses 26 independently traced target contours, faceted materials, and a shallow backing ring inside each same-ID leaf mesh to restore dark overlap edges. The technical proof passes, but direct visual comparison still shows a simpler foliage read than the target, so the geometry authority lock remains blocked.

## Proof results

- Observed target leaves: **26**
- Independent Blender observed leaves: **26**
- Dominant leaves: **19**
- Secondary/occluded leaves: **7**
- Flower groups: **3**
- Flower geometry objects: **18 petals/centres**
- Planter geometry objects: **11**
- Reference imagery contributing to beauty render: **NO**
- Target foliage bake contributing to beauty render: **NO**
- Reference plane visible: **NO**
- Foliage composite used: **NO**
- Baked target foliage used: **NO**
- Anonymous geometry: **0**
- Blender: Steam Deck, **5.2.0 LTS**, clean exit **PASS**
- Mobile budget: **PASS**
- Target-specific contour records: **26**
- Beauty materials: **20 shared/faceted materials** (45 datablocks including ID-review materials)
- Shallow per-leaf backing rings: **26**, same leaf object IDs, no canopy object

Audit: [PLANT_FRONT_GEOMETRY_ONLY_PROOF.json](../../../test-output/plant-26leaf-geometry-only/PLANT_FRONT_GEOMETRY_ONLY_PROOF.json)

## Outputs

- Beauty: `test-output/plant-26leaf-geometry-only/PLANT_26LEAF_GEOMETRY_FRONT.png`
- Component IDs: `test-output/plant-26leaf-geometry-only/PLANT_26LEAF_COMPONENT_ID.png`
- Wireframe: `test-output/plant-26leaf-geometry-only/PLANT_26LEAF_WIREFRAME_FRONT.png`
- Blend: `test-output/plant-26leaf-geometry-only/PLANT_26LEAF_GEOMETRY_FRONT.blend`
- Board: [PLANT_26LEAF_GEOMETRY_AUTHORITY_BOARD.png](PLANT_26LEAF_GEOMETRY_AUTHORITY_BOARD.png)
- Metrics: `test-output/plant-26leaf-geometry-only/GEOMETRY_LEAF_METRICS.json`
- Fit report: [PLANT_PER_LEAF_FIT_REPORT.json](PLANT_PER_LEAF_FIT_REPORT.json)
- Contour report: [PLANT_PER_LEAF_CONTOUR_REPORT.json](PLANT_PER_LEAF_CONTOUR_REPORT.json)
- Front fidelity board: [PLANT_GEOMETRY_FRONT_FIDELITY_BOARD.png](PLANT_GEOMETRY_FRONT_FIDELITY_BOARD.png)

## Per-leaf landmark metrics

Measured from the projected standalone meshes:

- Mean dominant centre error: **0.393 px**
- Mean dominant width error: **0.320%**
- Mean dominant height error: **1.763%**
- Mean dominant tip error: **0.000 px**
- Mean dominant commanded angle error: **0.000°**
- Mean dominant projected tip-axis angle error: **4.189°**
- Worst dominant centre: **LEAF_010 — 0.944 px**
- Worst dominant width: **LEAF_006 — 4.839%**
- Worst dominant height: **LEAF_019 — 4.997%**
- Worst dominant projected tip-axis angle: **LEAF_007 — 13.200°**
- Mean all-leaf contour IoU: **0.658**
- Mean dominant-leaf contour IoU (19 leaves): **0.658**
- Lowest measured IoU: **0.177 — LEAF_019**
- Contour basis: target-mask convex hulls for independently rendered leaf meshes; no target pixels enter the Blender beauty render.

All measured landmark values are inside the requested dominant-leaf tolerances. That does not override the visual gate.

## Geometry-only visual gate

| Gate | Result |
|---|---|
| Overall likeness | **FAIL** |
| Tall centre leaf | PASS landmark / visual needs work |
| Upper-left composition | PASS landmark / visual needs work |
| Upper-right composition | PASS landmark / visual needs work |
| Left-middle | PASS landmark / visual needs work |
| Right-middle | PASS landmark / visual needs work |
| Centre-front | PASS landmark / visual needs work |
| Lower foliage | PASS landmark / visual needs work |
| Leaf scale distribution | PASS |
| Leaf pointedness | NEEDS_WORK |
| Colour hierarchy | NEEDS_WORK |
| Flowers | NEEDS_WORK |
| Planter | PASS TECHNICAL / NEEDS_WORK VISUALLY |

The geometry aligns the measured centres, sizes, tips, and commanded orientations, and the independent contour report is measurable. The backing rings improve overlap separation, but the direct front board still shows less tonal richness and simpler flower/leaf detail than the target. Those visual differences block approval even though the mesh and budget gates pass.

## Authority decision

- `PLANT_GEOMETRY_FRONT_AUTHORITY_LOCK_V1`: **NOT LOCKED**
- Depth inference performed: **NO**
- Ready for constrained 3D-depth phase: **NO**
- Shop modified: **NO**
- Eucalyptus started: **NO**

The earlier `PLANT_FRONT_AUTHORITY_LOCK_V2` remains a reference-front review lock only; it is not promoted to a geometry-only authority.

Next correction should target the standalone leaf contour/material treatment, flower geometry, and planter fidelity without adding depth or using reference pixels in the beauty render.
