# GrowGo Session 212.3 — Atlas Population-to-Draw Integration

Status: PASS

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

## Goal

Connect the deterministic Phase 212.2 world-population plan to the existing developer-only persistent Atlas draw path.

This phase proves:

population plan
→ validated render-command batch
→ persistent snapshot wrapper
→ retained Canvas draw seam
→ draw-state release

without adding automatic spawning, startup activation, a second renderer, a second Canvas, Leaflet layers, or a renderer bypass.

## Files created

- `client/developer-only-atlas-population-draw-integration.mjs`
- `tests/client-developer-only-atlas-population-draw-integration.test.mjs`

## Integration contract

The integration seam accepts one frozen Phase 212.2 population plan and verifies:

- correct population-plan schema
- immutable/serializable plan
- region identity match
- package identity match
- recipe identity match
- selector-seed match
- approved asset-only command set
- deterministic ordering
- duplicate-instance rejection
- draw-command budget
- no geometry payload
- no texture payload
- no Blender payload
- no DOM/Leaflet/Canvas/browser references

## Batch conversion

The population plan is converted into one deterministic draw batch containing only:

- `batchId`
- `populationPlanId`
- approved `assetReferenceId`
- `instanceId`
- `position`
- `scale`
- `rotation`
- `lod`
- approved category/family metadata

No raw model data or browser-owned objects enter the batch.

## Persistent draw path

The batch is handed into the existing persistent draw pipeline only:

- persistent snapshot wrapper
- persistent frame draw provider
- retained Canvas reuse
- mutable draw-state creation/release

This phase does not create a second renderer and does not create a second Canvas.

## Proven behavior

- valid Phase 212.2 plans validate and submit successfully
- draw input preserves instance IDs
- draw input preserves position
- draw input preserves scale
- draw input preserves rotation
- draw input preserves LOD
- draw batch identity remains deterministic for the same plan
- the same retained Canvas can be reused across repeated submissions
- temporary population references release after both success and failure
- snapshot release remains owned by the snapshot wrapper
- retained Canvas/pane/lifecycle cleanup is not duplicated here

## Approved first test scene

The focused test scene includes approved assets only:

- `TREE_EUCALYPTUS_001`
- `TREE_BOTTLEBRUSH_001`
- `SHRUB_COASTAL_LOW_001`
- `BUILDING_CIVIC_SPORTS_PAVILION_001`

## Diagnostics

Frozen serializable status exposes:

- `integrationReady`
- `planValidated`
- `populationPlanId`
- `batchId`
- `inputCommandCount`
- `acceptedCommandCount`
- `rejectedCommandCount`
- `drawSubmitted`
- `drawCompleted`
- `drawFailureReason`
- `referencesReleased`
- `lastFailureReason`
- canonical safety flags

No raw Canvas, renderer, DOM, Leaflet, or snapshot internals are exposed.

## Safety

Canonical safety flags remain:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

This phase remains manual-only and disconnected from startup or live viewport population.

## Result

Phase 212.3 proves a deterministic Atlas world-population plan can safely reach the persistent developer-only draw seam as one lightweight validated batch, with preserved command identity and no new live spawning path.
