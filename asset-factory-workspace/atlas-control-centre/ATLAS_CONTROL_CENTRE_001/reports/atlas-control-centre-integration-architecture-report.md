# ATLAS CONTROL CENTRE INTEGRATION ARCHITECTURE REPORT

## Scope

ATLAS_CONTROL_CENTRE_001 defines the read-only developer Control Centre layer for Atlas planning systems.

Integrated systems:

- ATLAS_ADMIN_MONITORING_001
- ATLAS_BUDGET_VALIDATOR_001
- ATLAS_REGIONAL_PACKAGE_VALIDATION_001
- LOCATION_RECIPE_FACTORY_001

## Integrated Areas

- atlas dashboard integration
- recipe management views
- package health views
- budget alert workflows
- approval workflows
- version comparison
- operator actions
- audit logging

## Dashboard Panels

- ATLAS_OVERVIEW: BLOCKED
- RECIPE_MANAGEMENT: WARNING
- PACKAGE_HEALTH: BLOCKED
- BUDGET_ALERTS: BLOCKED
- APPROVAL_AND_AUDIT: HEALTHY

## Safety

- runtime activation authorized: false
- player exposure authorized: false
- Blender authorized: false
- GLB authorized: false
- asset modification authorized: false

## Lifecycle

- lifecycle status: PLANNING_READY
- dashboard read-only: true
- operator action mode: MANUAL_OPERATOR_ONLY

## Readiness

Future Control Centre development: READY
