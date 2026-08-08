# GrowGo Atlas Phase 212.62 — Attachment Metadata and GLB Preparation

Status: PASS

Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
Add a developer-only deterministic metadata bridge between Atlas component surface mappings and future Blender/GLB asset generation.

What this phase adds:

- `attachmentMetadataProfileId`
- `glbPreparationProfileId`
- `socketMetadataCount`
- `componentMetadataCount`
- `attachmentMetadataReason`

Supported planning seam:

1. surface mapping
2. component anchor set
3. component recipe
4. asset assembly profile
5. attachment metadata / GLB preparation contract

Behavior:

- deterministic socket metadata per approved component seam
- reusable GLB preparation profile IDs
- fail-closed rejection for invalid anchor, recipe, or assembly mismatches
- planning-only metadata preparation
- no renderer activation
- no Canvas, DOM, Leaflet, or browser-object exposure

Approved metadata families covered:

- coastal vegetation
- compact coastal vegetation
- heritage civic
- compact heritage civic
- urban commercial
- rural residential
- industrial edge
- compact industrial edge

Fail-closed reasons:

- `ATTACHMENT_METADATA_SURFACE_MAPPING_NOT_FOUND`
- `ATTACHMENT_METADATA_ANCHOR_SET_INCOMPATIBLE`
- `ATTACHMENT_METADATA_COMPONENT_RECIPE_INCOMPATIBLE`
- `ATTACHMENT_METADATA_ASSEMBLY_PROFILE_INCOMPATIBLE`
- `ATTACHMENT_METADATA_GLB_PREPARATION_UNAVAILABLE`

Planner integration:

- planner status exposes frozen serializable attachment metadata fields
- resolved feature recipes carry attachment metadata fields
- planner decisions include `attachmentMetadataDecisions`

Safety proof:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

This phase remains developer-only and planning-only. It prepares metadata for future Blender/GLB workflows without enabling live export or rendering behavior.
