import bpy
import sys
from pathlib import Path
print("S174_DIAG2_MARKER_START")
sys.stdout.flush()
out=Path(bpy.app.tempdir) / "s174_diag2_temp.blend"
bpy.ops.mesh.primitive_cube_add(location=(0.0,0.0,0.0))
print("S174_DIAG2_MARKER_CUBE_CREATED")
sys.stdout.flush()
bpy.ops.wm.save_as_mainfile(filepath=str(out))
print(f"S174_DIAG2_MARKER_BLEND_SAVED:{out}")
sys.stdout.flush()
print("S174_DIAG2_MARKER_COMPLETE")
sys.stdout.flush()
