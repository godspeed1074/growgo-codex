# Atlas Regional Package Simulation

Status: PASS
Scenario count: 5

## Results
- REGIONAL_PACKAGE_COASTAL_001: COASTAL_LOCATION_RECIPE_001 | package valid true | fingerprint c34d76b593c3f097f548399c4e928fa765960d12a76cd9c4c3f743c0f29f73e1
- REGIONAL_PACKAGE_FOREST_001: FOREST_LOCATION_RECIPE_001 | package valid true | fingerprint f08895e06f8a11785bbc18fa790f57409d7422555436a8dbaf4fc6d510406bbe
- REGIONAL_PACKAGE_MIXED_001: FOREST_LOCATION_RECIPE_001 | package valid true | fingerprint 93c754d37c5524f29053c37f1d2c7e55094b75b8aa02ddeea2567c067d68bbc5
- REGIONAL_PACKAGE_UNSUPPORTED_001: BLOCKED | package valid true | fingerprint a26cec713bfe3a466298dcab4e2afb7959ad5b5df0eb70a8f5497fd084532ec0
- REGIONAL_PACKAGE_INVALID_001: BLOCKED | package valid false | fingerprint 170f1214b0bee4c57e346f076fc336de8bd3cd826a0623e80fc894cb5f4d569f

## Validation
- deterministic_package_identity: PASS
- correct_classifier_inputs: PASS
- correct_recipe_selection: PASS
- blocked_invalid_data: PASS
- package_compatibility_with_integration: PASS
- runtime_activation_blocked: PASS

## Readiness
- Future Atlas development: READY
- Runtime activation: BLOCKED
- Map downloads / Blender / GLBs / asset changes: BLOCKED
