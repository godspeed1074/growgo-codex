# GrowGo Session 211.50ap — Second Read-Only Draw Mutation

Branch:
`feature/atlas-phase-211-6-gated-map-attachment-controller`

Phase:
211.50ap — Trace Second Read-Only Mutation During Draw

Classification:
`SECOND_READONLY_DRAW_MUTATION_FIXED`

ELI5:
Safari was definitely loading the fixed mutable snapshot point, so the next read-only error had to be somewhere else in draw. The second mutation target is the canvas element write that happens inside Leaflet positioning — specifically the helper path that writes `_leaflet_pos` onto the canvas object itself.

Confirmed mutation boundary:

- Draw entry:
  - `drawCustom25DMapCanvasWithFrameSnapshot(...)`
- Already-fixed first boundary:
  - frozen `frameViewportSnapshot.canvasLayerPosition`
  - copied into mutable local `{ x, y }`
- Second boundary:
  - `L.DomUtil.setPosition(canvas, mutableCanvasLayerPosition)`
  - Leaflet attempts canvas-local position bookkeeping
  - read-only failure occurs on the canvas object write path
  - target label traced as:
    - `canvas._leaflet_pos`

Correction:

- kept the mutable local position copy intact
- wrapped Leaflet position application in a narrow fallback
- if Leaflet position bookkeeping throws a read-only assignment error:
  - do not mutate the frozen snapshot
  - do not mutate lifecycle state
  - instead write visual position through:
    - `canvas.style.transform = translate3d(...)`

Draw mutation tracing added:

- `getCustom25DDrawMutationTrace()`
- `resetCustom25DDrawMutationTrace(reasonCode)`

Trace fields include:

- draw mutation sequence start/completion
- mutation index
- function name
- target label
- target type
- property name
- value type
- frozen / sealed / extensible status
- property descriptor presence / writability / setter presence
- attempted / completed flags
- failure function
- exception name / message / reason code

Safety preserved:

- immutable snapshot remains frozen
- mutable runtime draw state remains separate
- lifecycle translation unchanged
- snapshot creation unchanged
- bridge / authorization unchanged
- cleanup ownership unchanged
- all four canonical safety flags remain false

Focused validation:

- mutable snapshot point handoff still preserved
- readonly canvas-position failure is isolated and recovered
- draw seam completes with the fallback path
- diagnostics namespace exposes the draw mutation trace
