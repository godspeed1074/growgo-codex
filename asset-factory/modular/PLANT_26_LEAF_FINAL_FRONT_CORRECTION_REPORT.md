# Final Front-Foliage Correction Report

## Status

**BLOCKED — numeric leaf gate passes, direct visual shrub gate does not.**

## Explain like I’m 5

We measured every visible leaf and corrected the two named blockers plus the six additional dominant leaves that were not actually passing. In isolated Blender renders all 19 dominant leaves now match their measured front masks. When assembled, the shrub is still visibly sparser and flatter than the target because dark-green transition areas between the measured visible masks remain uncovered. The safe result is to stop before flowers, planter, depth, or shop work.

## Leaf correction

- LEAF_004: before IoU 0.898; after IoU 1; local projection calibration; PASS
- LEAF_011: before IoU 0.893; after IoU 1; local projection calibration; PASS
- Other corrected dominant leaves: LEAF_003, LEAF_015, LEAF_016, LEAF_017, LEAF_018, LEAF_019; isolated IoU 1.000; PASS
- Dominant leaves: 19 total; full PASS 19; occlusion-qualified PASS 0; FAIL 0
- Secondary visible regions: 7/7 PASS
- Mean dominant IoU: before 0.9300; after 0.9647
- Minimum dominant IoU: LEAF_007 = 0.9201

## Full assembled front

- Overall foliage-mask IoU: before 0.8910; after 0.9088
- Foliage bounds target/actual: {"x0":17,"y0":31,"x1":164,"y1":167,"width":148,"height":137,"area":9911} / {"x0":4,"y0":31,"x1":177,"y1":169,"width":174,"height":139,"area":9784}
- Occupancy target/actual: 0.2009 / 0.1983
- Reference imagery in beauty: NO
- Geometry-only: YES
- Direct Vision SAME SHRUB: NO
- Generic/procedural appearance: YES — remaining sparse transition gaps and flat tonal read
- Remaining visual mismatch IDs/regions: LEAF_017, LEAF_018, LEAF_019 and unmapped dark-green transition areas

## Evidence

- Authority board: PLANT_26LEAF_FINAL_AUTHORITY_REVIEW_BOARD.png
- 19-leaf status: PLANT_19_DOMINANT_LEAF_FINAL_STATUS.json
- Geometry-only beauty: test-output/plant-26-leaf-production/full/PLANT_26LEAF_TARGETSPECIFIC_FRONT.png
- Component-ID render: test-output/plant-26-leaf-production/full/PLANT_26LEAF_TARGETSPECIFIC_COMPONENT_ID.png
- Wireframe: test-output/plant-26-leaf-production/full/PLANT_26LEAF_TARGETSPECIFIC_WIREFRAME_FRONT.png

## Authority decision

PLANT_FOLIAGE_GEOMETRY_FRONT_AUTHORITY_LOCK_V1: NOT LOCKED. Numeric gates pass, but direct visual review fails the same-shrub requirement. Flowers: NOT STARTED. Planter: NOT STARTED. Depth: NOT STARTED. Shop: UNCHANGED. Eucalyptus: NOT STARTED.

## Worker and safety

- Steam Deck Blender 5.2.0 LTS: PASS
- Anonymous geometry: 0
- Mobile budget: PASS
- Camera: locked
- Protected leaves 001/005/007: unchanged
- Safe to commit: YES — additive blocked evidence only
