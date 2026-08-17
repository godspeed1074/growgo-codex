# Sharp Leaf Art-Direction Correction

## BLOCKED

The new leaf family is directionally correct: pointed, tapered, folded, and genuinely 3D. The locked planter was preserved. However, the current compositions are too sparse in front and still produce repeated horizontal projections from the side, so they do not pass the hard side-view gate.

### Candidates

Three real Steam Deck Blender compositions were tested:

- SHARP_A — reference dense
- SHARP_B — clean papercut
- SHARP_C — volumetric reference

Candidate B was the clearest sharp-leaf proof, but it remains unapproved.

### Candidate B metrics

- Candidate: `GG-VEG-PLANTER-SHRUB-001@3.1.0`
- Sharp leaf variants: `SHARP-LARGE`, `SHARP-MEDIUM`, `SHARP-SMALL`
- Leaf instances: 50
- Flower instances: 4
- Triangles: see `test-output/plant-sharp/SHARP_B/RESULT.json`
- Materials: 8
- Anonymous geometry: 0
- Mobile budget: PASS
- Steam Deck Blender 5.2.0: PASS

### Vision gate

- Pointed leaf silhouette: PASS
- Golden Reference leaf likeness: PASS WITH NOTES
- Individual leaf readability: PASS
- Muddy foliage: NO
- Large blob masses: NO
- True 3D leaf depth: PASS
- Front silhouette: NEEDS_CORRECTION (too sparse versus reference)
- Left side: FAIL (repeated blade projections)
- Right side: FAIL (repeated blade projections)
- 3/4: NEEDS_CORRECTION
- Parallel blade artifact: YES
- Planter: PASS
- Flowers: PASS

Evidence board: [PLANT_SHARP_LEAF_ART_DIRECTION_BOARD.png](../../../test-output/PLANT_SHARP_LEAF_ART_DIRECTION_BOARD.png)

The shop was not modified, the planter was not redesigned, no production assets were changed, and eucalyptus work did not start. Do not promote `@3.1.0` or integrate it into the shop yet.

Next controlled step: keep the sharp leaf mesh family, increase front density with shorter radial leaves, and eliminate side-facing repeated projections before another integration attempt.
