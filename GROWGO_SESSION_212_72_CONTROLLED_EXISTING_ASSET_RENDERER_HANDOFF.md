# GrowGo Atlas Phase 212.72 — Controlled Existing-Asset Renderer Handoff

Status: PASS

Branch:
- `feature/atlas-phase-211-6-gated-map-attachment-controller`

ELI5:
- Atlas already knows which approved existing asset it wants and where it belongs.
- This phase turns that world-placement packet into a renderer-ready handoff descriptor without loading the asset or drawing anything.
- It stays on the existing zero-draw controlled renderer path and only says "ready" or "blocked."

What this phase adds:

- a developer-only controlled existing-asset renderer handoff seam
- deterministic renderer handoff packet IDs
- renderer-compatible placement descriptor preparation
- independent GLB and LOD identity checks at the renderer boundary
- fail-closed renderer handoff blocking for malformed or incompatible packets

New developer-only module:

- `client/developer-only-atlas-controlled-existing-asset-renderer-handoff.mjs`

New focused test:

- `tests/client-developer-only-atlas-controlled-existing-asset-renderer-handoff.test.mjs`

Required flow:

- valid world-placement packet
- renderer handoff validation
- renderer-compatible placement descriptor
- handoff ready or blocked

Renderer handoff diagnostics exposed:

- `rendererHandoffPacketId`
- `sourceWorldPlacementPacketId`
- `selectedExistingAssetId`
- `resolvedGlbIdentity`
- `resolvedLodProfile`
- `rendererPlacementDescriptorStatus`
- `rendererHandoffStatus`
- `rendererHandoffReason`

Validation proof:

- upstream world-placement packet must already be successful
- asset identity must remain unchanged
- GLB identity must remain unchanged
- LOD identity must remain unchanged
- transform must remain unchanged
- malformed packet fails closed
- renderer-incompatible descriptor fails closed
- same input returns the same handoff result

Renderer reuse proof:

- reuses the existing controlled zero-draw renderer consumer identity
- does not create a second renderer architecture
- does not request initialization, attachment, or draw
- keeps the renderer seam passive and developer-only

Fail-closed reasons preserved:

- `WORLD_PLACEMENT_PACKET_NOT_SUCCESSFUL`
- `INVALID_WORLD_PLACEMENT_PACKET`
- `INVALID_WORLD_PLACEMENT_TRANSFORM`
- `GLB_IDENTITY_MISMATCH`
- `LOD_IDENTITY_MISMATCH`
- `RENDERER_CONSUMER_UNAVAILABLE`
- `RENDERER_IDENTITY_MISMATCH`
- `RENDERER_INCOMPATIBLE_PLACEMENT_DESCRIPTOR`
- `EXISTING_ASSET_MANIFEST_NOT_FOUND`

Safety proof:

- DO NOT load GLB binaries
- DO NOT draw assets
- DO NOT create new Canvas or DOM ownership
- DO NOT attach to the live map
- DO NOT enable automatic execution
- DO NOT add startup behavior

Preserved canonical safety flags:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

This phase remains developer-only and zero-draw. It prepares a renderer-compatible placement descriptor from a valid existing-asset world packet while preserving the current controlled renderer safety boundary.
