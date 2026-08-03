# GrowGo Session 211.50e — Snapshot Bridge Recursion Fix

Date: August 3, 2026
Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
Phase: `211.50e — Diagnose and Remove Snapshot Bridge Recursion`
Classification: `SNAPSHOT_BRIDGE_RECURSION_FIXED`

## Scope

This phase addressed only the browser-wired snapshot bridge recursion path reported by real Safari manual evidence.

Not investigated here:

- Playwright WebKit
- draw seam behavior
- canvas rendering visuals
- lifecycle cleanup design
- WebGL
- runtime activation

## Preserved evidence

The prior manual Safari result remains preserved and unchanged:

- `outcome = failed_closed`
- `reasonCode = MAXIMUM_CALL_STACK_SIZE_EXCEEDED`
- `authorizationConsumed = true`
- `adapterInvoked = true`
- `surfacePrepared = true`
- `frameSnapshotCreated = false`
- `drawAttemptCount = 0`
- `completedFrameCount = 0`
- `cleanupAttemptCount = 1`
- `cleanupCompleted = true`
- `referencesReleased = true`

Canonical safety flags remained:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Exact repeated call chain identified

The browser-shaped regression now reproduces the old browser wiring failure boundary with tracing.

Repeated chain:

- `lazySnapshotBridgeProvider`
- `reboundPublicBridgeGetter`
- `reboundPublicBridgeGetter`
- `reboundPublicBridgeGetter`
- `...`

Meaning:

- the one-frame command entered the live adapter correctly
- the adapter reached snapshot bridge resolution
- the snapshot bridge path lazily re-entered the public diagnostics bridge getter instead of using a stable captured implementation reference
- the repeated getter chain prevented snapshot creation from completing

## Root cause

The earlier recursion fix corrected the private script-side bridge direction, but the browser wiring in `client/development-alpha-app.mjs` still left a lazy public bridge resolution shape available during one-frame execution.

That meant the browser-wired path could still bounce through public diagnostics access during snapshot resolution even though the script-side private implementation aliases had already been narrowed.

## Why the previous fix missed this

The previous fix focused on the live Safari recursion risk inside `script.js` bridge functions themselves.

It did not fully lock the development-alpha browser wiring to stable captured snapshot and draw references. Because of that, the browser harness could still model a lazy bridge lookup path that re-entered the public getter during snapshot creation.

## Correction applied

### `client/development-alpha-app.mjs`

- Captured the script diagnostics bridge once before execution.
- Captured stable function references once:
  - `createCustom25DFrameViewportSnapshotForOneFrameFromScriptDiagnostics`
  - `drawCustom25DOneFrameFromSnapshotFromScriptDiagnostics`
- Wired the live adapter to those stable captured functions.
- Removed the misleading lazy bridge-resolution helper from the live wiring path.

### `script.js`

Added developer-only tracing around the snapshot bridge path:

- `getGrowGoMap`
- `getCustom25DOneFrameBridge`
- `createCustom25DFrameViewportSnapshotForOneFrame`
- `createCustom25DFrameViewportSnapshotPrivateImplementation`
- `createCustom25DFrameViewportSnapshot`

The private snapshot implementation remains one-way and does not call back through:

- `window.GrowGoDeveloperDiagnostics`
- public diagnostics getters
- adapter functions
- command functions

### Tests

- Replaced the old browser-shaped recursion proof so it targets snapshot bridge recursion instead of map getter recursion.
- Updated implementation review assertions to match stable bridge capture and traced private snapshot implementation.
- Updated the bridge unit harness to supply the no-op trace helper expected by the current script shape.

## Browser-shaped proof after the fix

The fixed browser-shaped path now proves:

- one snapshot created
- one draw completed
- one cleanup completed
- references released
- command promise result returned from the public wrapper
- no recursion detected
- finite trace depth

Verified one-way direction:

- browser command
- command module
- live adapter
- stable bridge reference
- private snapshot implementation
- return snapshot
- draw from supplied snapshot
- cleanup

## Tests

Focused regression suites run in this phase:

- `tests/client-browser-shaped-atlas-one-frame-recursion.test.mjs`
- `tests/client-developer-only-atlas-custom25d-one-frame-command.test.mjs`
- `tests/client-developer-only-growgo-custom25d-live-one-frame-adapter.test.mjs`
- `tests/client-developer-only-growgo-custom25d-one-frame-pipeline.test.mjs`
- `tests/client-developer-only-live-one-frame-adapter-implementation-review.test.mjs`
- `tests/client-growgo-custom25d-live-one-frame-surface-operations.test.mjs`
- `tests/client-growgo-custom25d-live-one-frame-draw-operation.test.mjs`
- `tests/client-growgo-custom25d-one-frame-surface-lifecycle-translation.test.mjs`
- `tests/client-developer-only-growgo-custom25d-renderer-lifecycle-owner.test.mjs`
- `tests/client-growgo-custom25d-frame-root-viewport-snapshot.test.mjs`
- `tests/client-growgo-custom25d-snapshot-aware-draw-seam.test.mjs`
- `tests/client-manual-safari-one-frame-activation-evidence.test.mjs`
- `tests/client-manual-safari-one-frame-activation-retest-evidence.test.mjs`

Result:

- `88 passed`
- `0 failed`

## Safety confirmation

- renderer startup remained disabled
- no move listeners were added
- no timers were added
- no animation loops were added
- no runtime activation was exposed
- no Safari command was executed during coding
- no Playwright/WebKit investigation was resumed

## Final closeout

Status:

- snapshot bridge recursion reproduced in a browser-shaped harness
- exact repeated chain identified
- stable capture fix applied
- fixed path verified finite

Final classification:

- `SNAPSHOT_BRIDGE_RECURSION_FIXED`
