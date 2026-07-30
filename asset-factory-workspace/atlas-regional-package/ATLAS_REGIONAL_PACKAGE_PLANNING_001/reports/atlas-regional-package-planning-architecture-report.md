# ATLAS_REGIONAL_PACKAGE_PLANNING_001

Status: PLANNING_READY
Selector reference: LOCATION_RECIPE_SELECTOR_001
Atlas integration reference: ATLAS_ENGINE_RECIPE_INTEGRATION_001

## Package Layer
- Defines a deterministic regional package envelope between source data and Atlas recipe selection.
- Preserves source truth and package provenance.
- Keeps package contents metadata-only and mobile-suitable.

## Representative Packages
- ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001 -> COASTAL_LOCATION_RECIPE_001 | regionId REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION
- ATLAS_REGION_PACKAGE_DANDENONG_RANGES_EDGE_NEG_37_84_145_29_v001 -> FOREST_LOCATION_RECIPE_001 | regionId REGION_DANDENONG_RANGES_EDGE_NEG_37_84_145_29_FOREST_EXPLORATION
- ATLAS_REGION_PACKAGE_COASTAL_FOREST_MARGIN_NEG_38_02_145_01_v001 -> FOREST_LOCATION_RECIPE_001 | regionId REGION_COASTAL_FOREST_MARGIN_NEG_38_02_145_01_MIXED_EDGE_TRANSITION

## Validation
- deterministic_region_identity: PASS
- package_compatibility: PASS
- selector_input_compatibility: PASS
- deterministic_seed_strategy_valid: PASS
- future_mobile_suitability: PASS
- runtime_and_map_downloads_blocked: PASS

## Readiness
- Future Atlas development: READY
- Runtime activation: BLOCKED
- Map downloads / Blender / GLBs / asset changes: BLOCKED
