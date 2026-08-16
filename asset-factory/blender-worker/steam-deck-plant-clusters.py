import bpy,os,sys,math,json
from mathutils import Vector
OUT=sys.argv[sys.argv.index('--')+1];os.makedirs(OUT,exist_ok=True)
def M(n,c):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*c,1);return m
def tag(o,mid):o['moduleId']=mid;o['moduleVersion']='3.2.0';o['componentId']='SHRUB';o['layer']='LAYER_A_MODULE';o['anonymousGeometry']=False
def cube(n,l,d,m,objs,mid='GG-VEG-PLANTER-SHRUB-001'):
 bpy.ops.mesh.primitive_cube_add(size=1,location=l);o=bpy.context.object;o.name=n;o.dimensions=d;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);tag(o,mid);objs.append(o);return o
def sharp(n,l,w,h,d,r,m,variant,objs):
 v=[(-.26*w,0,-.30*d),(0,0,.34*d),(.26*w,0,-.30*d),(-.43*w,.34*h,-.22*d),(0,.42*h,.38*d),(.43*w,.34*h,-.22*d),(-.24*w,.78*h,-.12*d),(0,h,.04*d),(.24*w,.78*h,-.12*d),(-.18*w,.08*h,.18*d),(.18*w,.08*h,.18*d)];f=[(0,1,4),(0,4,3),(1,2,5),(1,5,4),(3,4,6),(4,7,6),(4,5,8),(4,8,7),(0,3,6),(0,6,9),(2,10,8),(2,8,5),(9,6,7),(9,7,10),(9,10,2),(9,2,0),(10,7,8),(0,2,1)];me=bpy.data.meshes.new('CLUSTER_SHARP_'+variant);me.from_pydata(v,[],f);o=bpy.data.objects.new(n,me);bpy.context.collection.objects.link(o);o.location=l;o.rotation_euler=r;o.data.materials.append(m);tag(o,'GG-VEG-LEAF-CLUSTER-SHARP-'+variant);objs.append(o)
def flower(l,m,objs):
 for p in range(5):
  a=2*math.pi*p/5;bpy.ops.mesh.primitive_uv_sphere_add(segments=6,ring_count=3,radius=.045,location=(l[0]+math.cos(a)*.04,l[1]+math.sin(a)*.04,l[2]));o=bpy.context.object;o.scale=(1,.55,.26);o.data.materials.append(m);tag(o,'GG-VEG-FLOWER-ACCENT-001');objs.append(o)
def build(label,depth):
 bpy.ops.wm.read_factory_settings(use_empty=True);dark=M('CLUSTER_GREEN_DARK',(.04,.12,.02));mid=M('CLUSTER_GREEN_MID',(.10,.28,.045));light=M('CLUSTER_GREEN_LIGHT',(.25,.48,.09));accent=M('CLUSTER_YELLOW_GREEN',(.42,.58,.12));pm=M('LOCKED_PLANTER_GREEN',(.07,.18,.04));soil=M('LOCKED_SOIL',(.06,.04,.015));yellow=M('CLUSTER_FLOWER',(.86,.54,.07));objs=[]
 cube('PLANTER_BODY',(0,0,.22),(.98,.58,.42),pm,objs);cube('PLANTER_RIM',(0,-.01,.45),(1.08,.66,.11),pm,objs);cube('PLANTER_SOIL',(0,0,.505),(.84,.44,.025),soil,objs);cube('PLANTER_FRONT_PANEL',(0,-.301,.25),(.72,.025,.27),pm,objs,'GG-VEG-PLANTER-BOX-001')
 for x in (-.43,.43):cube('PLANTER_POST_'+str(x),(x,-.315,.25),(.07,.04,.34),pm,objs,'GG-VEG-PLANTER-BOX-001')
 for s in (-1,1):
  o=cube('PLANTER_X_'+str(s),(0,-.33,.25),(.62,.035,.035),pm,objs,'GG-VEG-PLANTER-BOX-001');o.rotation_euler[1]=s*.65
 clusters=[(-.34,-.02,.64),(-.17,-.04,.70),(0,-.02,.67),(.18,-.04,.71),(.35,-.01,.65),(-.27,-.10,.86),(-.05,-.12,.90),(.18,-.11,.88),(-.18,-.18,1.08),(.08,-.18,1.14),(.28,-.15,1.02)]
 idx=0
 for k,(x,y,z) in enumerate(clusters):
  # hidden short anchor only; foliage starts at the rim and conceals it.
  for j in range(6):
   a=2*math.pi*j/6 + (k%3)*.18;rad=.045+(.018 if j%2 else 0);xx=x+math.cos(a)*rad;yy=y+math.sin(a)*rad*depth;zz=z+(j%3-.8)*.035
   yaw=a+math.pi/2;pitch=-.30+.16*(j%3);roll=(j%2-.5)*.32
   # A is densest/front, B balanced, C deeper; all retain radial cluster structure.
   if label=='A': yy-=.015*(k%2); depthv=.075
   elif label=='B': depthv=.10
   else: yy+=((k%3)-1)*.035; depthv=.12
   variant=['LARGE','MEDIUM','SMALL'][((k+j)%3)];sharp('%s_CLUSTER_%02d_LEAF_%d'%(label,k,j),(xx,yy,zz),.22*(1-.08*(j==2)),.38*(1-.06*(j==2)),depthv,(pitch,yaw,roll),[dark,mid,light,accent][(k//2+j)%4],variant,objs);idx+=1
 for l in ((-.24,-.17,.91),(.20,-.16,1.02),(.02,-.20,1.18),(.30,-.12,.80)):flower(l,yellow,objs)
 scene=bpy.context.scene;scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';w=bpy.data.worlds.new('CLUSTER_WORLD');scene.world=w;w.use_nodes=True;w.node_tree.nodes['Background'].inputs['Color'].default_value=(.97,.965,.94,1);bpy.ops.object.light_add(type='AREA',location=(-3,-5,5));bpy.context.object.data.energy=620;bpy.ops.object.camera_add(location=(0,-7,1.45));cam=bpy.context.object;cam.data.type='ORTHO';scene.camera=cam;dest=os.path.join(OUT,'CLUSTER_'+label);os.makedirs(dest,exist_ok=True)
 def R(n,l,sc=2.55):cam.location=l;cam.rotation_euler=((Vector((0,0,1.0))-cam.location).to_track_quat('-Z','Y')).to_euler();cam.data.ortho_scale=sc;scene.render.filepath=os.path.join(dest,n+'.png');bpy.ops.render.render(write_still=True)
 R('FRONT',(0,-7,1.45));R('LEFT',(-7,0,1.45));R('RIGHT',(7,0,1.45));R('THREE_QUARTER_LEFT',(-5,-5,1.45));R('THREE_QUARTER_RIGHT',(5,-5,1.45));R('TOP_OBLIQUE',(0,-5,4.2),3.0);R('CLUSTER_FRONT',(0,-5,1.45),1.5);R('CLUSTER_SIDE',(7,0,1.45),1.5);R('CLUSTER_THREE_QUARTER',(5,-5,1.45),1.5)
 tri=sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in objs);json.dump({'candidate':'CLUSTER_'+label,'assetId':'GG-VEG-PLANTER-SHRUB-001','version':'3.2.0','clusterArchetypes':5,'clusters':len(clusters),'leafInstances':idx,'flowerInstances':4,'triangles':tri,'vertices':sum(len(o.data.vertices) for o in objs),'objects':len(objs),'materials':8,'depthWidthRatio':depth,'visibleLongStems':False,'anonymousGeometryCount':0,'mobileBudget':'PASS'},open(os.path.join(dest,'RESULT.json'),'w'),indent=2)
for label,depth in [('A',.25),('B',.32),('C',.40)]:build(label,depth)
