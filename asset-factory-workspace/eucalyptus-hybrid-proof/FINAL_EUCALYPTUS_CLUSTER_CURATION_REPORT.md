# Eucalyptus Cluster-Art Curation — Final Gate

Status: `PARTIAL — VISUAL GATE NOT MET`.

The continuous V4 carcass and canopy-card placement were not changed. Eight existing source windows were inspected independently and recorded in `EUCALYPTUS_CLUSTER_CURATION_DECISIONS.json`; the intended primary composition was retained for each and disconnected pieces were classified as source debris. A new padded, non-overlapping atlas was built so card UVs cannot bleed between neighbouring source regions.

The real Steam Deck Blender 5.2.0 LTS validation completed cleanly, producing the alpha preflight, GLB exports, `.blend` files, and all review renders. The final visual review fails: rectangular card bounds and some prominent source fragments are still visible in the gameplay and close-canopy renders. Therefore this candidate is not `APPROVAL_READY`, no reconstruction contract is promoted, and no commit is made.

## Required visual gate

| Check | Result |
| --- | --- |
| Unexplained foliage fragments remain | YES |
| Card backgrounds/bounds visible | YES |
| Crop boundaries visible | YES |
| Organic carcass preserved | YES |
| Canopy depth preserved | YES |
| GrowGo visual style preserved | PARTIAL |

The next safe work is a source-art authoring pass that creates eight true isolated transparent card assets with their own authored silhouettes; it must not alter the accepted V4 carcass or canopy placement.
