# TREE_EUCALYPTUS_001_v009 — Trunk Sculpture + Final Foliage Fullness Review

Status: `PENDING_OPERATOR_REVIEW`

The v009 Blender source and GLB exports were generated as a new protected
revision. No registration, promotion, publication, activation, or Atlas
integration occurred. Versions v001–v008 remain protected.

## Changes from v008

- Preserved the v008 eight-island composition and v006 foliage atlas.
- Added controlled inner-island fullness with four additional layered cards per
  island, focused on rear/mid/upper layers rather than crown footprint growth.
- Increased trunk and major-limb radial resolution and densification.
- Reduced the fork-swell scale while increasing its smoothness.
- Added a broad planted root mound plus six uneven rounded root toes.
- Kept bark face-bound to the trunk/branch meshes, with fewer longer drifting
  regions and zero detached bark geometry.

## Technical result

| Item | Result |
| --- | ---: |
| CLOSE triangles | 9,416 |
| GAMEPLAY triangles | 8,000 |
| MAP triangles | 1,190 |
| GAMEPLAY GLB | 575,908 bytes (~562 KiB) |
| Dimensions | 10.07 m W × 14.18 m H × 6.57 m D |
| Materials | 5 |
| Atlas | Existing 512×512 RGBA atlas reused |
| Alpha mode | `MASK` |
| External dependencies | 0 |
| Ground anchor | Per-LOD `IDENTITY_ANCHOR` |
| Complexity order | CLOSE > GAMEPLAY > MAP |
| Focused technical test | PASS |

The GAMEPLAY export is exactly at the absolute 8,000-triangle hard ceiling,
above the preferred 5,500–6,500 range. The added geometry is concentrated in
trunk/fork smoothing, planted root sculpture, and the requested inner-canopy
fullness. This is explicitly an operator-review exception, not an approval.

## Visual review blocker

The v009 exports completed, but Blender 4.2.23 now crashes during startup in its
Metal backend—even a trivial `--background --python-expr` launch fails before
Python runs. Therefore no v009 render board is being fabricated from v008
images. The existing v009 `.blend` and GLB exports are preserved for rerender
once the Blender executable/backend blocker is resolved.

Required v009 renders still outstanding:

- reference / v008 front / v009 front / v009 oblique comparison board;
- v008 vs v009 trunk/root crop;
- v008 vs v009 foliage crop;
- front, oblique, side, top, gameplay-distance, close foliage,
  close trunk/root, and neutral hero.

Operator visual approval remains blocked pending those renders.
