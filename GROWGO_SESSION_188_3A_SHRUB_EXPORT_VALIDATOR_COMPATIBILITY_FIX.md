# GROWGO SESSION 188.3a — SHRUB_COASTAL_LOW_001 Export Validator Compatibility Fix

## Problem

The shrub export-resume workflow failed while counting LOD metrics:

`AttributeError: 'list' object has no attribute 'type'`

## Cause

`build_export_object_set` returns a two-item tuple:

1. the list of export objects
2. the identity-anchor object

The shrub `count_scene_metrics` caller assigned the complete tuple to
`objects`. Iteration therefore encountered the export-object list itself before
individual Blender objects and attempted to read `.type` from that list.

## Fix

The caller now unpacks the helper result:

`objects, _anchor_object = build_export_object_set(...)`

Metric filtering then iterates the actual Blender object list, matching the
eucalyptus and bottlebrush reference workflows.

## Scope

Changed:

- `asset-factory/local-blender-scripts/resume_shrub_coastal_low_001_exports.py`
- `tests/asset-factory-shrub-coastal-low-manual-authoring.test.mjs`

Created:

- `GROWGO_SESSION_188_3A_SHRUB_EXPORT_VALIDATOR_COMPATIBILITY_FIX.md`

No geometry-generation code, identity contract, approved asset, eucalyptus
workflow, or bottlebrush workflow was changed.

## Resume status

The compatibility blocker is removed. LOD metric counting now receives Blender
objects and identity validation remains in the same shared-helper path.

An end-to-end Blender 4.2 LTS background run completed successfully:

- CLOSE exported and validated
- GAMEPLAY exported and validated
- MAP exported and validated
- identity anchors preserved
- asset, recipe, and dependency identity preserved
- GLB generation reached the export completion marker
