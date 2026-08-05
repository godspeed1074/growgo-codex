# GrowGo Session 211.50af — Prepared Surface To Payload Trace

Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
Phase: `211.50af`
Classification: `PREPARED_SURFACE_CONTINUATION_IDENTIFIED`

## Goal

Trace only the direct continuation after:

`surfaceOperations.prepareOneFrameSurface({ map })`

returns successfully, without changing:

- bridge behavior
- map acquisition
- draw operation creation
- surface preparation implementation
- snapshot implementation
- draw implementation
- lifecycle policy
- authorization
- cleanup ownership

## Confirmed live starting point

Real Safari evidence already proved:

- post-draw-operation continuation is reached
- all currentRefs assignments complete
- `surfacePreparationInputReady` status write completes
- `prepareOneFrameSurface` enters and returns
- no post-draw failure function or exception is recorded
- payload assembly is still not reached

That narrowed the live boundary to:

`surface preparation returned`
→ `prepared surface result is consumed`
→ `payload assembly entry`

## Added prepared-surface continuation trace

The adapter now records:

- prepared surface local assignment attempted/completed
- prepared surface presence, type, and keys
- prepared surface status read attempted/completed/value
- prepared surface reason read attempted/completed/value
- prepared surface canvas read attempted/completed/present
- prepared surface lifecycle owner read attempted/completed/present
- prepared surface map read attempted/completed/present
- payload assembly entry attempted/completed
- prepared surface continuation last completed step
- prepared surface continuation next expected step
- prepared surface continuation failure function
- prepared surface continuation exception name/message/reasonCode
- whether prepared-surface reads triggered:
  - getter
  - Proxy trap
  - recursive callback
  - diagnostics lookup

## Direct continuation sequence now traced

1. prepared surface local assignment attempted
2. prepared surface local assignment completed
3. prepared surface status read attempted/completed
4. prepared surface reason read attempted/completed
5. prepared surface canvas read attempted/completed
6. prepared surface lifecycle owner read attempted/completed
7. prepared surface map read attempted/completed
8. payload assembly entry attempted
9. payload assembly entry completed
10. payload guard evaluation proceeds next

## Key implementation note

The returned prepared surface payload is now captured once and reused downstream. That keeps the direct continuation trace honest by avoiding extra untraced `preparedSurface.surface` reads later in the handoff path.

## Regression coverage

Focused tests now prove:

- `prepareOneFrameSurface` returns an object on the normal path
- prepared surface local assignment completes
- normal prepared-surface property reads complete
- valid prepared surface reaches payload assembly
- missing canvas is recorded explicitly and fails at the payload guard
- missing surface map is recorded explicitly
- a prepared-surface getter failure identifies the exact property read
- renderer visuals remain unchanged
- lifecycle policy remains unchanged
- all four canonical safety flags remain false

## Next use

This trace is ready for the next real Safari run to determine whether the live stop happens:

- while reading prepared-surface result properties
- while entering payload assembly
- or immediately before payload guard evaluation is recorded
