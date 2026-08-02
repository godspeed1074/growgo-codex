# GROWGO SESSION 211.42 — Narrow Live One-Frame Adapter Wiring Review

## Status

PASS

## Branch

- exact branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
- initial git status: clean
- final git status:
  - `?? GROWGO_SESSION_211_42_NARROW_LIVE_ONE_FRAME_ADAPTER_WIRING_REVIEW.md`
  - `?? tests/client-growgo-custom25d-live-one-frame-wiring-review.test.mjs`

## Checkpoint

Phase 211.41 was accepted by verified contents instead of exact commit title.

Verified present:

- centralized frame-root snapshot migration in `script.js`
- `tests/client-growgo-custom25d-frame-root-viewport-snapshot.test.mjs`
- `GROWGO_SESSION_211_41_CENTRALIZED_CUSTOM25D_FRAME_ROOT_VIEWPORT_SNAPSHOT.md`

History remained unchanged.

Accepted Phase 211.41 classification:

- `FRAME_ROOT_VIEWPORT_SNAPSHOT_READY`

## ELI5

The good news is that the new one-frame pieces are close: the temporary live surface can already feed the one-frame draw operation safely, and the real draw path still uses the shared frozen frame snapshot we wanted.

The part that is still missing is a tiny translator between “surface prepared” and “lifecycle cleanup registered,” plus the same kind of narrow translation around the newer snapshot contract. So this is blocked by wiring shape, not by dangerous live side effects.

## Required classification

Classification: `BLOCKED_BY_CONTRACT_TRANSLATION_GAP`

Reason:

- the live surface bundle already satisfies the live one-frame draw operation contract
- the lifecycle owner does **not** accept the live surface bundle as-is
- the older passive snapshot-review modules still describe the pre-211.41 draw shape
- no live browser-facing consumption seam is exposed yet
- no evidence shows hidden live startup, listener, timer, network, or retention side effects inside the one-frame draw path itself

## Canonical safety flags

These remain exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Wiring matrix

| stage | source module | input contract | output contract | ownership acquired | side effects allowed | cleanup obligation | failure state | next consumer | compatibility status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| readiness | `client/developer-only-live-atlas-renderer-handoff-readiness.mjs` | atlas diagnostic + passive renderer consumer descriptor | `ATLAS_RENDERER_HANDOFF_READINESS_DIAGNOSTIC_RESULT_001` | none | passive reads only | none | blocked readiness result | authorization module / session coordinator | `COMPATIBLE_AS_IS` |
| authorization | `client/developer-only-atlas-renderer-handoff-authorization.mjs` | readiness result + local confirmation | `ATLAS_RENDERER_HANDOFF_AUTHORIZATION_STATUS_001` | authorization session | status updates only | revoke or consume by owner | blocked authorization status | activation contract / session coordinator | `COMPATIBLE_AS_IS` |
| consumption | `client/developer-only-atlas-custom25d-one-frame-session-coordinator.mjs` and `client/developer-only-atlas-one-frame-renderer-activation-contract.mjs` | readiness snapshot + authorization status + revalidation | consumed authorization result | authorization session marked consumed | passive consume only | permanent close after terminal result | fail-closed or blocked | narrow live integration layer | `COMPATIBLE_AS_IS` |
| surface preparation | `client/growgo-custom25d-live-one-frame-surface-operations.mjs` | `map`, Leaflet pane/canvas APIs, pixel-ratio provider | `GROWGO_CUSTOM25D_LIVE_ONE_FRAME_SURFACE_BUNDLE_001` | map, pane, canvas owned by operation | pane lookup/create, canvas create/append, size/position writes | rollback becomes mandatory once a prepared surface exists | fail-closed with rollback reporting | one-frame draw operation or lifecycle registration seam | `COMPATIBLE_AS_IS` |
| lifecycle registration | `client/developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs` | bundle with `map`, `canvas`, `listener`, `redrawCallback`, `listenerEventNames`, `retentionSlotName`, `clearRetentionSlot` | registered lifecycle ownership | map, pane, canvas, listener, redraw callback | ownership bookkeeping only | exact disposal of listener/canvas/retention/pane | fail-closed | cleanup owner | `REQUIRES_NARROW_TRANSLATION` |
| frame snapshot | `script.js` centralized snapshot in `createCustom25DFrameViewportSnapshot({ map, canvas })` | validated live map + prepared canvas | frozen frame-root snapshot | frame snapshot only, frame-local | one frame of size/bounds/zoom/top-left reads and canvas sizing/positioning | none outside frame | fail-closed before layer fanout | live draw function and all five layer callsites | `COMPATIBLE_AS_IS` |
| one-frame draw | `client/growgo-custom25d-live-one-frame-draw-operation.mjs` | live surface bundle + exact canvas + draw provider | one completed or failed one-frame draw result | temporary map/canvas refs during call only | one draw call, observation of resize/position mutation | cleanup required stays true after any draw attempt | permanently closed | lifecycle cleanup owner | `COMPATIBLE_AS_IS` |
| cleanup | `client/developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs` | registered ownership bundle | disposal result | none after disposal | listener removal, canvas removal, retention reset, optional pane removal | idempotent terminal cleanup | fail-closed but terminal | reference release / closure | `REQUIRES_NARROW_TRANSLATION` |
| reference release | session coordinator / activation contract / draw operation | terminal activation or cleanup result | released references | none | clear passive refs only | already satisfied at terminal state | fail-closed | permanent closure | `COMPATIBLE_AS_IS` |
| closure | session coordinator / activation contract / draw operation | any terminal success or failure | permanently closed terminal state | none | no retries | none | second execution blocked | none | `COMPATIBLE_AS_IS` |

## Required review answers

### 1. Contract compatibility

#### Does the live surface bundle satisfy the one-frame draw operation’s required surface schema?

Yes.

The prepared live surface currently provides:

- `schemaId = GROWGO_CUSTOM25D_LIVE_ONE_FRAME_SURFACE_BUNDLE_001`
- exact pane name
- exact canvas class
- operation-owned canvas
- appended canvas
- `cleanupRequired = true`
- `rollbackAvailable = true`
- `listenerAdded = false`
- `retentionWritten = false`
- `drawRequested = false`
- direct `canvas` reference

That is enough for `drawPreparedSurfaceExactlyOnce({ surface, canvas })`.

#### Does the lifecycle owner accept the exact live surface resources?

No.

The lifecycle owner requires extra fields not present on the live surface bundle:

- `listener`
- `redrawCallback`
- `listenerEventNames`
- `retentionSlotName`
- `clearRetentionSlot`

That means the surface result cannot be handed straight to `registerOwnedResources(...)`.

#### Can the session coordinator consume the live adapter result without contract translation gaps?

Not directly.

The session coordinator and activation contract currently operate on:

- readiness result
- authorization status
- authorization consume result
- activation contract result
- renderer pipeline result

They do not currently understand the live surface bundle or the lifecycle owner registration bundle directly. A narrow integration layer still has to translate those contracts.

#### Are operation/status field names compatible or does a narrow adapter layer need translation?

A narrow adapter layer still needs translation.

Main seam:

- `surface prepared` → `lifecycle ownership bundle registered`

Secondary seam:

- the passive draw/snapshot review modules still describe the older pre-211.41 direct-map source shape rather than the centralized frame snapshot shape

### 2. Authorization ordering

Authorization is **not** exposed to Safari in this phase.

Current consume order is still safe in passive review terms:

1. readiness validation
2. authorization status validation
3. readiness revalidation
4. readiness drift check
5. authorization consume
6. activation / pipeline execution

However, a future live implementation should add one more pre-consume gate:

- validate live surface dependencies before authorization consumption

That is a recommendation for the next implementation phase, but it is not the dominant blocker in this review because no live consume seam is currently exposed.

### 3. Cleanup ordering

Cleanup becomes mandatory at the exact moment a prepared live surface exists.

This is represented by:

- `surface.cleanupRequired = true`
- `surface.rollbackAvailable = true`

After that point:

- any failure path must either rollback the prepared surface immediately
- or pass exact owned resources into the lifecycle owner for terminal cleanup

The lifecycle owner can represent:

- listener removal
- canvas removal
- retention reset
- optional pane removal when ownership is proven and pane is empty

Cleanup is idempotent at the lifecycle owner boundary:

- repeated `disposeOwnedResources()` after completion returns noop

Cleanup failure still leaves the overall attempt terminal:

- lifecycle owner returns `failed_closed`
- activation contract and coordinator also remain permanently closed on terminal failure

### 4. Frame-root snapshot integration

The centralized frame snapshot is compatible with the real draw path.

Confirmed:

- `drawCustom25DMapCanvas(canvas)` creates one `frameViewportSnapshot`
- all five active layers consume that same snapshot
- zones/buildings/roads/trees stay Canvas-local
- landmarks stay raw layer-point

No active layer currently requires a different viewport shape than the centralized frame snapshot provides.

The remaining gap is documentation/source-lock alignment:

- `client/growgo-custom25d-live-draw-map-snapshot.mjs`
- parts of the passive source-lock story around `client/growgo-custom25d-live-one-frame-draw-operation.mjs`

still talk in pre-211.41 direct-map terms.

### 5. Live draw compatibility

Yes, `drawCustom25DMapCanvas(canvas)` can be called exactly once against a prepared one-frame surface in a future gated implementation.

Important note:

- the draw path still resizes and repositions the canvas every draw

That does **not** currently look like a blocker by itself because:

- surface preparation already uses the same pane identity and canvas class
- the draw operation explicitly reports resize and position mutation instead of hiding them
- no hidden listener registration happens inside `drawCustom25DMapCanvas(canvas)`
- no hidden retention write happens inside `drawCustom25DMapCanvas(canvas)`
- no timer, polling, network, asset, or startup behavior was found inside the draw operation

### 6. Reference ownership

Current practical ownership map:

- map:
  - input to surface prep
  - retained briefly by draw op during one-frame call
  - should be owned for cleanup by lifecycle owner after registration
- pane:
  - created or reused by surface prep
  - cleanup ownership only becomes explicit once lifecycle registration happens
- canvas:
  - created by surface prep
  - used by draw op
  - must be cleaned by lifecycle owner or surface rollback
- frame snapshot:
  - frame-local inside `drawCustom25DMapCanvas(canvas)`
  - no retained owner after draw
- projector:
  - frame-local helper seam
  - no retained owner after use
- authorization session:
  - owned by renderer-handoff authorization module until consumed/revoked
- lifecycle owner:
  - created by narrow integration layer
  - owns terminal cleanup once registered

Hidden global owner still exists only in the normal live initializer path:

- `custom25DMapLayer`

That ownership remains unchanged in this phase.

### 7. Browser exposure boundary

The eventual developer-only command would need to be a **new**, tightly gated local-only command above the passive session coordinator.

Existing interfaces that can remain unchanged:

- readiness result contract
- authorization status contract
- authorization consume contract
- centralized frame-root snapshot in `script.js`
- live one-frame surface operations contract
- live one-frame draw operation contract
- lifecycle owner disposal contract

What must remain test-only in this phase:

- any live coordinator wiring
- any browser-exposed authorization consumption seam
- any browser-exposed one-frame activation command

Confirmed:

- no command is exposed in this phase

## Exact control points

### Authorization-consumption point

The coordinator consumes authorization only after:

1. first readiness validation
2. authorization status validation
3. second readiness read
4. readiness drift comparison

Exact point:

- `client/developer-only-atlas-custom25d-one-frame-session-coordinator.mjs`
  - `coordinatorState: "authorization_consumed"`
  - then `consumeAuthorization()`

The activation contract mirrors the same shape:

- `client/developer-only-atlas-one-frame-renderer-activation-contract.mjs`
  - second readiness validation
  - drift comparison
  - then `authorizationConsume()`
  - then `rendererAdapter.initializeForOneFrame(...)`

### Cleanup-mandatory point

Exact point:

- immediately after `prepareOneFrameSurface(...)` returns `outcome: "prepared"`

Represented by:

- `surface.cleanupRequired === true`
- `surface.rollbackAvailable === true`

### Draw-start point

Exact point in the live draw operation:

- after surface schema validation
- after canvas identity/class validation
- after draw-function provider resolution
- when `drawOperation({ surface, canvas })` is invoked

Exact point in the real renderer source:

- `drawCustom25DMapCanvas(canvas)` entry
- frame-root snapshot creation occurs at the start of that call

### Permanent-close point

Permanent closure happens at the first terminal result:

- draw operation sets `permanentlyClosed = true`
- activation contract closes on terminal failure or disposal
- session coordinator clears passive refs when `permanentlyClosed` is true

Second draw becomes impossible because:

- live draw operation closes after the first terminal call
- passive adapter blocks second draw
- activation/session layers also fail closed after terminal completion

## Compatible stages

- readiness
- authorization status
- authorization consumption sequencing at the passive layer
- live surface preparation
- centralized frame snapshot creation
- live one-frame draw execution
- reference release and terminal closure

## Translation gaps

- live surface bundle → lifecycle owner registration bundle
- passive snapshot/draw review contracts still describing pre-211.41 direct-map shape
- coordinator/activation layers still need a narrow integration facade that can speak both passive Atlas contracts and live one-frame resource contracts

## Ordering gaps

- future live implementation should validate live surface dependencies before authorization consumption

This is a follow-on implementation requirement, but the current review still classifies as a translation gap because no browser-consumable live ordering seam exists yet.

## Cleanup gaps

- no hard cleanup impossibility was found
- cleanup contract exists
- cleanup registration still depends on the missing translation seam

## Ownership gaps

- no hidden second owner was found for the one-frame draw path itself
- the main ownership gap is still the missing translation of prepared live surface resources into the lifecycle owner’s stricter registration bundle

## Files changed

- `GROWGO_SESSION_211_42_NARROW_LIVE_ONE_FRAME_ADAPTER_WIRING_REVIEW.md`
- `tests/client-growgo-custom25d-live-one-frame-wiring-review.test.mjs`

## Tests

Focused review test created:

- `tests/client-growgo-custom25d-live-one-frame-wiring-review.test.mjs`

Focused regression band expected to remain:

- Phase 211.18–211.41 focused tests

## Safety

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`
- renderer enabled: no
- live renderer invoked: no
- real Canvas created: no
- live DOM changed: no
- listener added: no
- `custom25DMapLayer` behavior changed: no
- browser activation exposed: no

## Commit

YES

Suggested commit message:

- `docs(atlas): review narrow live one-frame wiring`

## Next phase

Smallest safe next phase:

- create a tiny passive-only translation layer that converts:
  - prepared live surface bundle
  - exact listener/redraw/retention cleanup ownership
  - centralized frame snapshot expectations

  into one gated lifecycle registration seam

That phase should still:

- stay developer-only
- stay localhost-only
- avoid Safari/browser exposure
- avoid real authorization consumption until the translation seam itself is source-locked and tested
