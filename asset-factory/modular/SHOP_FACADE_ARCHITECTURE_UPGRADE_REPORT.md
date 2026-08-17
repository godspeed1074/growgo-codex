# Shop Facade Architecture Upgrade — @3.5.0 Candidates

Status: **PASS — candidates built; operator review required**

These five isolated Layer A candidates add reusable building-shell depth. They do not change the Layer B recipe, assembly, materials, Golden Reference, or any production asset. Older versions remain intact and no candidate is automatically approved.

## Candidates

| Module | Parent | Architectural improvement | Reuse purpose |
|---|---:|---|---|
| `GG-BLD-WALL-SHOP-BROWN-001@3.5.0` | 2.5.0 | Front facade plane, recessed storefront zone, corner returns, panel rhythm, base transition | Shops, cafes, bakeries, small commercial buildings |
| `GG-BLD-FOUNDATION-SHOP-002@3.5.0` | 2.5.0 | Layered plinth, entrance landing, step and edge/shadow separation | Small commercial buildings and houses |
| `GG-BLD-WINDOW-SHOP-LARGE-002@3.5.0` | 3.0.0 | Reusable surround, recessed opening, exterior frame and sill extension | Shop, cafe, florist and apartment windows |
| `GG-BLD-AWNING-SHOP-FABRIC-001@3.5.0` | 3.0.0 | Wall mounting band, canopy attachment, support relationship and underside separation | Commercial awnings and stalls |
| `GG-BLD-FASCIA-SHOP-NAVY-001@3.5.0` | 3.0.0 | Wall cap/cornice transition, sign recess, border and shadow gap | Storefront and civic/commercial fascia |

## Execution and validation

- Worker: real Steam Deck external Blender worker
- Blender: 5.2.0 LTS (`flatpak run org.blender.Blender`)
- Every candidate has a `.blend`, gameplay/front render, close-up, component-ID render/map, and FRONT/BACK/LEFT/RIGHT review renders.
- All candidates use bounded shared materials and remain within the mobile budgets.
- Anonymous geometry: **0**.
- Component identity and permanent IDs are preserved.
- Layer B recipe and assembly were not touched.

Operator approval is still required before any recipe rebinding or Layer B assembly.
