# GrowGo Atlas Phase 212.32 — View Corridor, Approach Sequence, and Destination Framing

## Goal

Add a developer-only destination framing layer so important locations receive deterministic approach planning, sight-line structure, and arrival framing without changing live renderer behavior.

## Supported destination framing cases

1. View corridors
   - landmark sight lines
   - scenic reveals
   - open visibility paths

2. Approach sequences
   - scenic destinations
   - civic landmarks
   - tourist locations

3. Destination framing
   - beaches
   - waterfalls
   - lookouts
   - monuments
   - achievement locations

4. Exploration hooks
   - discovery moments
   - photo areas
   - destination framing

## Diagnostics

The planner and destination-framing registry expose frozen, serializable scalar diagnostics only:

- `viewCorridorId`
- `approachSequenceId`
- `destinationFrameProfileId`
- `arrivalReason`
- `visibilityPriority`

No raw renderer, Canvas, DOM, Leaflet, browser callback, or mutable planning object is exposed.

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

1. view corridors stable
2. approaches deterministic
3. destinations frame correctly
4. visibility rules stable
5. budgets preserved
6. automatic controller regression passes
