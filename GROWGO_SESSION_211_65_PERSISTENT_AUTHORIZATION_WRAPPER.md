# GROWGO SESSION 211.65 — PERSISTENT AUTHORIZATION WRAPPER

## Goal

Add a narrow developer-only wrapper around the persistent authorization contract so later persistent Atlas phases can consume only the exact authorization seam they need, without exposing the full contract and without touching one-frame authorization.

## Module created

- `client/developer-only-persistent-atlas-authorization-provider.mjs`

## Exposed API

- `createPersistentAtlasAuthorizationProvider(...)`
- `resolvePersistentAtlasAuthorization(...)`
- `consumePersistentAtlasAttachPermission(...)`
- `validatePersistentAtlasRedrawAuthorization(...)`
- `revokePersistentAtlasAuthorization(...)`
- `invalidatePersistentAtlasAuthorization(...)`
- `getPersistentAtlasAuthorizationProviderStatus()`

## Behavior

### Resolution

- reads only from the injected persistent authorization contract
- fails closed when dependency is unavailable or wrong-shaped
- requires active persistent authorization
- enforces expected session and identity match
- returns a frozen serializable snapshot only

### Attach consumption

- delegates attach consumption to the persistent contract
- consumes attach permission exactly once
- rejects repeated consumption
- never consumes one-frame authorization

### Redraw validation

- requires active authorization
- requires attach permission already consumed
- requires controller attached
- requires session and identity continuity
- requires readiness continuity
- requires lifecycle-owner continuity when supplied
- delegates final redraw validation to the persistent contract

### Revocation / invalidation

- delegates to the underlying contract
- immediately blocks later attach/redraw checks
- marks `detachRequired = true`
- does not perform detach or cleanup

## One-frame separation proof

- explicit rejection of `AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION`
- explicit rejection of `ATLAS_RENDERER_HANDOFF_AUTHORIZATION_STATUS_001`
- no import of the one-frame authorization module
- no fallback to one-frame diagnostics
- no shared mutable one-frame authorization state

## Diagnostics

The provider exposes a frozen serializable status containing:

- provider readiness
- authorization state
- attach/redraw permission state
- detach requirement
- session and bound identity fields
- revocation / invalidation / expiry state
- attempt/completion counters
- one-frame detection flags
- last failure reason
- canonical safety flags

No raw contract, map, readiness, controller, lifecycle owner, or mutable identity objects are exposed.

## Result

Persistent authorization can now be adapted into the narrow live-adapter seam without turning on any persistent runtime behavior and without crossing into one-frame authorization.
