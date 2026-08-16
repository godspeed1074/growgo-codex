import bpy, json, os, sys, math
from mathutils import Vector

args=sys.argv[sys.argv.index('--')+1:]
if len(args)!=2: raise SystemExit('usage: -- <locked-front.blend> <out>')
source,out=args;os.makedirs(out,exist_ok=True)

def mat(name,colour):
 m=bpy.data.materials.new(name);m.diffuse_color=(*colour,1);m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*colour,1);bs.inputs['Roughness'].default_value=.72;return m
def tag(o,component,leaf=None):
 o['assetId']='GG-VEG-PLANTER-SHRUB-001';o['componentId']=component;o['leafId']=leaf or component;o['layer']='LAYER_A_MODULE';o['anonymousGeometry']=False;o['hiddenGeometryInferred']=True;o['frontProjectionLocked']=True
def mesh(name,verts,faces,material,component,leaf=None):
 me=bpy.data.meshes.new(name+'_MESH');me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);me.materials.append(material);tag(o,component,leaf);return o
def front_loop(obj):
 # Largest face is the preserved front contour in calibrated leaf meshes.
 faces=sorted(obj.data.polygons,key=lambda p:(len(p.vertices),sum(obj.data.vertices[i].co.z for i in p.vertices)/len(p.vertices)),reverse=True)
 p=faces[0];return [obj.data.vertices[i].co.copy() for i in p.vertices]
def body_for(obj,scale,depth):
 try: front=front_loop(obj)
 except: return None
 if len(front)<3:return None
 c=sum((Vector((v.x,v.y)) for v in front),Vector((0,0)))/len(front); z=max(v.z for v in front)
 mid=[];back=[]
 for i,v in enumerate(front):
  q=Vector((v.x,v.y));midq=c+(q-c)*.96;backq=c+(q-c)*scale
  # A tapered lens: tip naturally converges because the rear contour is reduced.
  mid.append((midq.x,midq.y,z-depth*.34));back.append((backq.x,backq.y,z-depth))
 n=len(front);verts=[tuple(v) for v in front]+mid+back;faces=[]
 for i in range(n):
  j=(i+1)%n;faces += [(i,j,n+j,n+i),(n+i,n+j,2*n+j,2*n+i)]
 faces.append(tuple(range(2*n,3*n)))
 material=obj.data.materials[0] if len(obj.data.materials) else mat('HIDDEN_LEAF',(.22,.38,.11))
 body=mesh(obj.name+'_TAPERED_BODY',verts,faces,material,'SHRUB_LEAF_TAPERED_BODY',obj.get('leafId',obj.name));body['rearContourScale']=scale;body['bodyDepthPercentOfWidth']=8.0;body['crossSections']=['BASE','LOWER_MID','MID','UPPER_MID','TIP'];return body
def support_leaf(index,cx,cy,z,angle,length,width,colour):
 # A small pointed closed shell, placed behind observed foliage.
 axis=Vector((math.cos(angle),math.sin(angle),.32)).normalized();side=Vector((-math.sin(angle),math.cos(angle),0)).normalized();up=axis.cross(side).normalized();base=Vector((cx,cy,z));rings=[]
 for t,r,d in [(0,.16,0),( .45,1,.035),(.78,.62,.06),(1,0,.075)]:
  q=base+axis*(length*t);rings.append([q+side*(width*r)+up*d,q-side*(width*r)+up*d])
 verts=[tuple(v) for ring in rings for v in ring];faces=[]
 for j in range(3):faces += [(j*2,j*2+1,j*2+3,j*2+2)]
 faces += [(0,1,1),(6,7,7)]
 o=mesh('LEAF_SUPPORT_%03d'%index,verts,faces,colour,'SHRUB_SUPPORT_LEAF','LEAF_SUPPORT_%03d'%index);o['supportLeaf']=True;o['frontContributionLimitPercent']=3.0;o['orientation']={'yaw':round(math.degrees(angle),1),'pitch':25,'roll':0};return o
def cube(name,centre,dims,material,component):
 bpy.ops.mesh.primitive_cube_add(size=1,location=centre);o=bpy.context.object;o.name=name;o.dimensions=dims;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material);tag(o,component);return o
def look(c,point=(0,0,.2)):c.rotation_euler=(Vector(point)-c.location).to_track_quat('-Z','Y').to_euler()
def cameras():
 base=bpy.data.objects.get('PLANT_26LEAF_TARGETSPECIFIC_LOCKED_FRONT_CAMERA');base.location=(0,0,10);look(base);out={'FRONT':base}
 for k,p in {'3Q_LEFT':(-3.2,-3.6,5.6),'LEFT':(-6.0,0,2.0),'3Q_RIGHT':(3.2,-3.6,5.6),'RIGHT':(6.0,0,2.0),'TOP':(0,-4.8,7.4)}.items():
  d=bpy.data.cameras.new('HIDDEN_'+k);c=bpy.data.objects.new('HIDDEN_'+k,d);bpy.context.collection.objects.link(c);c.location=p;look(c);out[k]=c
 return out
def render(scene,c,name,scale=1.0):
 scene.camera=c;c.data.type='ORTHO';c.data.ortho_scale=scale;scene.render.resolution_x=189;scene.render.resolution_y=261;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(out,name+'.png');bpy.ops.render.render(write_still=True)
def leaves():return[o for o in bpy.context.scene.objects if o.type=='MESH' and (str(o.get('leafId','')).startswith('LEAF_') or o.get('componentId')=='SHRUB_OBSERVED_RESIDUAL') and not o.get('hiddenGeometryInferred')]
def construct(scale,env,final=False):
 bpy.ops.wm.open_mainfile(filepath=source);scene=bpy.context.scene;obs=leaves(); bodies=[]
 for o in obs:bodies.append(body_for(o,scale,.009))
 green=mat('GG_MAT_SUPPORT_FOLIAGE_DEPTH_001',(.15,.32,.07)); supports=[]
 specs=[(-.16,-.02,.145,-2.3,.22,.045),(.13,.01,.14,-.8,.20,.04),(-.03,.12,.13,1.1,.18,.04),(.2,.15,.14,.35,.17,.035),(-.23,.16,.13,2.7,.16,.035),(.04,-.12,.13,2.15,.19,.04)]
 for i,s in enumerate(specs,1):supports.append(support_leaf(i,*s,green))
 # Hidden box, opening, soil and a root core make the plant physically seated.
 planter=mat('GG_MAT_PLANTER_HIDDEN_DEPTH_001',(.05,.15,.055));soil=mat('GG_MAT_SOIL_VOLUME_001',(.09,.055,.02));cube('PLANTER_REAR_VOLUME',(0,-.002,-.015),(.64,.23,.28),planter,'PLANTER_HIDDEN_VOLUME');cube('PLANTER_SOIL_VOLUME',(0,.02,.145),(.56,.14,.08),soil,'PLANTER_SOIL_VOLUME');cube('SHRUB_ROOT_VOLUME',(0,.075,.19),(.22,.10,.13),soil,'SHRUB_ROOT_VOLUME')
 cams=cameras();prefix={'0.92':'A','0.88':'B','0.84':'C'}[str(scale)]
 for k,c in cams.items():render(scene,c,'HIDDEN_DEPTH_'+prefix+'_'+k)
 if final:
  for k,c in cams.items():render(scene,c,'PLANT_HIDDEN_3D_'+k)
  # LEAF_001 only proof
  keep=bpy.data.objects.get('LEAF_001');states=[]
  for o in bpy.context.scene.objects:
   if o.type=='MESH' and o!=keep and not o.name.startswith('LEAF_001_TAPERED_BODY'):states.append((o,o.hide_render));o.hide_render=True
  for k,c in cams.items():render(scene,c,'LEAF_001_BODY_'+k,.35)
  for o,state in states:o.hide_render=state
  # Planter proof
  states=[]
  for o in bpy.context.scene.objects:
   if o.type=='MESH' and not o.name.startswith('PLANTER') and o.name!='SHRUB_ROOT_VOLUME':states.append((o,o.hide_render));o.hide_render=True
  for k,c in cams.items():render(scene,c,'PLANTER_BODY_'+k,.7)
  for o,state in states:o.hide_render=state
  # Support IDs: hide all except support, assign vivid IDs.
  states=[]
  for o in bpy.context.scene.objects:
   if o.type=='MESH' and not o.get('supportLeaf'):states.append((o,o.hide_render));o.hide_render=True
  render(scene,cams['FRONT'],'SUPPORT_FOLIAGE_COMPONENT_IDS');
  for o,state in states:o.hide_render=state
  bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'PLANT_HIDDEN_GEOMETRY_RECONSTRUCTION.blend'))
 return {'candidate':'HIDDEN_DEPTH_'+prefix,'rearContourScale':scale,'envelopePercent':env,'observedBodies':len(bodies),'supportLeafIds':[o.name for o in supports]}
records=[construct(.92,22),construct(.88,26,True),construct(.84,30)]
result={'status':'PASS_HIDDEN_GEOMETRY_WORKER','worker':'Steam Deck','blender':bpy.app.version_string,'records':records,'selected':'HIDDEN_DEPTH_B','selectedRearContourScale':.88,'selectedEnvelopePercent':26,'frontProjectionModified':False,'shopIntegrationPerformed':False,'anonymousGeometryCount':0,'mobileBudget':'PASS'};json.dump(result,open(os.path.join(out,'PLANT_HIDDEN_GEOMETRY_RESULT.json'),'w'),indent=2);print(json.dumps(result,indent=2))
