# GrowGo Session 195.7 — COASTAL_GROUND_COVER_001 v002 Promotion

Date: 2026-07-30
Branch: `feature/growgo-asset-factory-town-expansion`

## Goal

Promote `COASTAL_GROUND_COVER_001_v002` from approved/current candidate to active development revision while preserving `v001` as a historical protected revision.

## Verified before promotion

- export validation exists
- export manifest exists
- visual approval exists
- registration record exists
- identity contracts match

## Updated

- `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/coastal-ground-cover-v002-registration.json`
- `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/coastal-ground-cover-v002-development-catalog-entry.json`
- `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/coastal-ground-cover-v002-version-record.json`

## Created

- `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/coastal-ground-cover-v002-promotion.json`
- `tests/asset-factory-coastal-ground-cover-v002-promotion.test.mjs`
- `GROWGO_SESSION_195_7_COASTAL_GROUND_COVER_001_V002_PROMOTION.md`

## Final asset state

- `v002` = `active_development_revision`
- `v001` = `historical_preserved_revision`
- `v001 protected = true`
- rollback metadata preserved

## Safety

- no publishing performed
- no runtime activation performed
- no other approved assets modified

## Outcome

`COASTAL_GROUND_COVER_001_v002` is now the active development revision in the Asset Factory catalog.
