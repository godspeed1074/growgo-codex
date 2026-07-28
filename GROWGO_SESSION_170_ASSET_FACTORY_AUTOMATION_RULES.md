# GROWGO SESSION 170 — ASSET FACTORY AUTOMATION RULES FOUNDATION

## Summary

Created `ASSET_AUTOMATION_RULE_LAYER_001`, a deterministic rule-based assistance layer for responding safely to Asset Factory lifecycle events.

This layer:

- defines approved automation rules for supported Asset Factory trigger events
- evaluates events into non-executing automation action records
- preserves approval requirements for any action that could touch lifecycle or discovery state
- keeps all outputs advisory and deterministic
- validates that triggers, actions, and approval boundaries remain intact

It does not bypass approval, publish assets automatically, modify source records without authorization, or change Atlas truth.

## Files Changed

- `asset-factory/asset-automation-rules.mjs`
- `tests/asset-factory-asset-automation-rules.test.mjs`
- `GROWGO_SESSION_170_ASSET_FACTORY_AUTOMATION_RULES.md`

## Target System

Created:

- `ASSET_AUTOMATION_RULE_LAYER_001`

Output:

- `ASSET_AUTOMATION_ACTION_RECORD_001`
- `ASSET_AUTOMATION_VALIDATION_001`

## Supported Trigger Events

The layer supports:

- `ASSET_CREATED`
- `ASSET_VALIDATION_FAILED`
- `ASSET_APPROVED`
- `ASSET_PUBLISHED`
- `ASSET_VERSION_CREATED`
- `ASSET_IMPACT_HIGH`

## Automation Types

Supported action types:

- `CREATE_REVIEW_TASK`
- `UPDATE_DISCOVERY_INDEX`
- `GENERATE_IMPACT_REPORT`
- `REQUEST_VARIANT_REVIEW`
- `GENERATE_RELEASE_NOTE`

Each action is advisory only and remains blocked behind either review or authorization requirements.

## Automation Record Structure

Each `ASSET_AUTOMATION_ACTION_RECORD_001` includes:

- trigger event
- matched rule
- suggested action
- approval requirement
- execution status

The record also includes a compact context summary so downstream systems can see severity, source record identity, and governance state without mutating any source record.

## Rule Model

The rule catalog currently maps:

- asset creation -> review task
- validation failure -> review task and variant review
- asset approval -> discovery index refresh suggestion
- asset publish -> release-note generation and discovery index refresh suggestion
- version creation -> impact report generation
- high impact -> high-impact report generation

This keeps automation helpful while respecting the Asset Factory governance model.

## Validation

Created:

- `ASSET_AUTOMATION_VALIDATION_001`

Checks passed:

- rule valid
- trigger valid
- action valid
- approval requirements preserved
- deterministic output

The validation record stores a deterministic automation hash from a fixed publish-event probe.

## Test Results

Added coverage for:

- validation failure trigger
- publish trigger
- impact trigger
- approval requirement
- deterministic output

## Readiness

`ASSET_AUTOMATION_RULE_LAYER_001` is ready for controlled Asset Factory assistance by turning lifecycle events into safe, reviewable automation suggestions without changing registry, approval, publishing, or Atlas-owned source truth.
