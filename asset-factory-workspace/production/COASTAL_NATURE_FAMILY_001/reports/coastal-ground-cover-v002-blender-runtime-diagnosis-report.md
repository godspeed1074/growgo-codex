# COASTAL_GROUND_COVER_001 v002 Blender Runtime Diagnosis Report

- Date: 2026-07-30
- Workflow phase: 195.5b — Blender Runtime Recovery
- Status: Blocked by local Blender runtime crash

## Goal

Diagnose why Asset Factory export cannot start for `COASTAL_GROUND_COVER_001_v002` and determine whether the blocker is asset-related or environment-related.

## Installation facts

- Blender application path:
  `/Applications/Blender-4.2-LTS.app`
- Blender executable path:
  `/Applications/Blender-4.2-LTS.app/Contents/MacOS/Blender`
- Blender version:
  `4.2.23 LTS`
- Blender build hash:
  `d0cbe84903e8`
- Executable architecture:
  `x86_64`

## Reproduction summary

Every tested headless startup path crashed before any export script logic could run:

- `Blender -b`
- `Blender -b --factory-startup`
- `Blender -b --factory-startup --python-expr "print('BLENDER_HEADLESS_OK')"`
- `Blender -b --python-expr "print('BLENDER_EXPR_OK')"`

Observed result in each case:

- exit code `139`
- crash file written to:
  `/var/folders/18/n7r_f51d491gtzstrrwpsqgr0000gn/T/blender.crash.txt`

## Crash evidence

The crash backtrace shows Blender failing during startup GPU backend detection:

- `tiny_free_no_lock`
- `supports_barycentric_whitelist`
- `MTLBackend::metal_is_supported`
- `GPU_backend_type_selection_detect`
- `WM_init`

The crash file contained no Python backtrace frames, which means the failure happened before Asset Factory Python export code began executing.

## Cause analysis

This failure is not caused by:

- `COASTAL_GROUND_COVER_001_v002.blend`
- `resume_coastal_ground_cover_001_exports.py`
- locale variables such as `LANG`, `LC_ALL`, or `LC_CTYPE`
- non-factory startup state

This failure is most likely caused by:

- a local Blender runtime issue on this macOS environment
- specifically, a crash during Metal capability detection at Blender startup

## Asset Factory impact

- source verification remains valid
- no GLBs were created
- no export manifest was created
- no registration or promotion state changed
- `v001` remained untouched

## Recovery recommendation

Before retrying export:

1. Restore a Blender runtime that can complete a clean headless startup on this Mac.
2. Confirm the recovery with a minimal check:
   `Blender -b --factory-startup --python-expr "print('BLENDER_HEADLESS_OK')"`
3. Only after that passes, rerun Phase 195.5 export for `COASTAL_GROUND_COVER_001_v002`.

Recommended recovery lane:

- reinstall or replace the current Blender 4.2 LTS app with a known-good build for this machine
- keep Asset Factory source, exporter logic, and approved assets unchanged until startup health is restored

## Conclusion

The current export blocker is environment-related, not asset-related. Asset Factory export should not resume until Blender can start headlessly without crashing.
