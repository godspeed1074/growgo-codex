# GrowGo Session: Diagnostics Namespace All Bootstraps Merge Fix

Date: August 9, 2026
Phase: Diagnostics namespace shared bootstrap repair
Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`

## Goal

Keep `window.GrowGoDeveloperDiagnostics` and related local-development helper namespaces extensible across startup order, instead of older bootstraps replacing the object and dropping later Atlas diagnostics.

## Root cause

Two older `script.js` bootstrap paths were still rebuilding a fresh namespace object and assigning it back onto the browser global:

- phase-248 custom visual manual-test bootstrap
- phase-240 custom25d helper exposure

That replacement pattern broke shared-object identity and could discard Atlas diagnostics that had already been registered.

## Fix applied

Updated both remaining bootstrap paths to:

- reuse the existing namespace object when present
- mutate/add helper commands onto that shared object
- reassign only when the shared object is not already attached

This preserves:

- phase-211.2 diagnostics
- phase-248 helper commands
- phase-240 helper commands
- Atlas diagnostics
- one-asset live draw diagnostics
- renderer-related diagnostics

## Files changed

- `script.js`
- `tests/client-growgo-map-getter.test.mjs`

## Regression proof

Focused test band:

- `node --test tests/client-growgo-map-getter.test.mjs`

Result:

- 13 passed
- 0 failed

## Safety / behavior preservation

No renderer behavior changed.
No Atlas execution behavior changed.
No startup activation changed.
No automatic drawing was added.
Canonical safety flags remain unchanged.
