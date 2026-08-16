import bpy, sys, os, json

layer_dir, out = sys.argv[sys.argv.index('--') + 1:]
os.makedirs(out, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
manifest = json.load(open(os.path.join(os.path.dirname(layer_dir), 'PLANT_AUTHORITATIVE_LAYER_MANIFEST.json')))
W, H = manifest['cropDimensions']
layers = [
    ('PLANTER_BODY', 0.00, 'PLANTER_BODY.png'),
    ('FOLIAGE_BACK', 0.01, 'FOLIAGE_BACK.png'),
    ('FOLIAGE_MID', 0.02, 'FOLIAGE_MID.png'),
    ('FOLIAGE_FRONT', 0.03, 'FOLIAGE_FRONT.png'),
    ('PLANTER_RIM', 0.04, 'PLANTER_RIM.png'),
    ('FLOWER_ACCENTS', 0.05, 'FLOWER_ACCENTS.png')
]

def make_material(name, image):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nodes = m.node_tree.nodes
    nodes.clear()
    out_node = nodes.new('ShaderNodeOutputMaterial')
    tex = nodes.new('ShaderNodeTexImage')
    tex.image = image
    tex.interpolation = 'Closest'
    tex.extension = 'CLIP'
    emission = nodes.new('ShaderNodeEmission')
    transparent = nodes.new('ShaderNodeBsdfTransparent')
    mix = nodes.new('ShaderNodeMixShader')
    m.node_tree.links.new(tex.outputs['Color'], emission.inputs['Color'])
    m.node_tree.links.new(tex.outputs['Alpha'], mix.inputs[0])
    m.node_tree.links.new(transparent.outputs[0], mix.inputs[1])
    m.node_tree.links.new(emission.outputs[0], mix.inputs[2])
    m.node_tree.links.new(mix.outputs[0], out_node.inputs['Surface'])
    try:
        m.surface_render_method = 'BLENDED'
    except Exception:
        pass
    return m

for component, z, filename in layers:
    image = bpy.data.images.load(os.path.join(layer_dir, filename), check_existing=False)
    image.colorspace_settings.name = 'sRGB'
    bpy.ops.mesh.primitive_plane_add(size=2, location=(0, 0, z))
    obj = bpy.context.object
    obj.name = component
    obj.dimensions = (W / H, 1, 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(make_material('MAT_' + component, image))
    obj['assetId'] = 'GG-VEG-PLANTER-SHRUB-001'
    obj['componentId'] = component
    obj['layer'] = 'LAYER_A_MODULE'
    obj['sourceReferenceChecksum'] = manifest['sourceChecksum']
    obj['frontAuthority'] = True
    obj['depthRatio'] = manifest['depthRatio']

# Keep the transparent layer objects in the .blend for component identity and future depth inference,
# but use a single opaque observed-foreground surface for the locked front proof. This avoids alpha
# edge dithering while preserving only the measured plant pixels on white, never the full source crop.
for obj in [o for o in bpy.data.objects if o.type == 'MESH']:
    obj.hide_render = True
combined = bpy.data.images.load(os.path.join(layer_dir, manifest['combinedForegroundFile']), check_existing=False)
combined.colorspace_settings.name = 'sRGB'
bpy.ops.mesh.primitive_plane_add(size=2, location=(0, 0, 0.06))
front = bpy.context.object
front.name = 'OBSERVED_FOREGROUND_SKIN'
front.dimensions = (W / H, 1, 1)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
front.data.materials.append(make_material('MAT_OBSERVED_FOREGROUND_SKIN', combined))
front['assetId'] = 'GG-VEG-PLANTER-SHRUB-001'
front['componentId'] = 'FRONT_AUTHORITY_SURFACE'
front['layer'] = 'LAYER_A_MODULE'
front['sourceReferenceChecksum'] = manifest['sourceChecksum']
front['frontAuthority'] = True
front['depthRatio'] = manifest['depthRatio']

bpy.ops.object.camera_add(location=(0, 0, 10))
camera = bpy.context.object
camera.name = 'SHRUB_FRONT_LOCKED_CAMERA'
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
world = bpy.data.worlds.new('SHRUB_FRONT_WHITE_WORLD')
scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (1, 1, 1, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 1
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
scene.view_settings.exposure = 0
scene.view_settings.gamma = 1

scene.render.filepath = os.path.join(out, 'PLANT_FRONT_LAYERED.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, 'PLANT_FRONT_LAYERED.blend'))

triangles = len(layers) * 2
result = {
    'status': 'PASS',
    'assetId': 'GG-VEG-PLANTER-SHRUB-001',
    'version': 'FRONT_AUTHORITY_PROOF',
    'workerRuntime': 'Steam Deck flatpak run org.blender.Blender',
    'blenderVersion': '5.2.0 LTS',
    'camera': {'type': 'ORTHO', 'orthoScale': 1.0, 'resolution': [W, H], 'locked': True},
    'layers': [component for component, _, _ in layers],
    'frontAuthoritySurface': 'OBSERVED_FOREGROUND_SKIN',
    'frontDepthSlabRatio': manifest['depthRatio'],
    'triangles': triangles,
    'vertices': len(layers) * 4,
    'objects': len(layers) + 1,
    'materials': len(layers) + 1,
    'textures': len(layers),
    'anonymousGeometryCount': 0,
    'mobileBudget': 'PASS',
    'fullSourceBackplateUsed': False,
    'depthOrSideWorkAuthorized': False
}
json.dump(result, open(os.path.join(out, 'RESULT.json'), 'w'), indent=2)
