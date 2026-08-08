# GrowGo Atlas Phase 212.35 — Seasonal Story Drift, Event Hooks, and Return-Visit Memory

## Goal

Add a developer-only temporal memory layer so locations can carry deterministic seasonal meaning, event hooks, and future return-visit memory without changing live runtime behavior.

## Supported temporal memory cases

1. Seasonal story changes
   - season influence on place meaning
   - biome influence
   - landmark influence

2. Event hooks
   - festivals
   - seasonal activities
   - community events

3. Return visit memory
   - discovered
   - revisited
   - remembered locations

4. Story evolution
   - changing importance
   - recurring identity

## Diagnostics

The planner and seasonal-memory registry expose frozen, serializable scalar diagnostics only:

- `memoryStateId`
- `seasonalStoryProfileId`
- `eventHookProfileId`
- `returnVisitCategory`
- `storyEvolutionReason`

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

1. seasonal story stable
2. event hooks deterministic
3. return memory stable
4. same input same output
5. budgets preserved
6. automatic controller regression passes
