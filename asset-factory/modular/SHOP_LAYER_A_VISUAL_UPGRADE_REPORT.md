# Shop Layer A Visual Upgrade Pass

Status: **PASS — TECHNICAL UPGRADE COMPLETE; OPERATOR REVIEW REQUIRED**

Five new, versioned Layer A candidates were built once on the real Steam Deck Blender worker (`flatpak run org.blender.Blender`, Blender 5.2.0 LTS). The `@1.0.0` candidates were not overwritten.

| Module | Version | Upgrade | Triangles | Materials | File bytes | Review |
|---|---:|---|---:|---:|---:|---|
| GG-BLD-FASCIA-SHOP-NAVY-001 | 1.1.0 (parent 1.0.0) | deeper cap, raised sign mount, cream edge trim | 60 | 2 | 96,271 | APPROVED_WITH_NOTES |
| GG-BLD-AWNING-SHOP-FABRIC-001 | 1.1.0 (parent 1.0.0) | deeper canopy, segmented bands, scalloped edge, brackets | 132 | 2 | 104,597 | APPROVED_WITH_NOTES |
| GG-BLD-WINDOW-SHOP-LARGE-002 | 1.1.0 (parent 1.0.0) | recessed glass, deep frame, sill, mullion | 60 | 2 | 96,293 | APPROVED_WITH_NOTES |
| GG-BLD-DOOR-SHOP-002 | 1.1.0 (parent 1.0.0) | deeper frame, glass inset, threshold, handle | 60 | 3 | 96,632 | APPROVED_WITH_NOTES |
| GG-VEG-PLANTER-SHRUB-001 | 1.1.0 (parent 1.0.0) | layered rim and staggered foliage silhouette | 132 | 3 | 104,749 | APPROVED_WITH_NOTES |

All candidates include LOD0/LOD1/LOD2 metadata, stable permanent asset IDs, component-ID renders/maps, and labeled four-side review boards. Anonymous geometry is zero. Budgets remain within the registered light-module ceilings.

## Compatibility and protection

- Existing recipe `GG-REC-BLD-SIMPLE-SHOP-GROWGO-001@1.0.0` remains unchanged and continues to resolve the same permanent IDs.
- The new versions are opt-in candidates; no master index promotion or Layer B substitution was performed.
- Foundation, wall, and trim were left unchanged.
- Golden Reference, Atlas, live map, and production assets were not modified.

Operator approval is still required before updating any recipe binding or publishing an upgraded module.
