# GrowGo Camera-Authored Illustrated Foliage Cluster Method

1. Gameplay-camera fidelity is authoritative for vegetation.
2. Structural geometry provides the anchor, trunk, major branches, and minimal physical depth.
3. Rich illustrated raster clusters provide visible foliage fidelity.
4. One presentation card may contain many illustrated leaves.
5. Procedural polygon reconstruction of approved foliage art is prohibited for Close and Gameplay LODs unless explicitly human-approved.
6. Source foliage art must pass human visual review before Blender.
7. The cluster library must pass human visual review before tree assembly.
8. Distant LODs may simplify aggressively, but Close and Gameplay retain approved raster art.
9. Deterministic mirror, modest scale, yaw, and palette variations are preferred to duplicate source files.

The extraction rule is permanent: isolate authored foliage by alpha-component ownership rather than a rectangular atlas crop; force every pixel outside the approved mask transparent and include transparent padding.
