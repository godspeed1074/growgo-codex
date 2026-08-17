# Traced Door Profile Fabrication — Front Gate

**Status: BLOCKED.** The isolated Steam Deck build completed, but the result does not pass the visual front gate.

The build used `SHOP_DOOR_LANDMARK_PROFILE_SPEC_V1.json` directly. The canonical left casing and plinth were mirrored; no profile vertices, locked dimensions, slab, glass, reflection, transom glass/reveal, hardware, materials, shop scene, Atlas, or Golden Reference were changed.

## Evidence

- Real worker: Steam Deck, Blender 5.2.0 LTS — PASS
- Module-space polygons used directly — YES
- Front-only render gate — PASS
- Structural budget: 624 triangles, 372 vertices, 5 materials, 0 textures, 0 anonymous objects — PASS
- Pixel-visibility audit — NOT RUN (the existing placeholder audit was replaced with an honest `NOT_VALIDATED` result)
- Side/back/top QA — NOT RUN, as required after a failing front gate

## Vision decision

The new casing and plinth silhouettes are visibly narrow and splayed. This follows the currently approved polygon data exactly, but does **not** match the solid cream casing/plinth forms in the authoritative reference. Therefore:

- Same door: **NO**
- Casing: **FAIL**
- Plinth: **FAIL**
- Generic blockout remains: **YES**
- `SHOP_DOOR_FRONT_AUTHORITY_V1`: **not created**

The next safe step is to correct the casing/plinth authority polygons from the actual reference pixels, then rerun this same front-only fabrication gate. No side/back work or shop integration should occur first.
