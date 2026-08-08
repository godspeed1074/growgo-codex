# GROWGO SESSION 212.23 — OPEN SPACE, CIVIC FOREGROUND, AND LANDMARK FRAMING RULES

## Goal

Add a developer-only open-space and landmark-framing layer so Atlas can give important places the right foreground, sight lines, and usable open areas.

## Supported civic foreground cases

- sports/community sites
- schools
- churches

Rules include:

- entry area
- open foreground
- approach direction
- vegetation / landscape framing

## Supported landmark framing cases

- landmark buildings
- scenic points
- special locations

Rules include:

- visibility preservation
- supporting landscape
- open sight lines

## Supported open-space and recreation behavior

- preserve usable areas
- prevent over-density
- maintain paths and gathering zones
- support sports fields
- support playground / gathering spaces

## Diagnostics

Frozen serializable diagnostics expose:

- `landmarkFramingRuleId`
- `foregroundType`
- `approachDirection`
- `openSpaceRatio`
- `visibilityReason`

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

1. civic foreground stable
2. landmark framing stable
3. open space preserved
4. recreation rules stable
5. same input same output
6. budgets preserved
7. automatic controller regression remains green
