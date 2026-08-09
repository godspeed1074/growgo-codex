# GrowGo Atlas Phase 212.69 — Asset Factory Dry-Run Execution Contract

Status: PASS

Branch:
- `feature/atlas-phase-211-6-gated-map-attachment-controller`

ELI5:
- Atlas already knew how to validate a future Asset Factory job on paper.
- This phase proves that the validated job can walk the whole handoff chain on paper too.
- It resolves the bundle, job ticket, batch, build recipe, export contract, and expected output filename without launching Blender, generating files, or turning rendering on.

What this phase adds:

- a developer-only dry-run execution contract
- deterministic dry-run execution IDs
- deterministic expected output identity
- dependency validation across the batch/build seam
- planning-only proof that the full Asset Factory handoff chain is connected

New developer-only module:

- `client/developer-only-atlas-asset-factory-dry-run-execution-contract.mjs`

New focused test:

- `tests/client-developer-only-atlas-asset-factory-dry-run-execution-contract.test.mjs`

Dry-run flow:

- Atlas validated placement
- production bundle
- job ticket
- production batch
- dependency validation
- build recipe resolution
- export contract resolution
- expected output identity

Dry-run diagnostics exposed:

- `dryRunExecutionId`
- `selectedJobTicketId`
- `selectedProductionBatchId`
- `resolvedBuildRecipeId`
- `resolvedExportContractId`
- `expectedAssetId`
- `expectedOutputFilename`
- `dependencyValidationStatus`
- `dryRunStatus`
- `dryRunReason`

Safety proof:

- DO NOT launch Blender
- DO NOT generate GLB files
- DO NOT create or modify asset source files
- DO NOT activate renderer
- DO NOT add startup execution
- DO NOT alter canonical safety flags

Preserved canonical safety flags:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Fail-closed proof:

- missing dependencies block the dry run
- invalid manifests block the dry run
- export contract mismatch blocks the dry run
- dependency count drift blocks the dry run

Non-goals preserved:

- no subprocess execution
- no filesystem generation
- no Blender invocation
- no runtime renderer activation
- no automatic background behavior
