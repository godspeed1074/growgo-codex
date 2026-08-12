# TREE_EUCALYPTUS_001_v006 — Concept-Matched Visual Review

Status: `PENDING_OPERATOR_REVIEW`

This is an isolated review candidate. It has not been registered, promoted,
published, activated, or integrated into Atlas. Versions v001–v005 remain
protected.

## Design authority

Approved GrowGo semi-stylized River Red Eucalyptus concept supplied by the
operator. The concept—not v005—is the comparison authority.

## Art-directed construction

- Manually authored major paths: `MAIN_TRUNK`, `LOWER_LEFT_SWEEP`,
  `MID_LEFT_ARCH`, `UPPER_LEFT_FORK`, `CENTRAL_CROWN_FORK`,
  `MID_RIGHT_SWEEP`, `UPPER_RIGHT_ARCH`, and `LOWER_RIGHT_REACH`.
- Manually authored secondary supports: `LEFT_TOP_SUPPORT`,
  `RIGHT_TOP_SUPPORT`, `LEFT_LOWER_SUPPORT`, and `CENTRE_BACK_SUPPORT`.
- Foliage islands: 9 (`TOP_LEFT`, `TOP_CENTRE`, `TOP_RIGHT`, `MID_LEFT`,
  `MID_CENTRE_BACK`, `MID_RIGHT`, `LOW_LEFT`, `LOW_CENTRE`, `LOW_RIGHT`).
- Reusable atlas cluster types: 4.
- Atlas: 512×512 RGBA PNG, alpha `MASK`, 318,123 bytes (~311 KiB).
- Macro branch and island placement contains no random distribution.

## Technical result

| Item | Result |
| --- | ---: |
| CLOSE triangles | 2,562 |
| GAMEPLAY triangles | 2,074 |
| MAP triangles | 832 |
| GAMEPLAY GLB | 385,664 bytes (~377 KiB) |
| Materials | 5 |
| Measured dimensions | 9.62 m W × 13.95 m H × 6.58 m D |
| Ground anchor | Per-LOD `IDENTITY_ANCHOR`, root contact at Z=0 |
| Focused validation | PASS |

The CLOSE and GAMEPLAY counts are below the preferred bands because the atlas
cards replace thousands of individual leaf faces. The preferred bands are hard
upper-limit guidance, not triangle floors; adding geometry would not materially
improve this review candidate.

## Concept features reproduced

- Tall pale trunk with a clear taper and asymmetric fork hierarchy.
- Nine separated canopy islands with readable sky gaps.
- Authored left/right rhythm rather than radial limb distribution.
- Long, drooping eucalyptus leaf character from a painted, non-photoreal atlas.
- Dark/mid/sage/yellow-green foliage layering.
- Broad planted collar and uneven root directions.
- Large cream/tan/peach/rust bark colour blocks.
- Genuine 3D depth through front/back island spacing and crossed/cap cards.

## Remaining visual differences

- The approved concept has softer, more organically blended trunk-to-branch
  junctions; v006 still shows some visibly faceted or abrupt branch transitions.
- Bark blocks are correctly graphic but remain simpler and less rhythmically
  integrated around the full trunk circumference than the concept.
- The atlas clusters are leaf-rich and efficient, but repeated card crossings
  are more visible in the pure top view and extreme close foliage view.
- The concept's hero render has warmer environmental bounce, stronger contact
  darkening, and a richer game-world backdrop; v006 uses a neutral review stage.
- Root mass is stronger than v005, but the concept has more softly sculpted,
  individually readable chunky root toes.
- Several foliage islands read slightly more compact/oval than the concept's
  most irregular drooping masses.

## Review renders

- `TREE_EUCALYPTUS_001_v006_GAMEPLAY_matched_front.png`
- `TREE_EUCALYPTUS_001_v006_GAMEPLAY_matched_oblique.png`
- `TREE_EUCALYPTUS_001_v006_GAMEPLAY_side.png`
- `TREE_EUCALYPTUS_001_v006_GAMEPLAY_top.png`
- `TREE_EUCALYPTUS_001_v006_GAMEPLAY_gameplay_distance.png`
- `TREE_EUCALYPTUS_001_v006_GAMEPLAY_close_foliage.png`
- `TREE_EUCALYPTUS_001_v006_GAMEPLAY_close_root_trunk.png`
- `TREE_EUCALYPTUS_001_v006_GAMEPLAY_hero.png`

Stop condition: operator visual decision required.
