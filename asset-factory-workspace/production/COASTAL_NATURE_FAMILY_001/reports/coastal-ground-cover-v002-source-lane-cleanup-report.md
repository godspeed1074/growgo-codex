# COASTAL_GROUND_COVER_001 v002 Source Lane Cleanup Report

- Date: 2026-07-30
- Workflow: Asset Factory v1 source lane normalisation
- Status: Complete

## Goal

Resolve source/export ambiguity for `COASTAL_GROUND_COVER_001_v002` before Phase 195.5 export.

## Chosen source candidate

- File: `COASTAL_GROUND_COVER_001_v002.blend`
- Selected hash: `0fed203648976371d5ec8d750061bfed70332cd74628218a59226474212137a6`
- Canonical source path:
  `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/source/COASTAL_GROUND_COVER_001_v002.blend`

## Why this file was chosen

- It used the canonical `.blend` extension instead of Blender backup `.blend1`
- It had the newer modified timestamp
- It contained the expected v002 asset identity, LOD roots, and identity anchors

## Quarantined candidate

- File: `COASTAL_GROUND_COVER_001_v002.blend1`
- Quarantined hash: `aa3148ce79b94a71ce81f83c311a2cb0461330223868bc8447e0bd79870babc6`
- Quarantine path:
  `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/reports/quarantine/COASTAL_GROUND_COVER_001_v002.blend1`

## Cleanup result

- Canonical source now lives in `source/`
- No `COASTAL_GROUND_COVER_001_v002*.blend*` source candidates remain in `export/`
- `v001` was not modified
- No export, registration, or promotion actions were performed
