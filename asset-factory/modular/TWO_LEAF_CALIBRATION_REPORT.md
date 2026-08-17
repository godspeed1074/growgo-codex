# Two-Leaf Target-Specific Calibration

Status: **PASS — THREE-LEAF METHOD VALIDATION**

`LEAF_001` remains the previously approved central proof. This phase adds exactly two deliberately different front-only target proofs:

- `LEAF_005` — broad left-shoulder leaf
- `LEAF_007` — narrow, strongly angled far-left edge leaf

## Results

| Leaf | Selected candidate | Vertices | IoU | Centre | Width | Height | Tip | Angle | Direct vision | Generic |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| LEAF_001 | C28 | 28 | 0.9643 | 0.430 px | 0% | 0% | 0.500 px | 0.773° | PASS | NO |
| LEAF_005 | LEAF_005_BROAD_C28 | 28 | 0.9639 | 0.262 px | 0% | 0% | 0 px | 0° | PASS | NO |
| LEAF_007 | LEAF_007_NARROW_ANGLED_C64_BASE_TAPER_WIDTH | 64 | 0.9201 | 0.523 px | 0% | 0% | 0 px | 0° | PASS | NO |

`LEAF_007` required two bounded local corrections after the initial sweep: a one-pixel base-taper extension and a one-pixel shoulder-width correction. No generic leaf was substituted.

## Method gate

- Target-specific contour method: **GENERALIZES**
- Target-specific facet method: **GENERALIZES**
- All three silhouettes remain visibly different: **YES**
- Reference imagery in beauty renders: **NO**
- Reference plane in beauty renders: **NO**
- Other 23 leaves modified: **NO**
- Flowers modified: **NO**
- Planter modified: **NO**
- Depth or side work: **NO**
- Shop modified: **NO**
- Eucalyptus started: **NO**
- Anonymous geometry: `0`
- Mobile budget: **PASS**

Steam Deck execution passed with Blender `5.2.0 LTS`; all isolated candidate processes exited cleanly. The comparison board is evidence only; it does not authorize mass reconstruction.

## Evidence

- `PLANT_THREE_LEAF_METHOD_VALIDATION_BOARD.png`
- `TWO_LEAF_CALIBRATION_REPORT.json`
- `TWO_LEAF_CALIBRATION_SPEC_MANIFEST.json`

Recommended next step: operator-confirm this three-leaf board. Only after confirmation may the same method be applied to the remaining 23 observed leaves. Do not start depth or eucalyptus work.
