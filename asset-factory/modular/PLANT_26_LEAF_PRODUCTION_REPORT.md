# 26-Leaf Target-Specific Production Report

**Status:** BLOCKED_26_LEAF_TARGET_SPECIFIC_FRONT_REBUILD

## Explain like I’m 5

We measured each visible leaf in the supplied picture and built each leaf separately in Blender on the Steam Deck. Three proven leaves stayed locked. The machine checks show that most leaves are close, but two dominant leaves still miss the required shape gate, so the foliage authority lock is intentionally withheld.

## Scope and safety

- Steam Deck Blender: 5.2.0 LTS — PASS
- Beauty render uses geometry only; no reference texture or visible reference plane — PASS
- Flowers and planter are temporary proof fixtures only; no depth/side work — PASS
- Shop, recipes, Atlas, live map, Golden Reference, and eucalyptus are unchanged
- Anonymous geometry: 0
- Mobile budget: PASS

## Aggregate gates

- Remaining leaves rebuilt: 23
- Total leaves passing: 18/26
- Dominant leaves passing: 11/19
- Secondary observed regions passing: 7/7
- Mean dominant IoU: 0.93
- Median dominant IoU: 0.9296
- Minimum dominant IoU: LEAF_011 = 0.893
- Dominant leaves below .90: LEAF_004, LEAF_011
- Full foliage bounds target/actual: {"x0":17,"y0":31,"x1":164,"y1":167,"width":148,"height":137,"area":9911} / {"x0":4,"y0":31,"x1":177,"y1":169,"width":174,"height":139,"area":9687}
- Full foliage occupancy target/actual: 0.2009 / 0.1964
- Overall foliage-mask IoU: 0.891

## Per-leaf result

| Leaf | Candidate | IoU | Centre px | W % | H % | Tip px | Angle ° | Gate |
|---|---|---:|---:|---:|---:|---:|---:|---|
| LEAF_001 | LEAF_001_PROTECTED_C28 | 0.9643 | 0.43 | 0 | 0 | 0.5 | 0.773 | PASS |
| LEAF_002 | LEAF_002_DOMINANT_C28 | 0.9427 | 0.306 | 0 | 0 | 1 | 1.563 | PASS |
| LEAF_003 | LEAF_003_DOMINANT_RASTER_MASK | 0.9311 | 0.414 | 0 | 2.778 | 0.5 | 5.342 | FAIL |
| LEAF_004 | LEAF_004_DOMINANT_RASTER_MASK | 0.898 | 0.547 | 0 | 3.571 | 0 | 0.041 | FAIL |
| LEAF_005 | LEAF_005_PROTECTED_BROAD_C28 | 0.9639 | 0.262 | 0 | 0 | 0 | 0 | PASS |
| LEAF_006 | LEAF_006_DOMINANT_C32 | 0.9299 | 0.482 | 0 | 0 | 0.007 | 0.018 | PASS |
| LEAF_007 | LEAF_007_PROTECTED_NARROW_C64_BASE_TAPER_WIDTH | 0.9201 | 0.523 | 0 | 0 | 0 | 0 | PASS |
| LEAF_008 | LEAF_008_DOMINANT_RASTER_MASK_OM0P25 | 0.924 | 0.739 | 0 | 2.857 | 1 | 0.579 | PASS |
| LEAF_009 | LEAF_009_DOMINANT_C40 | 0.921 | 0.481 | 0 | 2.5 | 0.5 | 0.695 | PASS |
| LEAF_010 | LEAF_010_DOMINANT_C28 | 0.956 | 0.542 | 0 | 2.778 | 0 | 0.966 | PASS |
| LEAF_011 | LEAF_011_DOMINANT_RASTER_MASK | 0.893 | 0.391 | 0 | 0 | 0.5 | 0.976 | FAIL |
| LEAF_012 | LEAF_012_DOMINANT_C64 | 0.9344 | 0.574 | 0 | 0 | 0 | 0 | PASS |
| LEAF_013 | LEAF_013_DOMINANT_C16 | 0.9267 | 0.291 | 0 | 2.941 | 0.5 | 0.381 | PASS |
| LEAF_014 | LEAF_014_DOMINANT_C32 | 0.9454 | 0.594 | 0 | 2.632 | 0.5 | 0.796 | PASS |
| LEAF_015 | LEAF_015_DOMINANT_RASTER_MASK | 0.9593 | 0.442 | 0 | 3.333 | 0.5 | 1.089 | FAIL |
| LEAF_016 | LEAF_016_DOMINANT_RASTER_MASK | 0.9296 | 0.422 | 0 | 3.125 | 0.429 | 1.045 | FAIL |
| LEAF_017 | LEAF_017_DOMINANT_RASTER_MASK | 0.9151 | 0.309 | 0 | 0 | 0.5 | 8.925 | FAIL |
| LEAF_018 | LEAF_018_DOMINANT_RASTER_MASK | 0.902 | 0.258 | 0 | 0 | 0.5 | 1.897 | FAIL |
| LEAF_019 | LEAF_019_DOMINANT_RASTER_MASK | 0.9136 | 0.271 | 0 | 0 | 0.5 | 2.44 | FAIL |
| LEAF_020 | LEAF_020_SECONDARY_C28 | 0.9599 | 0.215 | 0 | 0 | 0.615 | 2.689 | PASS |
| LEAF_021 | LEAF_021_SECONDARY_RASTER_MASK | 0.9308 | 0.253 | 3.226 | 0 | 0.417 | 0.823 | PASS |
| LEAF_022 | LEAF_022_SECONDARY_C32 | 0.9309 | 0.388 | 0 | 0 | 0.5 | 2.42 | PASS |
| LEAF_023 | LEAF_023_SECONDARY_C28 | 0.9754 | 0.115 | 0 | 0 | 0 | 2.571 | PASS |
| LEAF_024 | LEAF_024_SECONDARY_C48 | 0.9535 | 0.236 | 0 | 0 | 0.5 | 0 | PASS |
| LEAF_025 | LEAF_025_SECONDARY_C28 | 0.9917 | 0.049 | 0 | 0 | 0 | 0 | PASS |
| LEAF_026 | LEAF_026_SECONDARY_RASTER_MASK | 0.9761 | 0.181 | 0 | 0 | 0 | 0 | PASS |

## Protected calibration leaves

- LEAF_001 — protected central calibration — PASS
- LEAF_005 — protected broad shoulder calibration — PASS
- LEAF_007 — protected narrow angled calibration — PASS

## Full front evidence

- [Target-specific review board](./PLANT_26LEAF_TARGETSPECIFIC_REVIEW_BOARD.png)
- Geometry-only beauty: `test-output/plant-26-leaf-production/full/PLANT_26LEAF_TARGETSPECIFIC_FRONT.png`
- Component-ID render: `test-output/plant-26-leaf-production/full/PLANT_26LEAF_TARGETSPECIFIC_COMPONENT_ID.png`
- Wireframe: `test-output/plant-26-leaf-production/full/PLANT_26LEAF_TARGETSPECIFIC_WIREFRAME_FRONT.png`
- Blend proof: `test-output/plant-26-leaf-production/full/PLANT_26LEAF_TARGETSPECIFIC_FRONT.blend`

## Decision

**BLOCKED — do not create `PLANT_FOLIAGE_GEOMETRY_FRONT_AUTHORITY_LOCK_V1`.** The hard front gate remains open because LEAF_004 and LEAF_011 are below the .90 floor, and the full foliage mask IoU is below the requested production threshold. This phase must not proceed to flowers, final planter/depth, side views, shop integration, or eucalyptus.

## Safe to commit

**YES — additive blocked evidence only.** The new specs, audits, renders, and tests are isolated; no production assets or protected references were modified.

