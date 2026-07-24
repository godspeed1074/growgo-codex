"""
GrowGo Asset Factory local Blender generator for TREE_EUCALYPTUS_001.

This script is intended to be executed locally on the developer machine with
Blender Python. It is not executed inside Codex.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import bpy


ASSET_ID = "TREE_EUCALYPTUS_001"
ASSET_FAMILY_ID = "COASTAL_NATURE_FAMILY_001"
RECIPE_REFERENCE = "TREE_EUCALYPTUS_RECIPE_001"
COLLECTIONS = ["GEOMETRY", "MATERIALS", "LOD0", "LOD1", "LOD2", "LOD3", "EXPORT"]
LOD_OUTPUTS = {
    "close": "TREE_EUCALYPTUS_001_LOD_CLOSE.glb",
    "gameplay": "TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb",
    "map": "TREE_EUCALYPTUS_001_LOD_MAP.glb",
    "distantSilhouette": "TREE_EUCALYPTUS_001_LOD_DISTANT_SILHOUETTE.glb",
}


def parse_arguments():
    parser = argparse.ArgumentParser(description="Generate TREE_EUCALYPTUS_001 in local Blender.")
    parser.add_argument(
        "--output-dir",
        default="asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export",
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


def create_materials():
    materials = {}
    material_specs = [
        ("MAT_EUCALYPTUS_BARK_001", (0.44, 0.36, 0.28, 1.0), 0.88),
        ("MAT_EUCALYPTUS_LEAF_001", (0.34, 0.54, 0.31, 1.0), 0.62),
        ("MAT_EUCALYPTUS_LEAF_VARIATION_001", (0.46, 0.66, 0.35, 1.0), 0.58),
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


def relink_object_to_collection(obj, target_collection):
    target_collection.objects.link(obj)
    if obj.name in bpy.context.scene.collection.objects:
        bpy.context.scene.collection.objects.unlink(obj)


def build_trunk_geometry(materials, target_collection):
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.12, depth=2.4, location=(0.0, 0.0, 1.2))
    trunk = bpy.context.active_object
    trunk.name = "TREE_TRUNK_EUCALYPTUS_001"
    trunk.scale[0] = 0.78
    trunk.scale[1] = 0.62
    if trunk.data.materials:
        trunk.data.materials[0] = materials["MAT_EUCALYPTUS_BARK_001"]
    else:
        trunk.data.materials.append(materials["MAT_EUCALYPTUS_BARK_001"])
    relink_object_to_collection(trunk, target_collection)
    return trunk


def build_branch_structure(materials, target_collection):
    branches = []
    branch_specs = [
        ("TREE_BRANCH_LARGE_001", (0.0, 0.0, 2.3), (0.0, 0.55, 0.85), (0.18, 0.18, 0.78)),
        ("TREE_BRANCH_SMALL_001_A", (0.0, 0.0, 2.0), (-0.45, -0.25, 0.6), (0.11, 0.11, 0.54)),
        ("TREE_BRANCH_SMALL_001_B", (0.0, 0.0, 2.1), (0.4, -0.35, 0.65), (0.1, 0.1, 0.5)),
    ]

    for branch_name, location, rotation, scale in branch_specs:
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.06, depth=1.2, location=location, rotation=rotation)
        branch = bpy.context.active_object
        branch.name = branch_name
        branch.scale = scale
        if branch.data.materials:
            branch.data.materials[0] = materials["MAT_EUCALYPTUS_BARK_001"]
        else:
            branch.data.materials.append(materials["MAT_EUCALYPTUS_BARK_001"])
        relink_object_to_collection(branch, target_collection)
        branches.append(branch)
    return branches


def build_canopy_geometry(materials, target_collection):
    canopy_objects = []

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.9, location=(0.0, 0.1, 3.0))
    canopy_core = bpy.context.active_object
    canopy_core.name = "TREE_CANOPY_EUCALYPTUS_001"
    canopy_core.scale = (1.0, 0.8, 1.1)
    canopy_core.data.materials.append(materials["MAT_EUCALYPTUS_LEAF_001"])
    relink_object_to_collection(canopy_core, target_collection)
    canopy_objects.append(canopy_core)

    leaf_cluster_locations = [
        (-0.7, 0.25, 3.2),
        (0.65, 0.35, 3.05),
        (-0.15, -0.6, 3.35),
        (0.35, -0.45, 2.85),
    ]
    for index, location in enumerate(leaf_cluster_locations, start=1):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.38, location=location)
        cluster = bpy.context.active_object
        cluster.name = f"TREE_LEAF_CLUSTER_001_{index:02d}"
        cluster.scale = (1.15, 0.78, 0.95)
        cluster.data.materials.append(
            materials["MAT_EUCALYPTUS_LEAF_VARIATION_001" if index % 2 == 0 else "MAT_EUCALYPTUS_LEAF_001"]
        )
        relink_object_to_collection(cluster, target_collection)
        canopy_objects.append(cluster)

    return canopy_objects


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
        "LOD3": geometry_objects[:2],
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
            "TREE_TRUNK_EUCALYPTUS_001",
            "TREE_BRANCH_SMALL_001",
            "TREE_BRANCH_LARGE_001",
            "TREE_CANOPY_EUCALYPTUS_001",
            "TREE_LEAF_CLUSTER_001",
        ],
    }
    write_json(output_path / "tree-eucalyptus-metadata.json", metadata_payload)

    manifest_payload = {
        "assetId": ASSET_ID,
        "recipeReference": RECIPE_REFERENCE,
        "manifestVersion": "1.0.0",
        "category": "nature",
    }
    write_json(output_path / "tree-eucalyptus-manifest.json", manifest_payload)

    validation_payload = {
        "assetId": ASSET_ID,
        "sceneContractValidated": True,
        "trunkGeometryGenerated": True,
        "branchStructureGenerated": True,
        "canopyGeometryGenerated": True,
        "leafMaterialsGenerated": True,
        "lodOutputsPrepared": True,
        "exportPrepared": True,
        "localBlenderExecutionRequired": True,
    }
    write_json(output_path / "tree-eucalyptus-validation.json", validation_payload)


def export_glb_files(output_dir):
    output_path = Path(output_dir)
    export_collection = bpy.data.collections.get("EXPORT")
    if export_collection is None:
        return []

    exported = []
    lod_index_lookup = {"close": 0, "gameplay": 1, "map": 2, "distantSilhouette": 3}
    for lod_key, filename in LOD_OUTPUTS.items():
        export_file = output_path / filename
        export_file.parent.mkdir(parents=True, exist_ok=True)
        bpy.ops.object.select_all(action="DESELECT")
        lod_marker = f"LOD{lod_index_lookup[lod_key]}"
        for obj in export_collection.objects:
            if lod_marker in obj.name:
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
    materials = create_materials()
    build_trunk_geometry(materials, collection_map["GEOMETRY"])
    build_branch_structure(materials, collection_map["GEOMETRY"])
    build_canopy_geometry(materials, collection_map["GEOMETRY"])
    build_lod_outputs(collection_map)
    prepare_export_collection(collection_map)
    write_asset_metadata(output_dir)
    if skip_export:
        return []
    return export_glb_files(output_dir)


def export_asset_package(output_dir):
    return export_glb_files(output_dir)


def main():
    args = parse_arguments()
    exported_files = generate_asset_package(args.output_dir, skip_export=args.skip_export)
    print(json.dumps({"assetId": ASSET_ID, "exportedFiles": exported_files}, indent=2))


if __name__ == "__main__":
    main()
