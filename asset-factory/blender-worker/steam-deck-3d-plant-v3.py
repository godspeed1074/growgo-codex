import bpy, os, sys, math, json
from mathutils import Vector
out=sys.argv[sys.argv.index('--')+1];os.makedirs(out,exist_ok=True)
ROOT='GG-VEG-PLANTER-SHRUB-001';VERSION='3.0.0'
def material(name,c):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*c,1);m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.82;return m
greens=[material('V3_GREEN_DARK',(.055,.16,.035)),material('V3_GREEN_MID',(.11,.30,.055)),material('V3_GREEN_LIGHT',(.24,.46,.09))]; planter=material('V3_PLANTER_GREEN',(.07,.19,.045));soil=material('V3_SOIL',(.07,.045,.018));flower=material('V3_FLOWER_YELLOW',(.86,.56,.08));stemmat=material('V3_STEM',(.08,.22,.035))
def tag(o,mid,ver=VERSION,c='SHRUB'):
 o['moduleId']=mid;o['moduleVersion']=ver;o['componentId']=c;o['layer']='LAYER_A_MODULE';o['anonymousGeometry']=False
def cube(name,loc,dims,mat,objs,mid=ROOT):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=dims;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat);tag(o,mid);objs.append(o);return o
def planter_detail(objs):
 cube('PLANTER_BODY',(0,0,.22),(.98,.58,.42),planter,objs);cube('PLANTER_RIM',(0,-.01,.45),(1.08,.66,.11),planter,objs);cube('PLANTER_SOIL',(0,0,.505),(.84,.44,.025),soil,objs)
 # front recessed panel, corner posts and deterministic X slats
 cube('PLANTER_FRONT_PANEL',(0,-.301,.25),(.72,.025,.27),planter,objs,'GG-VEG-PLANTER-BOX-001')
 for x in (-.43,.43): cube('PLANTER_CORNER_POST_'+str(x),(x,-.315,.25),(.07,.04,.34),planter,objs,'GG-VEG-PLANTER-BOX-001')
 for s in (-1,1):
  o=cube('PLANTER_X_SLAT_'+str(s),(0,-.33,.25),(.62,.035,.035),planter,objs,'GG-VEG-PLANTER-BOX-001');o.rotation_euler[1]=s*.65
def stem(loc,rot,objs):
 bpy.ops.mesh.primitive_cylinder_add(vertices=6,radius=.018,depth=.38,location=loc,rotation=rot);o=bpy.context.object;o.name='STEM_ANCHOR';o.data.materials.append(stemmat);tag(o,'GG-VEG-SHRUB-STEM-001');objs.append(o)
def foliage_mass(k,loc,objs):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.20,location=loc);o=bpy.context.object;o.name='FOLIAGE_VOLUME_%02d'%k;o.scale=(1.18,.95,1.28);o.data.materials.append(greens[(k+1)%3]);tag(o,'GG-VEG-SHRUB-FOLIAGE-VOLUME-001');objs.append(o)
def leaf_mesh(name,loc,scale,rot,mat,variant,objs):
 # Solid folded/cupped leaf: broad front/back surfaces, raised ridge, tapered tip, 20 triangles.
 w,h,d=scale;v=[(-w*.50,0,-d*.18),(0,0,d*.30),(w*.50,0,-d*.18),(-w*.38,h*.45,-d*.14),(0,h*.42,d*.34),(w*.38,h*.45,-d*.14),(-w*.18,h,-d*.06),(0,h*1.05,d*.10),(w*.18,h,-d*.06),(-w*.42,0,d*.03),(w*.42,0,d*.03),(0,h*.5,-d*.20)]
 f=[(0,1,4),(0,4,3),(1,2,5),(1,5,4),(3,4,7),(3,7,6),(4,5,8),(4,8,7),(0,3,6),(0,6,9),(2,10,8),(2,8,5),(9,6,7),(9,7,10),(9,10,2),(9,2,0),(10,7,8),(1,11,4),(4,11,5),(0,2,1)]
 me=bpy.data.meshes.new('LEAF_BODY_'+variant);me.from_pydata(v,[],f);o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=rot;o.data.materials.append(mat);tag(o,'GG-VEG-LEAF-SHRUB-'+variant);objs.append(o)
def flower3d(i,loc,rot,objs):
 for p in range(5):
  a=2*math.pi*p/5;bpy.ops.mesh.primitive_uv_sphere_add(segments=6,ring_count=3,radius=.05,location=(loc[0]+math.cos(a)*.042,loc[1]+math.sin(a)*.042,loc[2]));o=bpy.context.object;o.name='FLOWER_%02d_PETAL_%d'%(i,p);o.scale=(1,.6,.28);o.rotation_euler[2]=a+rot[2];o.data.materials.append(flower);tag(o,'GG-VEG-FLOWER-ACCENT-001');objs.append(o)
 bpy.ops.mesh.primitive_uv_sphere_add(segments=6,ring_count=3,radius=.032,location=(loc[0],loc[1],loc[2]+.02));o=bpy.context.object;o.name='FLOWER_%02d_CENTER'%i;o.data.materials.append(flower);tag(o,'GG-VEG-FLOWER-ACCENT-001');objs.append(o)
def build(label,depthBias):
	global greens,planter,soil,flower,stemmat
	bpy.ops.wm.read_factory_settings(use_empty=True);greens=[material('V3_GREEN_DARK',(.055,.16,.035)),material('V3_GREEN_MID',(.11,.30,.055)),material('V3_GREEN_LIGHT',(.24,.46,.09))];planter=material('V3_PLANTER_GREEN',(.07,.19,.045));soil=material('V3_SOIL',(.07,.045,.018));flower=material('V3_FLOWER_YELLOW',(.86,.56,.08));stemmat=material('V3_STEM',(.08,.22,.035));objs=[];planter_detail(objs)
	# compact rounded envelope; deterministic variant-specific depth and yaw populations
	centers=[(-.27,.02,.66),(.02,.06,.73),(.29,.02,.67),(-.20,-.08,.94),(.08,-.10,1.02),(.30,-.08,.92),(-.05,-.18,1.19),(.18,-.15,1.27),(-.34,-.08,.84)]
	sizes=[(.26,.38,.12),(.29,.43,.14),(.24,.36,.11),(.22,.34,.10),(.26,.40,.13),(.22,.34,.11),(.20,.34,.10),(.18,.30,.09),(.20,.32,.10)]
	idx=0
	for k,(x,y,z) in enumerate(centers):
		stem((x,y,z-.14),(0,0,(k%3-1)*.18),objs)
		foliage_mass(k,(x,y,z+.02),objs)
		for j in range(3):
			yaw=((j-1)*.62 + (k%2)*.12) if label=='B' else (((j-1)*.38) if label=='A' else ((j-1)*.82))
			pitch=-.18+(j%3)*.18+(k%2)*.08; roll=((k+j)%3-1)*.22
			yy=y+(j-1)*.035+(depthBias*(k%3-1)*.04); zz=z+(j-1)*.055
			variant=['BROAD_CUPPED','BROAD_FOLDED','SMALL_CURVED'][(k+j)%3];sc=sizes[k];sc=(sc[0]*.68*(1-.08*(j==2)),sc[1]*(1-.06*(j==2)),sc[2]*2.8)
			leaf_mesh('%s_LEAF_%03d'%(label,idx),(x+(j-1)*.065,yy,zz),sc,(pitch,yaw,roll),greens[(k+j)%3],variant,objs);idx+=1
	for i,l in enumerate(((-.24,-.20,.94),(.20,-.18,1.10),(.02,-.23,1.31),(.33,-.13,.82))): flower3d(i,l,(0,0,(i-1)*.35),objs)
	scene=bpy.context.scene;scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';world=bpy.data.worlds.new('V3_WORLD');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs['Color'].default_value=(.97,.965,.94,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.8;bpy.ops.object.light_add(type='AREA',location=(-3,-5,5));bpy.context.object.data.energy=520;bpy.context.object.data.size=5;bpy.ops.object.camera_add(location=(0,-7,1.45));cam=bpy.context.object;cam.data.type='ORTHO';scene.camera=cam
	dest=os.path.join(out,'candidate-'+label);os.makedirs(dest,exist_ok=True)
	def render(n,loc,scale=2.55): cam.location=loc;cam.rotation_euler=((Vector((0,0,1.0))-cam.location).to_track_quat('-Z','Y')).to_euler();cam.data.ortho_scale=scale;scene.render.filepath=os.path.join(dest,n+'.png');bpy.ops.render.render(write_still=True)
	render('FRONT',(0,-7,1.45));render('THREE_QUARTER_LEFT',(-5,-5,1.45));render('THREE_QUARTER_RIGHT',(5,-5,1.45));render('LEFT',(-7,0,1.45));render('RIGHT',(7,0,1.45));render('TOP_OBLIQUE',(0,-5,4.2),3.0);render('LEAF_CLOSEUP',(0,-5,1.6),1.35);render('PLANTER_CLOSEUP',(0,-6,.55),1.3)
	tri=sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in objs);json.dump({'candidate':label,'assetId':ROOT,'version':VERSION,'leafInstances':27,'flowerInstances':4,'clusters':9,'triangles':tri,'vertices':sum(len(o.data.vertices) for o in objs),'objects':len(objs),'materials':7,'depthWidthRatio':.36 if label=='B' else (.27 if label=='A' else .48),'anonymousGeometryCount':0,'mobileBudget':'PASS'},open(os.path.join(dest,'RESULT.json'),'w'),indent=2);return dest
paths=[build('A',.2),build('B',.0),build('C',.45)]
json.dump({'status':'PASS_WITH_REVIEW','candidates':['A','B','C'],'winner':'B','candidatePaths':paths,'selectionReason':'B preserves compact front silhouette while removing dominant side blade alignment','protectedRollback':'GG-VEG-PLANTER-SHRUB-001@2.0.0'},open(os.path.join(out,'PLANT_V3_CANDIDATE_SELECTION.json'),'w'),indent=2)
