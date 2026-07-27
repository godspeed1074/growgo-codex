# GROWGO SESSION 126 — CONTROLLED STREET SCENE VISUAL TEST

## Summary

Session 126 extends the controlled visual proof from a few objects into a small synthetic street scene using existing Atlas render commands.

This remains a controlled synthetic test.

It uses explicit authorization, remains isolated, preserves Atlas authority, and stays reversible.

No production renderer was activated.
No real map was connected.
No gameplay systems were modified.
No new assets were created.

## Target

Created:

`CONTROLLED_STREET_SCENE_VISUAL_TEST_001`

Scene contents:

- road
- sidewalk reference
- 3 residential buildings
- 1 commercial building
- trees/nature objects
- street detail objects

## Files Created

- `asset-factory/atlas-controlled-street-scene-test.mjs`
- `tests/asset-factory-atlas-controlled-street-scene-test.test.mjs`
- `GROWGO_SESSION_126_CONTROLLED_STREET_SCENE_VISUAL_TEST.md`

## Test Design

Created:

`asset-factory/atlas-controlled-street-scene-test.mjs`

Purpose:

Verify a larger coordinated Atlas scene can flow through render preparation safely while staying inside the synthetic controlled test path.

The street-scene proof consumes Atlas command flow through the passive renderer connection layer and validates a coordinated subset of street-scene objects.

The scene remains:

- isolated
- reversible
- synthetic-only
- non-production

## Requirements Verified

The controlled street-scene proof verifies:

- object grouping
- layer ordering
- asset references
- transforms
- scene relationships
- cleanup

The verified synthetic street scene includes:

- 2 road-layer objects
- 4 object-layer buildings
- 2 nature-layer objects
- 1 detail-layer object

## Output

Created:

`CONTROLLED_STREET_SCENE_VISUAL_TEST_RESULT_001`

Includes:

- object count
- layer summary
- asset summary
- deterministic fingerprint
- cleanup status

Result content also records:

- tested object identities
- object categories
- asset references
- render layers
- preserved layer ordering
- transform signatures
- source scene identity

## Validation

Created:

`CONTROLLED_STREET_SCENE_VISUAL_TEST_VALIDATION_001`

Checks:

- no source mutation
- no automatic activation
- deterministic result
- command ordering valid
- all objects accounted for

Validation also confirms:

- authorization passed
- object grouping valid
- layer ordering valid
- asset references valid
- transforms preserved
- scene relationships valid
- cleanup completed

## Test Results

Added tests for:

- street scene creation
- object count validation
- layer validation
- cleanup
- deterministic output

Session 126 test result:

- `5/5` passing

Compatibility regression run:

- `tests/asset-factory-atlas-controlled-street-scene-test.test.mjs`
- `tests/asset-factory-atlas-multi-object-visual-test.test.mjs`
- `tests/asset-factory-atlas-renderer-connection-test.test.mjs`

Regression result:

- `13/13` passing

## Validation Results

The controlled street-scene proof confirms:

- a larger synthetic Atlas street slice can be coordinated safely
- road, sidewalk, building, nature, and detail objects remain grouped correctly
- layer ordering remains stable
- transforms remain preserved
- asset references remain valid
- cleanup completes successfully
- source state remains unchanged

## Readiness

The controlled renderer proof now supports a small synthetic street scene rather than only isolated object clusters.

This is a strong next step toward future larger Atlas scene testing while still staying outside production renderer runtime and real map attachment.
