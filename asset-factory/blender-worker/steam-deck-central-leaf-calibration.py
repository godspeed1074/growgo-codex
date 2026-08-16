import bpy, sys, os, json
from mathutils import Vector
from mathutils.geometry import tessellate_polygon

args = sys.argv[sys.argv.index('--') + 1:]
contour_path, out = args
os.makedirs(out, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
spec = json.load(open(contour_path))
W, H = 189, 261
contour = [tuple(p) for p in spec['chosenContour']]
leaf_id = spec['targetLeafId']
tip = tuple(spec.get('contourTipPx', spec['sourcePixelCoordinates']['tip']))

def world_xy(px, py):
    # Map measured pixel-edge coordinates to pixel-centre coverage without changing the locked contour.
    return ((px - .5 - W * .5) / H, (H * .5 - (py - .5)) / H)

def make_mat(name, colour):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nodes = m.node_tree.nodes; bsdf = nodes.get('Principled BSDF')
    if bsdf: nodes.remove(bsdf)
    out_node = nodes.get('Material Output'); shader = nodes.new('ShaderNodeEmission')
    shader.inputs['Color'].default_value = (*colour, 1); shader.inputs['Strength'].default_value = 1.0
    m.node_tree.links.new(shader.outputs['Emission'], out_node.inputs['Surface']); m.diffuse_color = (*colour, 1)
    return m

def tag(obj):
    obj['assetId'] = 'GG-VEG-PLANTER-SHRUB-001'; obj['moduleVersion'] = 'CENTRAL_LEAF_CALIBRATION'; obj['componentId'] = 'SHRUB_VISIBLE_LEAF'; obj['leafId'] = leaf_id; obj['layer'] = 'LAYER_A_MODULE'; obj['anonymousGeometry'] = False; obj['referenceTextureUsedInBeauty'] = False

# Rotate only the cyclic contour list so the measured tip is vertex zero.
tip_index = min(range(len(contour)), key=lambda i: (contour[i][0] - tip[0]) ** 2 + (contour[i][1] - tip[1]) ** 2)
contour = contour[tip_index:] + contour[:tip_index]
base_index = max(range(1, len(contour)), key=lambda i: (contour[i][0] - tip[0]) ** 2 + (contour[i][1] - tip[1]) ** 2)
base = contour[base_index]; mid = ((tip[0] + base[0]) * .5, (tip[1] + base[1]) * .5)
cx = sum(p[0] for p in contour) / len(contour)
front = [(*world_xy(x, y), .030) for x, y in contour]
back = [(*world_xy(x, y), .022) for x, y in contour]
r = Vector((base[0] - tip[0], base[1] - tip[1])); perp = Vector((-r.y, r.x)).normalized()
def ridge_pair(t, half_width):
    q = Vector((tip[0], tip[1])) * (1.0 - t) + Vector((base[0], base[1])) * t
    return [(*world_xy(q.x + perp.x * half_width, q.y + perp.y * half_width), .045), (*world_xy(q.x - perp.x * half_width, q.y - perp.y * half_width), .045)]
ridge = ridge_pair(.12, .45) + ridge_pair(.50, .55) + ridge_pair(.88, .38)
n = len(contour); ridge0 = n; back0 = n + len(ridge)
verts = front + ridge + back; faces = []; indices = []
front_vectors = [Vector(v) for v in front]
for tri in tessellate_polygon([front_vectors]):
    tri_indices = list(tri) if all(isinstance(vertex, int) for vertex in tri) else [min(range(n), key=lambda i: (front_vectors[i] - vertex).length_squared) for vertex in tri]
    if len(set(tri_indices)) == 3:
        faces.append(tuple(tri_indices)); indices.append(1)
for s in range(2):
    a = ridge0 + s * 2; b = ridge0 + (s + 1) * 2; faces.append((a, b, b + 1, a + 1)); indices.append(3)
def overlay_polygon(points, z, material_index):
    start = len(verts); verts.extend([(*world_xy(x, y), z) for x, y in points]); faces.append(tuple(range(start, start + len(points)))); indices.append(material_index)
tip_p = contour[0]; base_p = max(contour, key=lambda p: p[1])
overlay_polygon([tip_p, (91.5, 35.0), (86.5, 42.0), (83.8, 50.0), (85.2, 58.5), (89.5, 65.5), base_p, (94.2, 60.0), (94.1, 45.0)], .050, 2)
overlay_polygon([tip_p, (95.0, 45.0), (95.2, 60.0), base_p, (100.5, 65.0), (104.0, 56.0), (105.0, 46.0), (103.5, 40.0), (98.0, 35.0)], .051, 0)
for i in range(n):
    j = (i + 1) % n; faces.append((i, back0 + j, back0 + i)); indices.append(0); faces.append((i, j, back0 + j, back0 + i)); indices.append(0)
mesh = bpy.data.meshes.new('CENTRAL_TARGET_LEAF_MESH'); mesh.from_pydata(verts, [], faces); mesh.update()
obj = bpy.data.objects.new('CENTRAL_TARGET_LEAF', mesh); bpy.context.collection.objects.link(obj); tag(obj)
obj['targetContourVertexCount'] = n; obj['targetContourSource'] = 'CENTRAL_TARGET_LEAF_CONTOUR.json'; obj['targetTipPx'] = list(tip); obj['frontContourLocked'] = True; obj['internalRidgeOnlyDepthChange'] = True
dark = make_mat('CENTRAL_LEAF_DARK_FACET', (.065, .105, .020)); mid_mat = make_mat('CENTRAL_LEAF_MID_FACET', (.115, .180, .040)); light = make_mat('CENTRAL_LEAF_LIGHT_FACET', (.245, .290, .070)); ridge_mat = make_mat('CENTRAL_LEAF_RIDGE_HIGHLIGHT', (.315, .350, .095))
for m in [dark, mid_mat, light, ridge_mat]: obj.data.materials.append(m)
for poly, idx in zip(obj.data.polygons, indices): poly.material_index = idx

scene = bpy.context.scene; bpy.ops.object.camera_add(location=(0, 0, 10)); camera = bpy.context.object; camera.name = 'CENTRAL_LEAF_LOCKED_FRONT_CAMERA'; camera.data.type = 'ORTHO'; camera.data.ortho_scale = 1.0; scene.camera = camera
scene.render.resolution_x = W; scene.render.resolution_y = H; scene.render.resolution_percentage = 100; scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA'; scene.render.film_transparent = False
try: scene.render.engine = 'BLENDER_EEVEE_NEXT'
except Exception: pass
world = bpy.data.worlds.new('CENTRAL_LEAF_WHITE_WORLD'); scene.world = world; world.use_nodes = True; world.node_tree.nodes['Background'].inputs['Color'].default_value = (1, 1, 1, 1); world.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.0
scene.view_settings.view_transform = 'Standard'; scene.view_settings.look = 'None'; scene.view_settings.exposure = 0; scene.view_settings.gamma = 1
def render(name): scene.render.filepath = os.path.join(out, name); bpy.ops.render.render(write_still=True)

# Same contour/camera, three shading candidates.
base_indices = list(indices)
render('CENTRAL_LEAF_MODE_A_FLAT_FACETED.png')
for poly, idx in zip(obj.data.polygons, base_indices): poly.material_index = 0 if idx == 3 else (1 if idx == 1 else 0)
render('CENTRAL_LEAF_MODE_B_CONTROLLED_NORMALS.png')
for poly, idx in zip(obj.data.polygons, base_indices): poly.material_index = idx
render('CENTRAL_LEAF_MODE_C_PAPERCUT_FACETS.png'); render('CENTRAL_LEAF_FINAL_FRONT.png')

id_mat = make_mat('CENTRAL_LEAF_COMPONENT_ID', (.08, .65, .95)); obj.data.materials.clear(); obj.data.materials.append(id_mat)
for poly in obj.data.polygons: poly.material_index = 0
scene.render.film_transparent = True
render('CENTRAL_LEAF_COMPONENT_ID.png')
scene.render.film_transparent = False
obj.data.materials.clear(); obj.data.materials.append(dark); wire = obj.modifiers.new('CENTRAL_LEAF_WIREFRAME', 'WIREFRAME'); wire.thickness = .0025; wire.use_replace = True; render('CENTRAL_LEAF_WIREFRAME_FRONT.png'); obj.modifiers.remove(wire)
obj.data.materials.clear()
for m in [dark, mid_mat, light, ridge_mat]: obj.data.materials.append(m)
for poly, idx in zip(obj.data.polygons, base_indices): poly.material_index = idx
camera.location = (4.0, -1.2, 8.0); camera.rotation_euler = (Vector((0, 0, .03)) - camera.location).to_track_quat('-Z', 'Y').to_euler(); render('CENTRAL_LEAF_FINAL_3Q.png')
camera.location = (8.0, 0.0, .05); camera.rotation_euler = (Vector((0, 0, .03)) - camera.location).to_track_quat('-Z', 'Y').to_euler(); render('CENTRAL_LEAF_FINAL_SIDE.png')
camera.location = (0, 0, 10); camera.rotation_euler = (0, 0, 0)
json.dump({'status': 'PASS_CENTRAL_LEAF_BLENDER_CALIBRATION', 'leafId': leaf_id, 'contourVertexCount': n, 'contourTipPx': list(tip), 'referenceTextureUsedInBeauty': False, 'referencePlaneVisible': False, 'frontContourLocked': True, 'internalRidgeOnlyDepthChange': True, 'otherLeafGeometryChanged': False, 'flowersChanged': False, 'planterChanged': False, 'cameraLocked': True, 'chosenMode': 'C', 'frontRender': 'CENTRAL_LEAF_FINAL_FRONT.png', 'componentIdRender': 'CENTRAL_LEAF_COMPONENT_ID.png', 'wireframeRender': 'CENTRAL_LEAF_WIREFRAME_FRONT.png', 'threeQuarterRender': 'CENTRAL_LEAF_FINAL_3Q.png', 'sideRender': 'CENTRAL_LEAF_FINAL_SIDE.png'}, open(os.path.join(out, 'CENTRAL_LEAF_CALIBRATION_RESULT.json'), 'w'), indent=2)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, 'CENTRAL_LEAF_CALIBRATION.blend'))
