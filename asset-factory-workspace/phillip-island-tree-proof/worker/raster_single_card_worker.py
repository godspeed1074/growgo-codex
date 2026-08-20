import bpy,os,sys,json
from mathutils import Vector
ROOT,ATLAS=sys.argv[-2:];OUT=os.path.join(ROOT,'single-card-output');os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for e in ('BLENDER_EEVEE','BLENDER_EEVEE_NEXT'):
 try:bpy.context.scene.render.engine=e;break
 except:pass
m=bpy.data.materials.new('GG_MAT_FOLIAGE_RASTER_PROOF');m.use_nodes=True
try:m.surface_render_method='DITHERED';m.use_backface_culling=False
except:pass
n=m.node_tree.nodes;l=m.node_tree.links
for x in list(n):n.remove(x)
o=n.new('ShaderNodeOutputMaterial');p=n.new('ShaderNodeBsdfPrincipled');im=n.new('ShaderNodeTexImage');im.image=bpy.data.images.load(ATLAS);p.inputs['Roughness'].default_value=.85;l.new(im.outputs['Color'],p.inputs['Base Color']);l.new(im.outputs['Alpha'],p.inputs['Alpha']);l.new(p.outputs['BSDF'],o.inputs['Surface'])
verts=[(-3,0,-3),(3,0,-3),(3,0,3),(-3,0,3)];mesh=bpy.data.meshes.new('GG_NATIVE_RASTER_SINGLE_CARD_MESH');mesh.from_pydata(verts,[],[(0,1,2,3)]);mesh.uv_layers.new(name='UVMap');card=bpy.data.objects.new('GG_NATIVE_RASTER_SINGLE_CARD',mesh);bpy.context.collection.objects.link(card);card.location=(0,0,3);card.data.materials.append(m);uv=card.data.uv_layers.active.data
for q,co in zip(uv,[(0,0),(1,0),(1,1),(0,1)]):q.uv=co
bpy.ops.object.camera_add(location=(0,-9,3));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=7;cam.rotation_euler=(Vector((0,0,3))-cam.location).to_track_quat('-Z','Y').to_euler();bpy.context.scene.camera=cam
bpy.ops.object.light_add(type='AREA',location=(0,-4,7));bpy.context.object.data.energy=800;bpy.context.object.data.size=6
s=bpy.context.scene;s.render.resolution_x=900;s.render.resolution_y=900;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.world.color=(.12,.12,.12);s.render.filepath=os.path.join(OUT,'GROWGO_NATIVE_ROUNDED_SINGLE_CARD_BLENDER.png');bpy.ops.render.render(write_still=True)
g=os.path.join(OUT,'GROWGO_NATIVE_ROUNDED_SINGLE_CARD.glb');bpy.ops.export_scene.gltf(filepath=g,export_format='GLB',export_materials='EXPORT');json.dump({'source':os.path.basename(ATLAS),'uvRegion':[.5,.5,.685,1],'materialCount':1,'textureCount':1,'alphaMode':'BLEND_OR_DITHERED','glb':os.path.basename(g),'blender':bpy.app.version_string},open(os.path.join(OUT,'SINGLE_CARD_RECEIPT.json'),'w'),indent=2)
