# GROWGO SESSION 212.31 — SPECIAL-SITE ACCENT RULES

## Goal

Add a developer-only special-site layer so Atlas can describe deterministic accent treatment for corners, landmarks, and special locations without activating runtime rendering.

## Supported accent contexts

### Corner lots

- dual frontage
- visibility priority
- accent landscaping
- special orientation

### Local landmarks

- historic buildings
- community icons
- scenic locations

### Tourist and special locations

- beaches
- waterfalls
- lookouts
- achievement locations

## Asset hooks

This layer prepares planning-only hooks for:

- landmark family
- accent variant
- special material profile

## Diagnostics

Frozen serializable diagnostics expose:

- `specialSiteType`
- `landmarkAccentProfileId`
- `cornerLotAccentId`
- `visibilityPriority`
- `specialSiteReason`

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

1. corner lot stable
2. landmark accent stable
3. special locations deterministic
4. incompatible accents rejected
5. budgets preserved
6. automatic controller regression remains green
