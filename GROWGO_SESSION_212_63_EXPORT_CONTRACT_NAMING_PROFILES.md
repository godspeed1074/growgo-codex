# GrowGo Atlas Phase 212.63 — Export Contract and Naming Profiles

Status: PASS

Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
Create a developer-only deterministic export contract seam between Atlas planning output and future Modular Bible / Asset Factory generation.

What this phase adds:

- `exportContractId`
- `assetNamingProfileId`
- `glbExportProfileId`
- `assetVersionPolicy`
- `exportContractReason`

Supported handoff:

1. Atlas recipe and style bridge
2. attachment metadata and GLB preparation
3. export contract
4. naming profile
5. future Asset Factory generation readiness

Behavior:

- deterministic export contract IDs
- deterministic naming profile selection for buildings, vegetation, streetscape, and compact variants
- deterministic GLB export profile IDs
- explicit version policy selection
- fail-closed rejection for incompatible attachment metadata, GLB preparation, Modular Bible family, or asset identity

Fail-closed reasons:

- `EXPORT_CONTRACT_ATTACHMENT_METADATA_NOT_FOUND`
- `EXPORT_CONTRACT_GLB_PREPARATION_INCOMPATIBLE`
- `EXPORT_CONTRACT_MODULAR_FAMILY_INCOMPATIBLE`
- `EXPORT_CONTRACT_ASSET_ID_INCOMPATIBLE`
- `EXPORT_CONTRACT_NAMING_PROFILE_UNAVAILABLE`

Planner integration:

- planner status exposes frozen serializable export contract fields
- resolved feature recipes carry export contract fields
- planner decisions include `exportContractDecisions`

Safety proof:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

This phase remains developer-only and planning-only. It prepares deterministic export contract and naming metadata for future Asset Factory work without enabling runtime generation, rendering, or export behavior.
