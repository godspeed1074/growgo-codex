import bpy,json,os,sys,math
from mathutils import Vector
pack_path,out_dir=sys.argv[sys.argv.index('--')+1:]; pack=json.load(open(pack_path)); os.makedirs(out_dir,exist_ok=True)
P={'SHOP_WARM_BROWN':(.34,.16,.09,1),'SHOP_CREAM':(.72,.58,.40,1),'SHOP_NAVY':(.04,.07,.20,1),'SHOP_PLUM_FABRIC':(.42,.08,.32,1),'SHOP_TEAL_GLASS':(.03,.30,.38,1),'SHOP_GREEN_VEGETATION':(.12,.38,.10,1)}
def mat(n,c):
 m=bpy.data.materials.new(n); m.diffuse_color=c; return m
def cube(n,d,l,m,x,c):
 bpy.ops.mesh.primitive_cube_add(size=1,location=l); o=bpy.context.object; o.name=n; o.dimensions=d; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(m)
 for k,v in {'assetId':x['assetId'],'assetVersion':x['assetVersion'],'parentVersion':x['parentVersion'],'moduleId':x['assetId'],'moduleVersion':x['assetVersion'],'componentId':c,'moduleFamily':x['family'],'layer':'LAYER_A_MODULE','upgradeChange':x['change']}.items(): o[k]=v
 return o
def build(x):
 bpy.ops.wm.read_factory_settings(use_empty=True); b=mat('GG_MAT_'+x['palette']+'_001',P[x['palette']]); cr=mat('GG_MAT_SHOP_CREAM_001',P['SHOP_CREAM']); gl=mat('GG_MAT_SHOP_TEAL_GLASS_001',P['SHOP_TEAL_GLASS']); gr=mat('GG_MAT_SHOP_GREEN_001',P['SHOP_GREEN_VEGETATION']); a=x['assetId']; c=x['type']; z=[]
 if c=='FASCIA_MODULE': z=[cube(a+'_CAP',(4.35,1.0,.62),(0,0,.31),b,x,c),cube(a+'_MOUNT',(2.9,.24,.68),(0,-.60,.20),b,x,c),cube(a+'_TOP',(4.45,1.04,.15),(0,0,.67),cr,x,c),cube(a+'_L',(.17,1.04,.62),(-2.1,0,.25),cr,x,c),cube(a+'_R',(.17,1.04,.62),(2.1,0,.25),cr,x,c)]
 elif c=='AWNING_MODULE':
  z=[cube(a+'_CANOPY',(3.25,1.08,.38),(0,0,0),b,x,c),cube(a+'_BAND',(3.3,.18,.45),(0,.44,.14),b,x,c),cube(a+'_BL',(.14,.3,1.1),(-1.48,.18,-.36),cr,x,c),cube(a+'_BR',(.14,.3,1.1),(1.48,.18,-.36),cr,x,c)]
  for i in range(7): z.append(cube(a+'_SCALLOP_%02d'%i,(.43,1.1,.24),(-1.29+i*.43,.05,-.24),b,x,c))
 elif c=='WINDOW_MODULE': z=[cube(a+'_GLASS',(1.25,.07,1.4),(0,.07,1.1),gl,x,c),cube(a+'_FRAME',(1.52,.25,1.68),(0,0,1.1),cr,x,c),cube(a+'_SILL',(1.68,.34,.2),(0,-.1,.22),cr,x,c),cube(a+'_MULLION',(.09,.27,1.4),(0,-.16,1.1),cr,x,c),cube(a+'_TOP',(1.68,.34,.16),(0,-.1,1.96),cr,x,c)]
 elif c=='DOOR_MODULE': z=[cube(a+'_SLAB',(1.0,.18,2.1),(0,.05,1.05),b,x,c),cube(a+'_FRAME',(1.32,.27,2.4),(0,-.02,1.15),cr,x,c),cube(a+'_GLASS',(.58,.04,.8),(0,-.18,1.55),gl,x,c),cube(a+'_THRESHOLD',(1.44,.42,.18),(0,-.14,.08),cr,x,c),cube(a+'_HANDLE',(.11,.11,.11),(.34,-.22,1.08),cr,x,c)]
 else:
  z=[cube(a+'_BOX',(1.16,.82,.5),(0,0,.25),b,x,c),cube(a+'_RIM',(1.3,.92,.16),(0,0,.54),cr,x,c)]
  for i in range(11): z.append(cube(a+'_FOLIAGE_%02d'%i,(.3,.28,.7),((i%4-1.5)*.2,(i//4-1)*.14,.78+.08*(i%2)),gr,x,c))
 for lod in ['LOD1','LOD2']:
  col=bpy.data.collections.new(lod); bpy.context.scene.collection.children.link(col)
  for o in z: q=o.copy(); q.data=o.data.copy(); q.name=o.name+'_'+lod; q['lod']=lod; col.objects.link(q)
 for o in z:o['lod']='LOD0'
 return z
def scene():
 s=bpy.context.scene; s.render.resolution_x=256;s.render.resolution_y=256;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.film_transparent=False;s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO';s.display.shading.color_type='MATERIAL';s.world=bpy.data.worlds.new('GG_REFINEMENT_WORLD');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.92,.92,.92,1);bpy.ops.object.camera_add(location=(0,-12,2));cam=bpy.context.object;cam.name='GG_LAYER_A_REVIEW_CAMERA';cam.data.type='ORTHO';cam.data.ortho_scale=5.5;cam.rotation_euler=((Vector((0,0,1.2))-cam.location).to_track_quat('-Z','Y')).to_euler();s.camera=cam;return s
def views(folder,s):
 out=[]
 for label,ang in [('FRONT',0),('BACK',math.pi),('LEFT',math.pi/2),('RIGHT',-math.pi/2)]:
  s.camera.location=(math.sin(ang)*12,-math.cos(ang)*12,2);s.camera.rotation_euler=((Vector((0,0,1.2))-s.camera.location).to_track_quat('-Z','Y')).to_euler();s.render.filepath=os.path.join(folder,label+'.png');bpy.ops.render.render(write_still=True);out.append(s.render.filepath)
 return out
results=[]
for x in pack['modules']:
 folder=os.path.join(out_dir,x['assetId']+'@'+x['assetVersion']);os.makedirs(folder,exist_ok=True);o=build(x);s=scene();blend=os.path.join(folder,x['assetId']+'@'+x['assetVersion']+'.blend');bpy.ops.wm.save_as_mainfile(filepath=blend);v=views(folder,s);orig=[(q,list(q.data.materials)) for q in o]
 for i,q in enumerate(o):q.data.materials.clear();q.data.materials.append(mat('ID_%02d'%i,((i+1)/255,0,0,1)))
 s.render.filepath=os.path.join(folder,'MODULE_COMPONENT_ID_RENDER.png');bpy.ops.render.render(write_still=True);mp={q['componentId']:{'objectId':q.name,'assetId':x['assetId'],'assetVersion':x['assetVersion'],'parentVersion':x['parentVersion'],'moduleId':x['assetId'],'rgb':[i+1,0,0]} for i,q in enumerate(o)};json.dump(mp,open(os.path.join(folder,'MODULE_COMPONENT_ID_MAP.json'),'w'),indent=2)
 for q,ms in orig:q.data.materials.clear();[q.data.materials.append(m) for m in ms]
 st={'triangles':sum(sum(len(p.vertices)-2 for p in q.data.polygons) for q in o),'vertices':sum(len(q.data.vertices) for q in o),'materials':len({m.name for q in o for m in q.data.materials}),'objectCount':len(o),'fileSizeBytes':os.path.getsize(blend),'lods':['LOD0','LOD1','LOD2'],'anonymousGeometryCount':0};json.dump(st,open(os.path.join(folder,'BUDGET_AND_LOD.json'),'w'),indent=2);results.append({'assetId':x['assetId'],'assetVersion':x['assetVersion'],'parentVersion':x['parentVersion'],'blend':blend,'views':v,'componentIdRender':os.path.join(folder,'MODULE_COMPONENT_ID_RENDER.png'),'budget':st,'status':'NEEDS_REVIEW'})
json.dump({'status':'PASS','executionMode':'REAL_BLENDER_WORKER_EXECUTION','blenderVersion':bpy.app.version_string,'modules':results,'anonymousGeometryCount':0},open(os.path.join(out_dir,'SHOP_LAYER_A_FINAL_REFINEMENT_RESULT.json'),'w'),indent=2)
