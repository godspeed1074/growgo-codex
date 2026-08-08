# GrowGo Atlas Session 212.55 — Atlas Asset Family-to-Modular-Bible Style Bridge

Status: PASS

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
Create a developer-only bridge between Atlas style decisions and reusable Modular Bible asset families without enabling runtime rendering.

What this phase adds

- A new developer-only Modular Bible style bridge layer
- Deterministic mapping from Atlas style decisions into:
  - `modularBibleFamilyId`
  - `componentRecipeId`
  - `assetAssemblyProfileId`
- Fail-closed style compatibility checks
- Planner carry-through so bridge diagnostics follow resolved features and accepted placements

Supported bridge categories

- Residential
- Commercial
- Civic
- Vegetation
- Streetscape

Supported component recipe domains

- Roofs
- Walls
- Windows
- Doors
- Fences
- Vegetation modules

Deterministic bridge contract

Same:

- world theme
- asset family
- architecture style
- vegetation style
- streetscape style
- material family
- palette profile

Always returns the same:

- `modularBibleFamilyId`
- `componentRecipeId`
- `assetAssemblyProfileId`
- `styleBridgeStatus`
- `bridgeReason`

Fail-closed behavior

Invalid or incompatible style combinations return:

- `styleBridgeStatus = "blocked"`
- reason:
  - `INCOMPATIBLE_MODULAR_BIBLE_STYLE_BRIDGE`

Planner diagnostics now expose

- `atlasModularBibleStyleBridgeVersion`
- `registeredStyleBridgeRuleCount`
- `modularBibleFamilyId`
- `componentRecipeId`
- `assetAssemblyProfileId`
- `styleBridgeStatus`
- `bridgeReason`
- `modularBibleStyleBridgeDecisions`

Safety proof

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Non-goals preserved

- No runtime renderer activation
- No canvas ownership changes
- No listener changes
- No startup behavior
- No browser-object exposure
- No production enablement
