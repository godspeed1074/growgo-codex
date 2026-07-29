# GROWGO BLENDER SCRIPT BOOTSTRAP STANDARD

## Why Manual Blender Imports Fail

Manual execution from Blender's Text Editor does not reliably behave like normal
Python file execution.

Common failure modes:

- `__file__` is absent or unreliable
- Blender's working directory is not the repository
- shared helper modules are not on `sys.path`
- direct `from helper import ...` imports fail even though the helper file exists

For GrowGo Asset Factory scripts, that means a manual generator can open fine in
Blender and still fail with:

- `ModuleNotFoundError`

## Required Standard

Manual Asset Factory Blender scripts must bootstrap shared imports before they
import helper modules.

The standard helper is:

- `asset-factory/local-blender-scripts/growgo_blender_bootstrap.py`

## Required Header Pattern

Future Blender scripts should follow this pattern near the top of the file:

```python
import importlib.util
from pathlib import Path

REPO_ROOT = Path("/absolute/path/to/growgo-codex").resolve()
BOOTSTRAP_PATH = (
    REPO_ROOT / "asset-factory" / "local-blender-scripts" / "growgo_blender_bootstrap.py"
).resolve()

bootstrap_spec = importlib.util.spec_from_file_location(
    "growgo_blender_bootstrap", BOOTSTRAP_PATH
)
growgo_blender_bootstrap = importlib.util.module_from_spec(bootstrap_spec)
bootstrap_spec.loader.exec_module(growgo_blender_bootstrap)
BOOTSTRAP_STATE = growgo_blender_bootstrap.bootstrap_local_blender_scripts(
    "your_script_name.py",
    required_helpers=("shared_helper_name",),
    explicit_repo_root=REPO_ROOT,
    script_path=BOOTSTRAP_PATH,
)
```

Only after that should the script import shared helpers.

## Bootstrap Responsibilities

The bootstrap helper must:

- locate the GrowGo repository root safely
- locate `asset-factory/local-blender-scripts`
- add that folder to `sys.path`
- validate that required helper modules exist
- provide clear, direct errors when anything is missing

## Future Asset Usage

This standard is intended for future manual Blender scripts across:

- trees
- buildings
- vehicles
- railway assets
- props
- terrain assets

## Safety

The bootstrap layer is import and path handling only.

It does not:

- launch Blender
- regenerate assets
- publish assets
- activate renderer systems
- attach assets to the map
- alter verified pavilion production records
