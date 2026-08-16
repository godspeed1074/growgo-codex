# Critical Proof — 26 Independent Blender Leaves

Status: **BLOCKED**

## Explain like I’m 5

The leaves are now real Blender meshes, not a hidden picture. Blender produced 26 separately named leaf objects, a real planter, and real flower geometry. That technical proof passes. The standalone geometry is still too simplified to be accepted as the final visual front, so the geometry authority lock has not been issued.

## Proof results

- Observed target leaves: **26**
- Independent Blender observed leaves: **26**
- Dominant leaves: **19**
- Secondary/occluded leaves: **7**
- Flower groups: **3**
- Flower geometry objects: **18 petals/centres**
- Planter geometry objects: **9**
- Reference imagery contributing to beauty render: **NO**
- Target foliage bake contributing to beauty render: **NO**
- Reference plane visible: **NO**
- Foliage composite used: **NO**
- Baked target foliage used: **NO**
- Anonymous geometry: **0**
- Blender: Steam Deck, **5.2.0 LTS**, clean exit **PASS**
- Mobile budget: **PASS**

Audit: [PLANT_FRONT_GEOMETRY_ONLY_PROOF.json](../../../test-output/plant-26leaf-geometry-only/PLANT_FRONT_GEOMETRY_ONLY_PROOF.json)

## Outputs

- Beauty: `test-output/plant-26leaf-geometry-only/PLANT_26LEAF_GEOMETRY_FRONT.png`
- Component IDs: `test-output/plant-26leaf-geometry-only/PLANT_26LEAF_COMPONENT_ID.png`
- Wireframe: `test-output/plant-26leaf-geometry-only/PLANT_26LEAF_WIREFRAME_FRONT.png`
- Blend: `test-output/plant-26leaf-geometry-only/PLANT_26LEAF_GEOMETRY_FRONT.blend`
- Board: [PLANT_26LEAF_GEOMETRY_AUTHORITY_BOARD.png](PLANT_26LEAF_GEOMETRY_AUTHORITY_BOARD.png)
- Metrics: `test-output/plant-26leaf-geometry-only/GEOMETRY_LEAF_METRICS.json`
- Fit report: [PLANT_PER_LEAF_FIT_REPORT.json](PLANT_PER_LEAF_FIT_REPORT.json)

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
- Silhouette overlap: **not claimed**; no independent contour segmentation was fabricated.

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
| Planter | NEEDS_WORK |

The geometry aligns the measured centres, sizes, tips, and commanded orientations, but the flat standalone contours/material response do not yet reproduce the reference’s richer leaf shape, overlap shading, flower appearance, or planter finish closely enough.

## Authority decision

- `PLANT_GEOMETRY_FRONT_AUTHORITY_LOCK_V1`: **NOT LOCKED**
- Depth inference performed: **NO**
- Ready for constrained 3D-depth phase: **NO**
- Shop modified: **NO**
- Eucalyptus started: **NO**

The earlier `PLANT_FRONT_AUTHORITY_LOCK_V2` remains a reference-front review lock only; it is not promoted to a geometry-only authority.

Next correction should target the standalone leaf contour/material treatment, flower geometry, and planter fidelity without adding depth or using reference pixels in the beauty render.
