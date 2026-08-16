# Shared Global Facade UV Atlas Proof

## Result

**BLOCKED — STALLED_GLOBAL_UV_MAPPING**

Two genuinely different shared-UV strategies were tested on the physical modular wall geometry:

1. Global UV atlas on wall panels and wall returns.
2. Same global UV atlas restricted to front-facing wall-panel polygons only.

Both preserved module geometry and technical contracts, but both produced visible rectangular tonal regions and edge artifacts against the 91-score baseline. Neither is promoted.

## Validation

- Global facade UV contract: created
- Shared atlas: `GG-ATLAS-COMMERCIAL-FACADE-A@1.1.0`
- Wall modules using shared UV: `WALL_PANEL_LEFT`, `WALL_PANEL_CENTRE`, `WALL_PANEL_RIGHT`, returns/top/lower wall family
- UV candidates tested: **2**
- Wall seams: **YES**
- Rectangular card artifact: **YES**
- Hero duplication: **NO**
- Wall richness: not safely improved
- Upper transition: not safely improved
- Shrub side-depth: unchanged and preserved
- Steam Deck Blender 5.2.0 LTS: PASS
- Four-side: PASS
- Component IDs: PASS
- Anonymous geometry: 0
- Budget: PASS
- Known-good: **NO**
- Ready for operator final review: **NO**

The active safe baseline remains the 91-score modular candidate. The full-plane and independent-slice strategies remain retired, and no global-UV candidate was promoted.
