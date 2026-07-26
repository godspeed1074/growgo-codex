# GROWGO SESSION 50 — 24 LOT SUBURBAN STREET BLOCK VISUAL INSPECTION REPORT

## Inspection Summary

Inspection target:

- `SUBURBAN_STREET_BLOCK_001_PREVIEW_SCENE_001`
- seed `10482`
- preview `SUBURBAN_STREET_BLOCK_001_PREVIEW_001`

Reference basis:

- `GROWGO_SESSION_49_SUBURBAN_STREET_BLOCK_VISUAL_PREVIEW_INTEGRATION.md`
- `GROWGO_SESSION_48_DETERMINISTIC_24_LOT_SUBURBAN_STREET_BLOCK_GENERATOR.md`
- `GROWGO_SESSION_46_SUBURBAN_STREET_BLOCK_EXPANSION_FOUNDATION.md`
- generated preview scene metadata and validation output

Important note:

- live Blender viewport evidence was not newly captured in this session
- inspection was performed against the generated preview scene contract, camera definitions, placement data, and validation output already produced for Session 49

Overall read:

- the block is structurally coherent and deterministic
- the collector-road frontage logic is readable
- lot sizing and setback ranges are believable for low-density Australian suburban content
- the current preview does **not yet feel like a fully realized multi-street suburban block**
- the strongest shortcoming is that the local street and cul-de-sac geometry exist visually, but the residential frontage still resolves almost entirely along the east-west collector edges

## PASS / FAIL Checklist

### ROAD NETWORK

- streets connect naturally: `PASS`
- intersections feel believable: `PASS`
- road spacing feels realistic: `PASS`
- cul-de-sac behaviour if present: `FAIL`

Notes:

- the graph is valid with `6` road segments, `3` intersections, and `1` connected component
- the four-way and T intersection structure is believable
- the cul-de-sac branch exists in the graph, but it does not yet carry lot frontage, so visually it reads more like an attached road stub than a lived suburban edge

### LOT DISTRIBUTION

- lot widths feel believable: `PASS`
- setbacks feel Australian suburban: `PASS`
- corner lots behave correctly: `CONDITIONAL`
- density feels appropriate: `PASS`

Notes:

- lot widths range from `12.26m` to `23.6m`, average `16.80m`
- lot depths range from `35.33m` to `41.22m`, average `37.34m`
- front setbacks range from `4.52m` to `6.8m`, average `5.76m`
- those numbers feel credible for suburban detached housing
- corner lots are flagged and wider in places, but they are still resolved on collector rows rather than making the side-street condition visually meaningful

### BUILDING RHYTHM

- house repetition: `CONDITIONAL`
- building mix: `FAIL`
- suburban identity: `CONDITIONAL`
- coastal variation control: `FAIL`

Notes:

- building count resolves to:
  - `12` suburban brick houses
  - `8` coastal cottages
  - `4` beach bungalows
- actual block mix is therefore `50% / 33% / 17%`
- this does not reflect the intended `SUBURBAN_AUSTRALIA` weighting of `85% / 12% / 3%`
- row sequencing is controlled enough to avoid obvious direct duplicates, but several street edges still alternate in a visibly patterned way
- coastal identity is currently too prominent for the claimed suburban profile

### DRIVEWAYS AND FRONTAGES

- driveway connections: `PASS`
- garage alignment: `PASS`
- fence openings: `PASS`
- pedestrian access: `PASS`

Notes:

- driveway-side assignments are consistent
- frontage connection records are valid
- fence and pedestrian opening logic reads cleanly in the contract
- no cross-lot driveway conflicts were detected

### STREET FEATURES

- sidewalks: `PASS`
- grass verges: `PASS`
- street trees: `PASS`
- signs: `CONDITIONAL`
- public/private separation: `PASS`

Notes:

- the block contains:
  - `12` sidewalk placements
  - `12` verge placements
  - `18` street-tree placements
  - `3` intersection sign markers
  - `24` mailbox preview markers
- public/private separation is clear in the data model
- signage is still preview-marker level rather than a finished visual language, which is acceptable for this stage but not polished

### LANDSCAPING

- vegetation distribution: `CONDITIONAL`
- containment: `PASS`
- natural variation: `CONDITIONAL`

Notes:

- containment is good and validation passes
- distribution is serviceable, but it is still fairly schematic
- tree spacing along public verges is more convincing than private-lot landscape variation

### STYLE

- papercut 2.5D appearance: `CONDITIONAL`
- scale consistency: `PASS`
- mobile suitability: `CONDITIONAL`

Notes:

- scale relationships are stable in the preview contract
- the scene is still closer to a debug-heavy inspection layout than an approved polished visual block
- mobile suitability is plausible at the contract level, but the current Blender prototype imports full building GLBs per placement rather than true linked instances, which raises preview-scene cost

## Performance Review

Approximate scene-object layer count from the preview contract:

- `24` building placements
- `69` street-feature placements
- `24` lots
- `24` road-frontage connections
- `6` road segments
- `3` intersections

Approximate high-level placement count:

- about `150` contract-level scene items before counting imported child objects inside the building GLBs

Instance reuse observations:

- the metadata intends `instance_reuse_only`
- the current Blender preview script imports GLBs per building placement rather than true linked scene instances
- this is acceptable for a prototype inspection scene, but it is not the final performance pattern we would want for larger scaling passes

Duplicated geometry concerns:

- moderate concern for preview-only inspection scenes
- high concern if this exact import behaviour were reused unchanged for larger blocks

Expected mobile suitability:

- conditional
- the procedural contract is lightweight
- the current preview consumer is suitable for inspection, but not yet a trustworthy proxy for final runtime/mobile neighbourhood rendering cost

## Issues Found

### ISSUE_SSB_001

- category: road / lot integration
- severity: `HIGH`
- description: local street and cul-de-sac road segments are present, but they do not currently host residential lots, so the block reads visually as collector-edge housing with decorative side roads rather than a true multi-street suburban neighbourhood

### ISSUE_SSB_002

- category: theme weighting
- severity: `MEDIUM`
- description: resolved building mix for seed `10482` is `12 suburban / 8 cottage / 4 bungalow`, which materially overrepresents coastal housing relative to the intended `SUBURBAN_AUSTRALIA` weighting

### ISSUE_SSB_003

- category: building rhythm
- severity: `MEDIUM`
- description: several collector rows still read as patterned alternations rather than naturally varied suburban frontage, especially where suburban and coastal assets alternate in repeated sequences

### ISSUE_SSB_004

- category: corner-lot behaviour
- severity: `MEDIUM`
- description: corner lots are marked and dimensionally varied, but they do not yet create enough visible side-street identity because frontage resolution remains concentrated on the collector edges

### ISSUE_SSB_005

- category: preview rendering performance
- severity: `LOW`
- description: the Blender preview prototype imports repeated building GLBs as separate imports rather than linked instances, which is acceptable for inspection but not a scalable preview performance pattern

### ISSUE_SSB_006

- category: camera coverage
- severity: `LOW`
- description: the defined street-level camera starts near the western edge of the block and is useful for frontage inspection, but it is less effective for communicating the larger multi-street structure or cul-de-sac behaviour

## Recommendations

1. Prioritize lot frontage generation for local street and cul-de-sac segments before scaling.
2. Rebalance suburban theme weighting so the default suburban brick house becomes visually dominant in the resolved output, not just in the intended profile.
3. Add stronger anti-pattern repetition rules for adjacent lots and mirrored collector rows.
4. Strengthen corner-lot resolution so side-street conditions produce visibly different frontage outcomes.
5. Keep the current preview consumer, but treat its GLB import strategy as prototype-only for larger scene inspection.
6. Add a second street-level camera deeper inside the block for future inspections once the side streets actually carry housing.

## Scaling Decision

Decision:

- `CONDITIONAL APPROVAL`

Reason:

- the system is structurally sound enough to continue iterating
- the preview contract is deterministic and validated
- however, the current 24-lot result is not yet visually convincing as a full suburban street block because side-street and cul-de-sac frontage behaviour is still under-realized and the suburban theme weighting is not yet reading correctly in the resolved block

## Approval Status For Next Iteration

Approved only for a focused correction pass on:

- local-street lot frontage resolution
- cul-de-sac residential behaviour
- suburban theme weighting output
- row-pattern repetition control
- corner-lot visual differentiation

Not yet approved for:

- larger-scale procedural suburb expansion
- neighbourhood-level signoff
- production-style preview capture claims
