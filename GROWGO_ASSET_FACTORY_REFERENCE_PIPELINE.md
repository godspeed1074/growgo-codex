# GROWGO ASSET FACTORY REFERENCE PIPELINE

Date:
Wednesday, July 29, 2026

Reference assets:

- `BUILDING_CIVIC_SPORTS_PAVILION_001`
- `TREE_EUCALYPTUS_001`

## Purpose

This document defines the permanent reference workflow for future GrowGo Asset Factory assets.

It standardises the path from concept to approved local Asset Factory asset using the proven reference flow established by:

- the civic sports pavilion production pipeline
- the eucalyptus tree production pipeline

This is a reference process only.

It does not:

- create assets
- publish assets
- activate renderer systems
- attach assets to the map
- change Atlas truth

## Reference Lifecycle

Concept
↓
Recipe Definition
↓
Asset Identity Contract
↓
Blender Authoring
↓
Identity Anchor Creation
↓
Deterministic LOD Export
↓
GLB Validation
↓
Registration
↓
Development Catalog
↓
Manual Visual Review
↓
Approval

## Stage Definitions

### 1. Concept

The asset begins as a defined Asset Factory need linked to Atlas recipe demand.

Required at this stage:

- intended asset purpose
- target asset category
- target recipe relationship
- intended world usage
- performance expectations

### 2. Recipe Definition

Every asset must map to a deterministic recipe.

Required:

- `recipeId`
- target Atlas compatibility
- allowed usage context
- expected visual role

The recipe defines visual intent only.
It must not change real-world object truth.

### 3. Asset Identity Contract

Every asset must adopt the permanent identity contract before authoring or export.

Required contract fields:

- `assetId`
- `recipeId`
- `version`
- `variantId`
- `paletteId`
- `lodProfile`
- `dependencies`
- `identity anchor`

Recommended identity metadata set:

- `category`
- `source`
- `identityPolicy`

Identity must remain deterministic across:

- Blender source
- object names
- mesh names
- material names
- collection names
- identity anchor metadata
- exported GLB validation

### 4. Blender Authoring

Authoring must happen inside the standard GrowGo Blender workflow.

Requirements:

- use the bootstrap loader
- load shared helpers through the bootstrap path
- preserve identity contract metadata
- avoid ad hoc local import tricks
- use deterministic naming and structure

The Blender authoring scene must be structured so export does not rely on manual hidden state.

### 5. Identity Anchor Creation

Every exportable asset must contain an explicit identity anchor.

Identity anchor requirements:

- lightweight
- export-safe
- included in the export set
- carries identity metadata
- tied to the asset contract

The identity anchor is the durable export identity bridge.
It prevents future validation failures caused by Blender dropping empty roots or weak naming-only identity.

### 6. Deterministic LOD Export

LOD export must be deterministic and repeatable.

Required LODs for production-ready proof assets:

- `LOD_CLOSE`
- `LOD_GAMEPLAY`
- `LOD_MAP`

LOD export rules:

- one LOD at a time
- deterministic export selection
- correct LOD root included
- identity anchor included
- dependencies included only if valid for that asset
- export arguments must remain Blender-version compatible

No export may depend on random ordering, editor state, or hidden scene assumptions.

### 7. GLB Validation

Every exported GLB must pass validation before it can move forward.

Validation must confirm:

- asset identity preserved
- recipe identity preserved
- identity anchor preserved
- dependency identity preserved where applicable
- mesh count
- material count
- triangle count
- primitive count
- no external dependencies
- sensible LOD progression
- deterministic hashes

Validation failure blocks registration.

### 8. Registration

Every validated asset must receive a registration record.

Required registration content:

- `assetId`
- `recipeId`
- `version`
- `variantId`
- `paletteId`
- source blend reference
- LOD references
- GLB hashes
- dependency references
- validation state
- deterministic fingerprint

Registration is the formal local Asset Factory record that the asset exists as a validated asset.

### 9. Development Catalog

After registration, the asset may enter the development catalog only.

Development catalog requirements:

- environment is development-only
- beta blocked
- production blocked
- runtime activation disabled
- map attachment disabled
- automatic publishing disabled

The development catalog is for inspection and future preview tooling, not live game use.

### 10. Manual Visual Review

Every asset must receive a manual visual review record.

Required:

- explicit review criteria
- supported states:
  - `PASS`
  - `FAIL`
  - `NEEDS_REVISION`
  - `NOT_REVIEWED`
- explicit evidence before `PASS`

Manual visual review exists because structural validation cannot fully prove:

- style fit
- category identity
- readability
- world suitability

### 11. Approval

Only after validation and visual review completion may the asset move to approval.

Approval requirements:

- validated outputs
- registration record
- development catalog record
- visual review record
- preserved asset identity
- preserved hashes

Approval does not imply publishing.

## Permanent Future Asset Requirements

Every future Asset Factory asset must have:

- `assetId`
- `recipeId`
- `version`
- `variantId`
- `paletteId`
- `lodProfile`
- `dependencies`
- `identity anchor`
- `validation record`
- `registration record`
- `visual review record`

Assets should also carry:

- category
- source metadata
- deterministic fingerprint
- Atlas compatibility summary

## Blender Workflow Requirements

All future GrowGo Blender authoring scripts must follow these rules:

- bootstrap loader required
- shared helper loading required
- export-safe identity anchors required
- deterministic export selection required
- Blender version compatibility checks required

Detailed expectations:

### Bootstrap loader

Every manual Blender script must use the shared bootstrap loader so helper imports resolve safely in Blender’s scripting environment.

### Shared helper loading

Shared helpers must be imported through the standard local script path, not through assumptions about Blender’s working directory.

### Export-safe identity anchors

Identity anchors must be exportable and must survive GLB generation.
Do not rely on empty nodes alone.

### Deterministic export selection

The export set must explicitly include:

- correct LOD root
- required children
- identity anchor
- valid dependency objects

### Blender version compatibility checks

Scripts must validate supported Blender versions and export arguments before export execution.

## Supported Asset Categories

This reference pipeline applies to:

- buildings
- nature
- railway
- vehicles
- props
- terrain

Category-specific geometry or review details may differ, but the identity, export, validation, registration, and review pipeline remains the same.

## Reference Asset Lessons

### Pavilion lesson

`BUILDING_CIVIC_SPORTS_PAVILION_001` proved the importance of:

- strict output verification
- controlled manual Blender steps when automation is unsafe
- registration and review records separated from publishing

### Eucalyptus lesson

`TREE_EUCALYPTUS_001` proved the importance of:

- absolute repository output paths
- shared bootstrap loading
- identity contract v2 adoption
- export-safe identity anchors
- dependency-aware validation
- development catalog plus manual visual review before approval

## Future Asset Checklist

Use this checklist for every future asset:

1. Define the concept and recipe.
2. Create the asset identity contract.
3. Confirm `assetId`, `recipeId`, `version`, `variantId`, `paletteId`, and `lodProfile`.
4. Declare dependencies explicitly.
5. Build the Blender authoring script with bootstrap support.
6. Create identity anchors for every exported LOD.
7. Export `LOD_CLOSE`, `LOD_GAMEPLAY`, and `LOD_MAP` deterministically.
8. Validate all exported GLBs.
9. Write the validation record.
10. Write the registration record.
11. Add the asset to the development catalog with blocked publishing states.
12. Complete manual visual review with explicit evidence.
13. Approve only after validation and review are complete.

## Non-Negotiable Safety Rules

Future assets must not:

- bypass the identity contract
- skip identity anchors
- skip GLB validation
- skip registration
- skip manual visual review
- publish from development records alone
- attach automatically to the renderer
- attach automatically to the map
- change Atlas truth

## Reference Standard Outcome

An asset is considered reference-pipeline complete when it has:

- deterministic Blender authoring inputs
- export-safe identity preservation
- validated GLB outputs
- registration record
- development catalog record
- completed manual visual review
- approval readiness

This is the permanent baseline for future GrowGo Asset Factory asset production.
