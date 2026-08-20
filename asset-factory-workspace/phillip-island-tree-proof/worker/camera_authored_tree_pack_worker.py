"""Steam Deck proof pack: three camera-authored GrowGo tree candidates.
Review candidates only. This file never registers assets with Atlas or populates a map.
"""
import bpy, os, sys, json, math, hashlib
from mathutils import Vector
ROOT, ATLAS = sys.argv[-2:]
OUT = os.path.join(ROOT, 'output'); os.makedirs(OUT, exist_ok=True)
# Camera-facing crop regions deliberately stop before the source branchlet tips.
# The V6 atlas pixels are unchanged; this uses its leaf masses without repeating twig spikes.
UV=[(0,.5,.185,1),(.25,.5,.435,1),(.5,.5,.685,1),(.75,.5,.935,1),(0,0,.185,.5),(.25,0,.435,.5),(.5,0,.685,.5),(.75,0,.935,.5)]
FAMILIES=[
 {'id':'TREE_EUCALYPTUS_COASTAL_002','label':'Second eucalyptus morphology','height':11.5,'trunk':[((0,0,0),(-.28,.04,3.0),.22),((-.28,.04,2.7),(-1.95,.12,5.7),.13),((-.25,.03,3.1),(1.22,-.08,6.3),.12),((1.05,-.07,5.6),(2.4,.07,7.35),.07)],'masses':[(-2.15,5.6,2.35,2.15),(-.78,6.75,2.5,2.45),(.85,6.55,2.45,2.3),(2.2,5.45,2.15,1.95),(2.75,4.2,1.75,1.6),(-1.0,4.5,2.05,1.85)],'scale':[.91,1.08],'rotation':[-12,12]},
 {'id':'TREE_NATIVE_ROUNDED_001','label':'Dense rounded native tree','height':8.6,'trunk':[((0,0,0),(0,.02,2.55),.3),((0,.02,2.25),(-1.05,.10,4.15),.16),((0,.02,2.35),(1.05,-.08,4.0),.16)],'masses':[(-2.2,4.25,2.5,2.3),(-1.2,5.55,2.65,2.55),(0,6.0,2.75,2.6),(1.25,5.55,2.65,2.55),(2.25,4.35,2.45,2.25),(0,4.1,3.1,2.25),(-.25,3.35,2.55,1.85)],'scale':[.88,1.12],'rotation':[-15,15]},
 {'id':'TREE_COASTAL_WIND_001','label':'Coastal wind-shaped tree','height':6.8,'trunk':[((0,0,0),(.42,.02,2.35),.24),((.40,.02,2.1),(1.55,.10,3.45),.13),((1.45,.10,3.4),(2.65,.12,4.35),.085),((.35,.02,2.05),(-.65,-.06,3.18),.11)],'masses':[(-.95,3.5,1.85,1.5),(.15,4.2,2.5,1.75),(1.6,4.2,2.75,1.85),(3.0,3.95,2.3,1.55),(4.05,3.45,1.7,1.25),(1.05,3.15,2.45,1.5)],'scale':[.86,1.10],'rotation':[-10,10]}
]
def clear(): bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def engine(scene):
 for candidate in ('BLENDER_EEVEE','BLENDER_EEVEE_NEXT'):
  try: scene.render.engine=candidate; return candidate
  except TypeError: pass
 raise RuntimeError('GROWGO_SUPPORTED_EEVEE_NOT_AVAILABLE')
def mat(name,color):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=color;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=color;p.inputs['Roughness'].default_value=.78;return m
def foliage():
 # One shared alpha atlas and material contract: V3 only lifts the existing
 # authored values enough to retain readable dark/mid/light paper layers in
 # bright gameplay lighting.  It does not alter atlas UV architecture.
 m=bpy.data.materials.new('GG_MAT_FOLIAGE_V3_NO_TWIG_SHARED_ATLAS');m.use_nodes=True;m.diffuse_color=(1,1,1,1)
 try:m.surface_render_method='DITHERED'
 except:pass
 n=m.node_tree.nodes;l=m.node_tree.links
 for x in list(n):n.remove(x)
 out=n.new('ShaderNodeOutputMaterial');p=n.new('ShaderNodeBsdfPrincipled');im=n.new('ShaderNodeTexImage');tone=n.new('ShaderNodeHueSaturation');im.image=bpy.data.images.load(ATLAS,check_existing=True);tone.inputs['Value'].default_value=1.18;p.inputs['Roughness'].default_value=.82;l.new(im.outputs['Color'],tone.inputs['Color']);l.new(tone.outputs['Color'],p.inputs['Base Color']);
 # A modest self-lit paper response prevents rear alpha cards from falling to
 # near black in the locked daylight review, without adding a texture or card.
 if p.inputs.get('Emission Color'):
  l.new(tone.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=.22
 l.new(im.outputs['Alpha'],p.inputs['Alpha']);l.new(p.outputs['BSDF'],out.inputs['Surface']);return m
def branch(a,b,r,m,name):
 a,b=Vector(a),Vector(b);d=b-a;bpy.ops.mesh.primitive_cone_add(vertices=7,radius1=r,radius2=r*.56,depth=d.length,location=(a+b)/2);o=bpy.context.object;o.name=name;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();o.data.materials.append(m);o['ggComponent']='TRUNK'
def card(x,y,z,w,h,uv,m,name,layer,yaw=0):
 u0,v0,u1,v1=uv;mesh=bpy.data.meshes.new(name+'_MESH');mesh.from_pydata([(-w/2,0,-h/2),(w/2,0,-h/2),(w/2,0,h/2),(-w/2,0,h/2)],[],[(0,1,2,3)]);mesh.uv_layers.new(name='UVMap')
 for loop,co in zip(mesh.uv_layers[0].data,[(u0,v0),(u1,v0),(u1,v1),(u0,v1)]):loop.uv=co
 o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.location=(x,y,z);o.rotation_euler=(0,0,math.radians(yaw));o.data.materials.append(m);o['ggComponent']='CANOPY';o['layer']=layer
def setup_camera(h):
 s=bpy.context.scene;s.render.resolution_x=720;s.render.resolution_y=720;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.world.color=(.045,.055,.04)
 bpy.ops.object.camera_add(location=(max(3,h*.55),-max(6,h*1.15),max(10,h*2.2)));c=bpy.context.object;c.name='GROWGO_GAMEPLAY_CAMERA_REVIEW';c.data.type='PERSP';c.data.angle=math.radians(32);c.rotation_euler=(Vector((0,0,h*.42))-c.location).to_track_quat('-Z','Y').to_euler();s.camera=c
 for loc,energy,size in [((-8,-10,16),1150,8),((8,2,10),420,6)]:bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=energy;o.data.shape='DISK';o.data.size=size
def render(path,h): setup_camera(h);bpy.context.scene.render.filepath=path;bpy.ops.render.render(write_still=True)
def tris(): return sum(max(0,len(p.vertices)-2) for o in bpy.context.scene.objects if o.type=='MESH' for p in o.data.polygons)
def build(f,level):
 clear();e=engine(bpy.context.scene);bark=mat('GG_MAT_TREE_BARK_SHARED',(.34,.22,.12,1));fol=foliage();limit={'CLOSE':3,'GAMEPLAY':2,'MAP':1}[level]
 for i,(a,b,r) in enumerate(f['trunk']):branch(a,b,r,bark,'GG_'+f['id']+'_BRANCH_%02d'%i)
 for i,(x,z,w,h) in enumerate(f['masses']):
  for depth in range(limit):
   for n in range(1 if level=='MAP' else 3):
    spread=n-1; card(x+spread*.19+math.sin(i*2.1+n)*.075,.12-depth*.15,z+spread*.15+math.cos(i*1.7+n)*.075,w*(1.28-depth*.075+(n%2)*.045),h*(1.21-depth*.06+(n==1)*.05),UV[(i*3+depth*2+n)%len(UV)],fol,'GG_'+f['id']+'_'+['REAR','MID','FRONT'][depth]+'_%02d_%02d'%(i,n),['REAR','MID','FRONT'][depth],(i%3-1)*8+(depth-1)*7+spread*6)
 return e
def export(f):
 base=os.path.join(OUT,f['id']+'@1.0.0');os.makedirs(base,exist_ok=True);stats={}
 for level in ('CLOSE','GAMEPLAY','MAP'):
  e=build(f,level);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(base,f['id']+'_'+level+'.blend'));glb=os.path.join(base,f['id']+'_LOD_'+level+'.glb');bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=glb,export_format='GLB',export_materials='EXPORT',export_image_format='AUTO');stats[level]={'triangles':tris(),'cards':len([o for o in bpy.context.scene.objects if o.get('ggComponent')=='CANOPY']),'materials':2,'textures':1,'glbBytes':os.path.getsize(glb)}
 build(f,'CLOSE');render(os.path.join(base,'GROWGO_GAMEPLAY_CAMERA_REVIEW.png'),f['height']);render(os.path.join(base,'GROWGO_GAMEPLAY_CAMERA_TOLERANCE_NEAR.png'),f['height']*.93);render(os.path.join(base,'GROWGO_GAMEPLAY_CAMERA_TOLERANCE_FAR.png'),f['height']*1.07)
 meta={'assetId':f['id'],'version':'1.0.0','state':'REVIEW_CANDIDATE','worker':'Steam Deck','blender':bpy.app.version_string,'cameraContract':'GROWGO_VEGETATION_GAMEPLAY_CAMERA_CONTRACT@1.0.0','cameraReview':'GROWGO_GAMEPLAY_CAMERA_REVIEW','lods':stats,'allowHorizontalMirror':True,'deterministicVariation':{'uniformScale':f['scale'],'worldRotationDegrees':f['rotation'],'paletteVariants':['BASE','COOL','WARM','LIGHT'],'canopySubstitution':'V6_SHARED_CLUSTER_ATLAS_SEED_SELECTED'},'atlas':os.path.basename(ATLAS),'atlasSha256':hashlib.sha256(open(ATLAS,'rb').read()).hexdigest(),'atlasArchitectureModified':False};json.dump(meta,open(os.path.join(base,'BUILD_METADATA.json'),'w'),indent=2);return meta
allmeta=[export(f) for f in FAMILIES]

def make_context():
 clear(); engine(bpy.context.scene); ground=mat('GG_DEV_GROUND',(.28,.44,.19,1)); road=mat('GG_DEV_ROAD',(.22,.22,.19,1)); wall=mat('GG_DEV_SHOP_SHELL',(.52,.31,.16,1)); roof=mat('GG_DEV_SHOP_ROOF',(.10,.15,.23,1))
 bpy.ops.mesh.primitive_plane_add(size=90,location=(0,0,0));bpy.context.object.data.materials.append(ground)
 bpy.ops.mesh.primitive_cube_add(location=(0,4,.04),scale=(18,2,.05));bpy.context.object.data.materials.append(road)
 for x,y in [(-8,9),(7,9)]:
  bpy.ops.mesh.primitive_cube_add(location=(x,y,1.5),scale=(2.3,.8,1.5));bpy.context.object.data.materials.append(wall)
  bpy.ops.mesh.primitive_cube_add(location=(x,y,3.2),scale=(2.6,1, .25));bpy.context.object.data.materials.append(roof)

def import_tree(asset, loc, scale=1, mirror=False, yaw=0):
 p=os.path.join(OUT,asset+'@1.0.0',asset+'_LOD_GAMEPLAY.glb'); before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=p);new=[o for o in bpy.context.scene.objects if o not in before];root=bpy.data.objects.new('GG_REVIEW_'+asset,None);bpy.context.collection.objects.link(root);root.location=loc;root.rotation_euler[2]=math.radians(yaw);root.scale=((-scale if mirror else scale),scale,scale)
 for o in new:o.parent=root

def import_existing_eucalyptus(loc, scale=1, mirror=False, yaw=0):
 p=os.path.join(ROOT,'TREE_EUCALYPTUS_001_EXISTING_LOD_GAMEPLAY.glb')
 if not os.path.exists(p): raise RuntimeError('GROWGO_EXISTING_EUCALYPTUS_REVIEW_GLB_MISSING')
 before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=p);new=[o for o in bpy.context.scene.objects if o not in before];root=bpy.data.objects.new('GG_REVIEW_TREE_EUCALYPTUS_001_EXISTING',None);bpy.context.collection.objects.link(root);root.location=loc;root.rotation_euler[2]=math.radians(yaw);root.scale=((-scale if mirror else scale),scale,scale)
 for o in new:o.parent=root

def scene_camera(name,mobile=False,neutral=False):
 s=bpy.context.scene;s.render.resolution_x=720 if mobile else 1280;s.render.resolution_y=1280 if mobile else 720;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.world.color=((.10,.10,.10) if neutral else (.42,.55,.62))
 bpy.ops.object.camera_add(location=(18,-31,27));c=bpy.context.object;c.name='GROWGO_GAMEPLAY_CAMERA_REVIEW';c.data.type='PERSP';c.data.angle=math.radians(32);c.rotation_euler=(Vector((0,3,3))-c.location).to_track_quat('-Z','Y').to_euler();s.camera=c
 bpy.ops.object.light_add(type='SUN',location=(0,0,20));bpy.context.object.data.energy=3.4;bpy.context.object.rotation_euler=(math.radians(25),math.radians(-18),math.radians(-24));bpy.ops.object.light_add(type='AREA',location=(-12,-12,16));bpy.context.object.data.energy=1300;bpy.context.object.data.size=10
 s.render.filepath=os.path.join(OUT,name);bpy.ops.render.render(write_still=True)

make_context()
for asset,loc,scale,mirror,yaw in [('TREE_EUCALYPTUS_COASTAL_002',(-8,1,0),1.0,False,-8),('TREE_NATIVE_ROUNDED_001',(-1,2,0),1.03,True,5),('TREE_COASTAL_WIND_001',(7,1,0),1.08,False,8)]:import_tree(asset,loc,scale,mirror,yaw)
import_existing_eucalyptus((10,12,0),.78,True,-10)
scene_camera('GROWGO_TREE_PACK_V3_IN_GAME_SCALE_REVIEW.png');scene_camera('GROWGO_TREE_PACK_V3_MOBILE_SCALE_REVIEW.png',True);scene_camera('GROWGO_TREE_PACK_V3_NEUTRAL_TECHNICAL_REVIEW.png',neutral=True)

make_context(); placements=[('TREE_EUCALYPTUS_COASTAL_002',(-10,-3,0),.92,False,-8),('TREE_NATIVE_ROUNDED_001',(-5,-1,0),1.04,True,5),('TREE_COASTAL_WIND_001',(0,-2,0),1.03,False,9),('TREE_EUCALYPTUS_COASTAL_002',(6,-1,0),1.08,True,-6),('TREE_NATIVE_ROUNDED_001',(11,-3,0),.89,False,12),('TREE_COASTAL_WIND_001',(-10,7,0),.96,True,-8),('TREE_NATIVE_ROUNDED_001',(-4,8,0),1.10,False,4),('TREE_EUCALYPTUS_COASTAL_002',(3,8,0),.95,False,-11),('TREE_COASTAL_WIND_001',(10,8,0),1.07,True,7)]
for a,l,s,m,y in placements:import_tree(a,l,s,m,y)
scene_camera('GROWGO_TREE_PACK_V3_MASS_PLACEMENT_REVIEW.png')
json.dump({'status':'PASS','worker':'Steam Deck','blender':bpy.app.version_string,'assets':allmeta,'reviewRenders':['GROWGO_TREE_PACK_V3_IN_GAME_SCALE_REVIEW.png','GROWGO_TREE_PACK_V3_MOBILE_SCALE_REVIEW.png','GROWGO_TREE_PACK_V3_NEUTRAL_TECHNICAL_REVIEW.png','GROWGO_TREE_PACK_V3_MASS_PLACEMENT_REVIEW.png'],'existingEucalyptusIncluded':'TREE_EUCALYPTUS_001_EXISTING_LOD_GAMEPLAY.glb','atlasArchitectureModified':False,'productionPopulationModified':False},open(os.path.join(OUT,'TREE_PACK_RECEIPT.json'),'w'),indent=2);print('GROWGO_CAMERA_AUTHORED_TREE_PACK_V3_COMPLETE')
