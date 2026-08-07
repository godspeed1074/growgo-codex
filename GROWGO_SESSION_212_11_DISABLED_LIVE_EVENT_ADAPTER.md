# GROWGO SESSION 212.11 — DISABLED LIVE-EVENT ADAPTER

## Goal

Create the production-shaped developer-only live-event adapter that can translate approved completed viewport-change events into automatic population controller refresh requests.

This phase remains intentionally disabled by default and does not:

- expose an automatic-population toggle on `window`
- register listeners from startup
- enable automatic population in Safari
- change normal persistent Atlas listener behavior
- add timers or polling

## Created module

- [client/developer-only-atlas-automatic-population-live-event-adapter.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-automatic-population-live-event-adapter.mjs)

## Created tests

- [tests/client-developer-only-atlas-automatic-population-live-event-adapter.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-atlas-automatic-population-live-event-adapter.test.mjs)

## Public API

- `createAtlasAutomaticPopulationLiveEventAdapter(...)`
- `enableAtlasAutomaticPopulationLiveEventAdapter(...)`
- `disableAtlasAutomaticPopulationLiveEventAdapter(...)`
- `validateAtlasAutomaticPopulationLiveEventAdapter(...)`
- `getAtlasAutomaticPopulationLiveEventAdapterStatus()`

## Injected dependencies

The adapter accepts only injected seams:

- `mapProvider`
- `controller`
- `listenerRegistrar`
- `listenerRemover`
- `viewportIdentityProvider`
- `readinessProvider`
- `atlasIdentityProvider`

All unavailable-by-default seams fail closed.

No fallback exists for:

- `window`
- `document`
- `globalThis`
- direct Leaflet globals
- `script.js`
- public diagnostics lookup
- timers / polling

## Disabled-by-default proof

On creation the adapter:

- starts `disabled`
- owns zero listeners
- sends zero refresh requests
- owns zero browser resources
- does not enable the controller
- does not trigger automatic population
- does not run startup behavior

## Event whitelist

Allowed:

- `moveend`
- `zoomend`
- `resize`

Rejected / not forwarded:

- `move`
- `drag`
- `mousemove`
- `touchmove`
- `wheel`
- `zoom`
- `zoomstart`
- `timer`
- `polling`
- `startup`
- unknown events

## Listener ownership proof

When explicitly enabled in tests:

- exactly one listener per approved event is registered
- one listener owner id is retained
- exact callback identities are retained
- map identity is bound to the listener set
- session identity is bound where available
- duplicate enable is blocked
- second listener set is blocked
- partial registration failure rolls back
- disable removes exact callback identities
- repeated disable is harmless

## Event translation proof

Each approved event callback:

1. verifies adapter enabled state
2. resolves current viewport identity
3. resolves Atlas identity
4. validates readiness
5. forwards exactly one controller refresh request
6. preserves the exact trigger reason:
   - `moveend`
   - `zoomend`
   - `resize`

The adapter does not:

- invoke the feature adapter directly
- invoke the planner directly
- invoke draw integration directly
- create plans or batches
- mutate controller internals

## Controller handoff

The adapter forwards only through:

- `requestAutomaticViewportPopulationRefresh(...)`

The controller retains ownership of:

- generation binding
- coalescing
- stale-work rejection
- replacement policy

## Burst-event proof

Simulated burst:

- `moveend`
- `zoomend`
- `resize`

Proven:

- adapter emits three valid controller requests
- controller owns coalescing
- adapter does not implement a second coalescing system
- queued work remains controller-owned

## Identity / readiness protections

Before forwarding each event the adapter requires:

- map available
- bound map identity still current
- readiness approved
- current region / package / recipe identity
- current selector seed

If invalid:

- event is not forwarded
- exact failure reason is preserved
- controller may be invalidated only through its documented invalidation API
- persistent Canvas / listener / lifecycle cleanup is not performed here

## Map replacement policy

If map identity changes:

- stale binding is detected
- forwarding is blocked
- replacement map is not silently rebound
- explicit re-enable is required
- duplicate listeners across old/new maps are not created

## Disable behavior

`disableAtlasAutomaticPopulationLiveEventAdapter(...)`:

- blocks new forwarding
- removes exact approved listeners
- clears listener bindings
- releases adapter-owned refs
- leaves controller state externally owned
- does not detach Atlas
- does not clear current population

## Diagnostics contract

Frozen serializable status includes:

- readiness / enablement
- bound listener owner
- bound map identity
- bound session id
- exact registration flags
- owned listener count
- enable / disable counters
- received / forwarded / rejected counters
- per-event received counters
- stale-map / readiness-blocked / identity-mismatch flags
- last event reason
- last failure reason
- references released
- canonical safety flags

No raw refs are exposed for:

- map
- listener callback
- event object
- controller internals
- Canvas
- pane
- renderer
- feature data

## Safety confirmation

All canonical safety flags remain false:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

This phase does not activate live automatic population.

## Next phase

- `212.12 — Developer-Only Automatic Population Toggle`
