# GROWGO SESSION 212.20 — POPULATION CORRIDOR AND BLOCK CONNECTIVITY RULES

## Goal

Add a developer-only corridor and connectivity layer so Atlas can connect districts like a real settlement instead of leaving them as isolated planning islands.

## Supported corridor types

- `arterial`
- `collector`
- `local`
- `pedestrian`
- `green_corridor`

## Connectivity responsibilities

The connectivity layer adds deterministic:

- district connectivity
- block relationships
- transition corridors
- movement priority

Supported transition examples:

- residential to commercial
- residential to recreation
- settlement to coastal edge

## Diagnostics

Frozen serializable diagnostics expose:

- `corridorId`
- `corridorType`
- `connectedDistrictIds`
- `connectivityReason`
- `movementPriority`

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

1. corridor selection stable
2. district connections deterministic
3. isolated regions handled safely
4. same input same output
5. budgets preserved
6. automatic controller regression remains green
