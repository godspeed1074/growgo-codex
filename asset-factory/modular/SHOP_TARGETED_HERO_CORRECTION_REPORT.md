# Targeted Hero Correction — Awning, Door, Shrub

Status: **NEEDS_CORRECTION**

One isolated Layer A correction pass was executed on the Steam Deck. Protected facade, foundation, window, fascia/sign architecture, trim, recipe identity, camera, shared palette, and Golden Reference inputs were not changed.

## Candidates

- Awning: `GG-BLD-AWNING-SHOP-FABRIC-001@3.5.0`, parent `@3.0.0`
- Door: `GG-BLD-DOOR-SHOP-002@3.5.0`, parent `@3.0.0`
- Shrub/planter: `GG-VEG-PLANTER-SHRUB-001@3.5.0`, parent `@3.0.0`

Awning correction adds a projecting canopy, valance, underside layer, support arms and a silhouette that is no longer a flat slab. Door correction adds a readable glass insert, inset panel, knob, mail slot, frame and threshold. Shrub correction uses separate planter/rim and overlapping low, mid and tall foliage masses for an upright irregular silhouette.

Module renders include gameplay, close-up, FRONT/BACK/LEFT/RIGHT, black SILHOUETTE and COMPONENT_ID views. Real worker: Steam Deck `flatpak run org.blender.Blender`; Blender 5.2.0 LTS; clean exit.

## Full-shop evaluation

The isolated recipe evaluation uses the corrected three candidates and leaves all other module versions unchanged. Recipe remains `GG-REC-BLD-SIMPLE-SHOP-GROWGO-001@1.0.0`.

Awning: **PASS at module silhouette level; full-shop gameplay still needs operator confirmation.** Door: **PASS for knob and mail-slot geometry; gameplay prominence needs confirmation.** Shrub: **PASS for layered upright geometry; full-shop balance needs confirmation.** Overall Golden Reference similarity: **NEEDS_CORRECTION** pending operator review.

Full-shop budget: 492 triangles, 328 vertices, 41 objects, 7 materials, 1 texture, 122,731-byte `.blend`, anonymous geometry 0. Component IDs and four-side renders pass. Known-good build: not assigned.

The remaining uncertainty is visual comparison at the final gameplay camera, not missing required geometry. No broad correction loop was started.
