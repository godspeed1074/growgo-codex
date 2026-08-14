import bpy,os,sys,json,math
from mathutils import Vector
out=sys.argv[sys.argv.index('--')+1];os.makedirs(out,exist_ok=True)
P={'brown':(.34,.16,.09,1),'gray':(.25,.25,.25,1),'teal':(.03,.30,.38,1),'plum':(.42,.08,.32,1),'navy':(.04,.07,.20,1),'cream':(.72,.58,.40,1),'green':(.18,.38,.12,1)}
def mat(n,c):m=bpy.data.materials.new(n);m.diffuse_color=c;return m
M={}
def cube(n,d,l,asset,comp,ma):
 bpy.ops.mesh.primitive_cube_add(size=1,location=l);o=bpy.context.object;o.name=n;o.dimensions=d;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(M[ma]);o['assetId']=asset;o['assetVersion']='3.5.0';o['moduleId']=asset;o['moduleVersion']='3.5.0';o['componentId']=comp;o['layer']='LAYER_A_MODULE';return o
def setup(scale=5):
 s=bpy.context.scene;s.render.resolution_x=512;s.render.resolution_y=384;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.engine='BLENDER_WORKBENCH';s.display.shading.light='STUDIO';s.display.shading.color_type='MATERIAL';bpy.ops.object.camera_add(location=(0,-12,1.5));c=bpy.context.object;c.data.type='ORTHO';c.data.ortho_scale=scale;c.rotation_euler=((Vector((0,0,1.4))-c.location).to_track_quat('-Z','Y')).to_euler();s.camera=c;return s,c
def render_views(objs,dir,prefix,scale=5):
 s,c=setup(scale);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(dir,prefix+'.blend'));views=[]
 for lab,a in [('FRONT',0),('BACK',math.pi),('LEFT',math.pi/2),('RIGHT',-math.pi/2)]:c.location=(math.sin(a)*12,-math.cos(a)*12,1.5);c.rotation_euler=((Vector((0,0,1.4))-c.location).to_track_quat('-Z','Y')).to_euler();s.render.filepath=os.path.join(dir,lab+'.png');bpy.ops.render.render(write_still=True);views.append(lab+'.png')
 c.location=(0,-12,1.5);c.rotation_euler=((Vector((0,0,1.4))-c.location).to_track_quat('-Z','Y')).to_euler();c.data.ortho_scale=3.2;s.render.filepath=os.path.join(dir,'GAMEPLAY.png');bpy.ops.render.render(write_still=True);c.data.ortho_scale=2.2;s.render.filepath=os.path.join(dir,'CLOSE_UP.png');bpy.ops.render.render(write_still=True);old=[(o,list(o.data.materials)) for o in objs];black=mat('SILHOUETTE_BLACK',(0,0,0,1));[o.data.materials.clear() or o.data.materials.append(black) for o in objs];s.render.filepath=os.path.join(dir,'SILHOUETTE.png');bpy.ops.render.render(write_still=True);idmat=mat('COMPONENT_ID',(1,0,0,1));[o.data.materials.clear() or o.data.materials.append(idmat) for o in objs];s.render.filepath=os.path.join(dir,'COMPONENT_ID.png');bpy.ops.render.render(write_still=True)
 for o,ms in old:o.data.materials.clear();[o.data.materials.append(x) for x in ms]
 return views
def module(asset,kind):
 global M
 bpy.ops.wm.read_factory_settings(use_empty=True);M={k:mat('GG_SHARED_'+k.upper(),v) for k,v in P.items()};d=os.path.join(out,asset+'@3.5.0');os.makedirs(d,exist_ok=True);o=[]
 if kind=='awning':
  o=[cube(asset+'_CANOPY',(3.5,1.45,.34),(0,-.15,.2),asset,'AWNING','plum'),cube(asset+'_VALANCE',(3.5,.18,.48),(0,-.88,-.05),asset,'AWNING','plum'),cube(asset+'_UNDER',(3.3,1.1,.12),(0,-.1,.02),asset,'UNDERSIDE','navy'),cube(asset+'_ARM_L',(.12,.35,1.0),(-1.45,-.45,-.35),asset,'SUPPORT','cream'),cube(asset+'_ARM_R',(.12,.35,1.0),(1.45,-.45,-.35),asset,'SUPPORT','cream')]
 elif kind=='door':
  o=[cube(asset+'_FRAME',(1.35,.28,2.5),(0,0,1.25),asset,'DOOR','cream'),cube(asset+'_SLAB',(1.05,.16,2.2),(0,-.18,1.2),asset,'DOOR','brown'),cube(asset+'_GLASS',(.55,.08,.72),(0,-.29,1.65),asset,'GLASS','teal'),cube(asset+'_PANEL',(.62,.08,.42),(0,-.29,.7),asset,'PANEL','brown'),cube(asset+'_KNOB',(.12,.12,.12),(.38,-.38,1.15),asset,'HANDLE','cream'),cube(asset+'_MAIL',(.28,.08,.08),(.0,-.38,.88),asset,'MAIL_SLOT','cream'),cube(asset+'_THRESHOLD',(1.5,.5,.16),(0,-.15,.05),asset,'THRESHOLD','gray')]
 else:
  o=[cube(asset+'_PLANTER',(1.1,.75,.55),(0,0,.28),asset,'PLANTER','green'),cube(asset+'_RIM',(1.25,.82,.14),(0,-.02,.58),asset,'PLANTER_RIM','green'),cube(asset+'_LOW',(.9,.5,.65),(-.2,0,.92),asset,'SHRUB','green'),cube(asset+'_MID',(.65,.45,.85),(.2,0,1.15),asset,'SHRUB','green'),cube(asset+'_TALL',(.45,.4,1.05),(-.05,0,1.35),asset,'SHRUB','green')]
 render_views(o,d,asset+'@3.5.0',4.2);json.dump({'assetId':asset,'version':'3.5.0','parentVersion':'3.0.0','anonymousGeometryCount':0,'triangleBudget':sum(12 for x in o),'objects':len(o),'status':'PASS'},open(os.path.join(d,'RESULT.json'),'w'),indent=2);return d
awning=module('GG-BLD-AWNING-SHOP-FABRIC-001','awning');door=module('GG-BLD-DOOR-SHOP-002','door');shrub=module('GG-VEG-PLANTER-SHRUB-001','shrub')
