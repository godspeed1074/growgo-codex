import bpy, os, sys, json
from mathutils import Vector
ROOT, TEXTURE = sys.argv[-2:]
OUT = os.path.join(ROOT, 'rich-v4-output'); os.makedirs(OUT, exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for engine in ('BLENDER_EEVEE','BLENDER_EEVEE_NEXT'):
 try: bpy.context.scene.render.engine=engine; break
 except: pass
mat=bpy.data.materials.new('GG_MAT_NATIVE_RICH_FOLIAGE_APPROVED');mat.use_nodes=True
try: mat.surface_render_method='DITHERED';mat.use_backface_culling=False
except: pass
nodes=mat.node_tree.nodes;links=mat.node_tree.links
for node in list(nodes):nodes.remove(node)
out=nodes.new('ShaderNodeOutputMaterial');shader=nodes.new('ShaderNodeBsdfPrincipled');image=nodes.new('ShaderNodeTexImage');image.image=bpy.data.images.load(TEXTURE);shader.inputs['Roughness'].default_value=.85
links.new(image.outputs['Color'],shader.inputs['Base Color']);links.new(image.outputs['Alpha'],shader.inputs['Alpha']);links.new(shader.outputs['BSDF'],out.inputs['Surface'])
mesh=bpy.data.meshes.new('GG_NATIVE_RICH_APPROVED_CARD_MESH');mesh.from_pydata([(-3,0,-3),(3,0,-3),(3,0,3),(-3,0,3)],[],[(0,1,2,3)]);mesh.uv_layers.new(name='UVMap')
card=bpy.data.objects.new('GG_NATIVE_RICH_APPROVED_CARD',mesh);bpy.context.collection.objects.link(card);card.location=(0,0,3);mesh.materials.append(mat)
for loop,uv in zip(mesh.uv_layers.active.data,[(0,0),(1,0),(1,1),(0,1)]):loop.uv=uv
bpy.ops.object.camera_add(location=(0,-9,3));camera=bpy.context.object;camera.name='GROWGO_GAMEPLAY_CAMERA_REVIEW';camera.data.type='ORTHO';camera.data.ortho_scale=7;camera.rotation_euler=(Vector((0,0,3))-camera.location).to_track_quat('-Z','Y').to_euler();bpy.context.scene.camera=camera
bpy.ops.object.light_add(type='AREA',location=(0,-4,7));bpy.context.object.data.energy=800;bpy.context.object.data.size=6
scene=bpy.context.scene;scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.world.color=(.12,.12,.12);scene.render.filepath=os.path.join(OUT,'GROWGO_RICH_FOLIAGE_APPROVED_SINGLE_CARD.png');bpy.ops.render.render(write_still=True)
glb=os.path.join(OUT,'GROWGO_RICH_FOLIAGE_APPROVED_SINGLE_CARD.glb');bpy.ops.export_scene.gltf(filepath=glb,export_format='GLB',export_materials='EXPORT')
json.dump({'state':'REVIEW_CANDIDATE','approvedSource':os.path.basename(TEXTURE),'fullCardUV':[0,0,1,1],'materialCount':1,'textureCount':1,'doubleSided':True,'glb':os.path.basename(glb),'blender':bpy.app.version_string},open(os.path.join(OUT,'RICH_SINGLE_CARD_RECEIPT.json'),'w'),indent=2)
print('GROWGO_RICH_SINGLE_CARD_COMPLETE')
