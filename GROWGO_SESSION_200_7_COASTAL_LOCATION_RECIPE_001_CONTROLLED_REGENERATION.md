# GROWGO SESSION 200.7 — COASTAL_LOCATION_RECIPE_001 Controlled Regeneration

Branch:
feature/growgo-asset-factory-town-expansion

Goal:
Regenerate `COASTAL_LOCATION_RECIPE_001` using the approved refinement plan without touching assets or runtime systems.

## Scope

This session produced a refined deterministic recipe package using:

- existing recipe specification
- approved refinement specification
- before/after rule comparison

## Applied Regeneration Changes

1. Added shoreline-transition support inside `WET_CROSSING_ZONE`
2. Added terrain-detail support inside `LOOKOUT_OR_REST_ZONE`
3. Redistributed one understory support placement into `SHORELINE_EDGE_ZONE`
4. Redistributed one understory support placement into `LOOKOUT_OR_REST_ZONE`

## Safety

- No Blender
- No GLBs
- No asset modification
- No runtime activation

## Readiness

The refined recipe output is ready for preview review.
