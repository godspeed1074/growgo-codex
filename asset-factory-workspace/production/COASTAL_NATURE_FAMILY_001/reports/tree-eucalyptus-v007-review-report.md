# TREE_EUCALYPTUS_001_v007 — Foliage Density and Integrated Bark Review

Status: `PENDING_OPERATOR_REVIEW`

Review-only candidate. No registration, promotion, publication, activation, or
Atlas integration has been performed. Versions v001–v006 remain protected.

## Corrections from v006

- Reused the exact four-type 512×512 v006 foliage atlas; leaves were not redesigned.
- Increased GAMEPLAY card instances from 10 to 15 per island: exactly 50% more.
- Added restrained front/middle/back offsets, underside layers, varied yaw,
  varied tilt, and bowed six-triangle cards.
- Preserved the same nine authored foliage-island centres and the major sky gaps.
- Removed the detached `GRAPHIC_BARK` mesh construction completely.
- Assigned cream, tan, peach, and restrained rust materials directly to faces of
  the trunk and branch meshes.

## Technical result

| Item | v006 | v007 |
| --- | ---: | ---: |
| CLOSE triangles | 2,562 | 3,160 |
| GAMEPLAY triangles | 2,074 | 2,510 |
| MAP triangles | 832 | 976 |
| GAMEPLAY GLB | 385,664 bytes | 435,120 bytes |
| Foliage atlas | 512×512 / 318,123 bytes | same file reused |
| Materials | 5 | 5 |
| Detached bark geometry | present | none |
| Alpha mode | MASK | MASK |

Measured v007 dimensions: 9.62 m wide × 13.95 m high × 6.58 m deep.

## Required checks

- Zero nodes or meshes named `GRAPHIC_BARK`: PASS.
- Bark colour materials occur on the actual limb/trunk mesh primitives: PASS.
- Foliage alpha `MASK`: PASS.
- Texture embedded in each GLB; no external dependencies: PASS.
- Per-LOD `IDENTITY_ANCHOR` and ground contact preserved: PASS.
- Authored height approximately 14 m: PASS.
- Historical v001–v006 hashes recorded: PASS.
- CLOSE > GAMEPLAY > MAP: 3,160 > 2,510 > 976: PASS.
- GAMEPLAY inside requested 2,500–4,500 target: PASS.

## Visual assessment

The foliage is fuller within each island, particularly along undersides and
around terminals, without closing the major gaps between islands. The v007 bark
cannot float because it is part of the trunk/branch surface. The broad colour
regions remain intentionally graphic; their edges follow the low-poly face
topology and are therefore more angular than painted UV artwork would be.

## Review files

- `TREE_EUCALYPTUS_001_v006_to_v007_comparison.png`
- `TREE_EUCALYPTUS_001_v007_GAMEPLAY_matched_front.png`
- `TREE_EUCALYPTUS_001_v007_GAMEPLAY_matched_oblique.png`
- `TREE_EUCALYPTUS_001_v007_GAMEPLAY_side.png`
- `TREE_EUCALYPTUS_001_v007_GAMEPLAY_top.png`
- `TREE_EUCALYPTUS_001_v007_GAMEPLAY_gameplay_distance.png`
- `TREE_EUCALYPTUS_001_v007_GAMEPLAY_close_foliage.png`
- `TREE_EUCALYPTUS_001_v007_GAMEPLAY_close_root_trunk.png`
- `TREE_EUCALYPTUS_001_v007_GAMEPLAY_hero.png`

Stop condition: operator visual decision required.
