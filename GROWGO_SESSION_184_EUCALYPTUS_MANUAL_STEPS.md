# GROWGO SESSION 184 — EUCALYPTUS MANUAL STEPS

1. Close the partially failed tree scene and start from a fresh Blender 4.2 LTS file.
2. Open Blender 4.2 LTS manually.
3. Open this script in Blender's `Scripting` workspace:
   `/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/local-blender-scripts/generate_tree_eucalyptus_001.py`
4. Click `Run Script`.
5. Confirm Blender prints the resolved output directory inside the GrowGo repository.
6. Inspect the tree shape, canopy layering, and overall eucalyptus silhouette.
7. Save the file as:
   `/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/TREE_EUCALYPTUS_001_v001.blend`
8. Open this export script:
   `/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory/local-blender-scripts/resume_tree_eucalyptus_001_exports.py`
9. Click `Run Script`.
10. If Blender reports an identity failure again, stop there and return to Codex without renaming anything manually.
11. Wait for the final marker:
   `S184_TREE_EUCALYPTUS_EXPORT_COMPLETE`
12. Return to Codex.

After the manual Blender step finishes, Codex verification command:

```bash
node asset-factory/tree-eucalyptus-post-run-verify.mjs
```
