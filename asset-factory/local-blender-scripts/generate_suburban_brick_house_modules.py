"""
GrowGo controlled Layer A module batch generator for the suburban brick house set.

This script is intended to be executed locally with Blender Python.
It creates and exports the first reusable suburban residential Layer A modules
required for:

- RECIPE_HOUSE_SUBURBAN_BRICK_001
- BUILDING_HOUSE_SUBURBAN_BRICK_001
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

import bpy


BATCH_ID = "SUBURBAN_BRICK_HOUSE_MODULE_BATCH_001"
OUTPUT_DEFAULT = "/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/SUBURBAN_BRICK_HOUSE_MODULE_BATCH_001/export"

MODULE_SPECS = {
    "MOD_WALL_BRICK_SUBURBAN_001": {
        "category": "STRUCTURE",
        "family": "WALL_RESIDENTIAL_SUBURBAN",
        "variants": [
            "standard_red_brick_wall",
            "cream_brick_wall",
            "dark_suburban_brick_wall",
            "entry_ready_brick_wall",
        ],
        "materials": [
            "MAT_BRICK_RED_001",
            "MAT_BRICK_CREAM_001",
            "MAT_BRICK_BROWN_001",
            "MAT_WINDOW_FRAME_DARK_001",
        ],
        "compatibleRecipes": [
            "RECIPE_HOUSE_SUBURBAN_BRICK_001",
            "RECIPE_TOWNHOUSE_SUBURBAN_001",
            "RECIPE_DUPLEX_SUBURBAN_001",
        ],
        "lodProfile": {"close": "LOD_CLOSE", "gameplay": "LOD_GAMEPLAY", "map": "LOD_MAP"},
    },
    "MOD_ROOF_TILE_STANDARD_001": {
        "category": "ROOF",
        "family": "ROOF_RESIDENTIAL_SUBURBAN",
        "variants": [
            "hip_tile_roof",
            "gable_tile_roof",
            "garage_integrated_roof",
            "wider_double_front_roof",
        ],
        "materials": [
            "MAT_ROOF_TILE_TERRACOTTA_001",
            "MAT_ROOF_TILE_CHARCOAL_001",
            "MAT_FASCIA_CREAM_001",
        ],
        "compatibleRecipes": [
            "RECIPE_HOUSE_SUBURBAN_BRICK_001",
            "RECIPE_TOWNHOUSE_SUBURBAN_001",
            "RECIPE_VILLA_SUBURBAN_001",
        ],
        "lodProfile": {"close": "LOD_CLOSE", "gameplay": "LOD_GAMEPLAY", "map": "LOD_MAP"},
    },
    "MOD_GARAGE_RESIDENTIAL_STANDARD_001": {
        "category": "EXTERIOR_FRONTAGE",
        "family": "GARAGE_RESIDENTIAL_SUBURBAN",
        "variants": [
            "single_garage_front",
            "double_garage_front",
            "recessed_garage_front",
            "side_access_garage_front",
        ],
        "materials": [
            "MAT_GARAGE_PANEL_WHITE_001",
            "MAT_GARAGE_PANEL_CHARCOAL_001",
            "MAT_CONCRETE_DRIVEWAY_001",
        ],
        "compatibleRecipes": [
            "RECIPE_HOUSE_SUBURBAN_BRICK_001",
            "RECIPE_TOWNHOUSE_SUBURBAN_001",
            "RECIPE_WORKSHOP_RESIDENTIAL_001",
        ],
        "lodProfile": {"close": "LOD_CLOSE", "gameplay": "LOD_GAMEPLAY", "map": "LOD_MAP"},
    },
    "MOD_WINDOW_RESIDENTIAL_STANDARD_001": {
        "category": "OPENING",
        "family": "WINDOW_RESIDENTIAL_STANDARD",
        "variants": [
            "single_standard_window",
            "double_standard_window",
            "tall_narrow_window",
            "dark_frame_standard_window",
        ],
        "materials": [
            "MAT_WINDOW_FRAME_WHITE_001",
            "MAT_WINDOW_FRAME_DARK_001",
            "MAT_GLASS_RESIDENTIAL_001",
        ],
        "compatibleRecipes": [
            "RECIPE_HOUSE_SUBURBAN_BRICK_001",
            "RECIPE_APARTMENT_LOWRISE_001",
            "RECIPE_TOWNHOUSE_SUBURBAN_001",
        ],
        "lodProfile": {"close": "LOD_CLOSE", "gameplay": "LOD_GAMEPLAY", "map": "LOD_MAP"},
    },
    "MOD_LETTERBOX_STANDARD_001": {
        "category": "STREET_EDGE_PROP",
        "family": "LETTERBOX_RESIDENTIAL_STANDARD",
        "variants": [
            "brick_pillar_letterbox",
            "rendered_letterbox",
            "post_mounted_letterbox",
            "garden_edge_letterbox",
        ],
        "materials": [
            "MAT_BRICK_RED_001",
            "MAT_RENDER_CREAM_001",
            "MAT_MAILBOX_DARK_001",
        ],
        "compatibleRecipes": [
            "RECIPE_HOUSE_SUBURBAN_BRICK_001",
            "RECIPE_VILLA_SUBURBAN_001",
            "RECIPE_ESTATES_STREETSCAPE_001",
        ],
        "lodProfile": {"close": "LOD_CLOSE", "gameplay": "LOD_GAMEPLAY", "map": "LOD_MAP"},
    },
    "MOD_ENTRY_PATH_SUBURBAN_001": {
        "category": "SITE_CONNECTION",
        "family": "PATH_RESIDENTIAL_SUBURBAN",
        "variants": [
            "straight_entry_path",
            "driveway_to_porch_entry",
            "split_garden_entry_path",
            "offset_front_entry_path",
        ],
        "materials": [
            "MAT_PATH_CONCRETE_LIGHT_001",
            "MAT_PATH_PAVER_SUBURBAN_001",
        ],
        "compatibleRecipes": [
            "RECIPE_HOUSE_SUBURBAN_BRICK_001",
            "RECIPE_TOWNHOUSE_SUBURBAN_001",
            "RECIPE_VILLA_SUBURBAN_001",
        ],
        "lodProfile": {"close": "LOD_CLOSE", "gameplay": "LOD_GAMEPLAY", "map": "LOD_MAP"},
    },
}

COLLECTION_NAMES = ["GEOMETRY", "MATERIALS", "LOD0", "LOD1", "LOD2", "EXPORT"]
LOD_EXPORTS = {"close": "LOD_CLOSE", "gameplay": "LOD_GAMEPLAY", "map": "LOD_MAP"}
LOD_COLLECTIONS = {"close": "LOD0", "gameplay": "LOD1", "map": "LOD2"}
MODULE_SLUGS = {
    "MOD_WALL_BRICK_SUBURBAN_001": "mod-wall-brick-suburban-001",
    "MOD_ROOF_TILE_STANDARD_001": "mod-roof-tile-standard-001",
    "MOD_GARAGE_RESIDENTIAL_STANDARD_001": "mod-garage-residential-standard-001",
    "MOD_WINDOW_RESIDENTIAL_STANDARD_001": "mod-window-residential-standard-001",
    "MOD_LETTERBOX_STANDARD_001": "mod-letterbox-standard-001",
    "MOD_ENTRY_PATH_SUBURBAN_001": "mod-entry-path-suburban-001",
}


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Generate the suburban brick house Layer A module batch."
    )
    parser.add_argument("--output-dir", default=OUTPUT_DEFAULT)
    parser.add_argument("--auto-quit", action="store_true")
    args = parser.parse_args(extract_script_arguments())
    args.output_dir = str(Path(args.output_dir))
    return args


def extract_script_arguments():
    argv = list(sys.argv)
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
    for obj in list(bpy.data.objects):
        if obj.users == 0:
            bpy.data.objects.remove(obj)


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
    root = ensure_root_collection(BATCH_ID)
    collection_map = {}
    for collection_name in COLLECTION_NAMES:
        collection_map[collection_name] = ensure_child_collection(root, collection_name)
    return root, collection_map


def relink_object_to_collection(obj, target_collection):
    for collection in list(obj.users_collection):
        collection.objects.unlink(obj)
    target_collection.objects.link(obj)


def add_socket(parent, collection, socket_name, location):
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=location)
    socket = bpy.context.active_object
    socket.name = socket_name
    socket.parent = parent
    socket.empty_display_size = 0.08
    relink_object_to_collection(socket, collection)
    return socket


def create_materials():
    material_specs = [
        ("MAT_BRICK_RED_001", (0.66, 0.24, 0.18, 1.0), 0.88, False),
        ("MAT_BRICK_CREAM_001", (0.90, 0.86, 0.76, 1.0), 0.84, False),
        ("MAT_BRICK_BROWN_001", (0.47, 0.29, 0.21, 1.0), 0.90, False),
        ("MAT_WINDOW_FRAME_DARK_001", (0.19, 0.20, 0.23, 1.0), 0.44, False),
        ("MAT_WINDOW_FRAME_WHITE_001", (0.95, 0.95, 0.96, 1.0), 0.40, False),
        ("MAT_GLASS_RESIDENTIAL_001", (0.72, 0.84, 0.92, 1.0), 0.12, True),
        ("MAT_ROOF_TILE_TERRACOTTA_001", (0.66, 0.31, 0.21, 1.0), 0.78, False),
        ("MAT_ROOF_TILE_CHARCOAL_001", (0.24, 0.25, 0.28, 1.0), 0.70, False),
        ("MAT_FASCIA_CREAM_001", (0.94, 0.91, 0.85, 1.0), 0.52, False),
        ("MAT_GARAGE_PANEL_WHITE_001", (0.95, 0.95, 0.96, 1.0), 0.42, False),
        ("MAT_GARAGE_PANEL_CHARCOAL_001", (0.25, 0.26, 0.29, 1.0), 0.48, False),
        ("MAT_CONCRETE_DRIVEWAY_001", (0.76, 0.76, 0.76, 1.0), 0.92, False),
        ("MAT_RENDER_CREAM_001", (0.93, 0.90, 0.84, 1.0), 0.65, False),
        ("MAT_MAILBOX_DARK_001", (0.18, 0.19, 0.22, 1.0), 0.52, False),
        ("MAT_PATH_CONCRETE_LIGHT_001", (0.83, 0.83, 0.82, 1.0), 0.94, False),
        ("MAT_PATH_PAVER_SUBURBAN_001", (0.67, 0.61, 0.55, 1.0), 0.87, False),
    ]
    materials = {}
    for material_name, base_color, roughness, is_glass in material_specs:
        material = bpy.data.materials.get(material_name)
        if material is None:
            material = bpy.data.materials.new(name=material_name)
        material.use_nodes = True
        principled = material.node_tree.nodes.get("Principled BSDF")
        if principled is not None:
            principled.inputs["Base Color"].default_value = base_color
            principled.inputs["Roughness"].default_value = roughness
            if is_glass:
                principled.inputs["Transmission Weight"].default_value = 0.88
                principled.inputs["IOR"].default_value = 1.45
        materials[material_name] = material
    return materials


def create_box(name, collection, location, scale, material, rotation=(0.0, 0.0, 0.0)):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    if material is not None:
        obj.data.materials.append(material)
    relink_object_to_collection(obj, collection)
    return obj


def create_cylinder(name, collection, location, radius, depth, material, rotation=(0.0, 0.0, 0.0)):
    bpy.ops.mesh.primitive_cylinder_add(
        location=location, radius=radius, depth=depth, rotation=rotation
    )
    obj = bpy.context.active_object
    obj.name = name
    if material is not None:
        obj.data.materials.append(material)
    relink_object_to_collection(obj, collection)
    return obj


def create_variant_root(module_id, variant_name, collection, lod_key):
    root = bpy.data.objects.new(f"{module_id}_{variant_name}_{lod_key.upper()}_ROOT", None)
    collection.objects.link(root)
    return root


def build_wall_module(module_id, variant_name, lod_key, collection, materials):
    root = create_variant_root(module_id, variant_name, collection, lod_key)
    brick_material_name = "MAT_BRICK_RED_001" if "red" in variant_name or "entry" in variant_name else "MAT_BRICK_CREAM_001"
    wall = create_box(
        f"{module_id}_{variant_name}_WALL",
        collection,
        location=(0.0, 0.0, 1.5),
        scale=(1.5, 0.11, 1.5),
        material=materials[brick_material_name],
    )
    wall.parent = root
    if lod_key != "map":
        sill = create_box(
            f"{module_id}_{variant_name}_SILL",
            collection,
            location=(0.0, -0.13, 1.0),
            scale=(0.6, 0.03, 0.06),
            material=materials["MAT_WINDOW_FRAME_DARK_001"],
        )
        sill.parent = root
    add_socket(root, collection, "SOCKET_TOP_EDGE", (0.0, 0.0, 3.0))
    add_socket(root, collection, "SOCKET_BOTTOM_EDGE", (0.0, 0.0, 0.0))
    add_socket(root, collection, "SOCKET_LEFT_EDGE", (-1.5, 0.0, 1.5))
    add_socket(root, collection, "SOCKET_RIGHT_EDGE", (1.5, 0.0, 1.5))
    add_socket(root, collection, "SOCKET_WINDOW_STANDARD", (0.0, -0.11, 1.4))
    add_socket(root, collection, "SOCKET_DOOR_STANDARD", (0.6, -0.11, 1.0))
    return root


def build_roof_module(module_id, variant_name, lod_key, collection, materials):
    root = create_variant_root(module_id, variant_name, collection, lod_key)
    roof = create_box(
        f"{module_id}_{variant_name}_ROOF",
        collection,
        location=(0.0, 0.0, 0.65),
        scale=(1.65, 1.05, 0.25 if lod_key == "map" else 0.35),
        material=materials["MAT_ROOF_TILE_TERRACOTTA_001" if "gable" in variant_name else "MAT_ROOF_TILE_CHARCOAL_001"],
        rotation=(0.22, 0.0, 0.0),
    )
    roof.parent = root
    if lod_key != "map":
        fascia = create_box(
            f"{module_id}_{variant_name}_FASCIA",
            collection,
            location=(0.0, 0.0, 0.28),
            scale=(1.7, 1.08, 0.04),
            material=materials["MAT_FASCIA_CREAM_001"],
        )
        fascia.parent = root
    add_socket(root, collection, "SOCKET_ROOF_BASE", (0.0, 0.0, 0.0))
    add_socket(root, collection, "SOCKET_ROOF_RIDGE", (0.0, 0.0, 1.05))
    add_socket(root, collection, "SOCKET_GARAGE_ALIGNMENT", (1.25, 0.0, 0.3))
    return root


def build_garage_module(module_id, variant_name, lod_key, collection, materials):
    root = create_variant_root(module_id, variant_name, collection, lod_key)
    shell = create_box(
        f"{module_id}_{variant_name}_SHELL",
        collection,
        location=(0.0, 0.0, 1.0),
        scale=(1.65 if "double" in variant_name else 1.2, 0.7, 1.0),
        material=materials["MAT_RENDER_CREAM_001"],
    )
    shell.parent = root
    door = create_box(
        f"{module_id}_{variant_name}_DOOR",
        collection,
        location=(0.0, -0.72, 0.95),
        scale=(1.2 if "double" in variant_name else 0.86, 0.04, 0.82),
        material=materials["MAT_GARAGE_PANEL_CHARCOAL_001" if "recessed" in variant_name else "MAT_GARAGE_PANEL_WHITE_001"],
    )
    door.parent = root
    if lod_key == "close":
        pad = create_box(
            f"{module_id}_{variant_name}_PAD",
            collection,
            location=(0.0, 1.0, 0.02),
            scale=(1.2, 1.0, 0.02),
            material=materials["MAT_CONCRETE_DRIVEWAY_001"],
        )
        pad.parent = root
    add_socket(root, collection, "SOCKET_DRIVEWAY_CONNECTION", (0.0, 1.9, 0.0))
    add_socket(root, collection, "SOCKET_FRONTAGE_ALIGNMENT", (0.0, -0.72, 1.0))
    add_socket(root, collection, "SOCKET_WALL_CONNECTION", (-1.2, 0.0, 1.0))
    return root


def build_window_module(module_id, variant_name, lod_key, collection, materials):
    root = create_variant_root(module_id, variant_name, collection, lod_key)
    frame_width = 0.95 if "double" in variant_name else 0.6
    frame = create_box(
        f"{module_id}_{variant_name}_FRAME",
        collection,
        location=(0.0, 0.0, 0.9),
        scale=(frame_width, 0.05, 0.7 if "tall" in variant_name else 0.55),
        material=materials["MAT_WINDOW_FRAME_DARK_001" if "dark" in variant_name else "MAT_WINDOW_FRAME_WHITE_001"],
    )
    frame.parent = root
    glass = create_box(
        f"{module_id}_{variant_name}_GLASS",
        collection,
        location=(0.0, -0.01, 0.9),
        scale=(frame_width * 0.82, 0.03, 0.48 if "tall" in variant_name else 0.36),
        material=materials["MAT_GLASS_RESIDENTIAL_001"],
    )
    glass.parent = root
    add_socket(root, collection, "SOCKET_WALL_OPENING", (0.0, 0.0, 0.9))
    add_socket(root, collection, "SOCKET_SILL_ALIGNMENT", (0.0, -0.05, 0.34))
    return root


def build_letterbox_module(module_id, variant_name, lod_key, collection, materials):
    root = create_variant_root(module_id, variant_name, collection, lod_key)
    pillar = create_box(
        f"{module_id}_{variant_name}_BODY",
        collection,
        location=(0.0, 0.0, 0.5),
        scale=(0.18, 0.12, 0.5 if "post" not in variant_name else 0.38),
        material=materials["MAT_BRICK_RED_001" if "brick" in variant_name else "MAT_RENDER_CREAM_001"],
    )
    pillar.parent = root
    cap = create_box(
        f"{module_id}_{variant_name}_CAP",
        collection,
        location=(0.0, 0.0, 0.95),
        scale=(0.22, 0.14, 0.06),
        material=materials["MAT_MAILBOX_DARK_001"],
    )
    cap.parent = root
    add_socket(root, collection, "SOCKET_FENCE_ALIGNMENT", (0.0, 0.0, 0.45))
    add_socket(root, collection, "SOCKET_STREET_EDGE", (0.0, -0.16, 0.45))
    return root


def build_entry_path_module(module_id, variant_name, lod_key, collection, materials):
    root = create_variant_root(module_id, variant_name, collection, lod_key)
    main_path = create_box(
        f"{module_id}_{variant_name}_PATH",
        collection,
        location=(0.0, 0.0, 0.02),
        scale=(1.25 if "split" in variant_name else 1.1, 0.26, 0.02),
        material=materials["MAT_PATH_PAVER_SUBURBAN_001" if "split" in variant_name else "MAT_PATH_CONCRETE_LIGHT_001"],
    )
    main_path.parent = root
    if lod_key != "map" and ("split" in variant_name or "driveway" in variant_name):
        branch = create_box(
            f"{module_id}_{variant_name}_BRANCH",
            collection,
            location=(0.78, 0.45, 0.02),
            scale=(0.35, 0.18, 0.02),
            material=materials["MAT_PATH_PAVER_SUBURBAN_001"],
        )
        branch.parent = root
    add_socket(root, collection, "SOCKET_ROAD_FRONTAGE", (0.0, -1.1, 0.0))
    add_socket(root, collection, "SOCKET_ENTRY_CONNECTION", (0.0, 1.1, 0.0))
    add_socket(root, collection, "SOCKET_DRIVEWAY_ALIGNMENT", (0.78, 0.45, 0.0))
    return root


def build_module(module_id, variant_name, lod_key, collection, materials):
    if module_id == "MOD_WALL_BRICK_SUBURBAN_001":
        return build_wall_module(module_id, variant_name, lod_key, collection, materials)
    if module_id == "MOD_ROOF_TILE_STANDARD_001":
        return build_roof_module(module_id, variant_name, lod_key, collection, materials)
    if module_id == "MOD_GARAGE_RESIDENTIAL_STANDARD_001":
        return build_garage_module(module_id, variant_name, lod_key, collection, materials)
    if module_id == "MOD_WINDOW_RESIDENTIAL_STANDARD_001":
        return build_window_module(module_id, variant_name, lod_key, collection, materials)
    if module_id == "MOD_LETTERBOX_STANDARD_001":
        return build_letterbox_module(module_id, variant_name, lod_key, collection, materials)
    if module_id == "MOD_ENTRY_PATH_SUBURBAN_001":
        return build_entry_path_module(module_id, variant_name, lod_key, collection, materials)
    raise ValueError(f"Unsupported module ID: {module_id}")


def build_module_batch(collection_map, materials):
    batch_roots = {}
    for module_id, module_spec in MODULE_SPECS.items():
        lod_roots = {}
        for lod_key, lod_name in LOD_EXPORTS.items():
            lod_collection = collection_map[LOD_COLLECTIONS[lod_key]]
            variant_roots = []
            for variant_name in module_spec["variants"]:
                variant_roots.append(
                    build_module(module_id, variant_name, lod_key, lod_collection, materials)
                )
            export_root = bpy.data.objects.new(f"{module_id}_{lod_name}_EXPORT", None)
            collection_map["EXPORT"].objects.link(export_root)
            for variant_root in variant_roots:
                variant_root.parent = export_root
            lod_roots[lod_key] = export_root
        batch_roots[module_id] = lod_roots
    return batch_roots


def select_hierarchy(root):
    root.select_set(True)
    for child in root.children_recursive:
        child.select_set(True)


def export_module(module_id, lod_key, root, output_dir):
    bpy.ops.object.select_all(action="DESELECT")
    select_hierarchy(root)
    bpy.context.view_layer.objects.active = root
    filename = f"{module_id}_{LOD_EXPORTS[lod_key]}.glb"
    bpy.ops.export_scene.gltf(
        filepath=str(output_dir / filename),
        export_format="GLB",
        use_selection=True,
    )
    return filename


def write_module_metadata(output_dir, module_id, module_spec):
    slug = MODULE_SLUGS[module_id]
    metadata_path = output_dir / f"{slug}-metadata.json"
    validation_path = output_dir / f"{slug}-validation.json"

    metadata = {
        "assetId": module_id,
        "batchId": BATCH_ID,
        "category": module_spec["category"],
        "family": module_spec["family"],
        "variants": module_spec["variants"],
        "materialReferences": module_spec["materials"],
        "compatibleRecipes": module_spec["compatibleRecipes"],
        "lodMappings": {
            lod_name: f"{module_id}_{lod_name}.glb" for lod_name in LOD_EXPORTS.values()
        },
        "localBlenderExecutionOnly": True,
    }

    validation = {
        "assetId": module_id,
        "batchId": BATCH_ID,
        "validationStatus": "READY_FOR_LOCAL_BLENDER_EXECUTION",
        "checks": {
            "socketDefinitionsPresent": True,
            "lodCoveragePlanned": True,
            "metadataPrepared": True,
            "exportContractPrepared": True,
        },
    }

    metadata_path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    validation_path.write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")


def write_batch_records(output_dir, exported_filenames):
    manifest = {
        "batchId": BATCH_ID,
        "moduleIds": list(MODULE_SPECS.keys()),
        "moduleSlugMap": MODULE_SLUGS,
        "expectedExportCount": len(MODULE_SPECS) * len(LOD_EXPORTS),
        "exportedFiles": exported_filenames,
        "localBlenderExecutionOnly": True,
    }
    validation = {
        "batchId": BATCH_ID,
        "validationStatus": "READY_FOR_LOCAL_BLENDER_EXECUTION",
        "checks": {
            "collectionsCreated": True,
            "geometryCreated": True,
            "materialsCreated": True,
            "lodRootsCreated": True,
            "metadataWritten": True,
            "registrationPrepared": True,
        },
    }
    registration = {
        "batchId": BATCH_ID,
        "status": "PENDING_LOCAL_BLENDER_VALIDATION",
        "registeredModuleIds": list(MODULE_SPECS.keys()),
        "futureRecipeUnlocks": [
            "BUILDING_HOUSE_SUBURBAN_BRICK_001",
            "future suburban townhouses",
            "future suburban duplexes",
            "future low-rise brick apartments",
        ],
    }

    (output_dir / "suburban-brick-house-module-batch-1-manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )
    (output_dir / "suburban-brick-house-module-batch-1-validation.json").write_text(
        json.dumps(validation, indent=2) + "\n",
        encoding="utf-8",
    )
    (output_dir / "suburban-brick-house-module-batch-1-registration.json").write_text(
        json.dumps(registration, indent=2) + "\n",
        encoding="utf-8",
    )


def main():
    args = parse_arguments()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    _, collection_map = initialize_scene()
    materials = create_materials()
    batch_roots = build_module_batch(collection_map, materials)

    exported_filenames = []
    for module_id, lod_roots in batch_roots.items():
        for lod_key, root in lod_roots.items():
            exported_filenames.append(export_module(module_id, lod_key, root, output_dir))
        write_module_metadata(output_dir, module_id, MODULE_SPECS[module_id])

    write_batch_records(output_dir, exported_filenames)

    if args.auto_quit:
        bpy.ops.wm.quit_blender()


if __name__ == "__main__":
    main()
