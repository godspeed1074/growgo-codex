# GrowGo Atlas Phase 212.33 — Route Memory, Wayfinding, and Exploration Guidance Hooks

## Goal

Add a developer-only exploration route layer so Atlas can describe deterministic journeys between destinations without changing live runtime behavior.

## Supported route guidance cases

1. Route memory
   - scenic routes
   - heritage routes
   - coastal routes
   - park trails

2. Wayfinding
   - signs
   - markers
   - direction guidance hooks

3. Exploration guidance
   - achievement routes
   - discovery chains
   - themed journeys

4. Route personality
   - connect biome
   - settlement identity
   - destination type

## Diagnostics

The planner and route-guidance registry expose frozen, serializable scalar diagnostics only:

- `routeMemoryId`
- `wayfindingProfileId`
- `explorationRouteType`
- `guidanceReason`
- `routePriority`

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

1. route selection stable
2. guidance deterministic
3. scenic routes stable
4. destination chains valid
5. budgets preserved
6. automatic controller regression passes
