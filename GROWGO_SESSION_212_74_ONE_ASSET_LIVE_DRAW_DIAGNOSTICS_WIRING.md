# GrowGo Atlas Session 212.74 — One-Asset Live Draw Diagnostics Wiring

Status: wiring complete for developer diagnostics exposure; manual Safari retry still required.

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

## ELI5

We connected the already-proven one-asset live-draw control to the existing developer diagnostics runtime so Safari can see and call it. We did not create a new renderer path, did not add automatic behavior, and did not change the one-asset control rules.

## What was wired

The existing 212.73 live-draw command is now exposed through:

- `window.GrowGoDeveloperDiagnostics.authorizeControlledOneAssetLiveDraw(...)`
- `window.GrowGoDeveloperDiagnostics.drawControlledOneAssetLive(...)`
- `window.GrowGoDeveloperDiagnostics.clearControlledOneAssetLiveDraw(...)`
- `window.GrowGoDeveloperDiagnostics.getControlledOneAssetLiveDrawStatus()`

The browser wiring also exposes:

- `window.GrowGoDeveloperDiagnostics.getControlledOneAssetLiveDrawBrowserWiringStatus()`

## Preserved rules

This phase preserves:

- `TREE_EUCALYPTUS_001` only
- explicit authorization
- explicit draw confirmation
- explicit cleanup
- one active asset maximum
- no startup draw
- no automatic draw
- no timers
- no polling
- no second renderer path

## Browser wiring status

The diagnostics status now includes:

- `oneAssetLiveDrawCommandAvailable`
- `oneAssetLiveDrawDependenciesAvailable`
- `oneAssetLiveDrawBrowserWiringStatus`
- `oneAssetLiveDrawBrowserWiringReason`

These fields are frozen, serializable, and contain no raw browser objects.

## Fail-closed behavior

If required live dependencies are not yet available, the wired commands still exist, but draw attempts fail closed with the preserved dependency reason.

That means Safari can now tell us:

- the command is present
- the browser wiring is present
- which live dependency is still missing

without creating startup rendering or a second renderer path.

## Safety preservation

Canonical safety flags remain:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Manual verification note

This phase wires the command into the browser diagnostics surface only. It does not claim a successful real draw from automated tests. A manual Safari exercise is still required to confirm the live dependency chain is available and that the existing one-asset command can be exercised end-to-end.
