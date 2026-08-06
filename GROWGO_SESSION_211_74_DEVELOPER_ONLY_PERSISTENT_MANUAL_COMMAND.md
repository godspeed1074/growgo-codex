## Phase 211.74 — Developer-Only Persistent Manual Command

Status: PASS

Classification: READY_FOR_PERSISTENT_SAFARI_MANUAL_VERIFICATION

Branch:
- `feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal completed:
- Added a narrow developer-only persistent Atlas manual command surface on the existing `window.GrowGoDeveloperDiagnostics` namespace.
- Kept all four canonical safety flags false.
- Preserved startup inactivity.
- Avoided automatic authorization, attachment, redraw, timers, polling, and startup rendering.

Created:
- [client/developer-only-controlled-persistent-atlas-manual-command.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-controlled-persistent-atlas-manual-command.mjs)
- [tests/client-developer-only-controlled-persistent-atlas-manual-command.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-controlled-persistent-atlas-manual-command.test.mjs)

Modified:
- [client/development-alpha-app.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/development-alpha-app.mjs)

Developer diagnostics API:

- `window.GrowGoDeveloperDiagnostics.authorizeControlledPersistentAtlas(...)`
- `window.GrowGoDeveloperDiagnostics.attachControlledPersistentAtlas(...)`
- `window.GrowGoDeveloperDiagnostics.requestControlledPersistentAtlasRedraw(...)`
- `window.GrowGoDeveloperDiagnostics.getControlledPersistentAtlasStatus()`
- `window.GrowGoDeveloperDiagnostics.detachControlledPersistentAtlas(...)`
- `window.GrowGoDeveloperDiagnostics.revokeControlledPersistentAtlas(...)`
- `window.GrowGoDeveloperDiagnostics.invalidateControlledPersistentAtlas(...)`

Exact confirmations enforced:

- Authorization:
  - `AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION`
- Attach:
  - `ATTACH_CONTROLLED_PERSISTENT_ATLAS`
- Manual redraw:
  - `REQUEST_CONTROLLED_PERSISTENT_ATLAS_REDRAW`
- Detach:
  - `DETACH_CONTROLLED_PERSISTENT_ATLAS`
- Revoke:
  - `REVOKE_CONTROLLED_PERSISTENT_ATLAS`
- Invalidate:
  - `INVALIDATE_CONTROLLED_PERSISTENT_ATLAS`

Allowed invalidation reasons:

- `MANUAL_INVALIDATION`
- `MAP_IDENTITY_DRIFT`
- `READINESS_DRIFT`
- `PACKAGE_IDENTITY_DRIFT`
- `RECIPE_IDENTITY_DRIFT`
- `SELECTOR_SEED_DRIFT`
- `LIFECYCLE_OWNER_DRIFT`
- `SESSION_STALE`

Local-host gate:
- The manual command only installs into the diagnostics namespace on approved local-development hosts.
- Non-local hosts are blocked closed.

Startup inactivity proof:
- no command runs during module evaluation
- no persistent authorization on startup
- no persistent attachment on startup
- no Canvas or pane on startup
- no listener registration on startup
- no animation frame on startup
- no timers or polling added

Integrated behavior covered by focused command tests:
- status has no side effects
- exact authorization confirmation required
- one-frame confirmation rejected
- attach requires authorization
- attach succeeds once
- duplicate attach blocked
- one Canvas only
- at most one pane
- exactly three approved listeners
- one initial frame queued
- manual redraw confirmation required
- redraw queues/coalesces correctly
- redraw during draw creates one follow-up only
- detach reaches zero ownership
- repeated detach remains harmless
- revoke triggers cleanup
- invalidate requires an allowed reason and triggers cleanup
- snapshot failure fails closed
- draw failure fails closed
- results/status are frozen and serializable
- no raw map/Canvas/pane/listener refs are exposed

Manual Safari next step:
- Phase 211.75 should use the new diagnostics API on `http://127.0.0.1:8000` and collect real browser evidence for:
  - authorize
  - attach
  - initial draw
  - event redraw
  - manual redraw
  - detach / revoke / invalidate cleanup

Canonical safety flags remained:
- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`
