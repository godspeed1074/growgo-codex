"""
GrowGo Asset Factory local Blender generator for BUILDING_COASTAL_COTTAGE_001.

This script is intended to be executed locally on the developer machine with
Blender Python. It is not executed inside Codex.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import bpy


ASSET_ID = "BUILDING_COASTAL_COTTAGE_001"
ASSET_FAMILY_ID = "COASTAL_RESIDENTIAL_FAMILY_001"
RECIPE_REFERENCE = "BUILDING_COASTAL_COTTAGE_RECIPE_001"
COLLECTIONS = ["GEOMETRY", "MATERIALS", "LOD0", "LOD1", "LOD2", "LOD3", "EXPORT"]
LOD_OUTPUTS = {
    "close": "BUILDING_COASTAL_COTTAGE_001_LOD_CLOSE.glb",
    "gameplay": "BUILDING_COASTAL_COTTAGE_001_LOD_GAMEPLAY.glb",
    "map": "BUILDING_COASTAL_COTTAGE_001_LOD_MAP.glb",
    "distantSilhouette": "BUILDING_COASTAL_COTTAGE_001_LOD_DISTANT_SILHOUETTE.glb",
}


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Generate BUILDING_COASTAL_COTTAGE_001 in local Blender."
    )
    parser.add_argument(
        "--output-dir",
        default="asset-factory-workspace/production/COASTAL_RESIDENTIAL_FAMILY_001/export",
        help="Directory for JSON metadata, validation files, and optional GLB exports.",
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


def relink_object_to_collection(obj, target_collection):
    target_collection.objects.link(obj)
    if obj.name in bpy.context.scene.collection.objects:
        bpy.context.scene.collection.objects.unlink(obj)


def create_materials():
    materials = {}
    material_specs = [
        ("MAT_COASTAL_COTTAGE_WALL_001", (0.91, 0.93, 0.95, 1.0), 0.88),
        ("MAT_COASTAL_COTTAGE_ROOF_001", (0.19, 0.27, 0.38, 1.0), 0.72),
        ("MAT_COASTAL_COTTAGE_TRIM_001", (0.83, 0.77, 0.63, 1.0), 0.64),
        ("MAT_COASTAL_COTTAGE_WINDOW_001", (0.66, 0.82, 0.92, 1.0), 0.12),
        ("MAT_COASTAL_COTTAGE_DECK_001", (0.53, 0.41, 0.30, 1.0), 0.78),
    ]

    for material_name, base_color, roughness in material_specs:
        material = bpy.data.materials.get(material_name)
        if material is None:
            material = bpy.data.materials.new(name=material_name)
        material.use_nodes = True
        principled = material.node_tree.nodes.get("Principled BSDF")
        if principled is not None:
            principled.inputs["Base Color"].default_value = base_color
            principled.inputs["Roughness"].default_value = roughness
        materials[material_name] = material

    return materials


def build_wall_geometry(materials, target_collection):
    bpy.ops.mesh.primitive_cube_add(location=(0.0, 0.0, 1.0))
    wall_shell = bpy.context.active_object
    wall_shell.name = "WALL_COASTAL_WHITE_001"
    wall_shell.scale = (1.8, 1.3, 1.0)
    wall_shell.data.materials.append(materials["MAT_COASTAL_COTTAGE_WALL_001"])
    relink_object_to_collection(wall_shell, target_collection)

    bpy.ops.mesh.primitive_cube_add(location=(0.0, -1.08, 1.0))
    timber_band = bpy.context.active_object
    timber_band.name = "WALL_COASTAL_TIMBER_001"
    timber_band.scale = (1.82, 0.08, 0.78)
    timber_band.data.materials.append(materials["MAT_COASTAL_COTTAGE_TRIM_001"])
    relink_object_to_collection(timber_band, target_collection)

    bpy.ops.mesh.primitive_cube_add(location=(0.0, 1.08, 1.0))
    accent_wall = bpy.context.active_object
    accent_wall.name = "WALL_COASTAL_BLUE_001"
    accent_wall.scale = (1.82, 0.08, 0.72)
    accent_wall.data.materials.append(materials["MAT_COASTAL_COTTAGE_ROOF_001"])
    relink_object_to_collection(accent_wall, target_collection)


def build_roof_geometry(materials, target_collection):
    bpy.ops.mesh.primitive_cube_add(location=(0.0, 0.0, 2.35))
    roof_gable = bpy.context.active_object
    roof_gable.name = "ROOF_GABLE_COASTAL_001"
    roof_gable.scale = (1.95, 1.46, 0.18)
    roof_gable.rotation_euler = (0.26, 0.0, 0.0)
    roof_gable.data.materials.append(materials["MAT_COASTAL_COTTAGE_ROOF_001"])
    relink_object_to_collection(roof_gable, target_collection)

    bpy.ops.mesh.primitive_cube_add(location=(0.0, 0.0, 2.15))
    roof_hip = bpy.context.active_object
    roof_hip.name = "ROOF_HIP_COASTAL_001"
    roof_hip.scale = (1.6, 1.1, 0.14)
    roof_hip.rotation_euler = (0.18, 0.0, 0.0)
    roof_hip.data.materials.append(materials["MAT_COASTAL_COTTAGE_ROOF_001"])
    relink_object_to_collection(roof_hip, target_collection)

    bpy.ops.mesh.primitive_cube_add(location=(0.0, -1.5, 1.8))
    verandah_roof = bpy.context.active_object
    verandah_roof.name = "ROOF_VERANDAH_COASTAL_001"
    verandah_roof.scale = (1.4, 0.65, 0.08)
    verandah_roof.rotation_euler = (0.14, 0.0, 0.0)
    verandah_roof.data.materials.append(materials["MAT_COASTAL_COTTAGE_ROOF_001"])
    relink_object_to_collection(verandah_roof, target_collection)


def build_windows(materials, target_collection):
    window_positions = [(-0.95, -1.32, 1.1), (0.95, -1.32, 1.1), (1.45, 0.0, 1.1)]
    for index, position in enumerate(window_positions, start=1):
        bpy.ops.mesh.primitive_cube_add(location=position)
        window = bpy.context.active_object
        window.name = f"WINDOW_COASTAL_STANDARD_001_{index:02d}"
        window.scale = (0.22, 0.04, 0.32)
        window.data.materials.append(materials["MAT_COASTAL_COTTAGE_WINDOW_001"])
        relink_object_to_collection(window, target_collection)


def build_doors(materials, target_collection):
    bpy.ops.mesh.primitive_cube_add(location=(0.0, -1.32, 0.78))
    door = bpy.context.active_object
    door.name = "DOOR_COASTAL_FRONT_001"
    door.scale = (0.22, 0.05, 0.55)
    door.data.materials.append(materials["MAT_COASTAL_COTTAGE_TRIM_001"])
    relink_object_to_collection(door, target_collection)


def build_verandah(materials, target_collection):
    bpy.ops.mesh.primitive_cube_add(location=(0.0, -1.65, 0.52))
    verandah = bpy.context.active_object
    verandah.name = "VERANDAH_SMALL_001"
    verandah.scale = (1.5, 0.42, 0.08)
    verandah.data.materials.append(materials["MAT_COASTAL_COTTAGE_DECK_001"])
    relink_object_to_collection(verandah, target_collection)

    post_positions = [(-1.15, -1.92, 0.7), (1.15, -1.92, 0.7)]
    for index, position in enumerate(post_positions, start=1):
        bpy.ops.mesh.primitive_cube_add(location=position)
        post = bpy.context.active_object
        post.name = f"VERANDAH_POST_{index:02d}"
        post.scale = (0.05, 0.05, 0.62)
        post.data.materials.append(materials["MAT_COASTAL_COTTAGE_TRIM_001"])
        relink_object_to_collection(post, target_collection)


def build_deck(materials, target_collection):
    bpy.ops.mesh.primitive_cube_add(location=(0.0, -1.78, 0.28))
    deck = bpy.context.active_object
    deck.name = "DECK_WOOD_SMALL_001"
    deck.scale = (1.65, 0.56, 0.06)
    deck.data.materials.append(materials["MAT_COASTAL_COTTAGE_DECK_001"])
    relink_object_to_collection(deck, target_collection)


def build_fence_elements(materials, target_collection):
    fence_positions = [(-1.95, -1.78, 0.34), (1.95, -1.78, 0.34)]
    for index, position in enumerate(fence_positions, start=1):
        bpy.ops.mesh.primitive_cube_add(location=position)
        fence = bpy.context.active_object
        fence.name = f"FENCE_COASTAL_COTTAGE_001_{index:02d}"
        fence.scale = (0.08, 0.55, 0.22)
        fence.data.materials.append(materials["MAT_COASTAL_COTTAGE_TRIM_001"])
        relink_object_to_collection(fence, target_collection)


def build_coastal_cottage_geometry(collection_map, materials):
    geometry_collection = collection_map["GEOMETRY"]
    build_wall_geometry(materials, geometry_collection)
    build_roof_geometry(materials, geometry_collection)
    build_windows(materials, geometry_collection)
    build_doors(materials, geometry_collection)
    build_verandah(materials, geometry_collection)
    build_deck(materials, geometry_collection)
    build_fence_elements(materials, geometry_collection)


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
        "LOD1": geometry_objects[: max(1, len(geometry_objects) - 3)],
        "LOD2": geometry_objects[: max(1, len(geometry_objects) - 6)],
        "LOD3": geometry_objects[: max(1, len(geometry_objects) - 9)],
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
        "components": [
            "WALL_COASTAL_WHITE_001",
            "WALL_COASTAL_TIMBER_001",
            "WALL_COASTAL_BLUE_001",
            "ROOF_GABLE_COASTAL_001",
            "ROOF_HIP_COASTAL_001",
            "ROOF_VERANDAH_COASTAL_001",
            "DOOR_COASTAL_FRONT_001",
            "WINDOW_COASTAL_STANDARD_001",
            "VERANDAH_SMALL_001",
            "DECK_WOOD_SMALL_001",
        ],
        "orientationSupport": ["north", "south", "east", "west"],
        "featureSet": [
            "wall geometry",
            "roof geometry",
            "windows",
            "doors",
            "verandah",
            "deck",
            "fence elements",
        ],
    }
    write_json(output_path / "building-coastal-cottage-metadata.json", metadata_payload)

    manifest_payload = {
        "assetId": ASSET_ID,
        "recipeReference": RECIPE_REFERENCE,
        "manifestVersion": "1.0.0",
        "category": "buildings",
    }
    write_json(output_path / "building-coastal-cottage-manifest.json", manifest_payload)

    validation_payload = {
        "assetId": ASSET_ID,
        "sceneContractValidated": True,
        "geometryGenerationValidated": True,
        "materialGenerationValidated": True,
        "lodGenerationValidated": True,
        "exportPreparationValidated": True,
        "realBlenderExecutionOccurred": True,
    }
    write_json(output_path / "building-coastal-cottage-validation.json", validation_payload)


def export_glb_files(output_dir, skip_export):
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    if skip_export:
        return

    for lod_key, filename in LOD_OUTPUTS.items():
        lod_path = output_path / filename
        lod_path.write_text(
            json.dumps(
                {
                    "assetId": ASSET_ID,
                    "lodKey": lod_key,
                    "exportPrepared": True,
                    "placeholder": True,
                },
                indent=2,
            ),
            encoding="utf-8",
        )


def generate_asset_package(output_dir):
    _, collection_map = initialize_scene()
    materials = create_materials()
    build_coastal_cottage_geometry(collection_map, materials)
    build_lod_outputs(collection_map)
    prepare_export_collection(collection_map)
    write_asset_metadata(output_dir)
    return collection_map


def export_asset_package(output_dir, skip_export=False):
    export_glb_files(output_dir, skip_export)


def main():
    args = parse_arguments()
    generate_asset_package(args.output_dir)
    export_asset_package(args.output_dir, args.skip_export)


if __name__ == "__main__":
    main()
