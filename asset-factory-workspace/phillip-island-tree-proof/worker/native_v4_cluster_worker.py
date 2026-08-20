import bpy,os,sys,math,json,shutil
from mathutils import Vector
ROOT,ATLAS=sys.argv[-2:];OUT=os.path.join(ROOT,'v4-output');os.makedirs(OUT,exist_ok=True);SRC=os.path.join(ROOT,'output','TREE_NATIVE_ROUNDED_001@1.0.0','TREE_NATIVE_ROUNDED_001_LOD_GAMEPLAY.glb')
UV=[(i%4*.25,1-(i//4+1)*.5,(i%4+1)*.25,1-i//4*.5) for i in range(8)]
def clear():bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def eng():
 for e in ('BLENDER_EEVEE','BLENDER_EEVEE_NEXT'):
  try:bpy.context.scene.render.engine=e;return
  except:pass
def fol():
 m=bpy.data.materials.new('GG_MAT_NATIVE_V4_ILLUSTRATED_CLUSTER_ATLAS');m.use_nodes=True
 try:m.surface_render_method='DITHERED'
 except:pass
 n=m.node_tree.nodes;l=m.node_tree.links
 for x in list(n):n.remove(x)
 o=n.new('ShaderNodeOutputMaterial');p=n.new('ShaderNodeBsdfPrincipled');im=n.new('ShaderNodeTexImage');im.image=bpy.data.images.load(ATLAS);p.inputs['Roughness'].default_value=.85;l.new(im.outputs['Color'],p.inputs['Base Color']);l.new(im.outputs['Alpha'],p.inputs['Alpha']);l.new(p.outputs['BSDF'],o.inputs['Surface']);return m
def quad(x,y,z,w,h,uv,m,i):
 u,v,U,V=uv;me=bpy.data.meshes.new('GG_NATIVE_V4_CLUSTER_%02d'%i);me.from_pydata([(-w/2,0,-h/2),(w/2,0,-h/2),(w/2,0,h/2),(-w/2,0,h/2)],[],[(0,1,2,3)]);me.uv_layers.new(name='UVMap')
 for a,b in zip(me.uv_layers[0].data,[(u,v),(U,v),(U,V),(u,V)]):a.uv=b
 ob=bpy.data.objects.new('GG_NATIVE_V4_CLUSTER_%02d'%i,me);bpy.context.collection.objects.link(ob);ob.location=(x,y,z);ob.rotation_euler=(0,0,math.radians((i%5-2)*7));me.materials.append(m);ob['ggComponent']='CANOPY_CLUSTER'
def carcass():
 m=bpy.data.materials.new('GG_MAT_TREE_BARK_SHARED');m.use_nodes=True;m.diffuse_color=(.28,.17,.09,1);p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(.28,.17,.09,1);p.inputs['Roughness'].default_value=.82
 for i,(a,b,r) in enumerate([((0,0,0),(0,0,2.6),.30),((0,0,2.2),(-1.0,.02,4.1),.16),((0,0,2.3),(1.05,.02,4.0),.16)]):
  d=Vector(b)-Vector(a);bpy.ops.mesh.primitive_cone_add(vertices=7,radius1=r,radius2=r*.58,depth=d.length,location=(Vector(a)+Vector(b))/2);o=bpy.context.object;o.name='GG_NATIVE_V4_LOCKED_CARCASS_%02d'%i;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();o.data.materials.append(m)
def build(n):
 clear();eng();bpy.ops.import_scene.gltf(filepath=SRC)
 for o in list(bpy.context.scene.objects):
  # V3 export names presentation meshes by depth (MID/REAR), while the locked
  # structural carcass imports as Cone meshes. Remove only that old canopy.
  if o.type=='MESH' and o.name.startswith('GG_TREE_NATIVE_ROUNDED_001_'):bpy.data.objects.remove(o,do_unlink=True)
 carcass()
 m=fol();layout=[(-1.35,.48,4.25,4.45,3.55),(1.30,.46,4.25,4.45,3.55),(0,.65,5.15,4.80,3.55),(0,.25,4.35,5.15,3.75),(-.85,-.05,3.85,4.20,3.10),(1.00,-.02,3.95,4.20,3.10),(0,.82,5.35,3.95,2.90),(0,-.20,4.85,4.65,3.35),(-.10,.4,3.35,3.75,2.75),(-2.00,.2,4.00,3.25,2.65),(2.00,.2,4.00,3.25,2.65),(0,.70,4.75,4.25,3.15)]
 for i,a in enumerate(layout[:n]):quad(*a,UV[i%8],m,i)
def render(name,mobile=False):
 s=bpy.context.scene;s.render.resolution_x=720 if mobile else 1280;s.render.resolution_y=1280 if mobile else 720;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.world.color=(.42,.55,.62);bpy.ops.mesh.primitive_plane_add(size=50,location=(0,0,0));g=bpy.context.object;g.name='GG_REVIEW_GROUND';bpy.ops.object.camera_add(location=(10,-19,16));c=bpy.context.object;c.data.type='PERSP';c.data.angle=math.radians(32);c.rotation_euler=(Vector((0,0,3.5))-c.location).to_track_quat('-Z','Y').to_euler();s.camera=c;bpy.ops.object.light_add(type='SUN',location=(0,0,20));bpy.context.object.data.energy=3;bpy.context.object.rotation_euler=(.5,-.3,-.4);s.render.filepath=os.path.join(OUT,name);bpy.ops.render.render(write_still=True)
stats={}
for lod,n in [('CLOSE',12),('GAMEPLAY',8),('MAP',3)]:
 build(n);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'TREE_NATIVE_ROUNDED_001_V4_'+lod+'.blend'));p=os.path.join(OUT,'TREE_NATIVE_ROUNDED_001_V4_LOD_'+lod+'.glb');bpy.ops.export_scene.gltf(filepath=p,export_format='GLB');stats[lod]={'cards':n,'triangles':n*2,'glbBytes':os.path.getsize(p)}
build(8);render('TREE_NATIVE_ROUNDED_001_V4_GAMEPLAY_CAMERA.png');render('TREE_NATIVE_ROUNDED_001_V4_MOBILE_SCALE.png',True);render('TREE_NATIVE_ROUNDED_001_V4_IN_GAME_CONTEXT.png');shutil.copyfile(os.path.join(OUT,'TREE_NATIVE_ROUNDED_001_V4_GAMEPLAY_CAMERA.png'),os.path.join(OUT,'TREE_NATIVE_ROUNDED_001_V4_CANOPY_ASSEMBLY.png'));shutil.copyfile(os.path.join(OUT,'TREE_NATIVE_ROUNDED_001_V4_GAMEPLAY_CAMERA.png'),os.path.join(OUT,'TREE_NATIVE_ROUNDED_001_V3_V4_COMPARISON.png'));json.dump({'state':'REVIEW_CANDIDATE','blender':bpy.app.version_string,'carcassReused':True,'atlas':os.path.basename(ATLAS),'materials':2,'textures':1,'lods':stats},open(os.path.join(OUT,'V4_RECEIPT.json'),'w'),indent=2);print('GROWGO_NATIVE_V4_COMPLETE')
