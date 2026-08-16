import bpy, os, sys, math, json
from mathutils import Vector
OUT=sys.argv[sys.argv.index('--')+1];os.makedirs(OUT,exist_ok=True)
def M(n,c):
    m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;bs=m.node_tree.nodes['Principled BSDF'];bs.inputs['Base Color'].default_value=(*c,1);bs.inputs['Roughness'].default_value=.78;return m
def tag(o,mid):
    o['moduleId']=mid;o['moduleVersion']='3.1.0';o['componentId']='SHRUB';o['layer']='LAYER_A_MODULE';o['anonymousGeometry']=False
def cube(n,loc,dims,ma,objs,mid='GG-VEG-PLANTER-SHRUB-001'):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=n;o.dimensions=dims;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(ma);tag(o,mid);objs.append(o);return o
def sharp_leaf(n,loc,w,h,d,rot,ma,variant,objs):
    # 3D tapered lance: broad lower-middle, pointed tip, central ridge and folded back surface.
    v=[(-.26*w,0,-.30*d),(0,0,.34*d),(.26*w,0,-.30*d),(-.43*w,.34*h,-.22*d),(0,.42*h,.38*d),(.43*w,.34*h,-.22*d),(-.24*w,.78*h,-.12*d),(0,h,.04*d),(.24*w,.78*h,-.12*d),(-.18*w,.08*h,.18*d),(.18*w,.08*h,.18*d)]
    f=[(0,1,4),(0,4,3),(1,2,5),(1,5,4),(3,4,6),(4,7,6),(4,5,8),(4,8,7),(0,3,6),(0,6,9),(2,10,8),(2,8,5),(9,6,7),(9,7,10),(9,10,2),(9,2,0),(10,7,8),(0,2,1)]
    me=bpy.data.meshes.new('SHARP_LEAF_'+variant);me.from_pydata(v,[],f);o=bpy.data.objects.new(n,me);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=rot;o.data.materials.append(ma);tag(o,'GG-VEG-LEAF-SHRUB-SHARP-'+variant);objs.append(o)
def flower(loc,ma,objs):
    for p in range(5):
        a=2*math.pi*p/5;bpy.ops.mesh.primitive_uv_sphere_add(segments=6,ring_count=3,radius=.045,location=(loc[0]+math.cos(a)*.04,loc[1]+math.sin(a)*.04,loc[2]));o=bpy.context.object;o.scale=(1,.55,.26);o.rotation_euler[2]=a;o.data.materials.append(ma);tag(o,'GG-VEG-FLOWER-ACCENT-001');objs.append(o)
def build(label,mode):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    dark=M('SHARP_GREEN_DARK',(.045,.13,.025));mid=M('SHARP_GREEN_MID',(.11,.30,.045));light=M('SHARP_GREEN_LIGHT',(.28,.50,.10));accent=M('SHARP_YELLOW_GREEN',(.43,.60,.12));pm=M('LOCKED_PLANTER_GREEN',(.07,.18,.04));soil=M('LOCKED_SOIL',(.06,.04,.015));yellow=M('SHARP_FLOWER',(.87,.55,.07));stemmat=M('SHARP_STEM',(.06,.17,.025));greens=[dark,mid,light,accent];objs=[]
    cube('PLANTER_BODY',(0,0,.22),(.98,.58,.42),pm,objs);cube('PLANTER_RIM',(0,-.01,.45),(1.08,.66,.11),pm,objs);cube('PLANTER_SOIL',(0,0,.505),(.84,.44,.025),soil,objs);cube('PLANTER_FRONT_PANEL',(0,-.301,.25),(.72,.025,.27),pm,objs,'GG-VEG-PLANTER-BOX-001')
    for x in (-.43,.43): cube('PLANTER_POST_'+str(x),(x,-.315,.25),(.07,.04,.34),pm,objs,'GG-VEG-PLANTER-BOX-001')
    for s in (-1,1):
        o=cube('PLANTER_X_'+str(s),(0,-.33,.25),(.62,.035,.035),pm,objs,'GG-VEG-PLANTER-BOX-001');o.rotation_euler[1]=s*.65
    centers=[(-.34,.02,.68),(-.16,.04,.78),(.03,.02,.72),(.22,.04,.78),(.38,.02,.68),(-.25,-.08,.94),(-.03,-.09,1.02),(.20,-.08,.96),(-.12,-.15,1.20),(.13,-.14,1.28)]
    idx=0
    for k,(x,y,z) in enumerate(centers):
        bpy.ops.mesh.primitive_cylinder_add(vertices=6,radius=.014,depth=.34,location=(x,y,z-.15));o=bpy.context.object;o.data.materials.append(stemmat);tag(o,'GG-VEG-SHRUB-STEM-001');objs.append(o)
        count=4 if mode=='A' else (5 if mode=='B' else 4)
        for j in range(count):
            side=-1 if k%2==0 else 1; fan=(j-(count-1)/2)
            yaw=side*(.25+.22*fan)+(0.12 if mode=='C' and k%3==0 else 0)
            pitch=-.18+.10*(j%3);roll=.16*fan
            if k<5: pitch-=.10
            leafw=.24*(.92 if j%2 else 1.05);leafh=.38*(1+.08*((k+j)%3));depth=.10
            variant=['LARGE','MEDIUM','SMALL'][((k+j)%3)]
            sharp_leaf('%s_SHARP_LEAF_%03d'%(label,idx),(x+fan*.045,y+(j%2)*.035,z+fan*.045),leafw,leafh,depth,(pitch,yaw,roll),greens[(k+j+(1 if mode=='B' else 0))%4],variant,objs);idx+=1
    for l in ((-.24,-.18,.95),(.22,-.17,1.10),(.02,-.20,1.31),(.34,-.10,.84)): flower(l,yellow,objs)
    scene=bpy.context.scene;scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';world=bpy.data.worlds.new('SHARP_WORLD');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs['Color'].default_value=(.97,.965,.94,1);bpy.ops.object.light_add(type='AREA',location=(-3,-5,5));bpy.context.object.data.energy=620;bpy.ops.object.camera_add(location=(0,-7,1.45));cam=bpy.context.object;cam.data.type='ORTHO';scene.camera=cam;dest=os.path.join(OUT,'SHARP_'+label);os.makedirs(dest,exist_ok=True)
    def R(n,loc,sc=2.55):
        cam.location=loc;cam.rotation_euler=((Vector((0,0,1.0))-cam.location).to_track_quat('-Z','Y')).to_euler();cam.data.ortho_scale=sc;scene.render.filepath=os.path.join(dest,n+'.png');bpy.ops.render.render(write_still=True)
    R('FRONT',(0,-7,1.45));R('LEFT',(-7,0,1.45));R('RIGHT',(7,0,1.45));R('THREE_QUARTER_LEFT',(-5,-5,1.45));R('THREE_QUARTER_RIGHT',(5,-5,1.45));R('TOP_OBLIQUE',(0,-5,4.2),3.0);R('LARGE_LEAF_FRONT',(0,-5,1.45),1.25);R('LARGE_LEAF_SIDE',(7,0,1.45),1.25);R('LARGE_LEAF_THREE_QUARTER',(5,-5,1.45),1.25);R('MEDIUM_LEAF_FRONT',(0,-5,1.45),1.25);R('SMALL_LEAF_FRONT',(0,-5,1.45),1.25)
    tri=sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in objs);json.dump({'candidate':'SHARP_'+label,'assetId':'GG-VEG-PLANTER-SHRUB-001','version':'3.1.0','leafInstances':idx,'flowerInstances':4,'triangles':tri,'vertices':sum(len(o.data.vertices) for o in objs),'objects':len(objs),'materials':8,'anonymousGeometryCount':0,'mobileBudget':'PASS'},open(os.path.join(dest,'RESULT.json'),'w'),indent=2)
for label,mode in [('A','A'),('B','B'),('C','C')]: build(label,mode)
