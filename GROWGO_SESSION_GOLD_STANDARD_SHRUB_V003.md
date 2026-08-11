# GrowGo — First Reviewable Gold Standard Shrub Revision

Date: 2026-08-10
Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`

## Objective

Create the protected review candidate:

- `SHRUB_COASTAL_LOW_001@v003`

using `TREE_EUCALYPTUS_001@v002` as the already-approved Gold Standard visual reference.

## What changed

- created a protected `v003` shrub review candidate without modifying `v001` or `v002`
- generated versioned CLOSE / GAMEPLAY / MAP GLBs
- preserved the historical shrub versions unchanged
- recorded v003 as `PENDING_GOLD_STANDARD_REVIEW`
- added a live Atlas review override so the real GrowGo map can show:
  - `TREE_EUCALYPTUS_001@v002`
  - `SHRUB_COASTAL_LOW_001@v003`
  - optional `SHRUB_COASTAL_LOW_001@v002` comparison

## Visual intent

The v003 candidate specifically targets the earlier shrub weakness:

- more front/back depth
- more layered foliage volume
- stronger side-profile readability
- low spreading shrub identity preserved
- no artificial conversion into a small tree

## Geometry summary

Gameplay candidate:

- mesh count: `10`
- triangle count: `165`
- material count: `4`
- height: `1.469221`
- depth: `2.132429`
- gameplay depth/height ratio: `1.451401`

Gameplay v002 comparison:

- mesh count: `13`
- triangle count: `241`
- material count: `4`
- height: `1.7599999904632568`
- depth: `1.0018776024006844`

Observed result:

- v003 is lower than v002
- v003 is substantially deeper than v002
- the candidate moves in the intended direction for live-map side-profile readability

## Protected historical state

Preserved unchanged:

- `SHRUB_COASTAL_LOW_001@v001`
- `SHRUB_COASTAL_LOW_001@v002`

Gold Standard status remains pending:

- `SHRUB_COASTAL_LOW_001@v003` → `PENDING_GOLD_STANDARD_REVIEW`

## Live review setup

Developer-only live review buttons now support:

- Gold Standard tree v002
- Gold Standard shrub v003
- Gold Standard shrub v002 reference

The review continues to use:

- the corrected Leaflet layer-coordinate anchoring
- the locked shared Atlas renderer
- no automatic runtime activation

## Next stop

Leave the candidate visible on the real GrowGo map and stop for operator review.
