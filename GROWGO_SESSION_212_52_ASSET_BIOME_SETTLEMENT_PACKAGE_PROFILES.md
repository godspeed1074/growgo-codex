# GrowGo Atlas Session 212.52 — Asset Biome and Settlement Package Profiles

Status: PASS

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
Add deterministic package profiles that define complete developer-only asset ecosystems for settlements and biomes.

What was added:

- `client/developer-only-atlas-asset-biome-settlement-package-profiles.mjs`
- `tests/client-developer-only-atlas-asset-biome-settlement-package-profiles.test.mjs`
- planner integration in `client/developer-only-atlas-world-population-planner.mjs`

Developer-only profile diagnostics:

- `settlementPackageProfileId`
- `biomePackageProfileId`
- `resolvedWorldPackageId`
- `profileCompatibilityStatus`
- `packageSelectionReason`

Supported settlement profiles:

- coastal village
- rural town
- suburban community
- heritage town
- urban district
- industrial area

Supported biome profiles:

- coastal
- forest
- wetland
- rural
- urban

Profile behavior:

1. Settlement identity selects compatible package profiles.
2. Biome profile constrains package compatibility.
3. World package category must match the resolved profile allowlist.
4. Invalid profile/package combinations fail closed.

Planner integration:

- The world population planner now resolves package profiles after:
  - world package validation
- The planner now emits:
  - `packageProfileDecisions`
- Resolved feature recipe entries and accepted placements carry the same profile diagnostics.

Safety:

- planning only
- deterministic output preserved
- command budgets preserved
- renderer isolation preserved
- developer-only activation preserved
- no startup behavior added
- no automatic spawning added
- no renderer activation added

Canonical safety flags:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Proof summary:

- package profiles are deterministic
- biome/profile mismatches fail closed
- incompatible world package categories fail closed
- planner status exposes frozen serializable profile diagnostics
- no raw renderer, DOM, Canvas, map, or browser references are exposed

Suggested commit:

`feat(atlas): add biome settlement package profiles`
