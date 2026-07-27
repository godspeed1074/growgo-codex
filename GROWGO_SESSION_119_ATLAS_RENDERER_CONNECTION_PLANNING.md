# GROWGO SESSION 119 — ATLAS RENDERER CONNECTION PLANNING

## Summary

Session 119 defines `ATLAS_RENDERER_CONNECTION_LAYER_001`, the controlled architecture that will connect validated Atlas render instructions to the future GrowGo Custom 2.5D renderer.

This is a planning-only session.

No renderer was activated.
No Canvas or WebGL output was created.
No production renderer code was modified.

## Planning Scope

The renderer must consume Atlas instructions.

The renderer must not:

- modify source geometry
- create world objects
- change classifications
- bypass Atlas validation

## Target System

Create:

`ATLAS_RENDERER_CONNECTION_LAYER_001`

Purpose:

Provide the controlled adapter boundary between validated Atlas renderer instructions and the future passive 2.5D renderer lifecycle.

## Renderer Input Contract

The renderer connection layer will consume:

`ATLAS_RENDER_INSTRUCTIONS_001`

Required instruction content:

- object transforms
- asset references
- render layers
- LOD selection
- material references
- layer ordering
- geometry references

The renderer connection layer must treat these instructions as authoritative render input.

It must not reinterpret them into new world meaning.

## Connection Flow

Defined connection path:

Atlas Scene

↓

Runtime Validation

↓

Renderer Adapter

↓

2.5D Renderer

## Connection Architecture

### 1. Atlas Scene Source

Source:

- `ATLAS_STREET_SCENE_PREVIEW_001`
- `ATLAS_RENDER_INSTRUCTIONS_001`

Responsibility:

- provide deterministic scene structure
- preserve geometry references
- preserve object identity

### 2. Runtime Validation Gate

Source:

- `ATLAS_RUNTIME_SCENE_VALIDATION_LAYER_001`

Responsibility:

- confirm object completeness
- confirm layer validity
- confirm spatial validity
- confirm performance validity

Renderer connection rule:

Only `PASS` scene sets are eligible for automatic renderer adapter preparation.

`WARN` scene sets may be inspected, logged, or rejected by policy, but must not bypass validation.

### 3. Renderer Adapter Boundary

Defined component:

`ATLAS_RENDERER_CONNECTION_LAYER_001`

Responsibility:

- accept already validated Atlas render instructions
- translate instruction payloads into passive renderer-compatible scene batches
- preserve geometry, object IDs, and layer ordering
- reject invalid or incomplete input

The adapter is not allowed to:

- move objects
- synthesize geometry
- create replacement objects
- change classifications

### 4. 2.5D Renderer Consumer

Future renderer responsibility:

- load assets
- bind material profiles
- batch layer draws
- apply transforms exactly as provided
- respect validated LOD selection

The renderer is a consumer only, not a corrective system.

## Interface Definition

### Renderer Adapter Input

Consumes:

- validated `ATLAS_RENDER_INSTRUCTIONS_001`
- runtime validation result references
- approved passive renderer profile metadata

### Renderer Adapter Output

Planned output shape:

`ATLAS_RENDERER_CONNECTION_PAYLOAD_001`

Proposed contents:

- renderer profile ID
- scene ID
- render batch list
- asset load queue
- layer submission order
- LOD selection table
- cleanup plan
- deterministic scene hash

### Required Pass-Through Fields

For each renderable instruction:

- `objectId`
- `objectType`
- `assetReference`
- `transformReference`
- `geometryReference`
- `lodLevel`
- `materialReference`
- `renderLayer`
- `layerOrdering`

## Lifecycle Rules

### Initialization

The renderer connection layer must:

- verify renderer profile compatibility
- verify validated Atlas instruction package presence
- build a deterministic scene connection payload
- prepare asset load groups without mutating world state

Initialization must fail closed if validation is missing or incompatible.

### Loading

The renderer connection layer must:

- request assets by validated asset reference only
- load by scene/layer batch grouping
- preserve instruction ordering
- stage geometry and transforms without modification

Loading must be passive and replayable from the same deterministic instruction package.

### Unloading

The renderer connection layer must:

- release scene-local renderer handles
- release asset references not retained by reuse policy
- clear batch state
- leave Atlas source data untouched

### Cleanup

Cleanup must support:

- renderer adapter state disposal
- scene batch disposal
- asset reference release
- deterministic re-entry on the same scene payload

### Failure Handling

Failure states must include:

- missing validated instruction package
- asset reference missing
- incompatible renderer profile
- unsupported LOD
- invalid layer ordering
- cleanup failure

Failure handling rule:

The renderer connection layer must stop before renderer execution and return a structured failure result.

It must not auto-correct source geometry or scene meaning.

## Performance Rules

### Batching

The adapter should batch by:

- render layer
- asset reference
- material reference
- compatible LOD group

### Instancing

The adapter should reuse repeated asset references through instancing-compatible submission groups where the passive renderer profile supports it.

### LOD Switching

LOD switching authority must remain with validated Atlas instruction output.

The renderer may consume approved LOD tiers, but must not invent new scene-level LOD meaning.

### Asset Reuse

Asset reuse must be driven by:

- repeated asset IDs
- repeated material profiles
- repeated layer-compatible draw groups

### Memory Limits

The connection layer should enforce future memory planning around:

- maximum live scene batches
- maximum active asset set
- maximum retained off-screen batch count
- cleanup thresholds on unload

This aligns with existing passive Custom 2.5D compatibility expectations around low-overhead, mobile-conscious consumption.

## Validation Plan

Define:

`ATLAS_RENDERER_CONNECTION_VALIDATION_001`

Planned checks:

- renderer receives valid instructions
- no geometry mutation occurs
- asset references remain valid
- cleanup is supported
- deterministic behaviour is preserved

### Validation Categories

#### Instruction Validity

Check:

- every submitted renderer entry maps to a validated Atlas instruction
- no renderer-only objects are added

#### Geometry Integrity

Check:

- geometry references passed to renderer match Atlas handoff references
- transform references remain unchanged

#### Asset Integrity

Check:

- asset references exist
- material references are compatible with renderer profile
- LOD references are supported

#### Lifecycle Integrity

Check:

- initialization supports failure exit
- unload supports full cleanup
- scene re-entry is deterministic

#### Deterministic Integrity

Check:

- same validated scene produces same renderer connection payload
- same asset grouping produces same batch ordering

## Lifecycle Boundary Rules

Atlas owns:

- geometry truth
- object identity
- classification meaning
- asset selection
- validation status

Renderer connection owns:

- passive batching
- passive load preparation
- passive scene payload construction
- cleanup orchestration

Renderer owns:

- final draw consumption only

## Existing Renderer Alignment

This planning pass should align with the project’s existing passive Custom 2.5D renderer rules:

- passive profile only
- explicit compatibility validation
- manual or controlled activation pathways only
- no hidden automatic world mutation

The future Atlas renderer adapter should reuse those safety ideas rather than creating a separate activation doctrine.

## Recommended Future Implementation Order

1. Create `atlas-renderer-connection.mjs`
2. Define `ATLAS_RENDERER_CONNECTION_PAYLOAD_001`
3. Implement passive payload batching from `ATLAS_RENDER_INSTRUCTIONS_001`
4. Add `ATLAS_RENDERER_CONNECTION_VALIDATION_001`
5. Add cleanup and lifecycle test coverage
6. Only after validation maturity, connect to controlled Custom 2.5D passive renderer entry points

## Readiness for Future Renderer Hookup

Session 119 is ready as a renderer connection planning foundation.

The project now has a defined future path:

- Atlas scene composition
- Atlas renderer handoff
- Atlas runtime scene validation
- planned Atlas renderer connection adapter
- future passive 2.5D renderer consumption

This keeps renderer hookup controlled, validation-gated, and geometry-safe.
