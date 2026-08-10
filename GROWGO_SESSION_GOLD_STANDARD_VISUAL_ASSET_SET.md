# GrowGo — First GrowGo Gold Standard Visual Asset Set

Date: 2026-08-10
Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`

## Outcome

A protected Gold Standard benchmark specification has been established for the first three benchmark asset categories:

1. one tree;
2. one shrub / low landscape asset;
3. one small building.

This work does **not** claim final Gold Standard benchmark-set completion yet.
The tree benchmark is now formally operator-approved, while the shrub and building remain pending their own review checkpoints.

## Visual issues found in the current proof assets

The existing live-render proof assets are technically functional, but they are not yet strong enough to define the GrowGo visual benchmark.

Key issues recorded:

- cross-category cohesion is still weaker than the desired GrowGo quality bar;
- the pavilion required developer-only live calibration to avoid dominating vegetation;
- the shrub family previously required a protected revision because the earlier silhouette felt pancaked;
- the tree benchmark review is now complete and establishes the first approved Gold Standard baseline for the benchmark set;
- the current proof scene demonstrates renderer success, not final asset-art signoff.

## Benchmark visual rules established

### Silhouette

- readable at normal gameplay zoom;
- no flat or pancaked side profile;
- clear category identity from the fixed GrowGo north-up oblique camera.

### Proportions

- believable relative scale between tree, shrub, and small building;
- works under the fixed GrowGo camera;
- no category overwhelms the others in a shared scene.

### Colour

- curated, region-appropriate palette;
- stylized and cohesive rather than noisy or hyper-real;
- cross-category palette harmony required.

### Geometry

- mobile-lightweight only;
- enough form to read in true 3D;
- no invisible micro-detail;
- stable LOD/export path required.

### Materials

- simple;
- clean;
- papercut / stylized;
- not photorealistic.

### Live-map readability

- readable on the actual GrowGo map;
- geographically believable through pan and zoom;
- visually cohesive when multiple categories share one scene.

## Selected benchmark assets

### Tree benchmark

- Asset ID: `TREE_EUCALYPTUS_001`
- Historical version preserved: `v001`
- Gold Standard approved version: `v002`
- Gameplay GLB: `TREE_EUCALYPTUS_001_v002_LOD_GAMEPLAY.glb`
- Reason: already proven through the live Atlas GLB path, now visually approved by the operator on the real GrowGo map, and preserves a permanent flagship tree identity.

#### Recorded operator approval

- operator visually approved on the real GrowGo map
- fixed north-up oblique Atlas camera used for approval
- geographic anchoring verified through pan and zoom after the Leaflet layer-coordinate fix
- approval scale used: `1.00x`
- `TREE_EUCALYPTUS_001@v001` preserved unchanged as historical approved material

### Shrub benchmark

- Asset ID: `SHRUB_COASTAL_LOW_001`
- Current source version: `v002`
- Protected Gold Standard target revision: `v003`
- Reason: already has a documented protected refinement path and is the clearest low-landscape benchmark family.

### Building benchmark

- Asset ID: `BUILDING_CIVIC_SPORTS_PAVILION_001`
- Current source version: `1.0.0`
- Protected Gold Standard target revision: `1.1.0`
- Reason: already proven on the live shared Atlas renderer and is the smallest safe building family to refine without reopening renderer work.

## Preserved renderer / runtime guardrails

Still preserved:

- `lifecycleExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `runtimeExecutionEnabled = false`

Also preserved:

- no renderer architecture changes;
- no automatic population;
- no production publish;
- no overwrite of protected historical asset versions.

## Provisional observation preserved

The pavilion shared-renderer calibration remains recorded only as a provisional visual observation:

- pavilion scale multiplier: `0.62x`
- pavilion target height: `3.6m`

This is **not** promoted here into a universal production world-scale rule.

## Operator approval state

Tree benchmark:

- `TREE_EUCALYPTUS_001@v002` → `APPROVED_GOLD_STANDARD`

Still pending:

- `SHRUB_COASTAL_LOW_001@v003` → `PENDING_GOLD_STANDARD_REVIEW`
- `BUILDING_CIVIC_SPORTS_PAVILION_001@1.1.0` → `PENDING_GOLD_STANDARD_REVIEW`

Per-asset operator review checkpoints remain mandatory.
Automatic approval remains forbidden.

## Files changed

- `asset-factory/growgo-gold-standard-visual-benchmark.mjs`
- `tests/asset-factory-growgo-gold-standard-visual-benchmark.test.mjs`
- `GROWGO_SESSION_GOLD_STANDARD_VISUAL_ASSET_SET.md`

## Focused validation

Focused benchmark tests should verify:

- exactly three benchmark categories exist;
- historical overwrite remains forbidden;
- protected next-revision targets are stable;
- operator checkpoints remain required;
- runtime safety gates remain false.

## Next step

Use the protected benchmark spec to produce the first reviewable Gold Standard asset revision, starting with the tree benchmark, then stop for operator visual review before treating it as approved.
