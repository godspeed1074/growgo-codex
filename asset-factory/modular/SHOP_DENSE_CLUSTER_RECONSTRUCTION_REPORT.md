# Dense Sharp-Leaf Cluster Reconstruction

## BLOCKED

The visible tall-stem architecture was removed and the foliage was rebuilt from compact radial clusters. The planter and sharp folded leaf family were preserved. The whole shrub is still not ready: the front remains too sparse compared with the Golden Reference and the extreme side views still produce a repeated shelf-like projection pattern.

### Candidates tested

- `CLUSTER_A` — Golden Dense
- `CLUSTER_B` — Balanced 3D
- `CLUSTER_C` — Full Volumetric

Each uses 11 spatial clusters, six leaves per cluster, hidden short anchors, and four shallow 3D flowers.

### Best candidate metrics (B)

- Candidate: `GG-VEG-PLANTER-SHRUB-001@3.2.0`
- Cluster archetypes: 5
- Leaf instances: 66
- Flower instances: 4
- Visible long stems: NO
- Materials: 8
- Anonymous geometry: 0
- Mobile budget: PASS
- Steam Deck Blender 5.2.0: PASS

### Vision gate

- Sharp leaves preserved: PASS
- Hidden/short stems: PASS
- Individual leaf readability: PASS
- Front density: NEEDS_CORRECTION
- Front likeness: NEEDS_CORRECTION
- Left volume: FAIL (shelf projections remain)
- Right volume: FAIL (shelf projections remain)
- 3/4 volume: PASS WITH NOTES
- Top volume: PASS WITH NOTES
- Horizontal blade pattern: YES
- Muddy blob: NO
- Planter: PASS
- Flowers integrated: PASS
- Full-shop integration: NOT RUN
- Known-good: NO

Review board: [PLANT_DENSE_SHARP_3D_REVIEW_BOARD.png](../../../test-output/PLANT_DENSE_SHARP_3D_REVIEW_BOARD.png)

The shop, facade, recipe, camera, Atlas, production assets, and eucalyptus scope were untouched. Next work must remain plant-only: increase front fullness with shorter radial cluster leaves and change the side-facing leaf presentation so the side silhouette is diagonal/overlapping rather than a stack of parallel shelves.
