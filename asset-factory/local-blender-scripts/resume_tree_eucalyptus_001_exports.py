"""
Manual Blender-internal export resume script for TREE_EUCALYPTUS_001.

This script is intended to be run by a human from Blender 4.2 LTS after
opening the final saved tree blend file. It does not regenerate the tree. It
exports the three approved LOD roots one at a time, validates each temporary
GLB, and finalizes each export only after validation passes.
"""

from __future__ import annotations

import json
import importlib.util
import struct
import sys
from hashlib import sha256
from pathlib import Path

import bpy


ASSET_ID = "TREE_EUCALYPTUS_001"
ASSET_CATEGORY = "nature"
SOURCE_RECIPE_ID = "TREE_EUCALYPTUS_RECIPE_001"
ASSET_VERSION = "v001"
VARIANT_ID = "DEFAULT"
PALETTE_ID = "AU_NATIVE_GREEN_001"
LOD_PROFILE = "NATURE_STANDARD_001"
IDENTITY_POLICY = "ASSET_ROOT_AND_COMPONENTS"
DEPENDENCY_IDS = ("MOD_TREE_LEAF_CLUSTER_001",)
EXPECTED_BLEND_NAME = f"{ASSET_ID}_v001.blend"
REPO_ROOT = Path(
    "/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex"
).resolve()
BOOTSTRAP_PATH = (
    REPO_ROOT / "asset-factory" / "local-blender-scripts" / "growgo_blender_bootstrap.py"
).resolve()

if not BOOTSTRAP_PATH.is_file():
    raise RuntimeError(
        f"GrowGo Blender bootstrap helper was missing: {BOOTSTRAP_PATH}"
    )

bootstrap_spec = importlib.util.spec_from_file_location(
    "growgo_blender_bootstrap", BOOTSTRAP_PATH
)
if bootstrap_spec is None or bootstrap_spec.loader is None:
    raise RuntimeError(
        f"Could not load GrowGo Blender bootstrap helper: {BOOTSTRAP_PATH}"
    )
growgo_blender_bootstrap = importlib.util.module_from_spec(bootstrap_spec)
bootstrap_spec.loader.exec_module(growgo_blender_bootstrap)
BOOTSTRAP_STATE = growgo_blender_bootstrap.bootstrap_local_blender_scripts(
    "resume_tree_eucalyptus_001_exports.py",
    required_helpers=("asset_identity_anchor_v2",),
    explicit_repo_root=REPO_ROOT,
    script_path=BOOTSTRAP_PATH,
)

from asset_identity_anchor_v2 import (
    build_export_object_set,
    build_identity_anchor_name,
    find_identity_anchor,
    select_export_object_set,
)

WORKSPACE_ROOT = (REPO_ROOT / "asset-factory-workspace").resolve()
EXPECTED_OUTPUT_DIR = (
    WORKSPACE_ROOT / "production" / "COASTAL_NATURE_FAMILY_001" / "export"
).resolve()

EXPORT_START_MARKER = "S184_TREE_EUCALYPTUS_EXPORT_START"
EXPORT_COMPLETE_MARKER = "S184_TREE_EUCALYPTUS_EXPORT_COMPLETE"
EXPORT_SKIP_PREFIX = "S184_TREE_EUCALYPTUS_EXPORT_SKIP:"
EXPORT_FAILURE_PREFIX = "S184_TREE_EUCALYPTUS_EXPORT_FAILURE:"
ASSET_GUARD_MARKER = "S184_TREE_EUCALYPTUS_ASSET_GUARD_OK"
RECIPE_GUARD_MARKER = "S184_TREE_EUCALYPTUS_RECIPE_GUARD_OK"
VERSION_GUARD_MARKER = "S184_TREE_EUCALYPTUS_VERSION_GUARD_OK"

EXPORT_SEQUENCE = (
    ("close", "LOD_CLOSE", f"{ASSET_ID}_LOD_CLOSE.glb", f"{ASSET_ID}_LOD_CLOSE_ROOT"),
    ("gameplay", "LOD_GAMEPLAY", f"{ASSET_ID}_LOD_GAMEPLAY.glb", f"{ASSET_ID}_LOD_GAMEPLAY_ROOT"),
    ("map", "LOD_MAP", f"{ASSET_ID}_LOD_MAP.glb", f"{ASSET_ID}_LOD_MAP_ROOT"),
)

IDENTITY_CONTRACT_V2 = {
    "assetId": ASSET_ID,
    "category": ASSET_CATEGORY,
    "recipeId": SOURCE_RECIPE_ID,
    "version": ASSET_VERSION,
    "variantId": VARIANT_ID,
    "paletteId": PALETTE_ID,
    "lodProfile": LOD_PROFILE,
    "source": {
        "generator": "Asset Factory",
        "authoringTool": "Blender",
    },
    "dependencies": [
        {
            "dependencyId": dependency_id,
            "category": "module",
            "identityPolicy": "DEPENDENCY_DECLARED_ONLY",
        }
        for dependency_id in DEPENDENCY_IDS
    ],
    "identityPolicy": IDENTITY_POLICY,
    "identityAnchor": {
        "componentRole": "IDENTITY_ANCHOR",
        "required": True,
    },
    "anchorRequired": True,
    "anchorValidation": "REQUIRE_PER_LOD_EXPORTED_ANCHOR",
    "exportedIdentitySource": "identity_anchor",
}


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


def ensure_output_directory():
    output_dir = EXPECTED_OUTPUT_DIR.resolve()
    repo_root = REPO_ROOT.resolve()

    print(f"Resolved eucalyptus export directory: {output_dir}")
    sys.stdout.flush()

    if str(output_dir).startswith("/Applications"):
        fail(
            f"Refusing to write exports inside /Applications: {output_dir}",
            f"{EXPORT_FAILURE_PREFIX}OUTPUT_DIR_IN_APPLICATIONS",
        )

    try:
        output_dir.relative_to(repo_root)
    except ValueError:
        fail(
            f"Refusing to write exports outside the GrowGo repository: {output_dir}",
            f"{EXPORT_FAILURE_PREFIX}OUTPUT_DIR_OUTSIDE_REPO",
        )

    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir


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
    expected_contract_json = json.dumps(IDENTITY_CONTRACT_V2, sort_keys=True)
    if asset_collection.get("growgo_identity_contract_v2") != expected_contract_json:
        fail(
            "The open blend does not contain the expected Tree Eucalyptus v2 identity contract metadata.",
            f"{EXPORT_FAILURE_PREFIX}ASSET_CONTRACT_V2_MISSING",
        )
    for _lod_key, lod_label, _filename, root_name in EXPORT_SEQUENCE:
        root_object = bpy.data.objects.get(root_name)
        if root_object is None:
            continue
        anchor_object = find_identity_anchor(root_object, ASSET_ID, lod_label)
        if anchor_object is None:
            fail(
                f"Missing identity anchor for {lod_label}.",
                f"{EXPORT_FAILURE_PREFIX}{lod_label}_ANCHOR_MISSING",
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


def collect_identity_state(root_object):
    object_names = set()
    mesh_names = set()
    material_names = set()
    collection_names = set()
    object_metadata = []
    mesh_metadata = []
    material_metadata = []
    collection_metadata = []

    stack = [root_object]
    while stack:
        current = stack.pop()
        object_names.add(current.name)
        object_metadata.append(collect_id_properties(current))
        for collection in current.users_collection:
            collection_names.add(collection.name)
            collection_metadata.append(collect_id_properties(collection))
        if current.type == "MESH" and current.data is not None:
            mesh_names.add(current.data.name)
            mesh_metadata.append(collect_id_properties(current.data))
            for material in current.data.materials:
                if material is not None:
                    material_names.add(material.name)
                    material_metadata.append(collect_id_properties(material))
        stack.extend(list(current.children))

    asset_collection = bpy.data.collections.get(ASSET_ID)
    if asset_collection is not None:
        collection_names.add(asset_collection.name)
        collection_metadata.append(collect_id_properties(asset_collection))

    return {
        "objectNames": sorted(object_names),
        "meshNames": sorted(mesh_names),
        "materialNames": sorted(material_names),
        "collectionNames": sorted(collection_names),
        "objectMetadata": object_metadata,
        "meshMetadata": mesh_metadata,
        "materialMetadata": material_metadata,
        "collectionMetadata": collection_metadata,
    }


def collect_id_properties(target):
    keys = (
        "growgo_asset_id",
        "growgo_category",
        "growgo_recipe_id",
        "growgo_version",
        "growgo_variant_id",
        "growgo_palette_id",
        "growgo_lod_profile",
        "growgo_identity_policy",
        "growgo_component_role",
        "growgo_dependency_id",
        "growgo_lod_label",
        "growgo_identity_contract_v2",
        "growgo_dependencies",
        "growgo_name_identity_owner",
    )
    metadata = {}
    for key in keys:
        if key in target.keys():
            metadata[key] = target[key]
    return metadata


def metadata_matches_asset_contract(metadata, lod_label=None):
    lod_matches = (
        lod_label is None
        or metadata.get("growgo_lod_label") in (None, "", lod_label)
    )
    return (
        metadata.get("growgo_asset_id") == ASSET_ID
        and metadata.get("growgo_category") == ASSET_CATEGORY
        and metadata.get("growgo_recipe_id") == SOURCE_RECIPE_ID
        and metadata.get("growgo_version") == ASSET_VERSION
        and metadata.get("growgo_variant_id") == VARIANT_ID
        and metadata.get("growgo_palette_id") == PALETTE_ID
        and metadata.get("growgo_lod_profile") == LOD_PROFILE
        and metadata.get("growgo_identity_policy") == IDENTITY_POLICY
        and lod_matches
    )


def metadata_matches_dependency_contract(metadata, lod_label=None):
    lod_matches = (
        lod_label is None
        or metadata.get("growgo_lod_label") in (None, "", lod_label)
    )
    dependency_id = metadata.get("growgo_dependency_id")
    return (
        dependency_id in DEPENDENCY_IDS
        and metadata.get("growgo_asset_id") == ASSET_ID
        and metadata.get("growgo_recipe_id") == SOURCE_RECIPE_ID
        and metadata.get("growgo_palette_id") == PALETTE_ID
        and metadata.get("growgo_lod_profile") == LOD_PROFILE
        and lod_matches
    )


def validate_pre_export_identity(root_object, lod_label):
    identity_state = collect_identity_state(root_object)
    missing_items = []
    invalid_dependencies = []
    anchor_object = find_identity_anchor(root_object, ASSET_ID, lod_label)

    if root_object.name != f"{ASSET_ID}_{lod_label}_ROOT":
        missing_items.append(f"lod_root:{root_object.name}")
    if lod_label not in root_object.name:
        missing_items.append(f"lod_label:{lod_label}")
    if anchor_object is None:
        missing_items.append(f"identity_anchor:{build_identity_anchor_name(ASSET_ID, lod_label)}")
    if not any(ASSET_ID in name for name in identity_state["objectNames"]):
        missing_items.append("object_names")
    if not any(
        metadata_matches_asset_contract(metadata, lod_label)
        for metadata in identity_state["objectMetadata"]
    ):
        missing_items.append("object_metadata")
    if not any(
        metadata_matches_asset_contract(metadata, lod_label)
        or metadata_matches_dependency_contract(metadata, lod_label)
        for metadata in identity_state["meshMetadata"]
    ):
        missing_items.append(
            "mesh_identity:" + ",".join(identity_state["meshNames"][:6] or ["none"])
        )
    if not any(
        metadata_matches_asset_contract(metadata, None)
        for metadata in identity_state["materialMetadata"]
    ):
        missing_items.append(
            "material_metadata:" + ",".join(identity_state["materialNames"][:6] or ["none"])
        )
    if not any(
        metadata_matches_asset_contract(metadata, None)
        for metadata in identity_state["collectionMetadata"]
    ):
        missing_items.append(
            "collection_metadata:" + ",".join(identity_state["collectionNames"][:6] or ["none"])
        )
    if not any(PALETTE_ID in json.dumps(metadata, sort_keys=True) for metadata in identity_state["materialMetadata"]):
        missing_items.append("palette_identity")
    if anchor_object is not None and not anchor_object.get("growgo_identity_anchor"):
        missing_items.append("anchor_metadata_flag")
    if anchor_object is not None and anchor_object.get("growgo_exported_identity_source") != "identity_anchor":
        missing_items.append("anchor_exported_identity_source")

    for metadata in identity_state["meshMetadata"]:
        dependency_id = metadata.get("growgo_dependency_id")
        if dependency_id is None:
            continue
        if dependency_id not in DEPENDENCY_IDS:
            invalid_dependencies.append(dependency_id)

    if invalid_dependencies:
        missing_items.append(
            "invalid_dependencies:" + ",".join(sorted(set(invalid_dependencies)))
        )

    if missing_items:
        raise RuntimeError(
            f"Pre-export identity validation failed for {lod_label}: "
            + "; ".join(missing_items)
        )

    return identity_state


def validate_export_preflight(root_object, lod_label):
    export_objects, anchor_object = build_export_object_set(root_object, ASSET_ID, lod_label)
    export_names = [obj.name for obj in export_objects]
    if anchor_object.name not in export_names:
        raise RuntimeError(
            f"Identity anchor '{anchor_object.name}' was not included in the export set."
        )

    selected_objects, selected_anchor = select_export_object_set(
        root_object, ASSET_ID, lod_label
    )
    selected_names = [obj.name for obj in selected_objects]
    if anchor_object.name not in selected_names:
        raise RuntimeError(
            f"Identity anchor '{anchor_object.name}' was not selected for export."
        )
    if selected_anchor.name != anchor_object.name:
        raise RuntimeError(
            f"Selected anchor mismatch for {lod_label}: {selected_anchor.name}."
        )

    return {
        "exportNames": export_names,
        "selectedNames": selected_names,
        "anchorName": anchor_object.name,
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
    metadata_hits = []
    dependency_hits = []
    anchor_hits = []
    for key in ("nodes", "meshes", "materials", "scenes"):
        for entry in gltf_json.get(key, []):
            name = entry.get("name")
            if isinstance(name, str) and ASSET_ID in name:
                identity_hits.append(name)
            if isinstance(name, str) and "IDENTITY_ANCHOR" in name and ASSET_ID in name:
                anchor_hits.append(name)
            extras = entry.get("extras")
            collect_glb_metadata_hits(extras, metadata_hits, dependency_hits, anchor_hits)
    collect_glb_metadata_hits(
        gltf_json.get("asset", {}).get("extras"),
        metadata_hits,
        dependency_hits,
        anchor_hits,
    )

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
        "assetIdentityPreserved": len(identity_hits) > 0 or len(metadata_hits) > 0 or len(anchor_hits) > 0,
        "dependencyIdentityPreserved": len(dependency_hits) > 0,
        "metadataIdentityPreserved": len(metadata_hits) > 0,
        "anchorIdentityPreserved": len(anchor_hits) > 0,
        "assetIdentityHits": identity_hits[:16],
        "metadataIdentityHits": metadata_hits[:16],
        "dependencyIdentityHits": dependency_hits[:16],
        "anchorIdentityHits": anchor_hits[:16],
        "exportedIdentitySource": determine_exported_identity_source(
            metadata_hits, anchor_hits, identity_hits
        ),
    }


def collect_glb_metadata_hits(value, metadata_hits, dependency_hits, anchor_hits, path="$"):
    if isinstance(value, dict):
        for key, nested in value.items():
            collect_glb_metadata_hits(
                nested,
                metadata_hits,
                dependency_hits,
                anchor_hits,
                f"{path}.{key}",
            )
        return
    if isinstance(value, list):
        for index, nested in enumerate(value):
            collect_glb_metadata_hits(
                nested,
                metadata_hits,
                dependency_hits,
                anchor_hits,
                f"{path}[{index}]",
            )
        return
    if not isinstance(value, str):
        return

    if ASSET_ID in value or SOURCE_RECIPE_ID in value or PALETTE_ID in value or LOD_PROFILE in value:
        metadata_hits.append(f"{path}:{value}")
    if "IDENTITY_ANCHOR" in value and ASSET_ID in value:
        anchor_hits.append(f"{path}:{value}")
    for dependency_id in DEPENDENCY_IDS:
        if dependency_id in value:
            dependency_hits.append(f"{path}:{value}")


def determine_exported_identity_source(metadata_hits, anchor_hits, identity_hits):
    if metadata_hits:
        return "metadata"
    if anchor_hits:
        return "identity_anchor"
    if any("_LOD_" in hit or "_MATERIAL_" in hit or "_ROOT" in hit for hit in identity_hits):
        return "structured_names"
    if identity_hits:
        return "legacy_name_matching"
    return "missing"


def validate_export(filepath, expected_metrics):
    metrics = parse_glb(filepath)
    if not metrics["assetIdentityPreserved"]:
        raise RuntimeError(f"{filepath.name} did not preserve the eucalyptus asset identity.")
    if not metrics["metadataIdentityPreserved"]:
        raise RuntimeError(f"{filepath.name} did not preserve eucalyptus metadata identity.")
    if not metrics["anchorIdentityPreserved"]:
        raise RuntimeError(f"{filepath.name} did not preserve the eucalyptus identity anchor.")
    if not metrics["dependencyIdentityPreserved"]:
        raise RuntimeError(f"{filepath.name} did not preserve declared dependency identity.")
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

    optional_export_kwargs = {
        "export_colors": False,
    }

    supported_export_args = set()
    try:
        supported_export_args = set(bpy.ops.export_scene.gltf.get_rna_type().properties.keys())
    except Exception:
        supported_export_args = set()

    for key, value in optional_export_kwargs.items():
        if key in supported_export_args:
            export_kwargs[key] = value

    bpy.ops.export_scene.gltf(**export_kwargs)


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

    validate_pre_export_identity(root_object, lod_label)
    validate_export_preflight(root_object, lod_label)
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
    ensure_output_directory()
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
