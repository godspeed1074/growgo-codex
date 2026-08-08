## Phase 212.13h — Developer Scope Alignment for Populated Test Area

Status: completed

Branch:
- `feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
- expand the developer-only Atlas verification scope so Safari can use the real populated Custom25D test area without weakening runtime safety

Problem:
- existing developer scope only matched:
  - `REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION`
- real populated Custom25D feature data exists around:
  - latitude `-38.13565`
  - longitude `144.34905`
- readiness therefore failed closed with:
  - `REGION_OUT_OF_SCOPE`

Fix:
- preserved the existing Bellarine developer scope
- added a second developer-only populated verification scope
- upgraded the Atlas map-adapter core to support multiple approved developer-only scopes
- preserved deterministic identity per matched scope:
  - `regionId`
  - `packageId`
  - `recipeId`
  - `selectorSeed`

New developer-only populated verification scope:
- `scopeId = DEVELOPER_SCOPE_BELLARINE_POPULATED_TEST_AREA`
- `regionId = REGION_BELLARINE_POPULATED_TEST_NEG_38_14_144_35_COASTAL_EXPLORATION`
- `packageId = ATLAS_REGION_PACKAGE_BELLARINE_POPULATED_TEST_NEG_38_14_144_35_v001`
- `recipeId = COASTAL_LOCATION_RECIPE_001`
- `internalDeveloperOnly = true`

Diagnostics added:
- `activeDeveloperScopeId`
- `matchedScopeReason`
- `approvedScopeList`
- `coordinateMatchResult`

Behavior preserved:
- no production runtime enablement
- no startup rendering
- no renderer activation broadening
- no automatic population without explicit developer enablement
- canonical safety flags unchanged:
  - `runtimeExecutionEnabled = false`
  - `mapAttachmentAllowed = false`
  - `automaticRendererExecutionAllowed = false`
  - `lifecycleExecutionEnabled = false`

Focused proof:
1. existing Bellarine scope still resolves
2. populated verification coordinate now resolves
3. out-of-scope coordinates still fail closed
4. live bridge surfaces the matched scope identity
5. production runtime remains blocked
6. renderer remains manual only
7. automatic population still requires explicit enablement

Manual Safari follow-up:
- required
- expected readiness diagnostics now identify which developer scope matched for the populated test area
