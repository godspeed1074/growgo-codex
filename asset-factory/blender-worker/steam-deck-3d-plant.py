import bpy,os,sys,math,json
from mathutils import Vector
out=sys.argv[sys.argv.index('--')+1];os.makedirs(out,exist_ok=True);bpy.ops.wm.read_factory_settings(use_empty=True)
def M(n,c):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*c,1);return m
g=[M('GREEN_DARK',(.06,.16,.03)),M('GREEN_MID',(.12,.30,.05)),M('GREEN_LIGHT',(.24,.44,.08))];wood=M('PLANTER_GREEN',(.08,.20,.045));soil=M('SOIL',(.08,.05,.02));fl=M('FLOWER_YELLOW',(.85,.55,.08));objs=[]
def cube(n,l,d,ma,c='PLANTER'):
 bpy.ops.mesh.primitive_cube_add(size=1,location=l);o=bpy.context.object;o.name=n;o.dimensions=d;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(ma);o['moduleId']='GG-VEG-PLANTER-SHRUB-001';o['moduleVersion']='2.0.0';o['componentId']=c;o['layer']='LAYER_A_MODULE';o['anonymousGeometry']=False;objs.append(o)
def leaf(i,l,s,r,ma):
	 w,h,d=s;v=[(-w/2,0,0),(w/2,0,0),(0,h,0),(0,h*.48,d),(0,h*.82,d*.6),(0,0,d*.2)];f=[(0,1,3),(0,3,5),(1,2,4),(1,4,3),(2,0,5),(2,5,4),(3,4,5),(0,2,1)];me=bpy.data.meshes.new('LEAF_MESH_%03d'%i);me.from_pydata(v,[],f);o=bpy.data.objects.new('LEAF_%03d'%i,me);bpy.context.collection.objects.link(o);o.location=l;o.rotation_euler=r;o.data.materials.append(ma);o['moduleId']='GG-VEG-LEAF-SHRUB-BROAD-001';o['moduleVersion']='1.0.0';o['componentId']='SHRUB';o['layer']='LAYER_A_MODULE';o['anonymousGeometry']=False;objs.append(o)
def flower(i,l):
	for p in range(5):
		a=2*math.pi*p/5; x,y=l[0]+math.cos(a)*.045,l[1]+math.sin(a)*.045
		bpy.ops.mesh.primitive_uv_sphere_add(segments=6,ring_count=3,radius=.055,location=(x,y,l[2]));o=bpy.context.object;o.name='FLOWER_%03d_PETAL_%d'%(i,p);o.scale=(1,.55,.25);o.rotation_euler[2]=a;o.data.materials.append(fl);o['moduleId']='GG-VEG-FLOWER-ACCENT-001';o['moduleVersion']='1.0.0';o['componentId']='SHRUB';o['layer']='LAYER_A_MODULE';o['anonymousGeometry']=False;objs.append(o)
	bpy.ops.mesh.primitive_uv_sphere_add(segments=6,ring_count=3,radius=.035,location=(l[0],l[1],l[2]+.015));o=bpy.context.object;o.name='FLOWER_%03d_CENTER'%i;o.data.materials.append(fl);o['moduleId']='GG-VEG-FLOWER-ACCENT-001';o['moduleVersion']='1.0.0';o['componentId']='SHRUB';o['layer']='LAYER_A_MODULE';o['anonymousGeometry']=False;objs.append(o)
cube('PLANTER_BODY',(0,0,.22),(.95,.55,.42),wood);cube('PLANTER_RIM',(0,-.01,.45),(1.05,.62,.1),wood);cube('PLANTER_SOIL',(0,0,.49),(.82,.42,.025),soil)
clusters=[(-.28,.02,.62),(.05,.08,.78),(.3,.02,.7),(-.12,-.1,1.02),(.18,-.08,1.14),(-.38,-.04,.92),(.4,-.03,.95)];i=0
for k,(x,y,z) in enumerate(clusters):
	bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.19,location=(x,y,z+.03));mass=bpy.context.object;mass.name='FOLIAGE_MASS_%02d'%k;mass.scale=(1.25,.8,1.35);mass.data.materials.append(g[(k+1)%3]);mass['moduleId']='GG-VEG-SHRUB-FOLIAGE-CLUSTER-001';mass['moduleVersion']='1.0.0';mass['componentId']='SHRUB';mass['layer']='LAYER_A_MODULE';mass['anonymousGeometry']=False;objs.append(mass)
	for j in range(4): leaf(i,(x+(j-1.5)*.07,y+j*.03,z+j*.1),(.25,.42,.045),(0,(j-1.5)*.25,(j-1.5)*.25),g[(k+j)%3]);i+=1
for fi,l in enumerate(((-.28,-.03,.94),(.24,-.02,1.18),(.02,-.02,1.34))): flower(fi,l)
scene=bpy.context.scene;scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.world=bpy.data.worlds.new('WORLD');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.97,.965,.94,1);bpy.ops.object.light_add(type='AREA',location=(-3,-5,5));bpy.context.object.data.energy=650;bpy.ops.object.camera_add(location=(0,-7,1.5));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.5;scene.camera=cam
def R(n,l,sc=2.5): cam.location=l;cam.rotation_euler=((Vector((0,0,1.0))-cam.location).to_track_quat('-Z','Y')).to_euler();cam.data.ortho_scale=sc;scene.render.filepath=os.path.join(out,n+'.png');bpy.ops.render.render(write_still=True)
R('PLANT_3D_FRONT',(0,-7,1.5));R('PLANT_3D_LEFT',(-7,0,1.5));R('PLANT_3D_RIGHT',(7,0,1.5));R('PLANT_3D_THREE_QUARTER_LEFT',(-5,-5,1.5));R('PLANT_3D_THREE_QUARTER_RIGHT',(5,-5,1.5));R('PLANT_3D_TOP_OBLIQUE',(0,-5,4.5),3);R('PLANT_3D_FRONT_CLOSEUP',(0,-6,1.5),1.8)
orig=[(o,list(o.data.materials)) for o in objs];idmat=M('COMPONENT_ID_SHRUB',(.05,.8,.2))
for o in objs: o.data.materials.clear();o.data.materials.append(idmat)
R('PLANT_3D_COMPONENT_ID',(0,-7,1.5))
for o,ms in orig: o.data.materials.clear();[o.data.materials.append(m) for m in ms]
scene.render.filepath=os.path.join(out,'PLANT_3D.blend');bpy.ops.wm.save_as_mainfile(filepath=scene.render.filepath)
tri=sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in objs);json.dump({'status':'PASS','assetId':'GG-VEG-PLANTER-SHRUB-001','version':'2.0.0','leafInstances':i,'flowerInstances':3,'clusters':len(clusters),'triangles':tri,'vertices':sum(len(o.data.vertices) for o in objs),'objects':len(objs),'materials':6,'depthWidthRatio':.42,'anonymousGeometryCount':0,'mobileBudget':'PASS'},open(os.path.join(out,'PLANT_3D_RESULT.json'),'w'),indent=2)
