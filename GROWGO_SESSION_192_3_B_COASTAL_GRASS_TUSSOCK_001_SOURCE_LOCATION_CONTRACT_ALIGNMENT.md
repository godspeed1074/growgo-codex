# GrowGo Session 192.3b — COASTAL_GRASS_TUSSOCK_001 Source Location Contract Alignment

Date: 2026-07-29
Branch: `feature/growgo-asset-factory-town-expansion`

## Goal

Align `COASTAL_GRASS_TUSSOCK_001_v001` to the locked Asset Factory v1 folder contract:

- Blender source files belong in `source/`
- Generated GLB files belong in `export/`

## Result

- Confirmed the canonical Asset Factory v1 convention remains `source/` for `.blend`
- Confirmed `export/` remains reserved for generated GLBs
- Moved `COASTAL_GRASS_TUSSOCK_001_v001.blend` from `export/` to `source/`
- Confirmed no duplicate grass source blend remains in `export/`
- Added focused verification coverage for the source/export separation

## Files Changed

- `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/source/COASTAL_GRASS_TUSSOCK_001_v001.blend` (moved from `export/`)
- `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/validation/coastal-grass-tussock-source-location-verification.json`
- `tests/asset-factory-coastal-grass-tussock-intake.test.mjs`
- `tests/asset-factory-coastal-grass-tussock-manual-authoring.test.mjs`
- `GROWGO_SESSION_192_3_B_COASTAL_GRASS_TUSSOCK_001_SOURCE_LOCATION_CONTRACT_ALIGNMENT.md`

## Final Contract

- Final source path:
  `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/source/COASTAL_GRASS_TUSSOCK_001_v001.blend`
- Final export expectation:
  `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/COASTAL_GRASS_TUSSOCK_001_LOD_CLOSE.glb`
  `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/COASTAL_GRASS_TUSSOCK_001_LOD_GAMEPLAY.glb`
  `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/COASTAL_GRASS_TUSSOCK_001_LOD_MAP.glb`

## Safety

- No GLBs exported
- No registration changes
- No promotion changes
- No approved assets modified
