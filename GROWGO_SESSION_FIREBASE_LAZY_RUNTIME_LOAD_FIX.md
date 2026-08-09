# GrowGo Session — Firebase Lazy Runtime Load Fix

Phase: development-alpha startup hardening

Date: August 9, 2026

Status: implemented

## Problem

`client/development-alpha-app.mjs` statically imported `client/development-alpha-runtime.mjs`.

That runtime module contains top-level Firebase CDN imports. When those imports fail in Safari or local development, browser module evaluation stops before Atlas developer diagnostics startup can complete.

## Narrow fix

- Removed the top-level static import of `createDevelopmentAlphaFirebaseRuntime` from `client/development-alpha-app.mjs`.
- Added a lazy runtime loader that uses `await import("./development-alpha-runtime.mjs")` only inside the controller `createRuntime(...)` path.
- Added fail-closed handling that throws `DEVELOPMENT_ALPHA_FIREBASE_RUNTIME_UNAVAILABLE` when the runtime module cannot be loaded or does not expose the expected runtime factory.

## Preserved behavior

- Firebase runtime behavior remains unchanged when it is available.
- Atlas diagnostics startup remains independent of Firebase availability.
- Renderer diagnostics startup remains independent of Firebase availability.
- One-asset live draw wiring remains unchanged.
- Canonical safety flags remain unchanged.

## Regression coverage

Focused tests verify:

- the static runtime import is gone
- the lazy runtime import is present
- the fail-closed runtime-unavailable reason is present in source
- existing one-asset diagnostics wiring expectations still hold

## Notes

This phase hardens startup only. It does not enable any new runtime behavior, automatic behavior, renderer behavior, or Atlas execution paths.
