# GrowGo Atlas Phase 212.65 — Asset Factory Build Recipes

Status: PASS

Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
Create a developer-only deterministic Asset Factory build seam that turns validated package manifests into ordered build recipes and generation queue profiles.

What this phase adds:

- `assetBuildRecipeId`
- `generationQueueProfileId`
- `buildStepCount`
- `dependencyCount`
- `factoryReadinessStatus`

Supported handoff:

1. package manifest
2. export validation
3. build recipe
4. generation queue profile
5. future factory execution readiness

Behavior:

- deterministic build recipe IDs
- deterministic queue profile IDs
- explicit build-step counts
- explicit dependency counts
- fail-closed validation for incompatible manifest, export validation, or export contract seams

Fail-closed reasons:

- `ASSET_FACTORY_BUILD_RECIPE_MANIFEST_NOT_FOUND`
- `ASSET_FACTORY_BUILD_RECIPE_EXPORT_VALIDATION_INCOMPATIBLE`
- `ASSET_FACTORY_BUILD_RECIPE_EXPORT_CONTRACT_INCOMPATIBLE`
- `ASSET_FACTORY_BUILD_RECIPE_UNAVAILABLE`

Planner integration:

- planner status exposes frozen serializable build-recipe fields
- resolved feature recipes carry build-recipe fields
- planner decisions include `assetFactoryBuildRecipeDecisions`

Safety proof:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

This phase remains developer-only and planning-only. It prepares deterministic build instructions and queue readiness without enabling generation, export execution, or rendering behavior.
