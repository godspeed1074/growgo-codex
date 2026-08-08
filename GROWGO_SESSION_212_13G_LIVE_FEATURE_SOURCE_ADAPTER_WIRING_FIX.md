## Phase 212.13g — Live Feature Source Adapter Wiring Fix

Status: completed

Branch:
- `feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
- fix the missing live handoff between the current GrowGo Custom25D viewport feature source and the Atlas live feature input adapter

Observed live symptom:
- `getCustom25DCurrentViewportFeatureSource()` exposed real source data
- but `getAtlasLiveFeatureInputAdapterStatus()` remained at:
  - `sourceFeatureCount = 0`
  - `normalizedFeatureCount = 0`
  - `lastFailureReason = null`

Root cause:
1. the app-side live feature source provider depended on a startup-captured diagnostics callback, which could become stale for the live source seam
2. the preview-facing diagnostics getter returned cached adapter state without forcing a live extraction refresh from the current viewport source

Fix:
- added dynamic runtime resolution for:
  - `getCustom25DCurrentViewportFeatureSource()`
- added a safe adapter refresh helper that:
  - runs the existing extraction path
  - updates adapter status counts from the real current source
  - fails closed and records the reason without exposing raw references
- updated the preview-facing live adapter status getter to refresh before reporting status

Preserved:
- existing classification rules
- existing budgets
- existing deterministic IDs
- existing developer-only restrictions
- existing safety flags

No changes made to:
- renderer behavior
- map attachment rules
- draw contracts
- population planner rules
- feature classification heuristics

Proof expected after fix:
- `getAtlasLiveFeatureInputAdapterStatus()` can report:
  - `sourceFeatureCount > 0`
  - `normalizedFeatureCount > 0`
- automatic/population paths still use the same extraction pipeline

Focused regression coverage:
1. current feature source loads
2. buildings normalize
3. zones normalize
4. roads normalize as context input
5. adapter receives source features
6. unavailable source fails closed
7. budgets preserved
8. deterministic output preserved
9. automatic controller regression remains green
10. safety flags remain false

Manual Safari follow-up:
- required
- confirm:
  - `window.GrowGoDeveloperDiagnostics.getAtlasLiveFeatureInputAdapterStatus()`
  now reports non-zero source and normalized feature counts before the automatic population draw path runs
