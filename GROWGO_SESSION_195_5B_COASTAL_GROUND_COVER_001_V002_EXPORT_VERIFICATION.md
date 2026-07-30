# GrowGo Session 195.5b — COASTAL_GROUND_COVER_001 v002 Export Verification

Date: 2026-07-30
Branch: `feature/growgo-asset-factory-town-expansion`

## Goal

Verify the completed `COASTAL_GROUND_COVER_001_v002` export package without changing registration, promotion, or publishing state.

## Verified export files

- `COASTAL_GROUND_COVER_001_v002_LOD_CLOSE.glb`
- `COASTAL_GROUND_COVER_001_v002_LOD_GAMEPLAY.glb`
- `COASTAL_GROUND_COVER_001_v002_LOD_MAP.glb`
- `coastal-ground-cover-v002-export-manifest.json`

## Hashes

- `COASTAL_GROUND_COVER_001_v002_LOD_CLOSE.glb`
  - `1cb2fc521bf99a88945e06bacaa422ae5486569be4671c0ef11ee7d0b1331d4b`
- `COASTAL_GROUND_COVER_001_v002_LOD_GAMEPLAY.glb`
  - `d1585342023fb8e17e29626be8c45a2dbfc958e3e6ded890fe1798bb93140bed`
- `COASTAL_GROUND_COVER_001_v002_LOD_MAP.glb`
  - `4b45cb33ccad5f2be178c1a3e428469f225e1f58a5b1e5cc4246a63ca0b79a15`

## Triangle counts

- CLOSE: `173`
- GAMEPLAY: `129`
- MAP: `97`

## Validation summary

- GLBs exist
- export manifest exists
- asset identity preserved
- recipe identity preserved
- dependency identity preserved
- per-LOD identity anchor preserved
- no external dependencies detected
- LOD complexity ordering passed:
  - CLOSE > GAMEPLAY > MAP

## Source and historical protection

- canonical source blend hash remained:
  `0fed203648976371d5ec8d750061bfed70332cd74628218a59226474212137a6`
- quarantine evidence hash remained:
  `aa3148ce79b94a71ce81f83c311a2cb0461330223868bc8447e0bd79870babc6`
- `v001` remained untouched

## Safety

- no registration
- no promotion
- no publishing

## Outcome

`COASTAL_GROUND_COVER_001_v002` export verification passed and is ready for the next non-publishing lifecycle gate.
