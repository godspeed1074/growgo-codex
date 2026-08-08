# GrowGo Atlas Phase 212.64 — Asset Factory Package Manifests

Status: PASS

Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
Create a developer-only deterministic Asset Factory package manifest seam that validates complete export readiness from Atlas planning output.

What this phase adds:

- `assetPackageManifestId`
- `exportValidationProfileId`
- `manifestComponentCount`
- `manifestValidationStatus`
- `manifestReason`

Supported handoff:

1. Atlas recipe and style bridge
2. material slots and attachment metadata
3. export contract and naming profile
4. Asset Factory package manifest
5. export readiness validation

Behavior:

- deterministic package manifest IDs
- deterministic export validation profile IDs
- explicit completeness checks for asset identity, components, materials, attachment metadata, and export contract
- fail-closed rejection for missing or incompatible package requirements

Fail-closed reasons:

- `ASSET_FACTORY_MANIFEST_EXPORT_CONTRACT_NOT_FOUND`
- `ASSET_FACTORY_MANIFEST_ASSET_ID_INCOMPATIBLE`
- `ASSET_FACTORY_MANIFEST_COMPONENT_RECIPE_INCOMPATIBLE`
- `ASSET_FACTORY_MANIFEST_MATERIAL_SLOT_INCOMPATIBLE`
- `ASSET_FACTORY_MANIFEST_ATTACHMENT_METADATA_INCOMPATIBLE`
- `ASSET_FACTORY_PACKAGE_MANIFEST_UNAVAILABLE`

Planner integration:

- planner status exposes frozen serializable manifest fields
- resolved feature recipes carry manifest fields
- planner decisions include `assetFactoryManifestDecisions`

Safety proof:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

This phase remains developer-only and planning-only. It validates complete asset package readiness without enabling runtime generation, export, rendering, or Asset Factory execution.
