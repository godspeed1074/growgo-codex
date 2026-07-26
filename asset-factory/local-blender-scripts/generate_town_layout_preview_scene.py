"""
GrowGo procedural town visual preview prototype.

This script consumes the deterministic town preview JSON and builds a preview-only
inspection scene in Blender. It keeps districts as instance references rather than
rebuilding district geometry, and it focuses on boundary, zone, corridor, and
relationship readability for review.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

import bpy


SCENE_ID = "TOWN_LAYOUT_001_PREVIEW_SCENE_001"
REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE_JSON = (
    REPO_ROOT
    / "asset-factory-workspace"
    / "procedural-previews"
    / "TOWN_LAYOUT_001_PREVIEW_001.json"
)
DEFAULT_OUTPUT_DIR = (
    REPO_ROOT
    / "asset-factory-workspace"
    / "procedural-previews"
    / SCENE_ID
)

TOWN_COLOUR = (0.11, 0.71, 0.62, 1.0)
SUBURBAN_DISTRICT_COLOUR = (0.21, 0.67, 0.40, 0.56)
COASTAL_DISTRICT_COLOUR = (0.16, 0.54, 0.88, 0.56)
MIXED_DISTRICT_COLOUR = (0.90, 0.70, 0.22, 0.56)
CENTRE_COLOUR = (0.95, 0.56, 0.22, 0.72)
COMMERCIAL_COLOUR = (0.96, 0.48, 0.18, 0.72)
CIVIC_COLOUR = (0.70, 0.34, 0.78, 0.70)
PARK_COLOUR = (0.31, 0.71, 0.35, 0.62)
SPORTS_COLOUR = (0.25, 0.61, 0.28, 0.62)
CORRIDOR_COLOUR = (0.29, 0.66, 0.45, 0.62)
TRAIL_COLOUR = (0.90, 0.85, 0.68, 0.84)
COLLECTOR_COLOUR = (0.22, 0.22, 0.24, 1.0)
ARTERIAL_COLOUR = (0.66, 0.33, 0.18, 1.0)
BUS_COLOUR = (0.89, 0.72, 0.23, 1.0)
RAIL_COLOUR = (0.52, 0.52, 0.60, 1.0)
LANDMARK_COLOUR = (0.83, 0.34, 0.24, 0.80)
RURAL_EDGE_COLOUR = (0.42, 0.56, 0.26, 0.32)
PASS_COLOUR = (0.18, 0.78, 0.32, 1.0)
FAIL_COLOUR = (0.85, 0.18, 0.18, 1.0)


def extract_script_arguments():
    argv = list(sys.argv)
    if "--" not in argv:
        return []
    return argv[argv.index("--") + 1 :]


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Generate the first procedural town preview scene."
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
        bsdf.inputs["Roughness"].default_value = 0.84
        bsdf.inputs["Alpha"].default_value = rgba[3]
    material.blend_method = "BLEND"
    return material


def create_curve_polyline(name, points, collection, rgba, closed=True, bevel=0.1):
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


def create_text_label(name, text, location, collection, size=1.4):
    curve = bpy.data.curves.new(type="FONT", name=name)
    curve.body = text
    curve.size = size
    obj = bpy.data.objects.new(name, curve)
    obj.location = location
    collection.objects.link(obj)
    return obj


def bounds_rectangle_points(bounds, z=0.05):
    return [
        (bounds["minX"], bounds["minY"], z),
        (bounds["maxX"], bounds["minY"], z),
        (bounds["maxX"], bounds["maxY"], z),
        (bounds["minX"], bounds["maxY"], z),
    ]


def boundary_to_box(boundary, z=0.12):
    return (
        boundary["x"],
        boundary["y"],
        z,
    ), (
        boundary["width"] / 2.0,
        boundary["depth"] / 2.0,
        z,
    )


def district_colour(district_type):
    if district_type == "RESIDENTIAL_DISTRICT_COASTAL":
        return COASTAL_DISTRICT_COLOUR
    if district_type == "RESIDENTIAL_DISTRICT_MIXED":
        return MIXED_DISTRICT_COLOUR
    return SUBURBAN_DISTRICT_COLOUR


def recreation_colour(recreation_type):
    if recreation_type == "SPORTS_FIELD":
        return SPORTS_COLOUR
    if recreation_type == "GREEN_CORRIDOR":
        return CORRIDOR_COLOUR
    if recreation_type == "WALKING_TRAIL":
        return TRAIL_COLOUR
    return PARK_COLOUR


def transport_colour(corridor_type):
    if corridor_type == "ARTERIAL_ROAD":
        return ARTERIAL_COLOUR
    if corridor_type == "BUS_CORRIDOR":
        return BUS_COLOUR
    if corridor_type == "RAILWAY_CORRIDOR":
        return RAIL_COLOUR
    return COLLECTOR_COLOUR


def configure_primary_camera(bounds):
    camera_data = bpy.data.cameras.new("TOWN_PREVIEW_CAMERA")
    camera = bpy.data.objects.new("TOWN_PREVIEW_CAMERA", camera_data)
    bpy.context.scene.collection.objects.link(camera)
    centre_x = (bounds["minX"] + bounds["maxX"]) / 2.0
    centre_y = (bounds["minY"] + bounds["maxY"]) / 2.0
    span_x = bounds["maxX"] - bounds["minX"]
    span_y = bounds["maxY"] - bounds["minY"]
    camera.location = (centre_x, centre_y - span_y * 0.78, max(span_x, span_y) * 0.94)
    camera.rotation_euler = (1.01, 0.0, 0.0)
    bpy.context.scene.camera = camera


def create_capture_cameras(metadata):
    capture_workflow = metadata["visualCaptureWorkflow"]
    for profile_key in ("topDown", "angledTown25D", "centreAndDistrictOverview"):
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


def build_town_boundary(metadata, collection):
    create_curve_polyline(
        "TOWN_BOUNDARY",
        bounds_rectangle_points(metadata["townLayer"]["townBounds"], z=0.12),
        collection,
        TOWN_COLOUR,
        closed=True,
        bevel=0.16,
    )


def build_districts(metadata, collection, debug_collection):
    for district in metadata["districtLayer"]["resolvedDistrictInstances"]:
        location = (
            district["position"]["x"],
            district["position"]["y"],
            16.0,
        )
        scale = (
            district["districtFootprint"]["width"] / 2.0,
            district["districtFootprint"]["depth"] / 2.0,
            16.0,
        )
        create_box(
            district["districtPlacementId"],
            location,
            scale,
            collection,
            district_colour(district["districtType"]),
        )
        create_text_label(
            f"{district['districtPlacementId']}_LABEL",
            district["districtPlacementId"],
            (
                district["position"]["x"] - district["districtFootprint"]["width"] * 0.22,
                district["position"]["y"],
                34.0,
            ),
            debug_collection,
            size=10.0,
        )


def build_boundary_boxes(items, collection, colour, label_collection, label_key, size=8.0):
    for item in items:
        location, scale = boundary_to_box(item["boundary"])
        create_box(item[label_key], location, scale, collection, colour)
        create_text_label(
            f"{item[label_key]}_LABEL",
            item[label_key],
            (location[0], location[1], scale[2] * 2.4 + 0.4),
            label_collection,
            size=size,
        )


def build_transport(metadata, collection, debug_collection):
    for corridor in metadata["transportLayer"]["resolvedTransportCorridors"]:
        points = [
            (point["x"], point["y"], 0.25) for point in corridor["path"]
        ]
        create_curve_polyline(
            corridor["corridorId"],
            points,
            collection,
            transport_colour(corridor["corridorType"]),
            closed=False,
            bevel=6.0 if corridor["corridorType"] == "ARTERIAL_ROAD" else 3.4,
        )
        if points:
            create_text_label(
                f"{corridor['corridorId']}_LABEL",
                corridor["corridorId"],
                (points[0][0], points[0][1], 8.0),
                debug_collection,
                size=7.0,
            )


def load_json(source_path):
    return json.loads(Path(source_path).read_text(encoding="utf-8"))


def main():
    args = parse_arguments()
    preview = load_json(args.source_json)
    metadata_path = Path(args.output_dir) / "preview-scene-metadata.json"
    metadata = load_json(metadata_path)

    reset_scene()

    root = ensure_root_collection("GrowGo_Town_Preview")
    boundary_collection = ensure_child_collection(root, "00_BOUNDARY")
    district_collection = ensure_child_collection(root, "01_DISTRICTS")
    centre_collection = ensure_child_collection(root, "02_CENTRE")
    commercial_collection = ensure_child_collection(root, "03_COMMERCIAL")
    civic_collection = ensure_child_collection(root, "04_CIVIC")
    transport_collection = ensure_child_collection(root, "05_TRANSPORT")
    recreation_collection = ensure_child_collection(root, "06_RECREATION")
    landmark_collection = ensure_child_collection(root, "07_LANDMARKS")
    rural_collection = ensure_child_collection(root, "08_RURAL_EDGES")
    debug_collection = ensure_child_collection(root, "09_DEBUG")

    build_town_boundary(metadata, boundary_collection)
    build_districts(metadata, district_collection, debug_collection)
    build_boundary_boxes(
        metadata["townCentreLayer"]["resolvedCentres"],
        centre_collection,
        CENTRE_COLOUR,
        debug_collection,
        "centreId",
        size=7.5,
    )
    build_boundary_boxes(
        metadata["commercialLayer"]["resolvedCommercialZones"],
        commercial_collection,
        COMMERCIAL_COLOUR,
        debug_collection,
        "commercialZoneId",
        size=6.4,
    )
    build_boundary_boxes(
        metadata["civicLayer"]["resolvedCivicReserves"],
        civic_collection,
        CIVIC_COLOUR,
        debug_collection,
        "civicReserveId",
        size=6.4,
    )
    build_transport(metadata, transport_collection, debug_collection)
    for zone in metadata["recreationLayer"]["resolvedRecreationZones"]:
        location, scale = boundary_to_box(zone["boundary"], z=0.1)
        create_box(
            zone["recreationZoneId"],
            location,
            scale,
            recreation_collection,
            recreation_colour(zone["recreationType"]),
        )
    build_boundary_boxes(
        metadata["landmarkLayer"]["resolvedLandmarkReserves"],
        landmark_collection,
        LANDMARK_COLOUR,
        debug_collection,
        "landmarkReserveId",
        size=6.2,
    )
    for zone in metadata["ruralTransitionLayer"]["resolvedRuralTransitions"]:
        location, scale = boundary_to_box(zone["boundary"], z=0.08)
        create_box(
            zone["ruralTransitionZoneId"],
            location,
            scale,
            rural_collection,
            RURAL_EDGE_COLOUR,
        )

    configure_primary_camera(preview["townBounds"])
    create_capture_cameras(metadata)

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(output_dir / f"{SCENE_ID}.blend"))

    if args.auto_quit:
        bpy.ops.wm.quit_blender()


if __name__ == "__main__":
    main()
