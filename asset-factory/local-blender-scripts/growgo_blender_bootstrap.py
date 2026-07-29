"""
Shared bootstrap helper for manual GrowGo Blender scripts.

Manual execution from Blender's Text Editor does not reliably populate
filesystem-backed import paths, so shared helpers must be made importable
explicitly before standard imports run.
"""

from __future__ import annotations

import importlib.util
import os
import sys
from pathlib import Path


DEFAULT_REPO_ROOT = Path(
    "/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex"
).resolve()
LOCAL_BLENDER_SCRIPTS_RELATIVE = Path("asset-factory") / "local-blender-scripts"


class GrowgoBlenderBootstrapError(RuntimeError):
    pass


def _path_is_repo_root(path: Path) -> bool:
    return (path / LOCAL_BLENDER_SCRIPTS_RELATIVE).is_dir()


def _iter_candidate_roots(explicit_repo_root=None, script_path=None, current_blend_path=None, cwd=None):
    seen = set()

    def add(candidate):
        if candidate is None:
            return
        path = Path(candidate).resolve()
        key = str(path)
        if key in seen:
            return
        seen.add(key)
        yield path

    yield from add(explicit_repo_root)
    yield from add(os.environ.get("GROWGO_REPO_ROOT"))
    yield from add(DEFAULT_REPO_ROOT)

    for source in (script_path, current_blend_path, cwd, Path.cwd()):
        if source is None:
            continue
        try:
            source_path = Path(source).resolve()
        except Exception:
            continue
        parents = [source_path] if source_path.is_dir() else [source_path.parent]
        for parent in parents:
            for candidate in [parent, *parent.parents]:
                yield from add(candidate)


def locate_repo_root(explicit_repo_root=None, script_path=None, current_blend_path=None, cwd=None):
    for candidate in _iter_candidate_roots(
        explicit_repo_root=explicit_repo_root,
        script_path=script_path,
        current_blend_path=current_blend_path,
        cwd=cwd,
    ):
        if _path_is_repo_root(candidate):
            return candidate

    raise GrowgoBlenderBootstrapError(
        "Could not locate the GrowGo repository root containing "
        f"'{LOCAL_BLENDER_SCRIPTS_RELATIVE.as_posix()}'."
    )


def locate_local_blender_scripts_dir(explicit_repo_root=None, script_path=None, current_blend_path=None, cwd=None):
    repo_root = locate_repo_root(
        explicit_repo_root=explicit_repo_root,
        script_path=script_path,
        current_blend_path=current_blend_path,
        cwd=cwd,
    )
    scripts_dir = (repo_root / LOCAL_BLENDER_SCRIPTS_RELATIVE).resolve()
    if not scripts_dir.is_dir():
        raise GrowgoBlenderBootstrapError(
            f"Local Blender scripts directory was missing: {scripts_dir}"
        )
    return repo_root, scripts_dir


def ensure_helper_modules_available(required_helpers=(), scripts_dir=None):
    scripts_path = Path(scripts_dir).resolve()
    loaded_helpers = []
    for helper_name in required_helpers:
        helper_file = scripts_path / f"{helper_name}.py"
        if not helper_file.is_file():
            raise GrowgoBlenderBootstrapError(
                f"Required helper '{helper_name}' was missing at {helper_file}"
            )
        spec = importlib.util.find_spec(helper_name)
        if spec is None:
            raise GrowgoBlenderBootstrapError(
                f"Required helper '{helper_name}' could not be imported from {scripts_path}"
            )
        loaded_helpers.append(helper_name)
    return loaded_helpers


def bootstrap_local_blender_scripts(
    script_label,
    *,
    required_helpers=(),
    explicit_repo_root=None,
    script_path=None,
    current_blend_path=None,
    cwd=None,
):
    repo_root, scripts_dir = locate_local_blender_scripts_dir(
        explicit_repo_root=explicit_repo_root,
        script_path=script_path,
        current_blend_path=current_blend_path,
        cwd=cwd,
    )

    scripts_dir_string = str(scripts_dir)
    if scripts_dir_string not in sys.path:
        sys.path.insert(0, scripts_dir_string)

    loaded_helpers = ensure_helper_modules_available(
        required_helpers=required_helpers,
        scripts_dir=scripts_dir,
    )

    return {
        "scriptLabel": script_label,
        "repoRoot": str(repo_root),
        "scriptsDir": str(scripts_dir),
        "requiredHelpers": list(required_helpers),
        "loadedHelpers": loaded_helpers,
    }
