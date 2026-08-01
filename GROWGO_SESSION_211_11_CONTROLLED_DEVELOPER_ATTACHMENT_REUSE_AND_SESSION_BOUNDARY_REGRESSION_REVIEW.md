# GROWGO SESSION 211.11 — CONTROLLED DEVELOPER ATTACHMENT REUSE AND SESSION-BOUNDARY REGRESSION REVIEW

## Goal

Prove through isolated regression coverage that separate developer-only Atlas authorization sessions do not leak listeners, authorization state, or persistence across session boundaries.

## Preflight

- branch confirmed:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- `git status --short` before Phase 211.11 work:
  - clean
- Phase 211.10 evidence commit confirmed at `HEAD`:
  - `test(atlas): close out one-session localhost attachment evidence`
- relevant Phase 211.6 through 211.10 tests:
  - `PASS`

## Repository Review

- defect found:
  - `not found`
- implementation files changed:
  - `none`
- scope of change:
  - focused regression test only
  - session report only

## Files Reviewed

- [`client/developer-only-atlas-map-attachment-controller.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-map-attachment-controller.mjs)
- [`client/developer-only-atlas-map-attachment-authorization.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-map-attachment-authorization.mjs)
- [`client/development-alpha-app.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/development-alpha-app.mjs)
- [`tests/client-developer-only-atlas-map-attachment-controller.test.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-atlas-map-attachment-controller.test.mjs)
- [`tests/client-developer-only-atlas-map-attachment-authorization.test.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-atlas-map-attachment-authorization.test.mjs)
- [`GROWGO_SESSION_211_9_MANUAL_LOCALHOST_ONE_SESSION_ATLAS_ATTACHMENT_VERIFICATION.md`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_211_9_MANUAL_LOCALHOST_ONE_SESSION_ATLAS_ATTACHMENT_VERIFICATION.md)

## Actual Lifecycle Semantics Discovered

### Authorization session identity

- session identity is per authorization instance
- first successful session in one page instance:
  - `ATLAS_ONE_SESSION_001`
- second successful session in the same page instance:
  - `ATLAS_ONE_SESSION_002`
- a fresh page instance starts with:
  - `sessionId = null`
- no session ID persists across a fresh page instance

### Listener ownership behavior

- controller owns exactly one `moveend` listener when attached
- duplicate attach returns:
  - `ALREADY_ATTACHED`
- duplicate attach does not add a second owned listener
- detach removes the exact controller-owned listener
- revoke while attached first detaches, then revokes authorization
- unrelated listeners on the same map remain installed
- no stale listener from Session A remains in Session B

### Counter semantics

Current behavior is:

- `diagnosticInvocationCount` belongs to the controller instance, not the authorization session
- the counter increments for each controller-owned `moveend` diagnostic while attached
- the counter remains available after detach within the same page/controller instance
- a later Session B in the same page/controller instance reuses the same counter
- a fresh controller instance resets:
  - `diagnosticInvocationCount = 0`
  - `lastDiagnosticStatus = null`
  - `lastReasonCode = null`

This behavior is consistent with the current implementation and did not require correction.

### Authorization consumption behavior

- successful attach marks:
  - `successfulAttachmentConsumed = true`
- detach revokes authorization
- post-detach reattach is blocked until a new explicit authorization
- Session B receives a distinct new session ID and does not inherit consumed authorization from Session A

## Session A Regression Result

- authorization result:
  - `AUTHORIZED_ONE_SESSION`
- session ID:
  - `ATLAS_ONE_SESSION_001`
- listener count while attached:
  - `1`
- controlled diagnostic count after one event:
  - `1`
- last diagnostic status:
  - `resolved`
- last reason code:
  - `RESOLVED`
- detach result:
  - `DETACHED`
- owned listener count after detach:
  - `0`
- authorization after detach:
  - inactive
- reattach result after detach:
  - `MAP_ATTACHMENT_NOT_AUTHORIZED`

## Session B Regression Result

- distinct session result:
  - `ATLAS_ONE_SESSION_002`
- distinct from Session A:
  - `yes`
- exactly one controller-owned listener while attached:
  - `yes`
- no Session A owned listener remains:
  - `yes`
- duplicate attach adds no listener:
  - `yes`
- controlled diagnostic count after one Session B event:
  - controller count advanced from `1` to `2`
- revoke while attached result:
  - `REVOKED`
- revoke detached active attachment:
  - `DETACHED`
- owned listener count after revoke:
  - `0`
- unrelated listener preservation:
  - preserved
- later attach without new authorization:
  - blocked

## Fresh-Page Boundary Result

- authorization state:
  - unauthorized
- attachment state:
  - detached
- owned listener count:
  - `0`
- session ID:
  - `null`
- successful attachment consumed:
  - `false`
- diagnostic count:
  - `0`
- last diagnostic status:
  - `null`
- last reason code:
  - `null`
- persistence result:
  - none

## Safety Review

Canonical safety flags remained exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Confirmed in regression coverage:

- no automatic authorization
- no automatic attachment
- no storage or persistence
- no timers or polling
- no renderer activity
- no Canvas, WebGL, or DOM overlay creation
- no Atlas network request
- no new map event types

## Outcome

- broad implementation change needed:
  - `no`
- smallest correct action:
  - add isolated session-boundary regression proof
- overall Phase 211.11:
  - `PASS`
