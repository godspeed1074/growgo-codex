# GrowGo Atlas Phase 212.70 — Controlled Existing-Asset Binding

Status: PASS

Branch:
- `feature/atlas-phase-211-6-gated-map-attachment-controller`

ELI5:
- Atlas already knows how to plan a placement and walk a dry-run Asset Factory handoff without making anything.
- This phase proves Atlas can stop there and deterministically bind that validated placement to one already-approved asset record.
- It uses only existing approved assets, resolves the matching manifest/LOD/GLB identity, and still keeps rendering and generation turned off.

What this phase adds:

- a developer-only controlled existing-asset binding contract
- deterministic binding IDs for approved existing assets
- validated asset-registry and manifest matching
- LOD/export metadata resolution for already-approved assets
- fail-closed rejection for missing, incompatible, or identity-mismatched assets

New developer-only module:

- `client/developer-only-atlas-controlled-existing-asset-binding-contract.mjs`

New focused test:

- `tests/client-developer-only-atlas-controlled-existing-asset-binding-contract.test.mjs`

Verified existing approved assets used in this phase:

- `TREE_EUCALYPTUS_001`
- `TREE_BOTTLEBRUSH_001`
- `SHRUB_COASTAL_LOW_001`
- `BUILDING_CIVIC_SPORTS_PAVILION_001`

Controlled binding flow:

- validated Atlas placement
- dry-run execution contract
- selected existing asset ID
- approved asset registry and existing manifest record
- resolved LOD and GLB identity
- controlled binding result

Controlled binding diagnostics exposed:

- `existingAssetBindingId`
- `selectedExistingAssetId`
- `assetRegistryMatchStatus`
- `assetManifestMatchStatus`
- `resolvedLodProfile`
- `resolvedGlbIdentity`
- `existingAssetBindingStatus`
- `existingAssetBindingReason`

Validation proof:

- selected asset ID must exist in the approved Asset Factory registry
- selected asset must match the planned Atlas family/type seam
- manifest/version identity must match the registry record
- LOD/export metadata must resolve deterministically
- invalid or missing assets fail closed
- same input returns the same binding result

Fail-closed reasons preserved:

- `EXISTING_ASSET_BINDING_DRY_RUN_NOT_COMPLETED`
- `UNKNOWN_ASSET_ID`
- `EXISTING_ASSET_MANIFEST_NOT_FOUND`
- `INCOMPATIBLE_MODULAR_ASSET_BINDING`
- `EXISTING_ASSET_BINDING_PLACEMENT_INTENT_UNAVAILABLE`
- `EXISTING_ASSET_MANIFEST_IDENTITY_MISMATCH`
- `EXISTING_ASSET_LOD_PROFILE_MISMATCH`

Safety proof:

- DO NOT generate new assets
- DO NOT launch Blender
- DO NOT write GLB files
- DO NOT activate renderer
- DO NOT attach to the live map
- DO NOT change startup behavior

Preserved canonical safety flags:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

This phase remains developer-only and planning-only. It proves Atlas can bind to an approved existing asset record without creating new assets, modifying files, or activating runtime rendering.
