# GrowGo Session 188.3c - Existing Tree Exporter Migration Verification

Date: 2026-07-29
Branch: `feature/growgo-asset-factory-town-expansion`

## Goal

Verify that the hardened universal exporter remains compatible with existing approved tree assets without changing geometry, registrations, promotion state, visual approvals, or approved GLB binaries.

Assets in scope:

- `TREE_EUCALYPTUS_001`
- `TREE_BOTTLEBRUSH_001_v002`

## Verification intent

1. Confirm tree exporter scripts are wired into `asset_factory_exporter_v1.py`.
2. Confirm object normalization, exact LOD discovery, shared identity validation, metrics generation, and manifest generation are active in both tree exporters.
3. Run compatibility validation against the existing approved tree source `.blend` files and existing approved GLBs.
4. Allow manifest creation only if the exporters validate the already-approved GLBs and skip re-export.

## Safety expectations

- No tree geometry changes.
- No GLB binary overwrites.
- No registration or approval record changes.
- No runtime or publishing actions.
- `TREE_EUCALYPTUS_001` and `TREE_BOTTLEBRUSH_001_v002` remain validation-only in this phase.

## Planned evidence capture

- Pre/post SHA-256 hashes for approved tree GLBs.
- Blender exporter skip markers for existing final outputs.
- Universal export manifests produced from verified existing outputs.
- Focused regression coverage for manifest-only migration behavior.

## Results

Focused tests passed before live validation:

- `tests/asset-factory-universal-blender-exporter.test.mjs`
- `tests/asset-factory-tree-exporter-migration-verification.test.mjs`
- `tests/asset-factory-tree-eucalyptus-manual-resume.test.mjs`
- `tests/asset-factory-tree-bottlebrush-manual-authoring.test.mjs`

Result: 29 passed, 0 failed.

Live compatibility validation completed in Blender 4.2 background mode against:

- `TREE_EUCALYPTUS_001_v001.blend`
- `TREE_BOTTLEBRUSH_001_v002.blend`

Observed exporter markers:

- `S184_TREE_EUCALYPTUS_EXPORT_SKIP:LOD_CLOSE`
- `S184_TREE_EUCALYPTUS_EXPORT_SKIP:LOD_GAMEPLAY`
- `S184_TREE_EUCALYPTUS_EXPORT_SKIP:LOD_MAP`
- `S187_TREE_BOTTLEBRUSH_EXPORT_SKIP:LOD_CLOSE`
- `S187_TREE_BOTTLEBRUSH_EXPORT_SKIP:LOD_GAMEPLAY`
- `S187_TREE_BOTTLEBRUSH_EXPORT_SKIP:LOD_MAP`

This confirms the hardened exporters validated the approved outputs and skipped binary regeneration for every in-scope tree LOD.

Universal export manifests created:

- `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/tree-eucalyptus-export-manifest.json`
- `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/tree-bottlebrush-v002-export-manifest.json`

Manifest verification highlights:

- `TREE_EUCALYPTUS_001` manifest version: `v001`
- `TREE_BOTTLEBRUSH_001` manifest version: `v002`
- Both manifests declare `ASSET_FACTORY_UNIVERSAL_EXPORT_MANIFEST_001`
- Both manifests record `identityValidationRequired: true`
- Both manifests record `externalDependenciesAllowed: false`
- Both manifests preserve descending LOD complexity

Pre/post approved GLB hashes remained unchanged:

- `TREE_EUCALYPTUS_001_LOD_CLOSE.glb`: `862be6bc5e365dad75c55fbe0877ca3b246972a1bea123a1c75aea6b3a5b9725`
- `TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb`: `ac3487f5be6131e0eaec66f6e431a148efb9266348ac5aa339e3547b46868f49`
- `TREE_EUCALYPTUS_001_LOD_MAP.glb`: `94a90a141a6eae569e8ceaf65a12608121abe25d0d59236fb553c9a462097a55`
- `TREE_BOTTLEBRUSH_001_v002_LOD_CLOSE.glb`: `1e9270a448c117599a28fdade30b6afb60950fe093d753c7451d17b0787ee25e`
- `TREE_BOTTLEBRUSH_001_v002_LOD_GAMEPLAY.glb`: `95462bc8287c36982b7e4536f3a972a81fa666b0f63b30b8c3b90c0a0450ec67`
- `TREE_BOTTLEBRUSH_001_v002_LOD_MAP.glb`: `cab0ad1196926b558994e1c6d097806caddd12cc36329eebe5fa6ffa4870deb1`

Post-run focused validation also passed:

- `tests/asset-factory-tree-exporter-migration-verification.test.mjs`
- `tests/asset-factory-universal-blender-exporter.test.mjs`
- `tests/asset-factory-tree-eucalyptus-production-run.test.mjs`
- `tests/asset-factory-tree-bottlebrush-v002-production-verification.test.mjs`

Result: 27 passed, 0 failed.

## Conclusion

The hardened universal exporter is compatible with the existing approved tree assets and is ready for production use within the current Asset Factory scope.

No approved tree GLB binaries were overwritten in this phase.
No registration, promotion, or visual approval records were changed in this phase.
