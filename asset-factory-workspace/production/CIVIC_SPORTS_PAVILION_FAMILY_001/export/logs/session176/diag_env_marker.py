import json
import os
import sys
from pathlib import Path
LOG_DIR = Path(r"/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/logs/session176")
ENV_OUT = LOG_DIR / "blender_env_snapshot.json"
MARKER_OUT = LOG_DIR / "blender_marker_status.json"
keys = [
    "PATH", "HOME", "TMPDIR", "DISPLAY", "DYLD_LIBRARY_PATH", "DYLD_FRAMEWORK_PATH",
    "PYTHONPATH", "PYTHONHOME", "BLENDER_USER_CONFIG", "BLENDER_USER_SCRIPTS",
    "BLENDER_SYSTEM_SCRIPTS", "OCIO", "OIIO", "METAL_DEVICE_WRAPPER_TYPE",
    "MTL_CAPTURE_ENABLED", "PWD", "LANG", "USER"
]
LOG_DIR.mkdir(parents=True, exist_ok=True)
payload = {k: os.environ.get(k) for k in keys}
payload["cwd"] = os.getcwd()
ENV_OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf8")
print("S176_TRIVIAL_MARKER_START")
sys.stdout.flush()
MARKER_OUT.write_text(json.dumps({"marker": "S176_TRIVIAL_MARKER_COMPLETE"}, indent=2) + "\n", encoding="utf8")
print("S176_TRIVIAL_MARKER_COMPLETE")
sys.stdout.flush()
