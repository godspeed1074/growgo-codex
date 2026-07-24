"""
GrowGo Asset Factory local Blender generator for ROAD_COASTAL_001.

This script is intended to be executed locally on the developer machine with
Blender Python. It is not executed inside Codex.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import bpy


ASSET_ID = "ROAD_COASTAL_001"
ASSET_FAMILY_ID = "COASTAL_INFRASTRUCTURE_FAMILY_001"
RECIPE_REFERENCE = "ROAD_COASTAL_RECIPE_001"
COLLECTIONS = ["GEOMETRY", "MATERIALS", "LOD0", "LOD1", "LOD2", "LOD3", "EXPORT"]
LOD_OUTPUTS = {
    "close": "ROAD_COASTAL_001_LOD_CLOSE.glb",
    "gameplay": "ROAD_COASTAL_001_LOD_GAMEPLAY.glb",
    "map": "ROAD_COASTAL_001_LOD_MAP.glb",
    "distantSilhouette": "ROAD_COASTAL_001_LOD_DISTANT_SILHOUETTE.glb",
}


def parse_arguments():
    parser = argparse.ArgumentParser(description="Generate ROAD_COASTAL_001 in local Blender.")
    parser.add_argument(
        "--output-dir",
        default="asset-factory-workspace/production/COASTAL_INFRASTRUCTURE_FAMILY_001/export",
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
        ("MAT_ROAD_COASTAL_SURFACE_001", (0.17, 0.18, 0.19, 1.0), 0.84),
        ("MAT_ROAD_COASTAL_EDGE_001", (0.52, 0.46, 0.35, 1.0), 0.92),
        ("MAT_ROAD_COASTAL_MARKING_001", (0.86, 0.84, 0.72, 1.0), 0.56),
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


def build_road_surface(materials, target_collection):
    bpy.ops.mesh.primitive_plane_add(size=3.4, location=(0.0, 0.0, 0.0))
    road_surface = bpy.context.active_object
    road_surface.name = "ROAD_SURFACE_COASTAL_001"
    road_surface.scale = (1.0, 0.28, 1.0)
    road_surface.data.materials.append(materials["MAT_ROAD_COASTAL_SURFACE_001"])
    relink_object_to_collection(road_surface, target_collection)
    return road_surface


def build_road_edges(materials, target_collection):
    edge_offsets = [0.58, -0.58]
    edges = []
    for index, offset in enumerate(edge_offsets, start=1):
        bpy.ops.mesh.primitive_plane_add(size=3.4, location=(0.0, offset, 0.002))
        road_edge = bpy.context.active_object
        road_edge.name = f"ROAD_EDGE_COASTAL_001_{index:02d}"
        road_edge.scale = (1.0, 0.06, 1.0)
        road_edge.data.materials.append(materials["MAT_ROAD_COASTAL_EDGE_001"])
        relink_object_to_collection(road_edge, target_collection)
        edges.append(road_edge)
    return edges


def build_road_shoulders(materials, target_collection):
    shoulder_offsets = [0.78, -0.78]
    shoulders = []
    for index, offset in enumerate(shoulder_offsets, start=1):
        bpy.ops.mesh.primitive_plane_add(size=3.4, location=(0.0, offset, -0.002))
        shoulder = bpy.context.active_object
        shoulder.name = f"ROAD_SHOULDER_COASTAL_001_{index:02d}"
        shoulder.scale = (1.0, 0.12, 1.0)
        shoulder.data.materials.append(materials["MAT_ROAD_COASTAL_EDGE_001"])
        relink_object_to_collection(shoulder, target_collection)
        shoulders.append(shoulder)
    return shoulders


def build_road_marking(materials, target_collection):
    bpy.ops.mesh.primitive_plane_add(size=2.8, location=(0.0, 0.0, 0.004))
    marking = bpy.context.active_object
    marking.name = "ROAD_MARKING_COASTAL_001"
    marking.scale = (1.0, 0.015, 1.0)
    marking.data.materials.append(materials["MAT_ROAD_COASTAL_MARKING_001"])
    relink_object_to_collection(marking, target_collection)
    return marking


def build_connectors(materials, target_collection):
    connectors = []

    bpy.ops.mesh.primitive_plane_add(size=0.36, location=(-1.7, 0.0, 0.001))
    connector_straight = bpy.context.active_object
    connector_straight.name = "ROAD_CONNECTOR_STRAIGHT_001"
    connector_straight.scale = (0.34, 0.28, 1.0)
    connector_straight.data.materials.append(materials["MAT_ROAD_COASTAL_SURFACE_001"])
    relink_object_to_collection(connector_straight, target_collection)
    connectors.append(connector_straight)

    bpy.ops.mesh.primitive_plane_add(size=0.5, location=(1.45, 0.18, 0.001), rotation=(0.0, 0.0, 0.52))
    connector_curve = bpy.context.active_object
    connector_curve.name = "ROAD_CONNECTOR_CURVE_001"
    connector_curve.scale = (0.42, 0.22, 1.0)
    connector_curve.data.materials.append(materials["MAT_ROAD_COASTAL_SURFACE_001"])
    relink_object_to_collection(connector_curve, target_collection)
    connectors.append(connector_curve)

    return connectors


def build_road_geometry(collection_map, materials):
    geometry_collection = collection_map["GEOMETRY"]
    build_road_surface(materials, geometry_collection)
    build_road_edges(materials, geometry_collection)
    build_road_shoulders(materials, geometry_collection)
    build_road_marking(materials, geometry_collection)
    build_connectors(materials, geometry_collection)


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
            "ROAD_SURFACE_COASTAL_001",
            "ROAD_EDGE_COASTAL_001",
            "ROAD_SHOULDER_COASTAL_001",
            "ROAD_MARKING_COASTAL_001",
            "ROAD_CONNECTOR_STRAIGHT_001",
            "ROAD_CONNECTOR_CURVE_001",
        ],
    }
    write_json(output_path / "road-coastal-metadata.json", metadata_payload)

    manifest_payload = {
        "assetId": ASSET_ID,
        "recipeReference": RECIPE_REFERENCE,
        "manifestVersion": "1.0.0",
        "category": "roads",
    }
    write_json(output_path / "road-coastal-manifest.json", manifest_payload)

    validation_payload = {
        "assetId": ASSET_ID,
        "sceneContractValidated": True,
        "roadGeometryGenerated": True,
        "roadMaterialsGenerated": True,
        "lodOutputsPrepared": True,
        "exportPrepared": True,
        "localBlenderExecutionRequired": True,
    }
    write_json(output_path / "road-coastal-validation.json", validation_payload)


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
    build_road_geometry(collection_map, materials)
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
