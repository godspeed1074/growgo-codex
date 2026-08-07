# GROWGO SESSION 212.12 — DEVELOPER-ONLY AUTOMATIC POPULATION TOGGLE

## Goal

Add a local developer-only manual toggle that can explicitly enable and disable the automatic viewport population controller and disabled live-event adapter without enabling startup behavior or player runtime behavior.

## Created module

- [client/developer-only-controlled-automatic-atlas-population-toggle.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-controlled-automatic-atlas-population-toggle.mjs)

## Created tests

- [tests/client-developer-only-controlled-automatic-atlas-population-toggle.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-controlled-automatic-atlas-population-toggle.test.mjs)

## Diagnostics namespace

The toggle installs onto the existing local developer diagnostics namespace:

- `window.GrowGoDeveloperDiagnostics`

No second global namespace is created.

## Public developer commands

- `enableControlledAutomaticAtlasPopulation(...)`
- `disableControlledAutomaticAtlasPopulation(...)`
- `getControlledAutomaticAtlasPopulationStatus()`

## Confirmation strings

Enable:

- `ENABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION`

Disable:

- `DISABLE_CONTROLLED_AUTOMATIC_ATLAS_POPULATION`

## Local-development gate

Commands execute only on approved local hosts:

- `localhost`
- `127.0.0.1`
- `0.0.0.0`
- `::1`

## Enable contract

Enable succeeds only when:

- local-development eligible
- persistent Atlas authorized
- persistent Atlas attached
- integration state is `attached_idle`
- redraw permission is `true`
- retained surface is ready
- lifecycle owner is present
- current map / region / package / recipe / selector identity is present
- readiness is approved
- controller is valid
- live-event adapter is valid
- automatic population is currently disabled

Enable flow:

1. validate exact confirmation
2. validate local-development host
3. validate attached idle persistent Atlas state
4. validate readiness
5. enable controller
6. enable live-event adapter
7. register exactly:
   - `moveend`
   - `zoomend`
   - `resize`
8. do not trigger immediate population
9. enter enabled idle state

## Initial population policy

Chosen policy:

- `NO_IMMEDIATE_POPULATION_ON_ENABLE`

Meaning:

- enabling only arms the automatic system
- the first population refresh waits for the next approved completed viewport event

## Disable contract

Disable flow:

1. validate exact confirmation
2. disable live-event adapter
3. remove exact automatic listeners
4. disable controller
5. stale queued / follow-up controller work
6. release controller-owned automatic population refs
7. keep persistent Atlas attached
8. keep retained Canvas / pane / lifecycle owner
9. return disabled

## Current population disable policy

Chosen policy:

- `RETAIN_LAST_AUTOMATIC_POPULATION_ON_DISABLE`

Reason:

- this phase keeps the disable path narrow
- it removes automatic ownership and listeners without submitting a special clear batch
- persistent Atlas remains attached and developer verification remains manual

## Duplicate protection

Proven:

- duplicate enable blocked
- no second listener set
- no second controller instance
- repeated disable harmless
- no automatic re-enable after invalidation, detach, revoke, or expiry

## Drift / invalidation behavior

If persistent Atlas becomes:

- detached
- revoked
- authorization expired
- invalidated
- failed closed

then the toggle:

- disables automatic population
- disables event forwarding
- disables the controller
- clears controller-owned refs
- preserves the exact invalidation reason
- does not reattach
- does not reauthorize

## Automatic event handoff

Once manually enabled:

- `moveend`
- `zoomend`
- `resize`

flow through:

- disabled live-event adapter
- automatic population controller
- live feature adapter
- planner
- draw integration
- atomic batch replacement

No proven layer is bypassed.

## Diagnostics contract

Frozen serializable status includes:

- command availability
- local-development eligibility
- automatic enablement
- toggle state
- controller state
- adapter state
- automatic listener owner / count
- viewport generation tracking
- population plan / batch / command counts
- refresh counters
- coalescing / stale / skipped counters
- last command / outcome / reason
- last trigger / failure / invalidation reason
- startup / timer / polling guards
- canonical safety flags

No raw refs are exposed for:

- map
- listeners
- callbacks
- Canvas
- pane
- renderer
- feature objects
- plan/batch internals

## Safety confirmation

All canonical safety flags remain false:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

This phase does not:

- enable startup automatic population
- enable player-facing runtime
- create a second renderer or Canvas
- add timers or polling
- query public OSM / Overpass

## Next phase

- `212.13 — Safari Automatic Repopulation Verification`
