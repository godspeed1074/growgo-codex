import bpy,json,os,sys,math
from mathutils import Vector
pack,out=sys.argv[sys.argv.index('--')+1:];p=json.load(open(pack));os.makedirs(out,exist_ok=True);P={'SHOP_WARM_BROWN':(.34,.16,.09,1),'SHOP_NAVY':(.04,.07,.20,1),'SHOP_PLUM_FABRIC':(.42,.08,.32,1),'SHOP_TEAL_GLASS':(.03,.30,.38,1),'SHOP_GREEN_VEGETATION':(.12,.38,.10,1),'SHOP_GRAY':(.25,.25,.25,1),'SHOP_CREAM':(.72,.58,.40,1)}
def m(n,c):x=bpy.data.materials.new(n);x.diffuse_color=c;return x
def q(n,d,l,ma,x,c):
 bpy.ops.mesh.primitive_cube_add(size=1,location=l);o=bpy.context.object;o.name=n;o.dimensions=d;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(ma);o['assetId']=x['assetId'];o['assetVersion']='2.5.0';o['parentVersion']=x['parentVersion'];o['moduleId']=x['assetId'];o['moduleVersion']='2.5.0';o['componentId']=c;o['layer']='LAYER_A_MODULE';return o
def build(x):
 bpy.ops.wm.read_factory_settings(use_empty=True);a=x['assetId'];b=m('GG_MAT_'+x['palette']+'_001',P[x['palette']]);cr=m('GG_MAT_CREAM_001',P['SHOP_CREAM']);gl=m('GG_MAT_GLASS_001',P['SHOP_TEAL_GLASS']);green=m('GG_MAT_GREEN_001',P['SHOP_GREEN_VEGETATION']);o=[];f=x['family']
 if f=='SHOP_WALL':o=[q(a+'_PLANE',(4,.24,3),(0,0,1.5),b,x,'WALL'),q(a+'_RECESS',(2.8,.08,2.3),(0,-.16,1.55),b,x,'PANEL_BREAK'),q(a+'_CORNER_L',(.2,.5,3),(-2.0,0,1.5),cr,x,'CORNER'),q(a+'_CORNER_R',(.2,.5,3),(2.0,0,1.5),cr,x,'CORNER'),q(a+'_BASE',(4.25,.42,.22),(0,-.08,.12),cr,x,'BASE_TRIM')]
 elif f=='SHOP_FASCIA':o=[q(a+'_OVERHANG',(4.55,1.08,.7),(0,0,.35),b,x,'FASCIA'),q(a+'_RECESS',(2.95,.22,.72),(0,-.6,.22),b,x,'SIGN_RECESS'),q(a+'_BORDER',(3.15,.1,.1),(0,-.72,.22),cr,x,'SIGN_BORDER'),q(a+'_SHADOW',(4.6,.08,.12),(0,-.54,-.03),b,x,'SHADOW_GAP')]
 elif f=='SHOP_AWNING':
  o=[q(a+'_FABRIC',(3.3,1.12,.42),(0,0,0),b,x,'AWNING'),q(a+'_UNDERSIDE',(3.2,.94,.14),(0,-.03,-.24),cr,x,'UNDERSIDE'),q(a+'_ARM_L',(.14,.3,1.1),(-1.5,.2,-.4),cr,x,'SUPPORT'),q(a+'_ARM_R',(.14,.3,1.1),(1.5,.2,-.4),cr,x,'SUPPORT')]
  for i in range(7):o.append(q(a+'_SCALLOP_%02d'%i,(.43,1.14,.26),(-1.3+i*.43,.04,-.27),b,x,'SCALLOP'))
 elif f=='SHOP_WINDOW':o=[q(a+'_OUTER',(1.58,.3,1.75),(0,0,1.1),cr,x,'FRAME'),q(a+'_GLASS',(1.25,.08,1.4),(0,.1,1.1),gl,x,'WINDOW'),q(a+'_SILL',(1.72,.38,.2),(0,-.13,.2),cr,x,'SILL'),q(a+'_SHELF',(1.05,.32,.1),(0,-.2,.84),cr,x,'DISPLAY_SHELF')]
 elif f=='SHOP_DOOR':o=[q(a+'_SLAB',(1,.2,2.1),(0,.04,1.05),b,x,'DOOR'),q(a+'_FRAME',(1.38,.3,2.48),(0,-.02,1.15),cr,x,'FRAME'),q(a+'_GLASS',(.58,.05,.8),(0,-.2,1.55),gl,x,'GLASS'),q(a+'_HANDLE',(.13,.13,.13),(.34,-.24,1.1),cr,x,'HANDLE'),q(a+'_MAIL_SLOT',(.3,.06,.08),(0,-.25,.72),cr,x,'MAIL_SLOT'),q(a+'_THRESHOLD',(1.5,.42,.18),(0,-.14,.08),cr,x,'THRESHOLD')]
 elif f=='SHOP_FOUNDATION':o=[q(a+'_BASE',(4.45,.52,.26),(0,0,.13),b,x,'FOUNDATION'),q(a+'_STEP',(1.55,.72,.2),(-1.1,-.32,.32),cr,x,'STEP'),q(a+'_EDGE',(4.55,.14,.18),(0,-.3,.3),cr,x,'EDGE')]
 else:
  o=[q(a+'_PLANTER',(1.22,.86,.5),(0,0,.25),b,x,'PLANTER'),q(a+'_RIM',(1.38,.96,.15),(0,0,.55),cr,x,'RIM')]
  for i in range(15):o.append(q(a+'_MASS_%02d'%i,(.32,.3,.68),((i%5-2)*.2,.14*math.sin(i),.8+(i//5)*.21),green,x,'SHRUB'))
 return o
def setup():
 s=bpy.context.scene;s.render.resolution_x=256;s.render.resolution_y=256;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO';s.display.shading.color_type='MATERIAL';bpy.ops.object.camera_add(location=(0,-12,2));c=bpy.context.object;c.name='GG_PAPERCUT_REVIEW_CAMERA';c.data.type='ORTHO';c.data.ortho_scale=5.5;c.rotation_euler=((Vector((0,0,1.2))-c.location).to_track_quat('-Z','Y')).to_euler();s.camera=c;return s
r=[]
for x in p['modules']:
 d=os.path.join(out,x['assetId']+'@2.5.0');os.makedirs(d,exist_ok=True);o=build(x);s=setup();blend=os.path.join(d,x['assetId']+'@2.5.0.blend');bpy.ops.wm.save_as_mainfile(filepath=blend);views=[]
 for lab,a in [('FRONT',0),('BACK',math.pi),('LEFT',math.pi/2),('RIGHT',-math.pi/2)]:s.camera.location=(math.sin(a)*12,-math.cos(a)*12,2);s.camera.rotation_euler=((Vector((0,0,1.2))-s.camera.location).to_track_quat('-Z','Y')).to_euler();s.render.filepath=os.path.join(d,lab+'.png');bpy.ops.render.render(write_still=True);views.append(s.render.filepath)
 s.camera.data.ortho_scale=3.2;s.render.filepath=os.path.join(d,'CLOSE_UP.png');bpy.ops.render.render(write_still=True);s.camera.data.ortho_scale=5.5
 orig=[];mp={}
 for i,z in enumerate(o):mp[z['componentId']]={'objectId':z.name,'assetId':x['assetId'],'assetVersion':'2.5.0','moduleId':x['assetId'],'rgb':[i+1,0,0]};orig.append((z,list(z.data.materials)));z.data.materials.clear();z.data.materials.append(m('ID_%03d'%i,((i+1)/255,0,0,1)))
 s.render.filepath=os.path.join(d,'MODULE_COMPONENT_ID_RENDER.png');bpy.ops.render.render(write_still=True);json.dump(mp,open(os.path.join(d,'MODULE_COMPONENT_ID_MAP.json'),'w'),indent=2)
 for z,ms in orig:z.data.materials.clear();[z.data.materials.append(v) for v in ms]
 st={'triangles':sum(sum(len(a.vertices)-2 for a in z.data.polygons) for z in o),'vertices':sum(len(z.data.vertices) for z in o),'materials':len({v.name for z in o for v in z.data.materials}),'objects':len(o),'fileSizeBytes':os.path.getsize(blend),'anonymousGeometryCount':0};json.dump(st,open(os.path.join(d,'BUDGET_AND_LOD.json'),'w'),indent=2);r.append({'assetId':x['assetId'],'version':'2.5.0','parentVersion':x['parentVersion'],'views':views,'closeUp':os.path.join(d,'CLOSE_UP.png'),'budget':st})
json.dump({'status':'PASS','executionMode':'REAL_BLENDER_WORKER_EXECUTION','blenderVersion':bpy.app.version_string,'modules':r,'anonymousGeometryCount':0},open(os.path.join(out,'SHOP_HERO_PAPERCUT_RESULT.json'),'w'),indent=2)
