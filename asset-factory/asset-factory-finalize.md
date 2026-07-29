# Asset Factory Finalize Command

Status: Asset Factory v1 reusable finalisation workflow  
Date: 2026-07-29

## Purpose

Safely complete the final Asset Factory v1 lifecycle stages for a validated, visually approved asset without publishing, activating runtime, bypassing approval, or modifying unrelated assets.

## Command

```bash
node asset-factory/asset-factory-finalize.mjs finalize ASSET_ID
```

Conceptually this is the Asset Factory command:

```bash
asset-factory finalize ASSET_ID
```

## Required checks before any action

- export manifest exists
- export validation exists
- GLBs exist
- identity contracts match
- visual approval exists
- no blockers exist
- source/export separation remains valid

## Workflow

1. Validate asset readiness
2. Register if required
   - registration record
   - development catalog entry
   - version record
3. Promote if approved
   - active development revision
   - rollback metadata preserved
4. Generate finalisation audit report

## Safety rules

- never publish
- never activate runtime
- never overwrite previous revisions
- never bypass visual approval
- never modify unrelated assets

## Usage examples

Finalise the proven grass asset:

```bash
node asset-factory/asset-factory-finalize.mjs finalize COASTAL_GRASS_TUSSOCK_001
```

Expected outputs for a successful run:

- registration record present
- development catalog entry present
- version record present
- promotion record present when the asset is approved/current candidate
- finalisation audit report written to `reports/`

## Current tested asset

- `COASTAL_GRASS_TUSSOCK_001_v001`

## Notes

- The command is idempotent for already-finalised assets.
- Promotion is skipped when the asset is already in `active_development_revision`.
- The command stops immediately when any readiness gate fails.
