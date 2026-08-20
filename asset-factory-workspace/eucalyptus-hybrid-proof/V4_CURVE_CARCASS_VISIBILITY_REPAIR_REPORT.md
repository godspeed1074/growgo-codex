# Eucalyptus V4 curve-carcass visibility repair

Version: `TREE_EUCALYPTUS_001@3.3.0` — `REVIEW_CANDIDATE`.

Root cause: the first V4 full-build source hook failed after preceding palette substitutions changed its exact string target. Consequently the curve function was never called; only the independent bark-scar meshes appeared. The original operator conversion was also context-sensitive.

Fix: V4 now inserts the carcass with a resilient pattern hook and converts each evaluated Bézier curve to an explicit mesh through `bpy.data.meshes.new_from_object`. This makes the woody geometry independent of Blender selection/operator context and keeps it renderable/exportable.

- Curve preflight: PASS
- Full carcass-only preflight: PASS
- Foliage system: unchanged (8 clusters, 7 masses, rear/middle/front cards)
- Atlas hygiene: UV inset plus nearest filtering stops cross-cell atlas sampling; remaining small source-art flecks are visible for operator judgement.
