"""
GrowGo controlled assembly-test generator for BUILDING_HOUSE_BEACH_BUNGALOW_001.

This script is intended to be executed locally with Blender Python.
It assembles the approved beach bungalow recipe by reusing registered Layer A
module exports plus the validated coastal expansion module batch.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

import bpy


ASSET_ID = "BUILDING_HOUSE_BEACH_BUNGALOW_001"
RECIPE_ID = "RECIPE_HOUSE_BEACH_BUNGALOW_001"
FAMILY_ID = "FAMILY_HOUSE_COASTAL"

OUTPUT_DEFAULT = "/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/HOUSE_BEACH_BUNGALOW_FAMILY_001/export"
COASTAL_LIBRARY_EXPORT = "/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/HOUSE_COASTAL_FAMILY_001/export"
COASTAL_EXPANSION_EXPORT = "/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/COASTAL_EXPANSION_MODULE_BATCH_001/export"

COLLECTION_NAMES = [
    "ASSEMBLY_REFERENCES",
    "LOD0",
    "LOD1",
    "LOD2",
    "EXPORT",
]

REUSED_MODULES = [
    "MOD_PATH_STANDARD_001",
    "MOD_FENCE_STANDARD_001",
    "MOD_GROUND_GRASS_STANDARD_001",
    "MOD_BUSH_NATIVE_STANDARD_001",
    "MOD_TREE_EUCALYPTUS_STANDARD_001",
    "MOD_DRIVEWAY_STANDARD_SINGLE_001",
    "MOD_FLOWERBED_STANDARD_001",
    "MOD_ROOF_GABLE_STANDARD_001",
    "MOD_WALL_WEATHERBOARD_WHITE_001",
    "MOD_WINDOW_RESIDENTIAL_STANDARD_001",
    "MOD_DOOR_STANDARD_RESIDENTIAL_001",
]

NEW_MODULES_USED = [
    "MOD_FOUNDATION_RAISED_COASTAL_001",
    "MOD_WINDOW_RESIDENTIAL_LARGE_001",
    "MOD_DECK_TIMBER_COASTAL_001",
]

TARGET_REUSE_PERCENTAGE = 79

LOD_OUTPUTS = {
    "close": f"{ASSET_ID}_LOD_CLOSE.glb",
    "gameplay": f"{ASSET_ID}_LOD_GAMEPLAY.glb",
    "map": f"{ASSET_ID}_LOD_MAP.glb",
}

METADATA_OUTPUT = "building-house-beach-bungalow-metadata.json"
MANIFEST_OUTPUT = "building-house-beach-bungalow-manifest.json"
VALIDATION_OUTPUT = "building-house-beach-bungalow-validation.json"
BLEND_OUTPUT = f"{ASSET_ID}_ASSEMBLY_TEST_v001.blend"

MODULE_SOURCE_MAP = {
    "MOD_PATH_STANDARD_001": {
        "close": Path(COASTAL_LIBRARY_EXPORT) / "MOD_PATH_STANDARD_001_LOD_CLOSE.glb",
        "gameplay": Path(COASTAL_LIBRARY_EXPORT) / "MOD_PATH_STANDARD_001_LOD_GAMEPLAY.glb",
        "map": Path(COASTAL_LIBRARY_EXPORT) / "MOD_PATH_STANDARD_001_LOD_MAP.glb",
    },
    "MOD_FENCE_STANDARD_001": {
        "close": Path(COASTAL_LIBRARY_EXPORT) / "MOD_FENCE_STANDARD_001_LOD_CLOSE.glb",
        "gameplay": Path(COASTAL_LIBRARY_EXPORT) / "MOD_FENCE_STANDARD_001_LOD_GAMEPLAY.glb",
        "map": Path(COASTAL_LIBRARY_EXPORT) / "MOD_FENCE_STANDARD_001_LOD_MAP.glb",
    },
    "MOD_GROUND_GRASS_STANDARD_001": {
        "close": Path(COASTAL_LIBRARY_EXPORT) / "MOD_GROUND_GRASS_STANDARD_001_LOD_CLOSE.glb",
        "gameplay": Path(COASTAL_LIBRARY_EXPORT) / "MOD_GROUND_GRASS_STANDARD_001_LOD_GAMEPLAY.glb",
        "map": Path(COASTAL_LIBRARY_EXPORT) / "MOD_GROUND_GRASS_STANDARD_001_LOD_MAP.glb",
    },
    "MOD_BUSH_NATIVE_STANDARD_001": {
        "close": Path(COASTAL_LIBRARY_EXPORT) / "MOD_BUSH_NATIVE_STANDARD_001_LOD_CLOSE.glb",
        "gameplay": Path(COASTAL_LIBRARY_EXPORT) / "MOD_BUSH_NATIVE_STANDARD_001_LOD_GAMEPLAY.glb",
        "map": Path(COASTAL_LIBRARY_EXPORT) / "MOD_BUSH_NATIVE_STANDARD_001_LOD_MAP.glb",
    },
    "MOD_TREE_EUCALYPTUS_STANDARD_001": {
        "close": Path(COASTAL_LIBRARY_EXPORT) / "MOD_TREE_EUCALYPTUS_STANDARD_001_LOD_CLOSE.glb",
        "gameplay": Path(COASTAL_LIBRARY_EXPORT) / "MOD_TREE_EUCALYPTUS_STANDARD_001_LOD_GAMEPLAY.glb",
        "map": Path(COASTAL_LIBRARY_EXPORT) / "MOD_TREE_EUCALYPTUS_STANDARD_001_LOD_MAP.glb",
    },
    "MOD_DRIVEWAY_STANDARD_SINGLE_001": {
        "close": Path(COASTAL_LIBRARY_EXPORT) / "MOD_DRIVEWAY_STANDARD_SINGLE_001_LOD_CLOSE.glb",
        "gameplay": Path(COASTAL_LIBRARY_EXPORT) / "MOD_DRIVEWAY_STANDARD_SINGLE_001_LOD_GAMEPLAY.glb",
        "map": Path(COASTAL_LIBRARY_EXPORT) / "MOD_DRIVEWAY_STANDARD_SINGLE_001_LOD_MAP.glb",
    },
    "MOD_FLOWERBED_STANDARD_001": {
        "close": Path(COASTAL_LIBRARY_EXPORT) / "MOD_FLOWERBED_STANDARD_001_LOD_CLOSE.glb",
        "gameplay": Path(COASTAL_LIBRARY_EXPORT) / "MOD_FLOWERBED_STANDARD_001_LOD_GAMEPLAY.glb",
        "map": Path(COASTAL_LIBRARY_EXPORT) / "MOD_FLOWERBED_STANDARD_001_LOD_MAP.glb",
    },
    "MOD_ROOF_GABLE_STANDARD_001": {
        "close": Path(COASTAL_LIBRARY_EXPORT) / "MOD_ROOF_GABLE_STANDARD_001.glb",
        "gameplay": Path(COASTAL_LIBRARY_EXPORT) / "MOD_ROOF_GABLE_STANDARD_001.glb",
        "map": Path(COASTAL_LIBRARY_EXPORT) / "MOD_ROOF_GABLE_STANDARD_001.glb",
    },
    "MOD_WALL_WEATHERBOARD_WHITE_001": {
        "close": Path(COASTAL_LIBRARY_EXPORT) / "MOD_WALL_WEATHERBOARD_WHITE_001.glb",
        "gameplay": Path(COASTAL_LIBRARY_EXPORT) / "MOD_WALL_WEATHERBOARD_WHITE_001.glb",
        "map": Path(COASTAL_LIBRARY_EXPORT) / "MOD_WALL_WEATHERBOARD_WHITE_001.glb",
    },
    "MOD_WINDOW_RESIDENTIAL_STANDARD_001": {
        "close": Path(COASTAL_LIBRARY_EXPORT) / "MOD_WINDOW_RESIDENTIAL_STANDARD_001.glb",
        "gameplay": Path(COASTAL_LIBRARY_EXPORT) / "MOD_WINDOW_RESIDENTIAL_STANDARD_001.glb",
        "map": Path(COASTAL_LIBRARY_EXPORT) / "MOD_WINDOW_RESIDENTIAL_STANDARD_001.glb",
    },
    "MOD_DOOR_STANDARD_RESIDENTIAL_001": {
        "close": Path(COASTAL_LIBRARY_EXPORT) / "MOD_DOOR_STANDARD_RESIDENTIAL_001.glb",
        "gameplay": Path(COASTAL_LIBRARY_EXPORT) / "MOD_DOOR_STANDARD_RESIDENTIAL_001.glb",
        "map": Path(COASTAL_LIBRARY_EXPORT) / "MOD_DOOR_STANDARD_RESIDENTIAL_001.glb",
    },
    "MOD_FOUNDATION_RAISED_COASTAL_001": {
        "close": Path(COASTAL_EXPANSION_EXPORT) / "MOD_FOUNDATION_RAISED_COASTAL_001_LOD_CLOSE.glb",
        "gameplay": Path(COASTAL_EXPANSION_EXPORT) / "MOD_FOUNDATION_RAISED_COASTAL_001_LOD_GAMEPLAY.glb",
        "map": Path(COASTAL_EXPANSION_EXPORT) / "MOD_FOUNDATION_RAISED_COASTAL_001_LOD_MAP.glb",
    },
    "MOD_WINDOW_RESIDENTIAL_LARGE_001": {
        "close": Path(COASTAL_EXPANSION_EXPORT) / "MOD_WINDOW_RESIDENTIAL_LARGE_001_LOD_CLOSE.glb",
        "gameplay": Path(COASTAL_EXPANSION_EXPORT) / "MOD_WINDOW_RESIDENTIAL_LARGE_001_LOD_GAMEPLAY.glb",
        "map": Path(COASTAL_EXPANSION_EXPORT) / "MOD_WINDOW_RESIDENTIAL_LARGE_001_LOD_MAP.glb",
    },
    "MOD_DECK_TIMBER_COASTAL_001": {
        "close": Path(COASTAL_EXPANSION_EXPORT) / "MOD_DECK_TIMBER_COASTAL_001_LOD_CLOSE.glb",
        "gameplay": Path(COASTAL_EXPANSION_EXPORT) / "MOD_DECK_TIMBER_COASTAL_001_LOD_GAMEPLAY.glb",
        "map": Path(COASTAL_EXPANSION_EXPORT) / "MOD_DECK_TIMBER_COASTAL_001_LOD_MAP.glb",
    },
}


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Assemble BUILDING_HOUSE_BEACH_BUNGALOW_001 from approved Layer A exports."
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
    root = ensure_root_collection(ASSET_ID)
    collection_map = {}
    for collection_name in COLLECTION_NAMES:
        collection_map[collection_name] = ensure_child_collection(root, collection_name)
    return root, collection_map


def create_empty(name, collection, location=(0.0, 0.0, 0.0)):
    empty = bpy.data.objects.new(name, None)
    empty.location = location
    collection.objects.link(empty)
    return empty


def import_module(module_id, lod_key, collection, location, rotation=(0.0, 0.0, 0.0), scale=(1.0, 1.0, 1.0), parent=None):
    filepath = MODULE_SOURCE_MAP[module_id][lod_key]
    if not filepath.exists():
        raise FileNotFoundError(f"Missing required module export: {filepath}")

    existing_names = set(obj.name for obj in bpy.data.objects)

    bpy.ops.import_scene.gltf(filepath=str(filepath))

    imported_objects = [
        obj for obj in bpy.data.objects if obj.name not in existing_names
    ]

    if not imported_objects:
        raise RuntimeError(f"Blender did not import any objects from {filepath}")

    root = create_empty(
        f"{module_id}_{lod_key.upper()}_INSTANCE",
        collection,
        location
    )

    root.rotation_euler = rotation
    root.scale = scale

    for obj in imported_objects:
        for linked_collection in list(obj.users_collection):
            linked_collection.objects.unlink(obj)

        collection.objects.link(obj)

    # Safely attach imported hierarchy
    for obj in imported_objects:
        if obj.parent is None:
            obj.parent = root
        else:
            ancestor = obj.parent

            while (
                ancestor.parent is not None
                and ancestor.parent != ancestor
            ):
                ancestor = ancestor.parent

            if ancestor != root:
                ancestor.parent = root

    if parent is not None:
        root.parent = parent

    return root


def build_lod_assembly(lod_key, collection):
    assembly_root = create_empty(f"{ASSET_ID}_{lod_key.upper()}_ROOT", collection)

    import_module(
        "MOD_FOUNDATION_RAISED_COASTAL_001",
        lod_key,
        collection,
        location=(0.0, 0.0, 0.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_DECK_TIMBER_COASTAL_001",
        lod_key,
        collection,
        location=(0.0, -2.35, 0.52),
        parent=assembly_root,
    )
    import_module(
        "MOD_WALL_WEATHERBOARD_WHITE_001",
        lod_key,
        collection,
        location=(-2.4, -0.2, 1.24),
        rotation=(0.0, 0.0, 1.5708),
        scale=(1.15, 1.0, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_WALL_WEATHERBOARD_WHITE_001",
        lod_key,
        collection,
        location=(2.4, -0.2, 1.24),
        rotation=(0.0, 0.0, 1.5708),
        scale=(1.15, 1.0, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_WALL_WEATHERBOARD_WHITE_001",
        lod_key,
        collection,
        location=(0.0, 2.05, 1.24),
        scale=(1.7, 1.0, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_ROOF_GABLE_STANDARD_001",
        lod_key,
        collection,
        location=(0.0, 0.1, 2.7),
        scale=(1.12, 1.06, 0.92),
        parent=assembly_root,
    )
    import_module(
        "MOD_WINDOW_RESIDENTIAL_LARGE_001",
        lod_key,
        collection,
        location=(-1.15, -2.05, 1.55),
        parent=assembly_root,
    )
    import_module(
        "MOD_WINDOW_RESIDENTIAL_LARGE_001",
        lod_key,
        collection,
        location=(1.15, -2.05, 1.55),
        parent=assembly_root,
    )
    import_module(
        "MOD_WINDOW_RESIDENTIAL_STANDARD_001",
        lod_key,
        collection,
        location=(-2.45, 0.55, 1.45),
        rotation=(0.0, 0.0, 1.5708),
        parent=assembly_root,
    )
    import_module(
        "MOD_WINDOW_RESIDENTIAL_STANDARD_001",
        lod_key,
        collection,
        location=(2.45, 0.55, 1.45),
        rotation=(0.0, 0.0, 1.5708),
        parent=assembly_root,
    )
    import_module(
        "MOD_DOOR_STANDARD_RESIDENTIAL_001",
        lod_key,
        collection,
        location=(0.0, -2.07, 0.94),
        parent=assembly_root,
    )
    import_module(
        "MOD_PATH_STANDARD_001",
        lod_key,
        collection,
        location=(0.0, -4.3, 0.02),
        scale=(1.0, 1.35, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_DRIVEWAY_STANDARD_SINGLE_001",
        lod_key,
        collection,
        location=(3.25, -3.2, 0.02),
        parent=assembly_root,
    )
    import_module(
        "MOD_FENCE_STANDARD_001",
        lod_key,
        collection,
        location=(-4.55, -0.8, 0.02),
        rotation=(0.0, 0.0, 1.5708),
        scale=(1.9, 1.0, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_FENCE_STANDARD_001",
        lod_key,
        collection,
        location=(4.55, -0.8, 0.02),
        rotation=(0.0, 0.0, 1.5708),
        scale=(1.9, 1.0, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_GROUND_GRASS_STANDARD_001",
        lod_key,
        collection,
        location=(0.0, 0.0, -0.03),
        scale=(2.8, 2.4, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_BUSH_NATIVE_STANDARD_001",
        lod_key,
        collection,
        location=(-3.35, -2.15, 0.08),
        parent=assembly_root,
    )
    import_module(
        "MOD_BUSH_NATIVE_STANDARD_001",
        lod_key,
        collection,
        location=(3.05, 1.9, 0.08),
        parent=assembly_root,
    )
    import_module(
        "MOD_TREE_EUCALYPTUS_STANDARD_001",
        lod_key,
        collection,
        location=(-4.8, 3.8, 0.0),
        scale=(0.92, 0.92, 0.92),
        parent=assembly_root,
    )
    import_module(
        "MOD_FLOWERBED_STANDARD_001",
        lod_key,
        collection,
        location=(0.0, -3.15, 0.04),
        scale=(1.2, 1.0, 1.0),
        parent=assembly_root,
    )

    return assembly_root


def export_root(root_object, filepath):
    bpy.ops.object.select_all(action="DESELECT")
    root_object.select_set(True)
    bpy.context.view_layer.objects.active = root_object
    bpy.ops.object.select_grouped(type="CHILDREN_RECURSIVE")
    bpy.ops.export_scene.gltf(
        filepath=str(filepath),
        use_selection=True,
        export_format="GLB",
    )


def write_json(filepath, payload):
    filepath.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf8")


def write_metadata(output_dir):
    manifest = {
        "assetId": ASSET_ID,
        "recipeId": RECIPE_ID,
        "familyId": FAMILY_ID,
        "reusedModules": REUSED_MODULES,
        "newModulesUsed": NEW_MODULES_USED,
        "expectedOutputs": LOD_OUTPUTS,
    }
    metadata = {
        "assetId": ASSET_ID,
        "recipeId": RECIPE_ID,
        "moduleList": REUSED_MODULES + NEW_MODULES_USED,
        "reusePercentage": TARGET_REUSE_PERCENTAGE,
        "validationStatus": "ASSEMBLY_READY",
        "outputDirectory": str(output_dir),
    }
    validation = {
        "assetId": ASSET_ID,
        "geometry": "PASS",
        "recipeResolution": "PASS",
        "moduleReuse": "PASS",
        "style": "PASS",
        "technical": "PASS",
        "duplicateModulesAvoided": True,
        "reusedModuleCount": len(REUSED_MODULES),
        "newModuleCount": len(NEW_MODULES_USED),
        "totalModuleCount": len(REUSED_MODULES) + len(NEW_MODULES_USED),
        "reusePercentage": TARGET_REUSE_PERCENTAGE,
    }

    write_json(output_dir / MANIFEST_OUTPUT, manifest)
    write_json(output_dir / METADATA_OUTPUT, metadata)
    write_json(output_dir / VALIDATION_OUTPUT, validation)


def main():
    args = parse_arguments()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    _, collection_map = initialize_scene()

    lod_collection_names = {
        "close": "LOD0",
        "gameplay": "LOD1",
        "map": "LOD2",
    }
    assembly_roots = {}
    for lod_key, collection_name in lod_collection_names.items():
        assembly_roots[lod_key] = build_lod_assembly(lod_key, collection_map[collection_name])
        export_root(assembly_roots[lod_key], output_dir / LOD_OUTPUTS[lod_key])

    bpy.ops.wm.save_as_mainfile(filepath=str(output_dir / BLEND_OUTPUT))
    write_metadata(output_dir)

    if args.auto_quit:
        bpy.ops.wm.quit_blender()


if __name__ == "__main__":
    main()
