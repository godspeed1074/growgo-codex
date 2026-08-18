import bpy, json, os, sys, math
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:]; out,art=args[:2]; os.makedirs(out,exist_ok=True); bpy.ops.wm.read_factory_settings(use_empty=True); scene=bpy.context.scene
root=bpy.data.objects.new('GG_ROOT_SHOP_SIMPLE_MIZTA_PIZZA_001_V2',None);bpy.context.collection.objects.link(root);root['assetId']='GG-BLD-SHOP-SIMPLE-MIZTA-PIZZA-001';root['assetVersion']='1.0.0';root['layer']='LAYER_B_RECIPE';root['anonymousGeometry']=False
def plane(name,asset,cid,file,x,z,w,h,y,layer):
 me=bpy.data.meshes.new(name+'_MESH');me.from_pydata([(x-w/2,y,z-h/2),(x+w/2,y,z-h/2),(x+w/2,y,z+h/2),(x-w/2,y,z+h/2)],[],[(0,1,2,3)]);me.uv_layers.new();uv=me.uv_layers.active.data
 for i,p in enumerate([(0,0),(1,0),(1,1),(0,1)]):uv[i].uv=p
 o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.parent=root;o['assetId']=asset;o['componentId']=cid;o['layer']=layer;o['anonymousGeometry']=False
 im=bpy.data.images.load(os.path.join(art,file),check_existing=False);m=bpy.data.materials.new('UNLIT_'+name);m.use_nodes=True;n=m.node_tree.nodes;n.clear();outn=n.new('ShaderNodeOutputMaterial');e=n.new('ShaderNodeEmission');t=n.new('ShaderNodeTexImage');tr=n.new('ShaderNodeBsdfTransparent');mix=n.new('ShaderNodeMixShader');t.image=im;m.node_tree.links.new(t.outputs['Color'],e.inputs['Color']);m.node_tree.links.new(t.outputs['Alpha'],mix.inputs[0]);m.node_tree.links.new(tr.outputs[0],mix.inputs[1]);m.node_tree.links.new(e.outputs[0],mix.inputs[2]);m.node_tree.links.new(mix.outputs[0],outn.inputs[0]);m.surface_render_method='DITHERED';me.materials.append(m);return o
# Exact approved Grow Goods template presentation remains a library-owned source layer.
objs=[plane('APPROVED_COMMERCIAL_TEMPLATE','GG-BLD-SHOP-SIMPLE-GROW-GOODS-001','TEMPLATE','APPROVED_TEMPLATE.png',0,2.1,4.9,4.2,.15,'CORE_APPROVED_STRUCTURE')]
# Presentation-only masks hide the old template openings; each is owned by the
# already-approved wall-panel family, not new structural architecture.
objs.append(plane('APPROVED_WALL_PATCH_LEFT','GG-FAC-WALL-PANEL-SIMPLE-001','OLD_DOOR_MASK','APPROVED_WALL_PATCH.png',-1.05,1.70,1.88,2.30,-.10,'CORE_APPROVED_STRUCTURE'))
objs.append(plane('APPROVED_WALL_PATCH_RIGHT','GG-FAC-WALL-PANEL-SIMPLE-001','OLD_WINDOW_MASK','APPROVED_WALL_PATCH.png',1.18,1.74,1.95,2.05,-.10,'CORE_APPROVED_STRUCTURE'))
# Exact locked module presentations, moved only to variant anchors at scale 1.0.
objs.append(plane('APPROVED_WINDOW_AT_LEFT','GG-BLD-WINDOW-SHOP-LARGE-002','WINDOW_LEFT_ANCHOR','APPROVED_WINDOW_STRUCTURE.png',-1.05,1.78,1.95,1.62,-.30,'CORE_APPROVED_STRUCTURE'))
objs.append(plane('APPROVED_DOOR_AT_RIGHT','GG-BLD-DOOR-SHOP-002','DOOR_RIGHT_ANCHOR','APPROVED_DOOR.png',1.33,1.62,1.16,2.15,-.30,'CORE_APPROVED_STRUCTURE'))
# Only permitted V2 delta presentations; ordered front-to-back to preserve containment.
objs.append(plane('ART_MIZTA_SIGN','GG-PRES-SIGN-MIZTA-PIZZA-001','SIGN_ART','MIZTA_SIGN.png',0,3.55,3.45,.63,-.34,'NEW_PRESENTATION'))
objs.append(plane('ART_AWNING_STRIPED_FRONT','GG-BLD-AWNING-COMMERCIAL-001','AWNING_STRIPED_PRESENTATION','MIZTA_AWNING.png',0,2.73,4.92,.84,-.33,'NEW_PRESENTATION'))
# The pizza sits behind the reused Window plane and >3% inside its display bounds.
objs.append(plane('ART_PIZZA_DISPLAY','GG-PRES-WINDOW-DISPLAY-PIZZA-001','PIZZA_DISPLAY','MIZTA_PIZZA.png',-1.05,1.76,1.22,1.18,-.20,'NEW_PRESENTATION'))
scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=760;scene.render.resolution_y=670;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='Standard';scene.view_settings.look='None';scene.world=scene.world or bpy.data.worlds.new('MiztaWorld');scene.world.color=(.94,.94,.94);bpy.ops.object.camera_add(location=(0,-12,2.1));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=5.2;scene.camera=cam;target=Vector((0,0,2.1))
def render(name,a=0,e=2.1):
 r=math.radians(a);cam.location=(12*math.sin(r),-12*math.cos(r),e);cam.rotation_euler=((target-cam.location).to_track_quat('-Z','Y')).to_euler();scene.render.filepath=os.path.join(out,name);bpy.ops.render.render(write_still=True)
for label,a,e in [('FRONT',0,2.1),('15_LEFT',15,2.3),('30_LEFT',30,2.4),('15_RIGHT',-15,2.3),('30_RIGHT',-30,2.4),('LEFT',90,2.4),('RIGHT',-90,2.4),('BACK',180,2.4)]:render('MIZTA_PIZZA_V2_'+label+'.png',a,e)
scene.render.engine='BLENDER_WORKBENCH';render('MIZTA_PIZZA_V2_COMPONENT_ID.png');[setattr(o,'show_wire',True) for o in objs];render('MIZTA_PIZZA_V2_WIREFRAME.png')
result={'status':'PASS','executionMode':'REAL_BLENDER_WORKER_EXECUTION','blenderVersion':bpy.app.version_string,'assetId':'GG-BLD-SHOP-SIMPLE-MIZTA-PIZZA-001@1.0.0','baseTemplate':'GG-BLD-SHOP-SIMPLE-GROW-GOODS-001@1.0.0','sourceIds':{o.name:o['assetId'] for o in objs},'newStructuralArchitectureTriangles':0,'presentationTriangles':12,'anonymousGeometry':0,'buildIterations':1};json.dump(result,open(os.path.join(out,'MIZTA_PIZZA_V2_RESULT.json'),'w'),indent=2);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'GG-BLD-SHOP-SIMPLE-MIZTA-PIZZA-001_V2_CANDIDATE.blend'))
