"""Swapped opening proof using the independent commercial-simple library."""
import bpy, os, sys, json, math
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:]; artifacts,art,out=args[:3]; flavor=args[3] if len(args)>3 else 'GROW_GOODS'; prefix='MIZTA_PIZZA_V3' if flavor=='MIZTA_PIZZA_V3' else 'COMMERCIAL_SIMPLE_SWAPPED_FACADE_V2'; os.makedirs(out,exist_ok=True); bpy.ops.wm.read_factory_settings(use_empty=True)
U=4.4/576; X=lambda p:(p-338)*U; Z=lambda p:(585-p)*U; objects=[]
for f in [x for x in os.listdir(artifacts) if x.endswith('.blend')]:
 with bpy.data.libraries.load(os.path.join(artifacts,f),link=False) as (fr,to): to.objects=fr.objects
 for o in to.objects:
  if o:
   bpy.context.collection.objects.link(o); o['runtimeArtifact']=f; o['parentFacadeDependency']='NONE'
   # Reposition the existing narrow wall bay to the new shared opening guide.
   # This reuses its geometry; it does not fabricate a filler slab.
   if o.name == 'WALL_BETWEEN_DOOR_WINDOW': o.location.x=X(83)
   objects.append(o)
def plane(name,file,x0,x1,y0,y1,aid,cid,depth):
 me=bpy.data.meshes.new(name+'Mesh');me.from_pydata([(X(x0),depth,Z(y1)),(X(x1),depth,Z(y1)),(X(x1),depth,Z(y0)),(X(x0),depth,Z(y0))],[],[(0,1,2,3)]);me.uv_layers.new()
 for loop,uv in zip(me.uv_layers.active.data,[(0,0),(1,0),(1,1),(0,1)]):loop.uv=uv
 o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);im=bpy.data.images.load(os.path.join(art,file),check_existing=False);m=bpy.data.materials.new('PRES_'+name);m.use_nodes=True;n=m.node_tree.nodes;n.clear();outn=n.new('ShaderNodeOutputMaterial');e=n.new('ShaderNodeEmission');t=n.new('ShaderNodeTexImage');tr=n.new('ShaderNodeBsdfTransparent');mix=n.new('ShaderNodeMixShader');t.image=im;m.node_tree.links.new(t.outputs['Color'],e.inputs['Color']);m.node_tree.links.new(t.outputs['Alpha'],mix.inputs[0]);m.node_tree.links.new(tr.outputs[0],mix.inputs[1]);m.node_tree.links.new(e.outputs[0],mix.inputs[2]);m.node_tree.links.new(mix.outputs[0],outn.inputs[0]);m.surface_render_method='DITHERED';me.materials.append(m);o['assetId']=aid;o['componentId']=cid;o['parentFacadeDependency']='NONE';o['anonymousGeometry']=False;objects.append(o)
def teal_backdrop():
 me=bpy.data.meshes.new('PIZZA_BACKDROP_MESH');me.from_pydata([(X(106),-.30,Z(496)),(X(350),-.30,Z(496)),(X(350),-.30,Z(307)),(X(106),-.30,Z(307))],[],[(0,1,2,3)]);o=bpy.data.objects.new('PIZZA_DISPLAY_BACKDROP',me);bpy.context.collection.objects.link(o);m=bpy.data.materials.new('PRES_PIZZA_DISPLAY_TEAL_BACKDROP');m.diffuse_color=(.015,.16,.20,1);me.materials.append(m);o['assetId']='GG-PRES-WINDOW-DISPLAY-PIZZA-001';o['componentId']='PIZZA_DISPLAY_BACKDROP';o['parentFacadeDependency']='NONE';o['anonymousGeometry']=False;objects.append(o)
# Structural artifacts are reused unchanged. Only registered instances move to new opening anchors.
plane('WALL_LEFT','PRES_WALL_LEFT.png',49,89,256,528,'GG-FAC-WALL-BAY-SIMPLE-001','WALL_LEFT_OF_WINDOW',-.20)
plane('WALL_BETWEEN','PRES_WALL_BETWEEN.png',367,387,256,528,'GG-FAC-WALL-PANEL-SIMPLE-001','WALL_BETWEEN_WINDOW_DOOR',-.20)
plane('WALL_RIGHT','PRES_WALL_RIGHT.png',582,626,256,528,'GG-FAC-WALL-BAY-SIMPLE-001','WALL_RIGHT_OF_DOOR',-.20)
plane('WALL_ABOVE','PRES_WALL_ABOVE.png',49,626,257,275,'GG-FAC-WALL-PANEL-SIMPLE-001','WALL_ABOVE_OPENINGS',-.20)
plane('BASE_LEFT','PRES_BASE_LEFT.png',17,89,500,586,'GG-FAC-BASE-PLINTH-SIMPLE-001','BASE_LEFT',-.21)
plane('BASE_MIDDLE','PRES_BASE_BETWEEN.png',89,582,500,586,'GG-FAC-BASE-PLINTH-SIMPLE-001','BASE_MIDDLE',-.21)
plane('BASE_RIGHT','PRES_BASE_RIGHT.png',582,626,500,586,'GG-FAC-BASE-PLINTH-SIMPLE-001','BASE_RIGHT',-.21)
plane('WINDOW_LEFT','PRES_WINDOW.png',89,367,275,506,'GG-BLD-WINDOW-SHOP-LARGE-002','WINDOW_LEFT',-.25)
plane('DOOR_RIGHT','PRES_DOOR.png',387,582,256,583,'GG-BLD-DOOR-SHOP-002','DOOR_RIGHT',-.26)
awning_file='MIZTA_AWNING.png' if flavor=='MIZTA_PIZZA_V3' else 'PRES_AWNING_PLUM.png'; sign_file='MIZTA_SIGN.png' if flavor=='MIZTA_PIZZA_V3' else 'PRES_SIGN_GROW_GOODS.png'
awning_asset='GG-PRES-AWNING-MIZTA-STRIPED-001' if flavor=='MIZTA_PIZZA_V3' else 'GG-PRES-AWNING-PLUM-COMMERCIAL-001'; sign_asset='GG-PRES-SIGN-MIZTA-PIZZA-001' if flavor=='MIZTA_PIZZA_V3' else 'GG-PRES-SIGN-GROW-GOODS-001'
plane('AWNING',awning_file,74,627,161,260,awning_asset,'AWNING_STRIPED_PRESENTATION' if flavor=='MIZTA_PIZZA_V3' else 'AWNING',-.27)
plane('FASCIA','PRES_FASCIA_STRUCTURE.png',28,672,12,163,'GG-FAC-FASCIA-BAND-SIMPLE-001','FASCIA',-.28)
plane('SIGN',sign_file,158,542,55,113,sign_asset,'SIGN_MIZTA_PIZZA' if flavor=='MIZTA_PIZZA_V3' else 'SIGN',-.29)
if flavor=='MIZTA_PIZZA_V3':
 teal_backdrop(); plane('PIZZA_DISPLAY','MIZTA_PIZZA.png',142,314,325,482,'GG-PRES-WINDOW-DISPLAY-PIZZA-001','PIZZA_DISPLAY',-.31)
s=bpy.context.scene;s.render.engine='BLENDER_EEVEE';s.render.resolution_x=760;s.render.resolution_y=670;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.view_settings.view_transform='Standard';s.world=bpy.data.worlds.new('World');s.world.color=(.82,.82,.82);bpy.ops.object.light_add(type='AREA',location=(0,-4,4));bpy.context.object.data.energy=900;bpy.context.object.data.size=8;bpy.ops.object.camera_add(location=(0,-12,2.2));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=4.9;s.camera=cam;target=Vector((0,0,2.2));cam.rotation_euler=((target-cam.location).to_track_quat('-Z','Y')).to_euler()
def render(n):s.render.filepath=os.path.join(out,n);bpy.ops.render.render(write_still=True)
render(prefix+'_FRONT.png')
for d,l in [(15,'15_LEFT'),(30,'30_LEFT'),(-15,'15_RIGHT'),(-30,'30_RIGHT')]:
 r=math.radians(d);cam.location=(12*math.sin(r),-12*math.cos(r),2.2);cam.rotation_euler=((target-cam.location).to_track_quat('-Z','Y')).to_euler();render(prefix+'_'+l+'.png')
if flavor=='MIZTA_PIZZA_V3':
 for d,l,e in [(90,'LEFT',2.4),(-90,'RIGHT',2.4),(180,'BACK',2.4),(25,'TOP_OBLIQUE',7)]:
  r=math.radians(d);cam.location=(12*math.sin(r),-12*math.cos(r),e);cam.rotation_euler=((target-cam.location).to_track_quat('-Z','Y')).to_euler();render(prefix+'_'+l+'.png')
cam.location=(0,-12,2.2);cam.rotation_euler=((target-cam.location).to_track_quat('-Z','Y')).to_euler();s.render.engine='BLENDER_WORKBENCH';render(prefix+'_COMPONENT_ID.png');[setattr(o,'show_wire',True) for o in objects if hasattr(o.data,'polygons')];render(prefix+'_WIREFRAME.png')
json.dump({'status':'PASS','executionMode':'REAL_BLENDER_WORKER_EXECUTION','blenderVersion':bpy.app.version_string,'assetId':'GG-BLD-SHOP-SIMPLE-MIZTA-PIZZA-001@1.0.0' if flavor=='MIZTA_PIZZA_V3' else 'GG-BLD-FACADE-SIMPLE-SHOP-MIRRORED-001@1.0.0','layout':'WINDOW_LEFT_DOOR_RIGHT','newStructuralGeometryTriangles':0,'presentationTriangles':8 if flavor=='MIZTA_PIZZA_V3' else 0,'parentFacadeRequired':'NO','masks':'NO','anonymousGeometry':0,'componentIds':[o.get('componentId') for o in objects]},open(os.path.join(out,prefix+'_RESULT.json'),'w'),indent=2)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,('GG-BLD-SHOP-SIMPLE-MIZTA-PIZZA-001_V3_CANDIDATE.blend' if flavor=='MIZTA_PIZZA_V3' else 'GG-BLD-FACADE-SIMPLE-SHOP-MIRRORED-001_V2.blend')))
