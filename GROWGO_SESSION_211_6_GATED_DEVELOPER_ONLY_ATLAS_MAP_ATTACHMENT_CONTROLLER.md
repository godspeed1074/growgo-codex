# GROWGO SESSION 211.6 — GATED DEVELOPER-ONLY ATLAS MAP ATTACHMENT CONTROLLER

## Goal

Implement the smallest real developer-only attachment controller that can attach one Atlas diagnostic callback to the existing live Leaflet map and detach it cleanly, while the real live application remains unauthorized and detached.

## Repository Discovery

- current branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
- initial git status: clean
- existing Phase 211.6 controller work found: none
- reused files:
  - [`script.js`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/script.js)
  - [`client/developer-only-live-map-centre-atlas-bridge.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-live-map-centre-atlas-bridge.mjs)
  - [`client/developer-only-atlas-browser-contract.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-browser-contract.mjs)
  - [`client/development-alpha-app.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/development-alpha-app.mjs)

Controller ownership lives in:

- [`client/developer-only-atlas-map-attachment-controller.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-map-attachment-controller.mjs)

## Implemented Interfaces

Installed into `window.GrowGoDeveloperDiagnostics`:

- `attachAtlasMapDiagnostic()`
- `detachAtlasMapDiagnostic()`
- `getAtlasMapAttachmentStatus()`

## Attachment Rules

Default live behavior:

- explicit developer invocation only
- obtains the existing map through `getGrowGoMap()`
- reads canonical safety flags through the browser-safe Atlas adapter
- denies attachment while canonical `mapAttachmentAllowed = false`
- installs zero listeners when denied
- never attaches during startup

Authorized isolated test seam:

- may inject `mapAttachmentAllowed = true`
- does not modify canonical application flags
- does not persist authorization
- attaches exactly one `moveend` listener
- reuses the existing live-map-centre Atlas diagnostic bridge
- records latest diagnostic status and reason code
- prevents duplicate listeners

## Detach Rules

- explicit developer invocation only
- removes the exact controller-owned `moveend` listener
- clears controller-owned references
- safe when already detached
- leaves unrelated application listeners untouched

## Status Contract

The controller status now reports:

- schema ID
- `attached`
- authorization state
- listener event name
- owned listener count
- diagnostic invocation count
- last diagnostic status
- last reason code
- approved developer-only scope
- exact safety flag snapshot
- `automaticStartupAttachment = false`
- `rendererActivity = false`
- `networkActivity = false`
- `overlayActivity = false`

## Safety Preservation

Canonical safety flags remain:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

The live page remains:

- detached by default
- renderer-free
- overlay-free
- network-free from the controller path
- startup-safe

## Focused Verification

Covered by:

- [tests/client-developer-only-atlas-map-attachment-controller.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-atlas-map-attachment-controller.test.mjs)

Focused checks include:

1. interface existence
2. denied live attachment under canonical flags
3. zero listeners installed when denied
4. missing-map fail-closed behavior
5. isolated authorized seam installs exactly one `moveend` listener
6. duplicate attach protection
7. one diagnostic per `moveend`
8. repeated `moveend` invocation counting
9. approved coordinate resolution
10. unsupported coordinate fail-closed behavior
11. exact listener removal on detach
12. safe repeated detach
13. unrelated listener preservation
14. accurate status reporting
15. immutable returned results
16. no automatic startup attachment
17. no polling, interval, timeout, move, zoom, GPS, resize, or tap listener addition
18. no renderer work
19. no Canvas or DOM overlay creation
20. no Atlas network request
21. canonical safety flags remain false

## Why It Matters

This phase creates the first real controller-shaped bridge between the live Leaflet map and Atlas diagnostics, but keeps it strictly gated, explicit, and reversible. We now have a verified attach/detach mechanic for developer-only testing without changing the live application’s blocked runtime posture.
