# GROWGO SESSION 212.13A — AUTOMATIC POPULATION ENABLE AUTH ALIGNMENT FIX

## Goal

Fix the narrow authorization mismatch that caused developer-only automatic Atlas population enablement to reject a healthy, already attached persistent Atlas session as unauthorized.

## Root cause

The automatic population toggle was validating the persistent session against an outdated authorization shape.

It treated enablement as valid only when:

- `authorizationState === "authorized"`

But the proven live persistent attach flow transitions to:

- `authorizationState = "attach_permission_consumed"`
- `attachPermissionConsumed = true`

after a successful attach.

That meant the real Safari post-attach state:

- attached
- attached idle
- redraw allowed
- canvas/pane/listener ownership healthy

was still being rejected at the automatic enable gate with:

- `PERSISTENT_ATLAS_UNAUTHORIZED`

## Narrow fix applied

Updated:

- [client/developer-only-controlled-automatic-atlas-population-toggle.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-controlled-automatic-atlas-population-toggle.mjs)

Changes:

1. The toggle now accepts the canonical persistent authorization states needed across the attach boundary:
   - `active`
   - `authorized`
   - `attach_permission_consumed`

2. The post-attach state is now explicitly valid only when:
   - `authorizationState = attach_permission_consumed`
   - `attachPermissionConsumed = true`

3. The persistent status sanitizer now preserves the fields the enable gate actually needs:
   - `attachPermissionConsumed`
   - `retainedSurfaceState`

4. The enable preconditions now use one narrow gate-reason resolver so failures report the exact boundary:
   - `PERSISTENT_ATLAS_UNAUTHORIZED`
   - `PERSISTENT_ATLAS_NOT_ATTACHED`
   - `PERSISTENT_ATLAS_REDRAW_NOT_ALLOWED`
   - `PERSISTENT_ATLAS_REVOKED`
   - `PERSISTENT_ATLAS_EXPIRED`
   - readiness failure reason passthrough, such as `REGION_OUT_OF_SCOPE`
   - `PERSISTENT_ATLAS_IDENTITY_MISMATCH`
   - `PERSISTENT_SURFACE_OR_LIFECYCLE_UNAVAILABLE`

## What did not change

This phase did not change:

- persistent authorization logic
- persistent manual preview authorization
- readiness rules
- identity rules
- renderer behavior
- listener contracts
- controller coalescing/state machine
- cleanup ownership/order
- canonical safety flags

## Focused proof

The updated tests prove:

- enable is blocked before authorization
- enable is blocked after authorization but before attach
- enable succeeds for the canonical attached post-attach state
- enable succeeds when `attached_idle`
- redraw permission is still required
- invalidated state remains blocked
- revoked state remains blocked
- expired state remains blocked
- identity drift remains blocked
- readiness drift remains blocked
- duplicate enable remains harmless
- no duplicate listeners are created
- no immediate auto-population happens on enable
- no startup activation occurs
- no auto-attach occurs
- no auto-authorize occurs
- all four canonical safety flags remain false

## Safari implication

This fix aligns the automatic population toggle with the same attached persistent Atlas authorization state that real Safari already proved healthy in Phase 212.13.

Manual Safari retry is still required to confirm:

- automatic enable now succeeds live
- listeners install live
- event-driven repopulation works
- moveend / zoomend / resize / coalescing / determinism all verify cleanly

