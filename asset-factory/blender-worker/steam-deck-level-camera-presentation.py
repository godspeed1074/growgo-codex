import bpy,json,os,sys,math
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:]
if len(args)!=2:raise SystemExit('usage: -- <locked-front.blend> <out>')
source,out=args;os.makedirs(out,exist_ok=True);V={'M30':-30,'M15':-15,'P15':15,'P30':30}
def leaf(o):return o.type=='MESH' and (str(o.get('leafId','')).startswith('LEAF_') or o.get('componentId')=='SHRUB_OBSERVED_RESIDUAL')
def flower(o):return o.type=='MESH' and str(o.get('componentId','')).startswith('FLOWER_GROUP')
def planter(o):return o.type=='MESH' and str(o.get('componentId','')).startswith('PLANTER')
def remap():
 # Source X/Y/Z = horizontal/vertical/depth. Presentation X/Y/Z = horizontal/depth/vertical.
 for o in bpy.context.scene.objects:
  if o.type!='MESH':continue
  o.location=(o.location.x,o.location.z,o.location.y)
  for v in o.data.vertices:v.co=(v.co.x,v.co.z,v.co.y)
def bounds(objs):
 vs=[o.matrix_world@v.co for o in objs for v in o.data.vertices];return min(v.x for v in vs),max(v.x for v in vs),min(v.y for v in vs),max(v.y for v in vs)
def compress_planter():
 ps=[o for o in bpy.context.scene.objects if planter(o)];x0,x1,y0,y1=bounds(ps);front=y1;w=x1-x0;d=w*.20
 for o in ps:o.hide_render=True
 def mat(n,c):
  m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);return m
 body,rim,soil,dark=mat('PRES_BODY',(.10,.27,.11)),mat('PRES_RIM',(.14,.34,.15)),mat('PRES_SOIL',(.10,.06,.03)),mat('PRES_DARK',(.045,.12,.05))
 def cube(n,loc,dim,m):
  bpy.ops.mesh.primitive_cube_add(location=loc);o=bpy.context.object;o.name=n;o.dimensions=dim;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);o['componentId']='PLANTER_'+n;return o
 z0,z1=-.465,-.215;cy=front-d*.5
 cube('BODY',((x0+x1)/2,cy,(z0+z1)/2),(w,d,z1-z0),body)
 cube('RIM',((x0+x1)/2,cy,z1),(w*1.04,d*1.12,.048),rim)
 cube('SOIL',((x0+x1)/2,front-d*.52,z1+.005),(w*.82,d*.72,.018),soil)
 cube('PANEL',((x0+x1)/2,front+.003,(z0+z1)/2),(w*.78,.012,(z1-z0)*.67),dark)
 return {'id':'PLANTER_FOLIAGE_ORIGIN','x':(x0+x1)/2,'y':front-d*.52,'z':z1+.014,'depthPercent':20}
def rotate_face(o,a):
 vs=o.data.vertices;p=sum((v.co for v in vs),Vector((0,0,0)))/len(vs);c,s=math.cos(math.radians(-a)),math.sin(math.radians(-a))
 for v in vs:x,y=v.co.x-p.x,v.co.y-p.y;v.co.x=p.x+c*x-s*y;v.co.y=p.y+s*x+c*y
def camera(k,a):
 d=bpy.data.cameras.new(k);c=bpy.data.objects.new(k,d);bpy.context.collection.objects.link(c);r=math.radians(a);c.location=(math.sin(r)*9,math.cos(r)*9,0);target=Vector((0,.1,-.10));c.rotation_euler=(target-c.location).to_track_quat('-Z','Y').to_euler();c.data.type='ORTHO';c.data.ortho_scale=1;return c
def render(s,c,n):
 s.camera=c;s.render.resolution_x=189;s.render.resolution_y=261;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.film_transparent=True;s.render.filepath=os.path.join(out,n+'.png');bpy.ops.render.render(write_still=True)
def scene_for(a,foliage_only=False):
 bpy.ops.wm.open_mainfile(filepath=source);s=bpy.context.scene;remap();anchor=compress_planter()
 for o in bpy.context.scene.objects:
  if leaf(o) or flower(o):rotate_face(o,a)
  if foliage_only and planter(o):o.hide_render=True
  if o.type=='MESH' and not(leaf(o) or flower(o) or planter(o)):o.hide_render=True
 return s,anchor
r={'status':'PASS_LEVEL_CAMERA_WORKER','worker':'Steam Deck','blender':bpy.app.version_string,'cameraContract':{'id':'PLANT_PRESENTATION_CAMERA_CONTRACT_V1','worldUp':'+Z','cameraRollDegrees':0,'projection':'ORTHOGRAPHIC','resolution':'189x261'},'views':{},'sourcePreserved':True,'view0Rerendered':False,'shopIntegrationPerformed':False}
for k,a in V.items():
 s,anchor=scene_for(a,True);render(s,camera('LEVEL_FOLIAGE_'+k,a),'VIEW_'+k+'_FOLIAGE_ONLY_LEVEL');s,anchor=scene_for(a,False);render(s,camera('LEVEL_FINAL_'+k,a),'PLANT_LEVEL_FINAL_'+k);r['views'][k]={'anchor':anchor,'cameraRollDegrees':0}
json.dump(r,open(os.path.join(out,'PLANT_LEVEL_CAMERA_RESULT.json'),'w'),indent=2);print(json.dumps(r,indent=2))
