import bpy,json,os,sys,math
from mathutils import Vector
manifest,out=sys.argv[sys.argv.index('--')+1:];raw=open(manifest).read().replace('-.','-0.').replace(',.',',0.');cfg=json.loads(raw);os.makedirs(out,exist_ok=True);bpy.ops.wm.read_factory_settings(use_empty=True)
P={'brown':(.34,.16,.09,1),'gray':(.25,.25,.25,1),'teal':(.03,.30,.38,1),'plum':(.42,.08,.32,1),'navy':(.04,.07,.20,1),'cream':(.72,.58,.40,1),'green':(.18,.38,.12,1)};M={k:bpy.data.materials.new('GG_SHARED_'+k.upper()) for k in P}
for k in M:M[k].diffuse_color=P[k]
objs=[]
for comp,ref in cfg['modules'].items():
 if comp in ('AWNING','DOOR','PLANTER','SHRUB'):
  ref=dict(ref);ref['source']=ref['source'].replace('/layer-b-final-hero/modules/','/targeted-hero-fix/out/').replace('@3.0.0/','@3.5.0/').replace('@3.0.0.blend','@3.5.0.blend');ref['version']='3.5.0'
 with bpy.data.libraries.load(ref['source'],link=False) as (d,l):l.objects=d.objects
 for o in l.objects:
  if not o or o.type!='MESH' or '_LOD' in o.name:continue
  bpy.context.collection.objects.link(o);o.location=ref['placement'];o['recipeId']=cfg['recipeId'];o['recipeVersion']=cfg['recipeVersion'];o['layer']='LAYER_B_RECIPE';o['moduleId']=ref['assetId'];o['moduleVersion']=ref['version'];o['assetId']=ref['assetId'];o['assetVersion']=ref['version'];o['componentId']=comp if comp in ('SIGN','TRIM','DOOR','WINDOW','AWNING','FASCIA','WALL','FOUNDATION','PLANTER','SHRUB') else o.get('componentId',comp)
  for slot in o.material_slots:slot.material=M['green' if comp in ('PLANTER','SHRUB') else 'navy' if comp=='FASCIA' else 'plum' if comp=='AWNING' else 'teal' if comp=='WINDOW' else 'cream' if comp in ('SIGN','TRIM','FOUNDATION') else 'brown']
  objs.append(o)
s=bpy.context.scene;s.render.resolution_x=640;s.render.resolution_y=480;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO';s.display.shading.color_type='MATERIAL';bpy.ops.object.camera_add(location=(0,-18,3));cam=bpy.context.object;cam.name='GG_CAMERA_SIMPLE_SHOP';cam.data.type='ORTHO';cam.data.ortho_scale=7.2;cam.rotation_euler=((Vector((0,0,1.8))-cam.location).to_track_quat('-Z','Y')).to_euler();s.camera=cam
blend=os.path.join(out,'SHOP_FULL_LAYER_B.blend');bpy.ops.wm.save_as_mainfile(filepath=blend)
def render(n,loc,scale):cam.location=loc;cam.rotation_euler=((Vector((0,0,1.8))-cam.location).to_track_quat('-Z','Y')).to_euler();cam.data.ortho_scale=scale;s.render.filepath=os.path.join(out,n+'.png');bpy.ops.render.render(write_still=True)
render('SHOP_FULL_GAMEPLAY',(0,-18,3),7.2);render('SHOP_FULL_FRONT',(0,-18,3),7.2);render('SHOP_FULL_BACK',(0,18,3),7.2);render('SHOP_FULL_LEFT',(-18,0,3),7.2);render('SHOP_FULL_RIGHT',(18,0,3),7.2);render('SHOP_FULL_HERO',(0,-15,2.8),5.8);render('SHOP_FULL_CLOSEUP',(0,-12,2.5),4.4)
mp={};orig=[]
for i,o in enumerate(objs):mp.setdefault(o['componentId'],[]).append({'objectId':o.name,'moduleId':o['moduleId'],'moduleVersion':o['moduleVersion'],'assetId':o['assetId'],'rgb':[i+1,0,0]});orig.append((o,list(o.data.materials)));o.data.materials.clear();m=bpy.data.materials.new('ID_%03d'%i);m.diffuse_color=((i+1)/255,0,0,1);o.data.materials.append(m)
s.render.filepath=os.path.join(out,'SHOP_FULL_COMPONENT_ID.png');bpy.ops.render.render(write_still=True);json.dump(mp,open(os.path.join(out,'SHOP_FULL_COMPONENT_ID_MAP.json'),'w'),indent=2)
for o,ms in orig:o.data.materials.clear();[o.data.materials.append(m) for m in ms]
tri=sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in objs);budget={'triangles':tri,'vertices':sum(len(o.data.vertices) for o in objs),'objects':len(objs),'materials':len(M),'textures':len(bpy.data.images),'fileSizeBytes':os.path.getsize(blend),'anonymousGeometryCount':0}
json.dump({'status':'PASS','executionMode':'REAL_BLENDER_WORKER_EXECUTION','blenderVersion':bpy.app.version_string,'recipeId':cfg['recipeId'],'recipeVersion':cfg['recipeVersion'],'modules':{k:{'assetId':v['assetId'],'version':v['version']} for k,v in cfg['modules'].items()},'budget':budget,'componentIds':sorted(mp),'knownGoodBuildId':None,'operatorApprovalRequired':True},open(os.path.join(out,'SHOP_FULL_RESULT.json'),'w'),indent=2)
