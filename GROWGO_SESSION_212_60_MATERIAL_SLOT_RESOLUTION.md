# GrowGo Atlas Session 212.60 — Atlas Modular Bible Material Slot Set Resolution

Status: PASS

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
Resolve deterministic exact material slot assignments inside validated asset variants.

What this phase adds

- `client/developer-only-atlas-material-slot-resolution.mjs`
- `tests/client-developer-only-atlas-material-slot-resolution.test.mjs`
- planner integration in `client/developer-only-atlas-world-population-planner.mjs`

Supported slot domains

- walls
- roofs
- trims
- windows
- doors
- fences
- vegetation

Slot behavior

1. Slot assignment resolves from:
   - asset variant
   - material theme bundle
   - finish profile

2. Slot validation:
   - prevents invalid slot/bundle combinations
   - preserves visual cohesion
   - remains deterministic and planning-only

Developer-only diagnostics

- `materialSlotSetId`
- `resolvedSlotCount`
- `assignedMaterialCount`
- `slotCompatibilityStatus`
- `slotResolutionReason`

Fail-closed behavior

Invalid or incompatible slot contexts return deterministic blocked reasons such as:

- `MATERIAL_SLOT_RULE_NOT_FOUND`
- `MATERIAL_SLOT_THEME_BUNDLE_INCOMPATIBLE`
- `MATERIAL_SLOT_FINISH_INCOMPATIBLE`
- `MATERIAL_SLOT_FINISH_SET_INCOMPATIBLE`

Planner integration

- The world population planner now resolves material slot sets after:
  - material theme bundles
- The planner now emits:
  - `materialSlotResolutionDecisions`
- Resolved feature recipe entries and accepted placements carry the same slot diagnostics.

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

- slot resolution is deterministic
- assigned material counts are deterministic
- incompatible slot inputs fail closed
- planner status exposes frozen serializable slot diagnostics
- no raw renderer, DOM, Canvas, map, or browser references are exposed
