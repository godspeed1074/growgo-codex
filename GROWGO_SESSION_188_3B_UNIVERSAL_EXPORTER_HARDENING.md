# GROWGO SESSION 188.3b — Universal Exporter Hardening

## Goal

Extract the repeated Blender-side exporter behavior into a reusable Asset
Factory pipeline supporting:

- `TREE_EUCALYPTUS_001`
- `TREE_BOTTLEBRUSH_001`
- `SHRUB_COASTAL_LOW_001`

No geometry generators or identity contracts were changed.

## Universal helper

Created:

- `asset-factory/local-blender-scripts/asset_factory_exporter_v1.py`

The helper provides:

### Export object normalization

Supported inputs:

- individual Blender objects
- lists
- tuples, including `(export_objects, anchor_object)`
- sets and frozen sets
- Blender collections through `all_objects` or `objects`
- Blender object containers

Inputs are recursively flattened and de-duplicated by object name.

### Automatic LOD discovery

Exact roots are discovered for:

- `LOD_CLOSE`
- `LOD_GAMEPLAY`
- `LOD_MAP`

Missing roots block export with an explicit error.

### Shared identity validation

The shared validator confirms:

- asset identity
- recipe identity
- every declared dependency identity
- required per-LOD identity anchor
- anchor inclusion in the normalized export set

The existing asset-specific validators remain in place as additional checks.

### Shared metrics

The helper records:

- mesh count
- triangulated polygon count
- unique material count
- material names

### Export manifests

Successful exporters now write deterministic manifests using:

- `ASSET_FACTORY_UNIVERSAL_EXPORT_MANIFEST_001`

Each manifest records asset, recipe, version, dependencies, LOD order, output
filenames, metrics, dependency policy, and a deterministic fingerprint.

## Exporters updated

- `resume_tree_eucalyptus_001_exports.py`
- `resume_tree_bottlebrush_001_exports.py`
- `resume_shrub_coastal_low_001_exports.py`

Their existing GLB names, temporary-file behavior, Blender export settings,
selection helper, and validation layers remain intact.

## Shrub end-to-end validation

Blender 4.2 LTS completed the hardened shrub export successfully.

| LOD | Meshes | Triangles | Materials |
| --- | ---: | ---: | ---: |
| CLOSE | 16 | 301 | 4 |
| GAMEPLAY | 10 | 181 | 4 |
| MAP | 4 | 61 | 3 |

The shrub GLB hashes were identical before and after the hardened export:

- CLOSE: `def3627ff0c2f76ee471307184136b103ff9b4d72550c25a1521dbf111b582ef`
- GAMEPLAY: `ce5bb360f52361c5aa82dd335c50e266b3c23e07113a9eb009d7cc229c8c229f`
- MAP: `a5def1a7df8622b90548947341ed6d138d81e4f30ab74adec8c52e59a83b5e27`

Created:

- `asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/export/shrub-coastal-low-export-manifest.json`

## Tree output preservation

Tree GLBs were not regenerated. Their existing hashes remain unchanged:

- eucalyptus CLOSE:
  `862be6bc5e365dad75c55fbe0877ca3b246972a1bea123a1c75aea6b3a5b9725`
- bottlebrush v002 CLOSE:
  `1e9270a448c117599a28fdade30b6afb60950fe093d753c7451d17b0787ee25e`

The relevant tree syntax, authoring, resume, production verification, and
identity-contract tests pass.

## Tests

Added:

- `tests/asset-factory-universal-blender-exporter.test.mjs`

Coverage includes normalization variants, automatic LOD discovery, shared
metrics, deterministic manifest generation, and consumption by all three
exporters.

## Remaining risk

The tree exporters were deliberately not rerun in Blender because their
approved binary outputs must not be replaced during this refactor. Their code
paths and existing outputs are covered by tests and hash preservation, but
their new manifests will first be written on a future explicitly authorized
tree export run.
