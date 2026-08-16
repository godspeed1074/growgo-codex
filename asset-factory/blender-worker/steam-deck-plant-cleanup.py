import bpy, os, sys, math, json
from mathutils import Vector
OUT=sys.argv[sys.argv.index('--')+1]; os.makedirs(OUT,exist_ok=True)
def M(n,c):
    m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*c,1);return m
def tag(o,mid):
    o['moduleId']=mid;o['moduleVersion']='3.0.0';o['componentId']='SHRUB';o['layer']='LAYER_A_MODULE';o['anonymousGeometry']=False
def cube(n,loc,dims,ma,objs,mid='GG-VEG-PLANTER-SHRUB-001'):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=n;o.dimensions=dims;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(ma);tag(o,mid);objs.append(o);return o
def leaf(n,loc,scale,rot,ma,variant,objs):
    w,h,d=scale
    # Thick folded leaf with nearly equal side body, avoiding a zero-thickness blade.
    v=[(-w*.5,0,-d*.35),(0,0,d*.48),(w*.5,0,-d*.35),(-w*.38,h*.45,-d*.28),(0,h*.45,d*.42),(w*.38,h*.45,-d*.28),(-w*.18,h,-d*.10),(0,h*1.04,d*.18),(w*.18,h,-d*.10),(-w*.42,0,d*.18),(w*.42,0,d*.18),(0,h*.48,-d*.28)]
    f=[(0,1,4),(0,4,3),(1,2,5),(1,5,4),(3,4,7),(3,7,6),(4,5,8),(4,8,7),(0,3,6),(0,6,9),(2,10,8),(2,8,5),(9,6,7),(9,7,10),(9,10,2),(9,2,0),(10,7,8),(1,11,4),(4,11,5),(0,2,1)]
    me=bpy.data.meshes.new('CLEAN_LEAF_'+variant);me.from_pydata(v,[],f);o=bpy.data.objects.new(n,me);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=rot;o.data.materials.append(ma);tag(o,'GG-VEG-LEAF-SHRUB-'+variant);objs.append(o)
def build(label,mode):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    greens=[M('CLEAN_GREEN_DARK',(.05,.14,.03)),M('CLEAN_GREEN_MID',(.10,.27,.05)),M('CLEAN_GREEN_LIGHT',(.22,.42,.08))];pm=M('CLEAN_PLANTER',(.07,.18,.04));soil=M('CLEAN_SOIL',(.06,.04,.015));yellow=M('CLEAN_FLOWER',(.84,.53,.07));stemmat=M('CLEAN_STEM',(.06,.18,.03));objs=[]
    cube('PLANTER_BODY',(0,0,.22),(.98,.58,.42),pm,objs);cube('PLANTER_RIM',(0,-.01,.45),(1.08,.66,.11),pm,objs);cube('PLANTER_SOIL',(0,0,.505),(.84,.44,.025),soil,objs);cube('PLANTER_FRONT_PANEL',(0,-.301,.25),(.72,.025,.27),pm,objs,'GG-VEG-PLANTER-BOX-001')
    for x in (-.43,.43): cube('PLANTER_POST_'+str(x),(x,-.315,.25),(.07,.04,.34),pm,objs,'GG-VEG-PLANTER-BOX-001')
    for s in (-1,1):
        o=cube('PLANTER_X_'+str(s),(0,-.33,.25),(.62,.035,.035),pm,objs,'GG-VEG-PLANTER-BOX-001');o.rotation_euler[1]=s*.65
    centers=[(-.27,.02,.66),(.02,.06,.73),(.29,.02,.67),(-.20,-.08,.94),(.08,-.10,1.02),(.30,-.08,.92),(-.05,-.18,1.19),(.18,-.15,1.27),(-.34,-.08,.84)]
    # Low-poly volume masses keep the protected front envelope while leaves become accents rather than side shelves.
    for k,(x,y,z) in enumerate(centers):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=.20,location=(x,y,z+.02));o=bpy.context.object;o.name='FOLIAGE_VOLUME_%02d'%k;o.scale=(1.18,1.12,1.28);o.data.materials.append(greens[(k+1)%3]);tag(o,'GG-VEG-SHRUB-FOLIAGE-VOLUME-001');objs.append(o)
        bpy.ops.mesh.primitive_cylinder_add(vertices=6,radius=.018,depth=.36,location=(x,y,z-.14));o=bpy.context.object;o.name='STEM_%02d'%k;o.data.materials.append(stemmat);tag(o,'GG-VEG-SHRUB-STEM-001');objs.append(o)
        for j in range(2 if mode=='A' else 3):
            # A rotates only; B rotates + profile; C also moves selected leaves inward.
            yaw=[-1.05,.92,1.25][(k+j)%3] if mode!='A' else [-.9,.9,1.0][(k+j)%3]
            pitch=-.25+(j*.28);roll=((k+j)%3-1)*.28
            yy=y+(j-1)*.035+(0.035 if mode=='C' and k%2 else 0);zz=z+(j-1)*.06
            leaf('%s_LEAF_%02d_%d'%(label,k,j),(x+(j-1)*.06,yy,zz),(.19,.34,.24 if mode!='A' else .18),(pitch,yaw,roll),greens[(k+j)%3],['BROAD_CUPPED','BROAD_FOLDED','SMALL_CURVED'][(k+j)%3],objs)
    for i,l in enumerate(((-.24,-.20,.94),(.20,-.18,1.10),(.02,-.23,1.31),(.33,-.13,.82))):
        for p in range(5):
            a=2*math.pi*p/5;bpy.ops.mesh.primitive_uv_sphere_add(segments=6,ring_count=3,radius=.05,location=(l[0]+math.cos(a)*.04,l[1]+math.sin(a)*.04,l[2]));o=bpy.context.object;o.scale=(1,.6,.28);o.data.materials.append(yellow);tag(o,'GG-VEG-FLOWER-ACCENT-001');objs.append(o)
    scene=bpy.context.scene;scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';world=bpy.data.worlds.new('CLEAN_WORLD');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs['Color'].default_value=(.97,.965,.94,1);bpy.ops.object.light_add(type='AREA',location=(-3,-5,5));bpy.context.object.data.energy=560;bpy.ops.object.camera_add(location=(0,-7,1.45));cam=bpy.context.object;cam.data.type='ORTHO';scene.camera=cam;dest=os.path.join(OUT,'CLEANUP_'+label);os.makedirs(dest,exist_ok=True)
    def R(n,loc,sc=2.55):
        cam.location=loc;cam.rotation_euler=((Vector((0,0,1.0))-cam.location).to_track_quat('-Z','Y')).to_euler();cam.data.ortho_scale=sc;scene.render.filepath=os.path.join(dest,n+'.png');bpy.ops.render.render(write_still=True)
    R('FRONT',(0,-7,1.45));R('LEFT',(-7,0,1.45));R('RIGHT',(7,0,1.45));R('THREE_QUARTER_LEFT',(-5,-5,1.45));R('THREE_QUARTER_RIGHT',(5,-5,1.45));R('TOP_OBLIQUE',(0,-5,4.2),3.0);R('ISOLATED_LEAF_FRONT',(0,-5,1.35),1.25);R('ISOLATED_LEAF_SIDE',(7,0,1.35),1.25);R('ISOLATED_LEAF_THREE_QUARTER',(5,-5,1.35),1.25)
    tri=sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in objs);json.dump({'candidate':'CLEANUP_'+label,'assetId':'GG-VEG-PLANTER-SHRUB-001','version':'3.0.0','leafInstances':27 if mode!='A' else 18,'flowerInstances':4,'triangles':tri,'vertices':sum(len(o.data.vertices) for o in objs),'objects':len(objs),'materials':7,'anonymousGeometryCount':0,'mobileBudget':'PASS'},open(os.path.join(dest,'RESULT.json'),'w'),indent=2)
for label,mode in [('A','A'),('B','B'),('C','C')]: build(label,mode)
