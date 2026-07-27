# GROWGO SESSION 159 — ASSET FACTORY VERSIONING SYSTEM FOUNDATION

## Summary

Created `ASSET_VERSIONING_LAYER_001`, a deterministic version management layer for Asset Factory assets that preserves version history across approval and publishing without overwriting prior versions or bypassing existing controls.

This layer:

- creates version history records
- preserves parent-version lineage
- links versions to approval and publish records
- supports controlled lifecycle progression
- supports deprecation without mutating prior records

It does not overwrite previous versions, break references, change Atlas truth, or bypass approval.

## Files Changed

- `asset-factory/asset-versioning.mjs`
- `tests/asset-factory-asset-versioning.test.mjs`
- `GROWGO_SESSION_159_ASSET_FACTORY_VERSIONING_SYSTEM.md`

## Target System

Created:

- `ASSET_VERSIONING_LAYER_001`

Output:

- `ASSET_VERSION_RECORD_001`
- `ASSET_VERSION_VALIDATION_001`

## Input

Consumes:

- asset registry records
- publish records
- approval records

The layer can also derive a valid default approval-plus-publish lineage for eligible registry-backed assets when given an asset ID.

## Version Record Structure

Each `ASSET_VERSION_RECORD_001` includes:

- asset ID
- version number
- parent version
- change summary
- approval reference
- publish reference
- active status

Also included:

- version state
- lifecycle history
- created timestamp

## Version Workflow

Supported states:

- `DRAFT`
- `REVIEW`
- `APPROVED`
- `PUBLISHED`
- `DEPRECATED`

Supported transitions:

- `DRAFT` -> `REVIEW`
- `REVIEW` -> `APPROVED`
- `APPROVED` -> `PUBLISHED`
- `PUBLISHED` -> `DEPRECATED`

## Default Verified Version Path

Default verified asset:

- `GROUND_BEACH_SAND_001`

Default created version record:

- version number: `1.0.0`
- parent version: `null`
- version state: `PUBLISHED`
- active status: `true`

This is derived from a valid `ACTIVE` approval record and a `PUBLISHED` publish record.

## Version Increment Rules

Verified increment behavior:

- parent version `1.0.0`
- next derived version `1.0.1`

Version sequence validation ensures:

- version strings remain structured
- parent/child relationships stay valid
- previous version history is preserved

## Publish and Deprecation Linkage

The version layer preserves publish linkage:

- publish reference remains attached to the version record
- published versions remain the active version
- deprecated versions remain historically valid but inactive

Verified deprecation behavior:

- `PUBLISHED` -> `DEPRECATED`
- active status switches to `false`
- linked publish status becomes `RETIRED`

## Validation

Created:

- `ASSET_VERSION_VALIDATION_001`

Checks passed:

- version sequence valid
- asset reference valid
- approval linked
- publish linked
- deterministic output

Deterministic version hash is stored on each version record.

## Guard Rails

Versioning is blocked when:

- the asset is not present in the registry
- the version sequence is invalid
- approval lineage is incomplete
- publish linkage is missing or invalid

This keeps version history downstream of approval and publishing rather than replacing either system.

## Test Results

Added coverage for:

- create version
- version increment
- publish version
- deprecate version
- invalid version handling
- deterministic output
- explicit validation

Focused supporting test pass completed successfully.

Result:

- `26` tests passed
- `0` tests failed

## Readiness

`ASSET_VERSIONING_LAYER_001` is ready to support long-term Asset Factory asset management by preserving deterministic version history across creation, approval, and publishing lifecycles.
