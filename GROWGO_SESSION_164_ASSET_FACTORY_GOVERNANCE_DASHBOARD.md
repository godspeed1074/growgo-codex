# GROWGO SESSION 164 — ASSET FACTORY GOVERNANCE DASHBOARD FOUNDATION

## Summary

Created `ASSET_GOVERNANCE_DASHBOARD_LAYER_001`, a unified read-only governance dashboard that summarizes Asset Factory health, lifecycle state, change pressure, and operational risk.

This layer:

- aggregates production review, impact, audit, version, approval, and publishing records
- summarizes total, active, pending, and deprecated asset state
- surfaces recent changes and high-impact dependency pressure
- highlights approval and publishing issues
- derives a deterministic governance health state

It does not modify assets, approve assets, publish assets, or bypass validation.

## Files Changed

- `asset-factory/asset-governance-dashboard.mjs`
- `tests/asset-factory-asset-governance-dashboard.test.mjs`
- `GROWGO_SESSION_164_ASSET_FACTORY_GOVERNANCE_DASHBOARD.md`

## Target System

Created:

- `ASSET_GOVERNANCE_DASHBOARD_LAYER_001`

Output:

- `ASSET_GOVERNANCE_REPORT_001`
- `ASSET_GOVERNANCE_VALIDATION_001`

## Input Sources

Consumes:

- `ASSET_FACTORY_PRODUCTION_REVIEW_REPORT_001`
- `ASSET_IMPACT_REPORT_001`
- `ASSET_AUDIT_RECORD_001`
- `ASSET_VERSION_RECORD_001`
- `ASSET_APPROVAL_RECORD_001`
- `ASSET_PUBLISH_RECORD_001`

The dashboard builds a single governance summary from existing lifecycle records and leaves every source record untouched.

## Governance Report Structure

Each `ASSET_GOVERNANCE_REPORT_001` includes:

- total assets
- active assets
- pending assets
- deprecated assets
- recent changes
- high-impact changes
- approval issues
- publishing issues
- version health

It also records:

- lifecycle summary
- risk summary
- source record identities
- overall governance health state

## Health States

Supported:

- `HEALTHY`
- `ATTENTION_REQUIRED`
- `BLOCKED`
- `HIGH_RISK`

## Governance Model

The dashboard combines three governance views:

- lifecycle operations from the production review dashboard
- downstream risk from impact analysis
- append-only history from the audit trail

This keeps the output grounded in already-validated systems instead of creating a parallel governance truth.

## Default Verified Summary

Current default governance summary reflects:

- tracked lifecycle state for the active default asset set
- recent audit history for create, version, and publish lifecycle events
- high-impact dependency pressure from Atlas and environment usage
- approval and publishing issues when records are not fully active

The default dashboard intentionally exposes operational pressure rather than hiding it, making it useful as an actual governance tool.

## Risk and Health Rules

Health is derived deterministically from:

- high-impact change count
- approval issue count
- publishing issue count
- blocked production asset count

Severity behavior:

- publishing issues or broad high-impact change pressure -> `HIGH_RISK`
- blocked production assets -> `BLOCKED`
- approval friction or smaller impact pressure -> `ATTENTION_REQUIRED`
- otherwise -> `HEALTHY`

## Validation

Created:

- `ASSET_GOVERNANCE_VALIDATION_001`

Checks passed:

- source records valid
- summaries deterministic
- no mutation
- lifecycle consistency

Deterministic summary hash is stored on the governance report validation record.

## Test Results

Added coverage for:

- dashboard generation
- health calculation
- risk detection
- missing record handling
- deterministic output
- explicit validation

The governance layer is ready to run alongside the surrounding Asset Factory lifecycle and governance suite.

## Readiness

`ASSET_GOVERNANCE_DASHBOARD_LAYER_001` is ready to support larger-scale Asset Factory operation by providing a unified health and risk summary across production state, lifecycle history, impact pressure, approval readiness, and publishing status.
