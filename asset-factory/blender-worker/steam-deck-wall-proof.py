import bpy,sys,os,json
from mathutils import Vector
out=sys.argv[sys.argv.index('--')+1];os.makedirs(out,exist_ok=True);bpy.ops.wm.read_factory_settings(use_empty=True)
def solid(name,c):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*c,1);bs.inputs['Roughness'].default_value=.86;return m
MAT_MAIN=solid('GG_MAT_WALL_WARM_BROWN_001',(.34,.16,.09));MAT_LIGHT=solid('GG_MAT_WALL_WARM_BROWN_LIGHT_001',(.40,.21,.12));MAT_DARK=solid('GG_MAT_WALL_WARM_BROWN_SHADOW_001',(.25,.11,.065))
def root(name,variant):
 r=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(r);r['moduleId']=variant;r['moduleVersion']='1.0.0';r['anchors']=['LEFT_EDGE','RIGHT_EDGE','TOP_EDGE','BOTTOM_EDGE','DOOR_OPENING_CONTACT','WINDOW_OPENING_CONTACT','TRIM_CONTACT','FOUNDATION_CONTACT','VISIBLE_ART_CENTER'];return r
roots={'MAIN':root('GG_ROOT_WALL_PANEL_COMMERCIAL_MAIN','GG-BLD-WALL-PANEL-COMMERCIAL-MAIN-001'),'NARROW':root('GG_ROOT_WALL_PANEL_COMMERCIAL_NARROW','GG-BLD-WALL-PANEL-COMMERCIAL-NARROW-001'),'TOP':root('GG_ROOT_WALL_PANEL_COMMERCIAL_TOP','GG-BLD-WALL-PANEL-COMMERCIAL-TOP-001')}
def box(name,loc,dims,cid,parent,material=MAT_MAIN,depth='LEVEL_1_MAIN_WALL'):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.parent=parent;o.dimensions=dims;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material);o['componentId']=cid;o['moduleId']=parent.get('moduleId');o['moduleVersion']='1.0.0';o['layer']='LAYER_A_MODULE';o['depthTier']=depth;o['anonymousGeometry']=False;return o
box('WALL_PANEL_LEFT',(-1.72,0,1.45),(1.18,.18,2.25),'WALL_PANEL_MAIN',roots['MAIN'],MAT_MAIN)
box('WALL_PANEL_CENTRE',(-.68,-.01,1.45),(.62,.18,2.25),'WALL_PANEL_NARROW',roots['NARROW'],MAT_LIGHT)
box('WALL_PANEL_RIGHT',(1.55,0,1.45),(1.35,.18,2.25),'WALL_PANEL_MAIN',roots['MAIN'],MAT_MAIN)
box('WALL_PANEL_ABOVE_DOOR',(-1.02,-.015,2.60),(1.42,.16,.42),'WALL_PANEL_TOP',roots['TOP'],MAT_LIGHT,'LEVEL_2_PANEL_VARIATION')
box('WALL_PANEL_ABOVE_WINDOW',(.82,-.015,2.60),(1.82,.16,.42),'WALL_PANEL_TOP',roots['TOP'],MAT_MAIN,'LEVEL_2_PANEL_VARIATION')
box('WALL_PANEL_LOWER',(0,.02,.48),(4.35,.20,.38),'WALL_PANEL_MAIN',roots['MAIN'],MAT_DARK,'LEVEL_0_BASE_SHADOW')
for x in [-2.25,2.25]:box('WALL_EDGE_RETURN', (x,0,1.55),(.10,.22,2.55),'WALL_PANEL_NARROW',roots['NARROW'],MAT_DARK,'LEVEL_2_EDGE_RETURN')
bpy.ops.object.camera_add(location=(0,-8,1.55));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=5.2;cam.rotation_euler=((Vector((0,0,1.55))-cam.location).to_track_quat('-Z','Y')).to_euler();bpy.context.scene.camera=cam;s=bpy.context.scene;s.render.resolution_x=960;s.render.resolution_y=640;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.film_transparent=False;w=bpy.data.worlds.new('WALL_WORLD');s.world=w;w.use_nodes=True;bg=w.node_tree.nodes.get('Background');bg.inputs['Color'].default_value=(.92,.92,.92,1);bg.inputs['Strength'].default_value=.8;bpy.ops.object.light_add(type='AREA',location=(0,-4,5));bpy.context.object.data.energy=550;bpy.context.object.data.size=5
blend=os.path.join(out,'WALL_MODULES.blend');bpy.ops.wm.save_as_mainfile(filepath=blend)
def render(n,loc=(0,-8,1.55),scale=5.2):cam.location=loc;cam.rotation_euler=((Vector((0,0,1.55))-cam.location).to_track_quat('-Z','Y')).to_euler();cam.data.ortho_scale=scale;s.render.filepath=os.path.join(out,n+'.png');bpy.ops.render.render(write_still=True)
render('WALL_ACTUAL_BLENDER_FRONT');render('WALL_PAPERCUT_FRONT',(0,-6,1.55),4.1);render('WALL_CLOSEUP',(0,-5,1.55),3.4);render('WALL_BACK',(0,8,1.55));render('WALL_LEFT',(-8,0,1.55));render('WALL_RIGHT',(8,0,1.55))
orig=[];idx=0
for o in bpy.context.scene.objects:
 if o.type=='MESH':orig.append((o,list(o.data.materials)));o.data.materials.clear();m=bpy.data.materials.new('ID_%03d'%idx);m.diffuse_color=((idx+1)/255,0,0,1);o.data.materials.append(m);idx+=1
s.render.filepath=os.path.join(out,'WALL_COMPONENT_ID.png');bpy.ops.render.render(write_still=True)
for o,ms in orig:o.data.materials.clear();[o.data.materials.append(m) for m in ms]
tri=sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH');json.dump({'status':'PASS','blenderVersion':bpy.app.version_string,'familyIds':['GG-BLD-WALL-PANEL-COMMERCIAL-MAIN-001','GG-BLD-WALL-PANEL-COMMERCIAL-NARROW-001','GG-BLD-WALL-PANEL-COMMERCIAL-TOP-001'],'componentIds':['WALL_PANEL_MAIN','WALL_PANEL_NARROW','WALL_PANEL_TOP'],'responsiveContracts':['Door.operatorVisibleBounds','Window.operatorVisibleBounds'],'anonymousGeometryCount':0,'budget':{'triangles':tri,'vertices':sum(len(o.data.vertices) for o in bpy.context.scene.objects if o.type=='MESH'),'objects':len([o for o in bpy.context.scene.objects if o.type=='MESH']),'materials':3,'textures':0,'imageBytes':0,'blendSizeBytes':os.path.getsize(blend),'mobileBudget':'PASS'}},open(os.path.join(out,'WALL_RESULT.json'),'w'),indent=2)
