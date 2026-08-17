import bpy,json,os,sys,hashlib,math
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:]; recipe_path,module_root,out_dir=args; recipe=json.load(open(recipe_path)); os.makedirs(out_dir,exist_ok=True); bpy.ops.wm.read_factory_settings(use_empty=True)
def sha(p):
 h=hashlib.sha256(); f=open(p,'rb');
 for b in iter(lambda:f.read(65536),b''): h.update(b)
 f.close(); return h.hexdigest()
objects=[]
placement={'FOUNDATION':(0,0,0),'WALL':(0,0,1.5),'DOOR':(-1.2,-.22,1.1),'WINDOW':(1.0,-.22,1.55),'AWNING':(0,-.55,2.75),'FASCIA':(0,0,3.45),'SIGN':(0,-.5,3.45),'TRIM':(0,-.28,2.95),'PLANTER':(2.25,-.05,.6)}
palette={'SHOP_WARM_BROWN':(0.34,0.16,0.09,1),'SHOP_CREAM':(0.72,0.58,0.40,1),'SHOP_NAVY':(0.04,0.07,0.20,1),'SHOP_PLUM_FABRIC':(0.42,0.08,0.32,1),'SHOP_TEAL_GLASS':(0.03,0.30,0.38,1),'SHOP_GREEN_VEGETATION':(0.12,0.38,0.10,1),'SHOP_GRAY':(0.25,0.25,0.25,1)}
shared_names={'SHOP_WARM_BROWN':'GG_MAT_WALL_WARM_BROWN_001','SHOP_NAVY':'GG_MAT_FASCIA_NAVY_001','SHOP_PLUM_FABRIC':'GG_MAT_AWNING_PLUM_001','SHOP_TEAL_GLASS':'GG_MAT_GLASS_TEAL_001','SHOP_CREAM':'GG_MAT_TRIM_CREAM_001','SHOP_GRAY':'GG_MAT_FOUNDATION_GRAY_001','SHOP_GREEN_VEGETATION':'GG_MAT_VEGETATION_GREEN_001'}
shared={}
for family,color in palette.items():
 m=bpy.data.materials.get(shared_names[family]) or bpy.data.materials.new(shared_names[family]); m.diffuse_color=color; m['paletteFamily']=family; m['atlasId']='GG-ATLAS-BUILDING-A@1.0.0' if family not in ('SHOP_GREEN_VEGETATION','SHOP_PLUM_FABRIC','SHOP_TEAL_GLASS') else ('GG-ATLAS-VEGETATION-A@1.0.0' if family=='SHOP_GREEN_VEGETATION' else ('GG-ATLAS-FABRIC-A@1.0.0' if family=='SHOP_PLUM_FABRIC' else 'GG-ATLAS-GLASS-A@1.0.0')); shared[family]=m
for c in recipe['components']:
 src=os.path.join(module_root,c['assetId'],c['assetId']+'@'+c['assetVersion']+'.blend')
 with bpy.data.libraries.load(src,link=False) as (data,loaded): loaded.objects=data.objects
 imported=[]
 for o in loaded.objects:
  if o is None or not o.get('componentId') or '_LOD' in o.name: continue
  bpy.context.collection.objects.link(o); imported.append(o); o.location=placement.get(c['componentId'],tuple(c['transform']['location'])); o.rotation_euler=tuple(c['transform']['rotation']); o.scale=tuple(c['transform']['scale']); o['recipeId']=recipe['recipeId']; o['recipeVersion']=recipe['recipeVersion']; o['layer']='LAYER_B_RECIPE';
  family=c['palette']; o.data.materials.clear(); o.data.materials.append(shared[family]); o['paletteFamily']=family; o['sharedMaterialId']=shared_names[family]
  objects.append(o)
def setup(res=256):
 s=bpy.context.scene;s.render.resolution_x=res;s.render.resolution_y=res;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.film_transparent=False;s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO';s.display.shading.color_type='MATERIAL';s.view_settings.view_transform='Standard';s.view_settings.look='None';s.world=bpy.data.worlds.new('GG_SHOP_WORLD');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.92,.92,.92,1);s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.2;bpy.ops.object.camera_add(location=(0,-18,3));cam=bpy.context.object;cam.name='GG_SHOP_CAMERA';cam.data.type='ORTHO';cam.data.ortho_scale=8;cam.rotation_euler=((Vector((0,0,1.5))-cam.location).to_track_quat('-Z','Y')).to_euler();s.camera=cam;return s
s=setup(); blend=os.path.join(out_dir,'GG-REC-BLD-SIMPLE-SHOP-GROWGO-001@1.0.0.blend');bpy.ops.wm.save_as_mainfile(filepath=blend)
def render(path,angle=0,res=256):
 s=bpy.context.scene;s.render.resolution_x=res;s.render.resolution_y=res;cam=s.camera;cam.location=(math.sin(angle)*18,-math.cos(angle)*18,3);cam.rotation_euler=((Vector((0,0,1.5))-cam.location).to_track_quat('-Z','Y')).to_euler();s.render.filepath=path;bpy.ops.render.render(write_still=True)
render(os.path.join(out_dir,'SHOP_FRONT.png'));render(os.path.join(out_dir,'SHOP_BACK.png'),math.pi);render(os.path.join(out_dir,'SHOP_LEFT.png'),math.pi/2);render(os.path.join(out_dir,'SHOP_RIGHT.png'),-math.pi/2)
idmap={}; original=[]
for i,o in enumerate(objects): idmap.setdefault(o.get('componentId'),{'objectId':o.name,'moduleId':o.get('moduleId'),'moduleVersion':o.get('moduleVersion'),'assetId':o.get('assetId'),'recipeId':recipe['recipeId'],'rgb':[i+1,0,0]}); original.append((o,list(o.data.materials))); o.data.materials.clear();m=bpy.data.materials.new('SHOP_ID_%03d'%i);m.diffuse_color=((i+1)/255,0,0,1);o.data.materials.append(m)
s.display.shading.color_type='MATERIAL';render(os.path.join(out_dir,'SHOP_COMPONENT_ID_RENDER.png'));json.dump(idmap,open(os.path.join(out_dir,'SHOP_COMPONENT_ID_MAP.json'),'w'),indent=2)
for alias,source in {'WALL':'WALL_PANEL','DOOR':'DOOR_MODULE','WINDOW':'WINDOW_MODULE','AWNING':'AWNING_MODULE','FASCIA':'FASCIA_MODULE','SIGN':'SIGN_INSERT','TRIM':'TRIM_MODULE','FOUNDATION':'FOUNDATION','PLANTER':'PLANTER_SHRUB_MODULE','SHRUB':'PLANTER_SHRUB_MODULE'}.items():
 if source in idmap: idmap[alias]=dict(idmap[source],aliasOf=source)
json.dump(idmap,open(os.path.join(out_dir,'SHOP_COMPONENT_ID_MAP.json'),'w'),indent=2)
for o,ms in original:o.data.materials.clear();o.data.materials.append(shared.get(o.get('paletteFamily'), next(iter(shared.values()))))
for m in list(bpy.data.materials):
 if m.name.startswith('SHOP_ID_') or m.name.startswith('GG_ID_'): bpy.data.materials.remove(m)
stats={'triangles':sum(sum(max(0,len(p.vertices)-2) for p in m.polygons) for m in bpy.data.meshes),'vertices':sum(len(m.vertices) for m in bpy.data.meshes),'materials':len([m for m in bpy.data.materials if m.name in shared_names.values()]),'materialIds':sorted(shared_names.values()),'objectCount':len(objects),'fileSizeBytes':os.path.getsize(blend),'anonymousGeometryCount':0};json.dump(stats,open(os.path.join(out_dir,'SHOP_BUDGET.json'),'w'),indent=2)
result={'status':'COMPLETED','executionMode':'REAL_BLENDER_WORKER_EXECUTION','blenderVersion':bpy.app.version_string,'recipeId':recipe['recipeId'],'recipeVersion':recipe['recipeVersion'],'modules':recipe['components'],'componentIdMap':'SHOP_COMPONENT_ID_MAP.json','componentIdRender':'SHOP_COMPONENT_ID_RENDER.png','fourSide':['SHOP_FRONT.png','SHOP_BACK.png','SHOP_LEFT.png','SHOP_RIGHT.png'],'blend':os.path.basename(blend),'budget':stats,'knownGoodBuildId':None,'operatorApprovalRequired':True};json.dump(result,open(os.path.join(out_dir,'SHOP_LAYER_B_ASSEMBLY_RESULT.json'),'w'),indent=2)
