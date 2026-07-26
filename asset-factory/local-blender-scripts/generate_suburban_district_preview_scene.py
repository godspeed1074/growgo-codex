"""
GrowGo procedural suburban district visual preview prototype.

This script consumes the deterministic suburban district preview JSON and builds
an inspection scene in Blender using preview-only block, connector, zone, open
space, and reserve geometry. It deliberately keeps district blocks as instance
references instead of regenerating neighbourhood geometry.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

import bpy


SCENE_ID = "SUBURBAN_DISTRICT_001_PREVIEW_SCENE_001"
REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE_JSON = (
    REPO_ROOT
    / "asset-factory-workspace"
    / "procedural-previews"
    / "SUBURBAN_DISTRICT_001_PREVIEW_001.json"
)
DEFAULT_OUTPUT_DIR = (
    REPO_ROOT
    / "asset-factory-workspace"
    / "procedural-previews"
    / SCENE_ID
)

DISTRICT_COLOUR = (0.12, 0.74, 0.61, 1.0)
BLOCK_COLOUR = (0.16, 0.52, 0.92, 1.0)
LOCAL_ROAD_COLOUR = (0.18, 0.18, 0.20, 1.0)
COLLECTOR_ROAD_COLOUR = (0.27, 0.27, 0.30, 1.0)
ARTERIAL_PLACEHOLDER_COLOUR = (0.67, 0.37, 0.18, 1.0)
OPEN_SPACE_COLOUR = (0.33, 0.62, 0.29, 0.65)
PARK_COLOUR = (0.25, 0.72, 0.35, 0.65)
COMMUNITY_COLOUR = (0.88, 0.72, 0.22, 0.65)
COMMERCIAL_COLOUR = (0.92, 0.52, 0.18, 0.65)
RESERVE_COLOUR = (0.70, 0.30, 0.78, 0.65)
SEAM_COLOUR = (0.19, 0.72, 0.58, 0.50)
PEDESTRIAN_COLOUR = (0.94, 0.91, 0.68, 1.0)
PASS_COLOUR = (0.18, 0.78, 0.32, 1.0)
FAIL_COLOUR = (0.85, 0.18, 0.18, 1.0)


def extract_script_arguments():
    argv = list(sys.argv)
    if "--" not in argv:
        return []
    return argv[argv.index("--") + 1 :]


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Generate the first procedural suburban district preview scene."
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
        bsdf.inputs["Alpha"].default_value = rgba[3]
    material.blend_method = "BLEND"
    return material


def create_curve_polyline(name, points, collection, rgba, closed=True, bevel=0.08):
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


def rectangle_points(boundary, z=0.05):
    return [
        (boundary["minX"], boundary["minY"], z),
        (boundary["maxX"], boundary["minY"], z),
        (boundary["maxX"], boundary["maxY"], z),
        (boundary["minX"], boundary["maxY"], z),
    ]


def zone_colour(zone_type):
    if zone_type == "OPEN_SPACE":
        return OPEN_SPACE_COLOUR
    if zone_type == "PARK_RESERVE":
        return PARK_COLOUR
    if zone_type == "COMMUNITY_ZONE":
        return COMMUNITY_COLOUR
    if zone_type == "COMMERCIAL_EDGE_ZONE":
        return COMMERCIAL_COLOUR
    return (0.28, 0.64, 0.38, 0.45)


def connector_colour(hierarchy):
    if hierarchy == "collector_connection":
        return COLLECTOR_ROAD_COLOUR
    if hierarchy == "future_arterial_connection":
        return ARTERIAL_PLACEHOLDER_COLOUR
    return LOCAL_ROAD_COLOUR


def configure_primary_camera(bounds):
    camera_data = bpy.data.cameras.new("DISTRICT_PREVIEW_CAMERA")
    camera = bpy.data.objects.new("DISTRICT_PREVIEW_CAMERA", camera_data)
    bpy.context.scene.collection.objects.link(camera)
    centre_x = (bounds["minX"] + bounds["maxX"]) / 2.0
    centre_y = (bounds["minY"] + bounds["maxY"]) / 2.0
    span_x = bounds["maxX"] - bounds["minX"]
    span_y = bounds["maxY"] - bounds["minY"]
    camera.location = (centre_x, centre_y - span_y * 0.72, max(span_x, span_y) * 0.88)
    camera.rotation_euler = (1.01, 0.0, 0.0)
    bpy.context.scene.camera = camera


def create_capture_cameras(metadata):
    capture_workflow = metadata["visualCaptureWorkflow"]
    for profile_key in ("topDown", "angled25D", "streetBlockOverview"):
        profile = capture_workflow[profile_key]
        camera = bpy.data.objects.new(
            profile["cameraId"], bpy.data.cameras.new(profile["cameraId"])
        )
        camera.location = (
            profile["position"]["x"],
            profile["position"]["y"],
            profile["position"]["z"],
        )
        camera.rotation_euler = (
            profile["rotation"]["x"] * 3.141592653589793 / 180.0,
            profile["rotation"]["y"] * 3.141592653589793 / 180.0,
            profile["rotation"]["z"] * 3.141592653589793 / 180.0,
        )
        bpy.context.scene.collection.objects.link(camera)


def build_district_boundary(metadata, collection):
    create_curve_polyline(
        "DISTRICT_BOUNDARY",
        rectangle_points(metadata["districtLayer"]["districtBounds"], z=0.08),
        collection,
        DISTRICT_COLOUR,
        closed=True,
        bevel=0.12,
    )


def build_block_layer(preview, block_collection, debug_collection):
    for block in preview["blockPlacements"]:
        block_id = block["blockInstanceId"]
        footprint = block["blockFootprint"]
        centre_x = block["position"]["x"]
        centre_y = block["position"]["y"]
        lot_scale = max(0.16, min(0.34, block["estimatedLotCount"] / 100.0))
        boundary = {
            "minX": centre_x - footprint["width"] / 2.0,
            "maxX": centre_x + footprint["width"] / 2.0,
            "minY": centre_y - footprint["depth"] / 2.0,
            "maxY": centre_y + footprint["depth"] / 2.0,
        }
        create_curve_polyline(
            f"{block_id}_BOUNDARY",
            rectangle_points(boundary, z=0.11),
            block_collection,
            BLOCK_COLOUR,
            closed=True,
            bevel=0.09,
        )
        create_box(
            f"{block_id}_MASSING",
            (centre_x, centre_y, 0.18),
            (footprint["width"] / 2.0, footprint["depth"] / 2.0, lot_scale),
            block_collection,
            (0.20, 0.33, 0.58, 0.18),
        )
        create_text_label(
            f"{block_id}_LABEL",
            block_id,
            (centre_x - 18.0, centre_y + 6.0, 0.6),
            debug_collection,
            size=2.2,
        )


def build_road_connector_layer(preview, collection, debug_collection):
    for connector in preview["roadConnectors"]:
        points = [
            (connector["start"]["x"], connector["start"]["y"], 0.03),
            (connector["end"]["x"], connector["end"]["y"], 0.03),
        ]
        create_curve_polyline(
            connector["connectorId"],
            points,
            collection,
            connector_colour(connector["hierarchy"]),
            closed=False,
            bevel=max(0.12, connector["width"] * 0.02),
        )
        midpoint_x = (connector["start"]["x"] + connector["end"]["x"]) / 2.0
        midpoint_y = (connector["start"]["y"] + connector["end"]["y"]) / 2.0
        create_text_label(
            f"{connector['connectorId']}_LABEL",
            connector["hierarchy"],
            (midpoint_x + 3.0, midpoint_y + 1.2, 0.45),
            debug_collection,
            size=1.3,
        )


def build_zone_layer(preview, collection, debug_collection):
    for zone in preview["landUseZones"]:
        create_curve_polyline(
            f"{zone['zoneId']}_BOUNDARY",
            rectangle_points(zone["boundary"], z=0.02),
            collection,
            zone_colour(zone["zoneType"]),
            closed=True,
            bevel=0.05,
        )
        centre_x = (zone["boundary"]["minX"] + zone["boundary"]["maxX"]) / 2.0
        centre_y = (zone["boundary"]["minY"] + zone["boundary"]["maxY"]) / 2.0
        create_text_label(
            f"{zone['zoneId']}_LABEL",
            zone["zoneType"],
            (centre_x - 18.0, centre_y, 0.3),
            debug_collection,
            size=1.8,
        )


def build_open_space_layer(preview, collection, debug_collection):
    for open_space in preview["openSpacePlacements"]:
        position = open_space["position"]
        size = open_space["size"]
        colour = OPEN_SPACE_COLOUR if open_space["openSpaceType"] != "park" else PARK_COLOUR
        create_box(
            open_space["openSpaceId"],
            (position["x"], position["y"], 0.02),
            (size["width"] / 2.0, size["depth"] / 2.0, 0.02),
            collection,
            colour,
        )
        create_text_label(
            f"{open_space['openSpaceId']}_LABEL",
            open_space["openSpaceType"],
            (position["x"] - 8.0, position["y"], 0.28),
            debug_collection,
            size=1.2,
        )


def build_seam_layer(preview, collection, debug_collection):
    seam = preview["seamTreatment"]
    create_curve_polyline(
        f"{seam['seamId']}_BOUNDARY",
        rectangle_points(seam["boundary"], z=0.06),
        collection,
        SEAM_COLOUR,
        closed=True,
        bevel=0.08,
    )
    centre_x = (seam["boundary"]["minX"] + seam["boundary"]["maxX"]) / 2.0
    centre_y = (seam["boundary"]["minY"] + seam["boundary"]["maxY"]) / 2.0
    create_text_label(
        f"{seam['seamId']}_LABEL",
        seam["seamType"],
        (centre_x - 22.0, centre_y, 0.34),
        debug_collection,
        size=1.6,
    )


def build_pedestrian_layer(preview, collection, debug_collection):
    for link in preview["pedestrianNetwork"]:
        points = [(point["x"], point["y"], 0.09) for point in link["path"]]
        create_curve_polyline(
            link["linkId"],
            points,
            collection,
            PEDESTRIAN_COLOUR,
            closed=False,
            bevel=0.16,
        )
        midpoint = points[len(points) // 2]
        create_text_label(
            f"{link['linkId']}_LABEL",
            link["linkType"],
            (midpoint[0] + 2.0, midpoint[1] + 1.2, 0.42),
            debug_collection,
            size=1.0,
        )


def build_destination_reserves(preview, collection, debug_collection):
    for reserve in preview["destinationReserves"]:
        create_curve_polyline(
            f"{reserve['reserveId']}_BOUNDARY",
            rectangle_points(reserve["boundary"], z=0.04),
            collection,
            RESERVE_COLOUR,
            closed=True,
            bevel=0.07,
        )
        centre_x = (reserve["boundary"]["minX"] + reserve["boundary"]["maxX"]) / 2.0
        centre_y = (reserve["boundary"]["minY"] + reserve["boundary"]["maxY"]) / 2.0
        create_text_label(
            f"{reserve['reserveId']}_LABEL",
            reserve["futureUse"],
            (centre_x - 12.0, centre_y, 0.42),
            debug_collection,
            size=1.3,
        )


def build_validation_marker(preview, collection):
    valid = preview["validationResult"]["validationPassed"]
    colour = PASS_COLOUR if valid else FAIL_COLOUR
    create_box(
        "DISTRICT_VALIDATION_MARKER",
        (preview["districtBounds"]["minX"] + 12.0, preview["districtBounds"]["maxY"] - 12.0, 1.0),
        (2.2, 2.2, 1.0),
        collection,
        colour,
    )


def save_preview_metadata(output_dir):
    output_dir.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(output_dir / f"{SCENE_ID}.blend"))


def load_json(path_value):
    return json.loads(Path(path_value).read_text(encoding="utf8"))


def main():
    args = parse_arguments()
    source_json = Path(args.source_json)
    output_dir = Path(args.output_dir)
    preview = load_json(source_json)
    metadata = load_json(output_dir / "preview-scene-metadata.json")

    reset_scene()
    root = ensure_root_collection(SCENE_ID)
    boundary_collection = ensure_child_collection(root, "DISTRICT_BOUNDARY")
    block_collection = ensure_child_collection(root, "STREET_BLOCKS")
    connector_collection = ensure_child_collection(root, "ROAD_CONNECTORS")
    seam_collection = ensure_child_collection(root, "DISTRICT_SEAM")
    pedestrian_collection = ensure_child_collection(root, "PEDESTRIAN_NETWORK")
    zone_collection = ensure_child_collection(root, "LAND_USE_ZONES")
    open_space_collection = ensure_child_collection(root, "OPEN_SPACES")
    reserve_collection = ensure_child_collection(root, "DESTINATION_RESERVES")
    debug_collection = ensure_child_collection(root, "DEBUG")

    build_district_boundary(metadata, boundary_collection)
    build_block_layer(preview, block_collection, debug_collection)
    build_road_connector_layer(preview, connector_collection, debug_collection)
    build_seam_layer(preview, seam_collection, debug_collection)
    build_pedestrian_layer(preview, pedestrian_collection, debug_collection)
    build_zone_layer(preview, zone_collection, debug_collection)
    build_open_space_layer(preview, open_space_collection, debug_collection)
    build_destination_reserves(preview, reserve_collection, debug_collection)
    build_validation_marker(preview, debug_collection)
    configure_primary_camera(preview["districtBounds"])
    create_capture_cameras(metadata)
    save_preview_metadata(output_dir)

    if args.auto_quit:
        bpy.ops.wm.quit_blender()


if __name__ == "__main__":
    main()
