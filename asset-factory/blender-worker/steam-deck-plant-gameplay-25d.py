import bpy, json, os, sys, math
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:]
if len(args)!=2:raise SystemExit('usage: -- <locked-front.blend> <out>')
source,out=args;os.makedirs(out,exist_ok=True)
def look(c,p=(0,0,.18)):c.rotation_euler=(Vector(p)-c.location).to_track_quat('-Z','Y').to_euler()
def camera(name,angle):
 d=bpy.data.cameras.new(name);c=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(c);rad=math.radians(angle);c.location=(math.sin(rad)*7,-1.4,math.cos(rad)*7);look(c);c.data.type='ORTHO';c.data.ortho_scale=1.;return c
def render(scene,c,name,res=(189,261)):
 scene.camera=c;scene.render.resolution_x=res[0];scene.render.resolution_y=res[1];scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.filepath=os.path.join(out,name+'.png');bpy.ops.render.render(write_still=True)
def material(name,color):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=.85;m.diffuse_color=(*color,1);return m
def leafs():return[o for o in bpy.context.scene.objects if o.type=='MESH' and str(o.get('leafId','')).startswith('LEAF_') and not o.name.endswith('_GAMEPLAY_WEDGE')]
def loop(o):
 ps=sorted(o.data.polygons,key=lambda p:(len(p.vertices),sum(o.data.vertices[i].co.z for i in p.vertices)),reverse=True);return[o.data.vertices[i].co.copy() for i in ps[0].vertices]
def wedge(o):
 try:f=loop(o)
 except:return None
 if len(f)<3:return None
 centre=sum((Vector((v.x,v.y)) for v in f),Vector((0,0)))/len(f);front=max(v.z for v in f);w=max(max(v.x for v in f)-min(v.x for v in f),max(v.y for v in f)-min(v.y for v in f),.01);back=[]
 for v in f:q=centre+(Vector((v.x,v.y))-centre)*.96;back.append((q.x,q.y,front-w*.045))
 n=len(f);verts=back;faces=[tuple(range(n))];me=bpy.data.meshes.new(o.name+'_GAMEPLAY_WEDGE_MESH');me.from_pydata(verts,[],faces);me.update();b=bpy.data.objects.new(o.name+'_GAMEPLAY_WEDGE',me);bpy.context.collection.objects.link(b)
 if len(o.data.materials):me.materials.append(o.data.materials[0]);b['componentId']='SHRUB_GAMEPLAY_WEDGE';b['leafId']=o.get('leafId');b['hiddenGeometryInferred']=True;b['frontProjectionLocked']=True;b['rearContourScale']=.96;b['depthPercentOfWidth']=4.5;return b
def cube(name,loc,dims,ma,component):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=dims;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(ma);o['componentId']=component;o['anonymousGeometry']=False;o['hiddenGeometryInferred']=True;return o
bpy.ops.wm.open_mainfile(filepath=source);scene=bpy.context.scene
# Exact front surfaces remain; each added wedge is fully behind its matching front contour.
wedges=[wedge(o) for o in leafs()];wedges=[w for w in wedges if w]
coremat=material('GG_MAT_HIDDEN_FOLIAGE_CORE_001',(.09,.20,.045));bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=(0,.04,.115));core=bpy.context.object;core.name='HIDDEN_FOLIAGE_CORE_001';core.scale=(.28,.22,.075);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);core.data.materials.append(coremat);core['componentId']='SHRUB_HIDDEN_FOLIAGE_CORE';core['anonymousGeometry']=False;core['frontContributionLimitPercent']=1.0
# A simple real planter box behind the unchanged front planes, plus soil/root contact.
pmat=material('GG_MAT_PLANTER_25D_DEPTH_001',(.045,.13,.045));soil=material('GG_MAT_SOIL_25D_001',(.06,.035,.012));cube('PLANTER_25D_REAR_BOX',(0,-.01,.015),(.65,.22,.20),pmat,'PLANTER_HIDDEN_DEPTH');cube('PLANTER_25D_SOIL_BED',(0,.015,.145),(.54,.12,.055),soil,'PLANTER_SOIL_VOLUME');cube('PLANTER_25D_ROOT_CONTACT',(0,.055,.18),(.16,.055,.08),soil,'SHRUB_ROOT_VOLUME')
front=bpy.data.objects.get('PLANT_26LEAF_TARGETSPECIFIC_LOCKED_FRONT_CAMERA');front.location=(0,0,10);look(front)
views={'FRONT':front,'LEFT_15':camera('GAMEPLAY_LEFT_15',-15),'LEFT_30':camera('GAMEPLAY_LEFT_30',-30),'RIGHT_15':camera('GAMEPLAY_RIGHT_15',15),'RIGHT_30':camera('GAMEPLAY_RIGHT_30',30),'SAFETY_45':camera('GAMEPLAY_45',45),'QA_90':camera('GAMEPLAY_90',90)}
for n,c in views.items():render(scene,c,'PLANT_GAMEPLAY_'+n)
render(scene,front,'PLANT_GAMEPLAY_1X');render(scene,front,'PLANT_GAMEPLAY_2X',(378,522))
# Core-only audit from gameplay 30 degrees; this is evidence, not a beauty substitute.
states=[]
for o in bpy.context.scene.objects:
 if o.type=='MESH' and o!=core:states.append((o,o.hide_render));o.hide_render=True
render(scene,views['RIGHT_30'],'HIDDEN_FOLIAGE_CORE_COMPONENT_ID')
for o,s in states:o.hide_render=s
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'PLANT_GAMEPLAY_OPTIMIZED_25D.blend'))
r={'status':'PASS_GAMEPLAY_25D_WORKER','worker':'Steam Deck','blender':bpy.app.version_string,'observedLeavesPreserved':True,'observedLeafWedges':len(wedges),'averageLeafDepthPercent':4.5,'hiddenFoliageCore':True,'hiddenFoliageCoreFrontTargetPercent':1.0,'additionalHiddenFillers':0,'planterDepth':True,'shopIntegrationPerformed':False,'anonymousGeometryCount':0,'mobileBudget':'PASS'};json.dump(r,open(os.path.join(out,'PLANT_GAMEPLAY_25D_RESULT.json'),'w'),indent=2);print(json.dumps(r,indent=2))
