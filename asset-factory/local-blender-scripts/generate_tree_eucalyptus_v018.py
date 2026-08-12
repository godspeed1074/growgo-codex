"""Build TREE_EUCALYPTUS_001_v018 as an art-directed review candidate.

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
VERSION = "v018"
STEM = f"{ASSET_ID}_{VERSION}"
FAMILY_ID = "COASTAL_NATURE_FAMILY_001"
RECIPE_ID = "TREE_EUCALYPTUS_RECIPE_001"
ATLAS_NAME = "TREE_EUCALYPTUS_001_v006_FOLIAGE_ATLAS_512.png"

BARK = {
    "CREAM": (0.28, 0.18, 0.08, 1.0),
    "TAN": (0.20, 0.11, 0.045, 1.0),
    "PEACH": (0.38, 0.20, 0.08, 1.0),
    "RUST": (0.12, 0.055, 0.02, 1.0),
}

# Authored from the approved concept: a trunk plus seven dominant visible
# systems.  These are composition decisions, not generated distributions.
MAJOR_PATHS = [("MAIN_TRUNK", .58, .24, [(0, 0, 0), (.02, .01, .8), (.04, .01, 1.6), (.06, .02, 2.4), (.08, .02, 3.2), (.10, .01, 4.0), (.12, 0, 4.7)])]

SECONDARY_PATHS = []

# Eight unequal islands reshape the crown into the compact, full-canopy game tree reference.
# centre xyz, half-width, half-depth, half-height, dominant tile, density.
ISLANDS = [
    ("TOP_ROUND_CROWN", (0.0, 0, 5.15), 1.72, 1.48, 1.42, 0, 1.00),
    ("LOW_LEFT_ROUND", (-1.05, -.05, 3.35), 1.02, .98, .88, 2, .98),
    ("LOW_RIGHT_ROUND", (1.02, .08, 3.28), .92, .92, .82, 0, .94),
]

LOD = {
    "CLOSE": {"sides": 12, "path_step": 3, "cards": 46, "secondaries": 4},
    "GAMEPLAY": {"sides": 10, "path_step": 3, "cards": 40, "secondaries": 4},
    "MAP": {"sides": 5, "path_step": 1, "cards": 10, "secondaries": 2},
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
    m = bpy.data.materials.new(f"MAT_EUCALYPTUS_{name}_018")
    m.diffuse_color = colour
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = colour
    bsdf.inputs["Roughness"].default_value = .88
    return m


def foliage_material(atlas_path):
    m = bpy.data.materials.new("MAT_EUCALYPTUS_FOLIAGE_ATLAS_MASK_018")
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
    if "_ROOT_" in name or "ROOT_COLLAR" in name or "MAIN_TRUNK" in name:
        # Roots are sculpted into the ground plane, never below the anchor.
        verts = [(x, y, max(0.0, z)) for x, y, z in verts]
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
            regions = [(.06, .28, .54, 2, 1), (.34, .54, .16, 2, 2),
                       (.60, .78, .70, 2, 1), (.80, .92, .38, 1, 3)]
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
                drifted = (centre + .08 * math.sin(along * math.pi * 1.4)) % 1
                circular = min((around-drifted) % 1, (drifted-around) % 1)
                if start <= along <= end and circular <= half_width / sides:
                    mesh.polygons[polygon_index].material_index = material_index
                    break
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.parent = parent
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    return obj


def ellipsoid(name, centre, scale, segments, rings, mat, parent, collection):
    cx, cy, cz = centre
    sx, sy, sz = scale
    verts = [(cx, cy, cz-sz)]
    faces = []
    for ring in range(1, rings):
        phi = -math.pi/2 + math.pi*ring/rings
        for side in range(segments):
            angle = 2*math.pi*side/segments
            verts.append((cx + sx*math.cos(phi)*math.cos(angle),
                          cy + sy*math.cos(phi)*math.sin(angle),
                          cz + sz*math.sin(phi)))
    top = len(verts)
    verts.append((cx, cy, cz+sz))
    for side in range(segments):
        faces.append((0, 1+(side+1)%segments, 1+side))
    for ring in range(rings-2):
        lower = 1 + ring*segments
        upper = lower + segments
        for side in range(segments):
            nxt = (side+1)%segments
            faces.extend([(lower+side, lower+nxt, upper+nxt),
                          (lower+side, upper+nxt, upper+side)])
    last = 1 + (rings-2)*segments
    for side in range(segments):
        faces.append((top, last+side, last+(side+1)%segments))
    mesh = bpy.data.meshes.new(name+"_MESH")
    mesh.from_pydata(verts, [], faces)
    if "ROOT" in name:
        mesh_vertices = [(x, y, max(0.0, z)) for x, y, z in verts]
        mesh.clear_geometry()
        mesh.from_pydata(mesh_vertices, [], faces)
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.parent = parent
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    return obj


def soften_junctions(lod, mats, parent, collection):
    if lod == "MAP":
        return
    segments = 14 if lod == "CLOSE" else 12
    rings = 6
    swells = []
    for index, (centre, scale) in enumerate(swells):
        ellipsoid(f"{ASSET_ID}_{lod}_SCULPTED_FORK_SWELL_{index}", centre, scale,
                  segments, rings, mats["CREAM"], parent, collection)


def roots(lod, mats, parent, collection):
    # Deliberately uneven roots: broad left/front anchors, quieter rear roots.
    tube(f"{ASSET_ID}_{lod}_SCULPTED_ROOT_COLLAR", [(0, 0, 0), (-.06, .02, .52)],
         .55, .34, max(10, LOD[lod]["sides"]), 4 if lod != "MAP" else 1, mats["CREAM"], parent, collection)
    if lod != "MAP":
        ellipsoid(f"{ASSET_ID}_{lod}_BROAD_PLANTED_ROOT_MOUND", (-.04, -.02, .38),
                  (.62, .50, .26), 12 if lod == "CLOSE" else 10, 6, mats["CREAM"], parent, collection)
    specs = [
        ("FRONT_LEFT", [(0, 0, .60), (-.30, -.34, .28), (-.72, -.54, .18)], .30),
        ("FRONT_RIGHT", [(0, 0, .58), (.28, -.36, .26), (.64, -.62, .18)], .28),
        ("LONG_LEFT", [(-.04, .02, .55), (-.46, .16, .26), (-.88, .28, .18)], .27),
        ("RIGHT_SIDE", [(.04, .03, .54), (.42, .28, .25), (.78, .48, .18)], .25),
        ("REAR_SHORT", [(-.02, .08, .50), (-.18, .40, .23), (-.34, .68, .18)], .22),
        ("LEFT_REAR", [(-.04, .06, .50), (-.34, .36, .23), (-.62, .58, .18)], .22),
    ]
    count = 6 if lod != "MAP" else 4
    for name, path, width in specs[:count]:
        tube(f"{ASSET_ID}_{lod}_ROOT_{name}", path, width, .20, max(8, LOD[lod]["sides"] - 2), 3 if lod != "MAP" else 2, mats["CREAM"], parent, collection)
        if lod != "MAP":
            end = path[-1]
            ellipsoid(f"{ASSET_ID}_{lod}_ROOT_TOE_{name}", (end[0], end[1], .22),
                      (width*.90, width*.70, .18), 8 if lod == "CLOSE" else 7, 4, mats["CREAM"], parent, collection)


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
    (-.44, -.06, .08, 12, 4, .50), (.44, .06, .10, -14, -5, .50),
    (-.34, -.34, -.06, -36, 10, .52), (.34, .34, -.04, 38, -10, .52),
    (-.18, -.46, .08, -66, 14, .48), (.18, .46, .10, 68, -14, .48),
    (-.06, -.28, .26, 8, 22, .46), (.08, .30, .28, -10, -22, .46),
    (-.30, -.12, .34, 28, 16, .44), (.30, .14, .35, -30, -16, .44),
    (-.12, -.02, .46, 4, 12, .42), (.14, .04, .44, -6, -12, .42),
    (-.48, .18, .24, 76, 18, .40), (.48, -.16, .22, -78, -18, .40),
    (-.36, -.18, -.38, 16, 6, .42), (-.12, -.30, -.46, -22, 10, .40),
    (.14, .28, -.45, 24, -10, .40), (.38, .16, -.36, -18, -6, .42),
    (-.48, .02, -.26, 92, 4, .38), (.48, -.02, -.24, -92, -4, .38),
    (-.24, .34, -.34, 52, 12, .39), (.26, -.34, -.32, -54, -12, .39),
    (-.40, -.08, .22, 8, 6, .36), (.40, .10, .20, -10, -6, .36),
    (-.18, -.36, -.28, -30, 12, .36), (.20, .38, -.26, 32, -12, .36),
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
    for island_index, (name, centre, half_w, half_d, half_h, dominant, density) in enumerate(ISLANDS):
        cx, cy, cz = centre
        island_cards = max(6, min(len(CARD_LAYOUT), round(card_count*density)))
        for card_index, (ox, oy, oz, yaw, pitch, scale) in enumerate(CARD_LAYOUT[:island_cards]):
            if card_index < 8:
                tile = 3  # broad dark rear/lower volume
            elif card_index < 24:
                tile = 2 if card_index % 3 else 1  # generic bright cartoon foliage
            elif card_index < 34:
                tile = 1 if card_index % 4 else 2  # light upper/front crown
            else:
                tile = 1 if card_index % 2 else 2  # scalloped edge foliage
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
    soften_junctions(lod, mats, root, collection)
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
    background.inputs["Color"].default_value = (.20, .48, .63, 1)
    background.inputs["Strength"].default_value = .82
    sun_data = bpy.data.lights.new("GROWGO_SOFT_SUN", "SUN")
    sun_data.energy = 3.2
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
    ground_mat = flat_material("REVIEW_GROUND", (.22, .58, .16, 1))
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
        "previousCandidateVersion": "v009",
        "targetRevisionVersion": VERSION,
        "status": "PENDING_OPERATOR_REVIEW",
        "authoredDimensionsMetres": {"height": 14.0, "crownWidth": 9.0, "crownDepth": 7.0},
        "construction": {
            "method": "direct recreation of supplied stylized tree: thick twisted trunk, one large top crown, two smaller rounded side crowns, bright scalloped green foliage, and simple planted roots",
            "manuallyAuthoredMajorBranchShapes": [path[0] for path in MAJOR_PATHS],
            "secondarySupportingBranches": [path[0] for path in SECONDARY_PATHS],
            "foliageIslands": [island[0] for island in ISLANDS],
            "foliageIslandCount": len(ISLANDS),
            "reusableFoliageCardTypes": 4,
            "textureAtlas": {"filename": atlas_path.name, "dimensions": [512, 512], "alphaMode": "MASK", "bytes": atlas_path.stat().st_size, "reusedFrom": "v006"},
            "barkTechnique": "material assignments on actual trunk and branch mesh faces; zero detached bark geometry",
            "materials": 5,
        },
        "protectedHistoricalVersions": ["v001", "v002", "v003", "v004", "v005", "v006", "v007", "v008", "v009"],
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
        (output_dir / f"tree-eucalyptus-v018-{label}.json").write_text(json.dumps(payload, indent=2) + "\n")


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
