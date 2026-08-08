# GrowGo Atlas Session 212.57 — Atlas Modular Bible Variant Envelope and Structural Compatibility Profiles

Status: PASS

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
Add a developer-only compatibility layer that validates selected asset variants against structural and contextual constraints.

What this phase adds

- Deterministic variant envelope validation
- Deterministic structural compatibility checks
- Context-aware validation against:
  - lot type
  - district / parcel context
  - streetscape context
  - settlement identity
  - density tier

Diagnostics exposed

- `assetVariantEnvelopeId`
- `structuralCompatibilityStatus`
- `selectedVariantProfileId`
- `variantConstraintReason`
- `variantSelectionSeed`

Variant envelope coverage

- size
- complexity
- style
- environment
- density

Structural compatibility coverage

- lot type compatibility
- parcel context compatibility
- streetscape context compatibility
- settlement context compatibility

Fail-closed behavior

Invalid or incompatible variant contexts return deterministic blocked reasons such as:

- `VARIANT_STRUCTURAL_RULE_NOT_FOUND`
- `VARIANT_STRUCTURAL_LOT_INCOMPATIBLE`
- `VARIANT_STRUCTURAL_DISTRICT_INCOMPATIBLE`
- `VARIANT_STRUCTURAL_STREETSCAPE_INCOMPATIBLE`
- `VARIANT_STRUCTURAL_SETTLEMENT_INCOMPATIBLE`
- `VARIANT_STRUCTURAL_DENSITY_INCOMPATIBLE`

Planner integration proof

The world population planner now carries:

- `atlasVariantStructuralCompatibilityProfilesVersion`
- `registeredVariantCompatibilityRuleCount`
- `assetVariantEnvelopeId`
- `structuralCompatibilityStatus`
- `selectedVariantProfileId`
- `variantConstraintReason`
- `variantSelectionSeed`
- `variantStructuralCompatibilityDecisions`

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
