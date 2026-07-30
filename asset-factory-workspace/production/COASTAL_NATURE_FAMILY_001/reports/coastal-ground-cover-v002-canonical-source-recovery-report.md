# COASTAL_GROUND_COVER_001 v002 Canonical Source Recovery Report

- Date: 2026-07-30
- Workflow phase: 195.5a.1 — Canonical Source Recovery
- Status: Complete

## Goal

Restore the correct `COASTAL_GROUND_COVER_001_v002` Blender source into the Asset Factory v1 `source/` lane while preserving quarantine evidence and keeping `export/` free of source files.

## Inspection result

Current folder state:

- canonical source present in:
  `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/source/COASTAL_GROUND_COVER_001_v002.blend`
- no `COASTAL_GROUND_COVER_001_v002*.blend*` files present in:
  `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/`
- quarantine evidence preserved in:
  `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/reports/quarantine/COASTAL_GROUND_COVER_001_v002.blend1`

## Chosen source file

- file: `COASTAL_GROUND_COVER_001_v002.blend`
- canonical hash:
  `0fed203648976371d5ec8d750061bfed70332cd74628218a59226474212137a6`
- known approved-candidate hash match:
  yes

## Preserved quarantine evidence

- file: `COASTAL_GROUND_COVER_001_v002.blend1`
- preserved hash:
  `aa3148ce79b94a71ce81f83c311a2cb0461330223868bc8447e0bd79870babc6`
- quarantine retained:
  yes

## Identity and structure verification

Using the existing v002 authoring setup and prior source verification records, the canonical source remains aligned with:

- asset identity:
  `COASTAL_GROUND_COVER_001`
- expected LOD roots
- expected identity anchors

## Recovery action

No additional file move or copy was required during this phase.

The source lane was already in the correct canonical state at inspection time, so this phase records and verifies the recovery rather than re-performing it.

## Safety

- `v001` remained untouched
- no exports were created
- no registration or promotion actions were performed
- quarantine evidence remained preserved

## Conclusion

The canonical source lane is restored and valid:

- `source/` contains the correct v002 `.blend`
- `export/` contains no v002 `.blend` files
- `reports/quarantine/` retains the backup evidence copy
