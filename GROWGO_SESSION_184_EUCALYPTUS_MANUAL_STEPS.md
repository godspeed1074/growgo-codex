# GROWGO SESSION 184 — EUCALYPTUS MANUAL STEPS

1. Open Blender 4.2 LTS manually.
2. Open this script in Blender's `Scripting` workspace:
   `/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/local-blender-scripts/generate_tree_eucalyptus_001.py`
3. Click `Run Script`.
4. Inspect the tree shape, canopy layering, and overall eucalyptus silhouette.
5. Save the file as:
   `/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/TREE_EUCALYPTUS_001_v001.blend`
6. Open this export script:
   `/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/local-blender-scripts/resume_tree_eucalyptus_001_exports.py`
7. Click `Run Script`.
8. Wait for the final marker:
   `S184_TREE_EUCALYPTUS_EXPORT_COMPLETE`
9. Return to Codex.

After the manual Blender step finishes, Codex verification command:

```bash
node asset-factory/tree-eucalyptus-post-run-verify.mjs
```
