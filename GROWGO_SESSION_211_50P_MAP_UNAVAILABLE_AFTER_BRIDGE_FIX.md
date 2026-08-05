GROWGO SESSION 211.50p — Diagnose MAP_UNAVAILABLE After Raw Map Bridge Success

Date: Tuesday, August 4, 2026
Branch: feature/atlas-phase-211-6-gated-map-attachment-controller

Goal

Explain why Safari returned `MAP_UNAVAILABLE` even after bridge debug confirmed a valid frozen raw Leaflet map reference.

Confirmed incoming Safari evidence

- `outcome = failed_closed`
- `reasonCode = MAP_UNAVAILABLE`
- `adapterInvoked = true`
- `adapterReady = true`
- `surfacePrepared = false`
- `frameSnapshotCreated = false`
- bridge debug confirmed:
  - `hasRawLeafletMapReference = true`
  - `usesRawLeafletMapReference = true`
  - `usesRawLeafletMapProvider = false`
  - `usesPublicGetGrowGoMap = false`
  - `runtimeMapGetterCalls = 0`
  - `rawLeafletMapReferenceMatchesCurrentMap = true`

Diagnosis

The adapter was resolving its raw Leaflet map input too early.

Before this phase, `createDeveloperOnlyGrowGoCustom25DLiveOneFrameAdapter(...)` attempted to resolve and hold the raw map during adapter construction. If the adapter was created before the live Leaflet map became available, the adapter could retain `null` and later fail with `MAP_UNAVAILABLE`, even though the bridge itself later reported a valid raw map object.

This means the failure was not bridge recursion and not map absence in Safari. It was stale adapter-side map acquisition timing.

Fix applied in this phase

The adapter now:

- resolves the raw Leaflet map at execution time instead of construction time
- prefers the explicit `rawLeafletMapReference` when it is present and non-null
- falls back to `rawLeafletMapProvider()` only at execution time when needed
- records developer-only map availability diagnostics in the adapter result/status

New developer-only adapter diagnostics

- `hasBridge`
- `hasRawLeafletMapReference`
- `mapObjectType`
- `mapValidationResult`
- `mapValidationFailureReason`
- `mapAvailabilityFailureFunction`
- `surfacePreparationInputReady`

Expected meaning for `MAP_UNAVAILABLE`

If Safari still returns `MAP_UNAVAILABLE`, the result should now identify:

- whether a raw map reference was actually present at execution time
- what object type the adapter saw
- whether the failure happened in:
  - `adapter.resolveRuntimeRawLeafletMapReference`
  - or a later surface-preparation stage

Focused regression coverage

This phase adds coverage proving:

- construction no longer reads live map state
- a late runtime raw map provider is accepted
- `MAP_UNAVAILABLE` now emits explicit developer-only diagnostics
- canonical safety flags remain false

Manual Safari follow-up

Re-run the real one-frame command and preserve the full command result.

Important fields to capture next:

- `reasonCode`
- `hasBridge`
- `hasRawLeafletMapReference`
- `mapObjectType`
- `mapValidationResult`
- `mapValidationFailureReason`
- `mapAvailabilityFailureFunction`
- `surfacePreparationInputReady`
- `surfacePrepared`
- `frameSnapshotCreated`

Classification

- `MAP_UNAVAILABLE_ADAPTER_TIMING_FIXED` if Safari now progresses beyond map availability
- `BLOCKED_BY_SURFACE_PREPARATION_MAP_CONTRACT` if map is present but later rejected by surface prep
