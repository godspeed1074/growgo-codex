# GrowGo Session 195.5b — COASTAL_GROUND_COVER_001 Blender Runtime Recovery

Date: 2026-07-30
Branch: `feature/growgo-asset-factory-town-expansion`

## Goal

Diagnose and restore Blender export capability after Phase 195.5 export was blocked by Blender crashing during startup.

## Findings

- Blender installation was present at:
  `/Applications/Blender-4.2-LTS.app`
- Executable path resolved correctly:
  `/Applications/Blender-4.2-LTS.app/Contents/MacOS/Blender`
- Blender version check succeeded:
  `Blender 4.2.23 LTS`
- All tested background startup paths crashed before any asset export work began

## Reproduction result

The crash reproduced on:

- minimal background startup
- background startup with `--factory-startup`
- background startup with a trivial Python expression
- startup with locale variables removed

This showed the failure was independent of:

- the ground cover v002 source file
- Asset Factory exporter logic
- startup scene state
- the tested locale environment variables

## Root cause

Crash evidence points to Blender startup failing in Metal GPU capability detection:

- `supports_barycentric_whitelist`
- `MTLBackend::metal_is_supported`
- `GPU_backend_type_selection_detect`

The crash occurred before any Asset Factory Python frames appeared, so the blocker is a Blender runtime/environment problem rather than an asset or exporter problem.

## Created

- `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/validation/coastal-ground-cover-v002-blender-runtime-diagnosis.json`
- `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/reports/coastal-ground-cover-v002-blender-runtime-diagnosis-report.md`
- `tests/asset-factory-coastal-ground-cover-v002-blender-runtime-recovery.test.mjs`
- `GROWGO_SESSION_195_5B_COASTAL_GROUND_COVER_001_BLENDER_RUNTIME_RECOVERY.md`

## Safety

- no asset files were modified
- no approved assets were modified
- no GLBs were created
- no exporter logic was changed
- no registration or promotion work was performed

## Recovery recommendation

- restore a Blender build/runtime that can pass a minimal headless startup check on this Mac
- verify `Blender -b --factory-startup --python-expr "print('BLENDER_HEADLESS_OK')"` succeeds
- once Blender startup is healthy, rerun Phase 195.5 export

## Outcome

Asset Factory export cannot resume yet. The next required fix is Blender runtime recovery, not asset pipeline changes.
