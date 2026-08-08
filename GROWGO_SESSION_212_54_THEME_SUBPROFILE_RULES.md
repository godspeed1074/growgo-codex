# GrowGo Atlas Session 212.54 — Theme Subprofile Rules

Status: PASS

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
Add deterministic subprofiles below regional themes so Atlas can select coherent architecture, vegetation, and streetscape styles.

What was added:

- `client/developer-only-atlas-theme-subprofile-rules.mjs`
- `tests/client-developer-only-atlas-theme-subprofile-rules.test.mjs`
- planner integration in `client/developer-only-atlas-world-population-planner.mjs`

Developer-only theme subprofile diagnostics:

- `architectureStyleProfileId`
- `vegetationStyleProfileId`
- `streetscapeStyleProfileId`
- `themeSubprofileCompatibility`
- `styleSubprofileReason`

Supported subprofile groups:

1. Architecture subprofiles
   - residential
   - commercial
   - civic

2. Vegetation subprofiles
   - coastal
   - rural
   - forest
   - wetland-ready future seam
   - urban

3. Streetscape subprofiles
   - verge style
   - boundary style
   - path style
   - furniture style

4. Modular Bible preparation
   - architecture families
   - vegetation families
   - streetscape families

Planner integration:

- The world population planner now resolves theme subprofiles after:
  - world theme style bundles
- The planner now emits:
  - `themeSubprofileDecisions`
- Resolved feature recipe entries and accepted placements carry the same subprofile diagnostics.

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

- subprofile selection is deterministic
- incompatible asset-family/theme combinations fail closed
- planner status exposes frozen serializable subprofile diagnostics
- no raw renderer, DOM, Canvas, map, or browser references are exposed

Suggested commit:

`feat(atlas): add theme subprofiles`
