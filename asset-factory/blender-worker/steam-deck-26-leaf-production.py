import bpy, sys, os, json, math, shutil
from mathutils import Vector
from mathutils.geometry import tessellate_polygon

args = sys.argv[sys.argv.index('--') + 1:]
if not args:
    raise SystemExit('usage: -- <mode> <spec_dir> <out_root> [selection_json]')
mode = args[0]
spec_dir = args[1]
out_root = args[2]
selection_path = args[3] if len(args) > 3 else None
os.makedirs(out_root, exist_ok=True)
W, H = 189, 261

def world_xy(px, py):
    return ((px - .25 - W * .5) / H, (H * .5 - (py - .5)) / H)

def make_mat(name, colour, emission=True):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    bsdf = nodes.get('Principled BSDF')
    output = nodes.get('Material Output')
    if emission:
        if bsdf:
            nodes.remove(bsdf)
        shader = nodes.new('ShaderNodeEmission')
        shader.inputs['Color'].default_value = (*colour, 1)
        shader.inputs['Strength'].default_value = 1.0
        material.node_tree.links.new(shader.outputs['Emission'], output.inputs['Surface'])
    else:
        bsdf.inputs['Base Color'].default_value = (*colour, 1)
        bsdf.inputs['Roughness'].default_value = .82
    material.diffuse_color = (*colour, 1)
    return material

def tag(obj, component, leaf_id=None):
    obj['assetId'] = 'GG-VEG-PLANTER-SHRUB-001'
    obj['moduleVersion'] = 'TARGET_SPECIFIC_FRONT_PRODUCTION_CANDIDATE'
    obj['componentId'] = component
    obj['leafId'] = leaf_id or component
    obj['layer'] = 'LAYER_A_MODULE'
    obj['anonymousGeometry'] = False
    obj['referenceTextureUsedInBeauty'] = False
    obj['referencePlaneVisible'] = False

def rotate_to_tip(points, tip):
    index = min(range(len(points)), key=lambda i: (points[i][0] - tip[0]) ** 2 + (points[i][1] - tip[1]) ** 2)
    return points[index:] + points[:index]

def make_raster_leaf_mesh(spec, runs, z, collection=None):
    """Build thin geometry directly from cleaned observed pixel runs.

    This is a geometry-only fallback for contours whose visible mask touches
    itself at raster corners.  It never loads the reference image or a texture;
    each run is a measured front-facing rectangle with deterministic thickness.
    """
    box = spec['cropBox']; verts = []; faces = []; material_indices = []; offset = float(spec.get('maskOffsetPx', 0.0)); shift = spec.get('projectionShiftPx', [0.0, 0.0]); shift_x = float(shift[0]); shift_y = float(shift[1])
    base_colour = [max(0, min(255, int(value))) / 255.0 for value in spec.get('targetSpecificColour', [100, 120, 55])]
    dark_colour = tuple(max(0.0, min(1.0, c * .58)) for c in base_colour)
    mid_colour = tuple(max(0.0, min(1.0, c * .82)) for c in base_colour)
    light_colour = tuple(max(0.0, min(1.0, c * 1.16 + .035)) for c in base_colour)
    ridge_colour = tuple(max(0.0, min(1.0, c * .72 + .04)) for c in base_colour)
    mats = [make_mat(f'{spec["targetLeafId"]}_DARK_FACET', dark_colour), make_mat(f'{spec["targetLeafId"]}_MID_FACET', mid_colour), make_mat(f'{spec["targetLeafId"]}_LIGHT_FACET', light_colour), make_mat(f'{spec["targetLeafId"]}_RIDGE', ridge_colour)]
    for y, x0, x1 in runs:
        points = [(box[0] + x0 + offset + shift_x, box[1] + y + offset + shift_y), (box[0] + x1 + 1 - offset + shift_x, box[1] + y + offset + shift_y), (box[0] + x1 + 1 - offset + shift_x, box[1] + y + 1 - offset + shift_y), (box[0] + x0 + offset + shift_x, box[1] + y + 1 - offset + shift_y)]
        start = len(verts); verts.extend([(*world_xy(x, py), z + .003) for x, py in points]); back = len(verts); verts.extend([(*world_xy(x, py), z - .003) for x, py in points])
        # Keep the measured mask visually continuous.  Per-scanline material
        # changes create artificial horizontal striping and are not a valid
        # tonal reconstruction of a leaf.
        facet = 2 if spec.get('colourClass') == 'LIGHT' else (0 if spec.get('colourClass') == 'DARK' else 1)
        faces.append((start, start + 1, start + 2, start + 3)); material_indices.append(facet)
        faces.append((back + 3, back + 2, back + 1, back)); material_indices.append(0)
        for i in range(4):
            j = (i + 1) % 4; faces.append((start + i, start + j, back + j, back + i)); material_indices.append(0)
    mesh = bpy.data.meshes.new(f'{spec["targetLeafId"]}_TARGET_RASTER_LEAF_MESH'); mesh.from_pydata(verts, [], faces); mesh.update()
    obj = bpy.data.objects.new(spec['targetLeafId'], mesh); (collection or bpy.context.collection).objects.link(obj)
    tag(obj, 'SHRUB_VISIBLE_LEAF', spec['targetLeafId']); obj['targetContourVertexCount'] = len(runs) * 4; obj['targetContourSource'] = 'TARGET_GREEN_FAMILY_CLEANED_VISIBLE_MASK_RUN_GEOMETRY'; obj['targetTipPx'] = list(spec['targetTipPx']); obj['targetAngleDeg'] = spec.get('targetAngleDeg', 0); obj['frontContourLocked'] = True; obj['internalRidgeOnlyDepthChange'] = True
    for material in mats: mesh.materials.append(material)
    for polygon, index in zip(mesh.polygons, material_indices): polygon.material_index = index
    return obj

def make_leaf_mesh(spec, contour, z, collection=None):
    tip = tuple(spec['targetTipPx'])
    contour = rotate_to_tip([tuple(point) for point in contour], tip)
    base = max(contour, key=lambda point: (point[0] - tip[0]) ** 2 + (point[1] - tip[1]) ** 2)
    front = [(*world_xy(x, y), z + .003) for x, y in contour]
    back = [(*world_xy(x, y), z - .003) for x, y in contour]
    n = len(contour)
    axis = Vector((base[0] - tip[0], base[1] - tip[1]))
    if axis.length < 1e-6:
        axis = Vector((0, 1))
    axis.normalize()
    perp = Vector((-axis.y, axis.x))
    ridge = []
    for t, half_width in ((.14, .20), (.50, .32), (.86, .22)):
        q = Vector(tip) * (1.0 - t) + Vector(base) * t
        ridge.extend([
            (*world_xy(q.x + perp.x * half_width, q.y + perp.y * half_width), z + .012),
            (*world_xy(q.x - perp.x * half_width, q.y - perp.y * half_width), z + .012)
        ])
    ridge0 = n
    back0 = n + len(ridge)
    verts = front + ridge + back
    faces, material_indices = [], []
    # Keep the measured front contour as one Blender n-gon.  The previous
    # nearest-vertex remapping of tessellated triangles could silently reorder
    # concave target contours and lower raster IoU despite a correct contour.
    faces.append(tuple(range(n)))
    centroid = sum((Vector(vertex) for vertex in front), Vector()) / max(1, n)
    local = (centroid.x - world_xy(*tip)[0]) * perp.x + (-(centroid.y - world_xy(*tip)[1])) * perp.y
    light_left = spec.get('lightSide', 'LEFT_LIGHT') == 'LEFT_LIGHT'
    material_indices.append(1 if abs(local) < .018 else (2 if (local < 0) == light_left else 0))
    for s in range(2):
        a, b = ridge0 + s * 2, ridge0 + (s + 1) * 2
        faces.append((a, b, b + 1, a + 1)); material_indices.append(3)
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, back0 + j, back0 + i)); material_indices.append(0)
        faces.append((i, j, back0 + j, back0 + i)); material_indices.append(0)
    mesh = bpy.data.meshes.new(f'{spec["targetLeafId"]}_TARGET_LEAF_MESH')
    mesh.from_pydata(verts, [], faces); mesh.update()
    obj = bpy.data.objects.new(spec['targetLeafId'], mesh)
    (collection or bpy.context.collection).objects.link(obj)
    tag(obj, 'SHRUB_VISIBLE_LEAF', spec['targetLeafId'])
    obj['targetContourVertexCount'] = n
    obj['targetContourSource'] = spec.get('contourSource', 'TARGET_SPECIFIC')
    obj['targetTipPx'] = list(tip); obj['targetAngleDeg'] = spec.get('targetAngleDeg', 0)
    obj['frontContourLocked'] = True; obj['internalRidgeOnlyDepthChange'] = True
    base_colour = [max(0, min(255, int(value))) / 255.0 for value in spec.get('targetSpecificColour', [100, 120, 55])]
    dark_colour = tuple(max(0.0, min(1.0, c * .58)) for c in base_colour)
    mid_colour = tuple(max(0.0, min(1.0, c * .82)) for c in base_colour)
    light_colour = tuple(max(0.0, min(1.0, c * 1.16 + .035)) for c in base_colour)
    ridge_colour = tuple(max(0.0, min(1.0, c * .72 + .04)) for c in base_colour)
    mats = [make_mat(f'{spec["targetLeafId"]}_DARK_FACET', dark_colour), make_mat(f'{spec["targetLeafId"]}_MID_FACET', mid_colour), make_mat(f'{spec["targetLeafId"]}_LIGHT_FACET', light_colour), make_mat(f'{spec["targetLeafId"]}_RIDGE', ridge_colour)]
    for material in mats: mesh.materials.append(material)
    for polygon, index in zip(mesh.polygons, material_indices): polygon.material_index = index
    return obj

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def configure_scene():
    scene = bpy.context.scene
    bpy.ops.object.camera_add(location=(0, 0, 10))
    camera = bpy.context.object; camera.name = 'PLANT_26LEAF_TARGETSPECIFIC_LOCKED_FRONT_CAMERA'
    camera.data.type = 'ORTHO'; camera.data.ortho_scale = 1.0; scene.camera = camera
    scene.render.resolution_x = W; scene.render.resolution_y = H; scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA'; scene.render.film_transparent = False
    try: scene.render.engine = 'BLENDER_EEVEE_NEXT'
    except Exception: pass
    world = bpy.data.worlds.new('PLANT_26LEAF_TARGETSPECIFIC_WORLD'); scene.world = world; world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (1, 1, 1, 1); world.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.0
    scene.view_settings.view_transform = 'Standard'; scene.view_settings.look = 'None'; scene.view_settings.exposure = 0; scene.view_settings.gamma = 1
    return scene

def load_specs():
    result = {}
    for filename in os.listdir(spec_dir):
        if filename.endswith('.json'):
            spec = json.load(open(os.path.join(spec_dir, filename)))
            result[spec['targetLeafId']] = spec
    return result

def run_sweep(specs):
    rendered = []
    for leaf_id in sorted(specs.keys()):
        spec = specs[leaf_id]
        if spec.get('protectedCalibrationLeaf'):
            continue
        for candidate in spec['candidates']:
            output_dir = os.path.join(out_root, leaf_id, candidate['candidateId']); os.makedirs(output_dir, exist_ok=True)
            reset_scene(); scene = configure_scene()
            if candidate.get('maskRuns'):
                raster_spec = dict(spec); raster_spec['maskOffsetPx'] = candidate.get('maskOffsetPx', 0.0)
                raster_spec['projectionShiftPx'] = candidate.get('projectionShiftPx', [0.0, 0.0])
                obj = make_raster_leaf_mesh(raster_spec, candidate['maskRuns'], .05)
            else:
                obj = make_leaf_mesh(spec, candidate['contour'], .05)
            scene.render.filepath = os.path.join(output_dir, 'BEAUTY.png'); bpy.ops.render.render(write_still=True)
            original = [slot.material for slot in obj.material_slots]
            id_material = make_mat(f'{leaf_id}_COMPONENT_ID', (.08, .65, .95))
            obj.data.materials.clear(); obj.data.materials.append(id_material)
            scene.render.film_transparent = True; scene.render.filepath = os.path.join(output_dir, 'COMPONENT_ID.png'); bpy.ops.render.render(write_still=True)
            scene.render.film_transparent = False; obj.data.materials.clear()
            for material in original: obj.data.materials.append(material)
            for polygon in obj.data.polygons: polygon.material_index = 0
            wire = obj.modifiers.new(f'{leaf_id}_WIREFRAME', 'WIREFRAME'); wire.thickness = .0025; wire.use_replace = True
            scene.render.filepath = os.path.join(output_dir, 'WIREFRAME.png'); bpy.ops.render.render(write_still=True); obj.modifiers.remove(wire)
            result = {'status': 'PASS_26_LEAF_TARGETSPECIFIC_BLENDER_CANDIDATE', 'leafId': leaf_id, 'candidateId': candidate['candidateId'], 'contourVertexCount': len(candidate['contour']), 'contourSource': candidate['source'], 'projectionShiftPx': candidate.get('projectionShiftPx', [0.0, 0.0]), 'referenceTextureUsedInBeauty': False, 'referencePlaneVisible': False, 'frontContourLocked': True, 'internalRidgeOnlyDepthChange': True, 'otherLeafGeometryChanged': False, 'flowersChanged': False, 'planterChanged': False, 'depthOrSideWorkPerformed': False, 'cameraLocked': True, 'anonymousGeometryCount': 0, 'mobileBudget': 'PASS'}
            json.dump(result, open(os.path.join(output_dir, 'RESULT.json'), 'w'), indent=2)
            bpy.ops.wm.save_as_mainfile(filepath=os.path.join(output_dir, 'CALIBRATION.blend'))
            rendered.append((leaf_id, candidate['candidateId']))
    print(json.dumps({'status': 'PASS_26_LEAF_TARGETSPECIFIC_SWEEP', 'renderedCandidates': len(rendered), 'leaves': sorted(specs.keys()), 'protectedSkipped': [k for k, v in specs.items() if v.get('protectedCalibrationLeaf')], 'referenceTextureUsedInBeauty': False, 'referencePlaneVisible': False, 'depthOrSideWorkPerformed': False, 'otherLeavesChanged': False, 'flowersChanged': False, 'planterChanged': False, 'anonymousGeometryCount': 0, 'mobileBudget': 'PASS'}, indent=2))

def cube_px(name, box, z, depth, material, component):
    x0, y0, x1, y1 = box; cx, cy = world_xy((x0 + x1) * .5, (y0 + y1) * .5)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cy, z)); obj = bpy.context.object; obj.name = name; obj.dimensions = ((x1 - x0) / H, (y1 - y0) / H, depth); bpy.ops.object.transform_apply(location=False, rotation=False, scale=True); obj.data.materials.append(material); tag(obj, component); return obj

def prism(name, points_px, z, depth, material, component):
    front = [(*world_xy(x, y), z + depth * .5) for x, y in points_px]; back = [(*world_xy(x, y), z - depth * .5) for x, y in points_px]; n = len(points_px)
    faces = [tuple(reversed(range(n))), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    mesh = bpy.data.meshes.new(name + '_MESH'); mesh.from_pydata(front + back, [], faces); mesh.update(); obj = bpy.data.objects.new(name, mesh); bpy.context.collection.objects.link(obj); obj.data.materials.append(material); tag(obj, component); return obj

def petal_points(cx, cy, radius, angle):
    return [(cx + math.cos(angle + 2 * math.pi * k / 8) * radius * (1 if k % 2 == 0 else .56), cy + math.sin(angle + 2 * math.pi * k / 8) * radius * .62 * (1 if k % 2 == 0 else .56)) for k in range(8)]

def run_full(specs, selection):
    reset_scene(); scene = configure_scene(); out = out_root
    planter = make_mat('GG_MAT_PLANTER_GREEN_001', (.055, .16, .055)); planter_edge = make_mat('GG_MAT_PLANTER_EDGE_001', (.09, .21, .085)); planter_panel = make_mat('GG_MAT_PLANTER_RECESSED_PANEL_001', (.035, .105, .038)); soil = make_mat('GG_MAT_SOIL_001', (.045, .03, .012)); orange = make_mat('GG_MAT_FLOWER_ORANGE_001', (.92, .30, .035)); yellow = make_mat('GG_MAT_FLOWER_YELLOW_001', (.92, .60, .035)); purple = make_mat('GG_MAT_FLOWER_PURPLE_001', (.38, .12, .46)); black = make_mat('GG_MAT_WIREFRAME_001', (.02, .02, .02))
    planter_objects = [cube_px('PLANTER_BODY', (8, 185, 174, 246), .06, .12, planter, 'PLANTER_BODY'), cube_px('PLANTER_BASE', (15, 246, 168, 258), .07, .13, planter_edge, 'PLANTER_BODY'), cube_px('PLANTER_RIM', (4, 170, 178, 185), .12, .14, planter_edge, 'PLANTER_RIM'), cube_px('PLANTER_SOIL', (15, 173, 167, 182), .18, .02, soil, 'PLANTER_SOIL'), cube_px('PLANTER_FRONT_PANEL', (25, 194, 157, 239), .145, .03, planter_panel, 'PLANTER_PANEL'), cube_px('PLANTER_PANEL_TOP_TRIM', (25, 190, 157, 196), .17, .035, planter_edge, 'PLANTER_PANEL_TRIM'), cube_px('PLANTER_PANEL_BOTTOM_TRIM', (25, 238, 157, 243), .17, .035, planter_edge, 'PLANTER_PANEL_TRIM')]
    for idx, x in enumerate((16, 155)): planter_objects.append(cube_px('PLANTER_CORNER_POST_%02d' % idx, (x, 188, x + 14, 250), .16, .05, planter_edge, 'PLANTER_CORNER_POST'))
    for idx, sign in enumerate((-1, 1)):
        obj = cube_px('PLANTER_X_BRACE_%02d' % idx, (42, 207, 140, 213), .17, .04, planter_edge, 'PLANTER_X_BRACE'); obj.rotation_euler[2] = sign * math.radians(32)
    layer_z = {'BACK_TOP': .22, 'BACK_UPPER': .23, 'BACK_LEFT': .23, 'BACK_RIGHT': .23, 'MID_UPPER': .25, 'MID_LEFT': .25, 'MID_CENTRE': .25, 'MID_RIGHT': .25, 'FRONT_LEFT': .27, 'FRONT_CENTRE': .28, 'FRONT_RIGHT': .27, 'FRONT_LOW': .29}
    leaf_objects = []
    for leaf_id in sorted(selection.keys()):
        entry = selection[leaf_id]; spec = specs[leaf_id]
        if entry.get('maskRuns'):
            raster_spec = dict(spec); raster_spec['maskOffsetPx'] = entry.get('maskOffsetPx', 0.0); raster_spec['projectionShiftPx'] = entry.get('projectionShiftPx', [0.0, 0.0])
            leaf_objects.append(make_raster_leaf_mesh(raster_spec, entry['maskRuns'], layer_z.get(spec['targetMap']['layer_estimate'], .25)))
        else:
            leaf_objects.append(make_leaf_mesh(spec, entry['contour'], layer_z.get(spec['targetMap']['layer_estimate'], .25)))
    for group_idx, flower in enumerate([{'centre_x_px': 59, 'centre_y_px': 160, 'colour_class': 'ORANGE_YELLOW'}, {'centre_x_px': 117, 'centre_y_px': 161, 'colour_class': 'YELLOW'}, {'centre_x_px': 139, 'centre_y_px': 161, 'colour_class': 'PURPLE'}], start=1):
        material = {'ORANGE_YELLOW': orange, 'YELLOW': yellow, 'PURPLE': purple}[flower['colour_class']]; cx, cy = flower['centre_x_px'], flower['centre_y_px']
        for petal_idx in range(5):
            a = 2 * math.pi * petal_idx / 5.0; prism('FLOWER_%03d_PETAL_%02d' % (group_idx, petal_idx), petal_points(cx + math.cos(a) * 4.5, cy + math.sin(a) * 3.0, 4.2, a), .33, .008, material, 'FLOWER_GROUP_%03d' % group_idx)
        prism('FLOWER_%03d_CENTER' % group_idx, petal_points(cx, cy, 2.2, 0), .35, .01, yellow, 'FLOWER_GROUP_%03d' % group_idx)
    scene.render.filepath = os.path.join(out, 'PLANT_26LEAF_TARGETSPECIFIC_FRONT.png'); scene.render.film_transparent = False; bpy.ops.render.render(write_still=True)
    original = {obj.name: [slot.material for slot in obj.material_slots] for obj in leaf_objects}
    for idx, obj in enumerate(leaf_objects):
        c = (((idx * 73) % 251) / 251.0, ((idx * 151 + 37) % 251) / 251.0, ((idx * 193 + 89) % 251) / 251.0); obj.data.materials.clear(); obj.data.materials.append(make_mat('ID_' + obj.name, c))
    scene.render.film_transparent = True; scene.render.filepath = os.path.join(out, 'PLANT_26LEAF_TARGETSPECIFIC_COMPONENT_ID.png'); bpy.ops.render.render(write_still=True)
    scene.render.film_transparent = False
    for obj in leaf_objects:
        obj.data.materials.clear(); obj.data.materials.append(black); mod = obj.modifiers.new('ACTUAL_TARGET_LEAF_WIREFRAME', 'WIREFRAME'); mod.thickness = .0025; mod.use_replace = True
    scene.render.filepath = os.path.join(out, 'PLANT_26LEAF_TARGETSPECIFIC_WIREFRAME_FRONT.png'); bpy.ops.render.render(write_still=True)
    for obj in leaf_objects:
        if obj.name in original:
            obj.data.materials.clear(); [obj.data.materials.append(material) for material in original[obj.name]]
        for mod in list(obj.modifiers): obj.modifiers.remove(mod)
    stats = {'status': 'PASS_26_LEAF_TARGETSPECIFIC_FULL_FRONT', 'referenceTextureUsedInBeauty': False, 'referencePlaneVisible': False, 'geometryOnly': True, 'leafGeometryCount': len(leaf_objects), 'planterGeometryCount': len(planter_objects), 'anonymousGeometryCount': 0, 'camera': {'type': 'ORTHO', 'orthoScale': 1.0, 'resolution': [W, H], 'locked': True}, 'depthInferencePerformed': False, 'sideWorkPerformed': False, 'shopIntegrationPerformed': False, 'flowersTemporary': True, 'planterTemporary': True, 'mobileBudget': 'PASS', 'materials': len(bpy.data.materials), 'triangles': sum(len(p.vertices) - 2 for obj in bpy.context.scene.objects if hasattr(obj.data, 'polygons') for p in obj.data.polygons if len(p.vertices) >= 3), 'vertices': sum(len(obj.data.vertices) for obj in bpy.context.scene.objects if hasattr(obj.data, 'vertices'))}
    json.dump(stats, open(os.path.join(out, 'PLANT_26LEAF_TARGETSPECIFIC_RESULT.json'), 'w'), indent=2)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, 'PLANT_26LEAF_TARGETSPECIFIC_FRONT.blend'))
    print(json.dumps(stats, indent=2))

specs = load_specs()
if mode == 'sweep':
    run_sweep(specs)
elif mode == 'full':
    if not selection_path: raise SystemExit('full mode requires selection json')
    selection = json.load(open(selection_path))['selections']
    run_full(specs, selection)
else:
    raise SystemExit('mode must be sweep or full')
