# GrowGo Atlas Phase 212.71 — Existing-Asset World Placement Packet

Status: PASS

Branch:
- `feature/atlas-phase-211-6-gated-map-attachment-controller`

ELI5:
- Atlas already knew which approved existing asset it wanted.
- This phase turns that successful binding into a deterministic placement packet that says exactly where the asset belongs and which already-approved LOD/GLB identity it uses.
- It still does not render, attach to the map, load GLBs, or generate files.

What this phase adds:

- a developer-only existing-asset world placement packet seam
- deterministic packet IDs
- deterministic world-position and heading/scale reuse from the existing Atlas placement seam
- strict LOD and GLB identity matching against the approved existing-asset record
- fail-closed rejection for invalid coordinates, invalid transforms, and identity mismatches

New developer-only module:

- `client/developer-only-atlas-existing-asset-world-placement-packet.mjs`

New focused test:

- `tests/client-developer-only-atlas-existing-asset-world-placement-packet.test.mjs`

Required flow:

- validated Atlas placement
- successful existing-asset binding
- source world coordinate
- deterministic transform
- resolved LOD
- resolved GLB identity
- world placement packet

World placement packet diagnostics exposed:

- `worldPlacementPacketId`
- `selectedExistingAssetId`
- `sourceFeatureId`
- `latitude`
- `longitude`
- `worldPosition`
- `rotation`
- `heading`
- `scale`
- `resolvedLodProfile`
- `resolvedGlbIdentity`
- `placementTransformStatus`
- `worldPlacementStatus`
- `worldPlacementReason`

Validation proof:

- existing asset binding must already be successful
- coordinate must be valid
- transform must be deterministic
- LOD identity must match the bound asset
- GLB identity must match the bound asset manifest
- malformed transform fails closed
- incompatible or missing asset fails closed
- same input returns the same packet

Transform reuse proof:

- reuses the existing deterministic multi-asset coordinate projection seam
- reuses the existing deterministic rotation rules
- reuses the existing deterministic scale rules
- does not invent a second projection system
- does not weaken existing transform validation

Fail-closed reasons preserved:

- `EXISTING_ASSET_BINDING_NOT_SUCCESSFUL`
- `INVALID_WORLD_PLACEMENT_COORDINATE`
- `UNKNOWN_ASSET_ID`
- `INVALID_WORLD_PLACEMENT_TRANSFORM`
- `BOUND_LOD_IDENTITY_MISMATCH`
- `BOUND_GLB_IDENTITY_MISMATCH`
- `EXISTING_ASSET_MANIFEST_NOT_FOUND`

Safety proof:

- DO NOT activate renderer
- DO NOT attach to the live map
- DO NOT create Canvas, DOM, or Leaflet ownership
- DO NOT load GLB binaries
- DO NOT launch Blender
- DO NOT generate files
- DO NOT add startup behavior

Preserved canonical safety flags:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

This phase remains developer-only and planning-only. It proves Atlas can carry an approved existing asset binding all the way into a deterministic world placement packet without enabling runtime rendering or asset generation.
