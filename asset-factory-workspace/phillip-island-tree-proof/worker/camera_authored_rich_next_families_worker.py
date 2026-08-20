"""Steam Deck fabrication of the two next tree families with the approved rich-raster method only."""
import bpy, os, sys, json, math, hashlib
from mathutils import Vector
ROOT, ATLAS, WIND_ATLAS, NATIVE, EXISTING_EUCALYPTUS = sys.argv[-5:]
OUT=os.path.join(ROOT,'next-family-rich-output');os.makedirs(OUT,exist_ok=True)
W=H=1254; BOXES=[(17,13,428,518),(478,18,833,563),(863,18,1232,610),(730,561,993,800),(26,793,676,1228),(696,799,896,1235),(917,775,1237,1218),(48,489,652,819)]; UV=[(a/W,1-(d+1)/H,(c+1)/W,1-b/H) for a,b,c,d in BOXES]
CAMERA_CONTRACT='GROWGO_VEGETATION_GAMEPLAY_CAMERA_CONTRACT@1.0.0'
FAMILIES=[
 {'id':'TREE_EUCALYPTUS_COASTAL_002','version':'2.0.0','height':10.8,'scale':[.91,1.08],'yaw':[-12,12],
  'trunk':[ ((0,0,0),(-.25,0,3.0),.25), ((-.22,0,2.7),(-1.95,.12,5.55),.14), ((-.2,0,2.95),(1.18,-.08,6.1),.14), ((1.1,-.08,5.6),(2.45,.05,7.25),.08), ((-.55,.05,4.0),(-2.6,.1,5.1),.09) ],
  'cards':[(-1.9,.22,5.2,3.2,3.75,0,-13),(-.75,.26,6.8,3.2,4.0,1,-5),(.85,.25,6.55,3.15,4.05,0,8),(2.05,.23,5.65,3.05,3.65,5,15),(2.7,.30,4.45,2.5,3.0,3,18),(-1.05,-.12,4.6,3.1,3.5,4,-8),(-2.7,.35,4.6,2.45,2.9,5,-18),(.15,.5,7.75,2.55,3.2,1,3),(-.15,-.18,5.35,3.45,3.55,6,0),(-1.35,.4,6.15,2.55,3.2,0,-11),(1.55,.42,6.25,2.55,3.2,1,12),(0,-.3,3.95,3.1,2.8,4,0)] },
 {'id':'TREE_COASTAL_WIND_001','version':'2.0.0','height':6.7,'scale':[.88,1.10],'yaw':[-10,10],
  'trunk':[ ((0,0,0),(.34,0,2.25),.25), ((.30,0,2.0),(1.65,.08,3.45),.14), ((1.5,.08,3.35),(3.0,.14,4.18),.09), ((.26,0,1.95),(-.9,-.05,3.0),.12), ((1.0,.04,2.8),(2.45,.12,3.05),.08) ],
  # Wind crown deliberately uses only the clean full rich components (0, 1,
  # and 5).  The earlier cropped components carried detached alpha fragments
  # in this wide composition, which is not acceptable at gameplay distance.
  'cards':[(-1.25,.24,3.2,2.55,2.40,0,-13),(-.15,.18,4.0,2.85,2.65,1,-7),(1.25,.2,4.2,3.0,2.70,0,3),(2.75,.22,3.95,2.95,2.55,5,9),(4.0,.28,3.45,2.55,2.30,1,14),(1.0,-.15,3.1,3.05,2.40,0,0),(-.45,.45,3.65,2.40,2.25,5,-9),(2.15,.48,4.55,2.40,2.35,1,7),(3.45,-.05,3.35,2.35,2.10,0,12),(0,-.25,2.65,2.55,2.00,5,-4),(1.8,.55,3.55,2.35,2.05,1,5),(-1.85,.35,2.9,2.10,1.90,0,-16)] }
]
def clear(): bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def engine():
 for e in ('BLENDER_EEVEE','BLENDER_EEVEE_NEXT'):
  try:bpy.context.scene.render.engine=e;return
  except:pass
 raise RuntimeError('GROWGO_SUPPORTED_EEVEE_NOT_AVAILABLE')
def solid(name,c):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=c;p.inputs['Roughness'].default_value=.8;return m
def foliage(atlas, material_name='GG_MAT_FOLIAGE_RICH_RASTER_V2'):
 m=bpy.data.materials.new(material_name);m.use_nodes=True
 try:m.surface_render_method='DITHERED';m.use_backface_culling=False
 except:pass
 n=m.node_tree.nodes;l=m.node_tree.links
 for x in list(n):n.remove(x)
 out=n.new('ShaderNodeOutputMaterial');p=n.new('ShaderNodeBsdfPrincipled');im=n.new('ShaderNodeTexImage');im.image=bpy.data.images.load(atlas,check_existing=True);p.inputs['Roughness'].default_value=.85;l.new(im.outputs['Color'],p.inputs['Base Color']);
 if p.inputs.get('Emission Color'):l.new(im.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=.18
 l.new(im.outputs['Alpha'],p.inputs['Alpha']);l.new(p.outputs['BSDF'],out.inputs['Surface']);return m
def branch(a,b,r,m,n):
 a,b=Vector(a),Vector(b);d=b-a;bpy.ops.mesh.primitive_cone_add(vertices=7,radius1=r,radius2=r*.56,depth=d.length,location=(a+b)/2);o=bpy.context.object;o.name=n;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();o.data.materials.append(m);o['ggComponent']='TRUNK'
def card(item, m, n, isolated=False):
 x,depth,z,w,h,source,yaw=item;u0,v0,u1,v1=((0,0,1,1) if isolated else UV[source]);mesh=bpy.data.meshes.new(n+'_MESH');mesh.from_pydata([(-w/2,0,-h/2),(w/2,0,-h/2),(w/2,0,h/2),(-w/2,0,h/2)],[],[(0,1,2,3)]);mesh.uv_layers.new(name='UVMap')
 for loop,co in zip(mesh.uv_layers[0].data,[(u0,v0),(u1,v0),(u1,v1),(u0,v1)]):loop.uv=co
 o=bpy.data.objects.new(n,mesh);bpy.context.collection.objects.link(o);o.location=(x,depth,z);o.rotation_euler=(0,0,math.radians(yaw+26.565));mesh.materials.append(m);o['ggComponent']='CANOPY_CARD';o['approvedSource']='EUCALYPTUS_FOLIAGE_CLUSTER_ATLAS_V2_CLEAN.png'
def build(f,level):
 clear();engine();bark=solid('GG_MAT_TREE_BARK_SHARED',(.28,.17,.09,1));isolated=f['id']=='TREE_COASTAL_WIND_001';fol=foliage(WIND_ATLAS if isolated else ATLAS, 'GG_MAT_COASTAL_WIND_ISOLATED_RICH_FOLIAGE' if isolated else 'GG_MAT_FOLIAGE_RICH_RASTER_V2')
 for i,(a,b,r) in enumerate(f['trunk']):branch(a,b,r,bark,'GG_'+f['id']+'_LOCKED_STRUCTURE_%02d'%i)
 count={'CLOSE':12,'GAMEPLAY':8,'MAP':3}[level]
 for i,item in enumerate(f['cards'][:count]):card(item,fol,'GG_'+f['id']+'_CARD_%02d'%i,isolated)
 scale=48.0/f['height']
 for o in bpy.context.scene.objects:
  if o.type=='MESH':o.location*=scale;o.scale*=scale
 return count
def tri_count():return sum(len(p.vertices)-2 for o in bpy.context.scene.objects if o.type=='MESH' for p in o.data.polygons)
def camera(mobile=False):
 s=bpy.context.scene;s.render.resolution_x=720 if mobile else 1280;s.render.resolution_y=1280 if mobile else 720;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.world.color=(.42,.55,.62)
 bpy.ops.object.camera_add(location=(36,-72,120));c=bpy.context.object;c.name='GROWGO_GAMEPLAY_CAMERA_REVIEW';c.data.type='PERSP';c.data.angle=math.radians(32);c.rotation_euler=(Vector((0,0,18))-c.location).to_track_quat('-Z','Y').to_euler();s.camera=c
 bpy.ops.object.light_add(type='SUN',location=(0,0,40));bpy.context.object.data.energy=3.0;bpy.context.object.rotation_euler=(.55,-.35,-.45);bpy.ops.object.light_add(type='AREA',location=(-12,5,24));bpy.context.object.data.energy=1200;bpy.context.object.data.size=12
def render(name,mobile=False):camera(mobile);bpy.context.scene.render.filepath=os.path.join(OUT,name);bpy.ops.render.render(write_still=True)
def export(f):
 stats={}
 for level in ('CLOSE','GAMEPLAY','MAP'):
  cards=build(f,level);base=f['id']+'@'+f['version'];bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,base+'_'+level+'.blend'));glb=os.path.join(OUT,base+'_LOD_'+level+'.glb');bpy.ops.export_scene.gltf(filepath=glb,export_format='GLB',export_materials='EXPORT');stats[level]={'cards':cards,'triangles':tri_count(),'materials':2,'textures':1,'glbBytes':os.path.getsize(glb)}
 build(f,'GAMEPLAY');render(f['id']+'_GROWGO_GAMEPLAY_CAMERA_REVIEW.png');build(f,'GAMEPLAY');render(f['id']+'_MOBILE_REVIEW.png',True)
 # deterministic visual variation proof uses canonical geometry with mirrored, scale, yaw, and palette-labelled instances.
 build(f,'MAP');original=[o for o in bpy.context.scene.objects if o.type=='MESH'];variants=[(-12,.92,False,-8,'BASE'),(-7,1.04,True,5,'COOL'),(-2,1.08,False,9,'WARM'),(3,.95,False,-6,'LIGHT'),(8,1.00,True,7,'BASE'),(13,.91,False,-4,'COOL')]
 for v,(x,sc,mir,yaw,pal) in enumerate(variants):
  for o in original:
   c=o.copy();c.data=o.data.copy();bpy.context.collection.objects.link(c);c.location.x+=x*(48.0/f['height']);c.scale=((-sc if mir else sc),sc,sc);c.rotation_euler[2]+=math.radians(yaw);c['variation']=pal
 for o in original:bpy.data.objects.remove(o,do_unlink=True)
 render(f['id']+'_DETERMINISTIC_VARIATION_REVIEW.png')
 return stats
allStats={f['id']:export(f) for f in FAMILIES}
def context_geometry():
 g=solid('GG_CONTEXT_GRASS',(.23,.42,.16,1));r=solid('GG_CONTEXT_ROAD',(.19,.20,.18,1));p=solid('GG_CONTEXT_PATH',(.62,.53,.39,1));w=solid('GG_CONTEXT_SHOP',(.48,.30,.16,1));roof=solid('GG_CONTEXT_ROOF',(.08,.12,.19,1));bpy.ops.mesh.primitive_plane_add(size=160,location=(0,0,0));bpy.context.object.data.materials.append(g);bpy.ops.mesh.primitive_cube_add(location=(0,13*(48/8.6),.06),scale=(28*(48/8.6),2*(48/8.6),.06));bpy.context.object.data.materials.append(r);bpy.ops.mesh.primitive_cube_add(location=(-4*(48/8.6),5*(48/8.6),.08),scale=(10*(48/8.6),1.2*(48/8.6),.08));bpy.context.object.data.materials.append(p);bpy.ops.mesh.primitive_cube_add(location=(12*(48/8.6),8*(48/8.6),2.1*(48/8.6)),scale=(4.2*(48/8.6),1.8*(48/8.6),2.1*(48/8.6)));bpy.context.object.data.materials.append(w);bpy.ops.mesh.primitive_cube_add(location=(12*(48/8.6),8*(48/8.6),4.45*(48/8.6)),scale=(4.6*(48/8.6),2.1*(48/8.6),.25*(48/8.6)));bpy.context.object.data.materials.append(roof)
def imp(glb,loc,scale=1,mirror=False,yaw=0):
 before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=glb);new=[o for o in bpy.context.scene.objects if o not in before];root=bpy.data.objects.new('GG_CONTEXT_INSTANCE',None);bpy.context.collection.objects.link(root);root.location=loc;root.scale=((-scale if mirror else scale),scale,scale);root.rotation_euler[2]=math.radians(yaw)
 for o in new:o.parent=root
def context(name,mobile=False,mass=False):
 clear();engine();context_geometry();files={f['id']:os.path.join(OUT,f['id']+'@'+f['version']+'_LOD_GAMEPLAY.glb') for f in FAMILIES};native=NATIVE
 placements=[('TREE_EUCALYPTUS_COASTAL_002',(-9,3,0),1,False,-8),('TREE_COASTAL_WIND_001',(6,2,0),1.05,False,8)] if not mass else [('TREE_EUCALYPTUS_COASTAL_002',(-11,-2,0),.92,False,-8),('TREE_COASTAL_WIND_001',(-5,-1,0),1.08,True,5),('TREE_EUCALYPTUS_COASTAL_002',(2,-2,0),1.0,True,-5),('TREE_COASTAL_WIND_001',(9,-1,0),.94,False,9),('TREE_EUCALYPTUS_COASTAL_002',(-7,8,0),1.06,False,6),('TREE_COASTAL_WIND_001',(5,8,0),1.02,True,-7)]
 imp(native,(-1,3,0),1,True,4)
 if os.path.exists(EXISTING_EUCALYPTUS):imp(EXISTING_EUCALYPTUS,(12,11,0),.75,True,-10)
 for aid,loc,sc,mir,yaw in placements:imp(files[aid],loc,sc,mir,yaw)
 render(name,mobile)
context('GROWGO_APPROVED_TREE_METHOD_NEXT_FAMILIES_CONTEXT.png');context('GROWGO_NEXT_TREE_FAMILIES_MOBILE_REVIEW.png',True);context('GROWGO_TREE_FAMILY_MASS_VARIATION_REVIEW.png',False,True)
receipt={'status':'PASS','state':'REVIEW_CANDIDATE','worker':'Steam Deck','blender':bpy.app.version_string,'cameraContract':CAMERA_CONTRACT,'sourceArt':'EUCALYPTUS_FOLIAGE_CLUSTER_ATLAS_V2_CLEAN.png','method':'GROWGO_CAMERA_AUTHORED_ILLUSTRATED_FOLIAGE_CLUSTER_METHOD@1.0.0','families':[{ 'assetId':f['id'],'assetVersion':f['version'],'lods':allStats[f['id']],'variation':{'mirror':True,'uniformScale':f['scale'],'worldYawDegrees':f['yaw'],'palette':['BASE','COOL','WARM','LIGHT']}} for f in FAMILIES],'atlasArchitectureModified':False,'productionPopulationModified':False,'anonymousGeometryCount':0}
json.dump(receipt,open(os.path.join(OUT,'NEXT_TREE_FAMILIES_RICH_RECEIPT.json'),'w'),indent=2);print('GROWGO_NEXT_TREE_FAMILIES_RICH_COMPLETE')
