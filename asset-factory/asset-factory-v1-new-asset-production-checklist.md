# Asset Factory v1 New Asset Production Checklist

Date: 2026-07-29  
Status: Permanent operational checklist

## Checklist

1. Asset request
   Confirm the requested asset, use case, expected world placement, and whether it is a brand-new asset or a revision.
2. Family assignment
   Assign the asset to an existing production family or create a new family specification phase before authoring.
3. Asset ID creation
   Create a permanent asset ID using the Asset Factory naming convention.
4. Recipe ID creation
   Create or reserve the recipe ID that will bind the asset to world usage.
5. Specification
   Define identity, dependencies, palette, expected LODs, biome/theme, and approval criteria.
6. Authoring setup
   Create the deterministic Blender generator, export-resume workflow, setup records, and authoring manifests.
7. Blender generation
   Run the manual Blender authoring pass and save the source blend in the approved family location.
8. Source verification
   Record source blend presence, path, size, hash, and version identity.
9. Universal export
   Run the universal exporter to create CLOSE, GAMEPLAY, and MAP GLBs plus an export manifest.
10. GLB validation
    Verify identity, dependencies, anchors, metadata, no external dependencies, and descending LOD complexity.
11. Visual review
    Prepare evidence and complete manual Blender or approved human review before approval.
12. Registration
    Register only the validated and visually approved revision into the development catalog.
13. Promotion
    Promote the revision only after preserving rollback history and protected prior revisions.

## PASS/FAIL Gates

- PASS when every step above has an explicit record in the asset workspace.
- PASS when source, export, validation, visual review, registration, and promotion evidence all agree on asset ID and version.
- FAIL when a required record is missing or any identity contract diverges.
- FAIL when a protected historical revision would be overwritten.
- FAIL when publish or runtime activation would be required to continue.
