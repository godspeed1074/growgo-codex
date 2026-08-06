# GROWGO SESSION 211.64 — PERSISTENT MAP, READINESS, AND IDENTITY WRAPPERS

## Goal

Implement the first three narrow real-seam wrappers for persistent Atlas while keeping them fully disconnected from live persistent attachment:

- persistent map provider
- persistent readiness provider
- persistent identity snapshot provider

These wrappers inspect injected real GrowGo seams only.

They do not:

- attach persistent Atlas
- expose anything on `window`
- create a Canvas or pane
- register listeners
- schedule animation frames
- invoke the renderer
- modify `script.js`
- modify development-alpha startup

## Modules created

- `client/developer-only-persistent-atlas-map-provider.mjs`
- `client/developer-only-persistent-atlas-readiness-provider.mjs`
- `client/developer-only-persistent-atlas-identity-provider.mjs`

## Map wrapper

### Exposed API

- `createPersistentAtlasMapProvider(...)`
- `resolvePersistentAtlasMap(...)`
- `getPersistentAtlasMapProviderStatus()`

### Behavior

- requires an injected real map bridge/provider
- never falls back to `window`
- never falls back to `GrowGoDeveloperDiagnostics`
- never searches globals
- never imports `script.js`
- validates a Leaflet-like map shape
- binds one stable map identity token
- detects map replacement
- rejects stale stored references
- exposes no raw map through status

### Failure reasons covered

- `MAP_PROVIDER_UNAVAILABLE`
- `MAP_UNAVAILABLE`
- `INVALID_MAP_SHAPE`
- `STALE_MAP_REFERENCE`
- `MAP_IDENTITY_CHANGED`

## Readiness wrapper

### Exposed API

- `createPersistentAtlasReadinessProvider(...)`
- `resolvePersistentAtlasReadiness(...)`
- `validatePersistentAtlasReadiness(...)`
- `getPersistentAtlasReadinessStatus()`

### Behavior

- requires an injected Atlas handoff-readiness seam
- preserves blocked reason codes from the underlying readiness result
- normalizes one-frame readiness into a frozen persistent snapshot
- binds:
  - `regionId`
  - `packageId`
  - `packageVersion`
  - `packageFingerprint`
  - `recipeId`
  - `recipeVersion`
  - `selectorSeed`
- supports validation before attach
- supports validation before redraw
- detects readiness drift
- exposes no mutable readiness object

### Failure reasons covered

- `READINESS_PROVIDER_UNAVAILABLE`
- `READINESS_BLOCKED` fallback only when no exact blocked reason exists
- `INVALID_READINESS_SHAPE`
- `READINESS_IDENTITY_INCOMPLETE`
- `READINESS_DRIFT_DETECTED`

## Identity wrapper

### Exposed API

- `createPersistentAtlasIdentitySnapshotProvider(...)`
- `createPersistentAtlasIdentitySnapshot(...)`
- `comparePersistentAtlasIdentity(...)`
- `getPersistentAtlasIdentityProviderStatus()`

### Snapshot shape

- `schemaId`
- `sessionId`
- `mapIdentityId`
- `regionId`
- `packageId`
- `packageVersion`
- `packageFingerprint`
- `recipeId`
- `recipeVersion`
- `selectorSeed`
- `lifecycleOwnerId`
- `identityCreatedAt`
- `identitySource`

### Behavior

- requires a complete identity source
- does not create sessions automatically
- produces a deeply immutable serializable snapshot
- exposes no raw map, readiness, package, recipe, or lifecycle references
- reports exact mismatch fields during comparison

### Failure reasons covered

- `IDENTITY_SOURCE_UNAVAILABLE`
- `IDENTITY_INCOMPLETE`
- `MAP_IDENTITY_MISMATCH`
- `SESSION_IDENTITY_MISMATCH`
- `REGION_IDENTITY_MISMATCH`
- `PACKAGE_IDENTITY_MISMATCH`
- `RECIPE_IDENTITY_MISMATCH`
- `SELECTOR_SEED_MISMATCH`

## Proof completed

- stable map resolution with real-shaped injected provider
- approved readiness normalization into frozen persistent snapshot
- frozen identity snapshot creation with nullable lifecycle owner
- successful revalidation when map/readiness stay unchanged
- stale map reference detection after replacement
- readiness drift detection when package fingerprint changes
- exact mismatch-field reporting for:
  - map identity
  - session
  - package fingerprint
  - recipe
  - selector seed

## Diagnostics

Each wrapper exposes a frozen serializable status only.

No status exposes:

- raw map reference
- raw readiness object
- raw bridge object
- raw package/recipe object
- raw lifecycle owner

## Safety

Canonical safety flags remain false:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Tests added

- `tests/client-persistent-map-readiness-identity-wrappers.test.mjs`

## Result

The map, readiness, and identity seams are now wrapped as disconnected developer-only modules and are ready to become the first real inputs for later persistent Atlas composition phases.
