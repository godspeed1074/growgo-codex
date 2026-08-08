# GrowGo Atlas Session 212.59 — Atlas Modular Bible Material Theme Bundle Resolution

Status: PASS

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
Add deterministic material theme bundles that combine compatible materials, palettes, and finish sets across complete developer-only asset groups.

What this phase adds

- `client/developer-only-atlas-material-theme-bundles.mjs`
- `tests/client-developer-only-atlas-material-theme-bundles.test.mjs`
- planner integration in `client/developer-only-atlas-world-population-planner.mjs`

Supported material bundles

- coastal
- heritage
- urban
- rural
- industrial

Bundle behavior

1. Each bundle deterministically resolves:
   - wall material direction
   - roof material direction
   - trim material direction
   - window material direction
   - fence material direction
   - vegetation material direction

2. Bundles preserve:
   - style cohesion
   - settlement identity
   - biome compatibility

Developer-only diagnostics

- `materialThemeBundleId`
- `resolvedFinishSetId`
- `resolvedPaletteSetId`
- `materialBundleCompatibilityStatus`
- `materialBundleReason`

Fail-closed behavior

Invalid or incompatible bundle contexts return deterministic blocked reasons such as:

- `MATERIAL_THEME_BUNDLE_NOT_FOUND`
- `MATERIAL_THEME_BUNDLE_SETTLEMENT_INCOMPATIBLE`
- `MATERIAL_THEME_BUNDLE_BIOME_INCOMPATIBLE`
- `MATERIAL_THEME_BUNDLE_MATERIAL_INCOMPATIBLE`
- `MATERIAL_THEME_BUNDLE_PALETTE_INCOMPATIBLE`
- `MATERIAL_THEME_BUNDLE_FINISH_INCOMPATIBLE`
- `MATERIAL_THEME_BUNDLE_RESOLVED_MATERIAL_INCOMPATIBLE`

Planner integration

- The world population planner now resolves material theme bundles after:
  - material palette / finish compatibility
- The planner now emits:
  - `materialThemeBundleDecisions`
- Resolved feature recipe entries and accepted placements carry the same material bundle diagnostics.

Safety

- planning only
- deterministic output preserved
- command budgets preserved
- renderer isolation preserved
- developer-only activation preserved
- no startup behavior added
- no automatic spawning added
- no renderer activation added

Canonical safety flags

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Proof summary

- bundle selection is deterministic
- material and palette sets remain compatible
- incompatible bundle inputs fail closed
- planner status exposes frozen serializable material bundle diagnostics
- no raw renderer, DOM, Canvas, map, or browser references are exposed
