"""
Wrapper script for TOWN_LAYOUT_001_PREVIEW_SCENE_001.
Delegates to the canonical town preview Blender script.
"""

from pathlib import Path
import runpy

SCRIPT_PATH = Path(__file__).resolve().parents[3] / "asset-factory/local-blender-scripts/generate_town_layout_preview_scene.py"
runpy.run_path(str(SCRIPT_PATH), run_name="__main__")
