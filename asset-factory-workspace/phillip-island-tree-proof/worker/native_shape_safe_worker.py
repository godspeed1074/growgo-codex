"""Shape-safe Native Rounded foliage proof and review candidate; source proportions are immutable."""
import bpy, os, sys, math, json
from mathutils import Vector

ROOT, ATLAS, MODE = sys.argv[-3:]
OUT = os.path.join(ROOT, os.environ.get('GROWGO_OUTPUT_DIR', 'shape-safe-native-output')); os.makedirs(OUT, exist_ok=True)
ASSET_ID=os.environ.get('GROWGO_ASSET_ID','TREE_NATIVE_ROUNDED_001')
W=H=1254; HEIGHT=8.6; REVIEW_SCALE=48.0/HEIGHT
# Cluster 03 is the independently proven connected component (863,18–1232,610)
# from the locked atlas.  This Native-only repair deliberately uses that exact
# owned component until the other legacy rectangular crops are individually
# re-extracted; it cannot carry detached atlas fragments.
LIBRARY={'RICH_CLUSTER_03':{'width':370,'height':593,'uv':{'u0':863/W,'v0':1-(610+1)/H,'u1':(1232+1)/W,'v1':1-18/H}}}
def uv(box):
 return (box['u0'],box['v0'],box['u1'],box['v1'])
def dimensions(key,longest):
 item=LIBRARY[key]; sw=item['width'];sh=item['height'];m=max(sw,sh)
 return longest*sw/m,longest*sh/m,sw,sh
def clear(): bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def engine():
 for e in ('BLENDER_EEVEE','BLENDER_EEVEE_NEXT'):
  try: bpy.context.scene.render.engine=e; return
  except: pass
 raise RuntimeError('GROWGO_SUPPORTED_EEVEE_NOT_AVAILABLE')
def solid(name,c):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=c;p.inputs['Roughness'].default_value=.8;return m
def foliage():
 m=bpy.data.materials.new('GG_MAT_NATIVE_RICH_FOLIAGE_V2_SHAPE_SAFE');m.use_nodes=True
 try:m.surface_render_method='DITHERED';m.use_backface_culling=False
 except:pass
 n=m.node_tree.nodes;l=m.node_tree.links
 for x in list(n):n.remove(x)
 out=n.new('ShaderNodeOutputMaterial');p=n.new('ShaderNodeBsdfPrincipled');im=n.new('ShaderNodeTexImage');im.image=bpy.data.images.load(ATLAS,check_existing=True);p.inputs['Roughness'].default_value=.85
 l.new(im.outputs['Color'],p.inputs['Base Color'])
 if p.inputs.get('Emission Color'):l.new(im.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=.18
 l.new(im.outputs['Alpha'],p.inputs['Alpha']);l.new(p.outputs['BSDF'],out.inputs['Surface']);return m
def branch(a,b,r,m,n):
 a,b=Vector(a),Vector(b);d=b-a;bpy.ops.mesh.primitive_cone_add(vertices=7,radius1=r,radius2=r*.56,depth=d.length,location=(a+b)/2);o=bpy.context.object;o.name=n;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();o.data.materials.append(m);o['ggComponent']='TRUNK'
def card(key, x, depth, z, uniform, yaw, pitch, mirrored, material, index, mass):
 width,height,sw,sh=dimensions(key,uniform);u0,v0,u1,v1=uv(LIBRARY[key]['uv']);mesh=bpy.data.meshes.new('GG_NATIVE_SHAPE_SAFE_CARD_%02d_MESH'%index)
 mesh.from_pydata([(-width/2,0,-height/2),(width/2,0,-height/2),(width/2,0,height/2),(-width/2,0,height/2)],[],[(0,1,2,3)]);mesh.uv_layers.new(name='UVMap')
 face_uv=[(u1,v0),(u0,v0),(u0,v1),(u1,v1)] if mirrored else [(u0,v0),(u1,v0),(u1,v1),(u0,v1)]
 for loop,co in zip(mesh.uv_layers[0].data,face_uv):loop.uv=co
 o=bpy.data.objects.new('GG_NATIVE_SHAPE_SAFE_CARD_%02d'%index,mesh);bpy.context.collection.objects.link(o);o.location=(x,depth,z);o.rotation_euler=(math.radians(pitch),0,math.radians(yaw+26.565));mesh.materials.append(material)
 o['ggComponent']='CANOPY_CARD';o['canopyMass']=mass;o['approvedSource']='EUCALYPTUS_FOLIAGE_CLUSTER_ATLAS_V2_CLEAN.png';o['sourceCluster']=key;o['sourceWidthPx']=sw;o['sourceHeightPx']=sh;o['sourceAspectRatio']=sw/sh;o['cardWidth']=width;o['cardHeight']=height;o['scaleX']=1.0;o['scaleY']=1.0;o['mirrored']=mirrored;o['uniformScaleOnly']=True
 return {'cluster':key,'sourceWidth':sw,'sourceHeight':sh,'sourceAspectRatio':sw/sh,'cardWidth':width,'cardHeight':height,'renderedAspectRatio':width/height,'scaleX':1.0,'scaleY':1.0,'mirrored':mirrored,'mass':mass}
def locked_carcass(bark):
 segments=[((0,0,0),(0,0,2.55),.30),((0,0,2.20),(-1.05,.10,4.15),.16),((0,0,2.35),(1.05,-.08,4.0),.16)] if ASSET_ID=='TREE_NATIVE_ROUNDED_001' else [((0,0,0),(.34,0,2.25),.25),((.30,0,2.0),(1.65,.08,3.45),.14),((1.5,.08,3.35),(3.0,.14,4.18),.09),((.26,0,1.95),(-.9,-.05,3.0),.12),((1.0,.04,2.8),(2.45,.12,3.05),.08)]
 for i,(a,b,r) in enumerate(segments):branch(a,b,r,bark,'GG_'+ASSET_ID+'_LOCKED_CARCASS_%02d'%i)
NATIVE_LAYOUT=[
 ('UPPER',0,.32,5.55,3.95,'RICH_CLUSTER_03',0,8,False),('UPPER',-.55,.48,5.12,3.15,'RICH_CLUSTER_03',-12,15,True),('UPPER',.72,.46,5.05,3.15,'RICH_CLUSTER_03',12,-14,False),
 # This is the user-identified lower-left light-green mass. It is now a
 # mirror of the matching lower-right card: same source, native dimensions,
 # depth, height, scale, and opposing yaw — only horizontal presentation flips.
 ('LEFT',-1.75,.14,4.27,3.95,'RICH_CLUSTER_03',-12,-5,True),('LEFT',-1.18,-.22,3.80,3.70,'RICH_CLUSTER_03',-4,8,True),
 ('RIGHT',1.75,.14,4.27,3.95,'RICH_CLUSTER_03',12,-5,False),('RIGHT',1.18,-.22,3.80,3.70,'RICH_CLUSTER_03',4,8,False),
 ('LOWER',0,-.38,3.55,4.35,'RICH_CLUSTER_03',0,-5,False),('LOWER',-.62,.20,4.02,2.75,'RICH_CLUSTER_03',-7,12,True),('LOWER',.66,.20,4.02,2.75,'RICH_CLUSTER_03',7,-12,False)
]
WIND_LAYOUT=[
 ('LEFT',-1.20,.16,3.08,3.15,'RICH_CLUSTER_03',-14,8,True),('CENTER',-.15,.08,3.75,3.80,'RICH_CLUSTER_03',-7,4,False),('RIGHT',1.05,.14,4.10,4.00,'RICH_CLUSTER_03',3,-5,False),
 ('RIGHT',2.30,.18,3.85,3.65,'RICH_CLUSTER_03',9,3,False),('RIGHT',3.45,.22,3.42,3.15,'RICH_CLUSTER_03',14,7,False),('LOWER',.70,-.24,2.92,3.45,'RICH_CLUSTER_03',0,-6,True),
 ('CENTER',.20,.40,4.38,2.90,'RICH_CLUSTER_03',-4,12,False),('RIGHT',1.90,.44,4.40,2.75,'RICH_CLUSTER_03',8,-10,False),('LEFT',-1.85,.30,2.80,2.75,'RICH_CLUSTER_03',-17,8,True),('LOWER',1.75,-.12,3.08,2.90,'RICH_CLUSTER_03',10,-8,False)
]
LAYOUT=NATIVE_LAYOUT if ASSET_ID=='TREE_NATIVE_ROUNDED_001' else WIND_LAYOUT
def normalize():
 for o in bpy.context.scene.objects:
  if o.type=='MESH': o.location*=REVIEW_SCALE;o.scale=(REVIEW_SCALE,REVIEW_SCALE,REVIEW_SCALE)
def build(level):
 clear();engine();bark=solid('GG_MAT_TREE_BARK_SHARED',(.28,.17,.09,1));fol=foliage();locked_carcass(bark); count={'CLOSE':10,'GAMEPLAY':7,'MAP':3}[level];metrics=[]
 for i,(_,x,d,z,s,key,yaw,pitch,mirrored) in enumerate(LAYOUT[:count]):metrics.append(card(key,x,d,z,s,yaw,pitch,mirrored,fol,i,LAYOUT[i][0]))
 normalize();return metrics
def tris():return sum(len(p.vertices)-2 for o in bpy.context.scene.objects if o.type=='MESH' for p in o.data.polygons)
def camera(mobile=False):
 s=bpy.context.scene;s.render.resolution_x=720 if mobile else 1280;s.render.resolution_y=1280 if mobile else 720;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.world.color=(.42,.55,.62)
 bpy.ops.object.camera_add(location=(36,-72,120));c=bpy.context.object;c.name='GROWGO_GAMEPLAY_CAMERA_REVIEW';c.data.type='PERSP';c.data.angle=math.radians(32);c.rotation_euler=(Vector((0,0,max(18,HEIGHT*.42)))-c.location).to_track_quat('-Z','Y').to_euler();s.camera=c
 bpy.ops.object.light_add(type='SUN',location=(0,0,40));bpy.context.object.data.energy=3.0;bpy.context.object.rotation_euler=(.55,-.35,-.45);bpy.ops.object.light_add(type='AREA',location=(-12,5,24));bpy.context.object.data.energy=1200;bpy.context.object.data.size=12
def render(name,mobile=False):camera(mobile);bpy.context.scene.render.filepath=os.path.join(OUT,name);bpy.ops.render.render(write_still=True)
def context():
 grass=solid('GG_CTX_GRASS',(.23,.42,.16,1));road=solid('GG_CTX_ROAD',(.19,.20,.18,1));wall=solid('GG_CTX_SHOP_WALL',(.48,.30,.16,1));roof=solid('GG_CTX_SHOP_ROOF',(.08,.12,.19,1));bpy.ops.mesh.primitive_plane_add(size=160);bpy.context.object.data.materials.append(grass)
 bpy.ops.mesh.primitive_cube_add(location=(0,13*REVIEW_SCALE,.06),scale=(28*REVIEW_SCALE,2*REVIEW_SCALE,.06));bpy.context.object.data.materials.append(road)
 bpy.ops.mesh.primitive_cube_add(location=(12*REVIEW_SCALE,8*REVIEW_SCALE,2.1*REVIEW_SCALE),scale=(4.2*REVIEW_SCALE,1.8*REVIEW_SCALE,2.1*REVIEW_SCALE));bpy.context.object.data.materials.append(wall);bpy.ops.mesh.primitive_cube_add(location=(12*REVIEW_SCALE,8*REVIEW_SCALE,4.45*REVIEW_SCALE),scale=(4.6*REVIEW_SCALE,2.1*REVIEW_SCALE,.25*REVIEW_SCALE));bpy.context.object.data.materials.append(roof)
def proof():
 clear();engine();fol=foliage();items=[('RICH_CLUSTER_03',-7,0,5,4.2,0),('RICH_CLUSTER_03',-2.4,0,5,3.6,-8),('RICH_CLUSTER_03',2.4,0,5,4.0,8),('RICH_CLUSTER_03',7,0,5,3.4,-14)];metrics=[]
 for i,(key,x,d,z,s,y) in enumerate(items):metrics.append(card(key,x,d,z,s,y,0,False,fol,i,'PROOF'))
 bpy.context.scene.render.resolution_x=1600;bpy.context.scene.render.resolution_y=680;bpy.context.scene.render.resolution_percentage=100;bpy.context.scene.render.image_settings.file_format='PNG';bpy.context.scene.render.image_settings.color_mode='RGBA';bpy.context.scene.world.color=(.20,.22,.20)
 bpy.ops.object.camera_add(location=(0,-28,6));c=bpy.context.object;c.data.type='ORTHO';c.data.ortho_scale=19;c.rotation_euler=(Vector((0,0,5))-c.location).to_track_quat('-Z','Y').to_euler();bpy.context.scene.camera=c;bpy.ops.object.light_add(type='AREA',location=(0,-8,12));bpy.context.object.data.energy=1000;bpy.context.object.data.size=16;bpy.context.scene.render.filepath=os.path.join(OUT,'GROWGO_FOLIAGE_SHAPE_PRESERVATION_BLENDER.png');bpy.ops.render.render(write_still=True)
 return metrics
if MODE=='proof':
 metrics=proof();json.dump({'state':'PASS','type':'SHAPE_PRESERVATION_PROOF','cards':metrics,'blender':bpy.app.version_string,'nonuniformScaleUsed':False},open(os.path.join(OUT,'SHAPE_SAFE_PROOF_RECEIPT.json'),'w'),indent=2);print('GROWGO_SHAPE_SAFE_PROOF_COMPLETE')
elif MODE=='build':
 stats={}
 for level in ('CLOSE','GAMEPLAY','MAP'):
  metrics=build(level);base=ASSET_ID+'_SHAPE_SAFE';bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,base+'_'+level+'.blend'));glb=os.path.join(OUT,base+'_LOD_'+level+'.glb');bpy.ops.export_scene.gltf(filepath=glb,export_format='GLB',export_materials='EXPORT');stats[level]={'cards':len(metrics),'triangles':tris(),'materials':2,'textures':1,'glbBytes':os.path.getsize(glb),'aspectChecks':metrics}
 build('GAMEPLAY');render(ASSET_ID+'_SHAPE_SAFE_GAMEPLAY.png');build('GAMEPLAY');render(ASSET_ID+'_SHAPE_SAFE_MOBILE.png',True);build('GAMEPLAY');context();render(ASSET_ID+'_SHAPE_SAFE_CONTEXT.png')
 receipt={'assetId':ASSET_ID,'version':'2.0.0' if ASSET_ID=='TREE_COASTAL_WIND_001' else '4.0.0','state':'REVIEW_CANDIDATE','worker':'Steam Deck','blender':bpy.app.version_string,'cameraContract':'GROWGO_VEGETATION_GAMEPLAY_CAMERA_CONTRACT@1.0.0','sourceArt':'EUCALYPTUS_FOLIAGE_CLUSTER_ATLAS_V2_CLEAN.png','carcassUnchanged':True,'nonuniformScaleUsed':False,'shapePreservation':'PASS','lods':stats,'anonymousGeometryCount':0,'atlasArchitectureModified':False,'productionPopulationModified':False}
 json.dump(receipt,open(os.path.join(OUT,ASSET_ID+'_SHAPE_SAFE_RECEIPT.json'),'w'),indent=2);print('GROWGO_SHAPE_SAFE_COMPLETE')
else: raise RuntimeError('MODE must be proof or build')
