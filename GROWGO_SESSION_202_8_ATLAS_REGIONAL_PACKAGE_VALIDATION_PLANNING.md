# GROWGO SESSION 202.8 — ATLAS REGIONAL PACKAGE VALIDATION PLANNING

## Goal

Define the validation and safety gate system for Atlas regional packages before future distribution.

## Result

Completed `ATLAS_REGIONAL_PACKAGE_VALIDATION_001` as the pre-distribution validation planning layer for Atlas regional packages.

Integrated planning references:

- `ATLAS_REGIONAL_PACKAGE_PLANNING_001`
- `ATLAS_PACKAGE_OPTIMIZATION_001`
- `LOCATION_RECIPE_SELECTOR_001`

This layer defines how future Atlas regional packages are validated, blocked, rolled back, and held inside safe planning boundaries before any later distribution work.

## Files Created

### Code

- `asset-factory/atlas-regional-package-validation-planning.mjs`

### Tests

- `tests/asset-factory-atlas-regional-package-validation-planning.test.mjs`

### Generated Planning Records

- `asset-factory-workspace/atlas-validation/ATLAS_REGIONAL_PACKAGE_VALIDATION_001/specification/atlas-regional-package-validation-specification.json`
- `asset-factory-workspace/atlas-validation/ATLAS_REGIONAL_PACKAGE_VALIDATION_001/validation/atlas-regional-package-validation.json`
- `asset-factory-workspace/atlas-validation/ATLAS_REGIONAL_PACKAGE_VALIDATION_001/lifecycle/atlas-regional-package-validation-lifecycle-record.json`
- `asset-factory-workspace/atlas-validation/ATLAS_REGIONAL_PACKAGE_VALIDATION_001/reports/atlas-regional-package-validation-architecture-report.md`

## Validation Scope

The validation specification now defines:

- package integrity checks
- schema validation
- dependency validation
- recipe compatibility validation
- fingerprint verification
- corruption handling
- rollback strategy
- release gating
- mobile suitability preservation

## Package Integrity Checks

Integrity rules require:

- all required top-level fields
- all required identity fields
- all required regional data layers
- cache metadata including package fingerprint
- intact provenance fields

This ensures package envelopes remain complete before environment classification or selector handoff.

## Schema Validation

The package must match:

- schema ID: `ATLAS_REGIONAL_PACKAGE_SCHEMA_001`
- package type: `ATLAS_REGION_CONTEXT_PACKAGE`
- schema version: `v001`

Schema failures block the package before selector use and move the lifecycle into a schema-blocked state.

## Dependency and Recipe Compatibility Validation

Validation now checks:

- selector dependency alignment with `LOCATION_RECIPE_SELECTOR_001`
- required selector fields preserved
- required environment remains `DEVELOPMENT_ONLY`
- approved recipes only
- deterministic handoff compatibility with the existing Atlas integration contract

This prevents unapproved or drifted recipe targets from entering future package distribution flow.

## Fingerprint Verification

Fingerprint verification now requires:

- deterministic replay of package identity fields
- identical computed and declared fingerprints
- blocking on mismatch
- rollback eligibility to the last validated package fingerprint

This preserves deterministic package identity across planning, refresh, and future delivery preparation.

## Corruption Handling

Corruption and incompatibility reason codes now include:

- `MISSING_REQUIRED_LAYER`
- `MISSING_REQUIRED_IDENTITY`
- `INVALID_SCHEMA_VERSION`
- `SELECTOR_CONTRACT_MISMATCH`
- `APPROVED_RECIPE_DRIFT`
- `FINGERPRINT_MISMATCH`
- `MOBILE_STORAGE_BUDGET_EXCEEDED`

Safe failure behaviour requires:

- selector handoff blocked immediately
- last validated package metadata preserved
- runtime still blocked
- no planning-phase map download
- no payload mutation

## Rollback Strategy

Rollback target:

- `LAST_VALIDATED_PACKAGE_FINGERPRINT`

Rollback rules require:

- previously validated fingerprint only
- preserved region identity lineage
- metadata-only rollback
- explicit corruption or incompatibility reason code

## Release Gating

Lifecycle states:

- `DRAFT_PACKAGE`
- `INTERNAL_VALIDATION_PENDING`
- `VALIDATED_INTERNAL`
- `ROLLBACK_READY`
- `READY_FOR_FUTURE_DISTRIBUTION`
- `BLOCKED`

Required gate checks:

- integrity checks pass
- schema validation pass
- dependency validation pass
- recipe compatibility validation pass
- fingerprint verification pass
- mobile suitability pass

Important safety truth:

- distribution readiness is planning-only
- runtime remains blocked
- this phase does not authorize deployment or runtime package use

## Representative Validation Scenarios

The planning layer includes deterministic representative scenarios for:

- valid coastal package
- valid forest package
- valid mixed-transition package
- corrupt package
- incompatible recipe package
- oversize mobile-budget package

These scenarios prove both positive validation flow and safe blocking behaviour.

## Validation

Validation status: `pass`

Checks passed:

- deterministic package identity
- safe failure behaviour
- approved recipe compatibility
- mobile package suitability
- integrity and schema gate defined
- corruption and rollback coverage defined
- representative failure scenarios block safely
- runtime and distribution still blocked

## Lifecycle

Lifecycle status:

- `PLANNING_READY`

Release gate state:

- `READY_FOR_FUTURE_DISTRIBUTION`

Safety state:

- runtime activation authorized: `false`
- map downloads authorized: `false`
- Blender authorized: `false`
- GLB authorized: `false`
- asset modification authorized: `false`
- package distribution authorized: `false`

## Testing

Ran focused tests covering:

- deterministic planning output
- validation gate definition
- deterministic package identity
- safe failure behaviour
- approved recipe compatibility
- mobile suitability
- record writing and blocked distribution state

## Readiness

`ATLAS_REGIONAL_PACKAGE_VALIDATION_001` is ready for future Atlas development planning.

What is now in place:

- deterministic package validation architecture
- safe blocking and rollback rules
- approved recipe compatibility gate
- mobile suitability gate
- release-gating rules without runtime activation

What remains intentionally blocked:

- map downloads
- runtime activation
- Blender
- GLB workflows
- asset mutation
- actual package distribution
