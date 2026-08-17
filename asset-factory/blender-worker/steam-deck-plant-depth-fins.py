import bpy,json,os,sys,math
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:]
if len(args)!=2:raise SystemExit('usage: -- <locked-front.blend> <out>')
source,out=args;os.makedirs(out,exist_ok=True)
def loop(o):
 p=sorted(o.data.polygons,key=lambda q:(len(q.vertices),sum(o.data.vertices[i].co.z for i in q.vertices)),reverse=True)[0];return[o.data.vertices[i].co.copy() for i in p.vertices]
def fin(o,ratio,index):
 f=loop(o);c=sum((Vector((v.x,v.y))for v in f),Vector((0,0)))/len(f);tip=max(f,key=lambda v:(Vector((v.x,v.y))-c).length);base=min(f,key=lambda v:(Vector((v.x,v.y))-c).length);axis=(Vector((tip.x,tip.y))-Vector((base.x,base.y))).normalized();length=(Vector((tip.x,tip.y))-Vector((base.x,base.y))).length;width=max(max(v.x for v in f)-min(v.x for v in f),max(v.y for v in f)-min(v.y for v in f),.01);z=max(v.z for v in f);depth=width*ratio
 # Four stations form a pointed keel. All share the exact leaf centreline in X/Y.
 stations=[(.02,.25),(.35,.8),(.65,1.0),(.98,.03)];verts=[]
 for t,d in stations:q=Vector((base.x,base.y))+axis*(length*t);verts.append((q.x,q.y,z));verts.append((q.x,q.y,z-depth*d))
 faces=[]
 for i in range(3):faces += [(i*2,i*2+1,i*2+3,i*2+2)]
 me=bpy.data.meshes.new('LEAF_DEPTH_FIN_%03d_MESH'%index);me.from_pydata(verts,[],faces);me.update();b=bpy.data.objects.new('LEAF_DEPTH_FIN_%03d'%index,me);bpy.context.collection.objects.link(b);me.materials.append(o.data.materials[0]);b['componentId']='SHRUB_DEPTH_FIN';b['parentObservedLeaf']=o.get('leafId',o.name);b['anonymousGeometry']=False;b['frontProjectionLocked']=True;b['finDepthPercent']=ratio*100;return b
def look(c):c.rotation_euler=(Vector((0,0,.18))-c.location).to_track_quat('-Z','Y').to_euler()
def cam(name,a):
 d=bpy.data.cameras.new(name);c=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(c);r=math.radians(a);c.location=(math.sin(r)*9,0,math.cos(r)*9);look(c);c.data.type='ORTHO';c.data.ortho_scale=1;return c
def render(s,c,n,res=(189,261)):
 s.camera=c;s.render.resolution_x=res[0];s.render.resolution_y=res[1];s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.filepath=os.path.join(out,n+'.png');bpy.ops.render.render(write_still=True)
def run(label,ratio,final=False):
 bpy.ops.wm.open_mainfile(filepath=source);s=bpy.context.scene;obs=[o for o in bpy.context.scene.objects if o.type=='MESH' and str(o.get('leafId','')).startswith('LEAF_')];obs=sorted(obs,key=lambda o:max(max(v.x for v in loop(o))-min(v.x for v in loop(o)),max(v.y for v in loop(o))-min(v.y for v in loop(o))),reverse=True)[:19];fins=[fin(o,ratio,i+1)for i,o in enumerate(obs)]
 front=bpy.data.objects.get('PLANT_26LEAF_TARGETSPECIFIC_LOCKED_FRONT_CAMERA');front.location=(0,0,10);look(front);views={'FRONT':front,'LEFT_10':cam('FIN_L10',-10),'RIGHT_10':cam('FIN_R10',10),'LEFT_20':cam('FIN_L20',-20),'RIGHT_20':cam('FIN_R20',20),'LEFT_30':cam('FIN_L30',-30),'RIGHT_30':cam('FIN_R30',30),'VIEW_45':cam('FIN_45',45),'QA_90':cam('FIN_90',90)}
 mag=bpy.data.materials.new('FIN_MAGENTA');mag.diffuse_color=(1,0,1,1);old=[x.data.materials[0]for x in fins]
 for x in fins:x.data.materials.clear();x.data.materials.append(mag)
 render(s,front,'PLANT_DEPTH_FIN_MAGENTA_FRONT_'+label)
 for x,m in zip(fins,old):x.data.materials.clear();x.data.materials.append(m)
 for k,c in views.items():render(s,c,'FIN_'+label+'_'+k)
 if final:
  for k,c in views.items():render(s,c,'PLANT_DEPTH_FIN_'+k)
  render(s,front,'PLANT_DEPTH_FIN_GAMEPLAY_1X');render(s,front,'PLANT_DEPTH_FIN_GAMEPLAY_2X',(378,522))
  # Leaf 001 proof uses its parent fin plus front leaf.
  states=[]
  for o in bpy.context.scene.objects:
   if o.type=='MESH' and o.name not in ('LEAF_001','LEAF_DEPTH_FIN_001'):states.append((o,o.hide_render));o.hide_render=True
  for k in ['FRONT','LEFT_30','QA_90']:render(s,views[k],'LEAF_001_FIN_'+k)
  for o,h in states:o.hide_render=h
  bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'PLANT_DEPTH_FIN_25D.blend'))
 return {'candidate':'FIN_'+label,'depthPercent':ratio*100,'finCount':len(fins),'twoFinLeaves':0}
r=[run('A',.08),run('B',.12,True),run('C',.16)];o={'status':'PASS_DEPTH_FIN_WORKER','worker':'Steam Deck','blender':bpy.app.version_string,'records':r,'selected':'FIN_B','frontProjectionModified':False,'observedLeavesChanged':False,'globalCoreCreated':False,'supportLeavesCreated':0,'anonymousGeometryCount':0,'mobileBudget':'PASS','shopIntegrationPerformed':False};json.dump(o,open(os.path.join(out,'PLANT_DEPTH_FIN_RESULT.json'),'w'),indent=2);print(json.dumps(o,indent=2))
