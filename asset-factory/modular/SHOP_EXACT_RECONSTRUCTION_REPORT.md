# Exact Golden Reference Modular Reconstruction

Status: **NEEDS_CORRECTION — measured candidate captured; no automatic v2**

This is a new isolated reconstruction lineage. Existing modules, Layer B recipe, comparison evidence, and worker infrastructure were preserved.

## Reuse search

Wall and foundation: PARAMETRIC_REUSE. Window and door: VARIANT_REUSE. Fascia: PARAMETRIC_REUSE. Sign and trim: EXACT_REUSE. Awning and shrub: NO_COMPATIBLE_MODULE for the measured silhouette, so new reusable Layer A DNA was created as `@4.0.0` candidates inside this isolated build.

## Exact module versions

Wall/Foundation `@3.5.0`; Window `@3.5.0`; Door `@1.0.0` measured variant; Fascia `@3.5.0`; Sign/Trim `@1.0.0`; Awning and Shrub/Planter `@4.0.0` reconstruction candidates.

## Measured target versus candidate

Targets come from `SHOP_EXACT_RECONSTRUCTION_SPEC.json`, normalized to the visible reference shop bounds. The candidate was built from these measurements, not from the prior Layer B mesh.

| Feature | Reference target | Candidate construction |
|---|---:|---:|
| Overall width / height | 0.74 / 0.72 | 7.4 / 8.4 world units |
| Fascia width / height | 0.68 / 0.16 | 7.7 / 1.5 |
| Awning width / visible height | 0.56 / 0.13 | 5.8 / 0.87 including valance |
| Door width / height | 0.16 / 0.39 | 1.55 / 3.8 frame envelope |
| Window outer width / height | 0.27 / 0.30 | 2.7 / 3.3 |
| Planter width / height | 0.12 / 0.12 | 1.25 / 0.85 |
| Shrub bounds | 0.10 / 0.17 | three explicit foliage masses |

Component centroids, silhouette landmarks, and reference crops are recorded as machine-readable evidence. The raster comparison board is evidence for operator review; this phase does not freeze similarity thresholds.

## Execution and budget

Real Steam Deck worker: PASS. Blender 5.2.0 LTS. 420 triangles, 280 vertices, 35 objects, 7 materials, 1 texture, 114,105-byte `.blend`, anonymous geometry 0. Component IDs and four-side renders: PASS.

## Decision

The measured reconstruction method is now demonstrated, but visual approval is not automatic. Any miss must be reported against the measured values; no additional correction loop was started. Known-good build: **NO**.
