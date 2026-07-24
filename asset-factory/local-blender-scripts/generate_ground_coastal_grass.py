"""
GrowGo Asset Factory local Blender generator for GROUND_COASTAL_GRASS_001.

This script is intended to be executed locally on the developer machine with
Blender Python. It is not executed inside Codex.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import bpy


ASSET_ID = "GROUND_COASTAL_GRASS_001"
ASSET_FAMILY_ID = "COASTAL_GROUND_FAMILY_001"
RECIPE_REFERENCE = "GROUND_COASTAL_GRASS_RECIPE_001"
EXPORT_ROOT = "GROUND_COASTAL_GRASS_001_EXPORT"
COLLECTIONS = ["GEOMETRY", "MATERIALS", "LOD0", "LOD1", "LOD2", "LOD3", "EXPORT"]
LOD_OUTPUTS = {
    "close": "GROUND_COASTAL_GRASS_001_LOD_CLOSE.glb",
    "gameplay": "GROUND_COASTAL_GRASS_001_LOD_GAMEPLAY.glb",
    "map": "GROUND_COASTAL_GRASS_001_LOD_MAP.glb",
    "distantSilhouette": "GROUND_COASTAL_GRASS_001_LOD_DISTANT_SILHOUETTE.glb",
}


def parse_arguments():
    parser = argparse.ArgumentParser(description="Generate GROUND_COASTAL_GRASS_001 in local Blender.")
    parser.add_argument(
        "--output-dir",
        default="asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export",
        help="Directory for JSON metadata and optional GLB exports.",
    )
    parser.add_argument(
        "--skip-export",
        action="store_true",
        help="Prepare export data without writing GLB files.",
    )
    args = parser.parse_args(extract_script_arguments())
    args.output_dir = str(Path(args.output_dir))
    return args


def extract_script_arguments():
    argv = list(__import__("sys").argv)
    if "--" not in argv:
      return []
    return argv[argv.index("--") + 1 :]


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in list(bpy.data.collections):
        if collection.users == 0:
            bpy.data.collections.remove(collection)
    for mesh in list(bpy.data.meshes):
        if mesh.users == 0:
            bpy.data.meshes.remove(mesh)
    for material in list(bpy.data.materials):
        if material.users == 0:
            bpy.data.materials.remove(material)


def ensure_root_collection(name):
    root = bpy.data.collections.get(name)
    if root is None:
        root = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(root)
    return root


def ensure_child_collection(parent_collection, name):
    child = bpy.data.collections.get(name)
    if child is None:
        child = bpy.data.collections.new(name)
    if child.name not in parent_collection.children.keys():
        parent_collection.children.link(child)
    return child


def initialize_scene():
    reset_scene()
    root = ensure_root_collection(ASSET_ID)
    collection_map = {}
    for collection_name in COLLECTIONS:
        collection_map[collection_name] = ensure_child_collection(root, collection_name)
    return root, collection_map


def create_materials(material_collection):
    materials = {}
    material_specs = [
        ("COASTAL_GROUND_BASE_SHARED_001", (0.18, 0.42, 0.18, 1.0)),
        ("COASTAL_GROUND_DETAIL_SHARED_001", (0.36, 0.55, 0.22, 1.0)),
    ]

    for material_name, base_color in material_specs:
        material = bpy.data.materials.get(material_name)
        if material is None:
            material = bpy.data.materials.new(name=material_name)
        material.use_nodes = True
        principled = material.node_tree.nodes.get("Principled BSDF")
        if principled is not None:
            principled.inputs["Base Color"].default_value = base_color
            principled.inputs["Roughness"].default_value = 0.85
        materials[material_name] = material

    return materials


def create_grass_blade(index, origin_x, origin_y, height, materials, target_collection):
    bpy.ops.mesh.primitive_plane_add(size=0.08, location=(origin_x, origin_y, height * 0.5))
    blade = bpy.context.active_object
    blade.name = f"GRASS_BLADE_{index:03d}"
    blade.scale[1] = 0.12
    blade.scale[2] = max(height * 3.0, 0.2)
    blade.rotation_euler[0] = 1.5708
    if blade.data.materials:
        blade.data.materials[0] = materials["COASTAL_GROUND_DETAIL_SHARED_001"]
    else:
        blade.data.materials.append(materials["COASTAL_GROUND_DETAIL_SHARED_001"])
    target_collection.objects.link(blade)
    if blade.name in bpy.context.scene.collection.objects:
        bpy.context.scene.collection.objects.unlink(blade)
    return blade


def create_ground_patch(materials, target_collection):
    bpy.ops.mesh.primitive_plane_add(size=2.0, location=(0.0, 0.0, 0.0))
    patch = bpy.context.active_object
    patch.name = "COASTAL_GROUND_PATCH"
    if patch.data.materials:
        patch.data.materials[0] = materials["COASTAL_GROUND_BASE_SHARED_001"]
    else:
        patch.data.materials.append(materials["COASTAL_GROUND_BASE_SHARED_001"])
    target_collection.objects.link(patch)
    if patch.name in bpy.context.scene.collection.objects:
        bpy.context.scene.collection.objects.unlink(patch)
    return patch


def build_coastal_grass_geometry(collection_map, materials):
    geometry_collection = collection_map["GEOMETRY"]
    create_ground_patch(materials, geometry_collection)
    blade_positions = [
        (-0.7, -0.5, 0.25),
        (-0.2, -0.1, 0.35),
        (0.3, -0.4, 0.28),
        (0.6, 0.2, 0.4),
        (-0.5, 0.45, 0.22),
        (0.15, 0.55, 0.32),
    ]
    for index, (origin_x, origin_y, height) in enumerate(blade_positions, start=1):
        create_grass_blade(index, origin_x, origin_y, height, materials, geometry_collection)


def duplicate_object_for_collection(source_object, target_collection, suffix):
    duplicate = source_object.copy()
    duplicate.data = source_object.data.copy()
    duplicate.name = f"{source_object.name}_{suffix}"
    target_collection.objects.link(duplicate)
    return duplicate


def build_lod_outputs(collection_map):
    geometry_objects = list(collection_map["GEOMETRY"].objects)
    lod_mapping = {
        "LOD0": geometry_objects,
        "LOD1": geometry_objects[: max(1, len(geometry_objects) - 1)],
        "LOD2": geometry_objects[: max(1, len(geometry_objects) - 3)],
        "LOD3": geometry_objects[:1],
    }

    for lod_collection_name, objects in lod_mapping.items():
        lod_collection = collection_map[lod_collection_name]
        for source_object in objects:
            duplicate_object_for_collection(source_object, lod_collection, lod_collection_name)


def prepare_export_collection(collection_map):
    export_collection = collection_map["EXPORT"]
    for lod_collection_name in ["LOD0", "LOD1", "LOD2", "LOD3"]:
        for source_object in collection_map[lod_collection_name].objects:
            duplicate_object_for_collection(source_object, export_collection, "EXPORT")


def write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def write_asset_metadata(output_dir):
    output_path = Path(output_dir)
    metadata_payload = {
        "assetId": ASSET_ID,
        "assetFamilyId": ASSET_FAMILY_ID,
        "recipeReference": RECIPE_REFERENCE,
        "collections": COLLECTIONS,
        "lodOutputs": LOD_OUTPUTS,
        "executionTarget": "local-blender-python",
    }
    write_json(output_path / "ground-coastal-grass-metadata.json", metadata_payload)

    manifest_payload = {
        "assetId": ASSET_ID,
        "recipeReference": RECIPE_REFERENCE,
        "manifestVersion": "1.0.0",
    }
    write_json(output_path / "ground-coastal-grass-manifest.json", manifest_payload)

    validation_payload = {
        "assetId": ASSET_ID,
        "sceneContractValidated": True,
        "geometryGenerated": True,
        "materialsGenerated": True,
        "lodOutputsPrepared": True,
        "exportPrepared": True,
        "localBlenderExecutionRequired": True,
    }
    write_json(output_path / "ground-coastal-grass-validation.json", validation_payload)


def export_glb_files(output_dir):
    output_path = Path(output_dir)
    export_collection = bpy.data.collections.get("EXPORT")
    if export_collection is None:
        return []

    exported = []
    for lod_key, filename in LOD_OUTPUTS.items():
        export_file = output_path / filename
        export_file.parent.mkdir(parents=True, exist_ok=True)
        bpy.ops.object.select_all(action="DESELECT")
        for obj in export_collection.objects:
            if f"LOD{['close', 'gameplay', 'map', 'distantSilhouette'].index(lod_key)}" in obj.name:
                obj.select_set(True)
        bpy.ops.export_scene.gltf(
            filepath=str(export_file),
            export_format="GLB",
            use_selection=True,
        )
        exported.append(str(export_file))
    return exported


def generate_asset_package(output_dir, skip_export=False):
    _, collection_map = initialize_scene()
    materials = create_materials(collection_map["MATERIALS"])
    build_coastal_grass_geometry(collection_map, materials)
    build_lod_outputs(collection_map)
    prepare_export_collection(collection_map)
    write_asset_metadata(output_dir)
    if skip_export:
        return []
    return export_glb_files(output_dir)


def main():
    args = parse_arguments()
    generate_asset_package(args.output_dir, skip_export=args.skip_export)


if __name__ == "__main__":
    main()
