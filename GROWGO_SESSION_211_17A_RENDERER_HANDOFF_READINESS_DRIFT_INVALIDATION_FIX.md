# GROWGO SESSION 211.17A — RENDERER HANDOFF READINESS DRIFT INVALIDATION FIX

## Goal

Fix the renderer-handoff authorization contract so the first readiness mismatch permanently invalidates that session. Returning to the approved coordinate must not repair the old session.

## Preflight

- current branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- required implementation commit confirmed at `HEAD` history:
  - `c11a1cc feat(atlas): add one-session developer renderer handoff authorization`
- Phase 211.17 pending evidence template commit state:
  - `not committed before this repair`
- focused renderer-handoff authorization and readiness tests before code changes:
  - `PASS`

## Defect

Safari evidence showed:

- session `ATLAS_RENDERER_HANDOFF_ONE_SESSION_001` authorized correctly
- drift to out-of-scope correctly disabled effective permission
- moving back to the approved Bellarine coordinate incorrectly restored effective permission on the same session

That violated the intended one-session contract.

## Fix

Added an irreversible session-scoped invalidation latch inside:

- [`client/developer-only-atlas-renderer-handoff-authorization.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-renderer-handoff-authorization.mjs)

New persisted per-session state:

- `authorizationInvalidated`
- `invalidationReasonCode`
- `invalidatedAtReadinessReasonCode`

Behavior now:

- first readiness mismatch latches invalidation
- latched invalidation survives later matching readiness
- invalidated session cannot be consumed
- duplicate authorization does not repair the invalid session
- explicit revoke clears session-owned invalidation state
- fresh explicit authorization receives a distinct new session ID

## Evidence Handling

Updated:

- [`GROWGO_SESSION_211_17_MANUAL_LOCALHOST_RENDERER_HANDOFF_AUTHORIZATION_VERIFICATION.md`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_211_17_MANUAL_LOCALHOST_RENDERER_HANDOFF_AUTHORIZATION_VERIFICATION.md)

The Phase 211.17 record now honestly preserves:

- first Safari attempt failed
- defect session ID:
  - `ATLAS_RENDERER_HANDOFF_ONE_SESSION_001`
- exact failure label:
  - `FAIL — READINESS_DRIFT_PERMISSION_RESTORED`
- fresh Safari retest still required

## Focused Coverage

Regression now verifies:

- approved readiness authorizes successfully
- first readiness drift permanently invalidates the active session
- exact invalidation reason is retained
- returning to approved scope does not restore permission
- invalidated session cannot be consumed
- duplicate authorization does not repair the old session
- explicit revoke clears invalidation state
- fresh authorization gets a distinct session ID
- additional region, package, recipe, selector-seed, renderer, invalid-diagnostic, and missing-readiness drift cases fail closed

## Safety

Canonical safety flags remain exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Confirmed:

- renderer initialized:
  - `no`
- renderer attached:
  - `no`
- draw called:
  - `no`
- canvas created:
  - `no`
- WebGL created:
  - `no`
- overlay created:
  - `no`
- listener added:
  - `no`
- polling or timer added:
  - `no`
- network requested:
  - `no`
- asset download requested:
  - `no`

## Outcome

- overall phase:
  - `PASS`
