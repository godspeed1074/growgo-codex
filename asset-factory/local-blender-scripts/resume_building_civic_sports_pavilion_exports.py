"""
Manual Blender-internal export resume script for BUILDING_CIVIC_SPORTS_PAVILION_001.

This script is intended to be run by a human from Blender 4.2 LTS after opening
the existing verified pavilion blend file. It does not regenerate the pavilion.
It resumes by exporting the existing LOD roots one at a time with validation and
atomic finalization.
"""

from __future__ import annotations

import json
import struct
import sys
from hashlib import sha256
from pathlib import Path

import bpy


ASSET_ID = "BUILDING_CIVIC_SPORTS_PAVILION_001"
RECIPE_ID = "SPORTS_FACILITY_RECIPE_001"
EXPECTED_BLEND_NAME = f"{ASSET_ID}_v001.blend"
EXPECTED_OUTPUT_DIR = Path(
    "/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export"
)

RESUME_START_MARKER = "S177_PAVILION_RESUME_START"
RESUME_COMPLETE_MARKER = "S177_PAVILION_RESUME_COMPLETE"
LOD_EXPORT_START_PREFIX = "S177_PAVILION_RESUME_LOD_EXPORT_START:"
LOD_EXPORT_COMPLETE_PREFIX = "S177_PAVILION_RESUME_LOD_EXPORT_COMPLETE:"
LOD_EXPORT_SKIP_PREFIX = "S177_PAVILION_RESUME_LOD_EXPORT_SKIP:"
LOD_EXPORT_FAILURE_PREFIX = "S177_PAVILION_RESUME_LOD_EXPORT_FAILURE:"
ASSET_GUARD_MARKER = "S177_PAVILION_RESUME_ASSET_GUARD_OK"
RECIPE_GUARD_MARKER = "S177_PAVILION_RESUME_RECIPE_GUARD_OK"
VERSION_GUARD_MARKER = "S177_PAVILION_RESUME_VERSION_GUARD_OK"

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
            f"Expected Blender 4.2.x for pavilion export resume, found {version!r}.",
            f"{LOD_EXPORT_FAILURE_PREFIX}VERSION_INCOMPATIBLE",
        )
    emit_marker(VERSION_GUARD_MARKER)


def find_open_blend_path():
    filepath = Path(bpy.data.filepath) if bpy.data.filepath else None
    if filepath is None or not str(filepath).strip():
        fail(
            "The pavilion blend must be opened before running the resume script.",
            f"{LOD_EXPORT_FAILURE_PREFIX}BLEND_NOT_OPEN",
        )
    if filepath.name != EXPECTED_BLEND_NAME:
        fail(
            f"Expected open blend '{EXPECTED_BLEND_NAME}', found '{filepath.name}'.",
            f"{LOD_EXPORT_FAILURE_PREFIX}BLEND_NAME_MISMATCH",
        )
    if not filepath.exists():
        fail(
            f"Open blend path does not exist on disk: {filepath}",
            f"{LOD_EXPORT_FAILURE_PREFIX}BLEND_PATH_MISSING",
        )
    return filepath


def ensure_asset_identity():
    root_collection = bpy.data.collections.get(ASSET_ID)
    lod_roots = [bpy.data.objects.get(root_name) for _, _, _, root_name in EXPORT_SEQUENCE]
    if root_collection is None or any(root is None for root in lod_roots):
        fail(
            "The open blend does not contain the expected pavilion root collection and LOD roots.",
            f"{LOD_EXPORT_FAILURE_PREFIX}ASSET_IDENTITY_MISSING",
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
        if isinstance(marker, str) and RECIPE_ID in marker:
            emit_marker(RECIPE_GUARD_MARKER)
            return
    fail(
        f"Could not confirm recipe identity '{RECIPE_ID}' inside the open blend.",
        f"{LOD_EXPORT_FAILURE_PREFIX}RECIPE_IDENTITY_MISSING",
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

    identity_hits = []
    for key in ("nodes", "meshes", "materials", "scenes"):
        for entry in gltf_json.get(key, []):
            name = entry.get("name")
            if isinstance(name, str) and ASSET_ID in name:
                identity_hits.append(name)

    triangle_count = 0
    primitive_count = 0
    accessors = gltf_json.get("accessors", [])
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
        raise RuntimeError(f"{filepath.name} did not preserve the pavilion asset identity.")
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


def export_root(root_object, filepath):
    select_root_only(root_object)
    bpy.ops.export_scene.gltf(
        filepath=str(filepath),
        use_selection=True,
        export_format="GLB",
        export_image_format="NONE",
    )


def validate_existing_final_or_fail(final_path):
    if not final_path.exists():
        return None
    return parse_glb(final_path)


def build_temp_glb_path(final_path):
    return final_path.with_name(f"{final_path.stem}.tmp{final_path.suffix}")


def export_lod(output_dir, lod_key, lod_label, final_filename, root_name):
    root_object = bpy.data.objects.get(root_name)
    if root_object is None:
        fail(
            f"Missing required LOD root '{root_name}' for {lod_label}.",
            f"{LOD_EXPORT_FAILURE_PREFIX}{lod_label}",
        )

    final_path = output_dir / final_filename
    temp_path = build_temp_glb_path(final_path)
    if temp_path.exists():
        temp_path.unlink()

    existing_final = validate_existing_final_or_fail(final_path)
    if existing_final is not None:
        emit_marker(f"{LOD_EXPORT_SKIP_PREFIX}{final_filename}")
        print(json.dumps({"lod": lod_key, "finalFile": final_filename, "status": "already_valid", "metrics": existing_final}, indent=2))
        return existing_final

    expected_metrics = count_triangles_and_materials(root_object)
    emit_marker(f"{LOD_EXPORT_START_PREFIX}{final_filename}")
    export_root(root_object, temp_path)
    verified_metrics = validate_export(temp_path, expected_metrics)
    temp_path.replace(final_path)
    emit_marker(f"{LOD_EXPORT_COMPLETE_PREFIX}{final_filename}")
    print(
        json.dumps(
            {
                "lod": lod_key,
                "finalFile": final_filename,
                "status": "exported",
                "expectedMetrics": expected_metrics,
                "verifiedMetrics": verified_metrics,
            },
            indent=2,
        )
    )
    return verified_metrics


def main():
    emit_marker(RESUME_START_MARKER)
    ensure_blender_version()
    blend_path = find_open_blend_path()
    ensure_asset_identity()
    ensure_recipe_identity()

    output_dir = blend_path.parent
    if output_dir != EXPECTED_OUTPUT_DIR:
        fail(
            f"Open blend directory did not match the approved export directory.\n"
            f"Expected: {EXPECTED_OUTPUT_DIR}\n"
            f"Found:    {output_dir}",
            f"{LOD_EXPORT_FAILURE_PREFIX}OUTPUT_DIR_MISMATCH",
        )

    output_dir.mkdir(parents=True, exist_ok=True)

    results = {}
    for lod_key, lod_label, final_filename, root_name in EXPORT_SEQUENCE:
        try:
            results[lod_key] = export_lod(
                output_dir, lod_key, lod_label, final_filename, root_name
            )
        except Exception as error:
            emit_marker(f"{LOD_EXPORT_FAILURE_PREFIX}{final_filename}")
            raise RuntimeError(
                f"Stopped during {lod_label} export for {final_filename}: {error}"
            ) from error

    print(json.dumps({"assetId": ASSET_ID, "recipeId": RECIPE_ID, "results": results}, indent=2))
    emit_marker(RESUME_COMPLETE_MARKER)


if __name__ == "__main__":
    main()
