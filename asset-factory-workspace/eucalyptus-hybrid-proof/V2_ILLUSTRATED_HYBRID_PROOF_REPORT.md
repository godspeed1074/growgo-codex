# Eucalyptus Hybrid Foliage Proof V2

Asset: `TREE_EUCALYPTUS_001@3.1.0`  
State: `REVIEW_CANDIDATE` — human visual approval required.

V2 proves the intended hybrid method with real Steam Deck Blender 5.2.0 LTS output: an eight-design transparent illustrated eucalyptus atlas is mapped onto layered canopy cards around a lightweight tapered/forked carcass. The rejected `@3.0.0` evidence remains untouched and is explicitly retained as structural-method evidence only.

## Alpha and export gate

- PNG alpha preflight: `PASS` (`FOLIAGE_CARD_ALPHA_PREFLIGHT.png`)
- GLB alpha preflight: `PASS` (`FOLIAGE_CARD_ALPHA_PREFLIGHT.glb`)
- Renderer: `BLENDER_EEVEE`
- Atlas: `1254 × 1254`, RGBA, one texture, genuine transparent and visible pixels validated.
- Exported GLBs contain three materials (pale bark, warm bark accents, shared foliage atlas) and one embedded texture.

## Construction

- Eight reusable authored cluster designs: dark/mid/highlight drooping, broad lateral, small twig, large canopy, narrow vertical, sparse branch tip.
- Seven asymmetric canopy islands, with rear / middle / front card layers.
- Close LOD uses 63 foliage cards; gameplay uses 28; map uses 7.
- Structural carcass: nine tapered, curved-in-composition branch segments plus three restrained warm bark patches; pale cream-grey bark palette.
- Dimensions in the gameplay presentation: approximately 5.4 m canopy width × 6.8 m height × 0.9 m presentation depth.

## Actual exported performance

| LOD | Triangles | Cards | Exported materials | GLB size |
|---|---:|---:|---:|---:|
| Close | 486 | 63 | 3 | 2,759,528 bytes |
| Gameplay | 368 | 28 | 3 | 2,720,736 bytes |
| Map | 230 | 7 | 3 | 2,691,148 bytes |

The cards are tightly atlas-cropped but still include some transparent space; alpha overdraw is moderate, appropriate for this proof, and should be profiled before production promotion.

## Visual self-check

- Rectangular foliage-card backgrounds visible: **NO**
- Cards contain illustrated eucalyptus leaves: **YES**
- Multiple distinct canopy masses: **YES**
- Trunk visible between foliage masses: **YES**
- Real canopy depth/parallax: **YES**
- Resembles the supplied GrowGo eucalyptus direction enough for review: **YES**
- Generic low-poly foliage: **NO**

Small isolated edge flecks from the supplied illustration remain visible in close inspection. They do not form opaque card backgrounds; their acceptance is deliberately left to human visual review.

## Protection

- `TREE_EUCALYPTUS_001@3.0.0`: unchanged, visually rejected, retained for history.
- No other trees or ground-cover assets were touched.
- Atlas architecture: unchanged.
- No registry promotion or Phillip Island population was performed.
