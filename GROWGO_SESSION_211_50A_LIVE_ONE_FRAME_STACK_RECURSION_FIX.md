# GROWGO SESSION 211.50A — LIVE ONE-FRAME STACK RECURSION FIX

Date: Sunday, August 2, 2026
Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
Phase: `211.50a — Fix Live One-Frame Maximum Call Stack Recursion`

## ELI5

The first real Safari try reached the one-frame bridge, prepared the temporary canvas safely, then got stuck calling through an ambiguous bridge path before the snapshot could finish. We fixed that by making the one-frame bridge call explicit private implementations in one direction only, so the snapshot path and draw path cannot bounce back through public names.

## Outcome

Status: PASS

## Preflight

- current branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- initial `git status --short`:
  - clean
- required files present:
  - `GROWGO_SESSION_211_49_MANUAL_GATED_ONE_FRAME_ACTIVATION_COMMAND_IMPLEMENTATION.md`
  - `GROWGO_SESSION_211_50_MANUAL_SAFARI_ONE_FRAME_ACTIVATION_VERIFICATION.md`
  - `tests/client-developer-only-atlas-custom25d-one-frame-command.test.mjs`
  - `tests/client-manual-safari-one-frame-activation-evidence.test.mjs`
- failed Safari evidence preserved:
  - `yes`
- history rewritten:
  - `no`

Pre-change focused regression result:

- focused one-frame/bridge/snapshot/lifecycle suites: `66 passed, 0 failed`

## Preserved First Safari Failure

Phase 211.50 first live Safari command remained preserved as:

- `FAIL — MAXIMUM_CALL_STACK_SIZE_EXCEEDED`

Preserved failure facts:

- surface preparation succeeded
- lifecycle registration succeeded
- frame snapshot creation did not complete
- no draw occurred
- cleanup succeeded
- references were released
- permanent closure still occurred

## Root Cause

The live one-frame bridge relied on same-name public-facing function resolution at the handoff seam instead of explicitly calling private implementation aliases.

That left the Safari live path vulnerable to an accidental recursive bridge resolution loop before the snapshot result returned.

## Exact Recursive Risk Chain

Risky live chain before the fix:

- browser command
- command module
- live adapter
- public one-frame bridge getter
- public bridge function name resolution
- snapshot/draw bridge call path ambiguity

This ambiguity existed specifically around:

- `createCustom25DFrameViewportSnapshotForOneFrame(...)`
- `drawCustom25DOneFrameFromSnapshot(...)`
- `drawCustom25DMapCanvasWithFrameSnapshot(...)`

## Correction

Introduced explicit private implementation aliases in `script.js`:

- `createCustom25DFrameViewportSnapshotPrivateImplementation`
- `drawCustom25DMapCanvasWithFrameSnapshotPrivateImplementation`

Now the one-way call direction is explicit:

- browser command
- command module
- live adapter
- narrow script bridge
- private snapshot implementation
- private snapshot-aware draw implementation

Corrected behavior:

- bridge snapshot wrapper calls the private snapshot implementation directly
- bridge draw wrapper calls the private snapshot-aware draw implementation directly
- `drawCustom25DMapCanvas(...)` delegates one-way to the private snapshot-aware implementation
- no bridge function needs to resolve its own public name during execution

## Files Changed

- `script.js`
- `tests/client-developer-only-growgo-custom25d-live-one-frame-adapter.test.mjs`
- `tests/client-growgo-custom25d-snapshot-aware-draw-seam.test.mjs`
- `tests/client-growgo-custom25d-frame-root-viewport-snapshot.test.mjs`
- `tests/client-developer-only-live-one-frame-adapter-implementation-review.test.mjs`
- `GROWGO_SESSION_211_50_MANUAL_SAFARI_ONE_FRAME_ACTIVATION_VERIFICATION.md`
- `GROWGO_SESSION_211_50A_LIVE_ONE_FRAME_STACK_RECURSION_FIX.md`

## Verification

Isolated fake live-shaped execution after the fix:

- snapshot count: `1`
- draw count: `1`
- cleanup count: `1`
- stack overflow produced: `no`

## Tests

Focused one-frame/bridge/snapshot/lifecycle suites after the fix:

- `PASS`

Full filtered Phase 211.18–211.50 regression band after the fix:

- `PASS`

## Safety

Canonical safety flags remained exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Additional safety confirmations:

- no startup execution added
- no moveend activation added
- no zoomend activation added
- no listeners added
- no timers added
- no animation loop added
- no raw adapter seam exposed
- no raw authorization consume seam exposed
- no renderer visuals altered
- no live Safari retry performed in this phase

## Commit Recommendation

Commit: YES

Suggested commit message:

- `fix(atlas): remove one-frame bridge recursion`

## Next Phase

- `211.50b — Manual Safari One-Frame Activation Retest`
