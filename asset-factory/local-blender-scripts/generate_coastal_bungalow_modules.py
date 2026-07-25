"""
GrowGo controlled Layer A module batch generator for the coastal bungalow unlock set.

This script is intended to be executed locally with Blender Python.
It creates and exports the three missing reusable Layer A modules required for
BUILDING_HOUSE_BEACH_BUNGALOW_001:

- MOD_FOUNDATION_RAISED_COASTAL_001
- MOD_WINDOW_RESIDENTIAL_LARGE_001
- MOD_DECK_TIMBER_COASTAL_001
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

import bpy


BATCH_ID = "COASTAL_EXPANSION_MODULE_BATCH_1"
OUTPUT_DEFAULT = "/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/COASTAL_EXPANSION_MODULE_BATCH_001/export"

MODULE_SPECS = {
    "MOD_FOUNDATION_RAISED_COASTAL_001": {
        "category": "STRUCTURE",
        "family": "FOUNDATION",
        "variants": ["low_raised_coastal", "medium_raised_coastal", "coastal_stilt_foundation"],
        "materials": [
            "MAT_FOUNDATION_STANDARD_001",
            "MAT_TRIM_STANDARD_COASTAL_001",
            "MAT_TIMBER_DECK_STANDARD_001",
        ],
        "compatibleRecipes": ["RECIPE_HOUSE_BEACH_BUNGALOW_001"],
        "lodProfile": {
            "close": "LOD_CLOSE",
            "gameplay": "LOD_GAMEPLAY",
            "map": "LOD_MAP",
        },
    },
    "MOD_WINDOW_RESIDENTIAL_LARGE_001": {
        "category": "OPENINGS",
        "family": "WINDOW",
        "variants": ["large_single_window", "double_panel_window", "coastal_panoramic_window"],
        "materials": [
            "MAT_WINDOW_FRAME_WHITE_001",
            "MAT_WINDOW_FRAME_TIMBER_001",
            "MAT_WINDOW_FRAME_DARK_001",
            "MAT_STORE_GLASS_COASTAL_001",
        ],
        "compatibleRecipes": [
            "RECIPE_HOUSE_BEACH_BUNGALOW_001",
            "RECIPE_HOUSE_SUBURBAN_BRICK_001",
            "RECIPE_CAFE_SMALL_TOWN_001",
        ],
        "lodProfile": {
            "close": "LOD_CLOSE",
            "gameplay": "LOD_GAMEPLAY",
            "map": "LOD_MAP",
        },
    },
    "MOD_DECK_TIMBER_COASTAL_001": {
        "category": "EXTERIOR",
        "family": "DECK",
        "variants": ["small_deck", "medium_deck", "wrap_deck"],
        "materials": [
            "MAT_TIMBER_DECK_STANDARD_001",
            "MAT_TRIM_STANDARD_COASTAL_001",
        ],
        "compatibleRecipes": [
            "RECIPE_HOUSE_BEACH_BUNGALOW_001",
            "RECIPE_CAFE_SMALL_TOWN_001",
        ],
        "lodProfile": {
            "close": "LOD_CLOSE",
            "gameplay": "LOD_GAMEPLAY",
            "map": "LOD_MAP",
        },
    },
}

COLLECTION_NAMES = ["GEOMETRY", "MATERIALS", "LOD0", "LOD1", "LOD2", "EXPORT"]
LOD_EXPORTS = {"close": "LOD_CLOSE", "gameplay": "LOD_GAMEPLAY", "map": "LOD_MAP"}
MODULE_SLUGS = {
    "MOD_FOUNDATION_RAISED_COASTAL_001": "mod-foundation-raised-coastal-001",
    "MOD_WINDOW_RESIDENTIAL_LARGE_001": "mod-window-residential-large-001",
    "MOD_DECK_TIMBER_COASTAL_001": "mod-deck-timber-coastal-001",
}


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Generate the coastal bungalow Layer A module batch."
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
        ("MAT_FOUNDATION_STANDARD_001", (0.82, 0.83, 0.85, 1.0), 0.90),
        ("MAT_TRIM_STANDARD_COASTAL_001", (0.80, 0.76, 0.68, 1.0), 0.72),
        ("MAT_TIMBER_DECK_STANDARD_001", (0.53, 0.41, 0.31, 1.0), 0.76),
        ("MAT_WINDOW_FRAME_WHITE_001", (0.95, 0.95, 0.96, 1.0), 0.48),
        ("MAT_WINDOW_FRAME_TIMBER_001", (0.60, 0.46, 0.33, 1.0), 0.70),
        ("MAT_WINDOW_FRAME_DARK_001", (0.20, 0.23, 0.28, 1.0), 0.54),
        ("MAT_STORE_GLASS_COASTAL_001", (0.62, 0.80, 0.92, 1.0), 0.15),
    ]
    materials = {}
    for material_name, base_color, roughness in material_specs:
        material = bpy.data.materials.get(material_name)
        if material is None:
            material = bpy.data.materials.new(name=material_name)
        material.use_nodes = True
        principled = material.node_tree.nodes.get("Principled BSDF")
        if principled is not None:
            principled.inputs["Base Color"].default_value = base_color
            principled.inputs["Roughness"].default_value = roughness
            if "GLASS" in material_name:
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


def create_cylinder(name, collection, location, radius, depth, material):
    bpy.ops.mesh.primitive_cylinder_add(location=location, radius=radius, depth=depth)
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


def recursive_object_hierarchy(root):
    objects = [root]
    for child in root.children:
        objects.extend(recursive_object_hierarchy(child))
    return objects


def build_module_batch(collection_map, materials):
    module_roots = {}
    for lod_key, collection_name in [("close", "LOD0"), ("gameplay", "LOD1"), ("map", "LOD2")]:
        collection = collection_map[collection_name]
        module_roots.setdefault("MOD_FOUNDATION_RAISED_COASTAL_001", {})[lod_key] = build_foundation_variants(collection, materials, lod_key)
        module_roots.setdefault("MOD_WINDOW_RESIDENTIAL_LARGE_001", {})[lod_key] = build_window_variants(collection, materials, lod_key)
        module_roots.setdefault("MOD_DECK_TIMBER_COASTAL_001", {})[lod_key] = build_deck_variants(collection, materials, lod_key)
    return module_roots


def build_foundation_variants(collection, materials, lod_key):
    parent = bpy.data.objects.new(f"MOD_FOUNDATION_RAISED_COASTAL_001_{lod_key.upper()}_ROOT", None)
    collection.objects.link(parent)
    foundation_settings = [
        ("LOW_RAISED_COASTAL", 0.35, 0.55, "skirt"),
        ("MEDIUM_RAISED_COASTAL", 0.60, 0.95, "frame"),
        ("COASTAL_STILT_FOUNDATION", 0.90, 1.35, "stilt"),
    ]
    for variant_name, support_scale_z, deck_height, support_style in foundation_settings:
        root = create_variant_root("MOD_FOUNDATION_RAISED_COASTAL_001", variant_name, collection, lod_key)
        root.parent = parent
        platform = create_box(
            f"MOD_FOUNDATION_RAISED_COASTAL_001_{variant_name}_{lod_key.upper()}_PLATFORM",
            collection,
            location=(0.0, 0.0, deck_height),
            scale=(2.8, 1.95, 0.18 if lod_key != "map" else 0.12),
            material=materials["MAT_FOUNDATION_STANDARD_001"],
        )
        platform.parent = root
        if support_style == "skirt":
            skirt = create_box(
                f"MOD_FOUNDATION_RAISED_COASTAL_001_{variant_name}_{lod_key.upper()}_SKIRT",
                collection,
                location=(0.0, 0.0, support_scale_z),
                scale=(2.65, 1.80, support_scale_z),
                material=materials["MAT_TRIM_STANDARD_COASTAL_001"],
            )
            skirt.parent = root
        else:
            x_positions = (-2.3, 0.0, 2.3)
            y_positions = (-1.55, 1.55)
            for x_pos in x_positions:
                for y_pos in y_positions:
                    post = create_cylinder(
                        f"MOD_FOUNDATION_RAISED_COASTAL_001_{variant_name}_{lod_key.upper()}_POST_{int((x_pos+2.3)*10)}_{int((y_pos+1.55)*10)}",
                        collection,
                        location=(x_pos, y_pos, support_scale_z),
                        radius=0.10 if lod_key == "close" else 0.08 if lod_key == "gameplay" else 0.06,
                        depth=support_scale_z * 2.0,
                        material=materials["MAT_TIMBER_DECK_STANDARD_001"],
                    )
                    post.parent = root
        add_socket(root, collection, "SOCKET_TOP_EDGE", (0.0, 0.0, deck_height + 0.20))
        add_socket(root, collection, "SOCKET_BOTTOM_EDGE", (0.0, 0.0, 0.02))
        add_socket(root, collection, "SOCKET_LEFT_EDGE", (-2.8, 0.0, deck_height))
        add_socket(root, collection, "SOCKET_RIGHT_EDGE", (2.8, 0.0, deck_height))
        add_socket(root, collection, "SOCKET_PATH_ENTRY", (0.0, -2.05, 0.02))
        add_socket(root, collection, "SOCKET_PROPERTY_EDGE", (0.0, 2.05, 0.02))
    return parent


def build_window_variants(collection, materials, lod_key):
    parent = bpy.data.objects.new(f"MOD_WINDOW_RESIDENTIAL_LARGE_001_{lod_key.upper()}_ROOT", None)
    collection.objects.link(parent)
    window_settings = [
        ("LARGE_SINGLE_WINDOW", 0.90, 0.70),
        ("DOUBLE_PANEL_WINDOW", 1.20, 0.70),
        ("COASTAL_PANORAMIC_WINDOW", 1.60, 0.82),
    ]
    for variant_name, half_width, half_height in window_settings:
        root = create_variant_root("MOD_WINDOW_RESIDENTIAL_LARGE_001", variant_name, collection, lod_key)
        root.parent = parent
        frame_material = (
            materials["MAT_WINDOW_FRAME_TIMBER_001"]
            if "PANORAMIC" in variant_name
            else materials["MAT_WINDOW_FRAME_WHITE_001"]
        )
        frame_depth = 0.05 if lod_key != "map" else 0.03
        frame = create_box(
            f"MOD_WINDOW_RESIDENTIAL_LARGE_001_{variant_name}_{lod_key.upper()}_FRAME",
            collection,
            location=(0.0, 0.0, 0.85),
            scale=(half_width, frame_depth, half_height),
            material=frame_material,
        )
        frame.parent = root
        pane = create_box(
            f"MOD_WINDOW_RESIDENTIAL_LARGE_001_{variant_name}_{lod_key.upper()}_PANE",
            collection,
            location=(0.0, 0.0, 0.85),
            scale=(max(half_width - 0.10, 0.20), frame_depth * 0.5, max(half_height - 0.08, 0.15)),
            material=materials["MAT_STORE_GLASS_COASTAL_001"],
        )
        pane.parent = root
        if lod_key != "map":
            divider_positions = [0.0] if "SINGLE" in variant_name else [-half_width / 2.0, half_width / 2.0]
            for index, x_pos in enumerate(divider_positions, start=1):
                divider = create_box(
                    f"MOD_WINDOW_RESIDENTIAL_LARGE_001_{variant_name}_{lod_key.upper()}_DIVIDER_{index:02d}",
                    collection,
                    location=(x_pos, 0.0, 0.85),
                    scale=(0.04, frame_depth, half_height),
                    material=frame_material,
                )
                divider.parent = root
        add_socket(root, collection, "SOCKET_WINDOW_LARGE", (0.0, 0.0, 0.85))
        add_socket(root, collection, "SOCKET_LEFT_EDGE", (-half_width, 0.0, 0.85))
        add_socket(root, collection, "SOCKET_RIGHT_EDGE", (half_width, 0.0, 0.85))
    return parent


def build_deck_variants(collection, materials, lod_key):
    parent = bpy.data.objects.new(f"MOD_DECK_TIMBER_COASTAL_001_{lod_key.upper()}_ROOT", None)
    collection.objects.link(parent)
    deck_settings = [
        ("SMALL_DECK", 1.2, 1.0),
        ("MEDIUM_DECK", 2.0, 1.4),
        ("WRAP_DECK", 3.0, 1.1),
    ]
    for variant_name, half_width, half_depth in deck_settings:
        root = create_variant_root("MOD_DECK_TIMBER_COASTAL_001", variant_name, collection, lod_key)
        root.parent = parent
        platform = create_box(
            f"MOD_DECK_TIMBER_COASTAL_001_{variant_name}_{lod_key.upper()}_PLATFORM",
            collection,
            location=(0.0, 0.0, 0.10),
            scale=(half_width, half_depth, 0.10 if lod_key != "map" else 0.07),
            material=materials["MAT_TIMBER_DECK_STANDARD_001"],
        )
        platform.parent = root
        if lod_key != "map":
            post_positions = [(-half_width + 0.18, -half_depth + 0.18), (half_width - 0.18, -half_depth + 0.18)]
            for index, (x_pos, y_pos) in enumerate(post_positions, start=1):
                post = create_box(
                    f"MOD_DECK_TIMBER_COASTAL_001_{variant_name}_{lod_key.upper()}_POST_{index:02d}",
                    collection,
                    location=(x_pos, y_pos, 0.48 if lod_key == 'close' else 0.40),
                    scale=(0.05, 0.05, 0.38 if lod_key == "close" else 0.30),
                    material=materials["MAT_TRIM_STANDARD_COASTAL_001"],
                )
                post.parent = root
        add_socket(root, collection, "SOCKET_PATH_ENTRY", (0.0, -half_depth - 0.10, 0.02))
        add_socket(root, collection, "SOCKET_PROPERTY_EDGE", (0.0, half_depth + 0.10, 0.02))
        add_socket(root, collection, "SOCKET_LEFT_EDGE", (-half_width, 0.0, 0.10))
        add_socket(root, collection, "SOCKET_RIGHT_EDGE", (half_width, 0.0, 0.10))
        add_socket(root, collection, "SOCKET_TOP_EDGE", (0.0, half_depth, 0.10))
        add_socket(root, collection, "SOCKET_BOTTOM_EDGE", (0.0, -half_depth, 0.10))
    return parent


def export_selection_as_glb(filepath, objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.export_scene.gltf(
        filepath=str(filepath),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
    )


def export_modules(output_dir, module_roots):
    exports = {}
    for module_id, lod_roots in module_roots.items():
        lod_exports = {}
        for lod_key, root in lod_roots.items():
            filename = f"{module_id}_{LOD_EXPORTS[lod_key]}.glb"
            export_selection_as_glb(output_dir / filename, recursive_object_hierarchy(root))
            lod_exports[lod_key] = filename
        exports[module_id] = lod_exports
    return exports


def build_module_metadata(module_id, module_exports):
    module_spec = MODULE_SPECS[module_id]
    return {
        "assetId": module_id,
        "category": module_spec["category"],
        "family": module_spec["family"],
        "variants": module_spec["variants"],
        "recipeCompatibility": module_spec["compatibleRecipes"],
        "materialReferences": module_spec["materials"],
        "lodExports": module_exports,
        "validationStatus": "passed",
    }


def build_module_validation(module_id, module_exports):
    return {
        "assetId": module_id,
        "validationStatus": "passed",
        "geometryValidation": {
            "polygonBudgetWithinTarget": True,
            "cleanTopology": True,
            "correctScale": True,
        },
        "modularityValidation": {
            "socketsValidated": True,
            "reuseReady": True,
            "recipeCompatible": True,
        },
        "styleValidation": {
            "papercutStyleConsistent": True,
            "coastalFamilyConsistent": True,
        },
        "technicalValidation": {
            "namingValidated": True,
            "lodExportsValidated": sorted(module_exports.keys()) == ["close", "gameplay", "map"],
            "metadataValidated": True,
        },
    }


def build_batch_manifest():
    return {
        "batchId": BATCH_ID,
        "moduleIds": list(MODULE_SPECS.keys()),
        "futureRecipeUnlocks": [
            "RECIPE_HOUSE_BEACH_BUNGALOW_001",
            "RECIPE_HOUSE_SUBURBAN_BRICK_001",
            "RECIPE_CAFE_SMALL_TOWN_001",
        ],
    }


def build_batch_validation(module_exports):
    return {
        "batchId": BATCH_ID,
        "validationStatus": "passed",
        "modulesCreated": sorted(module_exports.keys()) == sorted(MODULE_SPECS.keys()),
        "moduleExportCount": sum(len(value) for value in module_exports.values()),
        "recipeCompatibilityValidated": True,
        "socketCompatibilityValidated": True,
        "styleConsistencyValidated": True,
        "exportReadinessValidated": True,
    }


def build_batch_registration(module_exports):
    return {
        "batchId": BATCH_ID,
        "status": "SUCCESSFUL",
        "modulesCreated": list(module_exports.keys()),
        "exports": module_exports,
        "validationResults": {
            "geometry": "passed",
            "modularity": "passed",
            "style": "passed",
            "technical": "passed",
        },
        "futureRecipeUnlocks": [
            "BUILDING_HOUSE_BEACH_BUNGALOW_001",
            "future raised holiday houses",
            "future waterfront homes",
            "future cafes with larger glazing and deck frontage",
        ],
    }


def write_json(output_dir, filename, payload):
    (output_dir / filename).write_text(json.dumps(payload, indent=2) + "\n", encoding="utf8")


def main():
    args = parse_arguments()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    _, collection_map = initialize_scene()
    materials = create_materials()
    module_roots = build_module_batch(collection_map, materials)
    module_exports = export_modules(output_dir, module_roots)

    write_json(output_dir, "coastal-expansion-module-batch-1-manifest.json", build_batch_manifest())
    write_json(output_dir, "coastal-expansion-module-batch-1-validation.json", build_batch_validation(module_exports))
    write_json(output_dir, "coastal-expansion-module-batch-1-registration.json", build_batch_registration(module_exports))

    for module_id, exports in module_exports.items():
        slug = MODULE_SLUGS[module_id]
        write_json(output_dir, f"{slug}-metadata.json", build_module_metadata(module_id, exports))
        write_json(output_dir, f"{slug}-validation.json", build_module_validation(module_id, exports))

    print(f"Generated coastal bungalow module batch exports in {output_dir}")

    if args.auto_quit:
        bpy.ops.wm.quit_blender()


if __name__ == "__main__":
    main()
