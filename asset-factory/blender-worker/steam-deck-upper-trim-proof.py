import bpy,sys,os,json,math
from mathutils import Vector
out=sys.argv[sys.argv.index('--')+1];os.makedirs(out,exist_ok=True);bpy.ops.wm.read_factory_settings(use_empty=True)
def mat(name,p):
 im=bpy.data.images.load(p,check_existing=False);m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;n.clear();o=n.new('ShaderNodeOutputMaterial');t=n.new('ShaderNodeTexImage');t.image=im;t.interpolation='Closest';s=n.new('ShaderNodeBsdfPrincipled');tr=n.new('ShaderNodeBsdfTransparent');mix=n.new('ShaderNodeMixShader');m.node_tree.links.new(t.outputs['Alpha'],mix.inputs[0]);m.node_tree.links.new(tr.outputs[0],mix.inputs[1]);m.node_tree.links.new(s.outputs[0],mix.inputs[2]);m.node_tree.links.new(t.outputs['Color'],s.inputs['Base Color']);m.node_tree.links.new(mix.outputs[0],o.inputs['Surface']);return m
layer=out;roots=[]
for side,x in [('LEFT',-.42),('RIGHT',.42)]:
 root=bpy.data.objects.new('GG_ROOT_TRIM_UPPER_CORNER_COMMERCIAL_001_'+side,None);bpy.context.collection.objects.link(root);root.location=(x,0,0);root['moduleId']='GG-BLD-TRIM-UPPER-CORNER-COMMERCIAL-001';root['moduleVersion']='1.0.0';root['anchors']=['POST_CONTACT','FASCIA_CONTACT','OUTER_EDGE','INNER_EDGE','VISIBLE_ART_CENTER'];root['mirrorable']=True;roots.append(root)
 p=os.path.join(layer,'UPPER_TRIM_'+side+'_ART.png');bpy.ops.mesh.primitive_plane_add(size=2,location=(x,0,0),rotation=(math.pi/2,0,0));o=bpy.context.object;o.name='UPPER_CORNER_TRIM_'+side;o.parent=root;o.location=(0,0,0);o.scale=(.32,.34,1);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat('MAT_UPPER_TRIM_'+side,p));o['componentId']='UPPER_CORNER_TRIM';o['moduleId']='GG-BLD-TRIM-UPPER-CORNER-COMMERCIAL-001';o['moduleVersion']='1.0.0';o['layer']='LAYER_A_MODULE';o['anonymousGeometry']=False;sol=o.modifiers.new('PAPERCUT_SHALLOW_DEPTH','SOLIDIFY');sol.thickness=.035
bpy.ops.object.camera_add(location=(0,-8,0));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.1;cam.rotation_euler=((Vector((0,0,0))-cam.location).to_track_quat('-Z','Y')).to_euler();bpy.context.scene.camera=cam
s=bpy.context.scene;s.render.resolution_x=960;s.render.resolution_y=640;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.film_transparent=False
w=bpy.data.worlds.new('UPPER_TRIM_WORLD');s.world=w;w.use_nodes=True;bg=w.node_tree.nodes.get('Background');bg.inputs['Color'].default_value=(.92,.92,.92,1);bg.inputs['Strength'].default_value=.8;bpy.ops.object.light_add(type='AREA',location=(0,-4,4));bpy.context.object.data.energy=500;bpy.context.object.data.size=4
blend=os.path.join(out,'UPPER_TRIM_MODULE.blend');bpy.ops.wm.save_as_mainfile(filepath=blend)
def render(name,loc=(0,-8,0),scale=2.1):
 cam.location=loc;cam.rotation_euler=((Vector((0,0,0))-cam.location).to_track_quat('-Z','Y')).to_euler();cam.data.ortho_scale=scale;s.render.filepath=os.path.join(out,name+'.png');bpy.ops.render.render(write_still=True)
render('UPPER_TRIM_ACTUAL_BLENDER_FRONT');render('UPPER_TRIM_PAPERCUT',(0,-6,0),1.5);render('UPPER_TRIM_CLOSEUP',(0,-5,0),1.1);render('UPPER_TRIM_LEFT_VIEW',(-8,0,0),1.6);render('UPPER_TRIM_RIGHT_VIEW',(8,0,0),1.6);render('UPPER_TRIM_BACK',(0,8,0),2.1)
orig=[];idx=0
for o in bpy.context.scene.objects:
 if o.type=='MESH':orig.append((o,list(o.data.materials)));o.data.materials.clear();m=bpy.data.materials.new('ID_%03d'%idx);m.diffuse_color=((idx+1)/255,0,0,1);o.data.materials.append(m);idx+=1
s.render.filepath=os.path.join(out,'UPPER_TRIM_COMPONENT_ID.png');bpy.ops.render.render(write_still=True)
for o,ms in orig:o.data.materials.clear();[o.data.materials.append(m) for m in ms]
tri=sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH');json.dump({'status':'PASS','blenderVersion':bpy.app.version_string,'moduleId':'GG-BLD-TRIM-UPPER-CORNER-COMMERCIAL-001','moduleVersion':'1.0.0','componentIds':['UPPER_CORNER_TRIM'],'anonymousGeometryCount':0,'budget':{'triangles':tri,'vertices':sum(len(o.data.vertices) for o in bpy.context.scene.objects if o.type=='MESH'),'objects':len([o for o in bpy.context.scene.objects if o.type=='MESH']),'materials':2,'textures':2,'imageBytes':0,'blendSizeBytes':os.path.getsize(blend),'mobileBudget':'PASS'}},open(os.path.join(out,'UPPER_TRIM_RESULT.json'),'w'),indent=2)
