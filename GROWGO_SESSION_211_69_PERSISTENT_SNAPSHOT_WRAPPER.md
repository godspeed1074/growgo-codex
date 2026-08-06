# GROWGO SESSION 211.69 — PERSISTENT SNAPSHOT WRAPPER

## Goal

Implement the disconnected developer-only frame-snapshot provider that can:

- create one fresh immutable snapshot for each redraw-shaped request
- normalize browser-shaped map values into scalar plain data
- validate identity and readiness before draw
- reject stale or reused snapshots
- release snapshot ownership safely without touching other persistent seams

This phase does not connect the provider to the controller, retained surface wrapper, lifecycle owner wrapper, draw path, scheduler, renderer, browser startup, or live attachment.

## Module created

- `client/developer-only-persistent-atlas-frame-snapshot-provider.mjs`

## Exposed API

- `createPersistentAtlasFrameSnapshotProvider(...)`
- `createPersistentAtlasFrameSnapshot(...)`
- `validatePersistentAtlasFrameSnapshot(...)`
- `releasePersistentAtlasFrameSnapshot(...)`
- `getPersistentAtlasFrameSnapshotStatus()`

## Proven behavior

### Snapshot creation

- all dependencies default unavailable and fail closed
- redraw reason must be one of the approved persistent reasons
- each snapshot receives a fresh snapshot ID and generation ID
- no prior snapshot is reused for a new redraw request
- identity, lifecycle, readiness, and redraw metadata are bound into the snapshot

### Scalar normalization

- Leaflet-shaped point and bounds values are converted into plain scalar copies
- viewport width and height are preserved
- pixel ratio, zoom, center, pixel origin, and viewport bounds remain serializable
- raw browser objects are rejected

### Validation

- snapshot schema, immutability, and serializability are enforced
- current map/session/lifecycle/surface/package/recipe/selector identity must match
- readiness must still be approved and unchanged
- stale generation and prior-snapshot reuse are rejected

### Release

- snapshot release runs only through the injected snapshot release seam
- repeated release is harmless
- released snapshots cannot be validated again
- this phase does not perform map, surface, lifecycle, draw, scheduler, or listener cleanup

## Diagnostics

Status is frozen and serializable and exposes no raw:

- snapshot internals
- map
- canvas
- pane
- DOM node
- listener
- callback
- scheduler handle
- renderer state

## Safety

Canonical safety flags remain false:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Result

Persistent Atlas now has a disconnected snapshot provider that proves fresh immutable snapshot creation, scalar-only normalization, redraw-time validation, stale/reuse rejection, and snapshot-only release without activating any live rendering behavior.
