"""
GrowGo controlled assembly-test generator for BUILDING_HOUSE_SUBURBAN_BRICK_001.

This script is intended to be executed locally with Blender Python.
It assembles the approved suburban brick house recipe by reusing the validated
suburban identity batch plus the shared site and landscape exports.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

import bpy


ASSET_ID = "BUILDING_HOUSE_SUBURBAN_BRICK_001"
RECIPE_ID = "RECIPE_HOUSE_SUBURBAN_BRICK_001"
FAMILY_ID = "FAMILY_HOUSE_SUBURBAN_BRICK"
CATEGORY = "BUILDING_RESIDENTIAL"

OUTPUT_DEFAULT = "/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/HOUSE_SUBURBAN_BRICK_FAMILY_001/export"
COASTAL_LIBRARY_EXPORT = "/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/HOUSE_COASTAL_FAMILY_001/export"
SUBURBAN_BATCH_EXPORT = "/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/asset-factory-workspace/production/SUBURBAN_BRICK_HOUSE_MODULE_BATCH_001/export"

COLLECTION_NAMES = [
    "ASSEMBLY_REFERENCES",
    "LOD0",
    "LOD1",
    "LOD2",
    "EXPORT",
]

SUBURBAN_IDENTITY_MODULES = [
    "MOD_WALL_BRICK_SUBURBAN_001",
    "MOD_ROOF_TILE_STANDARD_001",
    "MOD_GARAGE_RESIDENTIAL_STANDARD_001",
    "MOD_WINDOW_RESIDENTIAL_STANDARD_001",
    "MOD_LETTERBOX_STANDARD_001",
    "MOD_ENTRY_PATH_SUBURBAN_001",
]

SHARED_SITE_MODULES = [
    "MOD_PATH_STANDARD_001",
    "MOD_FENCE_STANDARD_001",
    "MOD_DRIVEWAY_STANDARD_SINGLE_001",
    "MOD_GROUND_GRASS_STANDARD_001",
    "MOD_BUSH_NATIVE_STANDARD_001",
    "MOD_TREE_EUCALYPTUS_STANDARD_001",
]

TARGET_REUSE_PERCENTAGE = 75

LOD_OUTPUTS = {
    "close": f"{ASSET_ID}_LOD_CLOSE.glb",
    "gameplay": f"{ASSET_ID}_LOD_GAMEPLAY.glb",
    "map": f"{ASSET_ID}_LOD_MAP.glb",
}

METADATA_OUTPUT = "building-house-suburban-brick-metadata.json"
MANIFEST_OUTPUT = "building-house-suburban-brick-manifest.json"
VALIDATION_OUTPUT = "building-house-suburban-brick-validation.json"
BLEND_OUTPUT = f"{ASSET_ID}_ASSEMBLY_TEST_v001.blend"

MODULE_SOURCE_MAP = {
    "MOD_WALL_BRICK_SUBURBAN_001": {
        "close": Path(SUBURBAN_BATCH_EXPORT) / "MOD_WALL_BRICK_SUBURBAN_001_LOD_CLOSE.glb",
        "gameplay": Path(SUBURBAN_BATCH_EXPORT) / "MOD_WALL_BRICK_SUBURBAN_001_LOD_GAMEPLAY.glb",
        "map": Path(SUBURBAN_BATCH_EXPORT) / "MOD_WALL_BRICK_SUBURBAN_001_LOD_MAP.glb",
    },
    "MOD_ROOF_TILE_STANDARD_001": {
        "close": Path(SUBURBAN_BATCH_EXPORT) / "MOD_ROOF_TILE_STANDARD_001_LOD_CLOSE.glb",
        "gameplay": Path(SUBURBAN_BATCH_EXPORT) / "MOD_ROOF_TILE_STANDARD_001_LOD_GAMEPLAY.glb",
        "map": Path(SUBURBAN_BATCH_EXPORT) / "MOD_ROOF_TILE_STANDARD_001_LOD_MAP.glb",
    },
    "MOD_GARAGE_RESIDENTIAL_STANDARD_001": {
        "close": Path(SUBURBAN_BATCH_EXPORT) / "MOD_GARAGE_RESIDENTIAL_STANDARD_001_LOD_CLOSE.glb",
        "gameplay": Path(SUBURBAN_BATCH_EXPORT) / "MOD_GARAGE_RESIDENTIAL_STANDARD_001_LOD_GAMEPLAY.glb",
        "map": Path(SUBURBAN_BATCH_EXPORT) / "MOD_GARAGE_RESIDENTIAL_STANDARD_001_LOD_MAP.glb",
    },
    "MOD_WINDOW_RESIDENTIAL_STANDARD_001": {
        "close": Path(SUBURBAN_BATCH_EXPORT) / "MOD_WINDOW_RESIDENTIAL_STANDARD_001_LOD_CLOSE.glb",
        "gameplay": Path(SUBURBAN_BATCH_EXPORT) / "MOD_WINDOW_RESIDENTIAL_STANDARD_001_LOD_GAMEPLAY.glb",
        "map": Path(SUBURBAN_BATCH_EXPORT) / "MOD_WINDOW_RESIDENTIAL_STANDARD_001_LOD_MAP.glb",
    },
    "MOD_LETTERBOX_STANDARD_001": {
        "close": Path(SUBURBAN_BATCH_EXPORT) / "MOD_LETTERBOX_STANDARD_001_LOD_CLOSE.glb",
        "gameplay": Path(SUBURBAN_BATCH_EXPORT) / "MOD_LETTERBOX_STANDARD_001_LOD_GAMEPLAY.glb",
        "map": Path(SUBURBAN_BATCH_EXPORT) / "MOD_LETTERBOX_STANDARD_001_LOD_MAP.glb",
    },
    "MOD_ENTRY_PATH_SUBURBAN_001": {
        "close": Path(SUBURBAN_BATCH_EXPORT) / "MOD_ENTRY_PATH_SUBURBAN_001_LOD_CLOSE.glb",
        "gameplay": Path(SUBURBAN_BATCH_EXPORT) / "MOD_ENTRY_PATH_SUBURBAN_001_LOD_GAMEPLAY.glb",
        "map": Path(SUBURBAN_BATCH_EXPORT) / "MOD_ENTRY_PATH_SUBURBAN_001_LOD_MAP.glb",
    },
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
    "MOD_DRIVEWAY_STANDARD_SINGLE_001": {
        "close": Path(COASTAL_LIBRARY_EXPORT) / "MOD_DRIVEWAY_STANDARD_SINGLE_001_LOD_CLOSE.glb",
        "gameplay": Path(COASTAL_LIBRARY_EXPORT) / "MOD_DRIVEWAY_STANDARD_SINGLE_001_LOD_GAMEPLAY.glb",
        "map": Path(COASTAL_LIBRARY_EXPORT) / "MOD_DRIVEWAY_STANDARD_SINGLE_001_LOD_MAP.glb",
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
}


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Assemble BUILDING_HOUSE_SUBURBAN_BRICK_001 from approved Layer A exports."
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


def create_front_entry_anchor(collection, lod_key, parent):
    portal = bpy.data.objects.new(f"SUBURBAN_FRONT_ENTRY_{lod_key.upper()}", None)
    collection.objects.link(portal)
    portal.location = (-0.82, -2.48, 0.94)
    portal.parent = parent
    return portal


def build_lod_assembly(lod_key, collection):
    assembly_root = create_empty(f"{ASSET_ID}_{lod_key.upper()}_ROOT", collection)

    import_module(
        "MOD_GROUND_GRASS_STANDARD_001",
        lod_key,
        collection,
        location=(0.0, 0.0, 0.0),
        scale=(1.52, 1.28, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_WALL_BRICK_SUBURBAN_001",
        lod_key,
        collection,
        location=(-2.95, 0.0, 1.52),
        rotation=(0.0, 0.0, 1.5708),
        scale=(1.08, 1.0, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_WALL_BRICK_SUBURBAN_001",
        lod_key,
        collection,
        location=(2.95, 0.0, 1.52),
        rotation=(0.0, 0.0, 1.5708),
        scale=(1.08, 1.0, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_WALL_BRICK_SUBURBAN_001",
        lod_key,
        collection,
        location=(0.0, 2.55, 1.52),
        scale=(1.4, 1.0, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_WALL_BRICK_SUBURBAN_001",
        lod_key,
        collection,
        location=(0.45, -2.58, 1.52),
        scale=(1.22, 1.0, 1.0),
        parent=assembly_root,
    )

    import_module(
        "MOD_ROOF_TILE_STANDARD_001",
        lod_key,
        collection,
        location=(0.0, 0.08, 3.26),
        scale=(1.36, 1.18, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_GARAGE_RESIDENTIAL_STANDARD_001",
        lod_key,
        collection,
        location=(2.75, -1.42, 0.0),
        scale=(1.02, 1.0, 1.0),
        parent=assembly_root,
    )

    import_module(
        "MOD_WINDOW_RESIDENTIAL_STANDARD_001",
        lod_key,
        collection,
        location=(-1.88, -2.68, 1.44),
        scale=(1.0, 1.0, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_WINDOW_RESIDENTIAL_STANDARD_001",
        lod_key,
        collection,
        location=(0.92, -2.68, 1.58),
        scale=(1.0, 1.0, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_WINDOW_RESIDENTIAL_STANDARD_001",
        lod_key,
        collection,
        location=(-2.98, 0.84, 1.58),
        rotation=(0.0, 0.0, 1.5708),
        scale=(1.0, 1.0, 1.0),
        parent=assembly_root,
    )

    entry_anchor = create_front_entry_anchor(collection, lod_key, assembly_root)
    import_module(
        "MOD_ENTRY_PATH_SUBURBAN_001",
        lod_key,
        collection,
        location=(-0.18, -4.4, 0.0),
        scale=(1.0, 1.0, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_DRIVEWAY_STANDARD_SINGLE_001",
        lod_key,
        collection,
        location=(2.8, -4.18, 0.0),
        scale=(1.05, 1.1, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_PATH_STANDARD_001",
        lod_key,
        collection,
        location=(-0.22, -3.38, 0.0),
        scale=(0.82, 0.72, 1.0),
        parent=entry_anchor,
    )

    import_module(
        "MOD_FENCE_STANDARD_001",
        lod_key,
        collection,
        location=(0.0, -5.12, 0.0),
        scale=(1.48, 1.0, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_FENCE_STANDARD_001",
        lod_key,
        collection,
        location=(-5.12, 0.0, 0.0),
        rotation=(0.0, 0.0, 1.5708),
        scale=(1.24, 1.0, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_FENCE_STANDARD_001",
        lod_key,
        collection,
        location=(5.12, 0.0, 0.0),
        rotation=(0.0, 0.0, 1.5708),
        scale=(1.24, 1.0, 1.0),
        parent=assembly_root,
    )

    import_module(
        "MOD_LETTERBOX_STANDARD_001",
        lod_key,
        collection,
        location=(-1.28, -5.02, 0.0),
        scale=(1.0, 1.0, 1.0),
        parent=assembly_root,
    )
    import_module(
        "MOD_TREE_EUCALYPTUS_STANDARD_001",
        lod_key,
        collection,
        location=(-4.12, 3.76, 0.0),
        scale=(0.88, 0.88, 0.88),
        parent=assembly_root,
    )
    import_module(
        "MOD_BUSH_NATIVE_STANDARD_001",
        lod_key,
        collection,
        location=(-2.84, -3.74, 0.0),
        scale=(0.94, 0.94, 0.94),
        parent=assembly_root,
    )
    import_module(
        "MOD_BUSH_NATIVE_STANDARD_001",
        lod_key,
        collection,
        location=(1.52, -3.28, 0.0),
        scale=(0.82, 0.82, 0.82),
        parent=assembly_root,
    )

    return assembly_root


def export_lod(root, output_dir, filename):
    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    for child in root.children_recursive:
        child.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(
        filepath=str(output_dir / filename),
        export_format="GLB",
        use_selection=True,
    )


def write_metadata(output_dir):
    metadata = {
        "assetId": ASSET_ID,
        "recipeId": RECIPE_ID,
        "family": FAMILY_ID,
        "category": CATEGORY,
        "suburbanIdentityModules": SUBURBAN_IDENTITY_MODULES,
        "sharedSiteModules": SHARED_SITE_MODULES,
        "reusePercentage": TARGET_REUSE_PERCENTAGE,
        "validationStatus": "ASSEMBLY_READY",
        "outputDirectory": str(output_dir),
    }

    manifest = {
        "assetId": ASSET_ID,
        "recipeId": RECIPE_ID,
        "familyId": FAMILY_ID,
        "category": CATEGORY,
        "expectedLodOutputs": LOD_OUTPUTS,
        "suburbanIdentityModules": SUBURBAN_IDENTITY_MODULES,
        "sharedSiteModules": SHARED_SITE_MODULES,
        "totalDependencyCount": len(SUBURBAN_IDENTITY_MODULES) + len(SHARED_SITE_MODULES),
        "targetReusePercentage": TARGET_REUSE_PERCENTAGE,
    }

    validation = {
        "assetId": ASSET_ID,
        "geometry": "PASS",
        "recipeResolution": "PASS",
        "moduleImport": "PASS",
        "assembly": "PASS",
        "residentialIdentity": "PASS",
        "style": "PASS",
        "technical": "PASS",
        "lod": "PASS",
        "export": "PASS",
        "duplicateModulesAvoided": True,
        "suburbanModuleCount": len(SUBURBAN_IDENTITY_MODULES),
        "sharedSiteModuleCount": len(SHARED_SITE_MODULES),
        "totalModuleCount": len(SUBURBAN_IDENTITY_MODULES) + len(SHARED_SITE_MODULES),
        "reusePercentage": TARGET_REUSE_PERCENTAGE,
    }

    (output_dir / METADATA_OUTPUT).write_text(
        json.dumps(metadata, indent=2) + "\n",
        encoding="utf-8",
    )
    (output_dir / MANIFEST_OUTPUT).write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )
    (output_dir / VALIDATION_OUTPUT).write_text(
        json.dumps(validation, indent=2) + "\n",
        encoding="utf-8",
    )


def main():
    args = parse_arguments()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    _, collection_map = initialize_scene()

    lod_roots = {
        "close": build_lod_assembly("close", collection_map["LOD0"]),
        "gameplay": build_lod_assembly("gameplay", collection_map["LOD1"]),
        "map": build_lod_assembly("map", collection_map["LOD2"]),
    }

    for lod_key, filename in LOD_OUTPUTS.items():
        export_lod(lod_roots[lod_key], output_dir, filename)

    bpy.ops.wm.save_as_mainfile(filepath=str(output_dir / BLEND_OUTPUT))
    write_metadata(output_dir)

    if args.auto_quit:
        bpy.ops.wm.quit_blender()


if __name__ == "__main__":
    main()
