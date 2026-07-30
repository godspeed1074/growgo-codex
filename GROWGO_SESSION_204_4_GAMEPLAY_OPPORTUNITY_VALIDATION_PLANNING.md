# GROWGO SESSION 204.4 — GAMEPLAY OPPORTUNITY VALIDATION PLANNING

## Goal

Define validation rules for Atlas-generated gameplay opportunities before they enter Achievement Factory or Quest Factory workflows.

## Result

Completed `ATLAS_GAMEPLAY_OPPORTUNITY_VALIDATION_001` as the planning validation gate for Atlas-generated gameplay opportunities.

Used:

- `ATLAS_GAMEPLAY_INTEGRATION_001`
- `ATLAS_GAMEPLAY_OPPORTUNITY_SIMULATION_001`
- `ATLAS_ACHIEVEMENT_QUEST_FACTORY_BRIDGE_001`

This layer defines how Atlas gameplay opportunities should be scored, de-duplicated, checked for difficulty and location fit, and gated for approval before future gameplay factories can consume them.

## Files Created

### Code

- `asset-factory/gameplay-opportunity-validation-planning.mjs`

### Tests

- `tests/asset-factory-gameplay-opportunity-validation-planning.test.mjs`

### Generated Records

- `asset-factory-workspace/atlas-gameplay/ATLAS_GAMEPLAY_OPPORTUNITY_VALIDATION_001/specification/atlas-gameplay-opportunity-validation-specification.json`
- `asset-factory-workspace/atlas-gameplay/ATLAS_GAMEPLAY_OPPORTUNITY_VALIDATION_001/metadata/atlas-gameplay-opportunity-validation-metadata-contracts.json`
- `asset-factory-workspace/atlas-gameplay/ATLAS_GAMEPLAY_OPPORTUNITY_VALIDATION_001/validation/atlas-gameplay-opportunity-validation-record.json`
- `asset-factory-workspace/atlas-gameplay/ATLAS_GAMEPLAY_OPPORTUNITY_VALIDATION_001/lifecycle/atlas-gameplay-opportunity-validation-lifecycle-rules.json`
- `asset-factory-workspace/atlas-gameplay/ATLAS_GAMEPLAY_OPPORTUNITY_VALIDATION_001/reports/atlas-gameplay-opportunity-validation-architecture-report.md`

## Defined Areas

The validation specification now defines:

- opportunity quality scoring
- duplicate prevention
- difficulty validation
- location suitability checks
- reward planning validation
- player experience rules
- approval gates

## Validation Model

The validation layer now scores and classifies gameplay opportunity candidates into:

- `READY_FOR_FACTORY_INPUT`
- `REVIEW_REQUIRED`
- `HOLD`
- `BLOCKED`

It does this without creating any quest, achievement, reward, runtime, or player-facing state.

## Duplicate Prevention

The planning model now defines deterministic duplicate signatures using:

- approved recipe ID
- scenario type
- opportunity type
- reward theme
- difficulty band

This is used to prevent noisy or repeated gameplay hooks from drifting into future factory workflows.

## Approval Gates

The approval gate requires:

- valid quality score band
- duplicate signature safety
- difficulty validity
- location suitability validity
- reward-planning validity
- player-experience validity

Only approved-recipe-backed opportunity candidates may pass these gates.

## Validation

Validation status: `pass`

Checks passed:

- opportunity quality scoring defined
- duplicate prevention defined
- difficulty validation defined
- location suitability checks defined
- reward planning validation defined
- player experience rules defined
- approval gates defined
- approved recipe only candidates
- duplicate signatures safe
- no live creation or runtime state

## Lifecycle Rules

Lifecycle status:

- `PLANNING_READY`

Allowed states:

- `PLANNING_ONLY`
- `VALIDATION_REVIEW`
- `APPROVAL_GATE_READY`
- `FACTORY_INPUT_READY`

Blocked states:

- `QUEST_CREATED`
- `ACHIEVEMENT_CREATED`
- `REWARD_GRANTED`
- `RUNTIME_ACTIVATED`
- `PLAYER_VISIBLE`

## Safety

Safety state:

- quests created: `false`
- achievements created: `false`
- rewards created: `false`
- runtime activation authorized: `false`
- player exposure authorized: `false`
- Blender authorized: `false`
- GLB authorized: `false`
- asset modification authorized: `false`

## Testing

Focused tests cover:

- deterministic output
- scoring and approval-gate coverage
- approved-recipe-only candidate validation
- duplicate-signature safety
- written record generation
- preserved safety state

## Readiness

`ATLAS_GAMEPLAY_OPPORTUNITY_VALIDATION_001` is ready for future gameplay factory integration.

What is now ready:

- a deterministic validation gate before gameplay factories
- candidate quality scoring and approval-state planning
- duplicate prevention and difficulty validation
- reward-planning and player-experience rule checks

What remains intentionally blocked:

- quest creation
- achievement creation
- rewards
- runtime activation
- player exposure
- Blender
- GLB workflows
- asset modification
