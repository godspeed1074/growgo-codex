# GROWGO SESSION 212.29 — MICRO-CLUSTER AND ADJACENCY VARIATION RULES

## Goal

Add a developer-only micro-cluster layer so Atlas can describe believable small asset groupings without activating runtime rendering.

## Supported cluster types

- `residential`
- `coastal`
- `commercial`
- `civic`

## Cluster rules

The micro-cluster layer resolves deterministic:

- child asset selection
- compatible adjacency rules
- variation without random output
- budget-aware cluster generation

Example planning contexts include:

- house + fence + vegetation
- house + native planting + buffer
- cafe/shop + frontage elements
- building + foreground + landscape

## Diagnostics

Frozen serializable diagnostics expose:

- `microClusterId`
- `clusterType`
- `childAssetCount`
- `adjacencyReason`
- `variationSeed`

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

1. cluster generation stable
2. adjacency rules valid
3. variation deterministic
4. incompatible combinations rejected
5. budgets preserved
6. automatic controller regression remains green
