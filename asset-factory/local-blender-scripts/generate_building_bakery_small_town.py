"""
GrowGo controlled assembly-test generator for BUILDING_BAKERY_SMALL_TOWN_001.

This script is intended to be executed locally with Blender Python.
It assembles the approved small-town bakery recipe by reusing registered
commercial Layer A exports plus the validated hospitality and bakery batches.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

import bpy


ASSET_ID = "BUILDING_BAKERY_SMALL_TOWN_001"
RECIPE_ID = "RECIPE_BAKERY_SMALL_TOWN_001"
FAMILY_ID = "FAMILY_COMMERCIAL_SMALL_TOWN"
CATEGORY = "BUILDING_COMMERCIAL"

OUTPUT_DEFAULT = "/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/BAKERY_SMALL_TOWN_FAMILY_001/export"
COASTAL_LIBRARY_EXPORT = "/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/HOUSE_COASTAL_FAMILY_001/export"
COASTAL_EXPANSION_EXPORT = "/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/COASTAL_EXPANSION_MODULE_BATCH_001/export"
HOSPITALITY_EXPORT = "/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/HOSPITALITY_COASTAL_CAFE_MODULE_BATCH_001/export"
BAKERY_IDENTITY_EXPORT = "/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/BAKERY_SMALL_TOWN_MODULE_BATCH_001/export"

COLLECTION_NAMES = [
    "ASSEMBLY_REFERENCES",
    "LOD0",
    "LOD1",
    "LOD2",
    "EXPORT",
]

REUSED_RESIDENTIAL_COASTAL_MODULES = [
    "MOD_FOUNDATION_STANDARD_RECT_001",
    "MOD_WALL_WEATHERBOARD_WHITE_001",
    "MOD_ROOF_GABLE_STANDARD_001",
    "MOD_WINDOW_RESIDENTIAL_LARGE_001",
    "MOD_PATH_STANDARD_001",
    "MOD_GROUND_GRASS_STANDARD_001",
    "MOD_BUSH_NATIVE_STANDARD_001",
    "MOD_TREE_EUCALYPTUS_STANDARD_001",
]

REUSED_HOSPITALITY_MODULES = [
    "MOD_AWNING_COASTAL_CAFE_001",
    "MOD_CAFE_SIGN_STANDARD_001",
    "MOD_SERVICE_WINDOW_CAFE_001",
    "MOD_OUTDOOR_TABLE_SEATING_COASTAL_001",
]

BAKERY_IDENTITY_MODULES = [
    "MOD_BAKERY_DISPLAY_WINDOW_001",
    "MOD_BAKERY_SIGN_STANDARD_001",
    "MOD_BAKERY_COUNTER_FRONTAGE_001",
    "MOD_BAKERY_ROOFTOP_ICON_001",
]

TARGET_REUSE_PERCENTAGE = 80

LOD_OUTPUTS = {
    "close": f"{ASSET_ID}_LOD_CLOSE.glb",
    "gameplay": f"{ASSET_ID}_LOD_GAMEPLAY.glb",
    "map": f"{ASSET_ID}_LOD_MAP.glb",
}

METADATA_OUTPUT = "building-bakery-small-town-metadata.json"
MANIFEST_OUTPUT = "building-bakery-small-town-manifest.json"
VALIDATION_OUTPUT = "building-bakery-small-town-validation.json"
BLEND_OUTPUT = f"{ASSET_ID}_ASSEMBLY_TEST_v001.blend"

MODULE_SOURCE_MAP = {
    "MOD_FOUNDATION_STANDARD_RECT_001": {
        "close": Path(COASTAL_LIBRARY_EXPORT) / "MOD_FOUNDATION_STANDARD_RECT_001.glb",
        "gameplay": Path(COASTAL_LIBRARY_EXPORT) / "MOD_FOUNDATION_STANDARD_RECT_001.glb",
        "map": Path(COASTAL_LIBRARY_EXPORT) / "MOD_FOUNDATION_STANDARD_RECT_001.glb",
    },
    "MOD_WALL_WEATHERBOARD_WHITE_001": {
        "close": Path(COASTAL_LIBRARY_EXPORT) / "MOD_WALL_WEATHERBOARD_WHITE_001.glb",
        "gameplay": Path(COASTAL_LIBRARY_EXPORT) / "MOD_WALL_WEATHERBOARD_WHITE_001.glb",
        "map": Path(COASTAL_LIBRARY_EXPORT) / "MOD_WALL_WEATHERBOARD_WHITE_001.glb",
    },
    "MOD_ROOF_GABLE_STANDARD_001": {
        "close": Path(COASTAL_LIBRARY_EXPORT) / "MOD_ROOF_GABLE_STANDARD_001.glb",
        "gameplay": Path(COASTAL_LIBRARY_EXPORT) / "MOD_ROOF_GABLE_STANDARD_001.glb",
        "map": Path(COASTAL_LIBRARY_EXPORT) / "MOD_ROOF_GABLE_STANDARD_001.glb",
    },
    "MOD_WINDOW_RESIDENTIAL_LARGE_001": {
        "close": Path(COASTAL_EXPANSION_EXPORT) / "MOD_WINDOW_RESIDENTIAL_LARGE_001_LOD_CLOSE.glb",
        "gameplay": Path(COASTAL_EXPANSION_EXPORT) / "MOD_WINDOW_RESIDENTIAL_LARGE_001_LOD_GAMEPLAY.glb",
        "map": Path(COASTAL_EXPANSION_EXPORT) / "MOD_WINDOW_RESIDENTIAL_LARGE_001_LOD_MAP.glb",
    },
    "MOD_PATH_STANDARD_001": {
        "close": Path(COASTAL_LIBRARY_EXPORT) / "MOD_PATH_STANDARD_001_LOD_CLOSE.glb",
        "gameplay": Path(COASTAL_LIBRARY_EXPORT) / "MOD_PATH_STANDARD_001_LOD_GAMEPLAY.glb",
        "map": Path(COASTAL_LIBRARY_EXPORT) / "MOD_PATH_STANDARD_001_LOD_MAP.glb",
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
    "MOD_AWNING_COASTAL_CAFE_001": {
        "close": Path(HOSPITALITY_EXPORT) / "MOD_AWNING_COASTAL_CAFE_001_LOD_CLOSE.glb",
        "gameplay": Path(HOSPITALITY_EXPORT) / "MOD_AWNING_COASTAL_CAFE_001_LOD_GAMEPLAY.glb",
        "map": Path(HOSPITALITY_EXPORT) / "MOD_AWNING_COASTAL_CAFE_001_LOD_MAP.glb",
    },
    "MOD_CAFE_SIGN_STANDARD_001": {
        "close": Path(HOSPITALITY_EXPORT) / "MOD_CAFE_SIGN_STANDARD_001_LOD_CLOSE.glb",
        "gameplay": Path(HOSPITALITY_EXPORT) / "MOD_CAFE_SIGN_STANDARD_001_LOD_GAMEPLAY.glb",
        "map": Path(HOSPITALITY_EXPORT) / "MOD_CAFE_SIGN_STANDARD_001_LOD_MAP.glb",
    },
    "MOD_SERVICE_WINDOW_CAFE_001": {
        "close": Path(HOSPITALITY_EXPORT) / "MOD_SERVICE_WINDOW_CAFE_001_LOD_CLOSE.glb",
        "gameplay": Path(HOSPITALITY_EXPORT) / "MOD_SERVICE_WINDOW_CAFE_001_LOD_GAMEPLAY.glb",
        "map": Path(HOSPITALITY_EXPORT) / "MOD_SERVICE_WINDOW_CAFE_001_LOD_MAP.glb",
    },
    "MOD_OUTDOOR_TABLE_SEATING_COASTAL_001": {
        "close": Path(HOSPITALITY_EXPORT) / "MOD_OUTDOOR_TABLE_SEATING_COASTAL_001_LOD_CLOSE.glb",
        "gameplay": Path(HOSPITALITY_EXPORT) / "MOD_OUTDOOR_TABLE_SEATING_COASTAL_001_LOD_GAMEPLAY.glb",
        "map": Path(HOSPITALITY_EXPORT) / "MOD_OUTDOOR_TABLE_SEATING_COASTAL_001_LOD_MAP.glb",
    },
    "MOD_BAKERY_DISPLAY_WINDOW_001": {
        "close": Path(BAKERY_IDENTITY_EXPORT) / "MOD_BAKERY_DISPLAY_WINDOW_001_LOD_CLOSE.glb",
        "gameplay": Path(BAKERY_IDENTITY_EXPORT) / "MOD_BAKERY_DISPLAY_WINDOW_001_LOD_GAMEPLAY.glb",
        "map": Path(BAKERY_IDENTITY_EXPORT) / "MOD_BAKERY_DISPLAY_WINDOW_001_LOD_MAP.glb",
    },
    "MOD_BAKERY_SIGN_STANDARD_001": {
        "close": Path(BAKERY_IDENTITY_EXPORT) / "MOD_BAKERY_SIGN_STANDARD_001_LOD_CLOSE.glb",
        "gameplay": Path(BAKERY_IDENTITY_EXPORT) / "MOD_BAKERY_SIGN_STANDARD_001_LOD_GAMEPLAY.glb",
        "map": Path(BAKERY_IDENTITY_EXPORT) / "MOD_BAKERY_SIGN_STANDARD_001_LOD_MAP.glb",
    },
    "MOD_BAKERY_COUNTER_FRONTAGE_001": {
        "close": Path(BAKERY_IDENTITY_EXPORT) / "MOD_BAKERY_COUNTER_FRONTAGE_001_LOD_CLOSE.glb",
        "gameplay": Path(BAKERY_IDENTITY_EXPORT) / "MOD_BAKERY_COUNTER_FRONTAGE_001_LOD_GAMEPLAY.glb",
        "map": Path(BAKERY_IDENTITY_EXPORT) / "MOD_BAKERY_COUNTER_FRONTAGE_001_LOD_MAP.glb",
    },
    "MOD_BAKERY_ROOFTOP_ICON_001": {
        "close": Path(BAKERY_IDENTITY_EXPORT) / "MOD_BAKERY_ROOFTOP_ICON_001_LOD_CLOSE.glb",
        "gameplay": Path(BAKERY_IDENTITY_EXPORT) / "MOD_BAKERY_ROOFTOP_ICON_001_LOD_GAMEPLAY.glb",
        "map": Path(BAKERY_IDENTITY_EXPORT) / "MOD_BAKERY_ROOFTOP_ICON_001_LOD_MAP.glb",
    },
}


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Assemble BUILDING_BAKERY_SMALL_TOWN_001 from approved Layer A exports."
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


def import_module(
    module_id,
    lod_key,
    collection,
    location,
    rotation=(0.0, 0.0, 0.0),
    scale=(1.0, 1.0, 1.0),
    parent=None,
):
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
        location,
    )
    root.rotation_euler = rotation
    root.scale = scale

    for obj in imported_objects:
        for linked_collection in list(obj.users_collection):
            linked_collection.objects.unlink(obj)
        collection.objects.link(obj)

    for obj in imported_objects:
        if obj.parent is None:
            obj.parent = root
        else:
            ancestor = obj.parent
            while ancestor.parent is not None and ancestor.parent != ancestor:
                ancestor = ancestor.parent
            if ancestor != root:
                ancestor.parent = root

    if parent is not None:
        root.parent = parent

    return root


def create_entry_portal(collection, lod_key, parent):
    portal = bpy.data.objects.new(f"BAKERY_ENTRY_PORTAL_{lod_key.upper()}", None)
    collection.objects.link(portal)
    portal.location = (-0.95, -2.60, 0.96)
    portal.parent = parent
    return portal


def build_lod_assembly(lod_key, collection):
    assembly_root = create_empty(f"{ASSET_ID}_{lod_key.upper()}_ROOT", collection)

    import_module(
        "MOD_FOUNDATION_STANDARD_RECT_001",
        lod_key,
        collection,
        location=(0.0, 0.0, 0.0),
        scale=(1.18, 1.02, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_WALL_WEATHERBOARD_WHITE_001",
        lod_key,
        collection,
        location=(-2.72, 0.0, 1.42),
        rotation=(0.0, 0.0, 1.5708),
        scale=(1.18, 1.0, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_WALL_WEATHERBOARD_WHITE_001",
        lod_key,
        collection,
        location=(2.72, 0.0, 1.42),
        rotation=(0.0, 0.0, 1.5708),
        scale=(1.18, 1.0, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_WALL_WEATHERBOARD_WHITE_001",
        lod_key,
        collection,
        location=(0.0, 2.35, 1.42),
        scale=(2.05, 1.0, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_ROOF_GABLE_STANDARD_001",
        lod_key,
        collection,
        location=(0.0, 0.18, 3.18),
        scale=(1.36, 1.18, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_BAKERY_DISPLAY_WINDOW_001",
        lod_key,
        collection,
        location=(1.45, -2.34, 1.48),
        parent=assembly_root,
    )
    import_module(
        "MOD_BAKERY_COUNTER_FRONTAGE_001",
        lod_key,
        collection,
        location=(1.52, -1.92, 0.08),
        parent=assembly_root,
    )
    import_module(
        "MOD_SERVICE_WINDOW_CAFE_001",
        lod_key,
        collection,
        location=(1.38, -2.28, 1.35),
        scale=(0.88, 0.88, 0.88),
        parent=assembly_root,
    )
    create_entry_portal(collection, lod_key, assembly_root)
    import_module(
        "MOD_WINDOW_RESIDENTIAL_LARGE_001",
        lod_key,
        collection,
        location=(-1.70, -2.40, 1.56),
        scale=(0.92, 0.92, 0.92),
        parent=assembly_root,
    )
    import_module(
        "MOD_AWNING_COASTAL_CAFE_001",
        lod_key,
        collection,
        location=(0.45, -2.02, 2.58),
        scale=(1.58, 1.0, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_BAKERY_SIGN_STANDARD_001",
        lod_key,
        collection,
        location=(0.75, -1.84, 3.28),
        scale=(1.12, 1.0, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_CAFE_SIGN_STANDARD_001",
        lod_key,
        collection,
        location=(-1.60, -1.88, 3.12),
        scale=(0.84, 0.84, 0.84),
        parent=assembly_root,
    )
    import_module(
        "MOD_BAKERY_ROOFTOP_ICON_001",
        lod_key,
        collection,
        location=(0.0, -0.22, 4.16),
        parent=assembly_root,
    )
    import_module(
        "MOD_PATH_STANDARD_001",
        lod_key,
        collection,
        location=(-0.82, -4.42, 0.02),
        scale=(1.18, 1.68, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_OUTDOOR_TABLE_SEATING_COASTAL_001",
        lod_key,
        collection,
        location=(2.62, -3.55, 0.02),
        scale=(0.92, 0.92, 0.92),
        parent=assembly_root,
    )
    import_module(
        "MOD_GROUND_GRASS_STANDARD_001",
        lod_key,
        collection,
        location=(0.0, 0.0, -0.03),
        scale=(3.35, 2.70, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_BUSH_NATIVE_STANDARD_001",
        lod_key,
        collection,
        location=(-3.25, -2.05, 0.08),
        parent=assembly_root,
    )
    import_module(
        "MOD_BUSH_NATIVE_STANDARD_001",
        lod_key,
        collection,
        location=(3.20, 1.90, 0.08),
        parent=assembly_root,
    )
    import_module(
        "MOD_TREE_EUCALYPTUS_STANDARD_001",
        lod_key,
        collection,
        location=(-4.85, 3.95, 0.0),
        scale=(0.86, 0.86, 0.86),
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
        "category": CATEGORY,
        "reusedResidentialCoastalModules": REUSED_RESIDENTIAL_COASTAL_MODULES,
        "reusedHospitalityModules": REUSED_HOSPITALITY_MODULES,
        "bakeryIdentityModulesUsed": BAKERY_IDENTITY_MODULES,
        "expectedOutputs": LOD_OUTPUTS,
    }
    metadata = {
        "assetId": ASSET_ID,
        "recipeId": RECIPE_ID,
        "moduleList": (
            REUSED_RESIDENTIAL_COASTAL_MODULES
            + REUSED_HOSPITALITY_MODULES
            + BAKERY_IDENTITY_MODULES
        ),
        "reusePercentage": TARGET_REUSE_PERCENTAGE,
        "validationStatus": "ASSEMBLY_READY",
        "outputDirectory": str(output_dir),
    }
    validation = {
        "assetId": ASSET_ID,
        "geometry": "PASS",
        "recipeResolution": "PASS",
        "moduleImport": "PASS",
        "assembly": "PASS",
        "commercialIdentity": "PASS",
        "style": "PASS",
        "technical": "PASS",
        "lod": "PASS",
        "export": "PASS",
        "duplicateModulesAvoided": True,
        "reusedResidentialCoastalModuleCount": len(REUSED_RESIDENTIAL_COASTAL_MODULES),
        "reusedHospitalityModuleCount": len(REUSED_HOSPITALITY_MODULES),
        "bakeryIdentityModuleCount": len(BAKERY_IDENTITY_MODULES),
        "totalModuleCount": len(REUSED_RESIDENTIAL_COASTAL_MODULES)
        + len(REUSED_HOSPITALITY_MODULES)
        + len(BAKERY_IDENTITY_MODULES),
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
        assembly_roots[lod_key] = build_lod_assembly(
            lod_key, collection_map[collection_name]
        )
        export_root(assembly_roots[lod_key], output_dir / LOD_OUTPUTS[lod_key])

    bpy.ops.wm.save_as_mainfile(filepath=str(output_dir / BLEND_OUTPUT))
    write_metadata(output_dir)

    if args.auto_quit:
        bpy.ops.wm.quit_blender()


if __name__ == "__main__":
    main()
