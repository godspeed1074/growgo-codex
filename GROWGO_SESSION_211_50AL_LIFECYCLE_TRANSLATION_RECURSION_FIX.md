# GrowGo Session 211.50al — Lifecycle Translation Recursion Fix

Date: 2026-08-05
Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
Phase: `211.50al`
Classification: `LIFECYCLE_TRANSLATION_RECURSION_FIXED`

## Goal

Identify the exact repeated call chain inside the lifecycle translation function and correct only that recursion.

## Exact lifecycle translation function

The adapter invokes:

- `translatePreparedSurfaceToLifecycleBundle(...)`

from:

- `client/growgo-custom25d-one-frame-surface-lifecycle-translation.mjs`

## Direct helpers traced

The translation path now traces these direct helpers:

- `translatePreparedSurfaceToLifecycleBundle`
- `validatePreparedSurface`
- `validateLifecycleOwner`
- `createLifecycleBundle`
- `lifecycleOwner.registerOwnedResources`
- `updateStatus`
- `freezeStatus`
- `createResult`
- `createBundleSnapshot`
- `deepFreeze`
- `buildClosedResult`

## Root cause

The stack overflow was caused by recursive freezing of browser-shaped objects inside the translation result path.

More specifically:

- lifecycle translation builds a lifecycle bundle containing:
  - map
  - pane
  - canvas
- Safari can provide cyclic references across those objects
- `createResult(...)` then deep-freezes the result structure
- `deepFreeze(...)` recursively re-enters itself through those cyclic references

## Exact repeated call chain captured

The bounded trace now captures:

1. `translatePreparedSurfaceToLifecycleBundle`
2. `createResult`
3. `deepFreeze`
4. `deepFreeze`

That repeated `deepFreeze → deepFreeze` recursion is the precise overflow loop.

## Correction

The fix is intentionally narrow:

- preserve the same lifecycle translation flow
- preserve the same lifecycle owner
- preserve cleanup ownership exactly once
- preserve one-frame-only behavior
- do not change bridge, snapshot, draw, authorization, or payload behavior

Implementation change:

- `deepFreeze(...)` is now cycle-safe using a `WeakSet`
- when a previously seen object is encountered:
  - recursion is recorded
  - overflow prevention is recorded
  - traversal stops for that already-seen object

## Developer-only trace added

- `lifecycleTranslationTraceEntered`
- `lifecycleTranslationTraceExited`
- `lifecycleTranslationTraceCurrentDepth`
- `lifecycleTranslationTraceMaxDepth`
- `lifecycleTranslationTraceLast100Calls`
- `lifecycleTranslationRepeatedCallChain`
- `lifecycleTranslationRecursionDetected`
- `lifecycleTranslationOverflowPrevented`
- `lifecycleTranslationLastFunction`
- `lifecycleTranslationPreviousFunction`

## Proof after correction

Focused tests prove:

- translation function enters
- translation function returns
- translation result type is valid
- translation result status is valid
- lifecycleRegistered status write is attempted and completed
- payload-entry trace mutation is attempted
- payload assembly can continue
- no stack overflow occurs
- no duplicate lifecycle owner is created
- cleanup still uses the same lifecycle owner exactly once
- all four canonical safety flags remain false

## Outcome

This was not adapter recursion, bridge recursion, payload recursion, or cleanup recursion.

It was lifecycle-translation result freezing on cyclic browser-shaped objects.

That recursion is now fixed.
