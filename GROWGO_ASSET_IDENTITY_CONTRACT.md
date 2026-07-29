# GROWGO ASSET IDENTITY CONTRACT

## Purpose

`ASSET_IDENTITY_CONTRACT_PHASE_001` exists so exported Blender assets keep a
stable, exact asset identity token all the way through:

- Blender scene authoring
- LOD export
- GLB validation
- Asset Factory registration

This prevents a class of failures where a file looks valid, but later cannot be
proven to belong to the intended asset.

## Why Asset Identity Exists

Asset identity is not decorative naming.

It exists so GrowGo can prove:

- which asset was authored
- which recipe the asset belongs to
- which GLB files belong to that asset
- whether validation is reading the correct binary output

Without a stable exact token, a file may parse successfully but still fail the
Asset Factory gate.

## Required Identity Token

Every contract defines:

- `assetId`
- `recipeId`
- `version`
- `category`
- `requiredIdentityToken`

In Phase 001, the required identity token is the exact `assetId`.

Examples:

- `TREE_EUCALYPTUS_001`
- `BUILDING_CIVIC_SPORTS_PAVILION_001`

## Naming Rules

Required format:

`{ASSET_ID}_{COMPONENT_ROLE}_{VARIANT}`

Or, when no variant is needed:

`{ASSET_ID}_{COMPONENT_ROLE}`

Examples:

- `TREE_EUCALYPTUS_001_ROOT`
- `TREE_EUCALYPTUS_001_TRUNK`
- `TREE_EUCALYPTUS_001_CANOPY`
- `TREE_EUCALYPTUS_001_MATERIAL_LEAF`
- `BUILDING_CIVIC_SPORTS_PAVILION_001_ROOT`
- `BUILDING_CIVIC_SPORTS_PAVILION_001_ROOF`

Invalid example:

- `TREE_EUCALYPTUS_TRUNK_001`

This is invalid because it does not preserve the exact token
`TREE_EUCALYPTUS_001`.

## Blender Requirements

Before export, the asset must preserve identity in:

- LOD root object names
- authored object names
- authored mesh names
- authored material names
- asset collection name

At minimum:

- every LOD root must contain the exact asset ID
- at least one exported mesh name must contain the exact asset ID
- at least one exported material name must contain the exact asset ID
- the asset collection must contain the exact asset ID

If these checks fail, export must be blocked.

## GLB Validation Rules

Phase 001 GLB validation inspects:

- scene names
- node names
- mesh names
- material names

An exported GLB passes identity validation only when the exact asset identity
token is present in at least one of those named sections.

The GLB validator also continues to check:

- valid GLB header
- valid declared length
- mesh count
- material count
- triangle count
- primitive count
- external dependency state

## Future Asset Requirements

All future Blender-authored assets should:

1. define a contract from the permanent asset ID
2. inject the exact asset ID into authored object names
3. inject the exact asset ID into authored mesh names
4. inject the exact asset ID into authored material names
5. validate identity before export
6. validate identity again from the exported GLB

This contract is shared tooling only.

It does not:

- launch Blender
- regenerate assets
- publish assets
- activate renderer systems
- attach assets to the map
