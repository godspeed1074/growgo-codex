# GROWGO IDENTITY ANCHOR EXPORT STANDARD

## Why Anchors Must Be Included

An identity anchor only helps if it is actually exported.

Having an anchor present in the Blender scene is not enough. If the export path
does not explicitly include that anchor in the selected object set, the final
GLB can still lose the asset identity proof.

## Export Selection Rule

For each LOD export, the export set must include:

- the LOD root
- every required child object for that LOD
- the matching identity anchor for that LOD

Examples:

- `TREE_EUCALYPTUS_001_LOD_CLOSE_ROOT`
- `TREE_EUCALYPTUS_001_LOD_CLOSE_IDENTITY_ANCHOR`

- `TREE_EUCALYPTUS_001_LOD_GAMEPLAY_ROOT`
- `TREE_EUCALYPTUS_001_LOD_GAMEPLAY_IDENTITY_ANCHOR`

- `TREE_EUCALYPTUS_001_LOD_MAP_ROOT`
- `TREE_EUCALYPTUS_001_LOD_MAP_IDENTITY_ANCHOR`

## Preflight Requirements

Before export, the script must confirm:

1. the anchor exists
2. the anchor belongs to the export tree
3. the anchor is selected for export
4. the selected export set matches the expected LOD tree

If any of these checks fail, export must stop before writing the GLB.

## Implementation Standard

GrowGo Blender scripts should avoid relying only on operator-driven grouped
selection.

Preferred approach:

- build the export object set explicitly by traversing the root hierarchy
- locate the matching LOD anchor explicitly
- select the export set explicitly
- export with `use_selection=True`

## LOD Anchor Requirements

Every exported LOD must have its own anchor:

- `ASSET_ID_LOD_CLOSE_IDENTITY_ANCHOR`
- `ASSET_ID_LOD_GAMEPLAY_IDENTITY_ANCHOR`
- `ASSET_ID_LOD_MAP_IDENTITY_ANCHOR`

## Safety

This standard does not:

- launch Blender
- regenerate assets
- publish assets
- activate renderer systems
- alter verified pavilion production records
