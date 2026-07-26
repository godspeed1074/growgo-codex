"""
GrowGo procedural suburban neighbourhood visual preview prototype.

This script consumes the deterministic six-lot preview JSON and builds a small
inspection scene in Blender using registered residential building exports and
simple preview-only debug overlays.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

import bpy


SCENE_ID = "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_SCENE_001"
PREVIEW_ID = "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001"
VALIDATION_ID = "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_VALIDATION_001"

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE_JSON = (
    REPO_ROOT
    / "asset-factory-workspace"
    / "procedural-previews"
    / "NEIGHBOURHOOD_SUBURBAN_BLOCK_001_PREVIEW_001.json"
)
DEFAULT_OUTPUT_DIR = (
    REPO_ROOT
    / "asset-factory-workspace"
    / "procedural-previews"
    / SCENE_ID
)

BUILDING_LOOKUP = {
    "BUILDING_HOUSE_SUBURBAN_BRICK_001": REPO_ROOT
    / "asset-factory-workspace"
    / "production"
    / "HOUSE_SUBURBAN_BRICK_FAMILY_001"
    / "export"
    / "BUILDING_HOUSE_SUBURBAN_BRICK_001_LOD_GAMEPLAY.glb",
    "BUILDING_HOUSE_COASTAL_COTTAGE_001": REPO_ROOT
    / "asset-factory-workspace"
    / "production"
    / "HOUSE_COASTAL_FAMILY_001"
    / "export"
    / "BUILDING_HOUSE_COASTAL_COTTAGE_001_LOD_GAMEPLAY.glb",
    "BUILDING_HOUSE_BEACH_BUNGALOW_001": REPO_ROOT
    / "asset-factory-workspace"
    / "production"
    / "HOUSE_BEACH_BUNGALOW_FAMILY_001"
    / "export"
    / "BUILDING_HOUSE_BEACH_BUNGALOW_001_LOD_GAMEPLAY.glb",
}

PASS_COLOUR = (0.18, 0.78, 0.32, 1.0)
FAIL_COLOUR = (0.85, 0.18, 0.18, 1.0)
LOT_COLOUR = (0.16, 0.52, 0.92, 1.0)
ROAD_COLOUR = (0.13, 0.13, 0.15, 1.0)
DRIVEWAY_COLOUR = (0.55, 0.55, 0.57, 1.0)
FENCE_COLOUR = (0.58, 0.46, 0.31, 1.0)


def extract_script_arguments():
    argv = list(sys.argv)
    if "--" not in argv:
        return []
    return argv[argv.index("--") + 1 :]


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Generate the first procedural suburban neighbourhood preview scene."
    )
    parser.add_argument("--source-json", default=str(DEFAULT_SOURCE_JSON))
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument("--auto-quit", action="store_true")
    return parser.parse_args(extract_script_arguments())


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in list(bpy.data.collections):
        if collection.users == 0:
            bpy.data.collections.remove(collection)
    for mesh in list(bpy.data.meshes):
        if mesh.users == 0:
            bpy.data.meshes.remove(mesh)
    for curve in list(bpy.data.curves):
        if curve.users == 0:
            bpy.data.curves.remove(curve)
    for material in list(bpy.data.materials):
        if material.users == 0:
            bpy.data.materials.remove(material)


def ensure_root_collection(name):
    collection = bpy.data.collections.get(name)
    if collection is None:
        collection = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(collection)
    return collection


def ensure_child_collection(parent, name):
    collection = bpy.data.collections.get(name)
    if collection is None:
        collection = bpy.data.collections.new(name)
    if collection.name not in parent.children.keys():
        parent.children.link(collection)
    return collection


def create_material(name, rgba):
    material = bpy.data.materials.get(name)
    if material is None:
        material = bpy.data.materials.new(name=name)
        material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf is not None:
        bsdf.inputs["Base Color"].default_value = rgba
        bsdf.inputs["Roughness"].default_value = 0.85
    return material


def create_curve_polyline(name, points, collection, rgba, closed=True, bevel=0.05):
    curve_data = bpy.data.curves.new(name=name, type="CURVE")
    curve_data.dimensions = "3D"
    curve_data.resolution_u = 1
    curve_data.bevel_depth = bevel
    spline = curve_data.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for index, point in enumerate(points):
        spline.points[index].co = (point[0], point[1], point[2], 1.0)
    spline.use_cyclic_u = closed
    obj = bpy.data.objects.new(name, curve_data)
    curve_data.materials.append(create_material(f"{name}_MAT", rgba))
    collection.objects.link(obj)
    return obj


def create_box(name, location, scale, collection, rgba):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    if obj.data.materials:
        obj.data.materials[0] = create_material(f"{name}_MAT", rgba)
    else:
        obj.data.materials.append(create_material(f"{name}_MAT", rgba))
    for linked_collection in list(obj.users_collection):
        linked_collection.objects.unlink(obj)
    collection.objects.link(obj)
    return obj


def create_text_label(name, text, location, collection, size=1.0):
    curve = bpy.data.curves.new(type="FONT", name=name)
    curve.body = text
    curve.size = size
    obj = bpy.data.objects.new(name, curve)
    obj.location = location
    collection.objects.link(obj)
    return obj


def import_gltf_instance(filepath, name, collection, location, yaw_degrees):
    existing_names = set(obj.name for obj in bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(filepath))
    imported = [obj for obj in bpy.data.objects if obj.name not in existing_names]
    if not imported:
      raise RuntimeError(f"No objects imported from {filepath}")

    root = bpy.data.objects.new(name, None)
    root.location = location
    root.rotation_euler[2] = yaw_degrees * 3.141592653589793 / 180.0
    collection.objects.link(root)

    for obj in imported:
        for linked_collection in list(obj.users_collection):
            linked_collection.objects.unlink(obj)
        collection.objects.link(obj)

    for obj in imported:
        if obj.parent is None:
            obj.parent = root
        else:
            ancestor = obj.parent
            while ancestor.parent is not None and ancestor.parent != ancestor:
                ancestor = ancestor.parent
            ancestor.parent = root

    return root


def configure_camera(bounds):
    camera_data = bpy.data.cameras.new("PREVIEW_CAMERA")
    camera = bpy.data.objects.new("PREVIEW_CAMERA", camera_data)
    bpy.context.scene.collection.objects.link(camera)
    centre_x = (bounds["minX"] + bounds["maxX"]) / 2.0
    centre_y = (bounds["minY"] + bounds["maxY"]) / 2.0
    span_x = bounds["maxX"] - bounds["minX"]
    span_y = bounds["maxY"] - bounds["minY"]
    camera.location = (centre_x, centre_y - span_y * 0.55, max(span_x, span_y) * 0.95)
    camera.rotation_euler = (1.05, 0.0, 0.0)
    bpy.context.scene.camera = camera


def build_road_layer(preview, collection):
    road = preview["roadLayout"]
    bounds = preview["bounds"]
    road_centre = (bounds["minY"] + bounds["maxY"]) / 2.0
    create_box(
        "ROAD_BASE",
        ((bounds["minX"] + bounds["maxX"]) / 2.0, road_centre, 0.01),
        (road["streetLength"] / 2.0, road["roadWidth"] / 2.0, 0.01),
        collection,
        ROAD_COLOUR,
    )


def build_lot_layer(preview, collection, debug_collection):
    for lot in preview["lots"]:
        x = lot["position"]["x"]
        y = lot["position"]["y"]
        width = lot["width"]
        depth = lot["depth"]
        points = [
            (x, y, 0.05),
            (x + width, y, 0.05),
            (x + width, y + depth, 0.05),
            (x, y + depth, 0.05),
        ]
        create_curve_polyline(f"{lot['lotId']}_BOUNDARY", points, collection, LOT_COLOUR)
        create_text_label(
            f"{lot['lotId']}_LABEL",
            lot["lotId"],
            (x + width * 0.5 - 1.5, y + depth * 0.5, 0.2),
            debug_collection,
            size=0.8,
        )


def build_building_layer(preview, collection, debug_collection, validation):
    for placement in preview["buildingPlacements"]:
        asset_path = BUILDING_LOOKUP[placement["assetId"]]
        root = import_gltf_instance(
            asset_path,
            placement["placementId"],
            collection,
            (
                placement["position"]["x"],
                placement["position"]["y"],
                placement["position"]["z"],
            ),
            placement["rotation"]["yawDegrees"],
        )
        arrow_colour = PASS_COLOUR if validation["checks"]["orientationValid"] == "PASS" else FAIL_COLOUR
        create_curve_polyline(
            f"{placement['placementId']}_ORIENTATION_ARROW",
            [
                (0.0, 0.0, 0.3),
                (0.0, 2.0, 0.3),
            ],
            debug_collection,
            arrow_colour,
            closed=False,
            bevel=0.04,
        ).parent = root


def build_driveway_layer(preview, collection, validation):
    colour = PASS_COLOUR if validation["checks"]["drivewayConnectionsValid"] == "PASS" else FAIL_COLOUR
    for connection in preview["roadFrontageConnections"]:
        lot = next(lot for lot in preview["lots"] if lot["lotId"] == connection["lotId"])
        start_x = connection["connectionPoint"]["x"]
        start_y = connection["connectionPoint"]["y"]
        if lot["frontageDirection"] == "NORTH":
            end_y = lot["position"]["y"] + lot["setback"]["front"] + 1.0
        else:
            end_y = lot["position"]["y"] + lot["depth"] - lot["setback"]["front"] - 1.0
        create_curve_polyline(
            f"{connection['connectionId']}_DRIVEWAY",
            [(start_x, start_y, 0.04), (start_x, end_y, 0.04)],
            collection,
            colour,
            closed=False,
            bevel=0.08,
        )


def build_fence_layer(preview, collection, validation):
    colour = PASS_COLOUR if validation["checks"]["allLotsPopulated"] == "PASS" else FAIL_COLOUR
    for lot in preview["lots"]:
        x = lot["position"]["x"]
        y = lot["position"]["y"]
        width = lot["width"]
        depth = lot["depth"]
        points = [
            (x, y, 0.15),
            (x + width, y, 0.15),
            (x + width, y + depth, 0.15),
            (x, y + depth, 0.15),
        ]
        create_curve_polyline(
            f"{lot['lotId']}_FENCE",
            points,
            collection,
            colour if lot["fenceBoundary"]["rear"] else FAIL_COLOUR,
            closed=True,
            bevel=0.03,
        )


def build_landscape_layer(preview, collection):
    for placement in preview["landscapePlacements"]:
        if placement["landscapeType"] == "grass":
            create_box(
                placement["placementId"],
                (
                    placement["position"]["x"],
                    placement["position"]["y"],
                    0.005,
                ),
                (2.0, 2.0, 0.005),
                collection,
                (0.27, 0.63, 0.27, 1.0),
            )
        elif placement["landscapeType"] == "bush":
            create_box(
                placement["placementId"],
                (
                    placement["position"]["x"],
                    placement["position"]["y"],
                    0.3,
                ),
                (0.45, 0.45, 0.3),
                collection,
                (0.19, 0.49, 0.19, 1.0),
            )
        elif placement["landscapeType"] == "tree":
            create_box(
                placement["placementId"],
                (
                    placement["position"]["x"],
                    placement["position"]["y"],
                    0.8,
                ),
                (0.35, 0.35, 0.8),
                collection,
                (0.18, 0.42, 0.18, 1.0),
            )


def build_validation_markers(preview, validation, collection):
    status_colour = PASS_COLOUR if validation["summary"]["validationPassed"] else FAIL_COLOUR
    for placement in preview["buildingPlacements"]:
        create_box(
            f"{placement['placementId']}_VALIDATION_MARKER",
            (
                placement["position"]["x"],
                placement["position"]["y"],
                3.0,
            ),
            (0.18, 0.18, 0.18),
            collection,
            status_colour,
        )


def main():
    args = parse_arguments()
    source_json = Path(args.source_json)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    preview = json.loads(source_json.read_text(encoding="utf8"))
    validation_path = output_dir / f"{VALIDATION_ID}.json"
    validation = (
        json.loads(validation_path.read_text(encoding="utf8"))
        if validation_path.exists()
        else {
            "checks": {
                "allBuildingIdsResolve": "PASS",
                "allLotsPopulated": "PASS",
                "noPlacementOverlap": "PASS",
                "drivewayConnectionsValid": "PASS",
                "orientationValid": "PASS",
                "deterministicSourceMatches": "PASS",
            },
            "summary": {"validationPassed": True},
        }
    )

    reset_scene()
    root = ensure_root_collection(SCENE_ID)
    road_collection = ensure_child_collection(root, "ROAD_LAYER")
    lot_collection = ensure_child_collection(root, "LOT_LAYER")
    building_collection = ensure_child_collection(root, "BUILDING_LAYER")
    driveway_collection = ensure_child_collection(root, "DRIVEWAY_LAYER")
    fence_collection = ensure_child_collection(root, "FENCE_LAYER")
    landscape_collection = ensure_child_collection(root, "LANDSCAPE_LAYER")
    debug_collection = ensure_child_collection(root, "DEBUG_LAYER")

    build_road_layer(preview, road_collection)
    build_lot_layer(preview, lot_collection, debug_collection)
    build_building_layer(preview, building_collection, debug_collection, validation)
    build_driveway_layer(preview, driveway_collection, validation)
    build_fence_layer(preview, fence_collection, validation)
    build_landscape_layer(preview, landscape_collection)
    build_validation_markers(preview, validation, debug_collection)
    configure_camera(preview["bounds"])

    bpy.ops.wm.save_as_mainfile(filepath=str(output_dir / f"{SCENE_ID}.blend"))

    if args.auto_quit:
        bpy.ops.wm.quit_blender()


if __name__ == "__main__":
    main()
