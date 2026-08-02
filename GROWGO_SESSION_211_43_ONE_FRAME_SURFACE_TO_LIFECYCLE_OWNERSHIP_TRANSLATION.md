# GROWGO SESSION 211.43 — One-Frame Surface-to-Lifecycle Ownership Translation Seam

## Status

PASS

## Branch

- exact branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
- initial git status:
  - `?? GROWGO_SESSION_211_42_NARROW_LIVE_ONE_FRAME_ADAPTER_WIRING_REVIEW.md`
  - `?? tests/client-growgo-custom25d-live-one-frame-wiring-review.test.mjs`
- final git status:
  - Phase 211.42 checkpoint files still present
  - Phase 211.43 translator files added

## Checkpoint

Phase 211.42 was verified by contents.

Confirmed present:

- `GROWGO_SESSION_211_42_NARROW_LIVE_ONE_FRAME_ADAPTER_WIRING_REVIEW.md`
- `tests/client-growgo-custom25d-live-one-frame-wiring-review.test.mjs`

Focused Phase 211.18–211.42 regression band passed before implementation.

History remained unchanged.

Accepted Phase 211.42 classification:

- `BLOCKED_BY_CONTRACT_TRANSLATION_GAP`

## ELI5

We added a tiny fake-only translator that takes one already-prepared one-frame surface and describes its cleanup ownership honestly.

It tells the lifecycle owner, “you own this canvas and maybe this pane,” without pretending there is a live redraw listener or a `custom25DMapLayer` retention value to clean up.

## Goal result

Created a new passive translation seam:

- `client/growgo-custom25d-one-frame-surface-lifecycle-translation.mjs`

It converts one prepared one-frame surface into a lifecycle-owner registration bundle with:

- exact map reference preserved
- exact pane reference preserved
- exact Canvas reference preserved
- one-frame ownership mode only
- explicit absence of listener ownership
- explicit absence of retention ownership
- exact Canvas cleanup requirement
- conditional pane cleanup eligibility

## Translation

### Ownership mode

- `ONE_FRAME_SURFACE_ONLY`

This mode is separate from continuous renderer ownership and does not invent:

- `moveend zoomend` listener ownership
- redraw callback ownership
- `custom25DMapLayer` retention ownership

### Map identity

Preserved exactly from the prepared one-frame surface.

### Pane identity

Preserved exactly from the prepared one-frame surface.

### Canvas identity

Preserved exactly from the prepared one-frame surface.

### Listener ownership

Explicitly absent:

- `listenerOwned = false`
- `listenerEventNames = []`
- `listenerFunction = null`
- `redrawCallback = null`

### Retention ownership

Explicitly absent:

- `retentionWritten = false`
- `retentionValue = null`
- `retentionResetRequired = false`

### Canvas cleanup obligation

Always required for a valid translated one-frame bundle:

- `cleanupRequired = true`
- `canvasRemovalRequired = true`

### Pane cleanup rule

Pane removal is eligible only when:

- the pane was created by this one-frame operation
- the pane is empty after canvas removal
- safe pane removal capability exists

Reused panes are never treated as owned.

## Lifecycle-owner compatibility

Compatible after one narrow correction.

### Exact correction made

`client/developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs` now accepts an explicit:

- `ownershipMode = ONE_FRAME_SURFACE_ONLY`

For that mode only:

- `listener = null` is allowed
- `redrawCallback = null` is allowed
- `listenerEventNames = []` is allowed
- `retentionResetRequired = false` is allowed
- listener removal is skipped
- retention reset is skipped

Continuous-renderer behavior remains unchanged:

- listener is still required
- redraw callback is still required
- `moveend zoomend` is still required
- retention reset is still required unless the explicit one-frame mode says otherwise

## Required translation behavior achieved

Confirmed:

1. one explicit translation request is accepted
2. prepared one-frame surface is validated
3. exact pane/canvas identity requirements are enforced
4. lifecycle owner contract is validated
5. one lifecycle registration bundle is produced
6. absent listener ownership is represented explicitly
7. absent retention ownership is represented explicitly
8. exact map/pane/Canvas references are preserved
9. only genuinely owned one-frame resources are registered
10. no continuous renderer listener/callback ownership is invented
11. no listeners are added
12. `custom25DMapLayer` is not written
13. nothing is drawn
14. public results are deeply immutable
15. no module-level references are retained

## Blocked cases covered

The translator fails closed for:

- missing prepared surface
- invalid surface schema
- incorrect pane name
- incorrect Canvas class
- Canvas not owned
- Canvas not appended
- `cleanupRequired = false`
- rollback unavailable
- `listenerAdded = true`
- `retentionWritten = true`
- `drawRequested = true`
- missing map reference
- missing pane reference
- missing Canvas reference
- missing lifecycle owner
- incompatible lifecycle owner contract
- second translation attempt after closure

## Files changed

- `client/growgo-custom25d-one-frame-surface-lifecycle-translation.mjs`
- `tests/client-growgo-custom25d-one-frame-surface-lifecycle-translation.test.mjs`
- `client/developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs`
- `tests/client-developer-only-growgo-custom25d-renderer-lifecycle-owner.test.mjs`
- `GROWGO_SESSION_211_43_ONE_FRAME_SURFACE_TO_LIFECYCLE_OWNERSHIP_TRANSLATION.md`

## Classification

- `ONE_FRAME_LIFECYCLE_TRANSLATION_READY`

Reason:

- one prepared one-frame surface can now be translated into lifecycle-owner registration data
- lifecycle cleanup ownership now accurately models one-frame canvas/pane ownership
- no listener ownership is invented
- no retention ownership is invented
- no live renderer action occurs

## Next smallest safe phase

- `211.44 — Gated Live One-Frame Integration Contract`

That next phase can wire:

- readiness
- authorization
- one-frame surface preparation
- lifecycle registration
- centralized frame snapshot
- one-frame draw
- cleanup

through a still-gated passive contract without exposing a live browser command yet.

## Safety

Canonical safety flags remain exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Confirmed:

- renderer enabled: no
- live renderer invoked: no
- real Canvas created: no
- real pane created: no
- listener added: no
- `custom25DMapLayer` mutated: no
- cleanup executed live: no
- browser activation exposed: no

## Commit

YES

Suggested commit message:

- `feat(atlas): add one-frame lifecycle ownership translation`
