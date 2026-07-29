# Asset Factory v1 Codex Workflow Instructions

Date: 2026-07-29  
Status: Permanent operational guidance

## What Codex Should Do Automatically

- Create or update asset specifications, setup records, manifests, validation records, and session closeout notes.
- Prepare deterministic Blender generator and export-resume script changes.
- Verify source files, manifests, hashes, export outputs, and version-state records.
- Run focused regression and validation tests for the in-scope asset.
- Prepare registration, development catalog, and promotion records only after the required evidence exists.

## What Requires Manual Blender Review

- Any visual judgment about silhouette, profile strength, flower readability, palette balance, or papercut 2.5D quality.
- Any confirmation that a candidate revision is visually approved.
- Any review of side, 45-degree, or close-read artistic quality.

## What Requires Human Approval

- Final visual approval for a candidate revision.
- Any decision to accept a revision that changes visible geometry or material presentation.
- Any decision to replace the active development revision when risks or tradeoffs are still open.

## When Commits Should Happen

- After a stable specification/setup phase with passing focused tests.
- After a successful source verification and export validation checkpoint.
- After registration state is correct and regression tests pass.
- After promotion state is correct and regression tests pass.

## When Not To Commit Yet

- When manual visual review is still pending.
- When export validation has not completed.
- When a revision has unresolved blockers or failing tests.
