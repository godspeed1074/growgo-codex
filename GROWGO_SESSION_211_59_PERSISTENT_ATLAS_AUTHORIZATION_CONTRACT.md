# GROWGO SESSION 211.59 — PERSISTENT ATLAS AUTHORIZATION CONTRACT

## Goal

Create a separate developer-only persistent authorization contract for persistent Atlas attachment.

This contract is intentionally separate from:

- one-frame renderer-handoff authorization
- one-frame consumption semantics
- one-frame command closure

This phase is fake-only and disconnected:

- no `window` exposure
- no live map access
- no Canvas creation
- no listeners
- no redraw scheduling
- no renderer invocation
- no startup behavior changes

## Created

- `client/developer-only-controlled-persistent-atlas-authorization.mjs`
- focused persistent authorization contract tests

## Required Confirmation

- `AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION`

This is distinct from:

- `AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION`

## State Model

- `inactive`
- `authorizing`
- `active`
- `attach_permission_consumed`
- `revoked`
- `invalidated`
- `expired`
- `failed_closed`

## Identity Binding

Each persistent authorization session is bound to:

- `sessionId`
- `mapIdentityId`
- `regionId`
- `packageId`
- `packageVersion`
- `packageFingerprint`
- `recipeId`
- `recipeVersion`
- `selectorSeed`
- `authorizationCreatedAt`
- `authorizationSource`

## Contract Rules

### Authorization

- local-development-only
- exact confirmation required
- one active persistent session maximum
- no storage
- no automatic authorization
- no startup authorization

### Attach Permission

- may be consumed exactly once
- does not end the persistent session
- leaves the session active for approved redraws while attached
- second attach consumption is blocked

### Redraw Permission

Allowed only when:

- authorization remains active
- attach permission was consumed
- controller is attached
- current identity matches the bound identity
- session is not revoked
- session is not invalidated
- session is not expired

### Revocation

- explicitly blocks future redraws immediately
- detach is still required by caller
- revocation remains observable in status

### Invalidation

Handled for:

- map identity drift
- region drift
- package fingerprint drift
- recipe drift
- selector-seed drift
- readiness blocked
- lifecycle-owner mismatch
- stale session

### Expiry

- supports injected expiry policy
- no real timers
- checked only during status/permission evaluation
- expired session cannot attach or redraw

## Required Reason Codes Covered

- `INVALID_CONFIRMATION`
- `NON_LOCAL_DEVELOPMENT_HOST`
- `AUTHORIZATION_ALREADY_ACTIVE`
- `AUTHORIZED_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION`
- `ATTACH_PERMISSION_CONSUMED`
- `ATTACH_PERMISSION_ALREADY_CONSUMED`
- `AUTHORIZATION_REVOKED`
- `AUTHORIZATION_INVALIDATED`
- `AUTHORIZATION_EXPIRED`
- `IDENTITY_MISMATCH`
- `READINESS_BLOCKED`
- `STALE_SESSION`
- `PERSISTENT_AUTHORIZATION_UNAVAILABLE`

## Diagnostics Contract

Frozen serializable status includes:

- authorization state flags
- local development / confirmation status
- session identity fields
- expiry / revoke / invalidate flags
- current identity match status
- attach consume counters
- redraw validation counters
- revoke / invalidate counters
- last failure reason
- canonical safety flags

Status contains no raw map, controller, lifecycle owner, or browser references.

## Proof Summary

Focused tests prove:

- exact confirmation required
- local-development-only
- single active persistent session
- one-frame authorization cannot satisfy persistent authorization
- attach permission consumed exactly once
- redraw allowed only after attach consumption and while attached
- redraw blocked after revoke
- redraw blocked after invalidation
- drift invalidation for map / region / package fingerprint / recipe / selector seed
- readiness blocked invalidation
- stale session blocked
- injected expiry support without timers
- no storage
- no `window` exposure
- immutable serializable diagnostics
- canonical safety flags remain false

## Separation From One-Frame Authorization

Persistent authorization must not be silently reused from one-frame authorization.

The persistent contract owns its own:

- confirmation string
- session ID generation
- attach-permission consumption
- redraw validation
- revoke/invalidate/expiry state

## Next Phase

Recommended next phase:

- `211.60 — Persistent Scheduler and Listener Contract`
