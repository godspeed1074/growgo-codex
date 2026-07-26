# GrowGo Session 43 - Second Blender Suburban Neighbourhood Visual Inspection Report

## Session Scope

This session records the second inspection pass for:

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001`

using the Session 42 rule corrections.

This is an inspection and documentation session only.

This session does not:

- create new assets
- create new modules
- modify registered buildings
- expand neighbourhood size
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## 1. Inspection Basis

This inspection pass reviewed:

- `GROWGO_SESSION_42_SUBURBAN_NEIGHBOURHOOD_PREVIEW_RULE_CORRECTIONS.md`
- `GROWGO_SESSION_41_BLENDER_SUBURBAN_NEIGHBOURHOOD_VISUAL_INSPECTION_REPORT.md`
- `GROWGO_SESSION_40_EXECUTABLE_BLENDER_SUBURBAN_NEIGHBOURHOOD_PREVIEW_PROTOTYPE.md`
- `asset-factory-workspace/procedural-previews/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001/preview-scene-metadata.json`
- `asset-factory-workspace/procedural-previews/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_VALIDATION_001.json`
- `asset-factory/local-blender-scripts/generate_suburban_neighbourhood_preview_scene.py`

This pass confirms:

- corrected driveway-side logic
- corrected fence opening logic
- registered vegetation asset usage for tree and bush preview instances
- updated theme weighting metadata
- updated capture camera definitions
- current validation status

### Screenshot status

- No screenshots were captured in this session.
- A live Blender GUI viewport review is still required for final visual signoff.

## 2. Inspection Summary

The second-pass suburban neighbourhood preview is materially better than the first structural prototype.

Confirmed improvements:

- driveway logic is now side-aware
- fence preview now supports visible vehicle and pedestrian openings
- tree and bush preview instances now use registered assets
- preview metadata now records repeatable capture views
- validation now covers driveway, fence opening, landscape containment, and theme weighting

Remaining softness:

- the current six-lot result still reads as a mixed suburban/coastal edge case rather than a strongly suburban street
- the grass layer remains a simple preview surface rather than a richer suburban lawn treatment
- final papercut 2.5D feel still cannot be fully approved without live viewport review

## 3. PASS / FAIL Checklist

### Building Placement

Status:

- `PASS`

Checks:

- houses sit correctly on lots: `PASS`
- realistic setbacks: `PASS`
- no floating buildings indicated by current scene rules: `PASS`
- no intersections: `PASS`

Notes:

- validation reports `noPlacementOverlap: PASS`
- source transforms remain unchanged and road-facing

### Driveway System

Status:

- `PASS`

Checks:

- driveway matches garage side: `PASS`
- driveway reaches road: `PASS`
- neighbouring lots do not conflict: `PASS`

Notes:

- driveway anchor is now derived from side-specific lot logic
- road connection records now preserve `garageSide` and `crossingNeighbouringLots: false`
- Blender preview now draws driveway lines from side-aware frontage anchors

### Fence System

Status:

- `PASS`

Checks:

- fence follows lot boundary: `PASS`
- driveway openings exist: `PASS`
- pedestrian access exists: `PASS`

Notes:

- front fence preview is now segmented rather than closed
- front openings are derived from driveway and pedestrian access data

### Landscaping

Status:

- `PASS` with concern

Checks:

- real vegetation assets appear: `PASS`
- trees remain inside lots: `PASS`
- bushes remain contained: `PASS`
- landscaping feels suburban: `PARTIAL`

Notes:

- tree and bush preview instances now import registered GLBs
- grass remains a simple preview block, so suburban lawn feel is still only partially represented

### Neighbourhood Identity

Status:

- `CONDITIONAL PASS`

Checks:

- `SUBURBAN_AUSTRALIA` weighting feels correct in rules: `PASS`
- not overly coastal: `PARTIAL`
- variation feels believable: `PASS`

Notes:

- metadata now records the intended suburban weighting of `70 / 25 / 5`
- the current deterministic seed still yields a visible coastal presence:
  - `2` suburban brick homes
  - `3` coastal cottages
  - `1` beach bungalow
- this is plausible, but not yet a strongly suburban showcase block

### Style

Status:

- `CONDITIONAL PASS`

Checks:

- papercut 2.5D direction: `PARTIAL`
- scale consistency: `PASS`
- mobile-friendly complexity: `PASS`

Notes:

- the prototype remains lightweight and readable
- final stylistic approval still depends on a live Blender viewport check

## 4. Camera Review

### Top-down view

Status:

- `PASS`

Usefulness:

- good for lot boundary and driveway-side inspection
- good for confirming spacing and lot rhythm

Potential issue:

- does not communicate neighbourhood character or asset silhouette well

### Angled 2.5D view

Status:

- `PASS`

Usefulness:

- best candidate for overall inspection and future signoff screenshots
- suitable for checking house orientation, fence readability, and suburban street rhythm

Potential issue:

- still needs a live viewport check to confirm framing and occlusion

### Street-level view

Status:

- `CONDITIONAL PASS`

Usefulness:

- useful for checking frontage logic and driveway/fence relationships

Potential issue:

- likely more sensitive to occlusion and scene readability
- not yet visually confirmed in a live Blender viewport

## 5. Identified Issues

### ISSUE_NBH_006

- Category: Neighbourhood identity
- Severity: `MEDIUM`
- Description:
  The corrected rules are better, but the default six-lot seed still produces a mixed coastal/suburban street rather than a clearly suburban flagship preview. This is not a generation failure, but it weakens the clarity of the default demonstration block.

Evidence:

- [preview-scene-metadata.json](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/procedural-previews/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001/preview-scene-metadata.json:31)

### ISSUE_NBH_007

- Category: Landscaping style
- Severity: `LOW`
- Description:
  Tree and bush instances are now real registered assets, but grass remains a simple preview slab. Structural containment is good, but the suburban lawn feel is still not fully convincing.

Evidence:

- [generate_suburban_neighbourhood_preview_scene.py](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/local-blender-scripts/generate_suburban_neighbourhood_preview_scene.py:416)

### ISSUE_NBH_008

- Category: Visual QA process
- Severity: `LOW`
- Description:
  No screenshots or live Blender viewport captures were produced in this pass, so camera usefulness is still inferred from the script and metadata rather than visually confirmed.

## 6. Recommended Changes

Recommended next steps:

- neighbourhood identity:
  consider a showcase-specific suburban demo seed or slightly stronger suburban-first weighting for the default inspection block
- landscaping:
  keep the current real bush/tree asset usage and improve only the lawn preview treatment in a future pass
- camera review:
  perform one live Blender GUI inspection pass using the three capture cameras and save comparison screenshots
- scaling safety:
  keep the six-lot preview size for one more review loop before moving to larger neighbourhood blocks

## 7. Scaling Decision

Decision:

- `CONDITIONAL APPROVAL`

Reason:

- the rule-correction pass successfully closes the main structural issues from Session 41
- driveway, fence, validation, and capture workflow are now in a much healthier state
- the preview system is technically stable enough to continue
- however, the default showcase block is still not strong enough visually to justify broad scaling without one more live visual confirmation pass

Conditions before scaling:

- complete a live Blender GUI screenshot pass
- confirm the three capture cameras are practically useful
- decide whether the default suburban showcase should use a different deterministic seed or slightly stronger suburban emphasis
