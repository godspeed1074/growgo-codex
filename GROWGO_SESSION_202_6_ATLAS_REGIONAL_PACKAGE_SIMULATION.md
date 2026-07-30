# GROWGO SESSION 202.6 — ATLAS REGIONAL PACKAGE SIMULATION

## Goal

Create a data-only simulation layer proving regional packages can feed environment classification and recipe selection.

## Result

Completed a simulated package-to-classification-to-selector flow using:

- `ATLAS_REGIONAL_PACKAGE_PLANNING_001`
- `ATLAS_ENGINE_RECIPE_INTEGRATION_001`
- `LOCATION_RECIPE_SELECTOR_001`

The simulation now proves that valid regional packages can:

- preserve deterministic package identity
- emit stable package fingerprints
- provide correct classifier inputs
- hand off deterministic selector payloads
- reach approved recipe selection safely

It also proves that unsupported and invalid packages are blocked.

## Files Created

### Code

- `asset-factory/atlas-regional-package-simulation.mjs`

### Tests

- `tests/asset-factory-atlas-regional-package-simulation.test.mjs`

### Generated Simulation Records

- `asset-factory-workspace/atlas-regional-package/ATLAS_REGIONAL_PACKAGE_PLANNING_001/simulation/atlas-regional-package-simulation-inputs.json`
- `asset-factory-workspace/atlas-regional-package/ATLAS_REGIONAL_PACKAGE_PLANNING_001/simulation/atlas-regional-package-simulation-packages.json`
- `asset-factory-workspace/atlas-regional-package/ATLAS_REGIONAL_PACKAGE_PLANNING_001/simulation/atlas-regional-package-simulation-fingerprints.json`
- `asset-factory-workspace/atlas-regional-package/ATLAS_REGIONAL_PACKAGE_PLANNING_001/simulation/atlas-regional-package-simulation-classifications.json`
- `asset-factory-workspace/atlas-regional-package/ATLAS_REGIONAL_PACKAGE_PLANNING_001/simulation/atlas-regional-package-simulation-selector-handoffs.json`
- `asset-factory-workspace/atlas-regional-package/ATLAS_REGIONAL_PACKAGE_PLANNING_001/validation/atlas-regional-package-simulation-validation.json`
- `asset-factory-workspace/atlas-regional-package/ATLAS_REGIONAL_PACKAGE_PLANNING_001/reports/atlas-regional-package-simulation-report.md`

## Simulated Packages

1. `REGIONAL_PACKAGE_COASTAL_001`
2. `REGIONAL_PACKAGE_FOREST_001`
3. `REGIONAL_PACKAGE_MIXED_001`
4. `REGIONAL_PACKAGE_UNSUPPORTED_001`
5. `REGIONAL_PACKAGE_INVALID_001`

## Simulation Outcomes

- Coastal package:
  - valid package
  - deterministic package fingerprint recorded
  - selector handoff created
  - selected `COASTAL_LOCATION_RECIPE_001`
  - selector confidence `100`
  - fallback `false`

- Forest package:
  - valid package
  - deterministic package fingerprint recorded
  - selector handoff created
  - selected `FOREST_LOCATION_RECIPE_001`
  - selector confidence `100`
  - fallback `false`

- Mixed transition package:
  - valid package
  - deterministic package fingerprint recorded
  - selector handoff created
  - selected `FOREST_LOCATION_RECIPE_001`
  - selector confidence `80`
  - fallback `true`

- Unsupported package:
  - valid package envelope
  - classification blocked as unsupported
  - selector handoff not created
  - recipe selection blocked

- Invalid package:
  - package validation failed
  - blocked before classifier handoff
  - selector handoff not created
  - recipe selection blocked

## Validation

Validation status: `pass`

Checks passed:

- deterministic package identity
- correct classifier inputs
- correct recipe selection
- blocked invalid data
- package compatibility with integration
- runtime activation blocked

## Testing

Ran:

```text
node --test tests/asset-factory-atlas-regional-package-simulation.test.mjs
```

Result:

- 4 passed
- 0 failed

## Safety

- no map downloads
- no runtime activation
- no Blender
- no GLBs
- no asset modification

## Readiness

This simulation layer is ready for future Atlas development and provides a stable data-only proof that regional packages can feed classification and approved recipe selection safely.
