# GROWGO SESSION 212.30 — SUPPORTING COMPOSITION RULES

## Goal

Add a developer-only supporting composition layer so Atlas can describe realistic small-scale details around clusters without activating runtime rendering.

## Supported supporting composition groups

### Streetside props

- signs
- mailboxes
- lamps
- benches
- planters
- bus stops

### Boundary composition

- fences
- hedges
- walls
- gates

### Entry composition

- driveways
- paths
- entrances
- forecourts

### Density tiers

- residential
- commercial
- civic
- pedestrian areas

## Diagnostics

Frozen serializable diagnostics expose:

- `supportingPropProfileId`
- `boundaryCompositionId`
- `entryCompositionId`
- `propDensityTier`
- `compositionReason`

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

1. prop selection stable
2. boundary rules valid
3. entry composition stable
4. density tiers deterministic
5. incompatible combinations rejected
6. budgets preserved
7. automatic controller regression remains green
