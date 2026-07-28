# GROWGO SESSION 178 — PAVILION REGISTRATION AND RECORD FINALISATION

Date: July 28, 2026
Branch: `feature/growgo-asset-factory-town-expansion`

## Outcome

`BUILDING_CIVIC_SPORTS_PAVILION_001` has been finalised as a verified Asset Factory production asset and registered locally without being published.

The final verified outputs used for registration were:

- `BUILDING_CIVIC_SPORTS_PAVILION_001_v001.blend`
- `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb`
- `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb`
- `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_MAP.glb`

## Files Changed

Production records:

- `asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/building-civic-sports-pavilion-manifest.json`
- `asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/building-civic-sports-pavilion-metadata.json`
- `asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/building-civic-sports-pavilion-validation.json`
- `asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/building-civic-sports-pavilion-registration.json`

Implementation:

- `asset-factory/building-civic-sports-pavilion-production-run.mjs`
- `asset-factory/building-civic-sports-pavilion-registration.mjs`
- `asset-factory/building-civic-sports-pavilion-register.mjs`

Tests:

- `tests/asset-factory-building-civic-sports-pavilion-production-run.test.mjs`
- `tests/asset-factory-building-civic-sports-pavilion-registration.test.mjs`

## Records Updated

The verification update command was run successfully:

```text
node asset-factory/building-civic-sports-pavilion-post-run-verify.mjs --update-records
```

The registration write completed successfully:

```text
node asset-factory/building-civic-sports-pavilion-register.mjs
```

The final records now preserve:

- permanent asset ID: `BUILDING_CIVIC_SPORTS_PAVILION_001`
- recipe ID: `SPORTS_FACILITY_RECIPE_001`
- version: `1.0.0`
- source blend reference
- verified LOD hashes
- mesh, material, primitive, and triangle counts
- validation-ready state
- non-published lifecycle state

## Verified Final Record Truth

Manifest:

- version: `1.0.0`
- close hash: `ee921ba10750ce0237f0ed13481145cbc383903afbbb61b1ca57e5695b4ddc06`
- gameplay hash: `e941dba8229c8d6158d132c6a1a5bcb241ea5ebb94ad702c63f9f12062dc0637`
- map hash: `38208a153ef605fcea6a8f17fd38d16702259fc698c3bcc83a7a05cfb5982ab1`

Metadata:

- validation status: `VERIFIED_FINAL_OUTPUTS_READY_FOR_REGISTRATION`

Validation:

- `registrationReady: true`
- `missingOutputs: []`
- `finalGlbVerificationPassed: true`
- `noExternalDependencies: true`

Registration:

- `registrationStatus: "registered"`
- `validationStatus: "validated"`
- `publishStatus: "not_published"`
- `readyForApproval: true`
- `readyForPublishing: false`

## Registry Result

The pavilion matches the existing Asset Factory civic registry entry:

- asset family: `SPORTS_FACILITY_ASSET_FAMILY_001`
- asset type: `SPORTS_PAVILION`
- recipe: `SPORTS_FACILITY_RECIPE_001`

Registration was finalised as a production record tied to that existing registry identity. No publishing, release, or renderer-facing state was activated.

## Tests Passed

Focused tests run:

```text
node --test tests/asset-factory-building-civic-sports-pavilion-production-run.test.mjs tests/asset-factory-building-civic-sports-pavilion-registration.test.mjs
```

Result:

- 15 tests passed
- 0 tests failed

Coverage included:

- updated records
- manifest consistency
- validation consistency
- registry-backed registration record
- preserved hashes
- preserved asset and recipe IDs
- no publishing side effects

## Lifecycle Status

Current local lifecycle state for `BUILDING_CIVIC_SPORTS_PAVILION_001`:

- verified production outputs: complete
- registered in local Asset Factory records: yes
- validated: yes
- ready for approval: yes
- published: no

## Important Note

A leftover temporary file still exists beside the final exports:

- `BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_CLOSE.glb.tmp.glb`

It was not used for final registration and was not modified during this session.

## Final Confirmation

`BUILDING_CIVIC_SPORTS_PAVILION_001` is ready for approval.

It was **not** published.
