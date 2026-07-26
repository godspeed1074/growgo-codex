# GrowGo Session 41 - Blender Suburban Neighbourhood Visual Inspection Report

## Session Scope

This session records the first inspection pass for:

- `NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001`

This is an inspection and documentation session only.

This session does not:

- create new assets
- modify registered buildings
- create production neighbourhoods
- modify the renderer
- modify gameplay systems
- modify backend systems
- modify OSM systems

## 1. Inspection Basis

This inspection pass reviewed:

- `GROWGO_SESSION_40_EXECUTABLE_BLENDER_SUBURBAN_NEIGHBOURHOOD_PREVIEW_PROTOTYPE.md`
- `asset-factory-workspace/procedural-previews/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001/preview-scene-metadata.json`
- `asset-factory-workspace/procedural-previews/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_VALIDATION_001.json`
- `asset-factory-workspace/procedural-previews/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001.json`
- `asset-factory/local-blender-scripts/generate_suburban_neighbourhood_preview_scene.py`

This pass confirms:

- source placement data
- source transforms
- consumer metadata
- validation output
- preview-construction rules used by the Blender prototype

### Screenshot status

- Screenshots were not captured in this session.
- A live Blender GUI viewport inspection is still required for final visual signoff.

## 2. Inspection Summary

The prototype is structurally sound as a first controlled neighbourhood inspection scene.

Confirmed strengths:

- six lots resolve deterministically
- all six building placements resolve to registered building assets
- source road-facing rotations are preserved correctly
- validation passes for overlap, lot population, driveway connectivity, orientation, and deterministic source matching
- the scene remains small and reusable enough for prototype inspection work

Main concerns:

- driveway preview logic does not visually reflect left or right driveway-side rules
- fence preview currently draws a fully closed boundary instead of representing driveway gaps
- landscaping preview uses simple debug boxes, which is fine for containment checks but weak for naturalness and style review
- the generated six-lot result reads more coastal than suburban, which softens the intended suburban identity

## 3. PASS / FAIL Checklist

### Building Placement

Status:

- `PASS`

Checks:

- houses sit on defined lots: `PASS`
- no floating buildings indicated by source placement data: `PASS`
- no intersections reported by validation: `PASS`
- realistic setbacks in source lot rules: `PASS`

Notes:

- Source validation reports `noPlacementOverlap: PASS`
- placements remain inside deterministic lot logic

### Orientation

Status:

- `PASS`

Checks:

- houses face roads: `PASS`
- coastal and suburban homes rotate correctly: `PASS`
- garage-facing logic remains sensible at the source-rule level: `PASS`

Notes:

- north lots use `yawDegrees: 180`
- south lots use `yawDegrees: 0`
- this matches the preview consumer orientation contract

### Road Relationships

Status:

- `FAIL`

Checks:

- driveways connect to roads: `PASS`
- frontage is logical: `PASS`
- driveway side representation is believable: `FAIL`
- lot accessibility is fully communicated visually: `FAIL`

Notes:

- connectivity passes at the validation-contract level
- the visual prototype does not yet use `drivewaySide` to offset driveway placement

### Landscaping

Status:

- `FAIL`

Checks:

- trees inside boundaries: `PASS`
- bushes placed inside valid zones: `PASS`
- grass areas make sense structurally: `PASS`
- bushes placed naturally: `FAIL`
- visual landscaping quality suitable for neighbourhood review: `FAIL`

Notes:

- containment is sound
- the current prototype uses placeholder boxes rather than readable natural forms

### Variation

Status:

- `PASS` with concern

Checks:

- neighbourhood does not look repetitive: `PASS`
- deterministic variation works: `PASS`
- building mix feels fully believable as suburban identity: `PARTIAL`

Notes:

- adjacent duplicate prevention is working
- however, the current six-lot result contains only `2` suburban brick homes and `4` coastal-family homes, which pulls the read away from a clearly suburban street

### Style

Status:

- `FAIL`

Checks:

- papercut 2.5D direction visible in the prototype: `FAIL`
- scale consistency: `PASS`
- mobile-friendly complexity: `PASS`

Notes:

- registered building assets may still carry the intended art direction
- the current neighbourhood prototype layer is still too debug-oriented for visual style approval

## 4. Identified Issues

### ISSUE_NBH_001

- Category: Road relationships
- Severity: `MEDIUM`
- Description:
  The driveway preview is drawn from the lot frontage centreline and does not use the lot's `drivewaySide` or `drivewayOpeningSide`, so west/east driveway identity is not visible in the inspection scene.

Evidence:

- [generate_suburban_neighbourhood_preview_scene.py](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/local-blender-scripts/generate_suburban_neighbourhood_preview_scene.py:275)
- [NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001.json](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/procedural-previews/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001.json:62)

### ISSUE_NBH_002

- Category: Fence placement
- Severity: `MEDIUM`
- Description:
  Fence preview currently draws a fully closed rectangle for each lot and does not represent the intended driveway opening gap, which weakens frontage readability.

Evidence:

- [generate_suburban_neighbourhood_preview_scene.py](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/local-blender-scripts/generate_suburban_neighbourhood_preview_scene.py:295)
- [NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001.json](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/procedural-previews/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001.json:74)

### ISSUE_NBH_003

- Category: Landscaping
- Severity: `LOW`
- Description:
  Trees, bushes, and lawn areas are represented with simple boxes. This is acceptable for containment debugging, but not for natural-looking visual inspection.

Evidence:

- [generate_suburban_neighbourhood_preview_scene.py](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/local-blender-scripts/generate_suburban_neighbourhood_preview_scene.py:318)

### ISSUE_NBH_004

- Category: Variation / neighbourhood feel
- Severity: `MEDIUM`
- Description:
  The generated preview mix reads more coastal-mixed than clearly suburban. The result contains `4` coastal-family homes and only `2` suburban brick homes, which may be too soft for a first suburban block showcase.

Evidence:

- [preview-scene-metadata.json](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/procedural-previews/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001/preview-scene-metadata.json:10)
- [NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001.json](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/procedural-previews/NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001.json:16)

### ISSUE_NBH_005

- Category: Visual QA process
- Severity: `LOW`
- Description:
  No screenshots or live Blender viewport captures were produced in this pass, so final visual signoff is still pending.

## 5. Recommended Improvements

Recommended next changes:

- lot rules:
  keep current lot sizes and setbacks; no immediate blocker found here
- resolver weighting:
  consider a stronger suburban weighting or a suburban-first theme override for the first preview block
- placement rules:
  move driveway preview placement off the lot centreline and align it to `drivewaySide`
- validation rules:
  add a preview-layer check confirming driveway visual offset matches the source driveway-side rule
- fence preview rules:
  represent front-boundary openings explicitly using `drivewayOpeningSide`
- landscape preview rules:
  replace simple box markers with more readable preview glyphs or existing preview-safe placeholders without introducing new assets

## 6. Approval Status

Status:

- `CONDITIONAL APPROVAL FOR NEXT ITERATION`

Meaning:

- the deterministic neighbourhood generator and preview consumer are stable enough to continue
- the current prototype is acceptable for structural inspection
- the current prototype is not yet approved as a strong suburban visual preview for broader scaling

Required before broader scaling:

- driveway-side visual alignment fix
- fence opening representation fix
- one live Blender GUI inspection pass with screenshots
- optional resolver weighting adjustment if a more clearly suburban street feel is desired
