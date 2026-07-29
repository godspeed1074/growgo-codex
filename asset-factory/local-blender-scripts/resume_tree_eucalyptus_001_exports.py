"""
Manual Blender-internal export resume script for TREE_EUCALYPTUS_001.

This script is intended to be run by a human from Blender 4.2 LTS after
opening the final saved tree blend file. It does not regenerate the tree. It
exports the three approved LOD roots one at a time, validates each temporary
GLB, and finalizes each export only after validation passes.
"""

from __future__ import annotations

import json
import struct
import sys
from hashlib import sha256
from pathlib import Path

import bpy


ASSET_ID = "TREE_EUCALYPTUS_001"
SOURCE_RECIPE_ID = "TREE_EUCALYPTUS_RECIPE_001"
EXPECTED_BLEND_NAME = f"{ASSET_ID}_v001.blend"
EXPECTED_OUTPUT_DIR = Path(
    "/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export"
)

EXPORT_START_MARKER = "S184_TREE_EUCALYPTUS_EXPORT_START"
EXPORT_COMPLETE_MARKER = "S184_TREE_EUCALYPTUS_EXPORT_COMPLETE"
EXPORT_SKIP_PREFIX = "S184_TREE_EUCALYPTUS_EXPORT_SKIP:"
EXPORT_FAILURE_PREFIX = "S184_TREE_EUCALYPTUS_EXPORT_FAILURE:"
ASSET_GUARD_MARKER = "S184_TREE_EUCALYPTUS_ASSET_GUARD_OK"
RECIPE_GUARD_MARKER = "S184_TREE_EUCALYPTUS_RECIPE_GUARD_OK"
VERSION_GUARD_MARKER = "S184_TREE_EUCALYPTUS_VERSION_GUARD_OK"

EXPORT_SEQUENCE = (
    ("close", "LOD_CLOSE", f"{ASSET_ID}_LOD_CLOSE.glb", f"{ASSET_ID}_CLOSE_ROOT"),
    ("gameplay", "LOD_GAMEPLAY", f"{ASSET_ID}_LOD_GAMEPLAY.glb", f"{ASSET_ID}_GAMEPLAY_ROOT"),
    ("map", "LOD_MAP", f"{ASSET_ID}_LOD_MAP.glb", f"{ASSET_ID}_MAP_ROOT"),
)


def emit_marker(marker):
    print(marker)
    sys.stdout.flush()


def fail(message, marker=None):
    if marker is not None:
        emit_marker(marker)
    raise RuntimeError(message)


def ensure_blender_version():
    version = bpy.app.version
    if version[:2] != (4, 2):
        fail(
            f"Expected Blender 4.2.x for eucalyptus export resume, found {version!r}.",
            f"{EXPORT_FAILURE_PREFIX}VERSION_INCOMPATIBLE",
        )
    emit_marker(VERSION_GUARD_MARKER)


def find_open_blend_path():
    filepath = Path(bpy.data.filepath) if bpy.data.filepath else None
    if filepath is None or not str(filepath).strip():
        fail(
            "The eucalyptus blend must be opened before running the resume script.",
            f"{EXPORT_FAILURE_PREFIX}BLEND_NOT_OPEN",
        )
    if filepath.name != EXPECTED_BLEND_NAME:
        fail(
            f"Expected open blend '{EXPECTED_BLEND_NAME}', found '{filepath.name}'.",
            f"{EXPORT_FAILURE_PREFIX}BLEND_NAME_MISMATCH",
        )
    if not filepath.exists():
        fail(
            f"Open blend path does not exist on disk: {filepath}",
            f"{EXPORT_FAILURE_PREFIX}BLEND_PATH_MISSING",
        )
    return filepath


def ensure_asset_identity():
    asset_collection = bpy.data.collections.get(ASSET_ID)
    lod_roots = [bpy.data.objects.get(root_name) for _, _, _, root_name in EXPORT_SEQUENCE]
    if asset_collection is None or any(root is None for root in lod_roots):
        fail(
            "The open blend does not contain the expected tree root collection and LOD roots.",
            f"{EXPORT_FAILURE_PREFIX}ASSET_IDENTITY_MISSING",
        )
    emit_marker(ASSET_GUARD_MARKER)


def iter_string_markers():
    for text_block in bpy.data.texts:
        yield text_block.name
        try:
            yield text_block.as_string()
        except Exception:
            pass

    for collection in bpy.data.collections:
        yield collection.name
        for key in collection.keys():
            value = collection[key]
            if isinstance(value, str):
                yield value

    for obj in bpy.data.objects:
        yield obj.name
        for key in obj.keys():
            value = obj[key]
            if isinstance(value, str):
                yield value

    for material in bpy.data.materials:
        yield material.name
        for key in material.keys():
            value = material[key]
            if isinstance(value, str):
                yield value

    for scene in bpy.data.scenes:
        yield scene.name
        for key in scene.keys():
            value = scene[key]
            if isinstance(value, str):
                yield value


def ensure_recipe_identity():
    for marker in iter_string_markers():
        if isinstance(marker, str) and SOURCE_RECIPE_ID in marker:
            emit_marker(RECIPE_GUARD_MARKER)
            return
    fail(
        f"Could not confirm recipe identity '{SOURCE_RECIPE_ID}' inside the open blend.",
        f"{EXPORT_FAILURE_PREFIX}RECIPE_IDENTITY_MISSING",
    )


def select_root_only(root_object):
    bpy.ops.object.select_all(action="DESELECT")
    root_object.select_set(True)
    bpy.context.view_layer.objects.active = root_object
    bpy.ops.object.select_grouped(type="CHILDREN_RECURSIVE")


def count_triangles_and_materials(root_object):
    triangle_count = 0
    mesh_count = 0
    material_names = set()
    stack = [root_object]
    while stack:
        current = stack.pop()
        if current.type == "MESH" and current.data is not None:
            mesh_count += 1
            for polygon in current.data.polygons:
                triangle_count += max(len(polygon.vertices) - 2, 0)
            for material in current.data.materials:
                if material is not None:
                    material_names.add(material.name)
        stack.extend(list(current.children))
    return {
        "meshCount": mesh_count,
        "materialCount": len(material_names),
        "triangleCount": triangle_count,
        "materials": sorted(material_names),
    }


def parse_glb(filepath):
    data = filepath.read_bytes()
    if len(data) <= 20:
        raise RuntimeError(f"{filepath.name} was too small to trust.")

    magic, version, total_length = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF":
        raise RuntimeError(f"{filepath.name} did not contain a valid GLB header.")
    if version != 2:
        raise RuntimeError(f"{filepath.name} used unsupported GLB version {version}.")
    if total_length != len(data):
        raise RuntimeError(
            f"{filepath.name} declared GLB length {total_length}, actual {len(data)}."
        )

    offset = 12
    gltf_json = None
    while offset + 8 <= len(data):
        chunk_length, chunk_type = struct.unpack_from("<I4s", data, offset)
        offset += 8
        chunk = data[offset : offset + chunk_length]
        offset += chunk_length
        if chunk_type == b"JSON":
            gltf_json = json.loads(chunk.decode("utf8").rstrip(" \t\r\n\0"))

    if gltf_json is None:
        raise RuntimeError(f"{filepath.name} did not contain a JSON chunk.")

    meshes = gltf_json.get("meshes", [])
    materials = gltf_json.get("materials", [])
    images = gltf_json.get("images", [])
    buffers = gltf_json.get("buffers", [])
    accessors = gltf_json.get("accessors", [])
    identity_hits = []
    for key in ("nodes", "meshes", "materials", "scenes"):
        for entry in gltf_json.get(key, []):
            name = entry.get("name")
            if isinstance(name, str) and ASSET_ID in name:
                identity_hits.append(name)

    triangle_count = 0
    primitive_count = 0
    for mesh in meshes:
        for primitive in mesh.get("primitives", []):
            primitive_count += 1
            if primitive.get("mode", 4) != 4:
                continue
            accessor_index = primitive.get("indices")
            if isinstance(accessor_index, int) and 0 <= accessor_index < len(accessors):
                triangle_count += accessors[accessor_index].get("count", 0) // 3

    has_external_dependencies = any(
        isinstance(image, dict) and image.get("uri") for image in images
    ) or any(isinstance(buffer, dict) and buffer.get("uri") for buffer in buffers)

    return {
        "sizeBytes": len(data),
        "sha256": sha256(data).hexdigest(),
        "meshCount": len(meshes),
        "materialCount": len(materials),
        "triangleCount": triangle_count,
        "primitiveCount": primitive_count,
        "hasExternalDependencies": has_external_dependencies,
        "assetIdentityPreserved": len(identity_hits) > 0,
        "assetIdentityHits": identity_hits[:16],
    }


def validate_export(filepath, expected_metrics):
    metrics = parse_glb(filepath)
    if not metrics["assetIdentityPreserved"]:
        raise RuntimeError(f"{filepath.name} did not preserve the eucalyptus asset identity.")
    if metrics["hasExternalDependencies"]:
        raise RuntimeError(f"{filepath.name} contained external file dependencies.")
    if metrics["sizeBytes"] <= 20:
        raise RuntimeError(f"{filepath.name} was too small to trust after export.")
    if metrics["meshCount"] <= 0:
        raise RuntimeError(f"{filepath.name} did not contain any meshes.")
    if metrics["materialCount"] <= 0:
        raise RuntimeError(f"{filepath.name} did not contain any materials.")
    if metrics["triangleCount"] <= 0:
        raise RuntimeError(f"{filepath.name} did not contain any triangles.")
    if metrics["triangleCount"] > expected_metrics["triangleCount"]:
        raise RuntimeError(
            f"{filepath.name} exceeded in-scene triangle expectations "
            f"({metrics['triangleCount']} > {expected_metrics['triangleCount']})."
        )
    return metrics


def export_root(root_object, temp_path):
    select_root_only(root_object)
    bpy.ops.export_scene.gltf(
        filepath=str(temp_path),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_materials="EXPORT",
        export_texcoords=False,
        export_normals=True,
        export_tangents=False,
        export_colors=False,
        export_cameras=False,
        export_lights=False,
        export_animations=False,
    )


def build_temp_glb_path(final_path):
    return final_path.with_name(f"{final_path.stem}.tmp{final_path.suffix}")


def validate_existing_final_if_present(final_path, expected_metrics):
    if not final_path.exists():
        return None
    return validate_export(final_path, expected_metrics)


def export_single_lod(lod_key, lod_label, final_filename, root_name):
    root_object = bpy.data.objects.get(root_name)
    if root_object is None:
        fail(
            f"Could not find LOD root {root_name}.",
            f"{EXPORT_FAILURE_PREFIX}{lod_label}_ROOT_MISSING",
        )

    expected_metrics = count_triangles_and_materials(root_object)
    final_path = EXPECTED_OUTPUT_DIR / final_filename
    temp_path = build_temp_glb_path(final_path)

    existing_metrics = validate_existing_final_if_present(final_path, expected_metrics)
    if existing_metrics is not None:
        emit_marker(f"{EXPORT_SKIP_PREFIX}{lod_label}")
        return existing_metrics

    if temp_path.exists():
        temp_path.unlink()

    emit_marker(f"S184_TREE_EUCALYPTUS_EXPORT_LOD_START:{lod_label}")
    export_root(root_object, temp_path)
    verified_metrics = validate_export(temp_path, expected_metrics)
    temp_path.replace(final_path)
    emit_marker(f"S184_TREE_EUCALYPTUS_EXPORT_LOD_COMPLETE:{lod_label}")
    return verified_metrics


def main():
    emit_marker(EXPORT_START_MARKER)
    EXPECTED_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    ensure_blender_version()
    find_open_blend_path()
    ensure_asset_identity()
    ensure_recipe_identity()

    metrics_by_lod = {}
    for lod_key, lod_label, final_filename, root_name in EXPORT_SEQUENCE:
        try:
            metrics_by_lod[lod_key] = export_single_lod(
                lod_key, lod_label, final_filename, root_name
            )
        except Exception as error:
            fail(str(error), f"{EXPORT_FAILURE_PREFIX}{lod_label}")

    close_metrics = metrics_by_lod["close"]
    gameplay_metrics = metrics_by_lod["gameplay"]
    map_metrics = metrics_by_lod["map"]
    if not (
        close_metrics["triangleCount"] > gameplay_metrics["triangleCount"] > map_metrics["triangleCount"]
    ):
        fail(
            "LOD triangle complexity did not decrease from close to gameplay to map.",
            f"{EXPORT_FAILURE_PREFIX}LOD_COMPLEXITY",
        )

    emit_marker(EXPORT_COMPLETE_MARKER)


if __name__ == "__main__":
    main()
