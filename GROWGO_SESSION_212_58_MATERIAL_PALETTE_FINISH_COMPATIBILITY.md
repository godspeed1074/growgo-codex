# GrowGo Atlas Session 212.58 — Atlas Modular Bible Material Palette and Finish Compatibility Profiles

Status: PASS

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
Add a developer-only compatibility layer that validates resolved materials, palettes, and finish profiles after asset variant selection.

What this phase adds

- Deterministic material compatibility validation
- Deterministic palette compatibility validation
- Deterministic finish profile resolution
- Planning-safe diagnostics carried through the world population planner

Validated material domains

- walls
- roofs
- trims
- windows
- roads
- vegetation

Palette validation domains

- regional theme
- settlement identity
- biome
- asset variant

Diagnostics exposed

- `materialCompatibilityStatus`
- `paletteCompatibilityStatus`
- `finishProfileId`
- `resolvedMaterialProfileId`
- `materialReason`

Finish profile coverage

- `FINISH_PROFILE_WEATHERED_001`
- `FINISH_PROFILE_CLEAN_MODERN_001`
- `FINISH_PROFILE_HERITAGE_AGED_001`
- `FINISH_PROFILE_NATURAL_001`
- `FINISH_PROFILE_INDUSTRIAL_001`

Fail-closed behavior

Invalid or incompatible material contexts return deterministic blocked reasons such as:

- `MATERIAL_FINISH_RULE_NOT_FOUND`
- `MATERIAL_FAMILY_INCOMPATIBLE`
- `PALETTE_PROFILE_INCOMPATIBLE`
- `WORLD_THEME_MATERIAL_INCOMPATIBLE`
- `SETTLEMENT_MATERIAL_INCOMPATIBLE`
- `BIOME_MATERIAL_INCOMPATIBLE`

Planner integration proof

The world population planner now carries:

- `atlasMaterialPaletteFinishCompatibilityProfilesVersion`
- `registeredMaterialCompatibilityRuleCount`
- `materialCompatibilityStatus`
- `paletteCompatibilityStatus`
- `finishProfileId`
- `resolvedMaterialProfileId`
- `materialReason`
- `materialPaletteFinishCompatibilityDecisions`

Safety proof

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Preserved non-goals

- no renderer activation
- no canvas ownership changes
- no listener changes
- no startup behavior
- no production exposure
- no raw browser object exposure
