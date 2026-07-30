# GROWGO SESSION 202.5 — ATLAS REGIONAL PACKAGE PLANNING

## Goal

Define the regional data package layer between real-world source data and Atlas recipe selection.

## Result

Completed `ATLAS_REGIONAL_PACKAGE_PLANNING_001` as the package-contract layer between source-region data and `ATLAS_ENGINE_RECIPE_INTEGRATION_001` / `LOCATION_RECIPE_SELECTOR_001`.

This planning layer defines how a regional package is identified, versioned, cached, refreshed, and validated before Atlas classification and recipe selection ever begin.

## Files Created

### Code

- `asset-factory/atlas-regional-package-planning.mjs`

### Tests

- `tests/asset-factory-atlas-regional-package-planning.test.mjs`

### Generated Planning Records

- `asset-factory-workspace/atlas-regional-package/ATLAS_REGIONAL_PACKAGE_PLANNING_001/specification/atlas-regional-package-planning-specification.json`
- `asset-factory-workspace/atlas-regional-package/ATLAS_REGIONAL_PACKAGE_PLANNING_001/validation/atlas-regional-package-planning-validation.json`
- `asset-factory-workspace/atlas-regional-package/ATLAS_REGIONAL_PACKAGE_PLANNING_001/lifecycle/atlas-regional-package-planning-lifecycle-record.json`
- `asset-factory-workspace/atlas-regional-package/ATLAS_REGIONAL_PACKAGE_PLANNING_001/reports/atlas-regional-package-planning-architecture-report.md`

## Package Planning Definition

The planning specification now defines:

- regional package schema
- data layer definitions
- region ID rules
- deterministic seed strategy
- package versioning
- cache strategy
- refresh strategy
- recipe compatibility contract
- validation rules
- mobile suitability contract

## Regional Package Schema

Required top-level package fields:

- `packageId`
- `regionId`
- `packageVersion`
- `schemaVersion`
- `coordinateReference`
- `dataLayers`
- `environmentSummary`
- `classificationInputs`
- `selectorCompatibility`
- `cacheMetadata`
- `refreshMetadata`

Required identity fields:

- `sourceDatasetId`
- `sourceRevision`
- `regionSlug`
- `latBucket`
- `lngBucket`
- `environmentProfile`

## Data Layer Definitions

Defined layers:

- `REGION_BOUNDARY_LAYER`
- `HYDROLOGY_SIGNAL_LAYER`
- `VEGETATION_SIGNAL_LAYER`
- `ACCESS_NETWORK_LAYER`
- `SETTLEMENT_CONTEXT_LAYER`
- `ENVIRONMENT_SUMMARY_LAYER`
- `PROVENANCE_LAYER`

These layers provide the minimum regional planning data needed to support classification and selector handoff without requiring runtime systems.

## Region Identity Rules

Defined deterministic formats:

- region ID:
  - `REGION_{REGION_SLUG}_{LAT_BUCKET}_{LNG_BUCKET}_{ENVIRONMENT_PROFILE}`
- package ID:
  - `ATLAS_REGION_PACKAGE_{REGION_SLUG}_{LAT_BUCKET}_{LNG_BUCKET}_{PACKAGE_VERSION}`

Collision rule:

- same deterministic inputs must produce the same `regionId` and `packageId`

## Deterministic Seed Strategy

Selector seed inputs:

- `regionId`
- `packageVersion`
- `latBucket`
- `lngBucket`
- `primaryBiomeHint`
- `archetypeHint`
- `selectorVersion`

Package fingerprint inputs:

- `packageId`
- `sourceRevision`
- `schemaVersion`
- `environmentProfile`
- `latBucket`
- `lngBucket`

Guarantees:

- same package inputs yield same region identity
- same package inputs yield same selector seed
- same selector seed yields same approved recipe selection

## Package Versioning

Versioning now tracks:

- `schemaVersion`
- `selectorVersion`
- `integrationPlanningVersion`
- `classificationRuleVersion`

Upgrade rules preserve compatibility checks and keep runtime activation blocked regardless of package revision.

## Cache Strategy

Cache keys:

- `packageFingerprint`
- `sourceRevision`
- `selectorVersion`
- `classificationRuleVersion`
- `mobileProfile`

Cached artifacts:

- `environmentSummary`
- `classificationInputs`
- `selectorHandoff`
- `recipeSelectionPreview`

Storage policy:

- metadata-only
- no runtime mesh cache
- no texture cache

## Refresh Strategy

Refresh modes:

- `SOURCE_REVISION_REFRESH`
- `CLASSIFICATION_RULE_REFRESH`
- `SELECTOR_CONTRACT_REFRESH`
- `MANUAL_REVIEW_REFRESH`

Refresh remains:

- data-only
- no map downloads
- no runtime activation
- no approved-asset mutation

## Recipe Compatibility Contract

Integrated with:

- `ATLAS_ENGINE_RECIPE_INTEGRATION_001`
- `LOCATION_RECIPE_SELECTOR_001`

Approved recipe compatibility currently covers:

- `COASTAL_LOCATION_RECIPE_001`
- `FOREST_LOCATION_RECIPE_001`

Required selector-compatible fields:

- `worldContextId`
- `environment`
- `biomeProfile`
- `routeMode`
- `archetype`
- `desiredFeatures`
- `seed`

## Representative Packages

Representative package examples were generated for:

- Bellarine coast coastal profile
- Dandenong ranges forest-edge profile
- coastal/forest margin mixed-transition profile

These confirm that deterministic region identity and selector seed generation remain stable across known planning contexts.

## Validation

Validation status: `pass`

Checks passed:

- deterministic region identity
- package compatibility
- selector input compatibility
- deterministic seed strategy valid
- future mobile suitability
- runtime and map downloads blocked

## Lifecycle

Lifecycle status:

- `PLANNING_READY`

Safety state:

- runtime activation authorized: `false`
- map downloads authorized: `false`
- Blender authorized: `false`
- GLB authorized: `false`
- asset modification authorized: `false`

## Testing

Ran:

```text
node --test tests/asset-factory-atlas-regional-package-planning.test.mjs
```

Result:

- 4 passed
- 0 failed

## Readiness

`ATLAS_REGIONAL_PACKAGE_PLANNING_001` is ready for future Atlas development as the package-definition layer between real-world regional source data and Atlas recipe selection.
