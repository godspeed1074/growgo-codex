import bpy
import sys
from pathlib import Path
out = Path(r"/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/logs/session176/diag_cube_temp.glb")
print("S176_CUBE_GLB_START")
sys.stdout.flush()
bpy.ops.mesh.primitive_cube_add(location=(0.0,0.0,0.0))
obj = bpy.context.active_object
bpy.ops.object.select_all(action="DESELECT")
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bpy.ops.export_scene.gltf(filepath=str(out), use_selection=True, export_format="GLB")
print(f"S176_CUBE_GLB_COMPLETE:{out}")
sys.stdout.flush()
