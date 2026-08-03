# GROWGO SESSION 211.50F — LIVE SAFARI DIAGNOSTICS AVAILABILITY VERIFICATION

## Goal

Verify that the real Safari localhost page exposes the required GrowGo developer diagnostics surface needed for the final Atlas custom 2.5D one-frame retest.

This phase is a diagnostics availability check only.

This phase does **not** execute the one-frame command.

This phase does **not** consume authorization.

This phase does **not** fabricate live Safari evidence.

Until genuine Safari output is supplied:

- `executionStatus = PENDING_MANUAL_OPERATOR_EVIDENCE`
- final classification must remain unassigned
- do **not** mark `PASS`

## Handoff continuity

Confirmed already complete before this phase:

- `SNAPSHOT_BRIDGE_RECURSION_FIXED`
- browser-shaped recursion reproduction completed
- browser-shaped regression passes
- fixed path proves:
  - one snapshot
  - one draw
  - one cleanup
  - references released

This phase does **not** reopen or redesign:

- snapshot bridge
- draw seam
- renderer lifecycle
- authorization ordering
- cleanup ownership

## Preflight

- current branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- Phase 211.50e checkpoint exists:
  - `GROWGO_SESSION_211_50E_SNAPSHOT_BRIDGE_RECURSION_FIX.md`
- latest relevant checkpoint commit at `HEAD`:
  - `5ca08be fix(atlas): remove actual Safari one-frame recursion`
- focused Phase 211 diagnostics / bridge / command / attachment regression band:
  - `PASS`
- application implementation changes made in Phase 211.50f:
  - diagnostics availability evidence record
  - focused diagnostics availability test

## Canonical safety truth

Canonical safety flags must remain exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

This phase must remain:

- developer-only
- diagnostics-only
- zero-draw
- no renderer attachment
- no listener creation
- no map-startup changes
- no Canvas creation
- no authorization consumption

## Required live diagnostics namespace

Expected on the live Safari page:

- `window.GrowGoDeveloperDiagnostics`

Expected required functions:

- `getGrowGoMap`
- `getAtlasRendererHandoffReadiness`
- `authorizeAtlasRendererHandoffSession`
- `getAtlasRendererHandoffAuthorizationStatus`
- `getAtlasMapAttachmentStatus`
- `runAuthorizedAtlasCustom25DOneFrame`

## Manual Safari target

- browser: `Safari`
- page: `http://127.0.0.1:8000`
- execution status:
  - `PENDING_MANUAL_OPERATOR_EVIDENCE`

## Manual Safari diagnostics checklist

1. Hard reload Safari and wait for the Leaflet map to initialize.

2. Confirm the diagnostics namespace exists:

```js
typeof window.GrowGoDeveloperDiagnostics
```

Expected:

```js
"object"
```

3. List the available diagnostics keys:

```js
Object.keys(window.GrowGoDeveloperDiagnostics)
```

Confirm the returned keys include:

- `getGrowGoMap`
- `getAtlasRendererHandoffReadiness`
- `authorizeAtlasRendererHandoffSession`
- `getAtlasRendererHandoffAuthorizationStatus`
- `getAtlasMapAttachmentStatus`
- `runAuthorizedAtlasCustom25DOneFrame`

4. Confirm there is no duplicate diagnostics namespace:

```js
[
  "GrowGoDeveloperDiagnostics" in window,
  window.GrowGoDeveloperDiagnostics === globalThis.GrowGoDeveloperDiagnostics
]
```

Expected:

```js
[true, true]
```

5. Confirm no stale wrapper returns `undefined`:

```js
[
  typeof window.GrowGoDeveloperDiagnostics.getGrowGoMap,
  typeof window.GrowGoDeveloperDiagnostics.getAtlasRendererHandoffReadiness,
  typeof window.GrowGoDeveloperDiagnostics.authorizeAtlasRendererHandoffSession,
  typeof window.GrowGoDeveloperDiagnostics.getAtlasRendererHandoffAuthorizationStatus,
  typeof window.GrowGoDeveloperDiagnostics.getAtlasMapAttachmentStatus,
  typeof window.GrowGoDeveloperDiagnostics.runAuthorizedAtlasCustom25DOneFrame
]
```

Expected:

```js
["function", "function", "function", "function", "function", "function"]
```

6. Confirm `getGrowGoMap()` returns a live map object:

```js
const map = window.GrowGoDeveloperDiagnostics.getGrowGoMap();
({
  hasMap: !!map,
  hasGetCenter: typeof map?.getCenter === "function",
  hasSetView: typeof map?.setView === "function",
  hasOn: typeof map?.on === "function",
  hasOff: typeof map?.off === "function"
});
```

Expected:

- `hasMap = true`
- `hasGetCenter = true`
- `hasSetView = true`
- `hasOn = true`
- `hasOff = true`

7. Confirm the map attachment controller is still detached and inactive:

```js
window.GrowGoDeveloperDiagnostics.getAtlasMapAttachmentStatus()
```

Confirm:

- `attached = false`
- `ownedListenerCount = 0`
- `rendererActivity = false`

Additional detached safety expected:

- `overlayActivity = false`
- `networkActivity = false`
- `pollingOrTimerActivity = false`

8. Move to the approved Bellarine coordinate if needed:

```js
window.GrowGoDeveloperDiagnostics.getGrowGoMap().stop();
window.GrowGoDeveloperDiagnostics.getGrowGoMap().setView(
  [-38.12, 144.61],
  15,
  { animate: false }
);
```

9. Confirm live readiness can resolve the approved Bellarine scope:

```js
window.GrowGoDeveloperDiagnostics.getAtlasRendererHandoffReadiness()
```

Confirm:

- `diagnosticStatus = "resolved"`
- `reasonCode = "RESOLVED"`
- `rendererHandoffStatus = "ready_for_future_renderer_attachment"`
- resolved region is Bellarine
- resolved package and recipe are present

10. Confirm authorization remains unconsumed because this phase does not authorize anything:

```js
window.GrowGoDeveloperDiagnostics.getAtlasRendererHandoffAuthorizationStatus()
```

Confirm:

- authorization is inactive before any manual session approval
- no session is consumed

11. Stop here.

Do **not** run:

```js
window.GrowGoDeveloperDiagnostics.runAuthorizedAtlasCustom25DOneFrame({
  confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
})
```

Do **not** authorize a handoff session in this phase.

## Required operator paste-back evidence

Paste back the genuine Safari outputs for:

- `typeof window.GrowGoDeveloperDiagnostics`
- `Object.keys(window.GrowGoDeveloperDiagnostics)`
- duplicate namespace equality check
- six-function `typeof` array
- `getGrowGoMap()` live object capability summary
- `getAtlasMapAttachmentStatus()`
- `getAtlasRendererHandoffReadiness()`
- `getAtlasRendererHandoffAuthorizationStatus()`
- any browser bootstrap anomalies actually observed

## Allowed final classifications after manual evidence

- `LIVE_DIAGNOSTICS_AVAILABLE_FOR_FINAL_SAFARI_RETEST`
- `BLOCKED_BY_DIAGNOSTICS_NAMESPACE`
- `BLOCKED_BY_MAP_PROVIDER`
- `BLOCKED_BY_BROWSER_BOOTSTRAP`

## Honest current status

Current truth for Phase 211.50f:

- live Safari diagnostics availability has been prepared for verification
- real Safari outputs have **not** been supplied in this record yet
- one-frame execution has **not** been attempted here
- renderer authorization has **not** been consumed here
- final classification is pending genuine manual Safari evidence
