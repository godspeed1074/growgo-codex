# Shop Final Production Candidate Review

Status: **NEEDS_TARGETED_MODULE_FIX**

The strongest available Layer A candidates were assembled once on the real Steam Deck worker. The candidate is not promoted.

Recipe: `GG-REC-BLD-SIMPLE-SHOP-GROWGO-001@1.0.0` (unchanged)

Module versions used:

- Foundation 1.0.0; wall 1.3.0; door 1.4.0; window 1.3.0; awning 1.3.0; fascia 1.3.0; sign 1.0.0; trim 1.0.0; planter/shrub 1.4.0.

Worker: Steam Deck, `flatpak run org.blender.Blender`, Blender 5.2.0 LTS. Beauty renders, component-ID render/map, and four-side renders were generated. Anonymous geometry is zero.

## Gates

- Component IDs: **PASS** after canonical SHRUB alias validation.
- Four-side review: **PASS** for artifact generation.
- Triangles/vertices: **PASS** (1,704 / 1,136).
- Material budget: **FAIL** (59; target <=32).
- Golden Reference protection and camera/recipe identity: **PASS**.

## Visual review

The selected modules improve fascia, awning, door hardware, window depth, and shrub identity. The assembled candidate still requires targeted review because imported module material slots remain duplicated and the storefront does not yet meet the reference’s production-level fidelity gate. No blind correction was attempted.

Known-good build ID: **not assigned**.
