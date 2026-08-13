import bpy,json,os,sys,math
from mathutils import Vector
manifest_path,module_root,out_dir=sys.argv[sys.argv.index('--')+1:];manifest=json.load(open(manifest_path));os.makedirs(out_dir,exist_ok=True);bpy.ops.wm.read_factory_settings(use_empty=True)
pal={'SHOP_WARM_BROWN':(.34,.16,.09,1),'SHOP_CREAM':(.72,.58,.40,1),'SHOP_NAVY':(.04,.07,.20,1),'SHOP_PLUM_FABRIC':(.42,.08,.32,1),'SHOP_TEAL_GLASS':(.03,.30,.38,1),'SHOP_GREEN_VEGETATION':(.12,.38,.10,1),'SHOP_GRAY':(.25,.25,.25,1)}
placements={'FOUNDATION':(0,0,0),'WALL':(0,0,1.5),'DOOR':(-1.2,-.25,1.1),'WINDOW':(1.0,-.25,1.55),'AWNING':(0,-.65,2.75),'FASCIA':(0,0,3.45),'SIGN':(0,-.55,3.45),'TRIM':(0,-.28,2.95),'PLANTER':(2.2,-.1,.6)}
objects=[]
for comp,ref in manifest['modules'].items():
 aid,ver=ref.rsplit('@',1);src=os.path.join(module_root,aid+'@'+ver,aid+'@'+ver+'.blend')
 if not os.path.exists(src): src=os.path.join(module_root,aid,aid+'@'+ver+'.blend')
 with bpy.data.libraries.load(src,link=False) as (data,loaded): loaded.objects=data.objects
 for o in loaded.objects:
  if o is None or '_LOD' in o.name:continue
  if o.type!='MESH': continue
  bpy.context.collection.objects.link(o);o.location=placements[comp];o['recipeId']=manifest['recipeId'];o['recipeVersion']='1.0.0';o['layer']='LAYER_B_RECIPE';o['componentId']=comp;o['moduleId']=aid;o['moduleVersion']=ver;o['assetId']=aid;o['assetVersion']=ver;objects.append(o)
s=bpy.context.scene;s.render.resolution_x=256;s.render.resolution_y=256;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO';s.display.shading.color_type='MATERIAL';s.world=bpy.data.worlds.new('GG_FINAL_SHOP_WORLD');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.92,.92,.92,1);bpy.ops.object.camera_add(location=(0,-18,3));cam=bpy.context.object;cam.name='GG_CAMERA_SIMPLE_SHOP';cam.data.type='ORTHO';cam.data.ortho_scale=8;cam.rotation_euler=((Vector((0,0,1.5))-cam.location).to_track_quat('-Z','Y')).to_euler();s.camera=cam
blend=os.path.join(out_dir,'SHOP_FINAL_PRODUCTION_CANDIDATE.blend');bpy.ops.wm.save_as_mainfile(filepath=blend)
for lab,a in [('FRONT',0),('BACK',math.pi),('LEFT',math.pi/2),('RIGHT',-math.pi/2)]:cam.location=(math.sin(a)*18,-math.cos(a)*18,3);cam.rotation_euler=((Vector((0,0,1.5))-cam.location).to_track_quat('-Z','Y')).to_euler();s.render.filepath=os.path.join(out_dir,'SHOP_FINAL_'+lab+'.png');bpy.ops.render.render(write_still=True)
orig=[(o,list(o.data.materials)) for o in objects]
for i,o in enumerate(objects):o.data.materials.clear();m=bpy.data.materials.new('SHOP_FINAL_ID_%03d'%i);m.diffuse_color=((i+1)/255,0,0,1);o.data.materials.append(m)
s.render.filepath=os.path.join(out_dir,'SHOP_FINAL_COMPONENT_ID_RENDER.png');bpy.ops.render.render(write_still=True);idmap={o['componentId']:{'objectId':o.name,'assetId':o['assetId'],'assetVersion':o['assetVersion'],'moduleId':o['moduleId'],'moduleVersion':o['moduleVersion'],'rgb':[i+1,0,0]} for i,o in enumerate(objects)};json.dump(idmap,open(os.path.join(out_dir,'SHOP_FINAL_COMPONENT_ID_MAP.json'),'w'),indent=2)
for o,ms in orig:o.data.materials.clear();[o.data.materials.append(m) for m in ms]
stats={'triangles':sum(sum(len(p.vertices)-2 for p in m.polygons) for m in bpy.data.meshes),'vertices':sum(len(m.vertices) for m in bpy.data.meshes),'objects':len(objects),'materials':len(bpy.data.materials),'textures':len(bpy.data.images),'fileSizeBytes':os.path.getsize(blend),'anonymousGeometryCount':0};json.dump(stats,open(os.path.join(out_dir,'SHOP_FINAL_BUDGET.json'),'w'),indent=2)
json.dump({'status':'COMPLETED','executionMode':'REAL_BLENDER_WORKER_EXECUTION','blenderVersion':bpy.app.version_string,'recipeId':manifest['recipeId'],'modules':manifest['modules'],'blend':'SHOP_FINAL_PRODUCTION_CANDIDATE.blend','beauty':['SHOP_FINAL_FRONT.png','SHOP_FINAL_BACK.png','SHOP_FINAL_LEFT.png','SHOP_FINAL_RIGHT.png'],'componentIdRender':'SHOP_FINAL_COMPONENT_ID_RENDER.png','budget':stats,'knownGoodBuildId':None,'operatorApprovalRequired':True},open(os.path.join(out_dir,'SHOP_FINAL_PRODUCTION_CANDIDATE_RESULT.json'),'w'),indent=2)
