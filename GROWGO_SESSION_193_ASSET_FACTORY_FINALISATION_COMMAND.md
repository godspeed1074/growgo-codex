# GrowGo Session 193 — Asset Factory Finalisation Command

Date: 2026-07-29
Branch: `feature/growgo-asset-factory-town-expansion`

## Goal

Create a reusable Asset Factory finalisation workflow command that:

- validates readiness
- registers if required
- promotes if approved
- generates a finalisation audit report

without publishing, activating runtime, overwriting previous revisions, bypassing visual approval, or modifying unrelated assets.

## Created

- `asset-factory/asset-factory-finalize.mjs`
- `asset-factory/asset-factory-finalize.md`
- `tests/asset-factory-finalize-command.test.mjs`
- `GROWGO_SESSION_193_ASSET_FACTORY_FINALISATION_COMMAND.md`

## Tested asset

- `COASTAL_GRASS_TUSSOCK_001_v001`

## Command usage

```bash
node asset-factory/asset-factory-finalize.mjs finalize COASTAL_GRASS_TUSSOCK_001
```

Conceptually:

```bash
asset-factory finalize COASTAL_GRASS_TUSSOCK_001
```

## Safety

- publish blocked
- runtime activation blocked
- unrelated assets untouched
- visual approval required
- rollback metadata preserved
