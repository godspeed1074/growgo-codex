# GROWGO SESSION 211.8 — CONTROLLED ONE-SESSION DEVELOPER MAP ATTACHMENT AUTHORIZATION

## Goal

Add a temporary developer-only key that can unlock one manual Atlas map-attachment session without changing the canonical safety flags.

## Branch And Preflight

- branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
- Phase 211.7 commit confirmed:
  - `test(atlas): complete default-denied live attachment evidence`
- working tree was clean before Phase 211.8 work
- relevant Phase 211.1 through 211.7 client tests passed before implementation

## Implemented Interfaces

Installed into `window.GrowGoDeveloperDiagnostics`:

- `authorizeAtlasMapAttachmentSession({ confirmation })`
- `revokeAtlasMapAttachmentSession()`
- `getAtlasMapAttachmentAuthorizationStatus()`

Reused existing interfaces:

- `attachAtlasMapDiagnostic()`
- `detachAtlasMapDiagnostic()`
- `getAtlasMapAttachmentStatus()`

## Implementation Shape

Created:

- [`client/developer-only-atlas-map-attachment-authorization.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-map-attachment-authorization.mjs)

Integrated with:

- [`client/developer-only-atlas-map-attachment-controller.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-map-attachment-controller.mjs)
- [`client/developer-only-live-map-centre-atlas-bridge.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-live-map-centre-atlas-bridge.mjs)
- [`client/development-alpha-app.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/development-alpha-app.mjs)

## Authorization Rules

The one-session authorization is:

- explicit developer invocation only
- local-development-host only
- confirmation-gated with:
  - `AUTHORIZE_ATLAS_ONE_SESSION`
- entirely in memory
- non-persistent
- automatically revoked on detach
- safe to revoke repeatedly
- incapable of mutating canonical safety flags

It does **not** use:

- localStorage
- sessionStorage
- IndexedDB
- cookies
- URL parameters
- file writes
- config writes

## Default Result

Default live state remains:

- authorization inactive
- `effectiveMapAttachmentAllowed = false`
- `attached = false`
- `ownedListenerCount = 0`
- `diagnosticInvocationCount = 0`

## Authorized Isolated Result

When locally authorized with the exact confirmation:

- `authorizationSource = developer-one-session-local`
- canonical permission remains false
- effective permission becomes true for the one active in-memory session
- exactly one `moveend` listener may be attached
- moveend diagnostics still reuse the existing live-map-centre bridge
- successful attachment is marked as consumed

## Detach And Revoke Behavior

- detach removes the exact controller-owned listener
- detach automatically revokes authorization
- reattach after detach fails closed until explicitly authorized again
- explicit revoke while attached detaches first, then revokes
- unrelated listeners remain untouched

## Persistence

- storage used: false
- fresh instance result: unauthorized
- page reload implication: fresh unauthorized state

## Focused Verification

Covered by:

- [tests/client-developer-only-atlas-map-attachment-authorization.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-atlas-map-attachment-authorization.test.mjs)

Checks include:

- interfaces exist
- default unauthorized state
- missing or incorrect confirmation blocked
- non-local host blocked
- exact local confirmation accepted
- immutable authorization and status results
- no canonical flag mutation
- no persistent storage
- one active session only
- exactly one successful attachment
- duplicate attach prevention
- moveend diagnostic operation through the existing bridge
- automatic revocation on detach
- reattach blocked after detach
- explicit revoke while detached safe
- explicit revoke while attached removes listener and revokes
- fresh-instance unauthorized behavior
- unrelated listener preservation
- no startup authorization
- no startup attachment
- no timers or polling
- no renderer
- no Canvas or DOM overlay
- no network request
- all four canonical flags remain false

## Canonical Safety Flags

Remain exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Why It Matters

This phase adds the smallest practical manual unlock for a single developer-only attachment session while keeping the real application fully blocked by default. It lets us verify controller mechanics on demand without normalizing broader runtime permission, persistence, or automatic map behavior.
