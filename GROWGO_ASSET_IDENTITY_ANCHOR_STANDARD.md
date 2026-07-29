# GROWGO ASSET IDENTITY ANCHOR STANDARD

## Purpose

Asset identity anchors exist because Blender GLB export may omit EMPTY-based
identity roots even when the authored `.blend` scene is correct.

The anchor gives every Asset Factory asset an export-safe identity carrier that:

- is lightweight
- survives GLB export
- keeps metadata attached
- works across nature, buildings, vehicles, railway assets, props, and terrain

## Why Anchors Exist

Name-only validation is useful but not enough.

An authored scene can contain:

- correct asset roots
- correct component names
- correct LOD roots
- correct metadata

and still lose identity during GLB export if the exported file does not retain
the authored identity objects.

The anchor fixes that by introducing an export-safe mesh object whose only job
is to carry identity.

## Anchor Rules

Every anchor must:

- be exportable as mesh data
- be effectively invisible in the final asset
- carry identity metadata through custom properties / extras
- remain parented to the appropriate LOD root

Recommended naming:

- `ASSET_ID_LOD_CLOSE_IDENTITY_ANCHOR`
- `ASSET_ID_LOD_GAMEPLAY_IDENTITY_ANCHOR`
- `ASSET_ID_LOD_MAP_IDENTITY_ANCHOR`

Example:

- `TREE_EUCALYPTUS_001_LOD_CLOSE_IDENTITY_ANCHOR`

## Required Metadata

Every anchor must preserve:

- `assetId`
- `category`
- `recipeId`
- `version`
- `variantId`
- `paletteId`
- `lodProfile`
- `identityPolicy`

It should also preserve:

- declared dependencies
- exported identity source
- anchor marker flag

## Export Requirements

The anchor must be:

- created before export
- included in the selected export set
- exported with extras/custom metadata enabled
- validated after export

## Validation Order

Asset identity validation should prefer:

1. embedded metadata / extras
2. identity anchor
3. structured object names
4. legacy name matching

This keeps validation flexible while still deterministic.

## Dependency Rules

Anchors do not replace dependency identity.

Shared modules must still preserve their own declared identity, for example:

- `MOD_TREE_LEAF_CLUSTER_001`
- `MOD_WINDOW_RESIDENTIAL_LARGE_001`

The parent asset and the dependency both remain provable.

## Blender Workflow Requirements

Reusable Blender-side helper logic should:

- build anchor names deterministically
- create the anchor mesh
- attach identity metadata
- parent it to the LOD root
- confirm the anchor exists before export

## Safety

This standard does not:

- launch Blender
- regenerate assets
- publish assets
- activate renderer systems
- attach assets to the map
- alter verified pavilion production records
