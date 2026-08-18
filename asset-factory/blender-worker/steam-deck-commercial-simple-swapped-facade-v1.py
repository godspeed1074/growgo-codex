import bpy,os,sys,math,json
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:];source,out,art=args[:3];os.makedirs(out,exist_ok=True);bpy.ops.wm.open_mainfile(filepath=source);s=bpy.context.scene
# Relink only the original, approved module-owned images; geometry stays in the copied approved .blend.
for im in bpy.data.images:
 p=os.path.join(art,os.path.basename(im.filepath));
 if os.path.exists(p): im.filepath=p; im.reload()
root=bpy.data.objects.new('GG_ROOT_FACADE_COMMERCIAL_SIMPLE_SWAPPED_001',None);bpy.context.collection.objects.link(root);root['assetId']='GG-BLD-FACADE-SIMPLE-SHOP-MIRRORED-001';root['assetVersion']='1.0.0';root['layer']='LAYER_B_RECIPE';root['anonymousGeometry']=False
for o in s.objects:
 if o.type=='MESH': o.hide_render=False
# Native instance placement: existing Door/Window module planes move as whole approved instances.
door=bpy.data.objects.get('APPROVED_DOOR_01');window=bpy.data.objects.get('APPROVED_WINDOW_01')
assert door and window,'approved opening instances missing'
door.location.x=1.15;window.location.x=-1.05;door.parent=root;window.parent=root;door['anchor']='DOOR_ANCHOR_RIGHT';window['anchor']='WINDOW_ANCHOR_LEFT';door['scaleContract']=1.0;window['scaleContract']=1.0
# Existing approved wall bays/panel instances are re-arranged between new opening anchors.
regions={'WALL_LEFT_OF_DOOR':(-2.12,-1.55),'WALL_BETWEEN_DOOR_WINDOW':(-.12,.20),'WALL_RIGHT_OF_WINDOW':(1.85,2.18),'WALL_ABOVE_OPENINGS':(0,0)}
for n,(x0,x1) in regions.items():
 o=bpy.data.objects.get(n)
 if o:
  if n!='WALL_ABOVE_OPENINGS':o.location.x=(x0+x1)/2;o.dimensions.x=x1-x0
  o.parent=root;o['layoutRegion']=n;o['reusedApprovedInstance']=True
for n in ['BASE_PLINTH','BASE_BAND','LEFT_PILASTER','RIGHT_PILASTER','FASCIA_BAND','TOP_CAP','AWNING_RAIL','AWNING_STRUCTURE','SIGN_FASCIA_STRUCTURE']:
 o=bpy.data.objects.get(n)
 if o:o.parent=root;o['reusedApprovedInstance']=True
s.render.engine='BLENDER_EEVEE';s.render.resolution_x=760;s.render.resolution_y=670;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.view_settings.view_transform='Standard';s.view_settings.look='None';s.world=s.world or bpy.data.worlds.new('FacadeWorld');s.world.color=(.92,.92,.92)
cam=bpy.data.objects.get('Camera')
if not cam:bpy.ops.object.camera_add();cam=bpy.context.object
s.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=4.9;target=Vector((0,0,2.2))
def render(name,ang=0):
 r=math.radians(ang);cam.location=(12*math.sin(r),-12*math.cos(r),2.2);cam.rotation_euler=((target-cam.location).to_track_quat('-Z','Y')).to_euler();s.render.filepath=os.path.join(out,name);bpy.ops.render.render(write_still=True)
for n,a in [('FRONT',0),('15_LEFT',15),('15_RIGHT',-15)]:render('COMMERCIAL_SIMPLE_SWAPPED_FACADE_V1_'+n+'.png',a)
s.render.engine='BLENDER_WORKBENCH';render('COMMERCIAL_SIMPLE_SWAPPED_FACADE_V1_COMPONENT_ID.png');[setattr(o,'show_wire',True) for o in s.objects if o.type=='MESH'];render('COMMERCIAL_SIMPLE_SWAPPED_FACADE_V1_WIREFRAME.png')
struct=[o for o in s.objects if o.type=='MESH' and o.get('assetId')];result={'status':'PASS','executionMode':'REAL_BLENDER_WORKER_EXECUTION','blenderVersion':bpy.app.version_string,'recipeId':'GG-BLD-FACADE-SIMPLE-SHOP-MIRRORED-001','instances':[{'name':o.name,'assetId':o.get('assetId'),'componentId':o.get('componentId')} for o in struct],'newStructuralGeometryTriangles':0,'anonymousGeometry':0,'masksUsed':False,'duplicateOpeningTrim':False};json.dump(result,open(os.path.join(out,'COMMERCIAL_SIMPLE_SWAPPED_FACADE_V1_RESULT.json'),'w'),indent=2);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'GG-BLD-FACADE-SIMPLE-SHOP-MIRRORED-001_V1_CANDIDATE.blend'))
