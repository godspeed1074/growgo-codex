# GROWGO SESSION 212.1 — Atlas Multi-Asset Placement System

Date: 2026-08-07
Branch: feature/atlas-phase-211-6-gated-map-attachment-controller
Phase: 212.1 — Atlas Multi-Asset Placement System

## Goal
Expand the first successful single-asset Atlas placement seam into a reusable multi-asset system that supports multiple approved GrowGo assets through one deterministic render-command path.

## Implemented modules
- `client/developer-only-atlas-asset-registry.mjs`
- `client/developer-only-atlas-multi-asset-placement-provider.mjs`

## Initial approved registry assets
- `TREE_EUCALYPTUS_001` (`v001`)
- `TREE_BOTTLEBRUSH_001` (`v002`)
- `SHRUB_COASTAL_LOW_001` (`v002`)
- `BUILDING_CIVIC_SPORTS_PAVILION_001` (`1.0.0`)

## Registry contract
Each registry entry stores only lightweight metadata:

- `assetId`
- `assetVersion`
- `assetCategory`
- `assetFamily`
- `assetReferenceId`
- `approvedRegions`
- `approvedPackages`
- `approvedRecipeIds`
- `placementRules`
- `scaleRules`
- `rotationRules`
- `lodRules`
- `performanceBudget`
- `status`

No raw asset files, Blender files, geometry payloads, or textures are stored in the registry.

## Multi-asset placement contract
Input:

- `assetId`
- `version`
- `coordinate`
- `regionId`
- `packageId`
- `recipeId`
- `selectorSeed`

Output:

- `instanceId`
- `assetReferenceId`
- `position`
- `scale`
- `rotation`
- `lod`
- `renderCommand`

## Placement classes

### Vegetation
- seeded scale range
- full natural rotation range
- lightweight gameplay LOD default
- valid for:
  - `TREE_EUCALYPTUS_001`
  - `TREE_BOTTLEBRUSH_001`
  - `SHRUB_COASTAL_LOW_001`

### Building
- narrow scale range
- cardinal rotation only
- stricter footprint rule
- higher placement stability
- valid for:
  - `BUILDING_CIVIC_SPORTS_PAVILION_001`

## Deterministic guarantees
Same:

- asset
- coordinate
- region
- package
- recipe
- selector seed

produces the same:

- instance id
- scale
- rotation
- lod
- render command

Different asset, coordinate, or selector seed produces a different valid deterministic result.

## Batch behavior
The provider supports multi-command batches:

- deterministic command ordering
- duplicate instance removal
- one deterministic `batchId`

Output shape:

```json
{
  "batchId": "ATLAS_ASSET_BATCH_…",
  "commands": [
    {
      "assetId": "TREE_EUCALYPTUS_001",
      "instanceId": "ATLAS_ASSET_INSTANCE_…",
      "position": { "x": 144360.7, "y": 38148.7 },
      "scale": 1.0,
      "rotation": 180,
      "lod": "gameplay"
    }
  ]
}
```

## Atlas integration rule
All assets remain render-command-only.

This phase adds:
- no extra renderer
- no extra Canvas
- no DOM drawing
- no Leaflet markers
- no direct map layers
- no automatic world population

## Performance proof
- duplicate asset references reuse one registry entry
- placement output contains no geometry payload
- no texture loading occurs
- no asset mutation occurs
- command output remains lightweight

## Diagnostics proof
Frozen status exposes only:

- `registryVersion`
- `registeredAssetCount`
- `resolvedAssetCount`
- `rejectedAssetCount`
- `lastResolvedAssetId`
- `lastFailureReason`
- `batchCommandCount`

No raw model, texture, Canvas, renderer, DOM, or Leaflet references are exposed.

## Safety
All canonical Atlas safety flags remain false:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Result
Atlas now supports multiple approved assets through one deterministic metadata-only registry and one shared placement resolver, while staying fully developer-only and disconnected from live automatic spawning.
