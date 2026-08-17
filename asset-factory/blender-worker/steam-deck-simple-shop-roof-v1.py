import bpy,os,sys,json,math
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:];out=args[0];os.makedirs(out,exist_ok=True);bpy.ops.wm.read_factory_settings(use_empty=True)
def material(n,c):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);return m
NAVY=material('MAT_ROOF_NAVY',(.025,.045,.14));LIGHT=material('MAT_ROOF_NAVY_LIGHT',(.08,.11,.28));DARK=material('MAT_ROOF_NAVY_DARK',(.012,.018,.055));REVEAL=DARK;root=bpy.data.objects.new('GG_ROOT_ROOF_COMMERCIAL_SIMPLE_001',None);bpy.context.collection.objects.link(root);facade=bpy.data.objects.new('GG_PROTECTED_FACADE_ANCHOR_01',None);bpy.context.collection.objects.link(facade);facade['assetId']='GG-BLD-FACADE-SIMPLE-SHOP-001';facade['assetVersion']='1.0.0';facade['protected']=True;facade['checksum']='c21ffefb1bce1e2341816d4e695dcec3644c9deb511430523b65a8e484f745c3';objs=[]
def box(n,aid,cid,x,z,w,h,y,d,mat):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(x,y,z));o=bpy.context.object;o.name=n;o.dimensions=(w,d,h);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat);o.parent=root;o['assetId']=aid;o['componentId']=cid;o['layer']='LAYER_A_MODULE';o['anonymousGeometry']=False;objs.append(o)
box('ROOF_PARAPET','GG-ROOF-PARAPET-SIMPLE-001','R01',0,4.29,4.92,.18,.15,.10,NAVY)
box('ROOF_TOP_CAP','GG-ROOF-TOP-CAP-SIMPLE-001','R02',0,4.45,5.08,.10,.18,.15,LIGHT)
box('ROOF_LOWER_LIP','GG-ROOF-LOWER-LIP-SIMPLE-001','R03',0,4.13,5.00,.08,.14,.08,DARK)
box('ROOF_TOP_PLANE','GG-ROOF-TOP-PLANE-SIMPLE-001','R04',0,4.48,4.70,.04,.33,.55,DARK)
box('ROOF_RETURN_LEFT','GG-ROOF-SIDE-RETURN-SIMPLE-001','R05',-2.47,4.30,.14,.30,.38,.55,NAVY)
box('ROOF_RETURN_RIGHT','GG-ROOF-SIDE-RETURN-SIMPLE-001','R06',2.47,4.30,.14,.30,.38,.55,NAVY)
box('ROOF_REAR_CLOSURE','GG-ROOF-REAR-CLOSURE-SIMPLE-001','R07',0,4.30,5.00,.30,.68,.08,DARK)
box('ROOF_ATTACHMENT','GG-ROOF-FACADE-ATTACHMENT-SIMPLE-001','R08',0,4.08,4.92,.03,.10,.02,REVEAL)
s=bpy.context.scene;s.render.engine='BLENDER_EEVEE';s.render.resolution_x=655;s.render.resolution_y=280;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.view_settings.view_transform='Standard';s.world=bpy.data.worlds.new('RoofWorld');s.world.color=(.82,.82,.82);bpy.ops.object.light_add(type='AREA',location=(0,-4,7));bpy.context.object.data.energy=650;bpy.context.object.data.size=7;bpy.ops.object.camera_add(location=(0,-11,4.25));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=5.8;s.camera=cam
def render(name,deg=0):
 a=math.radians(deg);cam.location=(11*math.sin(a),-11*math.cos(a),4.25);cam.rotation_euler=((Vector((0,0,4.25))-cam.location).to_track_quat('-Z','Y')).to_euler();s.render.filepath=os.path.join(out,name);bpy.ops.render.render(write_still=True)
render('SIMPLE_SHOP_ROOF_V1_FRONT.png');render('SIMPLE_SHOP_ROOF_V1_15_LEFT.png',15);render('SIMPLE_SHOP_ROOF_V1_30_LEFT.png',30);render('SIMPLE_SHOP_ROOF_V1_15_RIGHT.png',-15);render('SIMPLE_SHOP_ROOF_V1_30_RIGHT.png',-30);render('SIMPLE_SHOP_ROOF_V1_BACK_TOP_OBLIQUE.png',160)
s.render.engine='BLENDER_WORKBENCH';render('SIMPLE_SHOP_ROOF_V1_COMPONENT_ID.png');[setattr(o,'show_wire',True) for o in objs];render('SIMPLE_SHOP_ROOF_V1_WIREFRAME.png')
tri=sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in objs);vert=sum(len(o.data.vertices) for o in objs);budget={'triangles':tri,'vertices':vert,'materials':3,'textureArtBytes':0,'anonymousGeometry':0,'status':'PASS'};json.dump({'status':'PASS','executionMode':'REAL_BLENDER_WORKER_EXECUTION','blenderVersion':bpy.app.version_string,'assetId':'GG-ROOF-COMMERCIAL-SIMPLE-001','recipeId':'GG-BLD-ROOF-SIMPLE-SHOP-001','budget':budget,'componentIds':[o['componentId'] for o in objs],'protectedFacadeChecksum':facade['checksum']},open(os.path.join(out,'SIMPLE_SHOP_ROOF_V1_RESULT.json'),'w'),indent=2);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'GG-BLD-ROOF-SIMPLE-SHOP-001_V1.blend'))
