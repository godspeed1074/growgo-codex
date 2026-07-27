# GROWGO SESSION 165 — ASSET FACTORY ENVIRONMENT SEPARATION FOUNDATION

## Summary

Created `ASSET_ENVIRONMENT_SEPARATION_LAYER_001`, a machine-readable lifecycle-control layer that tracks where an asset currently lives and whether it is allowed to move forward.

This layer:

- models controlled environments across development, testing, approval, and production
- records current and previous environment state
- enforces sequential promotion rules
- validates approval and publish evidence before forward movement
- prevents environment bypass

It does not create assets, bypass lifecycle control, or alter approval and publishing records.

## Files Changed

- `asset-factory/asset-environment-separation.mjs`
- `tests/asset-factory-asset-environment-separation.test.mjs`
- `GROWGO_SESSION_165_ASSET_FACTORY_ENVIRONMENT_SEPARATION.md`

## Target System

Created:

- `ASSET_ENVIRONMENT_SEPARATION_LAYER_001`

Output:

- `ASSET_ENVIRONMENT_RECORD_001`
- `ASSET_ENVIRONMENT_VALIDATION_001`

## Environments

Supported:

- `DEVELOPMENT`
- `TESTING`
- `APPROVAL`
- `PRODUCTION`

## Input

Consumes:

- approval records
- publish records
- version records
- audit records

These records act as the evidence base for determining where an asset can safely exist.

## Environment Record Structure

Each `ASSET_ENVIRONMENT_RECORD_001` includes:

- asset ID
- current environment
- previous environment
- promotion status
- validation status
- transition history

It also records:

- linked source record IDs
- deterministic transition hash

## Promotion Rules

Supported:

- `DEVELOPMENT_TO_TESTING`
- `TESTING_TO_APPROVAL`
- `APPROVAL_TO_PRODUCTION`

The layer only allows one-step movement.

By design it blocks:

- direct development to approval
- direct testing to production
- any forward movement without matching lifecycle evidence

## Validation

Created:

- `ASSET_ENVIRONMENT_VALIDATION_001`

Checks passed:

- promotion allowed
- approval state valid
- publish state valid
- no environment bypass
- deterministic transitions

This ensures the room-based lifecycle control remains machine-checkable and not just a naming convention.

## Test Results

Added coverage for:

- valid promotion
- blocked promotion
- environment tracking
- invalid transition handling
- deterministic output
- explicit validation

The layer is ready to run alongside approval, publishing, versioning, and audit governance systems.

## Readiness

`ASSET_ENVIRONMENT_SEPARATION_LAYER_001` is ready for safe asset operations by giving Asset Factory a formal environment-control model that can keep development, testing, approval, and production states separate and enforceable.
