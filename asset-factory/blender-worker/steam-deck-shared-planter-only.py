import bpy,json,os,sys,math
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:]
if len(args)!=2:raise SystemExit('usage: -- <locked-front.blend> <out>')
source,out=args;os.makedirs(out,exist_ok=True)
def planter(o):return o.type=='MESH' and str(o.get('componentId','')).startswith('PLANTER')
def foliage(o):return o.type=='MESH' and (str(o.get('componentId','')).startswith('SHRUB') or str(o.get('componentId','')).startswith('FLOWER'))
def p_objects():return[o for o in bpy.context.scene.objects if planter(o)]
def bounds(objs):
 vs=[o.matrix_world@v.co for o in objs for v in o.data.vertices];return{'x':[min(v.x for v in vs),max(v.x for v in vs)],'vertical':[min(v.y for v in vs),max(v.y for v in vs)],'depth':[min(v.z for v in vs),max(v.z for v in vs)]}
def hide_non_planter():
 for o in bpy.context.scene.objects:
  if o.type=='MESH' and not planter(o):o.hide_render=True
def compress_depth(percent):
 ps=p_objects();b=bounds(ps);width=b['x'][1]-b['x'][0];front=b['depth'][1];target=width*percent/100.;original=front-b['depth'][0];factor=target/original
 # Blender scene axes: X horizontal, Y vertical, Z depth. This is the exact
 # mapping of the requested planter-local X/Z/Y frame; vertices on front stay.
 for o in ps:
  for v in o.data.vertices:
   wz=(o.matrix_world@v.co).z;v.co.z=front-(front-wz)*factor-o.location.z
 return {'depthPercent':percent,'frontWidth':width,'frontHeight':b['vertical'][1]-b['vertical'][0],'frontDepth':front,'targetDepth':target,'factor':factor,'anchor':{'id':'PLANTER_FOLIAGE_ORIGIN','x':(b['x'][0]+b['x'][1])/2,'sceneDepth':front-target*.48,'vertical':b['vertical'][1]-.03}}
def look(c):c.rotation_euler=(Vector((0,-.32,.1))-c.location).to_track_quat('-Z','Y').to_euler()
def cam(name,a,elev=0):
 d=bpy.data.cameras.new(name);c=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(c);r=math.radians(a);c.location=(math.sin(r)*9,elev,math.cos(r)*9);c.data.type='ORTHO';c.data.ortho_scale=1;look(c);return c
def render(s,c,name):
 s.camera=c;s.render.resolution_x=189;s.render.resolution_y=261;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.film_transparent=True;s.render.filepath=os.path.join(out,name+'.png');bpy.ops.render.render(write_still=True)
def candidate(label,depth,final=False):
 bpy.ops.wm.open_mainfile(filepath=source);s=bpy.context.scene;hide_non_planter();m=compress_depth(depth);front=bpy.data.objects.get('PLANT_26LEAF_TARGETSPECIFIC_LOCKED_FRONT_CAMERA');render(s,front,'PLANTER_DEPTH_'+label+'_FRONT')
 for a in [15,30,-15,-30]:render(s,cam('PLANTER_'+label+'_'+str(a),a),'PLANTER_DEPTH_'+label+'_'+('P' if a>0 else 'M')+str(abs(a)))
 if final:
  for k,a in [('M30',-30),('M15',-15),('0',0),('P15',15),('P30',30)]:render(s,front if a==0 else cam('FINAL_'+k,a),'SHARED_PLANTER_'+k)
  render(s,cam('TOP_OBLIQUE',30,3),'SHARED_PLANTER_TOP_OBLIQUE');bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'GG-PRES-VEG-PLANTER-SHRUB-001_SHARED_PLANTER_1.0.0.blend'))
 return m
r={'status':'PASS_SHARED_PLANTER_GEOMETRY_WORKER','worker':'Steam Deck','blender':bpy.app.version_string,'sourcePreserved':True,'foliageTouched':False,'candidates':{'A':candidate('A',16),'B':candidate('B',20,True),'C':candidate('C',24)},'selected':'B','anonymousGeometryCount':0,'shopIntegrationPerformed':False};json.dump(r,open(os.path.join(out,'PLANTER_SHARED_GEOMETRY_RESULT.json'),'w'),indent=2);print(json.dumps(r,indent=2))
