# GrowGo Atlas Phase 212.34 — Place Memory, Narrative Arc, and Local Story Hooks

## Goal

Add a developer-only place-memory layer so important locations can carry deterministic local identity, discovery meaning, and narrative cohesion without changing live runtime behavior.

## Supported place-memory cases

1. Place memory
   - historic locations
   - natural landmarks
   - community locations
   - exploration points

2. Story categories
   - historic
   - natural wonder
   - community
   - cultural
   - exploration
   - hidden discovery

3. Discovery chains
   - connected locations
   - route relationships
   - achievement hooks

4. Local narrative cohesion
   - settlement identity
   - landmark context
   - route context

## Diagnostics

The planner and place-memory registry expose frozen, serializable scalar diagnostics only:

- `placeMemoryId`
- `storyCategory`
- `localNarrativeProfileId`
- `discoveryImportance`
- `storyReason`

No raw renderer, Canvas, DOM, Leaflet, callback, or mutable planning object is exposed.

## Determinism and safety

- deterministic output only
- command budgets preserved
- developer-only planning only
- renderer isolation preserved
- no startup activation
- no automatic runtime enablement

## Canonical safety flags

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Verification intent

1. place memory stable
2. story category deterministic
3. discovery chains valid
4. same input same output
5. budgets preserved
6. automatic controller regression passes
