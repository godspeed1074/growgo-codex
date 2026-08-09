# GrowGo Atlas Session 212.76 — Controlled Renderer Submit Dependency Bridge

Status: developer-only eucalyptus renderer-submit dependency bridge added and wired into the existing one-asset live draw path.

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

## ELI5

The one-asset live draw path already knew how to authorize the request, validate the asset, and validate the renderer handoff. What it still lacked was the tiny submit seam that says “this exact approved eucalyptus asset can be handed into the existing passive renderer consumer contract.”

This phase adds only that seam.

## Scope

This bridge supports only:

- `TREE_EUCALYPTUS_001`

It reuses:

- the existing controlled renderer handoff
- the existing controlled asset-load dependency bridge
- the existing discovered Custom 2.5D renderer consumer descriptor
- the existing passive renderer consumer contract

It does not create:

- a second renderer
- a new Canvas path
- startup drawing
- automatic drawing
- timers
- population loops

## What the bridge validates

On explicit draw use, the bridge validates:

- renderer handoff validity
- loaded asset validity
- transform validity
- renderer identity
- submit dependency existence

If any check fails, the bridge will fail closed.

## Diagnostics exposed

The browser-facing one-asset live draw status now carries:

- `oneAssetLiveDrawRendererSubmitDependencyStatus`
- `rendererSubmitDependencyId`
- `rendererSubmitAvailabilityStatus`
- `selectedExistingAssetId`
- `rendererSubmitReason`

These diagnostics stay frozen and serializable.

## Current browser outcome after this phase

The missing renderer-submit dependency is now available for the developer-only eucalyptus one-asset live draw path.

This bridge submits through the existing passive renderer consumer seam and returns one controlled submitted result without adding automatic execution.

## Safety preservation

Canonical safety flags remain:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Manual verification note

This phase adds the missing renderer-submit dependency bridge only. It does not claim that a real Safari live visual asset draw has already been manually verified. Manual Safari verification is still required.
