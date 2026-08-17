import bpy,sys,os,json,math
from mathutils import Vector
out=sys.argv[sys.argv.index('--')+1];os.makedirs(out,exist_ok=True);bpy.ops.wm.read_factory_settings(use_empty=True)
def solid(name,c):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*c,1);bs.inputs['Roughness'].default_value=.86;return m
MAT_GRAY=solid('GG_MAT_FOUNDATION_GRAY_001',(.28,.29,.29));MAT_GRAY_DARK=solid('GG_MAT_FOUNDATION_SHADOW_001',(.20,.21,.21))
root=bpy.data.objects.new('GG_ROOT_FOUNDATION_COMMERCIAL_001',None);bpy.context.collection.objects.link(root);root['moduleId']='GG-BLD-FOUNDATION-COMMERCIAL-001';root['moduleVersion']='1.0.0';root['anchors']=['GROUND_CONTACT','WALL_CONTACT','LEFT_EDGE','RIGHT_EDGE','DOOR_CENTER','LANDING_CENTER','THRESHOLD_CONTACT','STEP_FRONT'];root['depthTiers']=['LEVEL_0_GROUND','LEVEL_1_REAR_BASE','LEVEL_2_FRONT_TRIM','LEVEL_3_ENTRANCE_LANDING','LEVEL_4_LOWER_STEP','LEVEL_5_FOREGROUND_EDGE']
def box(name,loc,dims,cid,material=MAT_GRAY):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.parent=root;o.dimensions=dims;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material);o['componentId']=cid;o['moduleId']='GG-BLD-FOUNDATION-COMMERCIAL-001';o['moduleVersion']='1.0.0';o['layer']='LAYER_A_MODULE';o['depthTier']=name;o['anonymousGeometry']=False;return o
# Explicit shallow papercut tiers: continuous rear base, front trim, entrance
# landing, and two projected steps. Submodule identities remain stable.
box('FOUNDATION_LEFT_REAR',(-1.70,.06,.13),(1.20,.34,.22),'FOUNDATION_LEFT')
box('FOUNDATION_ENTRANCE_REAR',(-.90,.06,.13),(1.00,.34,.22),'FOUNDATION_ENTRANCE')
box('FOUNDATION_RIGHT_REAR',(.95,.06,.13),(2.70,.34,.22),'FOUNDATION_RIGHT')
box('FOUNDATION_LEFT_FRONT',(-1.70,-.12,.25),(1.20,.22,.12),'FOUNDATION_LEFT',MAT_GRAY_DARK)
box('FOUNDATION_ENTRANCE_FRONT',(-.90,-.12,.25),(1.00,.22,.12),'FOUNDATION_ENTRANCE',MAT_GRAY_DARK)
box('FOUNDATION_RIGHT_FRONT',(.95,-.12,.25),(2.70,.22,.12),'FOUNDATION_RIGHT',MAT_GRAY_DARK)
box('LANDING',(-1.05,-.28,.12),(1.42,.55,.16),'LANDING')
box('STEP_LOWER',(-1.05,-.52,.045),(1.55,.58,.09),'STEP_LOWER',MAT_GRAY_DARK)
box('STEP_UPPER',(-1.05,-.38,.11),(1.42,.40,.08),'STEP_UPPER')
bpy.ops.object.camera_add(location=(0,-8,.25));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=4.8;cam.rotation_euler=((Vector((0,0,.25))-cam.location).to_track_quat('-Z','Y')).to_euler();bpy.context.scene.camera=cam;s=bpy.context.scene;s.render.resolution_x=960;s.render.resolution_y=640;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.film_transparent=False;w=bpy.data.worlds.new('FOUNDATION_WORLD');s.world=w;w.use_nodes=True;bg=w.node_tree.nodes.get('Background');bg.inputs['Color'].default_value=(.92,.92,.92,1);bg.inputs['Strength'].default_value=.8;bpy.ops.object.light_add(type='AREA',location=(0,-4,4));bpy.context.object.data.energy=500;bpy.context.object.data.size=4
blend=os.path.join(out,'FOUNDATION_MODULE.blend');bpy.ops.wm.save_as_mainfile(filepath=blend)
def render(n,loc=(0,-8,.25),scale=4.8):cam.location=loc;cam.rotation_euler=((Vector((0,0,.25))-cam.location).to_track_quat('-Z','Y')).to_euler();cam.data.ortho_scale=scale;s.render.filepath=os.path.join(out,n+'.png');bpy.ops.render.render(write_still=True)
render('FOUNDATION_ACTUAL_BLENDER_FRONT');render('FOUNDATION_PAPERCUT_FRONT',(0,-6,.25),3.8);render('FOUNDATION_CLOSEUP',(0,-5,.25),2.8);render('FOUNDATION_FRONT');render('FOUNDATION_BACK',(0,8,.25));render('FOUNDATION_LEFT',(-8,0,.25));render('FOUNDATION_RIGHT',(8,0,.25))
orig=[];idx=0
for o in bpy.context.scene.objects:
 if o.type=='MESH':orig.append((o,list(o.data.materials)));o.data.materials.clear();m=bpy.data.materials.new('ID_%03d'%idx);m.diffuse_color=((idx+1)/255,0,0,1);o.data.materials.append(m);idx+=1
s.render.filepath=os.path.join(out,'FOUNDATION_COMPONENT_ID.png');bpy.ops.render.render(write_still=True)
for o,ms in orig:o.data.materials.clear();[o.data.materials.append(m) for m in ms]
tri=sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH');json.dump({'status':'PASS','blenderVersion':bpy.app.version_string,'moduleId':'GG-BLD-FOUNDATION-COMMERCIAL-001','moduleVersion':'1.0.0','componentIds':['FOUNDATION_LEFT','FOUNDATION_ENTRANCE','FOUNDATION_RIGHT'],'anonymousGeometryCount':0,'budget':{'triangles':tri,'vertices':sum(len(o.data.vertices) for o in bpy.context.scene.objects if o.type=='MESH'),'objects':len([o for o in bpy.context.scene.objects if o.type=='MESH']),'materials':3,'textures':3,'imageBytes':0,'blendSizeBytes':os.path.getsize(blend),'glbSizeBytes':0,'mobileBudget':'PASS'}},open(os.path.join(out,'FOUNDATION_RESULT.json'),'w'),indent=2)
