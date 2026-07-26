# GROWGO SESSION 72 — TOWN VARIANT PREVIEW COMPARISON INSPECTION

## Session Scope

This session compares the four generated outputs of:

- `TOWN_VARIANT_PROFILE_SYSTEM_001`

Using:

- seed `10482`

Profiles compared:

1. `SMALL_COASTAL_TOWN`
2. `REGIONAL_TOWN`
3. `TOURIST_TOWN`
4. `SUBURBAN_CITY_EDGE`

This session is inspection and documentation only.

This session does not:

- modify generator rules
- create new assets
- create new modules
- modify registered buildings
- increase town size
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## Files Created

- `GROWGO_SESSION_72_TOWN_VARIANT_PREVIEW_COMPARISON_INSPECTION.md`

## Files Changed

- none

## Inspection Basis

Inspection performed using:

- `GROWGO_SESSION_71_VARIANT_DRIVEN_TOWN_GENERATOR_IMPLEMENTATION.md`
- `GROWGO_SESSION_70_TOWN_VARIANT_MACHINE_READABLE_CONTRACT.md`
- `GROWGO_SESSION_69_TOWN_VARIANT_EXPANSION_FOUNDATION.md`
- live deterministic generator outputs for seed `10482`

Important note:

- this is a variant-comparison inspection pass, not a Blender viewport signoff
- comparison is based on deterministic machine-readable output, profile metadata, and validation signals

## Comparison Summary

The four variants now produce clearly differentiated settlement structures from the same engine and the same seed.

Key differences are visible in:

- district composition
- centre count and centre type
- commercial mix
- transport intensity
- recreation mix
- landmark density
- boundary behaviour

Shared-engine result:

- all four variants validate successfully
- all four variants produce different deterministic signatures
- profiles do not collapse into a single generic town form

## PASS / FAIL Checklist

### PROFILE DIFFERENTIATION

- each profile produces different output: `PASS`
- profiles do not collapse into the same town: `PASS`

Assessment:

- `SMALL_COASTAL_TOWN` is the only profile with explicit waterfront recreation and a coastal tourism retail edge
- `REGIONAL_TOWN` is the strongest civic/service pattern with a larger practical support footprint
- `TOURIST_TOWN` has the highest visitor-facing commercial and landmark density
- `SUBURBAN_CITY_EDGE` is the only profile with two centres and future-density corridor behaviour

## SMALL_COASTAL_TOWN Review

- waterfront identity: `PASS`
- recreation emphasis: `PASS`
- tourism influence: `PASS`
- landmark placement: `PASS`
- low-density character: `PASS`

Assessment:

- coastal identity remains the strongest and most complete profile
- district mix includes suburban residential, coastal residential, and tourism support
- recreation includes `WATERFRONT_RECREATION_ZONE` and `WALKING_TRAIL`
- landmark spread supports coastline and visitor movement
- low-density character is preserved at `3` districts and `1` centre

## REGIONAL_TOWN Review

- civic importance: `PASS`
- service-centre identity: `PASS`
- rural connections: `PASS`
- transport role: `PASS`
- commercial balance: `PASS`

Assessment:

- civic count increases to `5`
- service edges increase to `2`
- transport corridors increase to `7`
- district mix shifts toward suburban and mixed residential support rather than visitor logic
- `COMMERCIAL_STRIP_001` plus a larger main-street centre give the town a believable regional-service structure

## TOURIST_TOWN Review

- visitor focus: `PASS`
- attraction density: `PASS`
- commercial intensity: `PASS`
- landmark frequency: `PASS`
- recreation emphasis: `PASS`

Assessment:

- `TOURIST_TOWN` has the strongest visitor-facing composition
- it is the only profile with `3` commercial zones and `4` landmark reserves
- district composition includes a dedicated `TOURISM_DISTRICT`
- recreation supports destination use through `WALKING_TRAIL` and added family / visitor support
- landmark spread is the strongest of the four profiles

## SUBURBAN_CITY_EDGE Review

- density increase: `PASS`
- multiple centres: `PASS`
- transport intensity: `PASS`
- commercial growth: `PASS`
- future higher-density support: `PASS`

Assessment:

- this is the largest and most corridor-driven variant
- district count increases to `5`
- centre count increases to `2`
- transport corridors increase to `9`
- the profile includes `RESIDENTIAL_DISTRICT_FUTURE_MEDIUM_DENSITY`
- `FUTURE_SHOPPING_CENTRE` clearly separates it from the other three profiles

## Identity Scores

Scores below represent inspection-level identity quality for the current prototype outputs.

### SMALL_COASTAL_TOWN

- settlement identity score: `100`
- density score: `95`
- commercial score: `88`
- transport score: `80`
- recreation score: `100`
- landmark score: `92`

### REGIONAL_TOWN

- settlement identity score: `100`
- density score: `88`
- commercial score: `86`
- transport score: `92`
- recreation score: `78`
- landmark score: `74`

### TOURIST_TOWN

- settlement identity score: `100`
- density score: `84`
- commercial score: `96`
- transport score: `86`
- recreation score: `94`
- landmark score: `100`

### SUBURBAN_CITY_EDGE

- settlement identity score: `100`
- density score: `98`
- commercial score: `90`
- transport score: `100`
- recreation score: `76`
- landmark score: `70`

## Shared Engine Validation

Confirmed:

- same seed remains deterministic: `PASS`
- only profile changes output: `PASS`
- validation passes for all variants: `PASS`

Evidence:

- `SMALL_COASTAL_TOWN` deterministic signature: `4076613198`
- `REGIONAL_TOWN` deterministic signature: `2603038945`
- `TOURIST_TOWN` deterministic signature: `1871407902`
- `SUBURBAN_CITY_EDGE` deterministic signature: `1146211532`

Common validation result across all variants:

- `profileAppliedCorrectly: true`
- `requiredZonesGenerated: true`
- `weightingToleranceValid: true`
- `validationPassed: true`

## Comparative Output Matrix

### SMALL_COASTAL_TOWN

- districts: `3`
- centres: `1`
- commercial zones: `2`
- civic reserves: `4`
- recreation zones: `5`
- landmark reserves: `3`
- service edges: `1`
- transport corridors: `6`
- boundary shape: `coastal_irregular_polygon`

### REGIONAL_TOWN

- districts: `4`
- centres: `1`
- commercial zones: `2`
- civic reserves: `5`
- recreation zones: `4`
- landmark reserves: `2`
- service edges: `2`
- transport corridors: `7`
- boundary shape: `regional_radial_polygon`

### TOURIST_TOWN

- districts: `4`
- centres: `1`
- commercial zones: `3`
- civic reserves: `4`
- recreation zones: `5`
- landmark reserves: `4`
- service edges: `1`
- transport corridors: `7`
- boundary shape: `scenic_destination_polygon`

### SUBURBAN_CITY_EDGE

- districts: `5`
- centres: `2`
- commercial zones: `2`
- civic reserves: `5`
- recreation zones: `4`
- landmark reserves: `2`
- service edges: `2`
- transport corridors: `9`
- boundary shape: `corridor_growth_polygon`

## Remaining Issues

### ISSUE_TOWN_VARIANT_001

- profile affected: `REGIONAL_TOWN`
- severity: `LOW`
- description: regional identity is structurally correct, but landmark and recreation expression are intentionally lighter than the other variants and may need more visual nuance in future preview passes

### ISSUE_TOWN_VARIANT_002

- profile affected: `SUBURBAN_CITY_EDGE`
- severity: `LOW`
- description: city-edge identity is strongest in transport and centre structure; future preview work may want slightly stronger recreation or civic visual differentiation so it feels less purely corridor-driven

### ISSUE_TOWN_VARIANT_003

- profile affected: `all`
- severity: `LOW`
- description: this comparison confirms rule-level differentiation, but not final viewport-level identity strength; later visual inspection is still needed for style confidence

## Recommendation

Overall recommendation:

- the profile system is functioning as intended
- the four variants are recognisably different
- deterministic behaviour is preserved
- no profile shows collapse or generator failure

## Scaling Decision

Decision:

- `APPROVED FOR MULTI-TOWN GENERATION`

Reasoning:

- shared engine validation passes for all profiles
- profile-specific outputs are materially different
- identity signals line up with the Session 69 and Session 70 design intent
- remaining issues are polish-level, not structural
