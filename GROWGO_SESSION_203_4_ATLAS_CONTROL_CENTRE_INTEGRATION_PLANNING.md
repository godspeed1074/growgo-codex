# GROWGO SESSION 203.4 — ATLAS CONTROL CENTRE INTEGRATION PLANNING

## Goal

Define the developer Control Centre layer for managing Atlas systems.

## Result

Completed `ATLAS_CONTROL_CENTRE_001` as the read-only Atlas Control Centre integration planning layer.

Integrated references:

- `ATLAS_ADMIN_MONITORING_001`
- `ATLAS_BUDGET_VALIDATOR_001`
- `ATLAS_REGIONAL_PACKAGE_VALIDATION_001`
- `LOCATION_RECIPE_FACTORY_001`

This layer defines how Atlas developers and operators can review recipe state, package health, budget pressure, approvals, version comparisons, and audit trails from one planning-safe Control Centre without activating runtime systems or exposing anything to players.

## Files Created

### Code

- `asset-factory/atlas-control-centre-integration-planning.mjs`

### Tests

- `tests/asset-factory-atlas-control-centre-integration-planning.test.mjs`

### Generated Records

- `asset-factory-workspace/atlas-control-centre/ATLAS_CONTROL_CENTRE_001/specification/atlas-control-centre-integration-specification.json`
- `asset-factory-workspace/atlas-control-centre/ATLAS_CONTROL_CENTRE_001/data-model/atlas-control-centre-integration-data-model.json`
- `asset-factory-workspace/atlas-control-centre/ATLAS_CONTROL_CENTRE_001/validation/atlas-control-centre-integration-validation.json`
- `asset-factory-workspace/atlas-control-centre/ATLAS_CONTROL_CENTRE_001/lifecycle/atlas-control-centre-integration-lifecycle-record.json`
- `asset-factory-workspace/atlas-control-centre/ATLAS_CONTROL_CENTRE_001/reports/atlas-control-centre-integration-architecture-report.md`

## Control Centre Scope

The integration specification now defines:

- Atlas dashboard integration
- recipe management views
- package health views
- budget alert workflows
- approval workflows
- version comparison
- operator actions
- audit logging

## Dashboard Integration

The Control Centre integrates read-only dashboard cards from the monitoring layer and combines them with blocked-scenario counts and budget signal counts for a single operational overview.

## Recipe Management Views

The planning model includes views for:

- approved recipe library
- recipe usage heatmap
- recipe version comparison
- recipe approval queue visibility

These views preserve recipe-factory authority and do not alter recipe state.

## Package Health Views

Package health views now cover:

- package health overview
- blocked package queue
- schema and fingerprint status
- mobile suitability status

The model uses the existing regional validation checks as the source of truth.

## Budget Alert Workflows

The Control Centre surfaces warning and blocking states from the budget validator and defines operator-safe responses such as:

- acknowledge warning
- queue optimization review
- hold for package redesign
- request recipe density review

## Approval and Version Comparison

The planning layer defines approval phases for:

- package validation review
- recipe compatibility review
- budget recommendation review
- Control Centre signoff readiness

It also defines deterministic comparison views for:

- package schema versions
- recipe versions
- selector/factory compatibility
- validator threshold sets

## Operator Actions and Audit Logging

Allowed operator actions remain read-only or workflow-queue oriented:

- view dashboard
- compare records
- acknowledge alert
- queue review
- export report
- open audit trace

Blocked actions include:

- runtime activation
- package downloads
- asset modification
- player-facing publishing
- promotion without approval

Audit logging is append-only and planning-safe.

## Validation

Validation status: `pass`

Checks passed:

- dashboard integration defined
- recipe management views defined
- package health views defined
- budget alert workflows defined
- approval workflows defined
- version comparison defined
- operator actions defined
- audit logging defined
- data model defined
- runtime / player exposure / Blender / GLBs / asset mutation blocked

## Lifecycle

Lifecycle status:

- `PLANNING_READY`

Safety state:

- dashboard read-only: `true`
- runtime activation authorized: `false`
- player exposure authorized: `false`
- Blender authorized: `false`
- GLB authorized: `false`
- asset modification authorized: `false`

## Testing

Focused tests cover:

- deterministic output
- integration-area coverage
- read-only data-model coverage
- written record generation
- preserved safety state

## Readiness

`ATLAS_CONTROL_CENTRE_001` is ready for future Control Centre development.

What is now ready:

- a unified Atlas operator-facing planning contract
- recipe, package, and budget visibility in one layer
- approval and comparison workflow planning
- audit-ready operator workflow definitions

What remains intentionally blocked:

- runtime activation
- player exposure
- Blender
- GLB workflows
- asset modification
