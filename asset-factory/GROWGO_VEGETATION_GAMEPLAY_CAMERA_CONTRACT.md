# GrowGo Vegetation Gameplay-Camera Contract

**Contract ID:** `GROWGO_VEGETATION_GAMEPLAY_CAMERA_CONTRACT@1.0.0`  
**Status:** `LOCKED_FOR_REVIEW_CANDIDATES`  
**Scope:** trees, shrubs, bushes, grasses, ground cover, flowers, and other non-directional vegetation.  
**Excludes:** buildings, signs, and directional architectural assets.

## Authoritative runtime camera

The authority is the shared Atlas live-asset renderer, not an arbitrary Blender turntable.

| Field | Runtime value / rule | Evidence |
| --- | --- | --- |
| Projection | Perspective | `client/developer-only-atlas-shared-approved-live-assets.mjs` → `buildSharedCameraState` |
| Field of view | 32 degrees | `VIEW_FOV_DEGREES = 32` |
| Path | `shared_fixed_north_up_oblique` | `SHARED_CAMERA_PATH` |
| Azimuth / bearing | North-up, fixed by shared camera path | `SHARED_CAMERA_PATH` |
| Elevation / pitch | Dynamic oblique look-at camera; position is `[max(36, H×0.55), max(72, H×1.15), max(120, H×2.2)]`, target `[0, max(18, H×0.42), 0]` where `H` is maximum scaled asset height | `buildSharedCameraState` |
| Normal gameplay zoom | Leaflet zoom supplied at render time; asset scale derives deterministically from `metersPerPixel(latitude, zoom)` | `buildPerInstanceRenderState` |
| Primary asset-review scale | Registered asset target height at normal live-map zoom; review must preserve the runtime FOV/path and use the same target-height profile | `SUPPORTED_ASSET_RUNTIME_PROFILES` + `buildPerInstanceRenderState` |
| Tolerance envelope | Normal map zoom, map pan, resize and resulting deterministic render-scale changes only. Artificial full 360° turns are diagnostic only. | existing `moveend`, `zoomend`, `resize` listener contract |

The exact elevation is intentionally derived rather than hard-coded: it depends on the active visible asset height while the FOV and north-up oblique path remain locked. A Blender review scene must reproduce this rule or label itself **diagnostic**, never gameplay-authoritative.

## Permanent production rule

> Vegetation may use camera-authored 2.5D construction and does not need full 360° volumetric fidelity when the actual GrowGo gameplay camera does not expose those views.

> An asset that looks convincingly three-dimensional from the gameplay camera is acceptable even when its construction is mostly layered cards, shallow geometry, or camera-biased presentation.

> Do not add geometry solely to improve invisible or unreachable views.

`GROWGO_GAMEPLAY_CAMERA_REVIEW` is mandatory for every vegetation candidate. It is the approval render. Full-side, rear, and high-angle renders are permitted only as construction diagnostics and cannot overrule a passing gameplay review.

## Construction and LOD rules

- Medium and large trees use lightweight real 3D for trunk, major visible limbs, world anchor, and optional simple collision.
- Canopy, leaf density, highlight/shadow masses, and most detail may be transparent illustrated cards with shallow, camera-biased offsets.
- Shrubs, grasses, flowers, and ground cover may use a minimal anchor plus overlapping cards and baked/presentation shadows.
- `LOD_CLOSE`, `LOD_GAMEPLAY`, and `LOD_MAP` are selected from on-screen size under the authoritative camera; they are not a reward for invisible geometric completeness.
- Every card arrangement must avoid obvious sheets inside the normal gameplay tolerance envelope. Extra cards outside that envelope require a documented gameplay benefit.

## Deterministic variation contract

Vegetation candidates must declare and use only seed-derived variation:

- `allowHorizontalMirror: true` where material, anchor, collision, and gameplay silhouette remain valid;
- modest uniform scale / height range documented per family;
- small Y/world rotation range;
- approved canopy substitutions;
- three or four subtle palette variants (`BASE`, `COOL`, `WARM`, `LIGHT`).

The same asset, version, placement identity, and seed must always produce the same result. Buildings and signage do not inherit this mirror rule.

## Review requirements

1. `GROWGO_GAMEPLAY_CAMERA_REVIEW` from the runtime-equivalent perspective camera.
2. A small deterministic tolerance set for normal zoom/viewport variation.
3. A deterministic family / variation scene showing normal and mirrored instances.
4. A deterministic mass-placement mockup and performance report.
5. The result remains `REVIEW_CANDIDATE — HUMAN VISUAL APPROVAL REQUIRED` until an operator approves it.

## Historic diagnostic clarification

The eucalyptus V7–V9 ±60° turntable tests remain useful evidence about card construction, but those artificial viewpoints are **NON_AUTHORITATIVE_DIAGNOSTIC** under this contract. They must not cause geometry growth that harms the locked gameplay view.
