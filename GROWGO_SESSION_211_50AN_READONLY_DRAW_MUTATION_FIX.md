# GrowGo Session 211.50an — Read-Only Draw Mutation Fix

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

Phase:
211.50an — Diagnose Read-Only Property Assignment During Draw

Classification:
`READONLY_DRAW_MUTATION_FIXED`

ELI5:
Safari got all the way to the first real draw, then the draw path handed a frozen snapshot point into Leaflet positioning code. Leaflet is allowed to mutate its working point object, so the safe fix was to keep the snapshot frozen and give Leaflet a separate mutable local copy just for canvas positioning.

Confirmed mutation boundary:

- Draw seam:
  - `drawCustom25DMapCanvasWithFrameSnapshot(...)`
- Immutable source:
  - `normalizedFrameViewportSnapshot.canvasLayerPosition`
- Mutation sink:
  - `L.DomUtil.setPosition(canvas, point)`
- Corrected handoff:
  - immutable snapshot point remains read-only
  - mutable local `{ x, y }` copy is passed to Leaflet

Correction rules preserved:

- lifecycle translation remains cycle-safe and frozen
- snapshot payload remains immutable
- no global freeze weakening
- no lifecycle ownership changes
- no cleanup ownership changes
- one-frame-only behavior preserved
- all four canonical safety flags remain false

Added diagnostics:

- adapter execution identity now records draw invocation entry/return
- draw boundary records the immutable source descriptor for the snapshot position
- draw boundary reports the fixed mutable copy handoff lane

Focused regression intent:

Before correction:
- frozen snapshot position could be handed to a draw-time positioning helper that mutates its point input
- Safari could fail with `ATTEMPTED_TO_ASSIGN_TO_READONLY_PROPERTY`

After correction:
- snapshot remains frozen
- mutable local point absorbs in-place positioning writes
- draw completes
- cleanup path remains unchanged
