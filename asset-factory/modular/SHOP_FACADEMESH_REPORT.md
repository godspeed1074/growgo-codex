# Exact-Silhouette Facade Surface Mesh Proof

## Result

**BLOCKED — facade mesh rejected**

The registered Layer A mesh was built with real Door and Window voids and rendered on the Steam Deck, but its traced outer bounds still produce visible facade extensions and rectangular tonal regions. It does not beat the 91-score modular baseline, so it was not integrated or promoted.

## Proof

- Facade surface ID: `GG-BLD-FACADE-SURFACE-COMMERCIAL-SHOP-001@1.0.0`
- Mesh: 20 vertices / 10 triangles
- Door/Window cutouts: geometrically present
- Isolated Blender iterations: **1**
- Integrated Blender iterations: **0**
- Rectangular artifact: **YES**
- Texture seams: **NO material seam, but silhouette edge mismatch remains**
- Hero modules preserved: **YES**
- Steam Deck Blender 5.2.0 LTS: **PASS**
- Four-side: **PASS**
- Component IDs: **PASS**
- Anonymous geometry: **0**
- Budget: **PASS**
- Known-good: **NO**
- Ready for operator final review: **NO**

The 91-score modular baseline remains active. Evidence is under `test-output/facemesh/`.
