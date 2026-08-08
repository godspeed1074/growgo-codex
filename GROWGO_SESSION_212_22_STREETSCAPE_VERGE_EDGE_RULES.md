# GROWGO SESSION 212.22 — STREETSCAPE, VERGE, AND EDGE CONDITION RULES

## Goal

Add a developer-only streetscape planning layer so Atlas can assign believable road-edge character, verge types, and boundary conditions to generated areas.

## Supported streetscape profiles

- `suburban`
- `rural`
- `coastal`
- `town_center`
- `industrial`

## Supported verge rules

- `grass_verge`
- `native_verge`
- `urban_footpath_edge`
- `natural_edge`

## Supported edge conditions

- `fence_placeholder`
- `hedge_placeholder`
- `wall_placeholder`
- `open_boundary`

## Street furniture preparation

This phase prepares deterministic, future-binding-ready placeholder streetscape output for:

- verge-edge furniture bands
- roadside marker positions
- town-center edge furniture lines
- civic/open-edge placeholder zones

## Diagnostics

Frozen serializable diagnostics expose:

- `streetscapeProfileId`
- `vergeType`
- `edgeConditionType`
- `streetFurnitureProfile`
- `streetscapeReason`

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

1. streetscape selection stable
2. verge selection deterministic
3. edge conditions stable
4. profiles vary correctly
5. budgets preserved
6. automatic controller regression remains green
