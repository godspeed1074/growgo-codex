Phase 211.50l — Bridge Exposure Order Fix

Date: 2026-08-03
Branch: feature/atlas-phase-211-6-gated-map-attachment-controller

Goal

Stabilise the Atlas developer-only one-frame bridge exposure order so the live Safari page cannot resolve a dynamic public `getGrowGoMap()` path through `getCustom25DOneFrameBridge()`.

Scope constraints

- Did not modify snapshot logic.
- Did not modify draw seam.
- Did not modify cleanup.
- Did not modify authorization.
- Did not modify lifecycle ownership.

Problem statement

Real Safari evidence after Phase 211.50k still showed:

- `failed_closed`
- `MAXIMUM_CALL_STACK_SIZE_EXCEEDED`
- repeated chain:
  - `getCustom25DOneFrameBridge`
  - `getGrowGoMap`
  - `getGrowGoMap`
  - ...

That meant the live page was still exposing or consuming a bridge path capable of resolving the public diagnostics getter dynamically instead of a frozen raw Leaflet map reference.

Implementation

1. Stabilised classic-script bridge exposure in `script.js`

- Added a memoized singleton bridge.
- Added a single hydration path that upgrades the bridge once a real raw Leaflet map reference exists.
- Preserved bridge surface:
  - `rawLeafletMapReference`
  - `createCustom25DFrameViewportSnapshotForOneFrame`
  - `drawCustom25DOneFrameFromSnapshot`
- Added developer-only diagnostics read:
  - `getCustom25DOneFrameBridgeDebug()`

2. Added bridge debug metadata

The debug read now reports:

- `bridgeSource`
- `bridgeCreationTimestamp`
- `hasRawLeafletMapReference`
- `rawLeafletMapReferenceType`
- `rawLeafletMapReferenceIdentity`
- `liveLeafletMapReferenceIdentity`
- `rawLeafletMapReferenceMatchesCurrentMap`
- `usesRawLeafletMapReference`
- `usesPublicGetGrowGoMap`

3. Tightened development-alpha bridge capture

- Captures the script bridge provider once.
- Resolves the captured bridge object once.
- Binds snapshot/draw functions from that captured bridge object.
- Reads `rawLeafletMapReference` from the captured bridge object rather than re-entering the public diagnostics namespace during one-frame execution.

Expected Safari verification read

Run before the one-frame command:

```js
window.GrowGoDeveloperDiagnostics.getCustom25DOneFrameBridgeDebug()
```

Expected result:

```js
{
  hasRawLeafletMapReference: true,
  usesPublicGetGrowGoMap: false
}
```

If Safari instead reports `usesPublicGetGrowGoMap: true`, the wrong bridge instance is still being exposed or cached by the page.

Focused regressions run

```text
node --test \
  tests/client-growgo-map-getter.test.mjs \
  tests/client-developer-only-growgo-custom25d-live-one-frame-adapter.test.mjs \
  tests/client-browser-shaped-atlas-one-frame-recursion.test.mjs \
  tests/client-developer-only-live-one-frame-adapter-implementation-review.test.mjs
```

Result

- 33 passed
- 0 failed

What the regressions now prove

- The diagnostics namespace exposes `getCustom25DOneFrameBridgeDebug()`.
- The classic-script bridge is memoized after raw map capture.
- The debug surface reports `usesPublicGetGrowGoMap: false`.
- The browser-shaped recursion harness still reproduces the broken public getter route before the fix.
- The fixed browser-shaped path completes:
  - one snapshot
  - one draw
  - one cleanup

Current classification

- Local regression status:
  - `BRIDGE_EXPOSURE_ORDER_STABILIZED_FOR_SAFARI_RETEST`
- Real Safari status:
  - pending new manual evidence

Next manual Safari step

1. Hard reload Safari at `http://127.0.0.1:8000`
2. Run:

```js
window.GrowGoDeveloperDiagnostics.getCustom25DOneFrameBridgeDebug()
```

3. Confirm:

- `hasRawLeafletMapReference === true`
- `usesPublicGetGrowGoMap === false`

4. Only then rerun the authorized one-frame command for the next real Safari retest.
