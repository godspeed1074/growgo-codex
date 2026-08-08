# GROWGO SESSION 212.21 — ATLAS POPULATION PARCEL, FRONTAGE, AND LOT RULES

## Goal

Add a developer-only parcel and lot planning layer so Atlas can generate believable property layouts instead of only district- and corridor-level structure.

## Supported parcel patterns

- `standalone_lot`
- `corner_lot`
- `townhouse_row`
- `attached_terraced_lot`
- `rural_block`
- `shopfront_lot`
- `civic_forecourt_lot`

## Frontage rules

### Residential

- front yard
- house setback
- backyard

### Commercial

- shopfront
- frontage alignment
- service area

### Civic

- entry / forecourt
- open surrounding area

## Boundary planning

This phase prepares deterministic placeholders for future:

- fences
- hedges
- walls
- gates

## Diagnostics

Frozen serializable diagnostics expose:

- `parcelPatternId`
- `lotType`
- `frontageDirection`
- `frontageRoadId`
- `setbackDistance`
- `boundaryPattern`

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

1. parcel selection stable
2. frontage direction stable
3. lot patterns deterministic
4. corner lots resolve correctly
5. budgets preserved
6. automatic controller regression remains green
