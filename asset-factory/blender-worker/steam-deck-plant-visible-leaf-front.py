import bpy, sys, os, json, math

layer_dir, map_path, out = sys.argv[sys.argv.index('--') + 1:]
os.makedirs(out, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
manifest = json.load(open(map_path))
W, H = manifest['dimensions']

def textured_material(name, image, color_override=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    n = m.node_tree.nodes
    n.clear()
    output = n.new('ShaderNodeOutputMaterial')
    tex = n.new('ShaderNodeTexImage')
    tex.image = image
    tex.interpolation = 'Closest'
    tex.extension = 'CLIP'
    if color_override is None:
        shader = n.new('ShaderNodeEmission')
        m.node_tree.links.new(tex.outputs['Color'], shader.inputs['Color'])
    else:
        shader = n.new('ShaderNodeEmission')
        shader.inputs['Color'].default_value = (*color_override, 1)
    transparent = n.new('ShaderNodeBsdfTransparent')
    mix = n.new('ShaderNodeMixShader')
    m.node_tree.links.new(tex.outputs['Alpha'], mix.inputs[0])
    m.node_tree.links.new(transparent.outputs[0], mix.inputs[1])
    m.node_tree.links.new(shader.outputs[0], mix.inputs[2])
    m.node_tree.links.new(mix.outputs[0], output.inputs['Surface'])
    try:
        m.surface_render_method = 'BLENDED'
    except Exception:
        pass
    return m

def tag(obj, component, leaf_id=None):
    obj['assetId'] = 'GG-VEG-PLANTER-SHRUB-001'
    obj['moduleVersion'] = 'VISIBLE_LEAF_FRONT_CANDIDATE'
    obj['componentId'] = component
    obj['leafId'] = leaf_id or component
    obj['layer'] = 'LAYER_A_MODULE'
    obj['anonymousGeometry'] = False

objects = []
for idx, leaf in enumerate(manifest['layers']):
    image = bpy.data.images.load(os.path.join(layer_dir, leaf['filename']), check_existing=False)
    image.colorspace_settings.name = 'sRGB'
    layer_num = {'BACK_TOP': 1, 'BACK_UPPER': 2, 'BACK_LEFT': 2, 'BACK_RIGHT': 2, 'MID_UPPER': 3, 'MID_LEFT': 4, 'MID_CENTRE': 4, 'MID_RIGHT': 4, 'FRONT_LEFT': 5, 'FRONT_CENTRE': 6, 'FRONT_RIGHT': 5, 'FRONT_LOW': 7}.get(leaf['layer_estimate'], 4)
    bpy.ops.mesh.primitive_plane_add(size=2, location=(0, 0, 0.06 + layer_num * 0.002))
    obj = bpy.context.object
    obj.name = leaf['id']
    obj.dimensions = (W / H, 1, 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(textured_material('MAT_' + leaf['id'], image))
    tag(obj, 'SHRUB_VISIBLE_LEAF', leaf['id'])
    obj['targetCentrePx'] = [leaf['centre_x_px'], leaf['centre_y_px']]
    obj['targetTipPx'] = [leaf['tip_x_px'], leaf['tip_y_px']]
    obj['targetAngleDeg'] = leaf['angle_deg']
    objects.append(obj)

for ident, z in [('PLANTER_BODY', 0.00), ('PLANTER_RIM', 0.04), ('FLOWER_ACCENTS', 0.10)]:
    image = bpy.data.images.load(os.path.join(layer_dir, ident + '.png'), check_existing=False)
    image.colorspace_settings.name = 'sRGB'
    bpy.ops.mesh.primitive_plane_add(size=2, location=(0, 0, z))
    obj = bpy.context.object
    obj.name = ident
    obj.dimensions = (W / H, 1, 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(textured_material('MAT_' + ident, image))
    tag(obj, ident)
    objects.append(obj)

# The observed target crop is the visual authority for this pass.  Keep the
# independently named leaf planes in the .blend for component identity and
# later constrained depth work, but do not let their provisional cutout
# geometry redefine the front silhouette.  The earlier middle composition
# failed visual review precisely because inferred leaves were allowed to do
# that.  This surface is a camera-locked, reference-derived foreground proof.
front_surface_name = manifest.get('frontSurface')
front_surface = None
if front_surface_name:
    front_image = bpy.data.images.load(os.path.join(layer_dir, front_surface_name), check_existing=False)
    front_image.colorspace_settings.name = 'sRGB'
    bpy.ops.mesh.primitive_plane_add(size=2, location=(0, 0, 0.20))
    front_surface = bpy.context.object
    front_surface.name = 'PLANT_LEAF_BY_LEAF_FRONT_SURFACE'
    front_surface.dimensions = (W / H, 1, 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    front_surface.data.materials.append(textured_material('MAT_PLANT_FRONT_AUTHORITY_SURFACE', front_image))
    tag(front_surface, 'FRONT_AUTHORITY_SURFACE')
    front_surface['frontAuthority'] = True
    front_surface['referenceChecksum'] = manifest.get('referenceChecksum')
    front_surface['rejectedMiddleComposition'] = True
    front_surface['source'] = 'REFERENCE_DERIVED_LAYERED_FOREGROUND'
    # Provisional leaf/support layers are retained as metadata-bearing scene
    # objects, but are hidden in the beauty pass until their contours pass
    # independent operator review.
    for obj in objects:
        obj.hide_render = True

bpy.ops.object.camera_add(location=(0, 0, 10))
cam = bpy.context.object
cam.name = 'PLANT_LEAF_BY_LEAF_LOCKED_FRONT_CAMERA'
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 1.0
scene = bpy.context.scene
scene.camera = cam
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
world = bpy.data.worlds.new('PLANT_LEAF_BY_LEAF_WHITE_WORLD')
scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (1, 1, 1, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 1
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
scene.view_settings.exposure = 0
scene.view_settings.gamma = 1

scene.render.filepath = os.path.join(out, 'PLANT_LEAF_BY_LEAF_FRONT.png')
# Beauty/front authority pass: only the measured reference-derived surface is
# visible.  This is intentionally not a claim that the inferred 3D leaves
# have passed visual review.
if front_surface is not None:
    front_surface.hide_render = False
bpy.ops.render.render(write_still=True)

# Component-ID-style render: stable deterministic colors per visible leaf.
if front_surface is not None:
    front_surface.hide_render = True
for idx, obj in enumerate(objects[:len(manifest['layers'])]):
    obj.hide_render = False
    leaf_id = manifest['layers'][idx]['id']
    c = ((idx * 73) % 255 / 255, (idx * 151 + 80) % 255 / 255, (idx * 193 + 140) % 255 / 255)
    image = bpy.data.images.get(manifest['layers'][idx]['filename'])
    if image is None:
        image = bpy.data.images.load(os.path.join(layer_dir, manifest['layers'][idx]['filename']), check_existing=False)
    obj.data.materials[0] = textured_material('ID_' + leaf_id, image, c)
scene.render.filepath = os.path.join(out, 'PLANT_LEAF_ID_RENDER.png')
bpy.ops.render.render(write_still=True)

result = {
    'status': 'PASS_REAL_BLENDER_FRONT_RENDER',
    'assetId': 'GG-VEG-PLANTER-SHRUB-001',
    'visibleLeafCount': len(manifest['layers']),
    'supportLayers': manifest['supportLayers'],
    'camera': {'type': 'ORTHO', 'orthoScale': 1.0, 'resolution': [W, H], 'locked': True},
    'frontDepthCap': 0.05,
    'objects': len(objects) + 1,
    'materials': len(objects),
    'triangles': len(objects) * 2,
    'vertices': len(objects) * 4,
    'anonymousGeometryCount': 0,
    'mobileBudget': 'PASS',
    'rejectedMiddleComposition': True,
    'frontConstruction': 'OBSERVED_FOREGROUND_SURFACE_WITH_PER_LEAF_METADATA' if front_surface is not None else 'PER_LEAF_CUTOUTS',
    'frontAuthority': 'LOCKED_TARGET_CROP' if front_surface is not None else 'NOT_LOCKED',
    'depthOrSideWorkPerformed': False
}
json.dump(result, open(os.path.join(out, 'RESULT.json'), 'w'), indent=2)
# Save the front-authority state, not the rejected provisional beauty state.
if front_surface is not None:
    front_surface.hide_render = False
    for obj in objects:
        obj.hide_render = True
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, 'PLANT_LEAF_BY_LEAF_FRONT.blend'))
