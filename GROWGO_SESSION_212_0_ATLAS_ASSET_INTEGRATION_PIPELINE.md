# GROWGO SESSION 212.0 — Atlas Asset Integration Pipeline

Date: 2026-08-07
Branch: feature/atlas-phase-211-6-gated-map-attachment-controller
Phase: 212.0 — Atlas Asset Integration Pipeline

## Goal
Prove the first complete Atlas asset path with one approved lightweight asset:

- Asset Recipe
- Atlas Asset Resolver
- Deterministic Placement Resolver
- Asset Instance Description
- Atlas Render Submission
- Persistent Draw Layer handoff
- Cleanup

This phase remains developer-only and planning-safe:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## First approved asset
- `TREE_EUCALYPTUS_001`
- version: `v001`
- category: `nature`
- family: `COASTAL_NATURE_FAMILY_001`

## Implemented module
- `client/developer-only-atlas-asset-placement-provider.mjs`

## Implemented contract
The provider accepts scalar placement input:

- `assetId`
- `assetVersion`
- `assetCategory`
- `geographicCoordinate`
- `placementSeed`
- `selectorSeed`
- `scaleRule`
- `rotationRule`
- `lodRule`
- `regionId`
- `packageId`
- `recipeId`

It resolves:

- one approved reusable asset reference
- one deterministic instance id
- one deterministic scale
- one deterministic rotation
- one deterministic LOD
- one render command

## Render-command-only rule
The module never loads raw Blender files, geometry blobs, textures, Canvas objects, DOM objects, or Leaflet objects.

The resulting handoff is render-command only:

```json
{
  "assetId": "TREE_EUCALYPTUS_001",
  "instanceId": "ATLAS_ASSET_INSTANCE_…",
  "position": { "x": 144360.7, "y": 38148.7 },
  "scale": 1.0,
  "rotation": 180,
  "lod": "gameplay"
}
```

## Deterministic guarantees
Given the same:

- asset id
- coordinate
- region
- package
- recipe
- selector seed

the pipeline returns the same:

- instance id
- scale
- rotation
- LOD
- render command

Changing seed or coordinate changes the deterministic output while keeping it valid.

## Rejection gates
The provider fails closed for:

- missing asset id
- unknown asset id
- invalid version
- invalid category
- missing coordinate
- invalid coordinate
- invalid region
- invalid package
- missing placement seed
- invalid scale rule
- invalid rotation rule
- invalid LOD rule

## Performance proof
This phase proves:

- one reusable asset reference
- no duplicated geometry payloads
- no raw Blender loading
- no large texture loading
- no asset mutation during draw submission

## Diagnostics proof
Frozen serializable status exposes only:

- `assetId`
- `instanceId`
- `placementStatus`
- `resolverStatus`
- `deterministicSeed`
- `lodSelected`
- `renderCommandCreated`
- `failureReason`

No raw model, renderer, Canvas, DOM, or Leaflet references are exposed.

## Result
Atlas now has a first developer-only asset placement pipeline for `TREE_EUCALYPTUS_001` that stays deterministic, render-command-only, and disconnected from automatic spawning. This is the proven single-asset baseline for Phase 212.1 multi-asset expansion.
