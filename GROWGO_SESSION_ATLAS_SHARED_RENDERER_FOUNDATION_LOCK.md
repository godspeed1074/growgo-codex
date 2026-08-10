# GrowGo — Lock Atlas Shared Renderer Foundation

Status: PASSING FOUNDATION LOCK WORK

## Locked renderer contract

- Atlas attaches to the authoritative live GrowGo Leaflet map before rendering.
- Developer-alpha true-3D rendering uses exactly:
  - 1 shared renderer
  - 1 WebGL canvas
  - 1 shared scene
  - 1 shared north-up oblique camera path
- Approved or explicitly operator-approved GLBs may coexist in the shared scene.
- Asset instances preserve independent:
  - asset ID
  - asset version
  - model instance ID
  - geographic coordinate
- Individual asset instances may be:
  - created
  - updated
  - removed
  - recreated
  without disturbing other live instances.
- Shared renderer teardown must reduce Atlas-owned runtime counts to zero.

## Minimum supported renderer API

- attach
  - external contract:
    - `developer-only-atlas-map-attachment-controller`
    - `attachAtlasMapDiagnostic()`
- initialize shared renderer
  - `initializeSharedApprovedLiveAssetRenderer()`
  - lazy on first model instance
- load approved GLB
  - coupled to `createApprovedSharedAssetModelInstance(...)`
- create model instance
  - `createApprovedSharedAssetModelInstance(...)`
- update geographic position
  - `updateApprovedSharedAssetGeographicPosition(...)`
- remove model
  - `removeApprovedSharedAssetModelInstance(...)`
- clear models
  - `clearApprovedSharedAssetModelInstances()`
- detach/dispose
  - `clearApprovedSharedAssetModelInstances()`
  - external detach via `detachAtlasMapDiagnostic()`

## Locked regression guardrails

- per-asset renderer creation is forbidden
- per-asset canvas creation is forbidden
- duplicate scene creation is forbidden
- duplicate map-listener ownership is forbidden
- orphaned render loops are forbidden
- leaked model instances are forbidden

## Developer-alpha and runtime safety

- developer-alpha gating remains required
- fail-closed behavior remains required
- production/runtime gates remain unchanged:
  - `runtimeExecutionEnabled = false`
  - `mapAttachmentAllowed = false`
  - `automaticRendererExecutionAllowed = false`
  - `lifecycleExecutionEnabled = false`

## Visual-quality notes

- Current proof assets are technically functional but visually below the desired GrowGo quality bar.
- Current proof assets are not approved as the final GrowGo visual-quality benchmark.

## Provisional calibration observation only

- `BUILDING_CIVIC_SPORTS_PAVILION_001@1.0.0`
  - developer-only shared-renderer scale multiplier: `0.62x`
  - developer-only target height: `3.6m`
- This is a provisional Atlas visual-calibration observation.
- This is not a universal production building-scale rule.
