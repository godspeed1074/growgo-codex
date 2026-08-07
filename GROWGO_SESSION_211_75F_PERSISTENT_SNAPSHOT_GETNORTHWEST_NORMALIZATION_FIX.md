# GrowGo Session 211.75f — Persistent Snapshot getNorthWest Normalization Fix

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

Date:
August 7, 2026

Status:
PASS

Classification:
`PERSISTENT_SNAPSHOT_GETNORTHWEST_HELPER_NORMALIZED`

Goal:
Fix the remaining persistent snapshot raw-reference failure caused by the one-frame helper function:

- `rawSnapshot.getNorthWest`

Observed Safari diagnostics before this phase

- `lastFailureReason = RAW_REFERENCE_DETECTED`
- `rawReferenceDetected = true`
- `rawReferenceFieldPath = rawSnapshot.getNorthWest`
- `rawReferenceType = function`
- `rawReferenceConstructorName = getNorthWest`
- `snapshotCreateAttemptCount = 1`
- `snapshotCreateCompletedCount = 0`
- `snapshotValidationAttemptCount = 0`
- `snapshotValidationCompletedCount = 0`

Exact offending field

- `rawSnapshot.getNorthWest`

Root cause

The real one-frame snapshot contract includes explicit helper methods on the frozen snapshot object. The persistent snapshot wrapper must never store those helpers as part of its own scalar-only frozen snapshot.

After Phase 211.75d and 211.75e:

- `contains()` was already excluded correctly
- `getNorthWest()` was still being rejected at the raw envelope boundary

That meant the persistent snapshot failed before it could finish creation, even though the underlying north-west coordinate values were already available as plain scalar data through the one-frame snapshot contract.

Exact normalization fix

1. Added an explicit audited one-frame helper exclusion list for persistent storage.
   - `contains`
   - `getNorthWest`
   - `getCenter`

2. Preserved strict fail-closed behavior for every other helper/function.
   - unsupported helpers such as `clone()` still fail closed
   - the exact raw-reference field path still surfaces in diagnostics

3. Kept persistent storage scalar-only.
   - helper functions do not survive into the persistent normalized snapshot
   - no Leaflet instances survive into the persistent normalized snapshot

4. Preserved north-west scalar values.
   - north-west latitude/longitude remain available through the normalized persistent bounds payload
   - draw reconstruction remains compatible with the one-frame viewport contract

One-frame helper audit

Reviewed current enumerable helper members on the real one-frame snapshot contract:

- `contains`
- `getNorthWest`
- `getCenter`

Reviewed and confirmed not present as enumerable helpers on this contract in the current implementation:

- `getSouthEast`
- `equals`
- `clone`
- `add`
- `subtract`
- `round`
- `floor`
- `ceil`

Persistent behavior after this phase:

- the audited one-frame helper set above is excluded from persistent storage
- unsupported helpers outside that explicit set still fail closed

Files changed

- `client/developer-only-persistent-atlas-frame-snapshot-provider.mjs`
- `tests/client-developer-only-persistent-atlas-frame-snapshot-provider.test.mjs`

Snapshot identity proof

- successful persistent snapshot creation remains non-null for:
  - `snapshotId`
  - `snapshotGenerationId`
- focused first-draw trace regression remains green

Raw-reference diagnostics proof

- unsupported top-level helper functions still report exact field path/type/constructor
- successful persistent snapshot creation does not retain stale helper functions
- provider status continues to expose exact raw-reference diagnostics when a different unsupported helper appears

Draw compatibility proof

- persistent normalized snapshot still reconstructs the exact one-frame draw viewport contract
- one-frame snapshot-aware draw seam regression remains green
- persistent hybrid verification remains green

Focused regression band

Passed:

- persistent snapshot provider
- persistent snapshot diagnostics
- persistent first-draw trace
- persistent draw wrapper
- persistent contract integration
- persistent manual command
- hybrid verification
- one-frame snapshot creation
- one-frame snapshot-aware draw
- cleanup wrapper

Result:

- 214 passed
- 0 failed

Canonical safety flags remained false

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Manual follow-up

Safari retry is still required.

This phase removes the `getNorthWest` helper leak from persistent snapshot storage. It does not change authorization, map identity, region scope, listeners, scheduler behavior, cleanup order, startup behavior, or canonical safety flags.
