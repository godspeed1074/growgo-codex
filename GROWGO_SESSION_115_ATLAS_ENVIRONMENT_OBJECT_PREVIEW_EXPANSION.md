# GROWGO SESSION 115 — ATLAS ENVIRONMENT OBJECT PREVIEW EXPANSION

## Summary

Session 115 expands `ATLAS_ENVIRONMENT_PREVIEW_LAYER_001` from natural-feature-only previews into mixed real-world environment previews that now cover residential buildings, commercial businesses, and town-street context objects while preserving authoritative source geometry.

This remains a preview-layer inspection tool. No renderer activation, no gameplay changes, no new assets, and no OSM import were introduced.

## Files Created

- `GROWGO_SESSION_115_ATLAS_ENVIRONMENT_OBJECT_PREVIEW_EXPANSION.md`

## Files Updated

- `asset-factory/atlas-environment-preview.mjs`
- `tests/asset-factory-atlas-environment-preview.test.mjs`

## Preview Types Added

The preview layer now supports:

- `RESIDENTIAL_AREA_PREVIEW`
- `COMMERCIAL_AREA_PREVIEW`
- `TOWN_STREET_PREVIEW`

Existing natural preview types remain supported:

- `COASTAL_PARK_PREVIEW`
- `SUBURBAN_GREENSPACE_PREVIEW`
- `BEACH_EDGE_PREVIEW`

## Preview Expansion Result

`ATLAS_ENVIRONMENT_PREVIEW_OBJECTS_001` now includes mixed object previews with:

- `objectId`
- `objectType`
- `sourceGeometryReference`
- `environmentRecipe`
- `assetRecipe`
- `assignedAssets`
- `lodRules`
- `previewType`
- `previewMetadata`

## Visual Treatment Approach

### Residential Area Preview

Uses:

- real building footprints
- residential recipe resolution
- registered residential asset references

Current supported residential preview object types:

- `HOUSE`
- `TOWNHOUSE`
- `APARTMENT`

### Commercial Area Preview

Uses:

- real business locations
- business recipe resolution
- registered commercial asset references where available

Current supported business/public-facing preview object types:

- `BAKERY`
- `CAFE`
- `SHOP`
- `PETROL_STATION`
- `LIBRARY`
- `SCHOOL`
- `COMMUNITY_BUILDING`

### Town Street Preview

Uses:

- transport route geometry
- road-served commercial context
- mixed frontage inspection metadata

This allows inspection of:

- street-facing businesses
- road/building relationships
- mixed object composition in town corridors

## Validation Update

Session 115 introduces `ATLAS_OBJECT_PREVIEW_VALIDATION_001`.

Validation checks now cover:

- source geometry preserved
- assets exist
- recipes valid
- recipe compatibility
- asset registry references
- deterministic output

Controlled preview-only exceptions are allowed for structural or landmark-style inspection objects that are not yet registry-onboarded asset instances, such as:

- transport route previews
- landmark preview placeholders used for inspection context

This keeps building and business previews strict while allowing mixed street inspection to remain usable.

## Test Coverage Added

Added and validated:

- residential preview
- bakery preview
- commercial preview
- town street preview
- deterministic output

## Validation Results

Executed on Monday, July 27, 2026:

- `tests/asset-factory-atlas-environment-preview.test.mjs` — 10/10 passing
- `tests/asset-factory-asset-registry.test.mjs` — passing
- `tests/asset-factory-nature-environment-recipe-resolver.test.mjs` — passing
- `tests/asset-factory-atlas-object-relationship.test.mjs` — passing
- `tests/asset-factory-growgo-object-classification.test.mjs` — passing

Regression status:

- mixed environment preview expansion passes
- prior natural preview behaviour remains valid
- deterministic preview output remains stable

## Readiness for Future Renderer Connection

Session 115 is ready for future renderer connection at the preview-contract level.

The layer now supports inspection-ready mixed environment previews across:

- natural spaces
- residential footprints
- commercial placements
- street-route context

The system is suitable for the next stage of Atlas preview consumption without changing authoritative source geometry.
