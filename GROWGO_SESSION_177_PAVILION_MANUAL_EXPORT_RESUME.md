# GROWGO SESSION 177 — PAVILION MANUAL EXPORT RESUME

## Summary

This session prepares a safe manual-completion path for
`BUILDING_CIVIC_SPORTS_PAVILION_001` without launching Blender from Codex.

This repair pass fixes the temporary GLB export-path bug discovered during the
manual Blender run.

Codex work completed:

- created a Blender-internal resume script for manual execution
- upgraded the Node-side pavilion verifier to inspect final GLBs deeply
- added a post-run verification helper command
- added focused tests for the resume contract and final GLB verification rules
- repaired the temporary GLB naming so Blender exports to `.tmp.glb` instead of
  `.glb.tmp`

This session does **not** complete the pavilion.

Completion still requires:

1. the user to open Blender 4.2 LTS manually
2. the user to run the resume script inside Blender
3. Codex to verify all three final GLBs

## Current Verified State

Existing:

- `BUILDING_CIVIC_SPORTS_PAVILION_001_v001.blend`

Temporary valid export:

- `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb.tmp.glb`

Missing final outputs:

- `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb`
- `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb`
- `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_MAP.glb`

## Files Created

- [resume_building_civic_sports_pavilion_exports.py](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/local-blender-scripts/resume_building_civic_sports_pavilion_exports.py)
- [building-civic-sports-pavilion-post-run-verify.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/building-civic-sports-pavilion-post-run-verify.mjs)
- [GROWGO_SESSION_177_PAVILION_MANUAL_EXPORT_RESUME.md](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_177_PAVILION_MANUAL_EXPORT_RESUME.md)

## Files Updated

- [resume_building_civic_sports_pavilion_exports.py](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/local-blender-scripts/resume_building_civic_sports_pavilion_exports.py)
- [building-civic-sports-pavilion-production-run.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/building-civic-sports-pavilion-production-run.mjs)
- [asset-factory-building-civic-sports-pavilion-production-run.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-building-civic-sports-pavilion-production-run.test.mjs)
- [asset-factory-building-civic-sports-pavilion-manual-resume.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-building-civic-sports-pavilion-manual-resume.test.mjs)

## Exact Bug

The earlier resume script built a temporary path like:

- `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb.tmp`

When Blender exported GLB, it appended `.glb`, which produced:

- `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb.tmp.glb`

The script then tried to validate the wrong path and failed with
`FileNotFoundError`.

The repaired script now builds temporary export paths in this form:

- `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.tmp.glb`
- `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.tmp.glb`
- `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_MAP.tmp.glb`

After validation, each temp file is atomically renamed to its final `.glb`
filename.

## Resume Script Behaviour

The manual Blender resume script:

- confirms Blender 4.2.x compatibility
- confirms the open blend filename matches the pavilion asset
- confirms the open blend contains the expected asset identity
- confirms the recipe identity can still be found in the blend data
- does not regenerate pavilion geometry
- does not save over the existing `.blend`
- exports one LOD at a time in this order:
  1. `LOD_CLOSE`
  2. `LOD_GAMEPLAY`
  3. `LOD_MAP`
- uses a fresh `.tmp.glb` path for each export
- validates each GLB before final rename
- stops at the first failure
- preserves already-valid final outputs
- leaves the earlier `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb.tmp.glb`
  untouched

## Exact Manual Blender Steps

1. Open Blender 4.2 LTS manually.
2. Open this exact file:
   `/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/BUILDING_CIVIC_SPORTS_PAVILION_001_v001.blend`
3. Confirm Blender’s title bar shows:
   `BUILDING_CIVIC_SPORTS_PAVILION_001_v001.blend`
4. If Blender shows a temporary source name such as:
   `BUILDING_CIVIC_SPORTS_PAVILION_001_v001.tmp`
   do **not** run the resume script yet.
5. In that case, use `File` -> `Open` and reopen the exact final source file:
   `BUILDING_CIVIC_SPORTS_PAVILION_001_v001.blend`
6. Do not rename the temporary source file manually from Finder.
7. Switch to Blender’s `Scripting` workspace.
8. Open this script in the Blender text editor:
   `/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/local-blender-scripts/resume_building_civic_sports_pavilion_exports.py`
9. Run the script from Blender’s text editor.
10. Watch for these markers in Blender’s console output:
   - `S177_PAVILION_RESUME_START`
   - `S177_PAVILION_RESUME_VERSION_GUARD_OK`
   - `S177_PAVILION_RESUME_ASSET_GUARD_OK`
   - `S177_PAVILION_RESUME_RECIPE_GUARD_OK`
   - `S177_PAVILION_RESUME_LOD_EXPORT_START:...`
   - `S177_PAVILION_RESUME_LOD_EXPORT_COMPLETE:...`
   - `S177_PAVILION_RESUME_COMPLETE`
11. If the script stops on a failure marker, do not rename files manually.
12. Return to Codex for non-Blender verification.

## Expected Outputs After Manual Execution

If the manual Blender run succeeds, these files should exist:

- `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb`
- `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb`
- `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_MAP.glb`

The resume script is expected to verify before final rename:

- non-zero output size
- valid GLB header
- embedded pavilion identity
- no external dependencies
- mesh, material, and triangle counts

## Post-Run Codex Verification

Primary verification command:

```bash
node asset-factory/building-civic-sports-pavilion-post-run-verify.mjs
```

If that command reports the registration gate as ready, refresh manifest and
validation JSON from the verified final outputs with:

```bash
node asset-factory/building-civic-sports-pavilion-post-run-verify.mjs --update-records
```

## Registration Gate

Registration remains blocked until all of the following are true:

- all three final pavilion GLBs exist
- all three final pavilion GLBs parse successfully
- all three preserve pavilion asset identity
- no external file dependencies are found
- LOD complexity decreases sensibly from:
  - `LOD_CLOSE`
  - to `LOD_GAMEPLAY`
  - to `LOD_MAP`
- the Node-side verifier reports `registrationGate.ready: true`

Only after that should the pavilion be treated as ready for registration review.

## Tests Run

Passed:

- `node --test tests/asset-factory-building-civic-sports-pavilion-local-generator.test.mjs tests/asset-factory-building-civic-sports-pavilion-production-run.test.mjs tests/asset-factory-building-civic-sports-pavilion-manual-resume.test.mjs`
- `PYTHONPYCACHEPREFIX=/private/tmp/growgo-pycache python3 -m py_compile asset-factory/local-blender-scripts/resume_building_civic_sports_pavilion_exports.py`

Focused coverage added:

- resume-script syntax
- temp GLB path ends with `.tmp.glb`
- no `.glb.tmp`
- no `.glb.tmp.glb`
- validation reads the actual exported temp file
- atomic rename to final `.glb`
- all three LOD paths
- final source `.blend` naming check
- asset identity guard
- export order
- atomic finalisation
- stop-on-first-failure
- final GLB verification
- decreasing LOD complexity
- no Blender process launch from Node/Codex

## Final Status

This Codex phase is complete.

`BUILDING_CIVIC_SPORTS_PAVILION_001` is **not complete yet** and is **not ready
for registration yet**.

The next step is the user’s manual Blender execution of the Session 177 resume
script.
