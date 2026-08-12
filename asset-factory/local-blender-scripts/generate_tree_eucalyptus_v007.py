"""Build TREE_EUCALYPTUS_001_v007 as an art-directed review candidate.

The macro composition is authored explicitly: fixed limb control points, fixed
foliage-island centres, and fixed card layouts.  Procedural helpers only turn
those authored decisions into lightweight geometry.
"""
from __future__ import annotations

import argparse
import json
import math
import struct
import sys
from pathlib import Path

import bpy
from mathutils import Euler, Vector


ASSET_ID = "TREE_EUCALYPTUS_001"
VERSION = "v007"
STEM = f"{ASSET_ID}_{VERSION}"
FAMILY_ID = "COASTAL_NATURE_FAMILY_001"
RECIPE_ID = "TREE_EUCALYPTUS_RECIPE_001"
ATLAS_NAME = "TREE_EUCALYPTUS_001_v006_FOLIAGE_ATLAS_512.png"

BARK = {
    "CREAM": (0.86, 0.72, 0.53, 1.0),
    "TAN": (0.72, 0.48, 0.28, 1.0),
    "PEACH": (0.84, 0.52, 0.29, 1.0),
    "RUST": (0.55, 0.25, 0.09, 1.0),
}

# Authored from the approved concept: a trunk plus seven dominant visible
# systems.  These are composition decisions, not generated distributions.
MAJOR_PATHS = [
    ("MAIN_TRUNK", 0.72, 0.25, [(0, 0, 0), (-.10, .05, 1.5), (.12, .12, 3.0), (-.08, .08, 4.6), (.18, .02, 6.1), (.02, -.04, 7.6), (.12, -.08, 9.2), (.02, -.18, 10.7)]),
    ("LOWER_LEFT_SWEEP", .44, .12, [(-.02, .02, 5.0), (-.72, .18, 5.9), (-1.55, .55, 6.8), (-2.35, 1.05, 7.5), (-3.20, 1.36, 8.0)]),
    ("MID_LEFT_ARCH", .40, .10, [(-.12, .05, 6.5), (-.85, -.18, 7.4), (-1.65, -.54, 8.5), (-2.55, -.83, 9.45), (-3.35, -.85, 10.1)]),
    ("UPPER_LEFT_FORK", .36, .08, [(-.03, .00, 7.8), (-.58, .34, 8.9), (-1.18, .48, 10.1), (-1.72, .46, 11.35), (-2.18, .42, 12.45)]),
    ("CENTRAL_CROWN_FORK", .34, .075, [(.08, -.05, 8.5), (.12, -.16, 9.8), (.06, -.28, 11.2), (.02, -.35, 12.95)]),
    ("MID_RIGHT_SWEEP", .43, .11, [(.10, -.02, 5.6), (.78, -.28, 6.5), (1.58, -.66, 7.5), (2.35, -1.02, 8.65), (3.18, -1.18, 9.72)]),
    ("UPPER_RIGHT_ARCH", .37, .09, [(.18, .08, 7.1), (.82, .46, 8.3), (1.38, .72, 9.55), (1.82, .74, 10.9), (2.28, .67, 12.0)]),
    ("LOWER_RIGHT_REACH", .31, .07, [(1.35, -.58, 7.35), (2.0, .02, 7.35), (2.62, .72, 7.62), (3.28, 1.28, 7.95)]),
]

SECONDARY_PATHS = [
    ("LEFT_TOP_SUPPORT", .18, .045, [(-1.16, .47, 10.05), (-2.05, .05, 10.72), (-2.72, -.20, 11.18)]),
    ("RIGHT_TOP_SUPPORT", .18, .045, [(1.38, .70, 9.55), (2.18, .18, 10.15), (2.78, -.05, 10.55)]),
    ("LEFT_LOWER_SUPPORT", .16, .04, [(-1.54, .54, 6.8), (-2.38, .20, 7.12), (-2.92, -.02, 7.36)]),
    ("CENTRE_BACK_SUPPORT", .16, .04, [(.05, -.20, 9.4), (-.62, -1.00, 10.0), (-.82, -1.68, 10.5)]),
]

# Nine intentionally placed islands reproduce the top/middle/lower rhythm.
# centre xyz, half-width, half-depth, half-height, dominant atlas tile.
ISLANDS = [
    ("TOP_LEFT", (-2.18, .42, 12.42), 1.46, 1.05, .98, 0),
    ("TOP_CENTRE", (.02, -.38, 13.02), 1.42, 1.05, .88, 1),
    ("TOP_RIGHT", (2.28, 1.18, 12.00), 1.48, 1.16, .96, 0),
    ("MID_LEFT", (-3.35, -.84, 10.08), 1.54, 1.16, 1.00, 2),
    ("MID_CENTRE_BACK", (-.74, -2.46, 10.50), 1.30, 1.18, .84, 3),
    ("MID_RIGHT", (3.18, -1.18, 9.74), 1.57, 1.17, 1.00, 2),
    ("LOW_LEFT", (-3.18, 1.35, 8.02), 1.42, 1.05, .90, 0),
    ("LOW_CENTRE", (-.30, -2.05, 8.25), 1.27, 1.00, .82, 3),
    ("LOW_RIGHT", (3.28, 1.62, 7.95), 1.42, 1.14, .90, 2),
]

LOD = {
    "CLOSE": {"sides": 10, "path_step": 2, "cards": 18, "secondaries": 4},
    "GAMEPLAY": {"sides": 8, "path_step": 2, "cards": 15, "secondaries": 4},
    "MAP": {"sides": 5, "path_step": 1, "cards": 6, "secondaries": 2},
}


def arguments():
    p = argparse.ArgumentParser()
    p.add_argument("--output-dir", required=True)
    p.add_argument("--preview-dir", required=True)
    p.add_argument("--atlas", required=True)
    return p.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])


def reset():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for blocks in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras, bpy.data.lights, bpy.data.images):
        for block in list(blocks):
            if block.users == 0:
                blocks.remove(block)


def flat_material(name, colour):
    m = bpy.data.materials.new(f"MAT_EUCALYPTUS_{name}_007")
    m.diffuse_color = colour
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = colour
    bsdf.inputs["Roughness"].default_value = .88
    return m


def foliage_material(atlas_path):
    m = bpy.data.materials.new("MAT_EUCALYPTUS_FOLIAGE_ATLAS_MASK_007")
    m.use_nodes = True
    m.use_backface_culling = False
    if hasattr(m, "surface_render_method"):
        m.surface_render_method = "DITHERED"
    if hasattr(m, "alpha_threshold"):
        m.alpha_threshold = .5
    nodes = m.node_tree.nodes
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(str(atlas_path), check_existing=True)
    tex.interpolation = "Linear"
    bsdf = nodes.get("Principled BSDF")
    m.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    m.node_tree.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
    bsdf.inputs["Roughness"].default_value = .9
    return m


def frame(direction):
    tangent = direction.normalized()
    helper = Vector((0, 0, 1)) if abs(tangent.z) < .9 else Vector((1, 0, 0))
    side = tangent.cross(helper).normalized()
    up = side.cross(tangent).normalized()
    return side, up


def densify(points, subdivisions):
    src = [Vector(p) for p in points]
    if subdivisions <= 1:
        return src
    out = []
    for a, b in zip(src[:-1], src[1:]):
        for i in range(subdivisions):
            t = i / subdivisions
            smooth = t * t * (3 - 2 * t)
            out.append(a.lerp(b, smooth))
    out.append(src[-1])
    return out


def tube(name, points, r0, r1, sides, subdivisions, mat, parent, collection, surface_mats=None):
    pts = densify(points, subdivisions)
    verts, faces = [], []
    for i, point in enumerate(pts):
        direction = pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]
        side, up = frame(direction)
        t = i / (len(pts) - 1)
        radius = r0 * (1 - t) + r1 * t
        for j in range(sides):
            angle = 2 * math.pi * j / sides
            shaped = radius * (1 + .035 * math.sin(j * 2.3 + i * .7))
            verts.append(tuple(point + shaped * (math.cos(angle) * side + .90 * math.sin(angle) * up)))
    for i in range(len(pts) - 1):
        for j in range(sides):
            a = i * sides + j
            b = i * sides + (j + 1) % sides
            c = (i + 1) * sides + (j + 1) % sides
            d = (i + 1) * sides + j
            faces.append((a, b, c, d))
    faces.extend([tuple(range(sides - 1, -1, -1)), tuple((len(pts) - 1) * sides + j for j in range(sides))])
    mesh = bpy.data.meshes.new(name + "_MESH")
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(mat)
    if surface_mats:
        for key in ("TAN", "PEACH", "RUST"):
            mesh.materials.append(surface_mats[key])
        side_faces = (len(pts) - 1) * sides
        if "MAIN_TRUNK" in name:
            # Broad irregular colour regions are assigned to the real trunk
            # faces. They cannot float or separate from the silhouette.
            regions = [
                (.05, .17, .52, 2, 1), (.19, .31, .16, 1, 2),
                (.33, .44, .68, 2, 1), (.47, .58, .35, 1, 3),
                (.61, .72, .80, 1, 2), (.75, .85, .46, 1, 1),
            ]
        else:
            phase = (sum(ord(ch) for ch in name) % sides) / sides
            regions = [(.30, .46, phase, 1, 1), (.62, .76, (phase + .46) % 1, 1, 2)]
        for polygon_index in range(side_faces):
            ring = polygon_index // sides
            side = polygon_index % sides
            along = ring / max(1, len(pts) - 2)
            around = side / sides
            for start, end, centre, half_width, material_index in regions:
                circular = min((around-centre) % 1, (centre-around) % 1)
                if start <= along <= end and circular <= half_width / sides:
                    mesh.polygons[polygon_index].material_index = material_index
                    break
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.parent = parent
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    return obj


def roots(lod, mats, parent, collection):
    # Deliberately uneven roots: broad left/front anchors, quieter rear roots.
    tube(f"{ASSET_ID}_{lod}_SCULPTED_ROOT_COLLAR", [(0, 0, 0), (-.05, .02, .92)],
         1.02, .60, max(7, LOD[lod]["sides"]), 2, mats["CREAM"], parent, collection)
    specs = [
        ("FRONT_LEFT", [(0, 0, .78), (-.45, -.50, .28), (-1.16, -.78, .02)], .43),
        ("FRONT_RIGHT", [(0, 0, .72), (.42, -.54, .24), (1.02, -.92, .02)], .39),
        ("LONG_LEFT", [(-.05, .02, .66), (-.76, .22, .23), (-1.48, .35, .02)], .38),
        ("RIGHT_SIDE", [(.06, .03, .62), (.63, .38, .20), (1.22, .68, .02)], .34),
        ("REAR_SHORT", [(-.02, .08, .56), (-.26, .58, .18), (-.46, .98, .02)], .29),
    ]
    count = 5 if lod != "MAP" else 4
    for name, path, width in specs[:count]:
        tube(f"{ASSET_ID}_{lod}_ROOT_{name}", path, width, .045, max(5, LOD[lod]["sides"] - 2), 2, mats["CREAM"], parent, collection)


UV_TILES = {
    0: ((.02, .52), (.48, .98)),
    1: ((.52, .52), (.98, .98)),
    2: ((.02, .02), (.48, .48)),
    3: ((.52, .02), (.98, .48)),
}

# Fixed local card composition for every island. x/y/z are proportions of the
# authored island bounds; yaw/pitch give genuine front/back and top depth.
CARD_LAYOUT = [
    (0.00, 0.00, 0.00, 0, 0, 1.00),
    (-.24, -.25, -.10, -32, 5, .82),
    (.24, .26, -.08, 34, -4, .80),
    (-.12, .34, .20, 72, 8, .64),
    (.14, -.36, .18, -70, -7, .62),
    (-.30, .08, .06, 88, 8, .56),
    (.31, -.06, .05, -88, -8, .55),
    (0, .06, .26, 0, 90, .90),
    (-.12, -.05, -.24, 38, 90, .72),
    (.13, .10, -.22, -38, 90, .70),
    (-.42, -.18, -.18, 24, 10, .48),
    (.41, .20, -.16, -26, -9, .47),
    (-.22, -.44, -.26, -54, 18, .50),
    (.21, .45, -.24, 56, -16, .49),
    (-.08, -.18, .34, 12, 28, .44),
    (.10, .20, .32, -14, -26, .43),
    (-.34, .30, .18, 104, 22, .42),
    (.35, -.31, .16, -106, -20, .41),
]


def append_card(verts, faces, uvs, centre, width, height, yaw, pitch, tile):
    # A lightly bowed eight-vertex card adds curvature and layered parallax.
    local = [
        (-width/2, 0, -height/2), (-width/6, -.055*width, -height/2),
        (width/6, -.055*width, -height/2), (width/2, 0, -height/2),
        (-width/2, 0, height/2), (-width/6, -.055*width, height/2),
        (width/6, -.055*width, height/2), (width/2, 0, height/2),
    ]
    rotation = Euler((math.radians(pitch), 0, math.radians(yaw)), "XYZ").to_matrix()
    base = len(verts)
    c = Vector(centre)
    verts.extend(tuple(c + rotation @ Vector(p)) for p in local)
    faces.extend([(base, base+1, base+5), (base, base+5, base+4),
                  (base+1, base+2, base+6), (base+1, base+6, base+5),
                  (base+2, base+3, base+7), (base+2, base+7, base+6)])
    (u0, v0), (u1, v1) = UV_TILES[tile]
    uv_by_vertex = [(u0,v0),(u0+(u1-u0)/3,v0),(u0+2*(u1-u0)/3,v0),(u1,v0),
                    (u0,v1),(u0+(u1-u0)/3,v1),(u0+2*(u1-u0)/3,v1),(u1,v1)]
    for face in [(0,1,5),(0,5,4),(1,2,6),(1,6,5),(2,3,7),(2,7,6)]:
        uvs.extend(uv_by_vertex[i] for i in face)


def foliage(lod, material, parent, collection):
    verts, faces, uvs = [], [], []
    card_count = LOD[lod]["cards"]
    for island_index, (name, centre, half_w, half_d, half_h, dominant) in enumerate(ISLANDS):
        cx, cy, cz = centre
        for card_index, (ox, oy, oz, yaw, pitch, scale) in enumerate(CARD_LAYOUT[:card_count]):
            tile = dominant if card_index < 3 else (dominant + card_index + island_index) % 4
            card_centre = (cx + ox*half_w, cy + oy*half_d, cz + oz*half_h)
            width = 2 * half_w * scale
            height = 2 * half_h * scale
            append_card(verts, faces, uvs, card_centre, width, height, yaw + (island_index%3-1)*6, pitch, tile)
    mesh = bpy.data.meshes.new(f"{ASSET_ID}_{lod}_AUTHORED_FOLIAGE_ISLANDS_MESH")
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(material)
    uv_layer = mesh.uv_layers.new(name="UVMap")
    for loop, uv in zip(uv_layer.data, uvs):
        loop.uv = uv
    obj = bpy.data.objects.new(f"{ASSET_ID}_{lod}_AUTHORED_FOLIAGE_ISLANDS", mesh)
    collection.objects.link(obj)
    obj.parent = parent


def build_lod(lod, mats, foliage_mat):
    collection = bpy.data.collections.new(f"{STEM}_LOD_{lod}")
    bpy.context.scene.collection.children.link(collection)
    root = bpy.data.objects.new(f"{ASSET_ID}_LOD_{lod}_ROOT", None)
    collection.objects.link(root)
    anchor = bpy.data.objects.new(f"{ASSET_ID}_LOD_{lod}_IDENTITY_ANCHOR", None)
    collection.objects.link(anchor)
    anchor.parent = root
    anchor["componentRole"] = "IDENTITY_ANCHOR"
    anchor["assetId"] = ASSET_ID
    anchor["version"] = VERSION
    for name, r0, r1, path in MAJOR_PATHS:
        tube(f"{ASSET_ID}_{lod}_{name}", path, r0, r1, LOD[lod]["sides"], LOD[lod]["path_step"], mats["CREAM"], root, collection, surface_mats=mats)
    for name, r0, r1, path in SECONDARY_PATHS[:LOD[lod]["secondaries"]]:
        tube(f"{ASSET_ID}_{lod}_{name}", path, r0, r1, max(5, LOD[lod]["sides"]-2), LOD[lod]["path_step"], mats["CREAM"], root, collection, surface_mats=mats)
    roots(lod, mats, root, collection)
    foliage(lod, foliage_mat, root, collection)
    return collection


def export_lod(output_dir, lod, collection):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in collection.all_objects:
        obj.select_set(True)
    path = output_dir / f"{STEM}_LOD_{lod}.glb"
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", use_selection=True, export_apply=True)
    force_gltf_alpha_mask(path)
    return path


def force_gltf_alpha_mask(path):
    """Blender 4.2 maps dithered surfaces to glTF BLEND; enforce mobile MASK."""
    payload = path.read_bytes()
    magic, version, _ = struct.unpack_from("<III", payload, 0)
    if magic != 0x46546C67 or version != 2:
        raise RuntimeError(f"Invalid GLB: {path}")
    offset, chunks = 12, []
    while offset < len(payload):
        length, kind = struct.unpack_from("<II", payload, offset)
        data = payload[offset + 8:offset + 8 + length]
        chunks.append([kind, data])
        offset += 8 + length
    gltf = json.loads(chunks[0][1].decode("utf-8").rstrip(" \t\r\n\0"))
    changed = False
    for material in gltf.get("materials", []):
        if "FOLIAGE_ATLAS" in material.get("name", ""):
            material["alphaMode"] = "MASK"
            material["alphaCutoff"] = .5
            material["doubleSided"] = True
            changed = True
    if not changed:
        raise RuntimeError("Foliage atlas material not found in GLB")
    encoded = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    encoded += b" " * ((4 - len(encoded) % 4) % 4)
    chunks[0][1] = encoded
    body = b"".join(struct.pack("<II", len(data), kind) + data for kind, data in chunks)
    path.write_bytes(struct.pack("<III", magic, version, 12 + len(body)) + body)


def camera(name, location, target, scale, perspective=False):
    data = bpy.data.cameras.new(name)
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()
    if perspective:
        data.type = "PERSP"
        data.lens = 58
    else:
        data.type = "ORTHO"
        data.ortho_scale = scale
    return obj


def setup_render():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 900
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.view_settings.look = "AgX - Medium High Contrast"
    world = scene.world or bpy.data.worlds.new("GROWGO_WORLD")
    scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes["Background"]
    background.inputs["Color"].default_value = (.62, .78, .91, 1)
    background.inputs["Strength"].default_value = .70
    sun_data = bpy.data.lights.new("GROWGO_SOFT_SUN", "SUN")
    sun_data.energy = 2.4
    sun_data.angle = .40
    sun = bpy.data.objects.new("GROWGO_SOFT_SUN", sun_data)
    bpy.context.scene.collection.objects.link(sun)
    sun.rotation_euler = (.52, -.42, -.62)
    area_data = bpy.data.lights.new("GROWGO_FILL", "AREA")
    area_data.energy = 700
    area_data.shape = "DISK"
    area_data.size = 8
    area = bpy.data.objects.new("GROWGO_FILL", area_data)
    bpy.context.scene.collection.objects.link(area)
    area.location = (-6, -8, 10)
    area.rotation_euler = (Vector((0, 0, 7)) - area.location).to_track_quat("-Z", "Y").to_euler()
    ground_mat = flat_material("REVIEW_GROUND", (.31, .46, .18, 1))
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=6.2, depth=.12, location=(0, 0, -.08))
    ground = bpy.context.object
    ground.name = "REVIEW_GROUND_NOT_EXPORTED"
    ground.data.materials.append(ground_mat)


def render_previews(preview_dir, collections):
    setup_render()
    for lod, collection in collections.items():
        collection.hide_render = lod != "GAMEPLAY"
    views = {
        "matched_front": ((0, -25, 7.0), (0, 0, 7.0), 16.8, False),
        "matched_oblique": ((18, -22, 14), (0, 0, 7.0), 17.5, False),
        "side": ((25, 0, 7.0), (0, 0, 7.0), 16.8, False),
        "top": ((0, 0, 29), (0, 0, 7.2), 16.8, False),
        "gameplay_distance": ((24, -31, 21), (0, 0, 7), 21.0, False),
        "close_foliage": ((7, -10, 12.0), (0, -.2, 11.2), 7.5, False),
        "close_root_trunk": ((5.5, -10, 4.2), (0, 0, 2.8), 7.2, False),
        "hero": ((15, -22, 12.0), (0, 0, 7.0), 17.2, False),
    }
    for name, (location, target, scale, perspective) in views.items():
        cam = camera("CAM_" + name.upper(), location, target, scale, perspective)
        bpy.context.scene.camera = cam
        bpy.context.scene.render.filepath = str(preview_dir / f"{STEM}_GAMEPLAY_{name}.png")
        bpy.ops.render.render(write_still=True)
        bpy.data.objects.remove(cam, do_unlink=True)


def records(output_dir, preview_dir, atlas_path):
    metadata = {
        "assetId": ASSET_ID,
        "assetFamilyId": FAMILY_ID,
        "recipeReference": RECIPE_ID,
        "previousCandidateVersion": "v006",
        "targetRevisionVersion": VERSION,
        "status": "PENDING_OPERATOR_REVIEW",
        "authoredDimensionsMetres": {"height": 14.0, "crownWidth": 9.0, "crownDepth": 7.0},
        "construction": {
            "method": "concept-matched art-directed fixed control points with denser layered atlas cards and integrated bark face regions",
            "manuallyAuthoredMajorBranchShapes": [path[0] for path in MAJOR_PATHS],
            "secondarySupportingBranches": [path[0] for path in SECONDARY_PATHS],
            "foliageIslands": [island[0] for island in ISLANDS],
            "foliageIslandCount": len(ISLANDS),
            "reusableFoliageCardTypes": 4,
            "textureAtlas": {"filename": atlas_path.name, "dimensions": [512, 512], "alphaMode": "MASK", "bytes": atlas_path.stat().st_size, "reusedFrom": "v006"},
            "barkTechnique": "material assignments on actual trunk and branch mesh faces; zero detached bark geometry",
            "materials": 5,
        },
        "protectedHistoricalVersions": ["v001", "v002", "v003", "v004", "v005", "v006"],
        "registered": False, "promoted": False, "published": False, "activated": False,
    }
    authoring = {
        "assetId": ASSET_ID, "version": VERSION,
        "expectedBlendFilename": f"{STEM}.blend",
        "expectedOutputs": [f"{STEM}_LOD_{lod}.glb" for lod in LOD],
        "previewDirectory": str(preview_dir),
        "operatorVisualApprovalRequired": True,
        "status": "PENDING_OPERATOR_REVIEW",
    }
    manifest = {
        "assetId": ASSET_ID, "version": VERSION, "manifestVersion": "1.0.0",
        "lodOrder": ["CLOSE", "GAMEPLAY", "MAP"],
        "groundAnchor": "per-LOD IDENTITY_ANCHOR at trunk/root ground contact (Z=0)",
        "macroPlacement": "fully authored; no random distribution",
    }
    for label, payload in (("metadata", metadata), ("authoring-manifest", authoring), ("manifest", manifest)):
        (output_dir / f"tree-eucalyptus-v007-{label}.json").write_text(json.dumps(payload, indent=2) + "\n")


def main():
    args = arguments()
    output_dir = Path(args.output_dir).resolve()
    preview_dir = Path(args.preview_dir).resolve()
    atlas_path = Path(args.atlas).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    preview_dir.mkdir(parents=True, exist_ok=True)
    reset()
    mats = {name: flat_material(name, colour) for name, colour in BARK.items()}
    foliage_mat = foliage_material(atlas_path)
    collections = {lod: build_lod(lod, mats, foliage_mat) for lod in LOD}
    bpy.context.scene["assetId"] = ASSET_ID
    bpy.context.scene["version"] = VERSION
    bpy.context.scene["status"] = "PENDING_OPERATOR_REVIEW"
    bpy.context.scene["authoredHeightMetres"] = 14.0
    blend_path = output_dir / f"{STEM}.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    exports = [str(export_lod(output_dir, lod, collection)) for lod, collection in collections.items()]
    render_previews(preview_dir, collections)
    records(output_dir, preview_dir, atlas_path)
    print(json.dumps({"assetId": ASSET_ID, "version": VERSION, "blend": str(blend_path), "exports": exports, "status": "PENDING_OPERATOR_REVIEW"}, indent=2))


if __name__ == "__main__":
    main()
