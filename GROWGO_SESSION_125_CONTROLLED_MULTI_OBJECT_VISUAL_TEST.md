# GROWGO SESSION 125 — CONTROLLED MULTI OBJECT VISUAL TEST

## Summary

Session 125 extends the synthetic visual proof from one object to a small controlled multi-object Atlas scene.

This remains a controlled synthetic test.

It uses explicit authorization, remains isolated, preserves Atlas authority, and stays reversible.

No production renderer was enabled.
No real map was connected.
No gameplay systems were modified.
No new assets were created.

## Target

Created:

`CONTROLLED_MULTI_OBJECT_VISUAL_TEST_SCENE_001`

Objects tested:

- one road object
- one building object
- one nature object

## Files Created

- `asset-factory/atlas-multi-object-visual-test.mjs`
- `tests/asset-factory-atlas-multi-object-visual-test.test.mjs`
- `GROWGO_SESSION_125_CONTROLLED_MULTI_OBJECT_VISUAL_TEST.md`

## Test Design

Created:

`asset-factory/atlas-multi-object-visual-test.mjs`

Purpose:

Verify multiple Atlas render commands can produce a coordinated visual test state while staying inside the controlled synthetic path.

The test consumes Atlas command flow through the passive connection layer and requires explicit renderer authorization before execution.

The scene remains:

- isolated
- reversible
- synthetic-only
- non-production

## Requirements Verified

The controlled multi-object proof verifies:

- multiple commands accepted
- layer ordering preserved
- transforms preserved
- asset references valid
- cleanup completed

The selected multi-object test state includes exactly three coordinated render commands:

- road layer command
- object layer command
- nature layer command

## Output

Created:

`CONTROLLED_MULTI_OBJECT_VISUAL_TEST_RESULT_001`

Includes:

- object count
- command count
- layer summary
- deterministic fingerprint
- cleanup status

Result content also records:

- tested object identities
- object types
- asset references
- render layers
- preserved layer ordering
- transform signatures

## Validation

Created:

`CONTROLLED_MULTI_OBJECT_VISUAL_TEST_VALIDATION_001`

Checks:

- no source mutation
- no automatic activation
- deterministic result
- command ordering valid

Validation also confirms:

- authorization passed
- multiple commands accepted
- layer ordering preserved
- transforms preserved
- asset references valid
- cleanup completed

## Supporting Update

The passive renderer connection test layer was updated to carry `layerOrdering` through command flow metadata.

This allows the multi-object proof to validate real Atlas layer ordering directly instead of inferring it indirectly.

## Test Results

Added tests for:

- multi-object command flow
- layer ordering
- cleanup
- deterministic result

Session 125 test result:

- `4/4` passing

Compatibility regression run:

- `tests/asset-factory-atlas-multi-object-visual-test.test.mjs`
- `tests/asset-factory-atlas-synthetic-visual-test.test.mjs`
- `tests/asset-factory-atlas-renderer-connection-test.test.mjs`

Regression result:

- `13/13` passing

## Validation Results

The multi-object proof confirms:

- three Atlas commands can be coordinated in one controlled synthetic visual state
- command ordering remains stable
- render layers remain distinct and traceable
- transforms remain preserved
- cleanup completes successfully
- no source state mutation occurs

## Readiness

The controlled renderer proof now supports a small coordinated scene instead of only a single object.

This is a solid next step toward future larger-scene synthetic validation while still staying far away from production renderer runtime behavior.
