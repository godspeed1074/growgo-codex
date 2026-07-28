# GROWGO SESSION 176 — CODEX-LAUNCHED BLENDER ENVIRONMENT ISOLATION

## Summary

This session isolated the Codex-launched Blender environment for
`BUILDING_CIVIC_SPORTS_PAVILION_001` without retrying pavilion generation.

Key result:

- Blender still crashes with `SIGSEGV` when launched directly by Codex, even under a stripped-down environment
- the crash still occurs before Python marker execution
- the `open -a /Applications/Blender-4.2-LTS.app --args ...` LaunchServices path did not start Blender and returned `kLSNoExecutableErr`
- no safe automated local launch method was established in this session

Therefore:

- pavilion generation is **not** yet safe to retry
- the pavilion asset package is **not** ready for registration based on the
  later manual output inspection

## Manual Finder Launch Result

User-provided known fact:

- Blender `4.2.23 LTS` opens successfully when launched manually from Finder

This session did not automate Finder interaction.

## Codex Launch Result

Direct Codex-launched background invocation of the explicit executable:

```bash
/Applications/Blender-4.2-LTS.app/Contents/MacOS/Blender --background --factory-startup -noaudio --python-exit-code 1 --python growgo-codex/asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/logs/session176/diag_env_marker.py
```

Result:

- exit code: `-11`
- signal: `SIGSEGV`
- Python completion marker: `NOT REACHED`
- environment snapshot file: `NOT WRITTEN`
- marker status file: `NOT WRITTEN`

This confirms the pavilion script still has not executed.

## Step 1 — Environment Comparison

### 1. Codex process environment

Relevant observed values:

- `HOME=/Users/michaelpeterson`
- `TMPDIR=/var/folders/18/n7r_f51d491gtzstrrwpsqgr0000gn/T/`
- `LANG=C.UTF-8`
- `PWD=/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root`
- `DISPLAY` unset
- `DYLD_LIBRARY_PATH` unset
- `DYLD_FRAMEWORK_PATH` unset
- `PYTHONPATH` unset
- `PYTHONHOME` unset
- `BLENDER_USER_CONFIG` unset
- `BLENDER_USER_SCRIPTS` unset
- `BLENDER_SYSTEM_SCRIPTS` unset
- `OCIO` unset
- `OIIO` unset
- `METAL_DEVICE_WRAPPER_TYPE` unset
- `MTL_CAPTURE_ENABLED` unset

Important PATH traits:

- Codex runtime override directories present
- `/Applications/Blender.app/Contents/MacOS` present in `PATH`
- sandbox / Codex desktop launch context present through `CODEX_*` and `__CFBundleIdentifier=com.openai.codex`

### 2. Clean minimal shell environment

Sanitised environment used:

- `HOME=/Users/michaelpeterson`
- `USER=michaelpeterson`
- `TMPDIR=/var/folders/18/n7r_f51d491gtzstrrwpsqgr0000gn/T/`
- `PATH=/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin`
- `LANG=C.UTF-8`

Explicitly absent in the clean environment:

- `DYLD_LIBRARY_PATH`
- `DYLD_FRAMEWORK_PATH`
- `PYTHONPATH`
- `PYTHONHOME`
- `BLENDER_USER_CONFIG`
- `BLENDER_USER_SCRIPTS`
- `BLENDER_SYSTEM_SCRIPTS`
- `OCIO`
- `OIIO`
- `METAL_DEVICE_WRAPPER_TYPE`
- `MTL_CAPTURE_ENABLED`

### 3. Blender launched through macOS `open`

Requested LaunchServices command:

```bash
open -W -n -a /Applications/Blender-4.2-LTS.app --args --background --factory-startup -noaudio --python-exit-code 1 --python growgo-codex/asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/logs/session176/diag_env_marker.py
```

Result:

- Blender did not start
- no Python marker printed
- no Blender environment snapshot file was written
- no marker status file was written

Observed LaunchServices error:

- `kLSNoExecutableErr`

Because the app did not start, no Blender-side environment comparison was available for this path.

## Environment Difference Assessment

Important comparison result:

- the potentially conflicting library and Python override variables were already absent in the Codex environment
- removing Codex-specific PATH additions and reducing the environment to essentials did **not** stop the crash

This weakens the theory that the failure is caused by:

- `DYLD_LIBRARY_PATH`
- `PYTHONPATH`
- `PYTHONHOME`
- Blender override variables
- OCIO / OIIO override variables

The remaining likely problem space is:

- Codex sandboxed process launch context
- direct non-Finder app startup path on this host
- lower-level macOS / LaunchServices / GPU initialization path differences

## Step 2 — Clean Environment Diagnostic

Exact command:

```bash
/Applications/Blender-4.2-LTS.app/Contents/MacOS/Blender --background --factory-startup -noaudio --python-exit-code 1 --python growgo-codex/asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/logs/session176/diag_env_marker.py
```

Sanitised environment:

- `HOME=/Users/michaelpeterson`
- `USER=michaelpeterson`
- `TMPDIR=/var/folders/18/n7r_f51d491gtzstrrwpsqgr0000gn/T/`
- `PATH=/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin`
- `LANG=C.UTF-8`

Logs:

- [clean stdout](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/logs/session176/20260728-184928-clean-diag.stdout.log)
- [clean stderr](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/logs/session176/20260728-184928-clean-diag.stderr.log)
- [clean record](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/logs/session176/20260728-184928-clean-diag.record.json)

Result:

- exit code: `-11`
- signal: `SIGSEGV`
- completion marker: `NOT REACHED`
- marker file exists: `NO`
- environment snapshot exists: `NO`

Assessment:

- Blender still crashes before Python starts even with a minimal inherited environment

## Step 3 — macOS App Launch Diagnostic

Exact command:

```bash
open -W -n -a /Applications/Blender-4.2-LTS.app --args --background --factory-startup -noaudio --python-exit-code 1 --python growgo-codex/asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/logs/session176/diag_env_marker.py
```

Logs:

- [open stdout](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/logs/session176/20260728-184948-open-diag.stdout.log)
- [open stderr](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/logs/session176/20260728-184948-open-diag.stderr.log)
- [open record](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/logs/session176/20260728-184948-open-diag.record.json)

Result:

- Blender starts: `NO`
- Python marker prints: `NO`
- process exits cleanly: `NO`
- logs are available: `YES`
- exit code from `open`: `1`

Observed stderr:

- `The application /Applications/Blender-4.2-LTS.app cannot be opened for an unexpected reason`
- `kLSNoExecutableErr: The executable is missing`

Assessment:

- this specific `open -a` path did not establish a usable automated launch path

## Step 4 — Wrapper Script

Wrapper script created:

- `NO`

Reason:

- no clean launch method succeeded
- session instructions only allow the pavilion-specific wrapper after the trivial diagnostic passes

## Step 5 — Diagnostic Ladder

The ladder was not entered.

### Trivial Python

- `FAILED`

### Create cube

- `NOT RUN`

### Save temporary .blend

- `NOT RUN`

### Export temporary GLB

- `NOT RUN`

Because trivial Python did not succeed, the ladder stopped before cube diagnostics.

## Step 6 — Testing

Passed:

- `node --test tests/asset-factory-building-civic-sports-pavilion-local-generator.test.mjs`
- `node --test tests/asset-factory-building-civic-sports-pavilion-production-run.test.mjs`

Coverage added or confirmed:

- environment sanitisation
- removal of conflicting variables
- safe command quoting
- completion-marker detection
- deterministic command construction
- existing pavilion runner behavior

Wrapper exit-code propagation test:

- not added because no wrapper script was created in this session

## Manual Output Inspection Follow-up

This environment-isolation session did not launch Blender successfully, but the
later manual file inspection clarified the current pavilion package state.

Verified without launching Blender:

- `BUILDING_CIVIC_SPORTS_PAVILION_001_v001.blend`
  - exists
  - non-zero size
  - Blender header verified: `BLENDER-v402`
  - embedded asset identity markers present
  - not fully parse-verified for mesh/material/triangle counts
- `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb`
  - missing as a final required file
- `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb`
  - missing
- `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_MAP.glb`
  - missing
- `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb.tmp.glb`
  - present as a temporary file only
  - valid GLB parse
  - mesh count: `47`
  - material count: `6`
  - triangle count: `1,624`
  - no external dependencies detected
  - not acceptable as a final proof output

Manifest hash:

- `building-civic-sports-pavilion-manifest.json`
  - sha256: `685f0a27960db8711fdfe379c4e7e06d0b63ecd73b9908266213fb53f2238297`

Registration truth after manual inspection:

- `BUILDING_CIVIC_SPORTS_PAVILION_001` is **not ready for registration**
- the exact blocker remains the incomplete required output set:
  - `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb` missing
  - `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb` missing
  - `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_MAP.glb` missing

## Files Changed

Changed:

- [asset-factory/building-civic-sports-pavilion-production-run.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/building-civic-sports-pavilion-production-run.mjs)
- [asset-factory/building-civic-sports-pavilion-local-generator.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/building-civic-sports-pavilion-local-generator.mjs)
- [tests/asset-factory-building-civic-sports-pavilion-production-run.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-building-civic-sports-pavilion-production-run.test.mjs)
- [tests/asset-factory-building-civic-sports-pavilion-local-generator.test.mjs](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/asset-factory-building-civic-sports-pavilion-local-generator.test.mjs)
- diagnostic scripts and records under `asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/logs/session176`
- [GROWGO_SESSION_176_CODEX_BLENDER_ENVIRONMENT_ISOLATION.md](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_176_CODEX_BLENDER_ENVIRONMENT_ISOLATION.md)

## Successful Launch Method

Successful automated local launch method found:

- `NO`

## Pavilion Retry Safety

Pavilion generation is now safe to retry:

- `NO`

## Exact Remaining Blocker

Exact remaining blocker:

- no automated Codex-safe Blender launch path has yet passed the trivial Python marker test
- direct executable launch still crashes with `SIGSEGV` before Python starts
- `open -a /Applications/Blender-4.2-LTS.app --args ...` did not produce a working LaunchServices launch path
