# GrowGo Camera-Authored Illustrated Foliage Cluster Method

**State:** RICH_RASTER_ART_DIRECTION_APPROVED — TREE ASSEMBLIES REVIEW_CANDIDATE
**Authority:** locked rich-raster source art; prior tree approvals rescinded pending shape-safe human review
**Scope:** Layer A vegetation; approved for camera-authored 2.5D trees, shrubs, and ground-cover families.

1. The locked GrowGo gameplay camera is authoritative for vegetation fidelity. Vegetation does not need equal 360° fidelity.
2. Vegetation may be mostly 2.5D while reading convincingly as 3D from that camera.
3. Lightweight structural geometry supplies anchors, trunks, limbs, stems, physical scale, and collision where needed.
4. Human-approved rich illustrated raster cards supply leaves, canopy colour, silhouette, density, and papercut shading.
5. One lightweight card may visibly carry many painted leaves.
6. Do not rebuild approved foliage art as procedural polygons.
7. Procedural or simple polygon foliage is prohibited at Close and Gameplay LODs unless a specific asset receives human approval.
8. Source artwork must pass visual review before Blender fabrication.
9. A reusable cluster library must pass visual review before tree assembly.
10. Gameplay LOD reduces card count while retaining approved rich artwork; Map/Far LOD may simplify aggressively.
11. Deterministic mirroring, subtle scale, limited yaw, and restrained BASE/COOL/WARM/LIGHT palette variation reduce clone appearance without creating a new asset.
12. Performance target: **high visual density + low per-object complexity**. The lush GrowGo mobile-map reference defines desired world density, not excessive geometry per tree.

The extraction rule is permanent: isolate authored foliage by alpha-component ownership rather than a rectangular atlas crop; force every pixel outside the approved mask transparent and include transparent padding.

The shape-preservation rule is permanent: **approved raster foliage silhouettes are immutable presentation assets. Foliage cards may only use uniform scaling and approved mirroring/rotation. Nonuniform scaling that alters the source aspect ratio is prohibited.** Card geometry must be derived from the source pixel width/height, and validation must reject a rendered-aspect mismatch before a tree can be reviewed.
