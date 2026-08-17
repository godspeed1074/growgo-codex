# Simple Shop Door V3 — Ownership + Depth Hierarchy Fabrication

Status: **BLOCKED**

V3 fixed the specific V2 ownership error: its `D20` is a narrow 112px × 8px door sill, not the V2 112px × 38px mixed door/landing region. The external landing, lower steps, and foundation are recorded for the future `GG-BLD-ENTRANCE-STEPS-COMMERCIAL-001` family and were not built into `GG-BLD-DOOR-SHOP-002`.

## Evidence

- Ownership preflight: `test-output/door-v3-preflight/SHOP_DOOR_V3_OWNERSHIP_PREFLIGHT.png`
- V3 front: `test-output/door-v3-build/SHOP_DOOR_V3_FRONT.png`
- Component IDs: `test-output/door-v3-build/SHOP_DOOR_V3_COMPONENT_ID.png`
- Wireframe: `test-output/door-v3-build/SHOP_DOOR_V3_WIREFRAME.png`
- Operator board: `test-output/door-v3-build/SHOP_DOOR_V3_FINAL_REVIEW_BOARD.png`

## Result

- Steam Deck Blender 5.2.0 LTS: PASS, clean exit
- Shared V2 guide preservation: PASS, 0px equivalent drift
- D20 ownership correction: PASS
- Panel depth candidates: A / B / C; selected B
- Head and separator layering: implemented, but direct visual fidelity still NEEDS_WORK
- Visible actual door components: 20/20 PASS
- Triangles / vertices / materials / textures: 568 / 368 / 5 / 0 — mobile budget PASS
- Anonymous geometry: 0
- Direct Same-door vision: NO
- Generic blockout: YES
- `SHOP_DOOR_FRONT_AUTHORITY_V3`: NOT LOCKED
- Shop / Atlas / eucalyptus / Golden Reference: unchanged

The V3 candidate is a safe, additive blocked artifact. It is not approved for shop integration or operator final approval.
