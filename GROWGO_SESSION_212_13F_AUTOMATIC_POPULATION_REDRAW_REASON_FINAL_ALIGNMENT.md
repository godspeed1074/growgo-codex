## Phase 212.13f — Automatic Population Redraw Reason Final Alignment

Status: completed

Branch:
- `feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
- preserve the validated viewport trigger reason through the automatic population draw path
- fix the final Safari mismatch where:
  - `controllerTriggerReason = moveend`
  - `generationTriggerReason = moveend`
  - but `populationDrawReason = automatic_viewport_population`
  - and persistent redraw validation rejected it with `INVALID_REDRAW_REASON`

Root cause:
- the automatic population app composition replaced the real generation trigger reason with the internal label `automatic_viewport_population` before submitting to the persistent redraw contract

Fix:
- automatic population draw submission now uses:
  - `generation.triggerReason`
- no redraw allowlist changes were made
- no redraw validation was weakened
- no manual preview behavior changed
- no initial attach behavior changed

Expected automatic trace after fix:
- `controllerTriggerReason = moveend`
- `generationTriggerReason = moveend`
- `populationDrawReason = moveend`
- `persistentRedrawReason = moveend`
- `redrawReasonAccepted = true`

Diagnostics alignment:
- draw-reason trace now reports acceptance/rejection as booleans
- exact reason value still remains visible through:
  - `requestedRedrawReason`
  - `populationDrawReason`
  - `persistentRedrawReason`

Constraints preserved:
- no timers
- no polling
- no startup activation
- no duplicate redraw path introduced
- canonical safety flags remain:
  - `runtimeExecutionEnabled = false`
  - `mapAttachmentAllowed = false`
  - `automaticRendererExecutionAllowed = false`
  - `lifecycleExecutionEnabled = false`

Focused regression coverage:
1. automatic moveend uses `moveend`
2. automatic zoomend uses `zoomend`
3. automatic resize uses `resize`
4. invalid redraw reasons still fail
5. manual preview remains green
6. initial attach/manual persistent path remains green
7. no duplicate redraw
8. no timers
9. no polling
10. safety flags remain false

Files touched:
- `client/development-alpha-app.mjs`
- `client/developer-only-atlas-population-draw-integration.mjs`
- focused tests only

Manual Safari follow-up:
- still required
- next Safari check should confirm the trace now preserves the real viewport event reason end-to-end
