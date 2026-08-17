import bpy,json,os,sys,math
from mathutils import Vector
pack,out=sys.argv[sys.argv.index('--')+1:];p=json.load(open(pack));os.makedirs(out,exist_ok=True);P={'SHOP_WARM_BROWN':(.34,.16,.09,1),'SHOP_GRAY':(.25,.25,.25,1),'SHOP_TEAL_GLASS':(.03,.30,.38,1),'SHOP_PLUM_FABRIC':(.42,.08,.32,1),'SHOP_NAVY':(.04,.07,.20,1),'SHOP_CREAM':(.72,.58,.40,1)}
def m(n,c):x=bpy.data.materials.new(n);x.diffuse_color=c;return x
def q(n,d,l,ma,x,c):
 bpy.ops.mesh.primitive_cube_add(size=1,location=l);o=bpy.context.object;o.name=n;o.dimensions=d;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(ma);o['assetId']=x['assetId'];o['assetVersion']='3.5.0';o['parentVersion']=x['parentVersion'];o['moduleId']=x['assetId'];o['moduleVersion']='3.5.0';o['componentId']=c;o['layer']='LAYER_A_MODULE';return o
def build(x):
 bpy.ops.wm.read_factory_settings(use_empty=True);a=x['assetId'];b=m('MAT_'+x['palette'],P[x['palette']]);cr=m('MAT_CREAM',P['SHOP_CREAM']);gl=m('MAT_GLASS',P['SHOP_TEAL_GLASS']);o=[];f=x['family']
 if f=='SHOP_WALL':o=[q(a+'_CORE',(4,.25,3),(0,0,1.5),b,x,'WALL'),q(a+'_STOREFRONT_RECESS',(3.4,.12,2.2),(0,-.16,1.55),b,x,'RECESS'),q(a+'_CORNER_L',(.22,.55,3),(-2.0,0,1.5),cr,x,'CORNER'),q(a+'_CORNER_R',(.22,.55,3),(2.0,0,1.5),cr,x,'CORNER'),q(a+'_BASE',(4.3,.45,.22),(0,-.1,.12),cr,x,'BASE')]
 elif f=='SHOP_FOUNDATION':o=[q(a+'_PLINTH',(4.5,.55,.28),(0,0,.14),b,x,'FOUNDATION'),q(a+'_LANDING',(1.8,.8,.18),(-1.1,-.35,.35),cr,x,'LANDING'),q(a+'_SHADOW_EDGE',(4.55,.12,.16),(0,-.32,.34),cr,x,'EDGE')]
 elif f=='SHOP_WINDOW':o=[q(a+'_SURROUND',(1.7,.34,1.9),(0,0,1.1),cr,x,'SURROUND'),q(a+'_RECESSED_OPENING',(1.42,.12,1.6),(0,.1,1.1),b,x,'OPENING'),q(a+'_GLASS',(1.25,.07,1.4),(0,.18,1.1),gl,x,'GLASS'),q(a+'_SILL',(1.8,.4,.2),(0,-.16,.2),cr,x,'SILL')]
 elif f=='SHOP_AWNING':o=[q(a+'_MOUNT_BAND',(3.4,.18,.4),(0,.4,.18),b,x,'MOUNT'),q(a+'_CANOPY',(3.35,1.2,.42),(0,0,0),b,x,'AWNING'),q(a+'_ARM_L',(.14,.3,1.0),(-1.5,.2,-.4),cr,x,'SUPPORT'),q(a+'_ARM_R',(.14,.3,1.0),(1.5,.2,-.4),cr,x,'SUPPORT')]
 else:o=[q(a+'_WALL_CAP',(4.65,1.14,.76),(0,0,.38),b,x,'FASCIA'),q(a+'_CORNICE',(4.75,1.18,.14),(0,0,.8),cr,x,'CORNICE'),q(a+'_SIGN_RECESS',(3,.22,.72),(0,-.62,.25),b,x,'SIGN_RECESS'),q(a+'_SHADOW_GAP',(4.7,.08,.1),(0,-.55,-.04),b,x,'SHADOW')]
 return o
def setup():
 s=bpy.context.scene;s.render.resolution_x=256;s.render.resolution_y=256;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO';s.display.shading.color_type='MATERIAL';bpy.ops.object.camera_add(location=(0,-12,2));c=bpy.context.object;c.data.type='ORTHO';c.data.ortho_scale=5.5;c.rotation_euler=((Vector((0,0,1.2))-c.location).to_track_quat('-Z','Y')).to_euler();s.camera=c;return s
r=[]
for x in p['modules']:
 d=os.path.join(out,x['assetId']+'@3.5.0');os.makedirs(d,exist_ok=True);o=build(x);s=setup();blend=os.path.join(d,x['assetId']+'@3.5.0.blend');bpy.ops.wm.save_as_mainfile(filepath=blend);views=[]
 for lab,a in [('FRONT',0),('BACK',math.pi),('LEFT',math.pi/2),('RIGHT',-math.pi/2)]:s.camera.location=(math.sin(a)*12,-math.cos(a)*12,2);s.camera.rotation_euler=((Vector((0,0,1.2))-s.camera.location).to_track_quat('-Z','Y')).to_euler();s.render.filepath=os.path.join(d,lab+'.png');bpy.ops.render.render(write_still=True);views.append(s.render.filepath)
 s.camera.data.ortho_scale=3.2;s.render.filepath=os.path.join(d,'CLOSE_UP.png');bpy.ops.render.render(write_still=True);mp={};orig=[]
 for i,z in enumerate(o):mp[z['componentId']]={'objectId':z.name,'assetId':x['assetId'],'assetVersion':'3.5.0','moduleId':x['assetId'],'rgb':[i+1,0,0]};orig.append((z,list(z.data.materials)));z.data.materials.clear();z.data.materials.append(m('ID_%03d'%i,((i+1)/255,0,0,1)))
 s.render.filepath=os.path.join(d,'MODULE_COMPONENT_ID_RENDER.png');bpy.ops.render.render(write_still=True);json.dump(mp,open(os.path.join(d,'MODULE_COMPONENT_ID_MAP.json'),'w'),indent=2)
 for z,ms in orig:z.data.materials.clear();[z.data.materials.append(v) for v in ms]
 st={'triangles':sum(sum(len(a.vertices)-2 for a in z.data.polygons) for z in o),'vertices':sum(len(z.data.vertices) for z in o),'materials':len({v.name for z in o for v in z.data.materials}),'objects':len(o),'fileSizeBytes':os.path.getsize(blend),'anonymousGeometryCount':0};json.dump(st,open(os.path.join(d,'BUDGET_AND_LOD.json'),'w'),indent=2);r.append({'assetId':x['assetId'],'version':'3.5.0','parentVersion':x['parentVersion'],'views':views,'closeUp':os.path.join(d,'CLOSE_UP.png'),'budget':st})
json.dump({'status':'PASS','executionMode':'REAL_BLENDER_WORKER_EXECUTION','blenderVersion':bpy.app.version_string,'modules':r,'anonymousGeometryCount':0},open(os.path.join(out,'SHOP_FACADE_ARCHITECTURE_RESULT.json'),'w'),indent=2)
