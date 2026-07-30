# GROWGO SESSION 203.3 — ATLAS ADMIN MONITORING PLANNING

## Goal

Define the developer/admin visibility layer for Atlas systems.

## Result

Completed `ATLAS_ADMIN_MONITORING_001` as the first read-only Atlas admin monitoring planning layer.

Integrated references:

- `ATLAS_BUDGET_VALIDATOR_001`
- `ATLAS_REGIONAL_PACKAGE_VALIDATION_001`
- `LOCATION_RECIPE_SELECTOR_001`
- `LOCATION_RECIPE_FACTORY_001`

This layer defines what Atlas developers and admins should be able to see about package health, recipe usage, budget pressure, validation failures, generation cost, backend workload, and cost signals before any runtime system exists.

## Files Created

### Code

- `asset-factory/atlas-admin-monitoring-planning.mjs`

### Tests

- `tests/asset-factory-atlas-admin-monitoring-planning.test.mjs`

### Generated Records

- `asset-factory-workspace/atlas-monitoring/ATLAS_ADMIN_MONITORING_001/specification/atlas-admin-monitoring-specification.json`
- `asset-factory-workspace/atlas-monitoring/ATLAS_ADMIN_MONITORING_001/data-model/atlas-admin-monitoring-data-model.json`
- `asset-factory-workspace/atlas-monitoring/ATLAS_ADMIN_MONITORING_001/validation/atlas-admin-monitoring-validation.json`
- `asset-factory-workspace/atlas-monitoring/ATLAS_ADMIN_MONITORING_001/lifecycle/atlas-admin-monitoring-lifecycle-record.json`
- `asset-factory-workspace/atlas-monitoring/ATLAS_ADMIN_MONITORING_001/reports/atlas-admin-monitoring-architecture-report.md`

## Monitoring Scope

The monitoring specification now defines:

- Atlas dashboard metrics
- package health monitoring
- recipe usage analytics
- budget warnings
- validation failures
- generation statistics
- backend workload indicators
- cost visibility

## Atlas Dashboard Metrics

The current dashboard planning model includes:

- approved recipe count
- selector input-field count
- regional package validation check count
- budget validator check count
- pipeline scenario count
- preview-ready pipeline count
- blocked pipeline count

## Package Health Monitoring

Package health states:

- `HEALTHY`
- `WARNING`
- `BLOCKED`

The model exposes integrity-pass totals and confirms that mobile suitability, schema coverage, and rollback coverage are present in the package validation layer.

## Recipe Usage Analytics

The admin model now tracks:

- approved recipe IDs
- preview-ready selections by recipe
- fallback selection count

This makes it possible to spot whether Atlas is heavily favoring one recipe or frequently falling back under ambiguity.

## Budget and Failure Visibility

The monitoring layer surfaces:

- total representative warning signals from the budget validator
- recommendation-state coverage
- pipeline blocked count
- invalid-package blocks
- incompatible-version blocks
- budget block signals

This gives future Atlas operations a simple way to see whether problems are data-shape problems, compatibility problems, or budget pressure problems.

## Generation and Backend Indicators

The monitoring model exposes:

- average and peak recipe generation size
- average successful location confidence
- deterministic stage count per successful location
- validation/classification/selection pass counts
- short-circuit behavior for blocked packages
- backend compute-class assumptions

## Cost Visibility

The monitoring layer surfaces:

- average per-region storage footprint
- average per-generated-location artifact footprint
- standard region fetch cost
- successful end-to-end location-prep bandwidth
- Firebase/backend cost-pressure drivers

## Admin Data Model

The generated admin data model includes dashboard cards for:

- package health
- recipe usage
- budget status
- backend load

It also includes tables for:

- recipe usage
- budget recommendations
- blocked scenarios

The model is explicitly read-only and planning-only.

## Validation

Validation status: `pass`

Checks passed:

- atlas dashboard metrics defined
- package health monitoring defined
- recipe usage analytics defined
- budget and failure visibility defined
- generation and backend indicators defined
- admin data model defined
- runtime / downloads / Blender / GLBs / asset mutation blocked

## Lifecycle

Lifecycle status:

- `PLANNING_READY`

Safety state:

- dashboard read-only: `true`
- runtime activation authorized: `false`
- downloads authorized: `false`
- Blender authorized: `false`
- GLB authorized: `false`
- asset modification authorized: `false`

## Testing

Focused tests cover:

- deterministic output
- monitoring-area coverage
- admin data-model coverage
- written record generation
- preserved safety state

## Readiness

`ATLAS_ADMIN_MONITORING_001` is ready for future Atlas operations planning.

What is now ready:

- first admin/developer Atlas monitoring contract
- read-only dashboard data model
- package and recipe health visibility
- budget and cost signal visibility
- backend workload visibility

What remains intentionally blocked:

- runtime activation
- downloads
- Blender
- GLB workflows
- asset modification
