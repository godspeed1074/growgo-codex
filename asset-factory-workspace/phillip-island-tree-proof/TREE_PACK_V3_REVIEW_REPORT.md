# GrowGo camera-first tree pack V3 — visual-polish evidence

State: `REVIEW_CANDIDATE` — human visual approval is required.  This phase does not register, promote, or place any candidate in Atlas.

## What V3 changed

- Derived `GROWGO_FOLIAGE_CLUSTER_ATLAS_V3_NO_TWIG.png` from the locked V6 atlas without editing that source: 20,207 isolated brown branchlet pixels were made transparent.
- Applied a restrained source colour lift and a shared paper-response material setting so rear foliage stays readable in daylight.
- Kept the existing trunks, canopy-mass counts, camera contract, alpha/UV layout, two-material/one-texture GLB contract, and LOD strategy.
- Added deterministic per-card offset, scale, crop selection, and yaw variation. No canopy cards were added.
- Used the existing `TREE_EUCALYPTUS_001` gameplay GLB only as scale context in the isolated review scenes.

## Evidence

- `output/GROWGO_TREE_PACK_V3_IN_GAME_SCALE_REVIEW.png` — primary bright daytime, in-game-scale review.
- `output/GROWGO_TREE_PACK_V3_MOBILE_SCALE_REVIEW.png` — portrait mobile-scale review.
- `output/GROWGO_TREE_PACK_V3_NEUTRAL_TECHNICAL_REVIEW.png` — neutral technical review.
- `output/GROWGO_TREE_PACK_V3_MASS_PLACEMENT_REVIEW.png` — deterministic mixed developer-only population.

## Performance: V2 to V3

The final V2 worker topology and the V3 worker topology are identical. V3 changes only source alpha/colour treatment and deterministic presentation transforms.

| Candidate | Close cards / tris | Gameplay cards / tris | Map cards / tris | Materials / textures |
|---|---:|---:|---:|---:|
| TREE_EUCALYPTUS_COASTAL_002 | 54 / 204 | 36 / 168 | 6 / 108 | 2 / 1 |
| TREE_NATIVE_ROUNDED_001 | 63 / 198 | 42 / 156 | 7 / 86 | 2 / 1 |
| TREE_COASTAL_WIND_001 | 54 / 204 | 36 / 168 | 6 / 108 | 2 / 1 |

V3 GLB sizes are 93,452/76,268/47,668 bytes (eucalyptus), 99,432/79,524/46,360 bytes (native rounded), and 92,752/75,760/47,596 bytes (coastal wind) for Close/Gameplay/Map. The small size delta is atlas encoding, not added geometry. Alpha-overdraw risk remains bounded by the existing card counts; no new card layer was introduced.

## Honest visual gate

| Gate | Eucalyptus coastal | Native rounded | Coastal wind |
|---|---|---|---|
| Full enough at gameplay scale | YES | YES | YES |
| Distinct family silhouette | YES | YES | YES |
| Repeated brown twig spikes obvious | NO | NO | NO |
| Near-black foliage blobs present | NO | NO | NO |
| Individual card repetition distracting | NEEDS HUMAN REVIEW | NEEDS HUMAN REVIEW | NEEDS HUMAN REVIEW |
| Convincing 3D illusion from locked gameplay camera | YES | YES | YES |
| GrowGo papercut language preserved | YES | YES | YES |
| Suitable alongside simple shop shells | YES | YES | YES |
| Lightweight deterministic mass placement | YES | YES | YES |

The no-twig source correction is effective and the most severe dark patches are lifted. The remaining decision is artistic: at close in-game scale the foliage shapes can still be recognized as individual cards. That is not hidden by this report and must be decided by an operator before the pack becomes the template for new species.

## Validation

`node asset-factory-workspace/phillip-island-tree-proof/validate-tree-pack.mjs`: 26 passed, 0 failed.

Steam Deck worker: Blender 5.2.0 LTS. Atlas architecture and production population were not modified.
