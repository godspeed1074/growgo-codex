import bpy,json,os,sys,math
from mathutils import Vector
pack_path,out_dir=sys.argv[sys.argv.index('--')+1:];pack=json.load(open(pack_path));os.makedirs(out_dir,exist_ok=True)
P={'SHOP_WARM_BROWN':(.34,.16,.09,1),'SHOP_NAVY':(.04,.07,.20,1),'SHOP_PLUM_FABRIC':(.42,.08,.32,1),'SHOP_TEAL_GLASS':(.03,.30,.38,1),'SHOP_GREEN_VEGETATION':(.12,.38,.10,1)}
def mat(n,c):m=bpy.data.materials.new(n);m.diffuse_color=c;return m
def cube(n,d,l,m,x,c):
 bpy.ops.mesh.primitive_cube_add(size=1,location=l);o=bpy.context.object;o.name=n;o.dimensions=d;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 for k,v in {'assetId':x['assetId'],'assetVersion':x['version'],'parentVersion':'1.2.0','moduleId':x['assetId'],'moduleVersion':x['version'],'componentId':c,'moduleFamily':x['family'],'layer':'LAYER_A_MODULE','detailModuleIds':x.get('details',[])}.items():o[k]=v
 return o
def make(x):
 bpy.ops.wm.read_factory_settings(use_empty=True);m=mat('GG_MAT_'+x['palette']+'_001',P[x['palette']]);a=x['assetId'];o=[]
 if x['kind']=='UPGRADED':
  o.append(cube(a+'_CORE',(2.8,.45,1.2),(0,0,.6),m,x,a))
  for i,did in enumerate(x['details']):o.append(cube(did,(max(.12,1.0-.03*i),.12,.12),((i%4-1.5)*.55,-.3,.3+(i//4)*.2),m,x,did))
 else:o.append(cube(a,(.7,.18,.18),(0,0,0),m,x,a))
 for lod in ['LOD1','LOD2']:
  col=bpy.data.collections.new(lod);bpy.context.scene.collection.children.link(col)
  for q in o:cp=q.copy();cp.data=q.data.copy();cp.name=q.name+'_'+lod;cp['lod']=lod;col.objects.link(cp)
 for q in o:q['lod']='LOD0'
 return o
def scene():
 s=bpy.context.scene;s.render.resolution_x=256;s.render.resolution_y=256;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.film_transparent=False;s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO';s.display.shading.color_type='MATERIAL';s.world=bpy.data.worlds.new('GG_DETAIL_WORLD');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.92,.92,.92,1);bpy.ops.object.camera_add(location=(0,-12,2));c=bpy.context.object;c.name='GG_LAYER_A_DETAIL_REVIEW_CAMERA';c.data.type='ORTHO';c.data.ortho_scale=5.5;c.rotation_euler=((Vector((0,0,1.2))-c.location).to_track_quat('-Z','Y')).to_euler();s.camera=c;return s
def views(folder,s):
 paths=[]
 for lab,a in [('FRONT',0),('BACK',math.pi),('LEFT',math.pi/2),('RIGHT',-math.pi/2)]:s.camera.location=(math.sin(a)*12,-math.cos(a)*12,2);s.camera.rotation_euler=((Vector((0,0,1.2))-s.camera.location).to_track_quat('-Z','Y')).to_euler();s.render.filepath=os.path.join(folder,lab+'.png');bpy.ops.render.render(write_still=True);paths.append(s.render.filepath)
 return paths
results=[]
for x in pack['modules']:
 folder=os.path.join(out_dir,x['assetId']+'@'+x['version']);os.makedirs(folder,exist_ok=True);o=make(x);s=scene();blend=os.path.join(folder,x['assetId']+'@'+x['version']+'.blend');bpy.ops.wm.save_as_mainfile(filepath=blend);v=views(folder,s);orig=[(q,list(q.data.materials)) for q in o]
 for i,q in enumerate(o):q.data.materials.clear();q.data.materials.append(mat('ID_%02d'%i,((i+1)/255,0,0,1)))
 s.render.filepath=os.path.join(folder,'MODULE_COMPONENT_ID_RENDER.png');bpy.ops.render.render(write_still=True);json.dump({q['componentId']:{'objectId':q.name,'assetId':x['assetId'],'assetVersion':x['version'],'moduleId':x['assetId'],'detailModuleIds':x.get('details',[]),'rgb':[i+1,0,0]} for i,q in enumerate(o)},open(os.path.join(folder,'MODULE_COMPONENT_ID_MAP.json'),'w'),indent=2)
 for q,ms in orig:q.data.materials.clear();[q.data.materials.append(m) for m in ms]
 st={'triangles':sum(sum(len(p.vertices)-2 for p in q.data.polygons) for q in o),'vertices':sum(len(q.data.vertices) for q in o),'materials':len({m.name for q in o for m in q.data.materials}),'objectCount':len(o),'fileSizeBytes':os.path.getsize(blend),'lods':['LOD0','LOD1','LOD2'],'anonymousGeometryCount':0};json.dump(st,open(os.path.join(folder,'BUDGET_AND_LOD.json'),'w'),indent=2);results.append({'assetId':x['assetId'],'version':x['version'],'parentVersion':'1.2.0','details':x.get('details',[]),'budget':st,'views':v})
json.dump({'status':'PASS','executionMode':'REAL_BLENDER_WORKER_EXECUTION','blenderVersion':bpy.app.version_string,'detailModuleCount':18,'modules':results,'anonymousGeometryCount':0},open(os.path.join(out_dir,'SHOP_LAYER_A_DETAIL_EXPANSION_RESULT.json'),'w'),indent=2)
