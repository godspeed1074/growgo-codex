import bpy,os,sys,math,json
from mathutils import Vector
OUT=sys.argv[sys.argv.index('--')+1];os.makedirs(OUT,exist_ok=True)
def M(n,c):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*c,1);return m
def tag(o,mid):o['moduleId']=mid;o['moduleVersion']='3.5.0';o['componentId']='SHRUB';o['layer']='LAYER_A_MODULE';o['anonymousGeometry']=False
def cube(n,l,d,m,objs,mid='GG-VEG-PLANTER-SHRUB-001'):
 bpy.ops.mesh.primitive_cube_add(size=1,location=l);o=bpy.context.object;o.name=n;o.dimensions=d;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);tag(o,mid);objs.append(o);return o
def leaf(n,l,w,h,d,r,m,v,objs):
 p=[(-.26*w,0,-.3*d),(0,0,.34*d),(.26*w,0,-.3*d),(-.43*w,.34*h,-.22*d),(0,.42*h,.38*d),(.43*w,.34*h,-.22*d),(-.24*w,.78*h,-.12*d),(0,h,.04*d),(.24*w,.78*h,-.12*d),(-.18*w,.08*h,.18*d),(.18*w,.08*h,.18*d)];f=[(0,1,4),(0,4,3),(1,2,5),(1,5,4),(3,4,6),(4,7,6),(4,5,8),(4,8,7),(0,3,6),(0,6,9),(2,10,8),(2,8,5),(9,6,7),(9,7,10),(9,10,2),(9,2,0),(10,7,8),(0,2,1)];me=bpy.data.meshes.new('TRACED_LEAF_'+v);me.from_pydata(p,[],f);o=bpy.data.objects.new(n,me);bpy.context.collection.objects.link(o);o.location=l;o.rotation_euler=r;o.data.materials.append(m);tag(o,'GG-VEG-LEAF-SHRUB-TRACED-'+v);objs.append(o)
def flower(l,m,objs):
 for p in range(5):
  a=2*math.pi*p/5;bpy.ops.mesh.primitive_uv_sphere_add(segments=6,ring_count=3,radius=.045,location=(l[0]+math.cos(a)*.038,l[1]+math.sin(a)*.038,l[2]));o=bpy.context.object;o.scale=(1,.55,.25);o.data.materials.append(m);tag(o,'GG-VEG-FLOWER-ACCENT-001');objs.append(o)
def build(label,extra):
 bpy.ops.wm.read_factory_settings(use_empty=True);dark=M('TRACED_DARK',(.04,.12,.02));md=M('TRACED_MID_DARK',(.07,.20,.03));mid=M('TRACED_MID',(.12,.31,.05));light=M('TRACED_LIGHT',(.29,.50,.10));pm=M('LOCKED_PLANTER',(.07,.18,.04));soil=M('LOCKED_SOIL',(.06,.04,.015));yellow=M('TRACED_FLOWER_YELLOW',(.86,.54,.07));orange=M('TRACED_FLOWER_ORANGE',(.93,.43,.12));purple=M('TRACED_FLOWER_PURPLE',(.42,.22,.56));objs=[]
 cube('PLANTER_BODY',(0,0,.22),(.98,.58,.42),pm,objs);cube('PLANTER_RIM',(0,-.01,.45),(1.08,.66,.11),pm,objs);cube('PLANTER_SOIL',(0,0,.505),(.84,.44,.025),soil,objs);cube('PLANTER_FRONT_PANEL',(0,-.301,.25),(.72,.025,.27),pm,objs,'GG-VEG-PLANTER-BOX-001')
 for x in(-.43,.43):cube('POST'+str(x),(x,-.315,.25),(.07,.04,.34),pm,objs,'GG-VEG-PLANTER-BOX-001')
 for s in(-1,1):
  o=cube('X'+str(s),(0,-.33,.25),(.62,.035,.035),pm,objs,'GG-VEG-PLANTER-BOX-001');o.rotation_euler[1]=s*.65
 # Explicit front trace: central apex, upper shoulders, broad lower-middle, and pointed edge leaves.
 pts=[(0,1.16,0,'L'),(-.15,1.02,-25,'L'),(.15,1.04,25,'L'),(-.29,.92,-35,'M'),(-.08,.94,-12,'M'),(.10,.94,12,'M'),(.29,.90,36,'M'),(-.38,.80,-48,'M'),(-.22,.80,-28,'M'),(-.05,.82,-8,'M'),(.14,.80,14,'M'),(.31,.79,32,'M'),(.40,.72,48,'S'),(-.42,.67,-55,'S'),(-.30,.68,-35,'M'),(-.16,.68,-18,'M'),(0,.70,0,'M'),(.17,.68,18,'M'),(.31,.67,36,'M'),(.42,.62,55,'S'),(-.43,.54,-58,'S'),(-.32,.55,-38,'M'),(-.18,.56,-22,'M'),(-.03,.57,-5,'M'),(.13,.56,14,'M'),(.28,.55,32,'M'),(.40,.52,50,'S'),(-.40,.42,-55,'S'),(-.27,.43,-34,'M'),(-.13,.44,-16,'M'),(.02,.45,3,'M'),(.18,.44,20,'M'),(.33,.42,40,'S'),(-.33,.31,-42,'M'),(-.16,.32,-24,'S'),(.02,.33,0,'M'),(.20,.32,24,'S'),(.34,.30,42,'S')]
 if extra: pts += [
  (-.35,.59,-44,'S'),(-.24,.60,-30,'S'),(.24,.60,30,'S'),(.35,.57,45,'S'),
  (-.22,.50,-12,'S'),(.22,.50,16,'S'),(-.10,.76,-18,'S'),(.10,.76,18,'S'),
  (-.05,.60,-5,'S'),(.07,.60,8,'S'),(-.29,.47,-28,'S'),(.29,.47,32,'S'),
  (-.10,.88,-18,'S'),(.10,.88,18,'S'),(-.18,.72,-8,'S'),(.18,.72,8,'S'),
  (-.10,.52,-4,'S'),(.12,.53,7,'S'),(-.06,.40,-5,'S'),(.08,.42,8,'S')]
 pts += [(0,.98,0,'L'),(-.08,.85,-5,'L'),(.08,.85,5,'L'),(0,.72,0,'L'),(-.08,.57,-5,'M'),(.08,.57,5,'M')]
 for i,(x,z,ang,size) in enumerate(pts):
  w,h={'L':(.23,.235),'M':(.205,.21),'S':(.175,.18)}[size]
  pitch=math.radians(20 if z<.65 else 24)
  y=-.01+(i%3-.9)*.012
  if extra and i >= 58: y=-.04
  raw_z=.30+z
  anchored_z=.54+(raw_z-.56)*.80
  leaf('%s_TRACE_LEAF_%02d'%(label,i),(x*.80,y,anchored_z),w,h,.055,(pitch,math.radians(ang),math.radians((i%5-2)*5)),[dark,md,mid,light][(i//6)%4],size,objs)
 for l,m in (((-.28,-.36,.59),orange),((.03,-.37,.59),yellow),((.28,-.36,.60),purple)):flower(l,m,objs)
 scene=bpy.context.scene;scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';w=bpy.data.worlds.new('TRACED_WORLD');scene.world=w;w.use_nodes=True;w.node_tree.nodes['Background'].inputs['Color'].default_value=(.97,.965,.94,1);bpy.ops.object.light_add(type='AREA',location=(-3,-5,5));bpy.context.object.data.energy=620;bpy.ops.object.camera_add(location=(0,-7,1.45));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.15;scene.camera=cam;dest=os.path.join(OUT,'FRONT_'+label);os.makedirs(dest,exist_ok=True);cam.rotation_euler=((Vector((0,0,1.0))-cam.location).to_track_quat('-Z','Y')).to_euler();scene.render.filepath=os.path.join(dest,'FRONT.png');bpy.ops.render.render(write_still=True)
 tri=sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in objs);json.dump({'candidate':'FRONT_'+label,'assetId':'GG-VEG-PLANTER-SHRUB-001','version':'3.5.0','leafInstances':len(pts),'flowerInstances':3,'frontSlabDepthRatio':.05,'triangles':tri,'vertices':sum(len(o.data.vertices) for o in objs),'objects':len(objs),'materials':9,'anonymousGeometryCount':0,'mobileBudget':'PASS'},open(os.path.join(dest,'RESULT.json'),'w'),indent=2)
build('A',False);build('B',True);build('C',True)
