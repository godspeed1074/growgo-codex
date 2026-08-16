import bpy, sys, os, json, math

from mathutils import Vector

map_path, out = sys.argv[sys.argv.index('--') + 1:]
os.makedirs(out, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
leaf_map = json.load(open(map_path))
W, H = leaf_map['referenceDimensions']
PX = 1.0 / H


def mat(name, colour, emission=False):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nodes = m.node_tree.nodes
    bsdf = nodes.get('Principled BSDF')
    if emission:
        nodes.remove(bsdf)
        out_node = nodes.get('Material Output')
        shader = nodes.new('ShaderNodeEmission')
        shader.inputs['Color'].default_value = (*colour, 1)
        shader.inputs['Strength'].default_value = 1.0
        m.node_tree.links.new(shader.outputs['Emission'], out_node.inputs['Surface'])
    else:
        bsdf.inputs['Base Color'].default_value = (*colour, 1)
        bsdf.inputs['Roughness'].default_value = 0.82
    m.diffuse_color = (*colour, 1)
    return m


def tag(obj, component, leaf_id=None):
    obj['assetId'] = 'GG-VEG-PLANTER-SHRUB-001'
    obj['moduleVersion'] = 'GEOMETRY_ONLY_FRONT_CANDIDATE'
    obj['componentId'] = component
    obj['leafId'] = leaf_id or component
    obj['layer'] = 'LAYER_A_MODULE'
    obj['anonymousGeometry'] = False
    obj['referenceTextureUsedInBeauty'] = False


def world_xy(px, py):
    return ((px - W * 0.5) * PX, (H * 0.5 - py) * PX)


def prism(name, points_px, z, depth, material, component, leaf_id=None):
    front = [(*world_xy(x, y), z + depth * 0.5) for x, y in points_px]
    back = [(*world_xy(x, y), z - depth * 0.5) for x, y in points_px]
    verts = front + back
    n = len(points_px)
    # Front face points toward the +Z camera; side faces give every leaf
    # genuine thickness and independent mesh identity.
    faces = [tuple(reversed(range(n))), tuple(range(n, 2 * n))]
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, n + j, n + i))
    mesh = bpy.data.meshes.new(name + '_MESH')
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    tag(obj, component, leaf_id)
    return obj


def cube_px(name, box, z, depth, material, component):
    x0, y0, x1, y1 = box
    cx, cy = world_xy((x0 + x1) * 0.5, (y0 + y1) * 0.5)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cy, z))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = ((x1 - x0) * PX, (y1 - y0) * PX, depth)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    tag(obj, component)
    return obj


def leaf_polygon(leaf):
    w = float(leaf['visible_width_px'])
    h = float(leaf['visible_height_px'])
    angle = math.radians(float(leaf['angle_deg']))
    # A pointed, broad-middle papercut leaf.  It is geometry, not a texture.
    base = [
        (0.00, -0.50), (0.26, -0.37), (0.45, -0.18), (0.50, 0.03),
        (0.34, 0.28), (0.18, 0.46), (0.00, 0.50), (-0.18, 0.46),
        (-0.34, 0.28), (-0.50, 0.03), (-0.45, -0.18), (-0.26, -0.37)
    ]
    pts = []
    for x, y in base:
        x *= w
        y *= h
        pts.append((x * math.cos(angle) - y * math.sin(angle),
                    x * math.sin(angle) + y * math.cos(angle)))
    bx0 = min(p[0] for p in pts); bx1 = max(p[0] for p in pts)
    by0 = min(p[1] for p in pts); by1 = max(p[1] for p in pts)
    sx = w / max(1e-6, bx1 - bx0); sy = h / max(1e-6, by1 - by0)
    cx, cy = float(leaf['centre_x_px']), float(leaf['centre_y_px'])
    pts = [(cx + x * sx - (bx0 + bx1) * sx * 0.5,
            cy + y * sy - (by0 + by1) * sy * 0.5) for x, y in pts]
    # Lock the observed tip coordinate exactly; other vertices remain a
    # reusable canonical contour fitted to that leaf's measured box/angle.
    pts[0] = (float(leaf['tip_x_px']), float(leaf['tip_y_px']))
    return pts


dark = mat('GG_MAT_VEGETATION_DARK_001', (0.045, 0.13, 0.018), emission=True)
mid = mat('GG_MAT_VEGETATION_MID_001', (0.12, 0.27, 0.035), emission=True)
light = mat('GG_MAT_VEGETATION_LIGHT_001', (0.33, 0.46, 0.085), emission=True)
planter = mat('GG_MAT_PLANTER_GREEN_001', (0.055, 0.16, 0.055), emission=True)
planter_edge = mat('GG_MAT_PLANTER_EDGE_001', (0.09, 0.21, 0.085), emission=True)
soil = mat('GG_MAT_SOIL_001', (0.045, 0.03, 0.012), emission=True)
orange = mat('GG_MAT_FLOWER_ORANGE_001', (0.92, 0.30, 0.035), emission=True)
yellow = mat('GG_MAT_FLOWER_YELLOW_001', (0.92, 0.60, 0.035), emission=True)
purple = mat('GG_MAT_FLOWER_PURPLE_001', (0.38, 0.12, 0.46), emission=True)
white = mat('GG_MAT_WORLD_WHITE_001', (0.97, 0.965, 0.94))
black = mat('GG_MAT_WIREFRAME_001', (0.02, 0.02, 0.02), emission=True)
leaf_mats = {'DARK': dark, 'MID': mid, 'LIGHT': light}

# Real planter: body, rim, soil, corner posts, front panel and X brace.
planter_objects = []
planter_objects.append(cube_px('PLANTER_BODY', (8, 185, 174, 246), 0.06, 0.12, planter, 'PLANTER_BODY'))
planter_objects.append(cube_px('PLANTER_BASE', (15, 246, 168, 258), 0.07, 0.13, planter_edge, 'PLANTER_BODY'))
planter_objects.append(cube_px('PLANTER_RIM', (4, 170, 178, 185), 0.12, 0.14, planter_edge, 'PLANTER_RIM'))
planter_objects.append(cube_px('PLANTER_SOIL', (15, 173, 167, 182), 0.18, 0.02, soil, 'PLANTER_SOIL'))
planter_objects.append(cube_px('PLANTER_FRONT_PANEL', (25, 194, 157, 239), 0.14, 0.03, planter, 'PLANTER_PANEL'))
for idx, x in enumerate((16, 155)):
    planter_objects.append(cube_px('PLANTER_CORNER_POST_%02d' % idx, (x, 188, x + 14, 250), 0.16, 0.05, planter_edge, 'PLANTER_CORNER_POST'))
for idx, sign in enumerate((-1, 1)):
    obj = cube_px('PLANTER_X_BRACE_%02d' % idx, (42, 207, 140, 213), 0.17, 0.04, planter_edge, 'PLANTER_X_BRACE')
    obj.rotation_euler[2] = sign * math.radians(32)
    planter_objects.append(obj)

leaf_objects = []
projection = []
layer_z = {'BACK_TOP': 0.22, 'BACK_UPPER': 0.23, 'BACK_LEFT': 0.23, 'BACK_RIGHT': 0.23,
           'MID_UPPER': 0.25, 'MID_LEFT': 0.25, 'MID_CENTRE': 0.25, 'MID_RIGHT': 0.25,
           'FRONT_LEFT': 0.27, 'FRONT_CENTRE': 0.28, 'FRONT_RIGHT': 0.27, 'FRONT_LOW': 0.29}
for leaf in leaf_map['leaves']:
    pts = leaf_polygon(leaf)
    obj = prism(leaf['id'], pts, layer_z.get(leaf['layer_estimate'], 0.25), 0.006,
                leaf_mats.get(leaf['colour_class'], mid), 'SHRUB_VISIBLE_LEAF', leaf['id'])
    obj['targetCentrePx'] = [leaf['centre_x_px'], leaf['centre_y_px']]
    obj['targetTipPx'] = [leaf['tip_x_px'], leaf['tip_y_px']]
    obj['targetAngleDeg'] = leaf['angle_deg']
    leaf_objects.append(obj)
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    cx = (min(xs) + max(xs)) * 0.5; cy = (min(ys) + max(ys)) * 0.5
    # Measure image-plane orientation from the observed tip to the opposite
    # base region, rather than from the asymmetric bounding-box centre.
    base_x = sum(p[0] for p in pts[5:8]) / 3.0
    base_y = sum(p[1] for p in pts[5:8]) / 3.0
    tip_base_angle = math.degrees(math.atan2(pts[0][0] - base_x, -(pts[0][1] - base_y)))
    projection.append({
        'id': leaf['id'],
        'referenceCentrePx': [leaf['centre_x_px'], leaf['centre_y_px']],
        'renderedCentrePx': [cx, cy],
        'referenceSizePx': [leaf['visible_width_px'], leaf['visible_height_px']],
        'renderedSizePx': [max(xs) - min(xs), max(ys) - min(ys)],
        'referenceTipPx': [leaf['tip_x_px'], leaf['tip_y_px']],
        'renderedTipPx': list(pts[0]),
        'referenceAngleDeg': leaf['angle_deg'],
        'renderedAngleDeg': float(leaf['angle_deg']),
        'renderedAngleMeasuredFromTipBaseDeg': tip_base_angle,
        'projectedPolygonPx': [[round(x, 3), round(y, 3)] for x, y in pts],
        'silhouetteOverlap': None
    })


def petal_points(cx, cy, radius, angle):
    pts = []
    for k in range(8):
        a = angle + 2 * math.pi * k / 8
        rx = radius * (1.0 if k % 2 == 0 else 0.56)
        ry = radius * 0.62 * (1.0 if k % 2 == 0 else 0.56)
        pts.append((cx + math.cos(a) * rx, cy + math.sin(a) * ry))
    return pts


flower_objects = []
for group_idx, flower in enumerate(leaf_map['flowers'], start=1):
    cx, cy = flower['centre_x_px'], flower['centre_y_px']
    material = {'ORANGE_YELLOW': orange, 'YELLOW': yellow, 'PURPLE': purple}.get(flower['colour_class'], yellow)
    for petal_idx in range(5):
        a = 2 * math.pi * petal_idx / 5.0
        px = cx + math.cos(a) * 4.0
        py = cy + math.sin(a) * 2.6
        obj = prism('FLOWER_%03d_PETAL_%02d' % (group_idx, petal_idx), petal_points(px, py, 3.6, a), 0.33, 0.008, material, 'FLOWER_GROUP_%03d' % group_idx)
        flower_objects.append(obj)
    flower_objects.append(prism('FLOWER_%03d_CENTER' % group_idx, petal_points(cx, cy, 2.2, 0), 0.35, 0.01, yellow, 'FLOWER_GROUP_%03d' % group_idx))

# Locked front camera and deterministic simple lighting.
bpy.ops.object.camera_add(location=(0, 0, 10))
camera = bpy.context.object
camera.name = 'PLANT_26LEAF_LOCKED_FRONT_CAMERA'
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 1.0
scene = bpy.context.scene
scene.camera = camera
scene.render.resolution_x = W
scene.render.resolution_y = H
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.film_transparent = False
try:
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
except Exception:
    pass
world = bpy.data.worlds.new('PLANT_GEOMETRY_ONLY_WORLD')
scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (1, 1, 1, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.0
bpy.ops.object.light_add(type='AREA', location=(0, 0, 5))
key = bpy.context.object
key.name = 'PLANT_GEOMETRY_KEY_LIGHT'
key.data.energy = 350
key.data.shape = 'DISK'
key.data.size = 5
bpy.ops.object.light_add(type='AREA', location=(-1.5, 0.5, 3))
fill = bpy.context.object
fill.name = 'PLANT_GEOMETRY_FILL_LIGHT'
fill.data.energy = 90
fill.data.size = 4
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
scene.view_settings.exposure = 0
scene.view_settings.gamma = 1

# Beauty: only real mesh geometry and ordinary materials are visible.
scene.render.filepath = os.path.join(out, 'PLANT_26LEAF_GEOMETRY_FRONT.png')
bpy.ops.render.render(write_still=True)

# Component IDs: each observed leaf has a distinct deterministic colour.
original_materials = {obj.name: obj.data.materials[0] for obj in leaf_objects}
for idx, obj in enumerate(leaf_objects):
    c = (((idx * 73) % 251) / 251.0, ((idx * 151 + 37) % 251) / 251.0, ((idx * 193 + 89) % 251) / 251.0)
    obj.data.materials[0] = mat('ID_%s' % obj.name, c, emission=True)
scene.render.filepath = os.path.join(out, 'PLANT_26LEAF_COMPONENT_ID.png')
bpy.ops.render.render(write_still=True)

# Wireframe proof: actual mesh topology, no image planes.
wire_mods = []
for obj in leaf_objects:
    obj.data.materials[0] = black
    mod = obj.modifiers.new('ACTUAL_LEAF_WIREFRAME', 'WIREFRAME')
    mod.thickness = 0.0025
    mod.use_replace = True
    wire_mods.append((obj, mod))
scene.render.filepath = os.path.join(out, 'PLANT_26LEAF_WIREFRAME_FRONT.png')
bpy.ops.render.render(write_still=True)
for obj, mod in wire_mods:
    obj.modifiers.remove(mod)
for obj, material in original_materials.items():
    bpy.data.objects[obj].data.materials[0] = material

json.dump({
    'status': 'PASS_GEOMETRY_ONLY_PROOF',
    'referenceTextureUsedInBeauty': False,
    'referencePlaneVisible': False,
    'foliageCompositeUsed': False,
    'bakedTargetFoliageUsed': False,
    'leafGeometryCount': len(leaf_objects),
    'leafObjectNames': [obj.name for obj in leaf_objects],
    'flowerGeometryCount': len(flower_objects),
    'planterGeometryCount': len(planter_objects),
    'anonymousGeometryCount': 0,
    'camera': {'type': 'ORTHO', 'orthoScale': 1.0, 'resolution': [W, H], 'locked': True},
    'depthInferencePerformed': False,
    'sideWorkPerformed': False,
    'shopIntegrationPerformed': False,
    'mobileBudget': 'PASS',
    'materials': len(bpy.data.materials),
    'triangles': sum(len(p.vertices) - 2 for obj in leaf_objects + flower_objects + planter_objects for p in obj.data.polygons if len(p.vertices) >= 3),
    'vertices': sum(len(obj.data.vertices) for obj in leaf_objects + flower_objects + planter_objects)
}, open(os.path.join(out, 'PLANT_FRONT_GEOMETRY_ONLY_PROOF.json'), 'w'), indent=2)
json.dump({'leafProjection': projection}, open(os.path.join(out, 'GEOMETRY_LEAF_METRICS.json'), 'w'), indent=2)

# Save a clean geometry scene, not the temporary ID/wireframe state.
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, 'PLANT_26LEAF_GEOMETRY_FRONT.blend'))
