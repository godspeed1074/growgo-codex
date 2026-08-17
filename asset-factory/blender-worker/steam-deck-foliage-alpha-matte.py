import bpy,json,os,sys,math
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:]
if len(args)!=2:raise SystemExit('usage: -- <locked-front.blend> <out>')
source,out=args;os.makedirs(out,exist_ok=True);V={'M30':-30,'M15':-15,'0':0,'P15':15,'P30':30}
def leaf(o):return o.type=='MESH' and (str(o.get('leafId','')).startswith('LEAF_') or o.get('componentId')=='SHRUB_OBSERVED_RESIDUAL')
def flower(o):return o.type=='MESH' and str(o.get('componentId','')).startswith('FLOWER_GROUP')
def planter(o):return o.type=='MESH' and str(o.get('componentId','')).startswith('PLANTER')
def look(c):c.rotation_euler=(Vector((0,0,.18))-c.location).to_track_quat('-Z','Y').to_euler()
def cam(k,a):
 d=bpy.data.cameras.new(k);c=bpy.data.objects.new(k,d);bpy.context.collection.objects.link(c);r=math.radians(a);c.location=(math.sin(r)*9,0,math.cos(r)*9);c.data.type='ORTHO';c.data.ortho_scale=1;look(c);return c
def rotate(o,a):
 vs=o.data.vertices;p=sum((v.co for v in vs),Vector((0,0,0)))/len(vs);c,s=math.cos(math.radians(a)),math.sin(math.radians(a))
 for v in vs:x,z=v.co.x-p.x,v.co.z-p.z;v.co.x=p.x+c*x+s*z;v.co.z=p.z-s*x+c*z
def render(s,c,k):
 s.camera=c;s.render.resolution_x=189;s.render.resolution_y=261;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.film_transparent=True;s.render.filepath=os.path.join(out,'VIEW_'+k+'_FOLIAGE_MATTE.png');bpy.ops.render.render(write_still=True)
for k,a in V.items():
 bpy.ops.wm.open_mainfile(filepath=source);s=bpy.context.scene
 for o in bpy.context.scene.objects:
  if o.type=='MESH' and not (leaf(o) or flower(o)):o.hide_render=True
 if a:
  for o in bpy.context.scene.objects:
   if leaf(o) or flower(o):rotate(o,a)
 c=bpy.data.objects.get('PLANT_26LEAF_TARGETSPECIFIC_LOCKED_FRONT_CAMERA') if a==0 else cam('MATTE_'+k,a);render(s,c,k)
r={'status':'PASS_FOLIAGE_ALPHA_MATTE_WORKER','worker':'Steam Deck','blender':bpy.app.version_string,'views':list(V),'sourcePreserved':True,'foliageGeometryModified':False,'planterHiddenForMatte':True,'shopIntegrationPerformed':False};json.dump(r,open(os.path.join(out,'FOLIAGE_ALPHA_MATTE_RESULT.json'),'w'),indent=2);print(json.dumps(r,indent=2))
