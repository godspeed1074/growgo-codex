# GROWGO SESSION 211.75h — Persistent Invalidation Status Read Fix

Date: 2026-08-07
Branch: feature/atlas-phase-211-6-gated-map-attachment-controller
Phase: 211.75h — Persistent Invalidation Status Read Fix

## Goal
Make developer-only persistent Atlas status reads safe after invalidation or other terminal authorization states, without re-running live readiness or identity checks that can throw after cleanup.

## Root cause
The persistent authorization status getter always called `refreshIdentityMatch()` during `getStatus()`. After an attached invalidation and cleanup, the live identity/readiness seam could legitimately throw (for example `REGION_OUT_OF_SCOPE`), and the read-only diagnostics path surfaced that throw instead of returning the already-preserved invalidated state.

## Fix applied
- Added a terminal-state guard in `client/developer-only-controlled-persistent-atlas-authorization.mjs` so status reads only refresh identity while authorization is still actively usable.
- For active sessions only, wrapped identity refresh in a narrow catch that normalizes readiness/identity failures into status:
  - no diagnostics throw
  - redraw permission drops to false
  - `currentIdentityMatchesBoundIdentity` becomes false
  - `lastFailureReason` preserves the normalized reason code
- Left invalidation detection, cleanup orchestration, redraw behavior, snapshot behavior, and rendering behavior unchanged.

## Verified behavior
- Invalidated status reads do not throw.
- `REGION_OUT_OF_SCOPE` remains visible as the preserved invalidation reason in integration status.
- Revoked and expired status reads do not re-run the identity seam.
- Repeated status reads are harmless.
- Cleanup completion, released references, and zero ownership remain inspectable after invalidation.
- Status remains frozen and serializable.
- Canonical safety flags remain false.

## Focused regression coverage
- persistent authorization
- persistent contract integration
- persistent manual command
- invalidation cleanup
- persistent map/readiness/identity wrappers
- persistent cleanup provider
- persistent hybrid verification

## Result
Status reads are now non-mutating and non-throwing for invalidated or terminal persistent sessions, while still preserving fail-closed identity refresh behavior for active sessions.
