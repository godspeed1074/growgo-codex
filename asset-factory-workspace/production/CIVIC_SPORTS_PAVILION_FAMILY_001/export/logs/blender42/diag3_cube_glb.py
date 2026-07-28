import bpy
import sys
from pathlib import Path
print("S175_DIAG3_MARKER_START")
sys.stdout.flush()
out = Path(r"/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/logs/blender42/s175_diag3_temp.glb")
bpy.ops.mesh.primitive_cube_add(location=(0.0,0.0,0.0))
obj=bpy.context.active_object
bpy.ops.object.select_all(action="DESELECT")
obj.select_set(True)
bpy.context.view_layer.objects.active=obj
bpy.ops.export_scene.gltf(filepath=str(out), use_selection=True, export_format="GLB")
print(f"S175_DIAG3_MARKER_GLB_SAVED:{out}")
sys.stdout.flush()
print("S175_DIAG3_MARKER_COMPLETE")
sys.stdout.flush()
