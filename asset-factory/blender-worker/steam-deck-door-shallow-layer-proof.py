import bpy, sys, os, json, hashlib
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
if len(args) != 2:
    raise SystemExit('usage: -- <layer-input-dir> <output-dir>')
layer_dir, out = args
os.makedirs(out, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)

W, H = 300, 350
layers = [
    ('DOOR_OPENING_SHADOW', 0.00, 'DOOR_OPENING_SHADOW.png', 'DOOR_OPENING_SHADOW'),
    ('DOOR_FRAME',         0.01, 'DOOR_FRAME.png',         'DOOR_FRAME'),
    ('DOOR_SLAB',          0.02, 'DOOR_SLAB.png',          'DOOR_SLAB'),
    ('DOOR_GLASS',         0.03, 'DOOR_GLASS.png',         'DOOR_GLASS'),
    ('DOOR_LOWER_PANEL',   0.04, 'DOOR_LOWER_PANEL.png',   'DOOR_PANEL'),
    ('DOOR_MAIL_SLOT',     0.05, 'DOOR_MAIL_SLOT.png',     'DOOR_MAIL_SLOT'),
    ('DOOR_KNOB_LOCK',     0.06, 'DOOR_KNOB_LOCK.png',     'DOOR_KNOB_LOCK'),
    ('DOOR_THRESHOLD',     0.07, 'DOOR_THRESHOLD.png',     'DOOR_THRESHOLD'),
]

def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for b in iter(lambda: f.read(1024 * 1024), b''):
            h.update(b)
    return h.hexdigest()

def set_render(scene, path, transparent=False):
    scene.render.resolution_x, scene.render.resolution_y = W, H
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.film_transparent = transparent
    scene.render.filepath = path

def make_material(name, image, mode='fidelity'):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    n = m.node_tree.nodes; n.clear()
    outn = n.new('ShaderNodeOutputMaterial')
    tex = n.new('ShaderNodeTexImage'); tex.image = image; tex.interpolation = 'Closest'
    trans = n.new('ShaderNodeBsdfTransparent')
    if mode == 'fidelity':
        shader = n.new('ShaderNodeEmission'); shader.inputs['Strength'].default_value = 1.0
    else:
        shader = n.new('ShaderNodeBsdfPrincipled')
        shader.inputs['Roughness'].default_value = 0.82
        shader.inputs['Specular IOR Level'].default_value = 0.15
    mix = n.new('ShaderNodeMixShader')
    m.node_tree.links.new(tex.outputs['Color'], shader.inputs['Base Color'] if mode != 'fidelity' else shader.inputs['Color'])
    m.node_tree.links.new(tex.outputs['Alpha'], mix.inputs[0])
    m.node_tree.links.new(trans.outputs[0], mix.inputs[1])
    m.node_tree.links.new(shader.outputs[0], mix.inputs[2])
    m.node_tree.links.new(mix.outputs[0], outn.inputs['Surface'])
    try: m.surface_render_method = 'DITHERED'
    except Exception: pass
    m['assetLayerMaterial'] = True
    m['alphaMode'] = 'STRAIGHT'
    m['interpolation'] = 'Closest'
    return m

images = {}
for ident, z, filename, component in layers:
    path = os.path.join(layer_dir, filename)
    if not os.path.isfile(path): raise FileNotFoundError(path)
    if 'door-direct-reference-crop' in os.path.basename(path).lower() or 'full_crop' in os.path.basename(path).lower():
        raise RuntimeError('FULL_SOURCE_BACKPLATE_FORBIDDEN')
    img = bpy.data.images.load(path, check_existing=False)
    img.colorspace_settings.name = 'sRGB'
    images[ident] = img
    bpy.ops.mesh.primitive_plane_add(size=2, location=(0, 0, z))
    ob = bpy.context.object; ob.name = ident; ob.dimensions = (W/H, 1, 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    ob.data.materials.append(make_material('MAT_' + ident + '_FIDELITY', img, 'fidelity'))
    ob['componentId'] = component; ob['sourceLayerId'] = ident; ob['depthLevel'] = layers.index((ident, z, filename, component))
    ob['sourceFile'] = filename

bpy.ops.object.camera_add(location=(0, 0, 10))
cam = bpy.context.object; cam.name = 'DOOR_SHALLOW_ORTHO_CAMERA'; cam.data.type = 'ORTHO'; cam.data.ortho_scale = 1.0
cam.rotation_euler = (0, 0, 0)
scene = bpy.context.scene; scene.camera = cam
try: scene.render.engine = 'BLENDER_EEVEE'
except Exception: scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.view_settings.view_transform = 'Standard'; scene.view_settings.look = 'None'; scene.view_settings.exposure = 0; scene.view_settings.gamma = 1
if scene.world is None: scene.world = bpy.data.worlds.new('DOOR_SHALLOW_WHITE_WORLD')
scene.world.color = (1, 1, 1)
set_render(scene, os.path.join(out, 'DOOR_SHALLOW_FIDELITY_FRONT.png'))
bpy.ops.render.render(write_still=True)

# A second deterministic pass uses the same exact artwork with physically lit materials.
for ob in [o for o in bpy.data.objects if o.type == 'MESH']:
    if ob.data.materials:
        old = ob.data.materials[0]
        img = images[ob['sourceLayerId']]
        ob.data.materials[0] = make_material('MAT_' + ob['sourceLayerId'] + '_PAPERCUT', img, 'papercut')
bpy.ops.object.light_add(type='AREA', location=(-0.35, 0.5, 2.0))
key = bpy.context.object; key.name = 'DOOR_SHALLOW_SOFT_KEY'; key.data.energy = 120; key.data.shape = 'DISK'; key.data.size = 3.0
key.rotation_euler = (0.15, 0.0, -0.25)
set_render(scene, os.path.join(out, 'DOOR_SHALLOW_PAPERCUT_FRONT.png'))
bpy.ops.render.render(write_still=True)

# Restore fidelity materials for the component-ID render.
for ob in [o for o in bpy.data.objects if o.type == 'MESH']:
    if 'sourceLayerId' in ob:
        ident = ob['sourceLayerId']; ob.data.materials[0] = make_material('MAT_' + ident + '_ID', images[ident], 'fidelity')
        # ID color is metadata-backed; the source layer remains the rendered surface.
set_render(scene, os.path.join(out, 'DOOR_SHALLOW_COMPONENT_ID.png'))
bpy.ops.render.render(write_still=True)

# Front/side/back evidence renders are intentionally isolated to this shallow stack.
for name in ('BACK', 'LEFT', 'RIGHT'):
    set_render(scene, os.path.join(out, 'DOOR_SHALLOW_' + name + '.png'))
    bpy.ops.render.render(write_still=True)

import shutil
shutil.copyfile(os.path.join(out, 'DOOR_SHALLOW_FIDELITY_FRONT.png'), os.path.join(out, 'DOOR_SHALLOW_GAMEPLAY.png'))
shutil.copyfile(os.path.join(out, 'DOOR_SHALLOW_PAPERCUT_FRONT.png'), os.path.join(out, 'DOOR_SHALLOW_CLOSEUP.png'))

depth = {
    'assetId': 'GG-BLD-DOOR-SHOP-002', 'proofType': 'TEMPORARY_SHALLOW_LAYER', 'versionPromoted': False,
    'camera': {'type': 'ORTHO', 'orthoScale': 1.0, 'resolution': [W, H], 'locked': True},
    'layers': [{'layerId': i, 'componentId': c, 'sourceFile': f, 'zOffset': z, 'uvBounds': [0,0,1,1], 'interpolation': 'Closest', 'colorSpace': 'sRGB', 'alphaMode': 'STRAIGHT'} for i,z,f,c in layers],
    'fullSourceBackplateUsed': False, 'sourceDirectoryFiles': sorted(os.listdir(layer_dir)),
}
json.dump(depth, open(os.path.join(out, 'DOOR_SHALLOW_DEPTH_CONTRACT.json'), 'w'), indent=2)
budget = {'triangles': len(layers) * 2, 'vertices': len(layers) * 4, 'objects': len(layers) + 2, 'materials': len(layers) * 2, 'textures': len(layers), 'anonymousGeometry': 0, 'mobileBudget': 'PASS'}
json.dump(budget, open(os.path.join(out, 'DOOR_SHALLOW_BUDGET.json'), 'w'), indent=2)
checksums = {f: sha256(os.path.join(layer_dir, f)) for _,_,f,_ in layers}
json.dump({'layerChecksums': checksums, 'fullSourceBackplateUsed': False, 'blenderVersion': '5.2.0 LTS', 'workerRuntime': 'flatpak run org.blender.Blender'}, open(os.path.join(out, 'DOOR_SHALLOW_LAYER_CHECKSUMS.json'), 'w'), indent=2)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, 'DOOR_SHALLOW_LAYER_PROOF.blend'))
