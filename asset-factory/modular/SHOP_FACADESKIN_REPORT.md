# Reference-Projected Facade Skin Proof

## Decision

**NEEDS_TARGETED_FIX**. The isolated Steam Deck proof completed successfully, but the projected skin is not promoted: it introduces visible side/edge artifacts and flattens the wall into a peach surface instead of matching the Golden Reference's layered brown shell.

## Evidence

- Reference: `test-output/visible-facade-sanity/SHOP_REFERENCE_VISIBLE_FACADE.png`
- Baseline: `test-output/cleancontext-proof/SHOP_CALIBRATED_FULL_FRONT.png`
- Candidate: `test-output/facadeskin-iter3/SHOP_CALIBRATED_FULL_FRONT.png`
- Board: `test-output/facadeskin-final/SHOP_FACADESKIN_COMPARISON_BOARD.png`
- Worker result: `test-output/facadeskin-iter3/SHOP_CALIBRATED_FULL_RESULT.json`

## Validation

- Steam Deck Blender 5.2.0 LTS: PASS
- Real `.blend` and RGBA renders: PASS
- Component IDs: PASS
- Four-side renders: PASS
- Anonymous geometry: 0
- Mobile budget: PASS
- Hero modules and recipe: preserved
- Golden Reference and camera: unchanged
- Known-good build: **not assigned**

## Visual finding

The reference projection adds reference-derived surface colour, but the current crop/underlay does not yet respect the shell silhouette: the candidate shows residual edge artifacts and insufficient architectural layering. The candidate is therefore evidence only, not a production promotion.

## Next targeted fix

Calibrate the projected skin to the visible wall silhouette (including side-edge and upper-transition masks) and retain the modular wall returns underneath. Rerun one isolated Steam Deck proof, then repeat operator review. Do not change hero modules, recipe identity, camera, or Golden Reference.
