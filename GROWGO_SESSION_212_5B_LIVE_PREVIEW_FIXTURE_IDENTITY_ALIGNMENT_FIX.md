# GrowGo Session 212.5b — Live Preview Fixture Identity Alignment Fix

Status: PASS

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

## Goal

Fix the live preview identity mismatch where persistent Atlas is attached and healthy in the approved Bellarine scope, but preview planning fails because the planner path still expects older internal preview IDs instead of the active live Atlas identity.

## Root cause

Two identity seams were misaligned:

1. The preview fixture still carried stale identity hints like:
   - `regionId = BELLARINE`
   - `recipeId = RECREATION_AREA_RECIPE_001`

2. The planner and placement allowlists still only accepted older internal preview IDs like:
   - `BELLARINE`
   - `ATLAS_DEVELOPER_PACKAGE`

But the active persistent Atlas live identity is:

- `regionId = REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION`
- `packageId = ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001`
- `recipeId = COASTAL_LOCATION_RECIPE_001`

That mismatch produced the live Safari failure:

- `reasonCode = INVALID_REGION_ID`

## Exact fix

### Preview module

Updated `client/developer-only-atlas-asset-population-preview.mjs` so:

- active persistent Atlas identity is authoritative for:
  - `regionId`
  - `packageId`
  - `recipeId`
  - `selectorSeed`
- fixture identity fields no longer override live Atlas identity
- fixture contributes only:
  - `previewFixtureId`
  - deterministic feature list
  - fixture metadata like `viewportId`
- preview status now exposes:
  - `activeRegionId`
  - `activePackageId`
  - `activeRecipeId`
  - `activeSelectorSeedPresent`
  - `resolvedPreviewFixtureId`
  - `plannerInputIdentityValid`
  - `lastFailureReason`
- preview fails closed with specific planner-identity reasons when active identity is missing
- preview re-checks identity before submission and fails closed on drift

### Planner and registry allowlists

Updated the approved Bellarine allowlists so the exact live Atlas IDs are recognized as approved values, alongside the older internal aliases already used by focused tests.

That alignment was applied in:

- `client/developer-only-atlas-world-population-planner.mjs`
- `client/developer-only-atlas-spatial-rule-registry.mjs`
- `client/developer-only-atlas-asset-registry.mjs`

No broadening beyond the approved Bellarine live identity was introduced.

## Live identity proof covered by tests

Focused tests now prove preview planning/submission uses the active persistent Atlas identity:

- `regionId = REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION`
- `packageId = ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001`
- `recipeId = COASTAL_LOCATION_RECIPE_001`
- `selectorSeed = WORLD_SELECTOR_SEED_001`

They also prove:

- `populationPlanId` becomes non-null
- `batchId` becomes non-null
- fixture identity cannot override active region/package/recipe identity

## Failure preservation proof

Focused tests still fail closed when:

- active region is missing
- active package is missing
- active recipe is missing
- active selector seed is missing
- fixture is unknown
- planner identity drifts

## Safety

Canonical safety flags remain:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

No automatic preview, startup behavior, renderer changes, snapshot changes, or draw-path changes were introduced.

## Result

Phase 212.5b aligns the preview planner input with the active persistent Atlas live identity and removes the false `INVALID_REGION_ID` path for the approved Bellarine attached session.
