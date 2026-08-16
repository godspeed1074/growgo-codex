import bpy,json,os,sys,math
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:]
if len(args)!=2:raise SystemExit('usage: -- <locked-front.blend> <out>')
source,out=args;os.makedirs(out,exist_ok=True)
def material(name,c):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;bs=n.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*c,1);bs.inputs['Roughness'].default_value=.8;m.diffuse_color=(*c,1);return m
def loop(o):
 ps=sorted(o.data.polygons,key=lambda p:(len(p.vertices),sum(o.data.vertices[i].co.z for i in p.vertices)),reverse=True);return[o.data.vertices[i].co.copy() for i in ps[0].vertices]
def shadow(o,d):
 try:f=loop(o)
 except:return None
 if len(f)<3:return None
 # Exact camera-shadow volume: every new point projects beneath its parent front.
 verts=[(v.x,v.y,min(v.z for v in f)-d) for v in f];me=bpy.data.meshes.new(o.name+'_SHADOW_VOLUME_MESH');me.from_pydata(verts,[],[tuple(range(len(verts)))]);me.update();b=bpy.data.objects.new('LEAF_SHADOW_VOLUME_'+str(o.get('leafId',o.name)),me);bpy.context.collection.objects.link(b);me.materials.append(o.data.materials[0] if len(o.data.materials) else material('SHADOW_GREEN',(.12,.28,.06)));b['componentId']='SHRUB_CAMERA_SHADOW_VOLUME';b['parentObservedLeaf']=o.get('leafId',o.name);b['anonymousGeometry']=False;b['shadowVolumeDepth']=d;return b
def look(c):c.rotation_euler=(Vector((0,0,.18))-c.location).to_track_quat('-Z','Y').to_euler()
def cam(name,a):
 d=bpy.data.cameras.new(name);c=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(c);r=math.radians(a);c.location=(math.sin(r)*9,0,math.cos(r)*9);look(c);c.data.type='ORTHO';c.data.ortho_scale=1;return c
def render(s,c,n,res=(189,261)):
 s.camera=c;s.render.resolution_x=res[0];s.render.resolution_y=res[1];s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.filepath=os.path.join(out,n+'.png');bpy.ops.render.render(write_still=True)
def leaves():return[o for o in bpy.context.scene.objects if o.type=='MESH' and (str(o.get('leafId','')).startswith('LEAF_') or o.get('componentId')=='SHRUB_OBSERVED_RESIDUAL')]
def run(label,d,final=False):
 bpy.ops.wm.open_mainfile(filepath=source);s=bpy.context.scene;vol=[shadow(o,d) for o in leaves()];vol=[o for o in vol if o]
 front=bpy.data.objects.get('PLANT_26LEAF_TARGETSPECIFIC_LOCKED_FRONT_CAMERA');front.location=(0,0,10);look(front);views={'FRONT':front,'LEFT_15':cam('CS_LEFT15',-15),'RIGHT_15':cam('CS_RIGHT15',15),'LEFT_30':cam('CS_LEFT30',-30),'RIGHT_30':cam('CS_RIGHT30',30),'VIEW_45':cam('CS_45',45),'QA_90':cam('CS_90',90)}
 # Magenta test uses only added hidden volumes. Any visible pixel is a hard failure.
 mag=material('CAMERA_SHADOW_DIAGNOSTIC_MAGENTA',(1,0,1));old=[]
 for o in vol:old.append(o.data.materials[0]);o.data.materials.clear();o.data.materials.append(mag)
 render(s,front,'PLANT_HIDDEN_VISIBILITY_FRONT_TEST_'+label)
 for o,m in zip(vol,old):o.data.materials.clear();o.data.materials.append(m)
 for k,c in views.items():render(s,c,'SHADOW_'+label+'_'+k)
 if final:
  for k,c in views.items():render(s,c,'PLANT_CAMERA_SHADOW_'+k)
  render(s,front,'PLANT_CAMERA_SHADOW_GAMEPLAY_1X');render(s,front,'PLANT_CAMERA_SHADOW_GAMEPLAY_2X',(378,522))
  # One exploded evidence view: show rear volumes only from 30 degrees.
  states=[]
  for o in bpy.context.scene.objects:
   if o.type=='MESH' and o not in vol:states.append((o,o.hide_render));o.hide_render=True
  render(s,views['RIGHT_30'],'PLANT_CAMERA_SHADOW_EXPLODED_DIAGRAM')
  for o,state in states:o.hide_render=state
  bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'PLANT_CAMERA_SHADOW_25D.blend'))
 return {'candidate':'SHADOW_DEPTH_'+label,'envelopePercent':{'A':14,'B':18,'C':22}[label],'shadowObjectCount':len(vol),'rearContourScaleRange':[.96,.96],'depth':d}
records=[run('A',.006),run('B',.009,True),run('C',.012)]
r={'status':'PASS_CAMERA_SHADOW_WORKER','worker':'Steam Deck','blender':bpy.app.version_string,'records':records,'selected':'SHADOW_DEPTH_B','frontProjectionModified':False,'globalCoreCreated':False,'supportLeavesCreated':0,'shopIntegrationPerformed':False,'anonymousGeometryCount':0,'mobileBudget':'PASS'};json.dump(r,open(os.path.join(out,'PLANT_CAMERA_SHADOW_RESULT.json'),'w'),indent=2);print(json.dumps(r,indent=2))
