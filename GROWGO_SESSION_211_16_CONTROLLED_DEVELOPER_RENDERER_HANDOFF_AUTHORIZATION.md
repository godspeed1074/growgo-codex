# GROWGO SESSION 211.16 — CONTROLLED DEVELOPER RENDERER HANDOFF AUTHORIZATION

## Goal

Add a temporary, in-memory, developer-only authorization key for one future Atlas-to-renderer handoff attempt on localhost without waking the renderer, attaching it, or drawing anything.

## Preflight

- current branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- `git status --short` before implementation:
  - clean
- required Phase 211.14 commit confirmed at `HEAD`:
  - `8fd4c8b test(atlas): close out zero-draw renderer handoff Safari evidence`
- focused Phase 211.6 through 211.14 Atlas tests:
  - `PASS`

## Implementation

Created:

- [`client/developer-only-atlas-renderer-handoff-authorization.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-renderer-handoff-authorization.mjs)

Integrated minimally in:

- [`client/development-alpha-app.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/development-alpha-app.mjs)

Focused tests:

- [`tests/client-developer-only-atlas-renderer-handoff-authorization.test.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-developer-only-atlas-renderer-handoff-authorization.test.mjs)

## Exposed Developer Interfaces

Browser-visible developer-only functions:

- `window.GrowGoDeveloperDiagnostics.authorizeAtlasRendererHandoffSession({ confirmation })`
- `window.GrowGoDeveloperDiagnostics.revokeAtlasRendererHandoffSession()`
- `window.GrowGoDeveloperDiagnostics.getAtlasRendererHandoffAuthorizationStatus()`

Not exposed to the browser:

- the internal single-use consume step

That consume step exists only inside the authorization object for isolated tests and future gated activation work.

## Authorization Contract

Authorization now requires:

- local-development host only
- exact confirmation phrase:
  - `AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION`
- currently valid approved readiness result
- exact approved binding to:
  - region ID
  - package ID
  - package version
  - package fingerprint
  - recipe ID
  - recipe version
  - selector seed

The authorization remains:

- in memory only
- single-session
- single-use for a future explicit handoff attempt
- page-reload reset
- side-effect free during status checks and readiness checks

## Drift Protection

After authorization, the current readiness result must still match the bound snapshot.

Drift now fails closed for:

- region changes
- package ID changes
- package version changes
- package fingerprint changes
- recipe ID changes
- recipe version changes
- selector seed changes
- renderer consumer unavailability
- renderer identity mismatch
- blocked readiness such as `REGION_OUT_OF_SCOPE`

## Safety

Canonical safety flags remain exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Confirmed:

- renderer initialized:
  - `no`
- renderer attached:
  - `no`
- draw called:
  - `no`
- canvas created:
  - `no`
- WebGL created:
  - `no`
- overlay created:
  - `no`
- listener added:
  - `no`
- network requested:
  - `no`
- asset download requested:
  - `no`
- automatic authorization:
  - `no`
- automatic invocation:
  - `no`

## Outcome

- overall phase:
  - `PASS`
