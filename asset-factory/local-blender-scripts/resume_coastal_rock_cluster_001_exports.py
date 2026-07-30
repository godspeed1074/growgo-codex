"""
Manual Blender 4.2 LTS export-resume workflow for COASTAL_ROCK_CLUSTER_001_v001.

Run only after manually inspecting and saving COASTAL_ROCK_CLUSTER_001_v001.blend.
This script uses the universal exporter to prepare deterministic CLOSE,
GAMEPLAY, and MAP GLB exports. It is export-only and does not change catalog
or runtime state.
"""

from __future__ import annotations

import importlib.util
import json
import struct
import sys
from pathlib import Path

import bpy


ASSET_ID = "COASTAL_ROCK_CLUSTER_001"
ASSET_CATEGORY = "nature"
SOURCE_RECIPE_ID = "COASTAL_ROCK_CLUSTER_RECIPE_001"
ASSET_VERSION = "v001"
VERSIONED_ASSET_STEM = f"{ASSET_ID}_{ASSET_VERSION}"
VARIANT_ID = "DEFAULT"
PALETTE_ID = "AU_COASTAL_ROCK_001"
LOD_PROFILE = "NATURE_LIGHTWEIGHT_001"
EXPECTED_BLEND_NAME = f"{VERSIONED_ASSET_STEM}.blend"
DEPENDENCY_IDS = (
    "MOD_ROCK_CLUSTER_CORE_COASTAL_001",
    "MOD_ROCK_CLUSTER_DETAIL_COASTAL_001",
    "MOD_ROCK_CLUSTER_GROUND_SOCKET_COASTAL_001",
)
REPO_ROOT = Path(
    "/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex"
).resolve()
BOOTSTRAP_PATH = (
    REPO_ROOT / "asset-factory" / "local-blender-scripts" / "growgo_blender_bootstrap.py"
).resolve()
bootstrap_spec = importlib.util.spec_from_file_location(
    "growgo_blender_bootstrap", BOOTSTRAP_PATH
)
if bootstrap_spec is None or bootstrap_spec.loader is None:
    raise RuntimeError(f"Could not load GrowGo Blender bootstrap: {BOOTSTRAP_PATH}")
growgo_blender_bootstrap = importlib.util.module_from_spec(bootstrap_spec)
bootstrap_spec.loader.exec_module(growgo_blender_bootstrap)
BOOTSTRAP_STATE = growgo_blender_bootstrap.bootstrap_local_blender_scripts(
    "resume_coastal_rock_cluster_001_exports.py",
    required_helpers=("asset_identity_anchor_v2",),
    explicit_repo_root=REPO_ROOT,
    script_path=BOOTSTRAP_PATH,
)

from asset_identity_anchor_v2 import (
    build_export_object_set,
    find_identity_anchor,
    select_export_object_set,
)
from asset_factory_exporter_v1 import (
    count_export_metrics,
    discover_lod_roots,
    normalize_export_objects,
    validate_export_identity,
    validate_lod_metric_order,
    write_export_manifest,
)


EXPECTED_SOURCE_DIR = (
    REPO_ROOT
    / "asset-factory-workspace"
    / "production"
    / "COASTAL_NATURE_FAMILY_001"
    / "source"
).resolve()
EXPECTED_EXPORT_DIR = (
    REPO_ROOT
    / "asset-factory-workspace"
    / "production"
    / "COASTAL_NATURE_FAMILY_001"
    / "export"
).resolve()
EXPORT_SEQUENCE = (
    ("close", "LOD_CLOSE", f"{ASSET_ID}_LOD_CLOSE.glb", f"{ASSET_ID}_LOD_CLOSE_ROOT"),
    ("gameplay", "LOD_GAMEPLAY", f"{ASSET_ID}_LOD_GAMEPLAY.glb", f"{ASSET_ID}_LOD_GAMEPLAY_ROOT"),
    ("map", "LOD_MAP", f"{ASSET_ID}_LOD_MAP.glb", f"{ASSET_ID}_LOD_MAP_ROOT"),
)
EXPORT_START = "S196_2_COASTAL_ROCK_CLUSTER_EXPORT_START"
EXPORT_COMPLETE = "S196_2_COASTAL_ROCK_CLUSTER_EXPORT_COMPLETE"
EXPORT_FAILURE_PREFIX = "S196_2_COASTAL_ROCK_CLUSTER_EXPORT_FAILURE:"


def fail(message, code):
    print(f"{EXPORT_FAILURE_PREFIX}{code}")
    sys.stdout.flush()
    raise RuntimeError(message)


def ensure_environment():
    if bpy.app.version[:2] != (4, 2):
        fail(f"Expected Blender 4.2.x, found {bpy.app.version!r}.", "VERSION")
    filepath = Path(bpy.data.filepath) if bpy.data.filepath else None
    if filepath is None or filepath.name != EXPECTED_BLEND_NAME or not filepath.exists():
        fail(f"Expected open saved blend {EXPECTED_BLEND_NAME}.", "BLEND")
    try:
        EXPECTED_SOURCE_DIR.relative_to(REPO_ROOT)
        EXPECTED_EXPORT_DIR.relative_to(REPO_ROOT)
    except ValueError:
        fail("Asset directories are outside GrowGo.", "DIRECTORY")
    EXPECTED_EXPORT_DIR.mkdir(parents=True, exist_ok=True)


def iter_identity_strings():
    for datablocks in (
        bpy.data.collections,
        bpy.data.objects,
        bpy.data.materials,
        bpy.data.meshes,
    ):
        for datablock in datablocks:
            yield datablock.name
            for key in datablock.keys():
                value = datablock[key]
                if isinstance(value, str):
                    yield value


def ensure_identity_contract():
    strings = list(iter_identity_strings())
    if not any(ASSET_ID in value for value in strings):
        fail("Asset identity was missing.", "ASSET_IDENTITY")
    if not any(SOURCE_RECIPE_ID in value for value in strings):
        fail("Recipe identity was missing.", "RECIPE_IDENTITY")
    for dependency_id in DEPENDENCY_IDS:
        if not any(dependency_id in value for value in strings):
            fail(f"Dependency identity was missing: {dependency_id}", "DEPENDENCY_IDENTITY")
    for _key, lod_label, _filename, root_name in EXPORT_SEQUENCE:
        root = bpy.data.objects.get(root_name)
        if root is None or find_identity_anchor(root, ASSET_ID, lod_label) is None:
            fail(f"Identity anchor was missing for {lod_label}.", f"{lod_label}_ANCHOR")
        export_set = build_export_object_set(root, ASSET_ID, lod_label)
        validate_export_identity(
            export_set,
            asset_id=ASSET_ID,
            recipe_id=SOURCE_RECIPE_ID,
            dependency_ids=DEPENDENCY_IDS,
            lod_label=lod_label,
            anchor_finder=find_identity_anchor,
            root_object=root,
        )


def count_scene_metrics(root, lod_label):
    export_set = build_export_object_set(root, ASSET_ID, lod_label)
    objects = normalize_export_objects(export_set)
    metrics = count_export_metrics(objects)
    if (
        metrics["meshCount"] <= 0
        or metrics["triangleCount"] <= 0
        or metrics["materialCount"] <= 0
    ):
        fail(f"{lod_label} was not export-ready.", f"{lod_label}_PREFLIGHT")
    return metrics


def parse_glb_json(filepath):
    data = filepath.read_bytes()
    if len(data) < 20 or data[:4] != b"glTF":
        fail(f"Invalid GLB: {filepath.name}", "GLB_INVALID")
    json_length = struct.unpack_from("<I", data, 12)[0]
    if data[16:20] != b"JSON":
        fail(f"Missing GLB JSON chunk: {filepath.name}", "GLB_JSON")
    return json.loads(data[20 : 20 + json_length].decode("utf-8").rstrip(" \t\r\n\x00"))


def validate_glb(filepath, lod_label):
    payload = parse_glb_json(filepath)
    blob = json.dumps(payload, sort_keys=True)
    expected_anchor = f"{ASSET_ID}_{lod_label}_IDENTITY_ANCHOR"
    if ASSET_ID not in blob or SOURCE_RECIPE_ID not in blob:
        fail(f"GLB identity was incomplete: {filepath.name}", "GLB_IDENTITY")
    if expected_anchor not in blob:
        fail(f"GLB anchor was missing: {expected_anchor}", "GLB_ANCHOR")
    if not all(dependency_id in blob for dependency_id in DEPENDENCY_IDS):
        fail(f"GLB dependency identity was incomplete: {filepath.name}", "GLB_DEPENDENCY")
    if any(
        uri
        for buffer in payload.get("buffers", [])
        if (uri := buffer.get("uri")) and not uri.startswith("data:")
    ):
        fail(f"GLB contained external dependencies: {filepath.name}", "GLB_EXTERNAL")


def export_lod(lod_label, filename, root_name):
    root = discover_lod_roots(bpy.data.objects, ASSET_ID)[lod_label]
    metrics = count_scene_metrics(root, lod_label)
    select_export_object_set(root, ASSET_ID, lod_label)
    final_path = EXPECTED_EXPORT_DIR / filename
    temp_path = final_path.with_name(f"{final_path.stem}.tmp{final_path.suffix}")
    if temp_path.exists():
        temp_path.unlink()
    export_kwargs = {
        "filepath": str(temp_path),
        "export_format": "GLB",
        "use_selection": True,
        "export_apply": True,
        "export_materials": "EXPORT",
        "export_texcoords": False,
        "export_normals": True,
        "export_tangents": False,
        "export_cameras": False,
        "export_lights": False,
        "export_animations": False,
        "export_extras": True,
    }
    optional_export_kwargs = {"export_colors": False}
    supported = set(bpy.ops.export_scene.gltf.get_rna_type().properties.keys())
    for key, value in optional_export_kwargs.items():
        if key in supported:
            export_kwargs[key] = value
    bpy.ops.export_scene.gltf(**export_kwargs)
    validate_glb(temp_path, lod_label)
    temp_path.replace(final_path)
    return metrics


def main():
    print(EXPORT_START)
    ensure_environment()
    ensure_identity_contract()
    metrics = {
        key: export_lod(lod_label, filename, root_name)
        for key, lod_label, filename, root_name in EXPORT_SEQUENCE
    }
    try:
        validate_lod_metric_order(metrics)
    except RuntimeError as error:
        fail(str(error), "LOD_COMPLEXITY")
    manifest_outputs = {}
    for lod_key, _lod_label, filename, _root_name in EXPORT_SEQUENCE:
        final_path = EXPECTED_EXPORT_DIR / filename
        manifest_outputs[lod_key] = {
            **metrics[lod_key],
            "filename": filename,
            "sizeBytes": final_path.stat().st_size,
        }
    write_export_manifest(
        EXPECTED_EXPORT_DIR / "coastal-rock-cluster-export-manifest.json",
        asset_id=ASSET_ID,
        recipe_id=SOURCE_RECIPE_ID,
        version=ASSET_VERSION,
        dependency_ids=DEPENDENCY_IDS,
        outputs=manifest_outputs,
    )
    print(EXPORT_COMPLETE)


if __name__ == "__main__":
    main()
