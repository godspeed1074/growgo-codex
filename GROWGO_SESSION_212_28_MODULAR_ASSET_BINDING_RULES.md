# GROWGO SESSION 212.28 — MODULAR ASSET BINDING RULES

## Goal

Add a developer-only modular asset binding layer that connects Atlas planning decisions to deterministic Modular Bible asset selection without activating runtime rendering.

## Supported variant selection groups

- `residential`
- `commercial`
- `civic`
- `vegetation`
- `street_furniture`

## Binding rules

The modular binding layer resolves deterministic:

- variant selection
- location-based variation
- style-compatible selection
- lot and context influence

It connects:

- `assetFamilyId`
- `selectedAssetId`
- `assetVariantId`
- `paletteProfileId`
- `materialFamilyId`

## Repetition control

The rules avoid identical neighbouring variants where compatible alternatives exist, while preserving deterministic output.

## LOD preparation

The binding layer prepares planning-only LOD identities for:

- `close`
- `medium`
- `distant`

## Diagnostics

Frozen serializable diagnostics expose:

- `selectedAssetId`
- `assetVariantId`
- `variantSelectionReason`
- `materialAssignmentId`
- `lodProfileId`

No raw map, renderer, Canvas, DOM, or mutable runtime objects are exposed.

## Preservation rules

This phase preserves:

- deterministic output
- command budgets
- developer-only planning
- renderer isolation
- safety gates

## Safety flags

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Verification intent

Focused regression must prove:

1. variant selection stable
2. same location same asset
3. neighbouring variation valid
4. incompatible assets rejected
5. budgets preserved
6. automatic controller regression remains green
