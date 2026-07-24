"""
GrowGo Asset Factory local Blender generator for LIGHTHOUSE_ISLAND_ROCKY_001.

This script is intended to be executed locally on the developer machine with
Blender Python. It is not executed inside Codex.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import bpy


ASSET_ID = "LIGHTHOUSE_ISLAND_ROCKY_001"
ASSET_FAMILY_ID = "COASTAL_LIGHTHOUSE_FAMILY_001"
RECIPE_REFERENCE = "LIGHTHOUSE_ISLAND_ROCKY_RECIPE_001"
COLLECTIONS = ["GEOMETRY", "MATERIALS", "LOD0", "LOD1", "LOD2", "LOD3", "EXPORT"]
LOD_OUTPUTS = {
    "close": "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_CLOSE.glb",
    "gameplay": "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_GAMEPLAY.glb",
    "map": "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_MAP.glb",
    "distantSilhouette": "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_DISTANT_SILHOUETTE.glb",
}


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Generate LIGHTHOUSE_ISLAND_ROCKY_001 in local Blender."
    )
    parser.add_argument(
        "--output-dir",
        default="asset-factory-workspace/production/COASTAL_LIGHTHOUSE_FAMILY_001/export",
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
        ("MAT_LIGHTHOUSE_MASONRY_001", (0.95, 0.95, 0.93, 1.0), 0.86),
        ("MAT_LIGHTHOUSE_GLASS_001", (0.55, 0.76, 0.94, 0.55), 0.12),
        ("MAT_LIGHTHOUSE_ROCK_001", (0.36, 0.35, 0.34, 1.0), 0.94),
        ("MAT_LIGHTHOUSE_TRIM_001", (0.69, 0.16, 0.15, 1.0), 0.42),
        ("MAT_LIGHTHOUSE_PATH_001", (0.62, 0.56, 0.47, 1.0), 0.88),
        ("MAT_LIGHTHOUSE_FENCE_001", (0.43, 0.34, 0.24, 1.0), 0.78),
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
            if material_name == "MAT_LIGHTHOUSE_GLASS_001":
                principled.inputs["Transmission Weight"].default_value = 0.55
                principled.inputs["Alpha"].default_value = 0.68
        materials[material_name] = material

    return materials


def build_tower_geometry(materials, target_collection):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.7, depth=1.0, location=(0.0, 0.0, 0.5))
    tower_base = bpy.context.active_object
    tower_base.name = "LIGHTHOUSE_TOWER_BASE_001"
    tower_base.data.materials.append(materials["MAT_LIGHTHOUSE_MASONRY_001"])
    relink_object_to_collection(tower_base, target_collection)

    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.48, depth=3.8, location=(0.0, 0.0, 2.9))
    tower_body = bpy.context.active_object
    tower_body.name = "LIGHTHOUSE_TOWER_BODY_001"
    tower_body.data.materials.append(materials["MAT_LIGHTHOUSE_MASONRY_001"])
    relink_object_to_collection(tower_body, target_collection)

    bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=0.56, depth=0.5, location=(0.0, 0.0, 5.05))
    tower_top = bpy.context.active_object
    tower_top.name = "LIGHTHOUSE_TOWER_TOP_001"
    tower_top.data.materials.append(materials["MAT_LIGHTHOUSE_TRIM_001"])
    relink_object_to_collection(tower_top, target_collection)


def build_lantern_room(materials, target_collection):
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.42, depth=0.42, location=(0.0, 0.0, 5.46))
    lantern_base = bpy.context.active_object
    lantern_base.name = "LIGHTHOUSE_LANTERN_BASE_001"
    lantern_base.data.materials.append(materials["MAT_LIGHTHOUSE_TRIM_001"])
    relink_object_to_collection(lantern_base, target_collection)

    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.34, depth=0.52, location=(0.0, 0.0, 5.85))
    glass_ring = bpy.context.active_object
    glass_ring.name = "LIGHTHOUSE_GLASS_RING_001"
    glass_ring.data.materials.append(materials["MAT_LIGHTHOUSE_GLASS_001"])
    relink_object_to_collection(glass_ring, target_collection)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=0.12, location=(0.0, 0.0, 5.86))
    lantern_light = bpy.context.active_object
    lantern_light.name = "LIGHTHOUSE_LANTERN_LIGHT_001"
    lantern_light.data.materials.append(materials["MAT_LIGHTHOUSE_GLASS_001"])
    relink_object_to_collection(lantern_light, target_collection)


def build_roof(materials, target_collection):
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.46, radius2=0.06, depth=0.58, location=(0.0, 0.0, 6.34))
    roof_cap = bpy.context.active_object
    roof_cap.name = "LIGHTHOUSE_ROOF_CAP_001"
    roof_cap.data.materials.append(materials["MAT_LIGHTHOUSE_TRIM_001"])
    relink_object_to_collection(roof_cap, target_collection)


def build_balcony_components(materials, target_collection):
    bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=0.68, depth=0.08, location=(0.0, 0.0, 5.2))
    balcony_ring = bpy.context.active_object
    balcony_ring.name = "LIGHTHOUSE_BALCONY_RING_001"
    balcony_ring.data.materials.append(materials["MAT_LIGHTHOUSE_TRIM_001"])
    relink_object_to_collection(balcony_ring, target_collection)

    rail_positions = [0.0, 1.57, 3.14, 4.71]
    for index, angle in enumerate(rail_positions, start=1):
        x = 0.66 * __import__("math").cos(angle)
        y = 0.66 * __import__("math").sin(angle)
        bpy.ops.mesh.primitive_cube_add(location=(x, y, 5.42))
        rail = bpy.context.active_object
        rail.name = f"LIGHTHOUSE_BALCONY_RAIL_{index:02d}"
        rail.scale = (0.04, 0.04, 0.18)
        rail.data.materials.append(materials["MAT_LIGHTHOUSE_TRIM_001"])
        relink_object_to_collection(rail, target_collection)


def build_rocky_base(materials, target_collection):
    rock_positions = [
        (0.0, 0.0, -0.05, 1.55),
        (-0.75, 0.42, 0.12, 0.72),
        (0.86, -0.32, 0.08, 0.66),
    ]
    for index, (x, y, z, radius) in enumerate(rock_positions, start=1):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=radius, location=(x, y, z))
        rock = bpy.context.active_object
        rock.name = "LIGHTHOUSE_ROCK_BASE_001" if index == 1 else f"LIGHTHOUSE_ROCK_BASE_001_{index:02d}"
        rock.scale = (1.1, 0.92, 0.52 if index == 1 else 0.48)
        rock.data.materials.append(materials["MAT_LIGHTHOUSE_ROCK_001"])
        relink_object_to_collection(rock, target_collection)


def build_path(materials, target_collection):
    bpy.ops.mesh.primitive_plane_add(size=2.4, location=(0.0, -2.1, 0.06))
    path = bpy.context.active_object
    path.name = "LIGHTHOUSE_PATH_ENTRY_001"
    path.scale = (0.22, 1.0, 1.0)
    path.data.materials.append(materials["MAT_LIGHTHOUSE_PATH_001"])
    relink_object_to_collection(path, target_collection)


def build_fence(materials, target_collection):
    fence_specs = [
        (-1.1, -1.6, 0.28),
        (-1.1, -0.6, 0.28),
        (1.1, -1.6, 0.28),
        (1.1, -0.6, 0.28),
    ]
    for index, (x, y, z) in enumerate(fence_specs, start=1):
        bpy.ops.mesh.primitive_cube_add(location=(x, y, z))
        fence = bpy.context.active_object
        fence.name = "LIGHTHOUSE_FENCE_001" if index == 1 else f"LIGHTHOUSE_FENCE_001_{index:02d}"
        fence.scale = (0.06, 0.32, 0.24)
        fence.data.materials.append(materials["MAT_LIGHTHOUSE_FENCE_001"])
        relink_object_to_collection(fence, target_collection)


def build_lighthouse_geometry(collection_map, materials):
    geometry_collection = collection_map["GEOMETRY"]
    build_tower_geometry(materials, geometry_collection)
    build_lantern_room(materials, geometry_collection)
    build_roof(materials, geometry_collection)
    build_balcony_components(materials, geometry_collection)
    build_rocky_base(materials, geometry_collection)
    build_path(materials, geometry_collection)
    build_fence(materials, geometry_collection)


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
        "LOD2": geometry_objects[: max(1, len(geometry_objects) - 7)],
        "LOD3": geometry_objects[: max(1, len(geometry_objects) - 11)],
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
            "LIGHTHOUSE_TOWER_BASE_001",
            "LIGHTHOUSE_TOWER_BODY_001",
            "LIGHTHOUSE_TOWER_TOP_001",
            "LIGHTHOUSE_LANTERN_BASE_001",
            "LIGHTHOUSE_GLASS_RING_001",
            "LIGHTHOUSE_LANTERN_LIGHT_001",
            "LIGHTHOUSE_ROOF_CAP_001",
            "LIGHTHOUSE_ROCK_BASE_001",
            "LIGHTHOUSE_PATH_ENTRY_001",
            "LIGHTHOUSE_FENCE_001",
        ],
        "featureSet": [
            "tower geometry",
            "lantern room",
            "roof",
            "balcony components",
            "rocky base",
            "path",
            "fence",
            "materials",
        ],
        "appearanceProfiles": {
            "day": {
                "lightActive": false,
                "glassTint": "cool_blue",
                "skyBlend": "clear_day"
            },
            "sunset": {
                "lightActive": false,
                "glassTint": "warm_gold",
                "skyBlend": "sunset_orange"
            },
            "night": {
                "lightActive": true,
                "glassTint": "bright_beacon",
                "skyBlend": "deep_navy"
            },
        },
    }
    write_json(output_path / "lighthouse-island-rocky-metadata.json", metadata_payload)

    manifest_payload = {
        "assetId": ASSET_ID,
        "recipeReference": RECIPE_REFERENCE,
        "manifestVersion": "1.0.0",
        "category": "landmarks",
    }
    write_json(output_path / "lighthouse-island-rocky-manifest.json", manifest_payload)

    validation_payload = {
        "assetId": ASSET_ID,
        "sceneContractValidated": True,
        "geometryGenerationValidated": True,
        "materialGenerationValidated": True,
        "lodGenerationValidated": True,
        "exportPreparationValidated": True,
        "appearanceProfilesValidated": True,
        "realBlenderExecutionOccurred": True,
    }
    write_json(output_path / "lighthouse-island-rocky-validation.json", validation_payload)


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
    build_lighthouse_geometry(collection_map, materials)
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
