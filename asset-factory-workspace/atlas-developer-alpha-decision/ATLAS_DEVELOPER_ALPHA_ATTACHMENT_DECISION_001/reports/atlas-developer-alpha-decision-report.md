# ATLAS DEVELOPER ALPHA ATTACHMENT DECISION

## Goal

Define the decision framework for whether to proceed from audited preparation into a tiny developer-only Atlas attachment experiment.

## Scope

- decision id: ATLAS_DEVELOPER_ALPHA_ATTACHMENT_DECISION_001
- decided on: 2026-07-30
- permitted region: REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION
- environment: DEVELOPMENT_ONLY
- test users: internal_developer_reviewer, atlas_operator

## Success Metrics

- deterministic coordinate lookup remains stable across repeat requests
- package validation produces no new blocked states in approved region
- monitoring signals stay readable in developer control centre views
- rollback path remains callable without state drift

## Failure Criteria

- runtimeExecutionEnabled becomes true without manual authorization
- mapAttachmentAllowed becomes true outside approved experiment review
- automaticRendererExecutionAllowed becomes true
- package validation enters blocked state for permitted region
- monitoring emits emergency shutdown or unresolved blocked condition

## Validation

- final_audit_passed: PASS
- manual_approval_preserved: PASS
- runtime_planning_only_preserved: PASS
- single_region_internal_scope_defined: PASS
- success_and_failure_gates_defined: PASS
- rollback_owner_and_duration_defined: PASS
- experiment_keeps_flags_disabled: PASS
- runtime_map_renderer_blender_glb_asset_mutation_blocked: PASS

## Safety

- runtimeExecutionEnabled: false
- mapAttachmentAllowed: false
- automaticRendererExecutionAllowed: false
- rendererAttachmentAuthorized: false
- mapDownloadsAuthorized: false
- blenderAuthorized: false
- glbAuthorized: false
- assetModificationAuthorized: false

## Readiness

Developer alpha decision readiness: READY_FOR_GO_NO_GO_REVIEW
