# COASTAL_GRAVEL_PATH_001 v001 Source Lane Cleanup Report

- Date: 2026-07-30
- Workflow: Asset Factory v1 source lane normalisation
- Status: Complete

## Goal

Resolve duplicate source-lane candidates for `COASTAL_GRAVEL_PATH_001_v001` before export.

## Canonical source kept

- Family: `COASTAL_PATHWAY_FAMILY_001`
- File: `COASTAL_GRAVEL_PATH_001_v001.blend`
- Canonical source path:
  `asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/source/COASTAL_GRAVEL_PATH_001_v001.blend`
- Canonical SHA-256:
  `3372ca28b50489b7b1e3af95430b9296d66a365734026fa27feec6b50b0629a5`

## Evidence comparison

- Both candidates contained the expected asset identity token: `COASTAL_GRAVEL_PATH_001`
- Both candidates contained the expected recipe identity token: `COASTAL_GRAVEL_PATH_RECIPE_001`
- Both candidates contained all required LOD roots
- Both candidates contained all required identity anchors
- The files were not byte-identical, so the non-canonical candidate was preserved as quarantine evidence instead of being discarded

## Quarantined candidate

- Original path:
  `asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/source/COASTAL_GRAVEL_PATH_001_v001.blend`
- Quarantine path:
  `asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/reports/quarantine/COASTAL_GRAVEL_PATH_001_v001_from_COASTAL_NATURE_FAMILY_001.blend`
- Quarantined SHA-256:
  `02e83ab165761d3d611fa5baad871e94dbbb9a621bdca3e2ad947b20e034f0bb`

## Cleanup result

- Canonical source remains in the pathway family `source/` lane
- The duplicate source candidate was removed from the nature family `source/` lane and preserved in quarantine
- No export, registration, or promotion actions were performed
