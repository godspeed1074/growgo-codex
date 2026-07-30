# ATLAS_WORLD_GENERATION_COST_PERFORMANCE_001

Status: PASS

## Measured Baselines
- Regional package average: 78 KB
- Regional package peak: 84 KB
- Recipe generation average: 26.92 KB
- Preview payload average: 19.11 KB

## Device Cache Expectations
- Standard profile warm cache: 24 packages / 1872 KB
- Constrained profile warm cache: 12 packages / 936 KB

## Backend Expectations
- Validation passes per package: 6
- Classification passes per package: 1
- Selection passes per package: 1
- Generation passes per successful location: 1
- Preview passes per successful location: 1

## Multiplayer Reuse
- Region packages should be shared by regionId and fingerprint.
- Preview payloads should be shared by deterministic recipe fingerprint.
- Target shared-region reuse rate: 0.85

## Firebase / Backend Cost Direction
- Use immutable versioned blobs for package and preview payloads.
- Keep lightweight indexes separate from bulk payload blobs.
- Avoid duplicate per-player writes when region or preview fingerprints already exist.
- Prefer batched metadata fetches and cache hits over many small reads.

## Validation
- regional_package_sizes_within_standard_budget: PASS
- preview_payloads_remain_metadata_only_and_lightweight: PASS
- device_cache_requirements_match_optimization_budgets: PASS
- backend_processing_short_circuits_invalid_packages: PASS
- multiplayer_region_reuse_defined: PASS
- firebase_cost_assumptions_are_reuse_first: PASS
- runtime_map_blender_glb_and_asset_mutation_blocked: PASS

## Readiness
- Future Atlas engineering: READY
- Runtime activation: BLOCKED
- Map downloads / Blender / GLBs / asset changes: BLOCKED
