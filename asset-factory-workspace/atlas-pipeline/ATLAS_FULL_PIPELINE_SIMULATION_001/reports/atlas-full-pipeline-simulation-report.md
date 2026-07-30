# ATLAS_FULL_PIPELINE_SIMULATION_001

Status: READY
Scenario count: 5

## Pipeline Flow
- Regional Package
- Validation
- Optimization Check
- Environment Classification
- Recipe Selection
- Location Recipe Generation
- Preview Package

## Scenario Outcomes
- PIPELINE_COASTAL_001: PREVIEW_READY | recipe COASTAL_LOCATION_RECIPE_001
- PIPELINE_FOREST_001: PREVIEW_READY | recipe FOREST_LOCATION_RECIPE_001
- PIPELINE_MIXED_001: PREVIEW_READY | recipe FOREST_LOCATION_RECIPE_001
- PIPELINE_INVALID_001: VALIDATION_BLOCKED | recipe BLOCKED
- PIPELINE_INCOMPATIBLE_VERSION_001: VALIDATION_BLOCKED | recipe BLOCKED

## Validation
- deterministic_pipeline_identity: PASS
- approved_recipes_only_used: PASS
- coastal_pipeline_reaches_preview: PASS
- forest_pipeline_reaches_preview: PASS
- mixed_transition_pipeline_reaches_preview_with_forest_selection: PASS
- invalid_package_blocked_safely: PASS
- incompatible_version_package_blocked_safely: PASS
- factory_and_runtime_safety_preserved: PASS
- no_runtime_map_blender_glb_or_asset_mutation: PASS

## Readiness
- End-to-end Atlas planning simulation: READY
- Runtime activation: BLOCKED
- Map downloads / Blender / GLBs / asset changes: BLOCKED
