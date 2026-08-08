# GROWGO SESSION 212.26 — SETTLEMENT IDENTITY AND STYLE COHESION RULES

## Goal

Add a developer-only settlement identity layer so Atlas can keep a consistent local character across buildings, vegetation, streetscape, and future asset hooks without activating runtime rendering.

## Supported settlement identity profiles

- `coastal_village`
- `rural_town`
- `suburban_community`
- `urban_district`
- `heritage_town`
- `industrial_area`

## Style cohesion rules

The settlement identity layer resolves deterministic:

- architecture influence
- vegetation influence
- streetscape influence
- palette direction

It also prepares future Asset Factory hooks for:

- asset family selection
- colour palette selection
- material family selection
- building variants

## Regional consistency

The rules preserve deterministic variation while preventing incompatible style mixing across coastal, rural, suburban, urban, heritage, and industrial contexts.

## Diagnostics

Frozen serializable diagnostics expose:

- `settlementIdentityId`
- `styleProfileId`
- `paletteProfileId`
- `architecturalInfluence`
- `cohesionReason`

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

1. settlement identity stable
2. style cohesion deterministic
3. palette selection stable
4. regional transitions valid
5. budgets preserved
6. automatic controller regression remains green
