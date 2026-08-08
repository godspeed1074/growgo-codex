# GrowGo Atlas Session 212.61 — Atlas Modular Bible Component Surface Mapping

Status: PASS

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
Add deterministic mapping between Modular Bible components and asset surface attachment points.

What this phase adds

- `client/developer-only-atlas-component-surface-mapping.mjs`
- `tests/client-developer-only-atlas-component-surface-mapping.test.mjs`
- planner integration in `client/developer-only-atlas-world-population-planner.mjs`

Supported surface domains

- walls
- roofs
- windows
- doors
- fences
- vegetation anchors

Surface mapping behavior

1. Surface mapping resolves from:
   - component recipe
   - asset assembly profile
   - material slot set
   - slot compatibility status

2. Structural validation preserves:
   - component fit
   - anchor existence
   - placement compatibility

3. Blender / GLB preparation stays planning-only through:
   - reusable socket IDs
   - reusable attachment metadata
   - deterministic anchor profile identities

Developer-only diagnostics

- `surfaceMappingProfileId`
- `componentAnchorSetId`
- `resolvedAnchorCount`
- `mappedComponentCount`
- `surfaceMappingReason`

Fail-closed behavior

Invalid or incompatible mapping contexts return deterministic blocked reasons such as:

- `COMPONENT_SURFACE_MAPPING_RULE_NOT_FOUND`
- `COMPONENT_SURFACE_MAPPING_ASSEMBLY_PROFILE_INCOMPATIBLE`
- `COMPONENT_SURFACE_MAPPING_MATERIAL_SLOT_INCOMPATIBLE`
- `COMPONENT_SURFACE_MAPPING_SLOT_STATUS_INCOMPATIBLE`

Planner integration

- The world population planner now resolves component surface mappings after:
  - material slot resolution
  - component assembly validation
- The planner now emits:
  - `componentSurfaceMappingDecisions`
- Resolved feature recipe entries and accepted placements carry the same surface mapping diagnostics.

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

- anchor mapping is deterministic
- incompatible anchor inputs fail closed
- planner status exposes frozen serializable surface mapping diagnostics
- no raw renderer, DOM, Canvas, map, or browser references are exposed
