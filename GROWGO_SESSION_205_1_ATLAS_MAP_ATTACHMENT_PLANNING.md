# GROWGO SESSION 205.1 — ATLAS MAP ATTACHMENT PLANNING

## Goal

Define the safe planning contract between the GrowGo map layer and Atlas systems before any runtime attachment.

## Result

Completed `ATLAS_MAP_ATTACHMENT_001` as the map-facing planning contract for Atlas lookup and package handoff.

Used:

- `ATLAS_ENGINE_RECIPE_INTEGRATION_001`
- `ATLAS_REGIONAL_PACKAGE_PLANNING_001`
- `LOCATION_RECIPE_SELECTOR_001`
- `LOCATION_RECIPE_FACTORY_001`

This layer defines how map coordinates can safely resolve into Atlas region and package metadata, generate deterministic selector seeds, and stop cleanly before any renderer or runtime attachment.

## Files Created

### Code

- `asset-factory/atlas-map-attachment-planning.mjs`

### Tests

- `tests/asset-factory-atlas-map-attachment-planning.test.mjs`

### Generated Records

- `asset-factory-workspace/atlas-map-attachment/ATLAS_MAP_ATTACHMENT_001/specification/atlas-map-attachment-specification.json`
- `asset-factory-workspace/atlas-map-attachment/ATLAS_MAP_ATTACHMENT_001/metadata/atlas-map-attachment-metadata-contracts.json`
- `asset-factory-workspace/atlas-map-attachment/ATLAS_MAP_ATTACHMENT_001/validation/atlas-map-attachment-validation.json`
- `asset-factory-workspace/atlas-map-attachment/ATLAS_MAP_ATTACHMENT_001/lifecycle/atlas-map-attachment-lifecycle-rules.json`
- `asset-factory-workspace/atlas-map-attachment/ATLAS_MAP_ATTACHMENT_001/reports/atlas-map-attachment-architecture-report.md`

## Defined Areas

The map attachment specification now defines:

- coordinate input contract
- map-to-region lookup rules
- region boundary rules
- package loading rules
- deterministic seed generation from coordinates
- map attachment permissions
- renderer boundary rules
- failure handling

## Map Attachment Model

The planning model now supports:

- coordinate normalization into deterministic region buckets
- metadata-only region and package lookup
- deterministic selector seed generation
- failure-safe blocked states

It does not download maps, attach a renderer, or activate runtime.

## Permissions and Renderer Boundary

The map attachment permissions now explicitly block:

- runtime activation
- map downloads
- renderer attachment
- Blender
- GLB workflows
- asset modification

Renderer boundary rules make the stop point explicit before any runtime scene, canvas, WebGL, or map-layer attachment could begin.

## Validation

Validation status: `pass`

Checks passed:

- coordinate input contract defined
- map-to-region lookup rules defined
- region boundary rules defined
- package loading rules defined
- deterministic seed generation defined
- map attachment permissions defined
- renderer boundary rules defined
- failure handling defined
- representative lookup contracts valid
- runtime / map downloads / renderer / Blender / GLBs / asset mutation blocked

## Lifecycle Rules

Lifecycle status:

- `PLANNING_READY`

Allowed states:

- `PLANNING_ONLY`
- `LOOKUP_READY`
- `PACKAGE_METADATA_READY`
- `SELECTOR_HANDOFF_READY`

Blocked states:

- `MAP_DOWNLOADED`
- `RENDERER_ATTACHED`
- `RUNTIME_ACTIVATED`
- `PLAYER_VISIBLE`

## Safety

Safety state:

- runtime activation authorized: `false`
- map downloads authorized: `false`
- renderer attachment authorized: `false`
- Blender authorized: `false`
- GLB authorized: `false`
- asset modification authorized: `false`

## Testing

Focused tests cover:

- deterministic output
- map attachment contract coverage
- metadata-only lookup contexts
- failure contract coverage
- written record generation
- preserved safety state

## Readiness

`ATLAS_MAP_ATTACHMENT_001` is ready for future map attachment planning.

What is now ready:

- deterministic coordinate-to-region planning contract
- metadata-only package lookup planning
- safe selector seed generation from map coordinates
- hard renderer and runtime boundary before any attachment work

What remains intentionally blocked:

- runtime activation
- map downloads
- renderer attachment
- Blender
- GLB workflows
- asset modification
