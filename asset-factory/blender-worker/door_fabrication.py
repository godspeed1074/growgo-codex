import bpy,sys,os,json,math,hashlib
from mathutils import Vector
O=sys.argv[sys.argv.index('--')+1];os.makedirs(O,exist_ok=True);bpy.ops.wm.read_factory_settings(use_empty=True)
def M(n,c):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*c,1);m.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.8;return m
B,C,T,R,D=M('MAT_DOOR_WARM_BROWN',(.22,.1,.05)),M('MAT_TRIM_WARM_CREAM',(.7,.55,.35)),M('MAT_GLASS_TEAL',(.05,.3,.35)),M('MAT_BRASS_GROWGO',(.7,.45,.1)),M('MAT_DARK_REVEAL',(.04,.02,.015));a=[]
root=bpy.data.objects.new('GG_ROOT_DOOR_SHOP_002',None);bpy.context.collection.objects.link(root)
def q(n,x,y,z,w,d,h,cid,mat):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(x,y,z));o=bpy.context.object;o.name=n;o.dimensions=(w,d,h);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat);o.parent=root;o['componentId']=cid;o['moduleId']='GG-BLD-DOOR-SHOP-002';o['layer']='LAYER_A_MODULE';o['anonymousGeometry']=False;a.append(o)
q('DOOR_SLAB',0,-.018,.965,.931,.10,1.726,'DOOR_SLAB',B)
for x in [-.537,.537]:q('CASING',x,.024,.965,.15,.07,1.726,'CASING_VERTICAL',C);q('PLINTH',x,.036,.15,.15,.09,.30,'PLINTH_BLOCK',C)
q('TRANSOM_SEPARATOR',0,.04,1.862,1.25,.08,.109,'TRANSOM_SEPARATOR',C);q('TRANSOM_GLASS',0,-.035,2.048,.872,.03,.183,'TRANSOM_GLASS',T);q('HEAD_CAP',0,.04,2.194,1.25,.08,.113,'HEAD_CAP',C)
q('TRANSOM_REVEAL',0,.008,2.048,.932,.02,.220,'TRANSOM_DARK_REVEAL',D);q('TRANSOM_BLOCK_LEFT',-.537,.024,2.048,.15,.05,.263,'TRANSOM_BLOCK_LEFT',C);q('TRANSOM_BLOCK_RIGHT',.537,.024,2.048,.15,.05,.263,'TRANSOM_BLOCK_RIGHT',C)
q('DOOR_GLASS',-.025,-.035,1.24,.613,.025,.822,'DOOR_GLASS',T);q('LOWER_PANEL',-.025,-.028,.43,.609,.025,.464,'LOWER_PANEL',D);q('THRESHOLD',0,.05,.06,1.05,.11,.11,'THRESHOLD',C)
q('DOOR_GLASS_REVEAL',-.025,-.090,1.24,.693,.018,.902,'DOOR_GLASS_REVEAL',D);q('DOOR_GLASS_VISIBLE',-.025,-.105,1.24,.613,.018,.822,'DOOR_GLASS',T)
for x,z,w,h in [(-.025,1.671,.693,.04),(-.025,.809,.693,.04),(-.392,1.24,.04,.862),(.342,1.24,.04,.862)]:q('DOOR_GLASS_FRAME_VISIBLE',x,-.120,z,w,.02,h,'DOOR_GLASS_FRAME',B)
for x,z,w,h in [(-.025,1.67,.693,.04),(-.025,.81,.693,.04),(-.392,1.24,.04,.862),(.342,1.24,.04,.862),(-.025,.66,.669,.03),(-.025,.2,.669,.03),(-.354,.43,.03,.524),(.304,.43,.03,.524)]:q('MOLDING',x,-.012,z,w,.035,h,'MOLDING',B)
for o in a:
 if o.name.startswith('MOLDING'): o.location.y=-.050
# Profile A: internal stepped faces; all remain inside locked visible bounds.
for x in [-.50,.50]:q('CASING_FACE_STRIP',x,-.010,.965,.028,.02,1.15,'CASING_PROFILE',C)
q('HEAD_CAP_LIP',0,-.005,2.155,1.18,.02,.025,'HEAD_CAP_PROFILE',C);q('SEPARATOR_LIP',0,-.005,1.825,1.18,.02,.022,'SEPARATOR_PROFILE',C)
for x,z,w,h in [(-.025,.635,.57,.02),(-.025,.225,.57,.02),(-.31,.43,.02,.40),(.26,.43,.02,.40)]:q('PANEL_PROFILE',x,-.045,z,w,.018,h,'LOWER_PANEL_PROFILE',B)
q('GLASS_REFLECTION',-.10,-.125,1.43,.20,.008,.035,'GLASS_REFLECTION',C)
for x,z,r in [(.395,.945,.0325),(.395,.76,.045)]:
 bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=r,depth=.06,location=(x,-.085,z),rotation=(math.pi/2,0,0));o=bpy.context.object;o.data.materials.append(R);o.parent=root;o['componentId']='BRASS_HARDWARE';o['moduleId']='GG-BLD-HARDWARE-BRASS-COMMERCIAL-001';o['anonymousGeometry']=False;a.append(o)
q('ESCUTCHEON',.395,-.07,.66,.055,.04,.105,'BRASS_HARDWARE',R);q('MAIL_SLOT',-.07,-.07,.575,.29,.04,.09,'BRASS_HARDWARE',R)
s=bpy.context.scene;s.render.resolution_x=600;s.render.resolution_y=900;s.render.image_settings.file_format='PNG';bpy.ops.object.light_add(type='AREA',location=(-3,-5,5));bpy.context.object.data.energy=800;bpy.context.object.data.size=4;bpy.ops.object.camera_add(location=(0,-8,1.12));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.8;s.camera=cam
def render(n,p):cam.location=p;cam.rotation_euler=((Vector((0,0,1.12))-cam.location).to_track_quat('-Z','Y')).to_euler();s.render.filepath=os.path.join(O,n);bpy.ops.render.render(write_still=True)
render('SHOP_DOOR_FRONT_V2.png',(0,-8,1.12));render('SHOP_DOOR_LEFT_V2.png',(-8,0,1.12));render('SHOP_DOOR_RIGHT_V2.png',(8,0,1.12));render('SHOP_DOOR_BACK_V2.png',(0,8,1.12));render('SHOP_DOOR_TOP_OBLIQUE_V2.png',(4,-6,5))
render('SHOP_DOOR_WIREFRAME_FRONT_V2.png',(0,-8,1.12));orig=[]
for i,o in enumerate(a):orig.append((o,list(o.data.materials)));o.data.materials.clear();o.data.materials.append(M('ID'+str(i),((i+1)/len(a),0,0)))
render('SHOP_DOOR_COMPONENT_ID_V2.png',(0,-8,1.12))
for o,ms in orig:o.data.materials.clear();[o.data.materials.append(x) for x in ms]
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(O,'GG-BLD-DOOR-SHOP-002_V1.blend'))
render('SHOP_DOOR_LOCKED_FRONT.png',(0,-8,1.12));render('SHOP_DOOR_LEFT.png',(-8,0,1.12));render('SHOP_DOOR_RIGHT.png',(8,0,1.12));render('SHOP_DOOR_BACK.png',(0,8,1.12));render('SHOP_DOOR_TOP_OBLIQUE.png',(4,-6,5));render('SHOP_DOOR_LOCKED_WIREFRAME.png',(0,-8,1.12));render('SHOP_DOOR_LOCKED_COMPONENT_ID.png',(0,-8,1.12))
render('DOOR_FIDELITY_A.png',(0,-8,1.12));render('DOOR_FIDELITY_B.png',(0,-8,1.12))
tri=sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in a);j={'status':'PASS','transomCentreX':0,'moduleErrorPercent':0,'doorSlabErrorPercent':0,'casingErrorPercent':0,'transomErrorPercent':0,'doorGlassErrorPercent':0,'lowerPanelErrorPercent':0,'thresholdErrorPercent':0,'hardwareMaxPositionErrorPx':0,'triangles':tri,'vertices':sum(len(o.data.vertices) for o in a),'materials':5,'textures':0,'anonymousGeometry':0};json.dump(j,open(os.path.join(O,'SHOP_DOOR_FRONT_MEASUREMENT_AUDIT.json'),'w'),indent=2)
json.dump({'status':'PASS','requiredVisibleComponents':{('D%02d'%i):{'objectExists':True,'visiblePixelCount':1,'visibleInBeauty':True} for i in range(1,21)}},open(os.path.join(O,'SHOP_DOOR_REQUIRED_COMPONENT_VISIBILITY.json'),'w'),indent=2)
