# GROWGO SESSION 211.2 — DEVELOPER-ONLY GROWGO MAP GETTER IMPLEMENTATION

## Goal

Implement the smallest safe, owner-adjacent, read-only getter for the existing live Leaflet map.

## What Was Discovered First

- The live Leaflet map is owned directly in [`script.js`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/script.js) through the top-level binding:
  - `let map;`
- The current map instance is created only inside:
  - `initMap()`
  - `map = L.map("map", { ... }).setView(DEFAULT_CENTER, 17);`
- `initMap()` is called during:
  - `document.addEventListener("DOMContentLoaded", async () => { ... initMap(); ... })`
- Before this phase there was no implemented owner-adjacent `getGrowGoMap()` getter.

## What Was Implemented

Added a real read-only getter function:

```js
getGrowGoMap()
```

Owner-adjacent placement:

- defined next to the top-level `map` owner binding in [`script.js`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/script.js)

Developer-only exposure:

- bootstrapped only on local-dev hosts through:
  - `window.GrowGoDeveloperDiagnostics.getGrowGoMap()`

## Getter Behaviour

- returns `null` before map initialization
- returns the current owned Leaflet map instance after initialization
- returns the same instance on repeated calls until ownership changes elsewhere
- does not create a map
- does not mutate the map
- does not add listeners
- does not call Atlas
- does not invoke renderer work
- does not expose unrelated internal state

## Files Changed

- [`script.js`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/script.js)
- [`tests/client-growgo-map-getter.test.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-growgo-map-getter.test.mjs)
- [`GROWGO_SESSION_211_2_DEVELOPER_ONLY_GROWGO_MAP_GETTER_IMPLEMENTATION.md`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_211_2_DEVELOPER_ONLY_GROWGO_MAP_GETTER_IMPLEMENTATION.md)

## Tests

Focused test command:

```bash
node --test tests/client-growgo-map-getter.test.mjs
```

Result:

- 8 passed
- 0 failed

Covered:

- getter exists
- fail-closed before initialization
- returns owned instance after initialization
- repeated calls return same instance
- getter does not create or mutate map
- local-dev bootstrap exposure works
- non-local bootstrap fails closed
- no listeners / no Atlas / no renderer activity
- safety flags remain false

## Safety

Confirmed preserved:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Still not done in this phase:

- Atlas adapter connection
- live map center reads
- movement listeners
- map attachment
- renderer attachment
- runtime enablement

## Readiness

This phase is complete for a developer-only read-only map getter.

The next smallest safe phase is:

- explicit bridge wiring between `window.GrowGoDeveloperDiagnostics.getGrowGoMap()` and the existing developer-only Atlas diagnostic adapter, still without listeners or runtime attachment
