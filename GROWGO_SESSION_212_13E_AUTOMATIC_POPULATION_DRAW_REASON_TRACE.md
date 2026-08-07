## Phase 212.13e — Automatic Population Draw Reason Trace

Status: completed

Branch:
- `feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
- expose developer-only diagnostics that show where the automatic population redraw reason changes between:
  - automatic population controller
  - population draw integration
  - persistent redraw request
  - redraw validation

Constraints preserved:
- diagnostics only
- no automatic population behavior change
- no listener behavior change
- no controller state-machine change
- no startup activation
- no timer or polling seam introduced
- canonical safety flags remain:
  - `runtimeExecutionEnabled = false`
  - `mapAttachmentAllowed = false`
  - `automaticRendererExecutionAllowed = false`
  - `lifecycleExecutionEnabled = false`

Developer diagnostics surface:
- `window.GrowGoDeveloperDiagnostics.getAtlasPopulationDrawReasonTrace()`
- `window.GrowGoDeveloperDiagnostics.resetAtlasPopulationDrawReasonTrace(reasonCode?)`

Trace schema:
- `schemaId`
- `requestedRedrawReason`
- `controllerTriggerReason`
- `generationTriggerReason`
- `populationDrawReason`
- `persistentRedrawReason`
- `redrawReasonAccepted`
- `redrawReasonRejected`
- `lastFailureReason`
- `traceCompleted`
- `canonicalSafetyFlags`

Recorded boundaries:
1. controller submission start
2. population draw integration input
3. population draw integration output
4. persistent redraw request input
5. redraw validation result

Implementation notes:
- the population draw integration now emits narrow redraw-reason trace events at:
  - persistent redraw request input
  - redraw validation success/failure
- the development-alpha automatic population composition records:
  - controller trigger reason
  - generation trigger reason
  - population draw reason chosen for submission
- the controlled automatic Atlas diagnostics namespace now exposes the frozen trace getter/resetter

Failure-shape this phase is designed to reveal in Safari:
- controller trigger reason may remain `moveend`
- population draw reason may become `automatic_viewport_population`
- persistent redraw reason may stay `automatic_viewport_population`
- redraw validation may reject it with:
  - `lastFailureReason = INVALID_REDRAW_REASON`
  - `redrawReasonRejected = automatic_viewport_population`

Focused regression coverage:
- moveend reason preserved through trace
- zoomend reason preserved through trace
- resize reason preserved through trace
- invalid redraw reason detected and preserved
- trace is frozen
- trace is serializable
- diagnostics namespace exposes getter/resetter
- no behavior changes to automatic execution path

Manual Safari follow-up:
- required
- next manual evidence should call:
  - `window.GrowGoDeveloperDiagnostics.getAtlasPopulationDrawReasonTrace()`
- expected outcome is exact confirmation of the redraw reason value at the failing boundary before any behavior fix is applied
