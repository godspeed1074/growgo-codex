"""Approved rich-raster rebuild for TREE_NATIVE_ROUNDED_001 V4. Review candidate only."""
import bpy, os, sys, math, json
from mathutils import Vector
ROOT, ATLAS, EUCALYPTUS = sys.argv[-3:]
OUT=os.path.join(ROOT,'rich-v4-output');os.makedirs(OUT,exist_ok=True)
W,H=1254,1254
# V2 reviewed alpha-component bounds, converted from top-left pixels to Blender UVs.
BOXES=[(17,13,428,518),(478,18,833,563),(863,18,1232,610),(730,561,993,800),(26,793,676,1228),(696,799,896,1235),(917,775,1237,1218),(48,489,652,819)]
UV=[(x0/W,1-(y1+1)/H,(x1+1)/W,1-y0/H) for x0,y0,x1,y1 in BOXES]
# Blender is Z-up whereas the locked runtime camera contract is Y-up.
TREE_Y=0.0; HEIGHT=8.6
RUNTIME_REVIEW_SCALE=48.0/HEIGHT
def clear(): bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def engine():
 for e in ('BLENDER_EEVEE','BLENDER_EEVEE_NEXT'):
  try:bpy.context.scene.render.engine=e;return
  except:pass
 raise RuntimeError('GROWGO_SUPPORTED_EEVEE_NOT_AVAILABLE')
def solid(name,col):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=col;p.inputs['Roughness'].default_value=.8;return m
def foliage():
 m=bpy.data.materials.new('GG_MAT_NATIVE_RICH_FOLIAGE_V2_APPROVED');m.use_nodes=True
 try:m.surface_render_method='DITHERED';m.use_backface_culling=False
 except:pass
 n=m.node_tree.nodes;l=m.node_tree.links
 for x in list(n):n.remove(x)
 out=n.new('ShaderNodeOutputMaterial');p=n.new('ShaderNodeBsdfPrincipled');im=n.new('ShaderNodeTexImage');im.image=bpy.data.images.load(ATLAS,check_existing=True);im.interpolation='Linear';p.inputs['Roughness'].default_value=.85
 l.new(im.outputs['Color'],p.inputs['Base Color']);
 if p.inputs.get('Emission Color'):
  l.new(im.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=.18
 l.new(im.outputs['Alpha'],p.inputs['Alpha']);l.new(p.outputs['BSDF'],out.inputs['Surface']);return m
def branch(a,b,r,m,n):
 a,b=Vector(a),Vector(b);d=b-a;bpy.ops.mesh.primitive_cone_add(vertices=7,radius1=r,radius2=r*.56,depth=d.length,location=(a+b)/2);o=bpy.context.object;o.name=n;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();o.data.materials.append(m);o['ggComponent']='TRUNK'
def card(x,depth,z,w,h,uv,m,index,yaw):
 u0,v0,u1,v1=uv;mesh=bpy.data.meshes.new('GG_NATIVE_RICH_CARD_%02d_MESH'%index);mesh.from_pydata([(-w/2,0,-h/2),(w/2,0,-h/2),(w/2,0,h/2),(-w/2,0,h/2)],[],[(0,1,2,3)]);mesh.uv_layers.new(name='UVMap')
 for loop,co in zip(mesh.uv_layers[0].data,[(u0,v0),(u1,v0),(u1,v1),(u0,v1)]):loop.uv=co
 o=bpy.data.objects.new('GG_NATIVE_RICH_CARD_%02d'%index,mesh);bpy.context.collection.objects.link(o);o.location=(x,TREE_Y+depth,z);o.rotation_euler=(0,0,math.radians(yaw+26.565));mesh.materials.append(m);o['ggComponent']='CANOPY_CARD';o['approvedSource']='EUCALYPTUS_FOLIAGE_CLUSTER_ATLAS_V2_CLEAN.png'
def carcass(bark):
 for i,(a,b,r) in enumerate([((0,TREE_Y,0),(0,TREE_Y,2.55),.30),((0,TREE_Y,2.20),(-1.05,TREE_Y+.10,4.15),.16),((0,TREE_Y,2.35),(1.05,TREE_Y-.08,4.0),.16)]):branch(a,b,r,bark,'GG_NATIVE_V4_LOCKED_CARCASS_%02d'%i)
def build(level):
 clear();engine();bark=solid('GG_MAT_TREE_BARK_SHARED',(.28,.17,.09,1));fol=foliage();carcass(bark)
 layout=[(0,.34,5.35,4.5,5.2,2,0),(-1.45,.05,4.45,4.45,4.7,0,-10),(1.45,.10,4.45,4.35,4.75,1,11),(0,-.20,3.8,5.0,4.35,4,0),(-1.9,.25,3.95,3.4,3.5,3,-14),(1.9,.22,3.95,3.35,3.5,5,14),(0,.52,4.35,4.65,4.0,6,3),(-.72,-.12,3.2,3.55,3.2,7,-7),( .78,-.15,3.25,3.5,3.25,1,7),(-.9,.46,5.15,3.1,3.6,0,-10),( .95,.45,5.1,3.1,3.6,2,10),(0,-.35,2.95,3.8,2.9,4,0)]
 count={'CLOSE':12,'GAMEPLAY':8,'MAP':3}[level]
 for i,item in enumerate(layout[:count]):card(*item[:5],UV[item[5]],fol,i,item[6])
 # Match the live renderer's minimum 48-unit scaled-height review state. Runtime
 # normalizes model bounds to its target-height profile after GLB load.
 for o in bpy.context.scene.objects:
  if o.type=='MESH': o.location*=RUNTIME_REVIEW_SCALE;o.scale*=RUNTIME_REVIEW_SCALE
 return count
def tri_count():return sum(len(p.vertices)-2 for o in bpy.context.scene.objects if o.type=='MESH' for p in o.data.polygons)
def setup_camera(mobile=False):
 s=bpy.context.scene;s.render.resolution_x=720 if mobile else 1280;s.render.resolution_y=1280 if mobile else 720;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.world.color=(.42,.55,.62)
 bpy.ops.object.camera_add(location=(36,-72,120));c=bpy.context.object;c.name='GROWGO_GAMEPLAY_CAMERA_REVIEW';c.data.type='PERSP';c.data.angle=math.radians(32);c.rotation_euler=(Vector((0,0,max(18,HEIGHT*.42)))-c.location).to_track_quat('-Z','Y').to_euler();s.camera=c
 bpy.ops.object.light_add(type='SUN',location=(0,0,40));bpy.context.object.data.energy=3.0;bpy.context.object.rotation_euler=(.55,-.35,-.45);bpy.ops.object.light_add(type='AREA',location=(-12,5,24));bpy.context.object.data.energy=1200;bpy.context.object.data.size=12
def ground_context():
 grass=solid('GG_CTX_GRASS',(.23,.42,.16,1));road=solid('GG_CTX_ROAD',(.19,.20,.18,1));path=solid('GG_CTX_PATH',(.62,.53,.39,1));wall=solid('GG_CTX_SHOP_WALL',(.48,.30,.16,1));roof=solid('GG_CTX_SHOP_ROOF',(.08,.12,.19,1))
 bpy.ops.mesh.primitive_plane_add(size=160,location=(0,TREE_Y,0));bpy.context.object.data.materials.append(grass)
 bpy.ops.mesh.primitive_cube_add(location=(0,TREE_Y+13*RUNTIME_REVIEW_SCALE,.06),scale=(28*RUNTIME_REVIEW_SCALE,2*RUNTIME_REVIEW_SCALE,.06));bpy.context.object.data.materials.append(road)
 bpy.ops.mesh.primitive_cube_add(location=(-4*RUNTIME_REVIEW_SCALE,TREE_Y+5*RUNTIME_REVIEW_SCALE,.08),scale=(10*RUNTIME_REVIEW_SCALE,1.2*RUNTIME_REVIEW_SCALE,.08));bpy.context.object.data.materials.append(path)
 bpy.ops.mesh.primitive_cube_add(location=(12*RUNTIME_REVIEW_SCALE,TREE_Y+8*RUNTIME_REVIEW_SCALE,2.1*RUNTIME_REVIEW_SCALE),scale=(4.2*RUNTIME_REVIEW_SCALE,1.8*RUNTIME_REVIEW_SCALE,2.1*RUNTIME_REVIEW_SCALE));bpy.context.object.data.materials.append(wall);bpy.ops.mesh.primitive_cube_add(location=(12*RUNTIME_REVIEW_SCALE,TREE_Y+8*RUNTIME_REVIEW_SCALE,4.45*RUNTIME_REVIEW_SCALE),scale=(4.6*RUNTIME_REVIEW_SCALE,2.1*RUNTIME_REVIEW_SCALE,.25*RUNTIME_REVIEW_SCALE));bpy.context.object.data.materials.append(roof)
 # Existing approved eucalyptus is context-only and does not modify it.
 if os.path.exists(EUCALYPTUS):
  before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=EUCALYPTUS);new=[o for o in bpy.context.scene.objects if o not in before]
  for o in new:o.location.x-=12;o.location.y+=7;o.scale=(.70,.70,.70)
def render(name,mobile=False,context=False):
 if context:ground_context()
 setup_camera(mobile);bpy.context.scene.render.filepath=os.path.join(OUT,name);bpy.ops.render.render(write_still=True)
def export_lods():
 stats={}
 for level in ('CLOSE','GAMEPLAY','MAP'):
  cards=build(level);blend=os.path.join(OUT,'TREE_NATIVE_ROUNDED_001_V4_RICH_'+level+'.blend');bpy.ops.wm.save_as_mainfile(filepath=blend);glb=os.path.join(OUT,'TREE_NATIVE_ROUNDED_001_V4_RICH_LOD_'+level+'.glb');bpy.ops.export_scene.gltf(filepath=glb,export_format='GLB',export_materials='EXPORT');stats[level]={'cards':cards,'triangles':tri_count(),'materials':2,'textures':1,'glbBytes':os.path.getsize(glb)}
 return stats
stats=export_lods();build('GAMEPLAY');render('TREE_NATIVE_ROUNDED_001_V4_RICH_GAMEPLAY_CAMERA.png');build('GAMEPLAY');render('TREE_NATIVE_ROUNDED_001_V4_RICH_MOBILE_SCALE.png',mobile=True);build('GAMEPLAY');render('TREE_NATIVE_ROUNDED_001_V4_RICH_IN_GAME_CONTEXT.png',context=True)
# Six deterministic instances, copied from one base mesh/material set.
build('MAP');original=[o for o in bpy.context.scene.objects if o.type=='MESH'];variants=[(-12,8,.88,False,'BASE'),(-7,8,1.00,True,'BASE'),(-2,8,1.08,False,'COOL'),(3,8,.94,False,'WARM'),(8,8,1.11,True,'LIGHT'),(13,8,.98,False,'BASE')]
for v,(x,y,scale,mirror,palette) in enumerate(variants):
 for o in original:
  copy=o.copy();copy.data=o.data.copy();bpy.context.collection.objects.link(copy);copy.location.x+=x*RUNTIME_REVIEW_SCALE;copy.location.y+=y*RUNTIME_REVIEW_SCALE;copy.scale=((-scale if mirror else scale),scale,scale);copy['variation']=palette
for o in original:bpy.data.objects.remove(o,do_unlink=True)
setup_camera();bpy.context.scene.render.filepath=os.path.join(OUT,'TREE_NATIVE_ROUNDED_001_V4_RICH_VARIATION_PROOF.png');bpy.ops.render.render(write_still=True)
receipt={'assetId':'TREE_NATIVE_ROUNDED_001','version':'4.0.0-rich-raster','state':'REVIEW_CANDIDATE','worker':'Steam Deck','blender':bpy.app.version_string,'cameraContract':'GROWGO_VEGETATION_GAMEPLAY_CAMERA_CONTRACT@1.0.0','approvedSource':'EUCALYPTUS_FOLIAGE_CLUSTER_ATLAS_V2_CLEAN.png','rejectedSources':['GROWGO_FOLIAGE_CLUSTER_ATLAS_V3_NO_TWIG.png','V5 simple authored oval foliage','V6 simple authored foliage','procedural V4 foliage'],'proceduralPolygonFoliageCloseGameplay':False,'carcassReused':True,'lods':stats,'atlasArchitectureModified':False,'productionPopulationModified':False}
json.dump(receipt,open(os.path.join(OUT,'TREE_NATIVE_ROUNDED_001_V4_RICH_RECEIPT.json'),'w'),indent=2);print('GROWGO_NATIVE_V4_RICH_RASTER_COMPLETE')
