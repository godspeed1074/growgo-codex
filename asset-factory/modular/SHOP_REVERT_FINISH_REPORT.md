# Simple Shop — Safe Baseline Restoration

## Result

**BLOCKED — STALLED_VISUAL_CONVERGENCE**

The rejected facade-skin candidate was removed from the production script. The safe clean-context baseline was rebuilt with Blender 5.2.0 LTS on the Steam Deck and retained.

## Final evidence

- Reference: `test-output/revert-final/SHOP_REVERT_REFERENCE.png`
- Actual Blender asset — FRONT: `test-output/revert-final/SHOP_REVERT_ACTUAL_FRONT.png`
- 50% overlay: `test-output/revert-final/SHOP_REVERT_50_PERCENT_OVERLAY.png`
- Hero close-up: `test-output/revert-baseline/SHOP_CALIBRATED_FULL_HERO.png`
- Four-side board: `test-output/revert-final/SHOP_REVERT_FINAL_REVIEW_BOARD.png`

## Ranked visible differences

1. **CRITICAL:** the Golden Reference has a richer continuous architectural shell; the safe modular wall remains simpler and flatter.
2. **HIGH:** upper fascia/awning/wall transition is less layered than the reference.
3. **HIGH:** the reference has stronger warm-brown wall tonal variation and contact depth.
4. **MEDIUM:** shrub side depth is more card-like than the reference, although the front silhouette reads correctly.
5. **LOW:** small trim and surface-detail differences remain at gameplay scale.

## Final visual questions

| Area | Result |
|---|---|
| Overall shop match | NO — below the requested exact-match bar |
| Overall proportions | YES, broadly |
| Door | YES |
| Transom | YES |
| Window | YES |
| Window trim | YES |
| Awning | YES |
| Fascia/sign | YES |
| Upper transition | NO |
| Wall | NO |
| Foundation | YES |
| Shrub | YES front / needs side refinement |
| Papercut depth | NO, still flatter than reference |
| Presentation | YES |

## Validation

- Facade-skin candidate reverted: **YES**
- Safe baseline restored: **YES**
- Blender candidates tested: 1 isolated facade-skin candidate, then reverted
- Parameter variations tested: 0; no safe numeric placement change was justified by the current evidence
- Steam Deck Blender: PASS
- Four-side renders: PASS
- Component IDs: PASS
- Anonymous geometry: 0
- Mobile budget: PASS
- Golden Reference/camera/recipe/module identities: unchanged
- Known-good: **NO**
- Ready for operator review: **NO**

The facade-skin evidence remains available under `test-output/facadeskin-*`, but it is not part of the active production path.
