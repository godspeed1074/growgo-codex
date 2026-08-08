# GROWGO SESSION 212.19 — ATLAS POPULATION DISTRICT AND SETTLEMENT COMPOSITION

## Goal

Add a developer-only district composition layer so Atlas can generate coherent settlements made from multiple neighbourhoods instead of isolated contextual features.

## Supported district types

- `residential`
- `commercial`
- `civic`
- `recreation`
- `coastal_natural`
- `mixed_use`

## Deterministic settlement composition

The district composition layer adds deterministic:

- district selection
- neighbourhood assignment
- density weighting
- green-space relationships
- transition boundaries

## Supported district transition examples

- `residential_to_commercial`
- `residential_to_park`
- `coastal_to_settlement_edge`

## Diagnostics

Frozen serializable diagnostics expose:

- `districtId`
- `districtType`
- `settlementPatternId`
- `districtTransitionReason`
- `compositionSeed`

No raw map, renderer, Canvas, DOM, or mutable browser objects are exposed.

## Preservation rules

This phase preserves:

- deterministic output
- command budgets
- developer-only operation
- renderer isolation
- safety gates

## Safety flags

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Verification intent

Focused regression must prove:

1. district selection stable
2. settlement composition deterministic
3. transitions stable
4. mixed-use districts valid
5. budgets preserved
6. automatic controller regression remains green
