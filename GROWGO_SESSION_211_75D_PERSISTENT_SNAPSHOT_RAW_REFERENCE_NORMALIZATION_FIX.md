# GrowGo Session 211.75d — Persistent Snapshot Raw-Reference Normalization Fix

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

Date:
August 6, 2026

Status:
PASS

Classification:
`PERSISTENT_SNAPSHOT_RAW_REFERENCE_NORMALIZED`

Goal:
Fix the narrow persistent first-frame failure where the real one-frame snapshot reached the persistent path but snapshot creation failed closed with `RAW_REFERENCE_DETECTED`.

Observed Safari evidence before this phase

- authorization succeeded
- attach succeeded
- one Canvas acquired
- one pane acquired
- three listeners registered
- first frame entered the persistent path
- `canvasIdentityId = CANVAS_001`
- `snapshotId = null`
- `snapshotGenerationId = null`
- originating failure reason:
  `RAW_REFERENCE_DETECTED`
- cleanup completed successfully
- cleanup failure reasons remained empty
- all four canonical safety flags remained false

Exact raw-reference field

- `rawSnapshot.contains`

Root cause

The proven one-frame snapshot contract created by `script.js` includes a helper method:

- `contains([latitude, longitude])`

That helper is safe and expected for the one-frame draw seam, but it is not plain serializable data.

The persistent snapshot wrapper was trying to normalize the full one-frame snapshot object as if every field belonged in the persistent frozen snapshot contract. Because `contains` is a function, the persistent raw-reference detector correctly rejected it and failed closed before:

- `snapshotId` could bind into the persistent trace
- `snapshotGenerationId` could bind into the persistent trace

Exact fix

1. Preserved the raw-reference detector.
   - top-level forbidden references such as:
     - `map`
     - `canvas`
     - `pane`
     - `callbacks`
   still fail closed
   - unsupported nested object references still fail closed

2. Added exact raw-reference diagnostics.
   - rejection now records:
     - `rawReferenceFieldPath`
     - `rawReferenceType`
     - `rawReferenceConstructorName`
   - no raw object is exposed

3. Normalized only the persistent snapshot fields that must survive.
   - bounds
   - center
   - pixel origin
   - viewport size
   - canvas layer position
   - scalar payload
   - pixel ratio
   - zoom

4. Allowed the real one-frame helper method to remain one-frame-only.
   - `rawSnapshot.contains` is intentionally ignored during persistent normalization
   - it does not survive into the persistent frozen snapshot
   - the persistent snapshot remains plain-data only

5. Preserved Phase 211.75c draw compatibility.
   - the persistent normalized snapshot still converts back into the exact one-frame draw contract when draw is invoked

Files changed

- `client/developer-only-persistent-atlas-frame-snapshot-provider.mjs`
- `tests/client-developer-only-persistent-atlas-frame-snapshot-provider.test.mjs`

Raw-reference detection proof

- exact rejected field paths are now captured for unsupported raw values
- unsupported constructor names are preserved in diagnostics without exposing instances
- forbidden top-level raw references still fail closed
- the detector was not weakened globally

Snapshot identity propagation proof

- successful persistent snapshot creation now preserves:
  - `snapshotId`
  - `snapshotGenerationId`
- existing first-draw trace coverage remains green
- `canvasIdentityId` propagation remains intact

Draw compatibility proof

- persistent normalized snapshot still converts into the exact one-frame draw contract
- one-frame snapshot-aware draw seam regression remains green
- hybrid persistent verification remains green

Regression band

Passed:

- persistent snapshot wrapper
- persistent first-draw trace
- persistent draw wrapper
- persistent contract integration
- persistent manual command
- hybrid verification
- one-frame snapshot creation
- one-frame snapshot-aware draw
- cleanup wrapper

Result:

- 210 passed
- 0 failed

Safety preserved

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Manual follow-up

Safari retry is still required.

This phase fixes the persistent snapshot raw-reference normalization seam only. It does not enable persistent rendering, startup behavior, retries, listener changes, or safety-flag changes.
