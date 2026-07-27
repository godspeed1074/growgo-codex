# GROWGO SESSION 101 — REAL PROVIDER FORMAT SIMULATION

## Session Scope

This session implements and validates:

- `REAL_PROVIDER_FORMAT_SIMULATION_001`

Purpose:

- test `PROVIDER_ADAPTER_LAYER_001` against realistic messy provider-style exports
- preserve deterministic conversion and provenance
- expose validation issues without inventing missing geography
- confirm continued compatibility with `SOURCE_ADAPTER_LAYER_001` and `WORLD_INTERPRETATION_LAYER_001`

This session allows:

- realistic provider fixture creation
- adapter resilience improvements
- validation and warning handling
- confidence handling
- focused tests

This session does not:

- connect live APIs
- import OSM
- modify backend systems
- modify renderer systems
- create assets
- create gameplay systems

## Files Created

- `asset-factory/real-provider-format-simulation.mjs`
- `tests/asset-factory-real-provider-format-simulation.test.mjs`
- `GROWGO_SESSION_101_REAL_PROVIDER_FORMAT_SIMULATION.md`

## Files Changed

- `asset-factory/provider-adapter.mjs`

## 1. Fixture Complexity

Created realistic messy provider-style exports:

- `MESSY_MAP_PROVIDER_EXPORT_001`
- `MESSY_TERRAIN_PROVIDER_EXPORT_001`
- `MESSY_POI_PROVIDER_EXPORT_001`
- `MESSY_NATURAL_PROVIDER_EXPORT_001`

These simulate provider-side issues such as:

- nested attributes
- alternate field names
- missing optional values
- mixed geometry wrappers
- duplicate POIs
- incomplete metadata
- mixed terrain labels
- incomplete natural boundaries
- overlapping natural features
- unsupported categories that must be ignored safely

## 2. Adapter Improvements

Updated:

- `asset-factory/provider-adapter.mjs`

Added support for:

- provider-specific aliases
- nested field lookup
- multiple provider geometry wrappers
- optional-field defaults
- low-confidence mapping capture
- duplicate POI resolution
- warning generation
- safe unsupported-field handling

Concrete improvements include:

- `MultiLineString` to `LineString` handling for provider road/trail inputs
- polyline, bbox, and point-tuple provider geometry conversion
- map aliases such as `pedestrian` → `footway`
- terrain aliases such as `coastal flats` → `COASTAL_PLAIN`
- POI aliases such as `scenic_lookout` → `lookout`, `coffee_shop` → `cafe`
- natural aliases such as `beachfront` → `beach`, `foreshore_park` → `park`, `creek` → `waterway`

## 3. Validation Behaviour

Created:

- `REAL_PROVIDER_SIMULATION_VALIDATION_001`

Validation now checks:

- messy data accepted safely
- invalid data identified
- fields mapped correctly
- confidence recorded
- source IDs preserved
- provider metadata preserved
- normalized output compatible
- classification remains deterministic

Warnings are surfaced rather than hidden.

Examples now detected and reported:

- unsupported road categories
- unsupported POI categories
- missing road surface
- missing road access
- missing terrain slope
- low-confidence POI mapping
- incomplete POI metadata
- duplicate POI resolution
- incomplete natural boundary
- overlapping natural features

## 4. Conversion Results

### Messy Map Provider

Validated:

- nested road tags mapped correctly
- multiple geometry formats normalized safely
- missing surface/access handled with warnings
- unsupported road types ignored safely

### Messy Terrain Provider

Validated:

- elevation aliases mapped correctly
- mixed terrain labels normalized
- missing slope generates warning
- shoreline-style landform still produces coastal evidence

### Messy POI Provider

Validated:

- alternate category names normalized correctly
- duplicate POIs resolved deterministically
- incomplete metadata preserved with warnings
- low-confidence mappings flagged

### Messy Natural Provider

Validated:

- alternate natural feature naming normalized correctly
- incomplete boundaries preserved with warnings
- overlapping features flagged

## 5. Interpretation Compatibility

The messy composite provider simulation remains fully compatible with:

Provider exports

↓

`PROVIDER_ADAPTER_LAYER_001`

↓

`SOURCE_DATA_BUNDLE_001`

↓

`SOURCE_ADAPTER_LAYER_001`

↓

`GROWGO_REGION_PACKAGE_001`

↓

`WORLD_INTERPRETATION_LAYER_001`

Result:

- classification: `COASTAL`
- selected profile: `AUSTRALIAN_COASTAL_WORLD`

The resulting interpretation still validates:

- coastal exploration opportunities
- landmark opportunities
- deterministic scenic route support

## 6. Provenance Behaviour

Confirmed:

- provider source IDs are preserved
- provider metadata is preserved
- converted source features retain provider provenance
- normalized outputs remain traceable
- interpretation remains tied back to real provider-style source records

No fictional features were introduced during handling of messy provider input.

## 7. Test Results

Created:

- `tests/asset-factory-real-provider-format-simulation.test.mjs`

Validated:

- messy road conversion
- messy terrain conversion
- messy POI conversion
- messy natural conversion
- warnings generated
- provenance preserved
- deterministic same input
- interpretation compatibility

Results:

- real provider simulation tests: `7` passed
- provider/source/integration regression tests: `23` passed
- combined focused tests: `30` passed
- `0` failed

## 8. Readiness Status

Session 101 status:

- `READY FOR FUTURE REAL DATASET ADAPTERS`

Reason:

- messy provider-style exports are now handled safely
- warnings are surfaced instead of hidden
- provenance remains intact
- deterministic conversion still holds
- downstream interpretation remains compatible and explainable

## 9. Recommended Next Step

Recommended follow-up:

- create a controlled real dataset adapter package that mirrors one actual external export format more closely while keeping the current no-live-API rule in place
