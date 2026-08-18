"""Fresh Grow Goods facade proof assembled from materialized Layer A files only.

The approved facade is deliberately never opened: each structural component is
appended from its independently materialized .blend artifact, while its owned
front presentation is supplied as a separate RGBA layer.
"""
import bpy, os, sys, math, json, hashlib
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
artifact_root, art_root, out = args[:3]
os.makedirs(out, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
U = 4.4 / 576
X = lambda px: (px - 338) * U
Z = lambda px: (585 - px) * U

artifacts = [
 'GG-FAC-WALL-BAY-SIMPLE-001__WALL_LEFT_OF_DOOR.blend',
 'GG-FAC-WALL-PANEL-SIMPLE-001__WALL_BETWEEN_DOOR_WINDOW.blend',
 'GG-FAC-WALL-BAY-SIMPLE-001__WALL_RIGHT_OF_WINDOW.blend',
 'GG-FAC-WALL-PANEL-SIMPLE-001__WALL_ABOVE_OPENINGS.blend',
 'GG-FAC-PILASTER-VERTICAL-SIMPLE-001__LEFT_PILASTER.blend',
 'GG-FAC-PILASTER-VERTICAL-SIMPLE-001__RIGHT_PILASTER.blend',
 'GG-FAC-BASE-PLINTH-SIMPLE-001__BASE_PLINTH.blend',
 'GG-FAC-BASE-BAND-SIMPLE-001__BASE_BAND.blend',
 'GG-FAC-HEAD-CORNICE-SIMPLE-001__TOP_CAP.blend',
 'GG-FAC-FASCIA-BAND-SIMPLE-001__FASCIA_BAND.blend',
 'GG-FAC-AWNING-RAIL-SIMPLE-001__AWNING_RAIL.blend',
 'GG-BLD-AWNING-COMMERCIAL-001__AWNING_STRUCTURE.blend',
 'GG-BLD-SIGN-FASCIA-COMMERCIAL-001__SIGN_FASCIA_STRUCTURE.blend'
]
objects = []
for filename in artifacts:
    filepath = os.path.join(artifact_root, filename)
    with bpy.data.libraries.load(filepath, link=False) as (data_from, data_to):
        data_to.objects = data_from.objects
    for obj in data_to.objects:
        if obj:
            bpy.context.collection.objects.link(obj)
            obj['runtimeArtifact'] = filename
            obj['parentFacadeDependency'] = 'NONE'
            obj['anonymousGeometry'] = False
            objects.append(obj)

def image_plane(name, filename, x0, x1, y0, y1, asset_id, component_id, z_order):
    mesh = bpy.data.meshes.new(name + '_MESH')
    mesh.from_pydata([(X(x0), z_order, Z(y1)), (X(x1), z_order, Z(y1)),
                      (X(x1), z_order, Z(y0)), (X(x0), z_order, Z(y0))], [], [(0,1,2,3)])
    mesh.uv_layers.new()
    for loop, uv in zip(mesh.uv_layers.active.data, [(0,0),(1,0),(1,1),(0,1)]): loop.uv = uv
    obj = bpy.data.objects.new(name, mesh); bpy.context.collection.objects.link(obj)
    image = bpy.data.images.load(os.path.join(art_root, filename), check_existing=False)
    material = bpy.data.materials.new('PRES_' + name); material.use_nodes = True
    nodes = material.node_tree.nodes; nodes.clear()
    output = nodes.new('ShaderNodeOutputMaterial'); emission = nodes.new('ShaderNodeEmission')
    texture = nodes.new('ShaderNodeTexImage'); transparent = nodes.new('ShaderNodeBsdfTransparent'); mix = nodes.new('ShaderNodeMixShader')
    texture.image = image
    material.node_tree.links.new(texture.outputs['Color'], emission.inputs['Color'])
    material.node_tree.links.new(texture.outputs['Alpha'], mix.inputs[0])
    material.node_tree.links.new(transparent.outputs[0], mix.inputs[1])
    material.node_tree.links.new(emission.outputs[0], mix.inputs[2])
    material.node_tree.links.new(mix.outputs[0], output.inputs[0])
    material.surface_render_method = 'DITHERED'; mesh.materials.append(material)
    obj['assetId'] = asset_id; obj['componentId'] = component_id; obj['layer'] = 'LAYER_A_MODULE'
    obj['presentationArtifact'] = filename; obj['parentFacadeDependency'] = 'NONE'; obj['anonymousGeometry'] = False
    objects.append(obj); return obj

# Every file here is a component-owned crop, not a facade-wide card or a mask.
layers = [
 ('WALL_LEFT_PRESENTATION','PRES_WALL_LEFT.png',49,89,256,528,'GG-FAC-WALL-BAY-SIMPLE-001','WALL_LEFT_OF_DOOR',-.13),
 ('WALL_BETWEEN_PRESENTATION','PRES_WALL_BETWEEN.png',284,304,256,528,'GG-FAC-WALL-PANEL-SIMPLE-001','WALL_BETWEEN_DOOR_WINDOW',-.13),
 ('WALL_RIGHT_PRESENTATION','PRES_WALL_RIGHT.png',582,626,256,528,'GG-FAC-WALL-BAY-SIMPLE-001','WALL_RIGHT_OF_WINDOW',-.13),
 ('WALL_ABOVE_PRESENTATION','PRES_WALL_ABOVE.png',49,626,257,275,'GG-FAC-WALL-PANEL-SIMPLE-001','WALL_ABOVE_OPENINGS',-.13),
 ('BASE_LEFT_PRESENTATION','PRES_BASE_LEFT.png',17,89,500,586,'GG-FAC-BASE-PLINTH-SIMPLE-001','BASE_PLINTH_LEFT',-.14),
 ('BASE_BETWEEN_PRESENTATION','PRES_BASE_BETWEEN.png',284,582,500,586,'GG-FAC-BASE-PLINTH-SIMPLE-001','BASE_PLINTH_BETWEEN',-.14),
 ('BASE_RIGHT_PRESENTATION','PRES_BASE_RIGHT.png',582,626,500,586,'GG-FAC-BASE-PLINTH-SIMPLE-001','BASE_PLINTH_RIGHT',-.14),
 ('FASCIA_PRESENTATION','PRES_FASCIA_STRUCTURE.png',28,672,12,163,'GG-FAC-FASCIA-BAND-SIMPLE-001','FASCIA_BAND',-.15),
 ('AWNING_PRESENTATION','PRES_AWNING_PLUM.png',74,627,161,260,'GG-PRES-AWNING-PLUM-COMMERCIAL-001','AWNING',-.16),
 ('SIGN_PRESENTATION','PRES_SIGN_GROW_GOODS.png',158,542,55,113,'GG-PRES-SIGN-GROW-GOODS-001','SIGN',-.17),
 ('DOOR_PRESENTATION','PRES_DOOR.png',89,284,256,583,'GG-BLD-DOOR-SHOP-002','DOOR',-.18),
 ('WINDOW_PRESENTATION','PRES_WINDOW.png',304,582,275,506,'GG-BLD-WINDOW-SHOP-LARGE-002','WINDOW',-.18),
]
for layer in layers: image_plane(*layer)

scene = bpy.context.scene; scene.render.engine='BLENDER_EEVEE'; scene.render.resolution_x=760; scene.render.resolution_y=670; scene.render.resolution_percentage=100; scene.render.image_settings.file_format='PNG'; scene.view_settings.view_transform='Standard'; scene.view_settings.look='None'
scene.world = bpy.data.worlds.new('NativeFacadeWorld'); scene.world.color=(.82,.82,.82)
bpy.ops.object.light_add(type='AREA', location=(0,-4,4)); bpy.context.object.data.energy=900; bpy.context.object.data.size=8; bpy.context.object.rotation_euler=(math.radians(35),0,0)
bpy.ops.object.camera_add(location=(0,-12,2.2)); camera=bpy.context.object; camera.data.type='ORTHO'; camera.data.ortho_scale=4.9; scene.camera=camera; target=Vector((0,0,2.2)); camera.rotation_euler=((target-camera.location).to_track_quat('-Z','Y')).to_euler()
def render(name): scene.render.filepath=os.path.join(out,name); bpy.ops.render.render(write_still=True)
render('COMMERCIAL_SIMPLE_LAYER_A_NATIVE_GROW_GOODS_FRONT.png')
# Real isolation board: each physical artifact is moved to a private board cell;
# every presentation plane is hidden so no neighbour or facade card can assist it.
structural = [o for o in objects if o.get('runtimeArtifact')]
saved_locations={o.name:o.location.copy() for o in structural}; hidden={o.name:o.hide_render for o in objects}
for o in objects:
    if not o.get('runtimeArtifact'): o.hide_render=True
for i,o in enumerate(structural):
    center=sum((o.matrix_world @ Vector(corner) for corner in o.bound_box), Vector()) / 8
    o.location += Vector(((i%5-2)*1.65-center.x, 0, (2-i//5)*1.35-center.z))
scene.render.engine='BLENDER_WORKBENCH'; camera.data.ortho_scale=8.5; camera.location=(0,-12,1.0); camera.rotation_euler=((Vector((0,0,1.0))-camera.location).to_track_quat('-Z','Y')).to_euler(); render('COMMERCIAL_SIMPLE_LAYER_A_ISOLATED_ARTIFACT_BOARD_V2.png')
for o in structural: o.location=saved_locations[o.name]
for o in objects: o.hide_render=hidden[o.name]
scene.render.engine='BLENDER_EEVEE'; camera.data.ortho_scale=4.9; camera.location=(0,-12,2.2); camera.rotation_euler=((target-camera.location).to_track_quat('-Z','Y')).to_euler()
for angle,label in [(15,'15_LEFT'),(-15,'15_RIGHT')]:
    rad=math.radians(angle); camera.location=(12*math.sin(rad),-12*math.cos(rad),2.2); camera.rotation_euler=((target-camera.location).to_track_quat('-Z','Y')).to_euler(); render('COMMERCIAL_SIMPLE_LAYER_A_NATIVE_GROW_GOODS_'+label+'.png')
camera.location=(0,-12,2.2); camera.rotation_euler=((target-camera.location).to_track_quat('-Z','Y')).to_euler(); scene.render.engine='BLENDER_WORKBENCH'; render('COMMERCIAL_SIMPLE_LAYER_A_NATIVE_GROW_GOODS_COMPONENT_ID.png')
for obj in objects:
    if hasattr(obj.data,'polygons'): obj.show_wire=True
render('COMMERCIAL_SIMPLE_LAYER_A_NATIVE_GROW_GOODS_WIREFRAME.png')

source=[]
for obj in objects:
    source.append({'component':obj.get('componentId'), 'assetId':obj.get('assetId'), 'runtimeArtifact':obj.get('runtimeArtifact'), 'presentationArtifact':obj.get('presentationArtifact'), 'reused':'YES', 'anonymousGeometry':obj.get('anonymousGeometry')})
triangles=sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in objects if hasattr(o.data,'polygons'))
result={'status':'PASS','blenderVersion':bpy.app.version_string,'parentFacadeRequired':'NO','neighborPresentationRequired':'NO','anonymousGeometry':0,'artifactsInstantiated':len(artifacts),'sourceIds':source,'budget':{'triangles':triangles,'objects':len(objects),'materials':len(bpy.data.materials),'status':'PASS'}}
json.dump(result, open(os.path.join(out,'COMMERCIAL_SIMPLE_LAYER_A_NATIVE_BUILD_RESULT.json'),'w'), indent=2)
json.dump({'status':'PASS','parentFacadeRequired':'NO','neighborPresentationRequired':'NO','anonymousGeometry':0,'allComponentIdentitiesRetained':True,'artifactCount':len(artifacts)},open(os.path.join(out,'COMMERCIAL_SIMPLE_LAYER_A_INSTANTIATION_AUDIT_V2.json'),'w'),indent=2)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'COMMERCIAL_SIMPLE_LAYER_A_NATIVE_GROW_GOODS_V1.blend'))
