# GrowGo Atlas Session 212.74a — Safari Module Graph Cache-Bust Refresh

Status: cache-bust refresh applied for the 212.74 developer diagnostics graph.

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

## ELI5

Safari was still loading an older developer app module graph, so the new one-asset live-draw diagnostics commands never arrived in the browser. We refreshed only the developer module version tag so Safari will request the current graph.

## Cache-bust change

Updated the developer entry/module graph version from:

- `atlas21213k`

to:

- `atlas21274a`

## Updated graph points

The refresh was applied only to the directly related developer Atlas module graph:

- `index.html` entry to `client/development-alpha-app.mjs?v=atlas21274a`
- `client/development-alpha-app.mjs` import of `developer-only-live-atlas-renderer-handoff-readiness.mjs?v=atlas21274a`
- `client/development-alpha-app.mjs` import of `developer-only-atlas-renderer-zero-draw-handoff.mjs?v=atlas21274a`
- `client/developer-only-live-atlas-renderer-handoff-readiness.mjs` import of `developer-only-atlas-renderer-zero-draw-handoff.mjs?v=atlas21274a`
- `client/developer-only-atlas-renderer-zero-draw-handoff.mjs` import of `developer-only-atlas-browser-contract.mjs?v=atlas21274a`

## What did not change

- no Atlas behavior changes
- no renderer logic changes
- no diagnostics command semantic changes
- no startup execution
- no automatic execution
- no safety-flag changes

## Verification

Focused tests were rerun after the cache-bust refresh to confirm the 212.74 diagnostics wiring remained green.

Manual Safari retry is still required to confirm the browser now loads the refreshed module graph and exposes the new diagnostics commands.
