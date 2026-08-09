# GrowGo Atlas Session 212.75 — Controlled Existing Asset Load Dependency Bridge

Status: developer-only eucalyptus asset-load dependency bridge added and wired into the existing one-asset live-draw diagnostics path.

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

## ELI5

The one-asset live draw path already knew how to authorize, validate the handoff, and fail safely. What it was missing was the tiny “yes, this exact approved tree asset is the one we’re allowed to use” seam. We added that seam for `TREE_EUCALYPTUS_001` only.

## Scope

This bridge supports only:

- `TREE_EUCALYPTUS_001`

It reuses:

- the approved existing-asset record
- the existing eucalyptus runtime preview binding definition
- the existing 212.73 command
- the existing 212.74 browser diagnostics wiring

It does not create:

- a second asset loader architecture
- automatic startup loading
- population loops
- all-asset attachment behavior

## What the bridge validates

On explicit draw use, the bridge validates:

- asset identity
- GLB identity
- LOD identity
- manifest identity

If any check fails, the bridge will fail closed.

## Diagnostics exposed

The browser-facing one-asset live draw status now carries:

- `oneAssetLiveDrawAssetLoadDependencyStatus`
- `selectedAssetLoaderId`
- `selectedExistingAssetId`
- `resolvedGlbIdentity`
- `assetLoadDependencyReason`

These diagnostics stay frozen and serializable.

## Current browser outcome after this phase

The missing asset-load dependency is now available.

If the renderer submit seam is still unavailable, the browser path now blocks one step later with the preserved renderer-submit reason instead of the previous asset-load dependency-unavailable reason.

## Safety preservation

Canonical safety flags remain:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Manual verification note

This phase only adds the missing eucalyptus-only load dependency seam. It does not claim that Safari has already completed a live rendered asset draw. Manual Safari verification is still required for the next live step.
