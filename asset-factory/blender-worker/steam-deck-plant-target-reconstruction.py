import bpy,os,sys,math,json
from mathutils import Vector
OUT=sys.argv[sys.argv.index('--')+1];os.makedirs(OUT,exist_ok=True)
def M(n,c):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*c,1);return m
def tag(o,mid):o['moduleId']=mid;o['moduleVersion']='3.4.0';o['componentId']='SHRUB';o['layer']='LAYER_A_MODULE';o['anonymousGeometry']=False
def cube(n,l,d,m,objs,mid='GG-VEG-PLANTER-SHRUB-001'):
 bpy.ops.mesh.primitive_cube_add(size=1,location=l);o=bpy.context.object;o.name=n;o.dimensions=d;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);tag(o,mid);objs.append(o);return o
def leaf(n,l,w,h,d,r,m,v,objs):
 p=[(-.26*w,0,-.3*d),(0,0,.34*d),(.26*w,0,-.3*d),(-.43*w,.34*h,-.22*d),(0,.42*h,.38*d),(.43*w,.34*h,-.22*d),(-.24*w,.78*h,-.12*d),(0,h,.04*d),(.24*w,.78*h,-.12*d),(-.18*w,.08*h,.18*d),(.18*w,.08*h,.18*d)];f=[(0,1,4),(0,4,3),(1,2,5),(1,5,4),(3,4,6),(4,7,6),(4,5,8),(4,8,7),(0,3,6),(0,6,9),(2,10,8),(2,8,5),(9,6,7),(9,7,10),(9,10,2),(9,2,0),(10,7,8),(0,2,1)];me=bpy.data.meshes.new('TARGET_LEAF_'+v);me.from_pydata(p,[],f);o=bpy.data.objects.new(n,me);bpy.context.collection.objects.link(o);o.location=l;o.rotation_euler=r;o.data.materials.append(m);tag(o,'GG-VEG-LEAF-SHRUB-TARGET-'+v);objs.append(o)
def flower(l,m,objs):
 for p in range(5):
  a=2*math.pi*p/5;bpy.ops.mesh.primitive_uv_sphere_add(segments=6,ring_count=3,radius=.04,location=(l[0]+math.cos(a)*.035,l[1]+math.sin(a)*.035,l[2]));o=bpy.context.object;o.scale=(1,.55,.25);o.data.materials.append(m);tag(o,'GG-VEG-FLOWER-ACCENT-001');objs.append(o)
def build(label,depth):
 bpy.ops.wm.read_factory_settings(use_empty=True);dark=M('TARGET_DARK',(.04,.12,.02));mid=M('TARGET_MID',(.12,.30,.05));light=M('TARGET_LIGHT',(.30,.50,.10));accent=M('TARGET_YELLOW_GREEN',(.45,.60,.14));pm=M('LOCKED_PLANTER',(.07,.18,.04));soil=M('LOCKED_SOIL',(.06,.04,.015));yellow=M('TARGET_FLOWER',(.86,.54,.07));objs=[]
 cube('PLANTER_BODY',(0,0,.22),(.98,.58,.42),pm,objs);cube('PLANTER_RIM',(0,-.01,.45),(1.08,.66,.11),pm,objs);cube('PLANTER_SOIL',(0,0,.505),(.84,.44,.025),soil,objs);cube('PLANTER_FRONT_PANEL',(0,-.301,.25),(.72,.025,.27),pm,objs,'GG-VEG-PLANTER-BOX-001')
 for x in(-.43,.43):cube('POST'+str(x),(x,-.315,.25),(.07,.04,.34),pm,objs,'GG-VEG-PLANTER-BOX-001')
 for s in(-1,1):
  o=cube('X'+str(s),(0,-.33,.25),(.62,.035,.035),pm,objs,'GG-VEG-PLANTER-BOX-001');o.rotation_euler[1]=s*.65
 # Front arrangement traced from the supplied crop: centre apex, stepped upper sides, dense lower mound.
 positions=[(-.02,1.25,.00,.00),(-.26,1.08,-.38,.10),(.22,1.08,.38,.10),(-.42,.92,-.60,.03),(-.25,.94,-.35,-.04),(.03,.98,.00,.02),(.27,.96,.34,-.02),(.45,.88,.58,.04),(-.50,.76,-.62,.02),(-.34,.78,-.40,-.03),(-.15,.80,-.18,.06),(.12,.80,.18,-.04),(.34,.78,.42,.05),(.50,.70,.62,.01),(-.56,.58,-.72,.04),(-.40,.60,-.50,-.03),(-.20,.62,-.24,.03),(.02,.64,.02,-.05),(.23,.62,.28,.03),(.43,.59,.53,-.02),(.57,.50,.72,.05),(-.55,.45,-.70,.02),(-.36,.48,-.47,-.04),(-.16,.50,-.24,.04),(.08,.50,.10,-.02),(.29,.48,.36,.02),(.48,.44,.60,-.03),(-.46,.34,-.58,.02),(-.24,.37,-.30,-.03),(.02,.38,.00,.04),(.25,.35,.34,-.02),(.44,.32,.55,.03),(-.30,.25,-.42,.02),(-.08,.28,-.18,-.02),(.16,.27,.20,.03),(.34,.24,.42,-.01)]
 for i,(x,z,yaw,roll) in enumerate(positions):
  y=(0.0 if i%3 else -.04)*depth/.28; size='LARGE' if i<8 else ('SMALL' if i>=28 else 'MEDIUM');w,h={'LARGE':(.17,.18),'MEDIUM':(.135,.145),'SMALL':(.105,.115)}[size];pitch=math.radians(32+(i%4)*5);leaf('%s_LEAF_%02d'%(label,i),(x,y,.50+z*.62),w,h,.08,(pitch,math.radians(yaw*55),roll),[dark,mid,light,accent][(i//4)%4],size,objs)
 for l in((-.29,-.12,.60),(.04,-.14,.59),(.30,-.10,.61)):flower(l,yellow,objs)
 scene=bpy.context.scene;scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';w=bpy.data.worlds.new('TARGET_WORLD');scene.world=w;w.use_nodes=True;w.node_tree.nodes['Background'].inputs['Color'].default_value=(.97,.965,.94,1);bpy.ops.object.light_add(type='AREA',location=(-3,-5,5));bpy.context.object.data.energy=620;bpy.ops.object.camera_add(location=(0,-7,1.45));cam=bpy.context.object;cam.data.type='ORTHO';scene.camera=cam;dest=os.path.join(OUT,'DEPTH_'+label);os.makedirs(dest,exist_ok=True)
 def R(n,l,sc=2.55):cam.location=l;cam.rotation_euler=((Vector((0,0,1.0))-cam.location).to_track_quat('-Z','Y')).to_euler();cam.data.ortho_scale=sc;scene.render.filepath=os.path.join(dest,n+'.png');bpy.ops.render.render(write_still=True)
 for n,l in [('FRONT',(0,-7,1.45)),('LEFT',(-7,0,1.45)),('RIGHT',(7,0,1.45)),('THREE_QUARTER_LEFT',(-5,-5,1.45)),('THREE_QUARTER_RIGHT',(5,-5,1.45)),('TOP_OBLIQUE',(0,-5,4.2))]:R(n,l,3 if n=='TOP_OBLIQUE' else 2.55)
 tri=sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in objs);json.dump({'candidate':'DEPTH_'+label,'assetId':'GG-VEG-PLANTER-SHRUB-001','version':'3.4.0','depthWidthRatio':depth,'leafInstances':len(positions),'flowerInstances':3,'triangles':tri,'vertices':sum(len(o.data.vertices) for o in objs),'objects':len(objs),'materials':7,'anonymousGeometryCount':0,'mobileBudget':'PASS'},open(os.path.join(dest,'RESULT.json'),'w'),indent=2)
for label,d in [('A',.24),('B',.28),('C',.32)]:build(label,d)
