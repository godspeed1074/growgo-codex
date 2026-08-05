Phase 211.50m — Freeze raw map OBJECT, not raw map provider

Date: 2026-08-03
Branch: feature/atlas-phase-211-6-gated-map-attachment-controller

Goal

Remove the final runtime dependency on dynamic map getter/provider calls from the developer-only Atlas one-frame path.

What changed

1. The one-frame adapter now executes against a frozen raw Leaflet map object.

Before:

- adapter accepted a `rawLeafletMapProvider`
- execution called that provider during the live one-frame path

After:

- adapter accepts `rawLeafletMapReference`
- the raw Leaflet map object is captured once during bootstrap
- execution reads the frozen object directly

2. The classic-script bridge now tracks bootstrap-only map capture facts.

`getCustom25DOneFrameBridgeDebug()` now reports:

- `hasRawLeafletMapReference`
- `usesRawLeafletMapReference`
- `usesPublicGetGrowGoMap`
- `usesRawLeafletMapProvider`
- `runtimeMapGetterCalls`
- `bootstrapMapGetterCalls`

3. The bridge reader was tightened so debug access does not re-trigger `getGrowGoMap()` after hydration.

That means:

- first bridge hydration may capture the map once
- later debug reads reuse the same frozen bridge instance
- no extra getter call is needed once the bridge is hydrated

4. Development alpha now passes the captured raw Leaflet map object into the one-frame adapter.

Runtime path is now:

command
↓
adapter
↓
bridge.rawLeafletMapReference
↓
snapshot

Not:

command
↓
adapter
↓
rawLeafletMapProvider()
↓
public getGrowGoMap()

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

What the regressions prove

- the old provider-driven `getGrowGoMap` recursion remains reproducible in the broken harness
- the fixed path completes through a frozen raw Leaflet map object
- the adapter completes:
  - one snapshot
  - one draw
  - one cleanup
- the script bridge debug surface reports:
  - `usesRawLeafletMapReference: true`
  - `usesRawLeafletMapProvider: false`
  - `usesPublicGetGrowGoMap: false`
  - `runtimeMapGetterCalls: 0`
  - `bootstrapMapGetterCalls: 1`

Required Safari debug check before the next one-frame retest

Run:

```js
window.GrowGoDeveloperDiagnostics.getCustom25DOneFrameBridgeDebug()
```

Expected minimum:

```js
{
  hasRawLeafletMapReference: true,
  usesRawLeafletMapReference: true,
  usesRawLeafletMapProvider: false,
  usesPublicGetGrowGoMap: false,
  runtimeMapGetterCalls: 0
}
```

Current classification

- `RAW_LEAFLET_MAP_OBJECT_FROZEN_FOR_ONE_FRAME_EXECUTION`

What still needs real Safari evidence

This phase proves the local implementation and browser-shaped regression behavior.
It does not yet prove that the live Safari page now completes the authorized one-frame command end to end.
