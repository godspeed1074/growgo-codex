## Phase 211.75a — Persistent Manual Command Map Identity Handoff Fix

Status: PASS

Classification: PERSISTENT_MAP_IDENTITY_HANDOFF_ALIGNED_FOR_MANUAL_SAFARI_RETRY

Branch:
- `feature/atlas-phase-211-6-gated-map-attachment-controller`

Root cause:
- Persistent authorization resolved identity before `internal.currentMap` had been populated by the persistent attach lane.
- The persistent identity helper in [client/development-alpha-app.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/development-alpha-app.mjs) expected a direct `map` argument and failed closed with `MAP_UNAVAILABLE` when authorization happened first.
- Readiness was already using the real live handoff path successfully, so readiness and persistent authorization were not sourcing map identity from the same authoritative live-map seam during pre-attach authorization.

Exact fix:
- Added one narrow authoritative persistent map resolver in [client/development-alpha-app.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/development-alpha-app.mjs):
  - `resolvePersistentAuthoritativeMapReference(preferredMap = null)`
- That resolver now uses the already-proven one-frame bridge path:
  - captured bridge provider
  - direct one-frame bridge getter fallback when needed
  - `rawLeafletMapReference`
- Persistent identity resolution now:
  - uses the passed map when present
  - falls back to the authoritative captured bridge map when authorization occurs before attach
  - fails closed with `MAP_UNAVAILABLE` if the map is genuinely absent
  - fails closed with `STALE_MAP_REFERENCE` when a passed map and the authoritative bridge map disagree

Alignment proof:
- readiness identity and persistent authorization identity now resolve through the same bridge-backed map source
- persistent raw-map resolution and readiness identity resolution both use the same helper
- listener registration also uses that same authoritative map helper, avoiding a second direct map lookup path

Failure preservation proof:
- genuinely missing map still fails closed with `MAP_UNAVAILABLE`
- preferred-map versus bridge-map mismatch fails closed with `STALE_MAP_REFERENCE`
- no readiness weakening, no hardcoded identity, no startup attach, no frame scheduling, and no renderer invocation were added

Files changed:
- [client/development-alpha-app.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/development-alpha-app.mjs)
- [tests/client-persistent-manual-command-map-identity-handoff.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-persistent-manual-command-map-identity-handoff.test.mjs)

Focused regression coverage:
- persistent manual command
- persistent map/readiness/identity wrappers
- persistent authorization provider
- real-seam composition
- hybrid verification
- existing one-frame Safari activation / map-reference tests

Focused regression result:
- passed: 168
- failed: 0

Canonical safety flags remained:
- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Manual Safari next step:
- retry Phase 211.75 authorization in Safari
- verify `authorizeControlledPersistentAtlas(...)` now succeeds before attach
- then continue the full persistent manual verification sequence
