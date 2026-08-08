# GrowGo Atlas Phase 212.66 — Factory Validation Gates

Status: PASS

Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
Create a developer-only deterministic production-readiness seam that validates complete Asset Factory handoff before any future generation step.

What this phase adds:

- `productionReadinessProfileId`
- `factoryValidationStatus`
- `validationGateCount`
- `passedGateCount`
- `productionReadinessReason`

Supported handoff:

1. build recipe
2. generation queue
3. manifest and export validation
4. production readiness gate
5. future generation approval

Behavior:

- deterministic production-readiness profile IDs
- deterministic gate counts and passed-gate counts
- explicit readiness states through a planning-only validation seam
- fail-closed rejection for incompatible build recipe, queue profile, manifest, or export validation seams

Fail-closed reasons:

- `FACTORY_VALIDATION_BUILD_RECIPE_NOT_FOUND`
- `FACTORY_VALIDATION_QUEUE_PROFILE_INCOMPATIBLE`
- `FACTORY_VALIDATION_MANIFEST_INCOMPATIBLE`
- `FACTORY_VALIDATION_EXPORT_VALIDATION_INCOMPATIBLE`
- `FACTORY_VALIDATION_GATE_UNAVAILABLE`

Planner integration:

- planner status exposes frozen serializable validation-gate fields
- resolved feature recipes carry validation-gate fields
- planner decisions include `factoryValidationGateDecisions`

Safety proof:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

This phase remains developer-only and planning-only. It prevents invalid future production jobs without enabling generation, export execution, or rendering behavior.
