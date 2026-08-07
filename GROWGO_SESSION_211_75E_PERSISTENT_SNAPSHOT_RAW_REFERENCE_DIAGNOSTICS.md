# GrowGo Session 211.75e — Persistent Snapshot Raw-Reference Diagnostics

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

Date:
August 7, 2026

Status:
PASS

Classification:
`PERSISTENT_SNAPSHOT_RAW_REFERENCE_DIAGNOSTICS_EXPOSED`

Goal:
Expose the persistent snapshot raw-reference rejection metadata through the local developer diagnostics surface so Safari can report the exact offending field path without exposing any raw browser or Leaflet object.

What changed

1. Extended the local developer-only persistent status surface.
   - `getControlledPersistentAtlasStatus().snapshotStatus` now includes:
     - `lastFailureReason`
     - `rawReferenceDetected`
     - `rawReferenceFieldPath`
     - `rawReferenceType`
     - `rawReferenceConstructorName`
     - `snapshotCreateAttemptCount`
     - `snapshotCreateCompletedCount`
     - `snapshotValidationAttemptCount`
     - `snapshotValidationCompletedCount`
     - `snapshotCompletedCount`

2. Added a narrow read-only convenience getter.
   - `window.GrowGoDeveloperDiagnostics.getControlledPersistentAtlasSnapshotStatus()`

3. Preserved behavior.
   - no snapshot normalization changes
   - no raw-reference detector changes
   - no retry logic
   - no startup activation
   - no new browser resource ownership

Live diagnostics bridge

The live persistent snapshot lane now records the existing scalar raw-reference diagnostics into the manual-command composition status so Safari can read them through the existing local diagnostics namespace.

No raw object exposure

The diagnostics surface exposes only:

- strings
- booleans
- counts

It does not expose:

- raw map objects
- Canvas objects
- panes
- Leaflet instances
- callbacks
- mutable snapshot internals

Files changed

- `client/developer-only-controlled-persistent-atlas-manual-command.mjs`
- `client/development-alpha-app.mjs`
- `tests/client-developer-only-controlled-persistent-atlas-manual-command.test.mjs`

Focused proof

- raw-reference metadata is exposed through `snapshotStatus`
- the narrow snapshot-status getter returns the same scalar diagnostics
- stale raw-reference metadata clears correctly after a successful snapshot state
- status remains frozen and serializable
- first-draw trace remains unchanged
- cleanup behavior remains unchanged

Focused test result

- 106 passed
- 0 failed

Canonical safety flags remained false

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Manual follow-up

Safari retry is still required.

Use:

- `window.GrowGoDeveloperDiagnostics.getControlledPersistentAtlasStatus()`

or:

- `window.GrowGoDeveloperDiagnostics.getControlledPersistentAtlasSnapshotStatus()`

to read the exact raw-reference rejection metadata after the next manual persistent attach attempt.
