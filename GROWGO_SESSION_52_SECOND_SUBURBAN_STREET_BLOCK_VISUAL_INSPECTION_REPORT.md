# GROWGO SESSION 52 — SECOND 24 LOT SUBURBAN STREET BLOCK VISUAL INSPECTION REPORT

## Inspection Summary

Inspection target:

- `SUBURBAN_STREET_BLOCK_001_PREVIEW_SCENE_001`
- seed `10482`
- preview `SUBURBAN_STREET_BLOCK_001_PREVIEW_001`

Reference basis:

- `GROWGO_SESSION_51_SUBURBAN_STREET_BLOCK_RULE_CORRECTIONS.md`
- `GROWGO_SESSION_50_SUBURBAN_STREET_BLOCK_VISUAL_INSPECTION_REPORT.md`
- `GROWGO_SESSION_49_SUBURBAN_STREET_BLOCK_VISUAL_PREVIEW_INTEGRATION.md`
- refreshed preview scene metadata
- refreshed validation output
- refreshed deterministic preview JSON

Important note:

- live Blender viewport captures were not newly produced in this session
- inspection was performed against the updated preview scene contract, camera definitions, placement data, building mix, and validation outputs generated after Session 51

Overall read:

- Session 51 clearly improved the street block from a collector-edge housing layout into a real multi-street suburban block
- side streets and the cul-de-sac now carry active frontage and no longer read as decorative road stubs
- driveway and garage relationships are much clearer in the contract
- suburban identity is now dominant in the resolved building mix
- the block is still not a perfect match for the intended suburban weighting profile, and the proportion of special-case lots remains visually assertive

## Camera Inspection

Reviewed camera profiles:

- `TOP_DOWN_BLOCK_INSPECTION`
- `ANGLED_2_5D_BLOCK_INSPECTION`
- `STREET_LEVEL_BLOCK_INSPECTION`

Camera usefulness:

- top-down remains the strongest inspection view for road graph, lot spread, and cul-de-sac resolution
- angled `2.5D` view is now more useful because the local streets and cul-de-sac actually carry frontage lots
- street-level remains helpful for driveway and frontage checking, but it is still biased toward one edge of the block and is less effective at communicating the whole street hierarchy

## PASS / FAIL Checklist

### ROAD NETWORK

- streets feel connected: `PASS`
- intersections feel realistic: `PASS`
- cul-de-sac behaviour: `PASS`
- road hierarchy: `PASS`

Notes:

- the road graph remains valid with `6` road segments, `3` intersections, and `1` connected component
- the corrected frontage distribution gives the cul-de-sac a lived suburban edge instead of a dead branch
- local north and south streets now participate in the block as actual residential frontage

### STREET FRONTAGE

- houses face streets: `PASS`
- side streets feel residential: `PASS`
- driveway placement: `PASS`
- garage relationships: `PASS`

Notes:

- lot frontage is now distributed evenly across `SEGMENT_001` through `SEGMENT_006`
- frontage directions are balanced across `NORTH`, `SOUTH`, `EAST`, and `WEST` with `6` lots each
- cul-de-sac lots now carry explicit radial frontage metadata and driveway alignment rules
- driveway side and garage side relationships read much more intentionally than they did in Session 50

### SUBURBAN IDENTITY

- brick houses dominate appropriately: `CONDITIONAL`
- coastal variation controlled: `CONDITIONAL`
- block reads as Australian suburb: `PASS`

Notes:

- resolved building mix is now:
  - `18` suburban brick houses
  - `4` coastal cottages
  - `2` beach bungalows
- this is a strong improvement over Session 50 and the block now reads suburban first
- however, the live mix is still `75% / 17% / 8%`, which is looser than the intended `85% / 12% / 3%` profile even though it passes the configured validation tolerance

### REPETITION CONTROL

- adjacent houses vary: `PASS`
- landscaping varies: `CONDITIONAL`
- street rhythm feels natural: `PASS`

Notes:

- no major adjacent duplicate failure is visible in the resolved frontage ordering
- roof tone, colour variant, and yard density now do more work to break up repeated house families
- landscaping variation is improved, but still reads more rule-driven than naturally layered in private-lot areas

### CORNER LOTS

- corner houses behave differently: `PASS`
- setbacks make sense: `CONDITIONAL`
- access remains logical: `PASS`

Notes:

- corner-aware driveway logic and frontage treatment are now visible in the lot contract
- access and frontage logic remain coherent
- `18` of the `24` lots are currently classified as non-interior conditions (`corner_primary`, `corner_secondary`, or `cul_de_sac_edge`), which is useful for stress-testing but may still make the block feel slightly over-conditioned

### STREET FEATURES

- sidewalks: `PASS`
- verges: `PASS`
- street trees: `PASS`
- signs: `CONDITIONAL`
- public/private separation: `PASS`

Notes:

- feature counts remain stable and believable for a preview contract:
  - `12` path placements
  - `12` grass verge placements
  - `18` street-tree placements
  - `3` sign placements
  - `24` mailbox markers
- public and private zones remain clearly separated
- sign treatment is still preview-marker level rather than polished neighbourhood signage

### STYLE

- papercut `2.5D` direction: `CONDITIONAL`
- scale consistency: `PASS`
- mobile suitability: `CONDITIONAL`

Notes:

- the layout now supports the intended papercut suburban read better than Session 50 because street frontage is more believable
- scale relationships remain coherent across roads, lots, and building placements
- preview metadata now uses `asset_reference_plus_transform`, which is the right direction for scalable preview consumption
- mobile suitability is still inferred from the contract and asset-reference approach rather than newly captured Blender viewport evidence

## Performance Review

Observed contract-level scene counts:

- `24` building placements
- `69` street-feature placements
- `24` lots
- `24` road-frontage connections
- `6` road segments
- `3` intersections

Instance reuse observations:

- preview metadata now explicitly uses `asset_reference_plus_transform`
- building preview resolution is reduced to `3` asset references plus per-instance transforms
- this is a cleaner preview contract for future Atlas Engine-style instanced consumption

Preview stability:

- validation passes fully
- deterministic rebuild remains stable
- preview contract is materially stronger than the Session 50 version for larger-block inspection work

## Remaining Issues

### ISSUE_SSB_007

- category: theme weighting
- severity: `MEDIUM`
- description: the corrected block is clearly suburban-dominant, but the resolved seed `10482` output still lands at `18 / 4 / 2` instead of the nominal `85% / 12% / 3%` profile, so coastal variation is still somewhat more visible than intended

### ISSUE_SSB_008

- category: corner-lot distribution
- severity: `LOW`
- description: the preview now benefits from stronger corner-lot behavior, but the block still contains a high share of non-interior lots, which can make the layout feel slightly over-tuned toward special frontage conditions

### ISSUE_SSB_009

- category: preview evidence
- severity: `LOW`
- description: this inspection is based on the corrected preview contract and generated metadata rather than fresh Blender viewport captures, so final visual confidence is improved but not yet backed by new rendered signoff images

## Scaling Recommendation

Decision:

- `CONDITIONAL APPROVAL`

Recommendation:

- proceed to the next scaling step only if the team is comfortable treating the current suburban weighting as "passes tolerance" rather than "exactly on target"
- keep the next pass focused on larger-block behaviour, not new asset creation
- when practical, pair the next scale-up with fresh top-down and angled Blender captures so the improved contract is matched by updated visual evidence

## Conclusion

Session 51 successfully addressed the biggest structural problems from Session 50:

- side streets now feel residential
- cul-de-sac behaviour is meaningful
- frontage and driveway logic are much clearer
- repetition control is noticeably better
- preview instance handling is cleaner

The block now looks ready for cautious scaling, but not for blind scaling. The remaining gaps are mostly about refinement, especially suburban weighting fidelity and stronger visual proof.
