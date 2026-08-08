# GROWGO SESSION 212.24 — ATLAS POPULATION BIOME BLENDING AND LOCAL CHARACTER RULES

## Goal

Add a developer-only biome and local-character layer so Atlas can make generated places feel locally appropriate without changing live renderer behavior.

## Supported biome profiles

- `coastal`
- `rural`
- `suburban`
- `urban`
- `wetland`
- `forest`

## Character responsibilities

This phase adds deterministic planning hooks for:

- vegetation density
- species bias
- edge behavior
- nearby biome influence blending
- architectural family hints
- colour / material palette selection hooks

## Diagnostics

Frozen serializable diagnostics expose:

- `biomeProfileId`
- `localCharacterProfileId`
- `blendWeights`
- `characterReason`
- `regionalStyleSeed`

No raw map, renderer, Canvas, DOM, or mutable browser objects are exposed.

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

1. biome selection stable
2. blending deterministic
3. coastal / rural / urban differences valid
4. same input same output
5. budgets preserved
6. automatic controller regression remains green
