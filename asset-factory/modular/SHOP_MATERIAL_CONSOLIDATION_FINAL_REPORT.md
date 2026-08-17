# Shop Material Atlas Consolidation

Status: **PASS**

The isolated final candidate was processed once on the real Steam Deck Blender worker. This was a material-only operation; geometry, transforms, recipe identity, module metadata, camera, component IDs, and Golden Reference were preserved.

- Material slots/datablocks in the source blend: **20 → 7**.
- Earlier aggregate budget report: 59; the seven shared IDs also resolve that reported overage.
- Triangles: **1,704 → 1,704**.
- Vertices: **1,136 → 1,136**.
- Objects: **46**.
- Anonymous geometry: **0**.
- Shared palette materials: wall brown, fascia navy, awning plum, teal glass, cream trim, foundation gray, vegetation green.
- Steam Deck Blender: **5.2.0 LTS**, clean exit.
- Beauty and component-ID renders regenerated; four-side source views regenerated and retained.

Visual regression: **PASS at the required family/silhouette gate**. No geometry or transforms changed; colour families and component mappings remain stable. Known-good build ID remains unassigned pending operator Golden Reference approval.
