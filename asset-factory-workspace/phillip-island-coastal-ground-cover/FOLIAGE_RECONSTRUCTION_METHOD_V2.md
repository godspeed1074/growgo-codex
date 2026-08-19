# GrowGo Foliage Reconstruction Method V2

## Authority

Observed front-reference pixels are constraints. Hidden depth is inference and must not materially change the approved gameplay/front silhouette.

## Construction rule

Use a small library of shaped papercut meshes rather than generic cones, capsules, cylinders, or triangular spikes. Each visible foliage piece has a designed base width, curved outer edges, and a tapered tip.

## Layer order

1. Low, broad foreground leaves establish the footprint.
2. Outer curved leaves establish the silhouette.
3. A dense middle layer hides blade bases and avoids row-like gaps.
4. Varied rear blades establish the crown.
5. Accent foliage and seed/flower cards create the reference colour rhythm.

Use fixed shallow front/middle/rear offsets. Lower LODs may remove invisible card sidewalls, but must preserve the primary camera silhouette.

## Review rule

Every candidate needs a front gameplay render, four-side review, reference comparison board, explicit material/LOD statistics, and human approval. A technical pass never overrides visual rejection.

## Initial proof

`GG-VEG-GRASS-COASTAL-TUFT-001@2.0.0` is the first review-only V2 proof. It does not approve or register any coastal ground-cover asset.
