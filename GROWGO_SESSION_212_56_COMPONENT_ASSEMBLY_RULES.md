# GrowGo Atlas Session 212.56 — Atlas Component Recipe Compatibility and Assembly Rule Profiles

Status: PASS

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
Add a developer-only compatibility layer that validates Modular Bible component combinations and assembly profiles before any future runtime use.

What this phase adds

- Deterministic component compatibility validation
- Deterministic assembly rule profiles
- Required / optional / forbidden component rules
- Planner carry-through of assembly validation diagnostics

Validated compatibility domains

- roof / wall compatibility
- window / façade compatibility
- door / building compatibility
- fence / property compatibility
- vegetation / biome compatibility

Assembly rules now define

- `requiredComponentCount`
- `validatedComponentCount`
- required component sets
- optional component sets
- forbidden combinations

Diagnostics exposed

- `componentCompatibilityStatus`
- `assemblyRuleProfileId`
- `requiredComponentCount`
- `validatedComponentCount`
- `assemblyReason`

Fail-closed behavior

Invalid combinations are rejected with deterministic blocked reasons such as:

- `COMPONENT_ASSEMBLY_RULE_NOT_FOUND`
- `COMPONENT_ASSEMBLY_FEATURE_CLASS_INCOMPATIBLE`
- `COMPONENT_ASSEMBLY_BIOME_INCOMPATIBLE`
- `COMPONENT_ASSEMBLY_FORBIDDEN_COMBINATION`

Planner integration proof

The world population planner now carries:

- `atlasComponentAssemblyRuleProfilesVersion`
- `registeredComponentAssemblyRuleCount`
- `componentCompatibilityStatus`
- `assemblyRuleProfileId`
- `requiredComponentCount`
- `validatedComponentCount`
- `assemblyReason`
- `componentAssemblyRuleDecisions`

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
