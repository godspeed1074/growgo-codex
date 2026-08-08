# GROWGO SESSION 212.27 — ASSET FAMILY AND MATERIAL COHESION HOOKS

## Goal

Add a developer-only cohesion layer that connects settlement identity decisions to future Modular Bible asset families and material palettes without activating runtime rendering.

## Supported asset families

- `residential`
- `commercial`
- `civic`
- `vegetation`
- `street_furniture`

## Supported material families

- `roof`
- `wall`
- `trim`
- `road`
- `vegetation_palette`

## Cohesion rules

The cohesion layer resolves deterministic hooks for:

- settlement identity to compatible asset family selection
- biome and local-character influence on material direction
- deterministic palette retention
- fail-closed incompatible style combinations

## Diagnostics

Frozen serializable diagnostics expose:

- `assetFamilyId`
- `materialFamilyId`
- `paletteProfileId`
- `styleCompatibilityReason`
- `assetSelectionSeed`

No raw map, renderer, Canvas, DOM, browser callbacks, or mutable runtime objects are exposed.

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

1. settlement style selects valid assets
2. palette selection deterministic
3. incompatible styles rejected
4. same input same output
5. budgets preserved
6. automatic controller regression remains green
