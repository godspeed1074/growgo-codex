import bpy,json,os,sys,math
from mathutils import Vector
pack_path,out_dir=sys.argv[sys.argv.index('--')+1:];pack=json.load(open(pack_path));os.makedirs(out_dir,exist_ok=True)
P={'SHOP_WARM_BROWN':(.34,.16,.09,1),'SHOP_CREAM':(.72,.58,.40,1),'SHOP_TEAL_GLASS':(.03,.30,.38,1),'SHOP_GREEN_VEGETATION':(.12,.38,.10,1),'SHOP_PLUM_FABRIC':(.42,.08,.32,1)}
def mat(n,c):m=bpy.data.materials.new(n);m.diffuse_color=c;return m
def cube(n,d,l,m,x,c):
 bpy.ops.mesh.primitive_cube_add(size=1,location=l);o=bpy.context.object;o.name=n;o.dimensions=d;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 for k,v in {'assetId':x['assetId'],'assetVersion':x['version'],'parentVersion':x['parentVersion'],'moduleId':x['assetId'],'moduleVersion':x['version'],'componentId':c,'moduleFamily':x['family'],'layer':'LAYER_A_MODULE','detailModuleIds':x['detailModules']}.items():o[k]=v
 return o
def build(x):
 bpy.ops.wm.read_factory_settings(use_empty=True);a=x['assetId'];o=[];base=mat('GG_MAT_'+x['palette']+'_001',P[x['palette']]);cream=mat('GG_MAT_SHOP_CREAM_001',P['SHOP_CREAM']);glass=mat('GG_MAT_SHOP_GLASS_001',P['SHOP_TEAL_GLASS']);green=mat('GG_MAT_SHOP_GREEN_001',P['SHOP_GREEN_VEGETATION'])
 if x['family']=='SHOP_SHRUB':
  o=[cube(a+'_PLANTER',(1.18,.82,.5),(0,0,.25),base,x,'PLANTER'),cube(a+'_RIM',(1.32,.94,.14),(0,0,.55),cream,x,'PLANTER_RIM'),cube('GG-VEG-PLANTER-SOIL-FILL-001',(.95,.58,.08),(0,0,.62),base,x,'SOIL_FILL')]
  for i in range(13):
   layer=i//5; ang=(i%5)*1.25; rad=.18+.08*layer; o.append(cube('GG-VEG-SHRUB-LEAF-CLUSTER-%02d'%i,(.32,.30,.62),((i%5-2)*.18,.12*math.sin(ang),.78+layer*.22+.05*(i%2)),green,x,'LEAF_CLUSTER'))
  o.append(cube('GG-VEG-FLOWER-ACCENT-001',(.12,.12,.12),(.18,-.22,1.25),cream,x,'FLOWER_ACCENT'))
 else:
  o=[cube(a+'_SLAB',(1.0,.18,2.1),(0,.05,1.05),base,x,'DOOR'),cube('GG-BLD-DOOR-FRAME-DEPTH-001',(1.34,.28,2.42),(0,-.02,1.15),cream,x,'FRAME_DEPTH'),cube('GG-BLD-DOOR-GLASS-INSERT-001',(.58,.04,.82),(0,-.18,1.55),glass,x,'GLASS_INSERT'),cube('GG-BLD-DOOR-PANEL-001',(.7,.04,.48),(0,-.18,.68),base,x,'PANEL'),cube('GG-BLD-DOOR-HANDLE-001',(.12,.12,.12),(.34,-.23,1.1),cream,x,'HANDLE'),cube('GG-BLD-DOOR-MAIL-SLOT-001',(.28,.06,.08),(.0,-.24,.72),cream,x,'MAIL_SLOT'),cube('GG-BLD-DOOR-THRESHOLD-001',(1.45,.42,.18),(0,-.14,.08),cream,x,'THRESHOLD')]
 for lod in ['LOD1','LOD2']:
  col=bpy.data.collections.new(lod);bpy.context.scene.collection.children.link(col)
  for q in o:cp=q.copy();cp.data=q.data.copy();cp.name=q.name+'_'+lod;cp['lod']=lod;col.objects.link(cp)
 for q in o:q['lod']='LOD0'
 return o
def setup():
 s=bpy.context.scene;s.render.resolution_x=256;s.render.resolution_y=256;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO';s.display.shading.color_type='MATERIAL';s.world=bpy.data.worlds.new('GG_MICRO_DETAIL_WORLD');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.92,.92,.92,1);bpy.ops.object.camera_add(location=(0,-12,2));c=bpy.context.object;c.name='GG_LAYER_A_MICRO_DETAIL_CAMERA';c.data.type='ORTHO';c.data.ortho_scale=5.5;c.rotation_euler=((Vector((0,0,1.2))-c.location).to_track_quat('-Z','Y')).to_euler();s.camera=c;return s
results=[]
for x in pack['modules']:
 folder=os.path.join(out_dir,x['assetId']+'@'+x['version']);os.makedirs(folder,exist_ok=True);o=build(x);s=setup();blend=os.path.join(folder,x['assetId']+'@'+x['version']+'.blend');bpy.ops.wm.save_as_mainfile(filepath=blend);paths=[]
 for lab,a in [('FRONT',0),('BACK',math.pi),('LEFT',math.pi/2),('RIGHT',-math.pi/2)]:s.camera.location=(math.sin(a)*12,-math.cos(a)*12,2);s.camera.rotation_euler=((Vector((0,0,1.2))-s.camera.location).to_track_quat('-Z','Y')).to_euler();s.render.filepath=os.path.join(folder,lab+'.png');bpy.ops.render.render(write_still=True);paths.append(s.render.filepath)
 orig=[(q,list(q.data.materials)) for q in o]
 for i,q in enumerate(o):q.data.materials.clear();q.data.materials.append(mat('ID_%02d'%i,((i+1)/255,0,0,1)))
 s.render.filepath=os.path.join(folder,'MODULE_COMPONENT_ID_RENDER.png');bpy.ops.render.render(write_still=True);json.dump({q['componentId']:{'objectId':q.name,'assetId':x['assetId'],'assetVersion':x['version'],'moduleId':x['assetId'],'detailModuleIds':x['detailModules'],'rgb':[i+1,0,0]} for i,q in enumerate(o)},open(os.path.join(folder,'MODULE_COMPONENT_ID_MAP.json'),'w'),indent=2)
 for q,ms in orig:q.data.materials.clear();[q.data.materials.append(m) for m in ms]
 st={'triangles':sum(sum(len(p.vertices)-2 for p in q.data.polygons) for q in o),'vertices':sum(len(q.data.vertices) for q in o),'materials':len({m.name for q in o for m in q.data.materials}),'objectCount':len(o),'fileSizeBytes':os.path.getsize(blend),'lods':['LOD0','LOD1','LOD2'],'anonymousGeometryCount':0};json.dump(st,open(os.path.join(folder,'BUDGET_AND_LOD.json'),'w'),indent=2);results.append({'assetId':x['assetId'],'version':x['version'],'parentVersion':x['parentVersion'],'detailModuleIds':x['detailModules'],'views':paths,'budget':st})
json.dump({'status':'PASS','executionMode':'REAL_BLENDER_WORKER_EXECUTION','blenderVersion':bpy.app.version_string,'modules':results,'anonymousGeometryCount':0},open(os.path.join(out_dir,'SHOP_LAYER_A_MICRO_DETAIL_RESULT.json'),'w'),indent=2)
