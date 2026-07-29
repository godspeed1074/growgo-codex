# GROWGO ASSET IDENTITY CONTRACT V2

## Purpose

`ASSET_IDENTITY_CONTRACT_PHASE_001_1` upgrades GrowGo asset identity from a
single-asset naming check into a permanent Asset Factory identity architecture.

It exists so GrowGo can safely support:

- standalone authored assets
- reusable shared modules
- variants
- palette identity
- formal LOD expectations
- metadata-backed GLB identity

without forcing every reusable dependency to pretend it is the parent asset.

## Permanent Schema

Every v2 contract defines:

- `assetId`
- `category`
- `recipeId`
- `version`
- `variantId`
- `paletteId`
- `lodProfile`
- `source`
- `dependencies`
- `identityPolicy`

Example:

```json
{
  "assetId": "TREE_EUCALYPTUS_001",
  "category": "NATURE",
  "recipeId": "TREE_EUCALYPTUS_RECIPE_001",
  "version": "v001",
  "variantId": "DEFAULT",
  "paletteId": "PALETTE_AU_NATIVE_GREEN_001",
  "lodProfile": "NATURE_STANDARD_001",
  "source": {
    "generator": "ASSET_FACTORY",
    "authoringTool": "BLENDER"
  },
  "dependencies": [],
  "identityPolicy": "ASSET_ROOT_AND_COMPONENTS"
}
```

## Identity Layers

### Asset-owned identity

These names belong to the asset being authored:

- `TREE_EUCALYPTUS_001_ROOT`
- `TREE_EUCALYPTUS_001_TRUNK`
- `TREE_EUCALYPTUS_001_CANOPY`
- `TREE_EUCALYPTUS_001_MATERIAL_LEAF`

### Shared dependency identity

These names belong to reusable modules and keep their own identity:

- `MOD_WINDOW_RESIDENTIAL_LARGE_001`
- `MOD_WINDOW_RESIDENTIAL_LARGE_001_FRAME`
- `MOD_ROOF_METAL_AU_001`
- `MOD_TREE_LEAF_CLUSTER_001`

Shared modules are valid only when declared in the parent asset's
`dependencies` list.

## Naming Rules

Supported structured forms include:

- `ASSET_ID_ROOT`
- `ASSET_ID_COMPONENT_ROLE`
- `ASSET_ID_COMPONENT_ROLE_VARIANT`
- `ASSET_ID_VARIANT_VARIANTID`
- `ASSET_ID_MATERIAL_ROLE`
- `ASSET_ID_LOD_CLOSE`
- `ASSET_ID_LOD_CLOSE_ROOT`
- `ASSET_ID_LOD_GAMEPLAY_ROOT`
- `ASSET_ID_LOD_MAP_ROOT`

Examples:

- `TREE_EUCALYPTUS_001_ROOT`
- `TREE_EUCALYPTUS_001_MATERIAL_LEAF`
- `TREE_EUCALYPTUS_001_VARIANT_SUMMER`
- `BUILDING_HOME_001_LOD_CLOSE_ROOT`
- `TRAIN_METRO_001_BODY_BLUE`

Invalid example:

- `TREE_EUCALYPTUS_TRUNK_001`

This fails because it does not preserve the exact permanent asset token
`TREE_EUCALYPTUS_001`.

## Dependency Rules

Parent asset example:

- `BUILDING_HOME_001`

Declared dependency example:

- `MOD_WINDOW_RESIDENTIAL_LARGE_001`

Validation passes when:

1. the parent asset preserves its own identity
2. the dependency preserves its own identity
3. the dependency is declared in the contract

Validation fails when an exported name belongs to neither the parent asset nor a
declared dependency.

## LOD Rules

V2 stores formal LOD expectations and currently supports:

- `LOD_CLOSE`
- `LOD_GAMEPLAY`
- `LOD_MAP`

Pre-export validation requires all expected LOD labels to be present.

## Palette Identity

Palette identity is now a first-class contract field.

Examples:

- `PALETTE_AU_NATIVE_GREEN_001`
- `PALETTE_COASTAL_HOME_001`

Palette identity must be deterministic and carried by the contract even when it
is not repeated in every authored name.

## Blender Requirements

Before export, validation must confirm:

- every required LOD root preserves asset identity
- object names are valid asset-owned names or declared dependency names
- mesh names are valid asset-owned names or declared dependency names
- material names are valid asset-owned names or declared dependency names
- collection names are valid asset-owned names or declared dependency names
- at least one asset-owned object, mesh, material, and collection is present

This keeps the parent asset provable while allowing safe module reuse.

## GLB Validation Rules

V2 GLB validation accepts identity from:

- scene names
- node names
- mesh names
- material names
- embedded metadata
- custom properties
- contract-like values inside `extras` or similar metadata structures

Name validation remains required. Metadata support adds a second safe identity
channel instead of replacing names.

## Future Asset Factory Usage

V2 is intended to scale across:

- buildings
- houses
- businesses
- railway assets
- vehicles
- trees
- animals
- decorations
- props
- terrain assets

Future assets should:

1. define a full v2 identity contract
2. declare shared dependencies explicitly
3. preserve asset-owned identity in roots and owned components
4. preserve dependency identity for reused modules
5. validate before export
6. validate again from the exported GLB

V2 is shared contract and validation tooling only.

It does not:

- launch Blender
- regenerate assets
- publish assets
- activate renderer systems
- attach assets to the map
- alter verified pavilion production records
