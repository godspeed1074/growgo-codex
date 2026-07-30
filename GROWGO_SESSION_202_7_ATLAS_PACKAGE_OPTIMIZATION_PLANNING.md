# GROWGO SESSION 202.7 — ATLAS PACKAGE OPTIMIZATION PLANNING

## Goal

Define how Atlas regional packages remain lightweight and mobile efficient.

## Result

Completed `ATLAS_PACKAGE_OPTIMIZATION_001` as the package-efficiency planning layer for Atlas regional packages.

Integrated planning references:

- `ATLAS_REGIONAL_PACKAGE_PLANNING_001`
- `LOCATION_RECIPE_SELECTOR_001`
- `LOCATION_RECIPE_FACTORY_001`

This layer defines how regional packages stay compact, cacheable, deterministic, selector-compatible, and safe for future mobile-oriented Atlas use.

## Files Created

### Code

- `asset-factory/atlas-package-optimization-planning.mjs`

### Tests

- `tests/asset-factory-atlas-package-optimization-planning.test.mjs`

### Generated Planning Records

- `asset-factory-workspace/atlas-optimization/ATLAS_PACKAGE_OPTIMIZATION_001/specification/atlas-package-optimization-specification.json`
- `asset-factory-workspace/atlas-optimization/ATLAS_PACKAGE_OPTIMIZATION_001/validation/atlas-package-optimization-validation.json`
- `asset-factory-workspace/atlas-optimization/ATLAS_PACKAGE_OPTIMIZATION_001/lifecycle/atlas-package-optimization-lifecycle-record.json`
- `asset-factory-workspace/atlas-optimization/ATLAS_PACKAGE_OPTIMIZATION_001/reports/atlas-package-optimization-architecture-report.md`

## Optimization Definition

The optimization specification now defines:

- package compression strategy
- data layer reduction rules
- mobile storage budgets
- cache lifecycle
- regional package priority rules
- nearby region loading strategy
- refresh/version strategy
- offline fallback strategy

## Compression Strategy

Compression profile:

- `MOBILE_METADATA_COMPACT_001`

Supported methods:

- `FIELD_DICTIONARY_COMPACTION`
- `ENUM_NORMALIZATION`
- `DELTA_FREE_COORDINATE_BUCKETING`
- `REDUNDANT_SIGNAL_DEDUPLICATION`
- `JSON_GZIP_AT_REST`

Preserved fields include:

- `packageId`
- `regionId`
- `packageVersion`
- `schemaVersion`
- `selectorCompatibility`
- `cacheMetadata.packageFingerprint`

Forbidden losses:

- selector seed mutation
- recipe compatibility mutation
- identity field removal
- provenance removal

## Data Layer Reduction Rules

Optimization keeps selector-critical layers intact:

- `REGION_BOUNDARY_LAYER`
- `HYDROLOGY_SIGNAL_LAYER`
- `VEGETATION_SIGNAL_LAYER`
- `ACCESS_NETWORK_LAYER`
- `ENVIRONMENT_SUMMARY_LAYER`
- `PROVENANCE_LAYER`

Reduction focuses first on:

- duplicate descriptive strings
- repeated signal arrays
- non-selector-critical secondary hints

## Mobile Storage Budgets

Defined profiles:

- `MOBILE_STANDARD_001`
  - max compressed package size: `96 KB`
  - max warm cache packages: `24`

- `MOBILE_CONSTRAINED_001`
  - max compressed package size: `64 KB`
  - max warm cache packages: `12`

Representative optimized packages currently fit within `MOBILE_STANDARD_001`:

- Bellarine coast package: `72 KB`
- Dandenong forest-edge package: `78 KB`
- mixed coastal/forest margin package: `84 KB`

## Cache Lifecycle

States:

- `COLD`
- `INDEXED`
- `WARM`
- `NEARBY_READY`
- `STALE`
- `EVICTED`

This supports mobile-friendly staged loading instead of keeping every package fully warm at all times.

## Regional Package Priority Rules

Priority factors:

- current region relevance
- adjacent region proximity
- expected selector usefulness
- recipe diversity value
- refresh cost

Priority bands:

- `IMMEDIATE`
- `NEARBY`
- `BACKGROUND`
- `ARCHIVE_ONLY`

## Nearby Region Loading Strategy

Loading bands:

- current region: `1`
- adjacent ring: `4`
- extended context ring: `8`

This remains within the `MOBILE_STANDARD_001` warm-cache budget.

## Refresh and Version Strategy

Refresh triggers:

- source revision change
- selector version change
- classification rule change
- mobile profile change

Version preservation rules ensure that:

- identity fields stay stable when only compression changes
- package fingerprint changes when source revision changes
- selector compatibility is revalidated on selector contract bumps

## Offline Fallback Strategy

Offline modes:

- `INDEX_ONLY`
- `LAST_VALID_SELECTOR_HANDOFF`
- `NO_SELECTION_BLOCK`

Allowed offline artifacts:

- package identity
- environment summary
- last validated selector handoff
- package fingerprint

Blocked offline behaviors:

- map download
- runtime render activation
- asset mutation
- unvalidated selector reconstruction from missing data

## Validation

Validation status: `pass`

Checks passed:

- package efficiency strategy
- deterministic package identity preservation
- recipe compatibility preservation
- mobile suitability
- offline fallback preserves selector safety
- runtime and map downloads blocked

## Lifecycle

Lifecycle status:

- `PLANNING_READY`

Safety state:

- runtime activation authorized: `false`
- map downloads authorized: `false`
- Blender authorized: `false`
- GLB authorized: `false`
- asset modification authorized: `false`

## Testing

Ran:

```text
node --test tests/asset-factory-atlas-package-optimization-planning.test.mjs
```

Result:

- 4 passed
- 0 failed

## Readiness

`ATLAS_PACKAGE_OPTIMIZATION_001` is ready for future Atlas development as the mobile-efficiency planning layer for regional packages.
