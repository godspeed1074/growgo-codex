# GrowGo Session 212.5a — Persistent Live Preview Authorization Alignment Fix

Status: PASS

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

## Goal

Fix the narrow live preview authorization mismatch where persistent Atlas is already authorized, attached, idle, redraw-authorized, and healthy, but:

- `previewAtlasAssetPopulation(...)`

still fails closed with:

- `ATLAS_NOT_AUTHORIZED`

## Root cause

The preview module was checking the wrong authorization phase.

It only accepted:

- `authorizationState = active`

But the real, correct post-attach persistent state is:

- `authorizationState = attach_permission_consumed`
- `attachPermissionConsumed = true`
- `redrawPermissionAllowed = true`
- `attached = true`
- `integrationState = attached_idle`

That meant the preview gate was incorrectly treating a valid attached persistent session as unauthorized.

## Exact fix

Updated `client/developer-only-atlas-asset-population-preview.mjs` so preview authorization now aligns with the real attached persistent contract.

The preview precondition now:

- preserves the sanitized persistent fields needed for live gating:
  - `attachPermissionConsumed`
  - `revoked`
  - `invalidated`
  - `expired`
  - `retainedSurfaceState`
  - `lifecycleOwnerId`
  - `detaching`
- explicitly accepts the canonical attached session state:
  - `authorizationState = attach_permission_consumed`
- no longer requires `authorizationState = active` after attach
- requires:
  - local development host
  - attached persistent Atlas
  - `integrationState = attached_idle`
  - `attachPermissionConsumed = true`
  - `redrawPermissionAllowed = true`
  - one Canvas
  - one pane
  - three listeners
  - retained surface ready
  - lifecycle owner present
  - persistent identity/session fields present
- preserves more specific failure reasons when blocked:
  - `ATLAS_NOT_AUTHORIZED`
  - `ATLAS_NOT_ATTACHED`
  - `ATLAS_REDRAW_NOT_ALLOWED`
  - `ATLAS_INVALIDATED`
  - `ATLAS_REVOKED`
  - `ATLAS_EXPIRED`
  - `ATLAS_IDENTITY_MISMATCH`
  - `ATLAS_READINESS_BLOCKED`

## Live attached-state proof covered by tests

Focused tests now prove preview succeeds for the real Safari-shaped persistent state:

- `integrationState = attached_idle`
- `authorizationState = attach_permission_consumed`
- `attachPermissionConsumed = true`
- `redrawPermissionAllowed = true`
- `attached = true`
- `sessionId` present
- `retainedSurfaceState = ready`
- `lifecycleOwnerId` present
- `ownedCanvasCount = 1`
- `ownedPaneCount = 1`
- `ownedListenerCount = 3`

## Failure preservation proof

Focused tests also prove preview still blocks correctly when:

- authorization has not happened
- authorization happened but attach has not
- redraw is not allowed
- session identity is missing
- identity drift is present
- authorization is revoked
- authorization is expired
- authorization is invalidated

No automatic reauthorization, second attach, one-frame fallback, or startup behavior was introduced.

## Safety

Canonical safety flags remain:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Result

Phase 212.5a aligns the live preview authorization gate with the real persistent Atlas attached-session contract, eliminating the false unauthorized rejection path that blocked the Phase 212.5 Safari preview attempt.
