# GROWGO SESSION 187.1 — BOTTLEBRUSH VERIFICATION

## Goal

Create the post-run verification layer for `TREE_BOTTLEBRUSH_001` using the completed eucalyptus verifier pattern, without launching Blender or modifying asset binaries.

## Files Created

- `asset-factory/tree-bottlebrush-production-run.mjs`
- `asset-factory/tree-bottlebrush-post-run-verify.mjs`
- `tests/asset-factory-tree-bottlebrush-post-run-verify.test.mjs`

## Verification Scope

The verifier checks:

- source `.blend` existence and embedded source identity
- all three LOD GLBs
- SHA-256 hashes
- mesh counts
- material counts
- triangle counts
- primitive counts
- asset identity preservation
- recipe identity preservation
- identity anchor preservation
- metadata preservation
- dependency identity preservation
- external dependency absence
- decreasing LOD complexity
- manifest consistency
- metadata consistency
- validation consistency

## Validation Logic

The new bottlebrush production-run verifier follows the eucalyptus pattern:

1. Inspect source `.blend`
2. Parse each exported `.glb`
3. Evaluate identity contract evidence
4. Check metadata and manifest alignment
5. Confirm LOD complexity decreases from `LOD_CLOSE` to `LOD_GAMEPLAY` to `LOD_MAP`
6. Produce a deterministic registration gate result

## Test Coverage

Focused tests cover:

- valid verified asset package
- missing output failure
- identity failure
- LOD ordering failure

## Execution Result

The verifier was run against the current local `TREE_BOTTLEBRUSH_001` outputs.

Result:

- source `.blend`: verified complete
- manifest: verified complete
- metadata: verified complete
- validation record: verified complete
- `LOD_CLOSE.glb`: parsed, but not registration-ready
- `LOD_GAMEPLAY.glb`: parsed, but not registration-ready
- `LOD_MAP.glb`: parsed, but not registration-ready

Current registration blockers:

- `TREE_BOTTLEBRUSH_001_LOD_CLOSE.glb:CORRUPT`
- `TREE_BOTTLEBRUSH_001_LOD_GAMEPLAY.glb:CORRUPT`
- `TREE_BOTTLEBRUSH_001_LOD_MAP.glb:CORRUPT`

Why they are blocked:

- asset identity is preserved
- identity anchors are preserved
- no external dependencies were detected
- LOD complexity decreases correctly
- recipe identity and dependency identity are not yet preserved strongly enough in the exported GLBs for the strict registration gate

## Readiness

This session adds and runs the verification tooling. `TREE_BOTTLEBRUSH_001` is **not yet ready for registration verification** because the current exported GLBs fail the strict recipe/dependency metadata checks.

## Safety

- No Blender launch
- No binary modification
- No registration
- No publishing
- Eucalyptus records untouched
- Pavilion records untouched
