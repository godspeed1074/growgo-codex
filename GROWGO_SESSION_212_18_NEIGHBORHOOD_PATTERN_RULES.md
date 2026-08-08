# GROWGO SESSION 212.18 — ATLAS POPULATION NEIGHBORHOOD PATTERN RULES

## Goal

Add a developer-only neighborhood pattern layer so Atlas can generate connected, believable neighborhood context from normalized features without enabling live production runtime behavior.

## Supported neighborhood patterns

### Residential

- `NEIGHBORHOOD_PATTERN_SUBURBAN_STREET_001`
- `NEIGHBORHOOD_PATTERN_CUL_DE_SAC_001`
- `NEIGHBORHOOD_PATTERN_TOWNHOUSE_ROW_001`
- `NEIGHBORHOOD_PATTERN_COASTAL_RESIDENTIAL_001`

Rules covered:

- housing rhythm
- setback consistency
- vegetation context
- deterministic variation

### Commercial

- `NEIGHBORHOOD_PATTERN_CAFE_STRIP_001`
- `NEIGHBORHOOD_PATTERN_LOCAL_SHOPPING_CLUSTER_001`

Rules covered:

- frontage continuity
- road-facing orientation
- open-space relationship

### Civic

- `NEIGHBORHOOD_PATTERN_SPORTS_COMMUNITY_SITE_001`

Rules covered:

- building
- open area
- vegetation
- access relationship

### Green corridor

- `NEIGHBORHOOD_PATTERN_GREEN_CORRIDOR_001`

Rules covered:

- park connections
- vegetation transitions
- open-space preservation

### Coastal settlement

- `NEIGHBORHOOD_PATTERN_COASTAL_SETTLEMENT_001`

Rules covered:

- lower density
- vegetation buffers
- coastal transition logic

## Deterministic contract

The neighborhood pattern layer must preserve:

- deterministic generation
- command budgets
- developer-only activation
- renderer isolation

The same neighborhood input must produce the same:

- `neighborhoodPatternId`
- `patternCategory`
- `patternSeed`
- `generatedContextCount`
- `patternDecisionReason`

## Planner diagnostics

The planner and registry status surfaces expose frozen serializable diagnostics only:

- `neighborhoodPatternId`
- `patternCategory`
- `patternSeed`
- `generatedContextCount`
- `patternDecisionReason`

No raw map, renderer, Canvas, DOM, or mutable browser references are exposed.

## Safety flags

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Verification intent

Focused regression must prove:

1. same neighborhood input = same pattern
2. different coordinates = deterministic variation
3. residential pattern stable
4. commercial pattern stable
5. civic pattern stable
6. coastal pattern stable
7. budgets preserved
8. automatic controller regression passes
