# GROWGO SESSION 187.7 — TREE_BOTTLEBRUSH_001_v002 Production Verification

## Goal

Verify the revised `TREE_BOTTLEBRUSH_001_v002` production package before any
replacement of the registered or visually approved `v001` state.

## Verification tooling created

- `asset-factory/tree-bottlebrush-v002-production-verify.mjs`
- `asset-factory/tree-bottlebrush-v002-post-run-verify.mjs`
- `tests/asset-factory-tree-bottlebrush-v002-production-verification.test.mjs`

The existing bottlebrush production verifier was made metadata-filename aware so
the `v001` lane continues to read its original records while the `v002` lane reads
only its versioned manifest, metadata, and validation records.

## Records created

- `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/tree-bottlebrush-v002-validation.json`
- `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/tree-bottlebrush-v002-verification.json`

## Source verification

`TREE_BOTTLEBRUSH_001_v002.blend` exists in the expected production export
directory.

- size: `1,813,944` bytes
- SHA-256: `770400937a59b7077fc4241f280dbbaf1b1d2076ab9cfdde1d7fa9a0b07da4bc`
- Blender header: valid
- embedded asset identity: verified
- embedded recipe identity: verified

## GLB verification

| LOD | Size | Meshes | Primitives | Triangles | Materials | SHA-256 |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| CLOSE | 169,872 | 16 | 16 | 1,089 | 6 | `1e9270a448c117599a28fdade30b6afb60950fe093d753c7451d17b0787ee25e` |
| GAMEPLAY | 106,168 | 10 | 10 | 657 | 6 | `95462bc8287c36982b7e4536f3a972a81fa666b0f63b30b8c3b90c0a0450ec67` |
| MAP | 60,704 | 6 | 6 | 265 | 4 | `cab0ad1196926b558994e1c6d097806caddd12cc36329eebe5fa6ffa4870deb1` |

All three GLBs passed:

- asset identity
- recipe identity
- dependency identity
- metadata identity
- per-LOD identity anchor
- no external dependencies

LOD complexity decreases correctly:

`CLOSE (1,089) > GAMEPLAY (657) > MAP (265)`

Mesh and primitive counts also decrease across the same sequence.

## v002 versus v001

The source blend hash and all three LOD GLB hashes differ between `v001` and
`v002`, confirming a geometry revision.

The following identity values remain unchanged:

- asset ID
- recipe ID
- dependency IDs
- category
- variant
- palette
- LOD profile
- source identity
- identity policy and anchor policy

The version transition is recorded correctly:

- previous registered version: `v001`
- target revision version: `v002`
- v002 identity contract version: `v002`

## Safety verification

Focused tests hash all protected v001 package and approval files immediately
before and after verification. The hashes remain identical.

- v001 source unchanged
- v001 GLBs unchanged
- v001 manifest, metadata, and validation unchanged
- v001 registration unchanged
- v001 visual approval unchanged
- no registration replacement performed
- no visual approval replacement performed
- no publishing performed
- no runtime activation performed
- eucalyptus and pavilion assets untouched

## Readiness

`TREE_BOTTLEBRUSH_001_v002` is technically ready to replace `v001`.

This is a verification result only. The registered `v001` state and existing
visual approval remain active until a separate, explicitly authorized
replacement phase.
