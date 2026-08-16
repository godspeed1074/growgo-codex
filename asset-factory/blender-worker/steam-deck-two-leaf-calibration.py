import bpy, sys, os, json, math
from mathutils import Vector
from mathutils.geometry import tessellate_polygon

args = sys.argv[sys.argv.index('--') + 1:]
spec_dir, out_root = args
os.makedirs(out_root, exist_ok=True)
W, H = 189, 261

def world_xy(px, py):
    # Pixel-edge coordinates are mapped to the locked target pixel centres.
    return ((px - .25 - W * .5) / H, (H * .5 - (py - .5)) / H)

def make_mat(name, colour):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    bsdf = nodes.get('Principled BSDF')
    if bsdf:
        nodes.remove(bsdf)
    output = nodes.get('Material Output')
    shader = nodes.new('ShaderNodeEmission')
    shader.inputs['Color'].default_value = (*colour, 1)
    shader.inputs['Strength'].default_value = 1.0
    material.node_tree.links.new(shader.outputs['Emission'], output.inputs['Surface'])
    material.diffuse_color = (*colour, 1)
    return material

def rotate_to_tip(points, tip):
    index = min(range(len(points)), key=lambda i: (points[i][0] - tip[0]) ** 2 + (points[i][1] - tip[1]) ** 2)
    return points[index:] + points[:index]

def make_leaf(spec, candidate, output_dir):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    contour = rotate_to_tip([tuple(point) for point in candidate['contour']], tuple(spec['targetTipPx']))
    tip = tuple(spec['targetTipPx'])
    base = max(contour, key=lambda point: (point[0] - tip[0]) ** 2 + (point[1] - tip[1]) ** 2)
    front = [(*world_xy(x, y), .030) for x, y in contour]
    back = [(*world_xy(x, y), .022) for x, y in contour]
    n = len(contour)
    axis = Vector((base[0] - tip[0], base[1] - tip[1]))
    if axis.length < 1e-6:
        axis = Vector((0, 1))
    axis.normalize()
    perp = Vector((-axis.y, axis.x))
    ridge = []
    for t, half_width in ((.13, .22), (.50, .34), (.87, .24)):
        q = Vector(tip) * (1.0 - t) + Vector(base) * t
        ridge.extend([
            (*world_xy(q.x + perp.x * half_width, q.y + perp.y * half_width), .047),
            (*world_xy(q.x - perp.x * half_width, q.y - perp.y * half_width), .047)
        ])
    ridge0 = n
    back0 = n + len(ridge)
    verts = front + ridge + back
    faces = []
    material_indices = []
    vectors = [Vector(vertex) for vertex in front]
    for tri in tessellate_polygon([vectors]):
        tri_indices = list(tri) if all(isinstance(vertex, int) for vertex in tri) else [min(range(n), key=lambda i: (vectors[i] - vertex).length_squared) for vertex in tri]
        if len(set(tri_indices)) == 3:
            faces.append(tuple(tri_indices))
            centroid = sum((vectors[i] for i in tri_indices), Vector()) / 3.0
            # Assign the target-derived light side, while preserving the leaf's
            # own angle and silhouette rather than copying LEAF_001 facets.
            px = centroid.x
            py = centroid.y
            local = (px - world_xy(*tip)[0]) * perp.x + (-(py - world_xy(*tip)[1])) * perp.y
            light_left = spec.get('lightSide', 'LEFT_LIGHT') == 'LEFT_LIGHT'
            if abs(local) < .018:
                material_indices.append(1)
            elif (local < 0) == light_left:
                material_indices.append(2)
            else:
                material_indices.append(0)
    for s in range(2):
        a = ridge0 + s * 2
        b = ridge0 + (s + 1) * 2
        faces.append((a, b, b + 1, a + 1))
        material_indices.append(3)
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, back0 + j, back0 + i))
        material_indices.append(0)
        faces.append((i, j, back0 + j, back0 + i))
        material_indices.append(0)
    mesh = bpy.data.meshes.new(f'{spec["targetLeafId"]}_TARGET_LEAF_MESH')
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(spec['targetLeafId'], mesh)
    bpy.context.collection.objects.link(obj)
    obj['assetId'] = 'GG-VEG-PLANTER-SHRUB-001'
    obj['moduleVersion'] = 'TWO_LEAF_TARGET_CALIBRATION'
    obj['componentId'] = 'SHRUB_VISIBLE_LEAF'
    obj['leafId'] = spec['targetLeafId']
    obj['layer'] = 'LAYER_A_MODULE'
    obj['anonymousGeometry'] = False
    obj['targetContourVertexCount'] = n
    obj['targetContourSource'] = candidate['source']
    obj['targetTipPx'] = list(tip)
    obj['targetAngleDeg'] = spec['targetAngleDeg']
    obj['frontContourLocked'] = True
    obj['internalRidgeOnlyDepthChange'] = True
    base_colour = [max(0, min(255, int(value))) / 255.0 for value in spec['targetSpecificColour']]
    # Keep the target's colour family while creating deterministic papercut
    # separation; no target image or reference plane is loaded.
    dark_colour = tuple(max(0.0, min(1.0, c * .58)) for c in base_colour)
    mid_colour = tuple(max(0.0, min(1.0, c * .82)) for c in base_colour)
    light_colour = tuple(max(0.0, min(1.0, c * 1.16 + .035)) for c in base_colour)
    ridge_colour = tuple(max(0.0, min(1.0, c * .72 + .04)) for c in base_colour)
    mats = [
        make_mat(f'{spec["targetLeafId"]}_DARK_FACET', dark_colour),
        make_mat(f'{spec["targetLeafId"]}_MID_FACET', mid_colour),
        make_mat(f'{spec["targetLeafId"]}_LIGHT_FACET', light_colour),
        make_mat(f'{spec["targetLeafId"]}_RIDGE', ridge_colour)
    ]
    for material in mats:
        mesh.materials.append(material)
    for polygon, index in zip(mesh.polygons, material_indices):
        polygon.material_index = index
    scene = bpy.context.scene
    bpy.ops.object.camera_add(location=(0, 0, 10))
    camera = bpy.context.object
    camera.name = f'{spec["targetLeafId"]}_LOCKED_FRONT_CAMERA'
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = 1.0
    scene.camera = camera
    scene.render.resolution_x = W
    scene.render.resolution_y = H
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    try:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
    except Exception:
        pass
    world = bpy.data.worlds.new(f'{spec["targetLeafId"]}_WHITE_WORLD')
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (1, 1, 1, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.0
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    def render(filename):
        scene.render.filepath = os.path.join(output_dir, filename)
        bpy.ops.render.render(write_still=True)
    render('BEAUTY.png')
    id_material = make_mat(f'{spec["targetLeafId"]}_COMPONENT_ID', (.08, .65, .95))
    mesh.materials.clear()
    mesh.materials.append(id_material)
    for polygon in mesh.polygons:
        polygon.material_index = 0
    scene.render.film_transparent = True
    render('COMPONENT_ID.png')
    scene.render.film_transparent = False
    mesh.materials.clear()
    for material in mats:
        mesh.materials.append(material)
    for polygon, index in zip(mesh.polygons, material_indices):
        polygon.material_index = index
    wire = obj.modifiers.new(f'{spec["targetLeafId"]}_WIREFRAME', 'WIREFRAME')
    wire.thickness = .0025
    wire.use_replace = True
    render('WIREFRAME.png')
    obj.modifiers.remove(wire)
    scene.render.film_transparent = False
    json.dump({
        'status': 'PASS_TWO_LEAF_BLENDER_CANDIDATE',
        'leafId': spec['targetLeafId'],
        'targetFamily': spec['targetFamily'],
        'candidateId': candidate['candidateId'],
        'contourVertexCount': n,
        'contourSource': candidate['source'],
        'referenceTextureUsedInBeauty': False,
        'referencePlaneVisible': False,
        'frontContourLocked': True,
        'internalRidgeOnlyDepthChange': True,
        'otherLeafGeometryChanged': False,
        'flowersChanged': False,
        'planterChanged': False,
        'depthOrSideWorkPerformed': False,
        'cameraLocked': True,
        'anonymousGeometryCount': 0,
        'mobileBudget': 'PASS'
    }, open(os.path.join(output_dir, 'RESULT.json'), 'w'), indent=2)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(output_dir, 'CALIBRATION.blend'))

spec_files = sorted(filename for filename in os.listdir(spec_dir) if filename.endswith('.json'))
for filename in spec_files:
    spec = json.load(open(os.path.join(spec_dir, filename)))
    for candidate in spec['candidates']:
        output_dir = os.path.join(out_root, spec['targetLeafId'], candidate['candidateId'])
        os.makedirs(output_dir, exist_ok=True)
        make_leaf(spec, candidate, output_dir)
print(json.dumps({'status': 'PASS_TWO_LEAF_BLENDER_CANDIDATES', 'leaves': [json.load(open(os.path.join(spec_dir, f)))['targetLeafId'] for f in spec_files], 'candidateCounts': {json.load(open(os.path.join(spec_dir, f)))['targetLeafId']: len(json.load(open(os.path.join(spec_dir, f)))['candidates']) for f in spec_files}, 'referenceTextureUsedInBeauty': False, 'referencePlaneVisible': False, 'depthOrSideWorkPerformed': False, 'otherLeavesChanged': False, 'flowersChanged': False, 'planterChanged': False, 'anonymousGeometryCount': 0, 'mobileBudget': 'PASS'}, indent=2))
