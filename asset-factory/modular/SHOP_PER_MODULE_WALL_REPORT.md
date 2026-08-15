# Per-Module Reference Surface Mapping

## Result

**BLOCKED — STALLED_PER_MODULE_SURFACE_MAPPING**

The two isolated per-module strategies were tested against the 91-score baseline:

1. Opaque reference slices on the physical wall-module bounds: removed hero holes but duplicated protected reference artwork.
2. Hero-hole alpha slices on the same physical bounds: removed duplication, but exposed rectangular tonal edges at module boundaries.

Neither strategy materially improves the front without introducing a new artifact. The 91-score modular baseline remains active.

## Validation

- Wall modules mapped: `WALL_LEFT`, `WALL_CENTRE`, `WALL_RIGHT`
- Reference regions: crop x `0–197`, `197–363`, `363–676`, y `0–385`
- Mapping strategies tested: **2**
- Rectangular card artifact: **YES** in strategy 2
- Visible wall seams: **YES**
- Upper transition improved: **NO**
- Wall richness improved: **NO safe promotion**
- Hero modules preserved: **PASS**
- Steam Deck Blender 5.2.0 LTS: **PASS**
- Four-side: **PASS**
- Component IDs: **PASS**
- Anonymous geometry: **0**
- Budget: **PASS**
- Known-good: **NO**
- Ready for operator final review: **NO**

Evidence is under `test-output/per-module-wall/` and `test-output/per-module-wall2/`. No broad facade plane was promoted and no production recipe or hero module was changed.
