import bpy
import json
import sys
from pathlib import Path
out = Path(r"/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/logs/session176/diag_cube_temp.blend")
print("S176_CUBE_BLEND_START")
sys.stdout.flush()
bpy.ops.mesh.primitive_cube_add(location=(0.0,0.0,0.0))
bpy.ops.wm.save_as_mainfile(filepath=str(out))
print(f"S176_CUBE_BLEND_COMPLETE:{out}")
sys.stdout.flush()
