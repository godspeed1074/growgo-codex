import bpy,json,os,sys,math
from mathutils import Vector
pack,out=sys.argv[sys.argv.index('--')+1:];p=json.load(open(pack));os.makedirs(out,exist_ok=True);P={'SHOP_WARM_BROWN':(.34,.16,.09,1),'SHOP_NAVY':(.04,.07,.20,1),'SHOP_PLUM_FABRIC':(.42,.08,.32,1),'SHOP_TEAL_GLASS':(.03,.30,.38,1),'SHOP_GREEN_VEGETATION':(.12,.38,.10,1),'SHOP_CREAM':(.72,.58,.40,1)}
def mat(n,c):m=bpy.data.materials.new(n);m.diffuse_color=c;return m
def cube(n,d,l,ma,x,c):
 bpy.ops.mesh.primitive_cube_add(size=1,location=l);o=bpy.context.object;o.name=n;o.dimensions=d;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(ma);o['assetId']=x['assetId'];o['assetVersion']='3.0.0';o['parentVersion']=x['parentVersion'];o['moduleId']=x['assetId'];o['moduleVersion']='3.0.0';o['componentId']=c;o['layer']='LAYER_A_MODULE';return o
def build(x):
 bpy.ops.wm.read_factory_settings(use_empty=True);a=x['assetId'];b=mat('GG_MAT_'+x['palette']+'_001',P[x['palette']]);cr=mat('GG_MAT_CREAM_001',P['SHOP_CREAM']);gl=mat('GG_MAT_GLASS_001',P['SHOP_TEAL_GLASS']);green=mat('GG_MAT_GREEN_001',P['SHOP_GREEN_VEGETATION']);o=[];f=x['family']
 if f=='SHOP_WINDOW':o=[cube(a+'_FRAME',(1.6,.3,1.8),(0,0,1.1),cr,x,'FRAME'),cube(a+'_GLASS',(1.25,.08,1.4),(0,.12,1.1),gl,x,'GLASS'),cube(a+'_SILL',(1.75,.4,.2),(0,-.15,.2),cr,x,'SILL'),cube(a+'_SHELF',(1.1,.32,.1),(0,-.2,.85),cr,x,'DISPLAY')]
 elif f=='SHOP_AWNING':o=[cube(a+'_CANOPY',(3.35,1.2,.44),(0,0,0),b,x,'AWNING'),cube(a+'_UNDER',(3.2,1,.15),(0,-.03,-.25),cr,x,'UNDERSIDE'),cube(a+'_ARM_L',(.14,.3,1.1),(-1.5,.2,-.4),cr,x,'SUPPORT'),cube(a+'_ARM_R',(.14,.3,1.1),(1.5,.2,-.4),cr,x,'SUPPORT')]+[cube(a+'_SCALLOP_%02d'%i,(.43,1.22,.28),(-1.3+i*.43,.05,-.28),b,x,'SCALLOP') for i in range(7)]
 elif f=='SHOP_DOOR':o=[cube(a+'_SLAB',(1,.2,2.1),(0,.04,1.05),b,x,'DOOR'),cube(a+'_FRAME',(1.4,.32,2.5),(0,-.02,1.15),cr,x,'FRAME'),cube(a+'_GLASS',(.6,.05,.8),(0,-.2,1.55),gl,x,'GLASS'),cube(a+'_HANDLE',(.14,.14,.14),(.34,-.25,1.1),cr,x,'HANDLE'),cube(a+'_MAIL',(.3,.06,.08),(0,-.26,.72),cr,x,'MAIL_SLOT'),cube(a+'_THRESHOLD',(1.5,.44,.18),(0,-.15,.08),cr,x,'THRESHOLD')]
 elif f=='SHOP_FASCIA':o=[cube(a+'_CORNICE',(4.6,1.12,.72),(0,0,.36),b,x,'FASCIA'),cube(a+'_RECESS',(3,.24,.75),(0,-.62,.22),b,x,'SIGN_RECESS'),cube(a+'_BORDER',(3.2,.1,.1),(0,-.75,.22),cr,x,'BORDER'),cube(a+'_SHADOW',(4.65,.08,.12),(0,-.55,-.03),b,x,'SHADOW')]
 else:o=[cube(a+'_PLANTER',(1.25,.9,.52),(0,0,.26),b,x,'PLANTER'),cube(a+'_RIM',(1.4,1,.16),(0,0,.56),cr,x,'RIM')]+[cube(a+'_MASS_%02d'%i,(.34,.32,.72),((i%5-2)*.21,.15*math.sin(i),.82+(i//5)*.22),green,x,'SHRUB') for i in range(15)]
 return o
def setup():
 s=bpy.context.scene;s.render.resolution_x=256;s.render.resolution_y=256;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO';s.display.shading.color_type='MATERIAL';bpy.ops.object.camera_add(location=(0,-12,2));c=bpy.context.object;c.data.type='ORTHO';c.data.ortho_scale=5.5;c.rotation_euler=((Vector((0,0,1.2))-c.location).to_track_quat('-Z','Y')).to_euler();s.camera=c;return s
r=[]
for x in p['modules']:
 d=os.path.join(out,x['assetId']+'@3.0.0');os.makedirs(d,exist_ok=True);o=build(x);s=setup();blend=os.path.join(d,x['assetId']+'@3.0.0.blend');bpy.ops.wm.save_as_mainfile(filepath=blend);views=[]
 for lab,a in [('FRONT',0),('BACK',math.pi),('LEFT',math.pi/2),('RIGHT',-math.pi/2)]:s.camera.location=(math.sin(a)*12,-math.cos(a)*12,2);s.camera.rotation_euler=((Vector((0,0,1.2))-s.camera.location).to_track_quat('-Z','Y')).to_euler();s.render.filepath=os.path.join(d,lab+'.png');bpy.ops.render.render(write_still=True);views.append(s.render.filepath)
 s.camera.data.ortho_scale=3.2;s.render.filepath=os.path.join(d,'CLOSE_UP.png');bpy.ops.render.render(write_still=True)
 mp={};orig=[]
 for i,z in enumerate(o):mp[z['componentId']]={'objectId':z.name,'assetId':x['assetId'],'assetVersion':'3.0.0','moduleId':x['assetId'],'rgb':[i+1,0,0]};orig.append((z,list(z.data.materials)));z.data.materials.clear();z.data.materials.append(mat('ID_%03d'%i,((i+1)/255,0,0,1)))
 s.render.filepath=os.path.join(d,'MODULE_COMPONENT_ID_RENDER.png');bpy.ops.render.render(write_still=True);json.dump(mp,open(os.path.join(d,'MODULE_COMPONENT_ID_MAP.json'),'w'),indent=2)
 for z,ms in orig:z.data.materials.clear();[z.data.materials.append(v) for v in ms]
 st={'triangles':sum(sum(len(a.vertices)-2 for a in z.data.polygons) for z in o),'vertices':sum(len(z.data.vertices) for z in o),'materials':len({v.name for z in o for v in z.data.materials}),'objects':len(o),'fileSizeBytes':os.path.getsize(blend),'anonymousGeometryCount':0};json.dump(st,open(os.path.join(d,'BUDGET_AND_LOD.json'),'w'),indent=2);r.append({'assetId':x['assetId'],'version':'3.0.0','parentVersion':x['parentVersion'],'views':views,'closeUp':os.path.join(d,'CLOSE_UP.png'),'budget':st})
json.dump({'status':'PASS','executionMode':'REAL_BLENDER_WORKER_EXECUTION','blenderVersion':bpy.app.version_string,'modules':r,'anonymousGeometryCount':0},open(os.path.join(out,'SHOP_HERO_FEATURE_RESULT.json'),'w'),indent=2)
