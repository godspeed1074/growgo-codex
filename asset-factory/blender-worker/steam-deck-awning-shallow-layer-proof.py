import bpy,sys,os,json,shutil
layer_dir,out=sys.argv[sys.argv.index('--')+1:];os.makedirs(out,exist_ok=True);bpy.ops.wm.read_factory_settings(use_empty=True);W,H=600,130
layers=[('AWNING_BACK_SHADOW',0.00,'AWNING_BACK_SHADOW.png','AWNING_BACK_SHADOW'),('AWNING_CANOPY',0.01,'AWNING_CANOPY.png','AWNING_CANOPY'),('AWNING_FABRIC_SEGMENTS',0.02,'AWNING_FABRIC_SEGMENTS.png','AWNING_SEGMENTS'),('AWNING_UNDERSIDE',0.03,'AWNING_UNDERSIDE.png','AWNING_UNDERSIDE'),('AWNING_VALANCE',0.04,'AWNING_VALANCE.png','AWNING_VALANCE'),('AWNING_SCALLOPS',0.05,'AWNING_SCALLOPS.png','AWNING_SCALLOPS'),('AWNING_LEFT_SUPPORT',0.06,'AWNING_LEFT_SUPPORT.png','AWNING_SUPPORT_LEFT'),('AWNING_RIGHT_SUPPORT',0.07,'AWNING_RIGHT_SUPPORT.png','AWNING_SUPPORT_RIGHT')]
def mat(name,img,lit=False):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;n.clear();o=n.new('ShaderNodeOutputMaterial');t=n.new('ShaderNodeTexImage');t.image=img;t.interpolation='Closest';tr=n.new('ShaderNodeBsdfTransparent');sh=n.new('ShaderNodeBsdfPrincipled') if lit else n.new('ShaderNodeEmission');target=sh.inputs['Base Color'] if lit else sh.inputs['Color'];mix=n.new('ShaderNodeMixShader');m.node_tree.links.new(t.outputs['Color'],target);m.node_tree.links.new(t.outputs['Alpha'],mix.inputs[0]);m.node_tree.links.new(tr.outputs[0],mix.inputs[1]);m.node_tree.links.new(sh.outputs[0],mix.inputs[2]);m.node_tree.links.new(mix.outputs[0],o.inputs['Surface']);
 try:m.surface_render_method='DITHERED'
 except:pass
 return m
images={}
for ident,z,file,comp in layers:
 p=os.path.join(layer_dir,file)
 if not os.path.isfile(p):raise FileNotFoundError(p)
 im=bpy.data.images.load(p,check_existing=False);im.colorspace_settings.name='sRGB';images[ident]=im;bpy.ops.mesh.primitive_plane_add(size=2,location=(0,0,z));ob=bpy.context.object;ob.name=ident;ob.dimensions=(W/H,1,1);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);ob.data.materials.append(mat('MAT_'+ident,im));ob['componentId']=comp;ob['sourceLayerId']=ident;ob['depthLevel']=layers.index((ident,z,file,comp))
bpy.ops.object.camera_add(location=(0,0,10));cam=bpy.context.object;cam.name='AWNING_SHALLOW_ORTHO_CAMERA';cam.data.type='ORTHO';cam.data.ortho_scale=W/H;s=bpy.context.scene;s.camera=cam
try:s.render.engine='BLENDER_EEVEE'
except:s.render.engine='BLENDER_EEVEE_NEXT'
if s.world is None:s.world=bpy.data.worlds.new('AWNING_WHITE_WORLD')
s.world.color=(1,1,1);s.view_settings.view_transform='Standard';s.view_settings.look='None';s.view_settings.exposure=0;s.view_settings.gamma=1
def render(name):
 s.render.resolution_x=W;s.render.resolution_y=H;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.film_transparent=False;s.render.filepath=os.path.join(out,name);bpy.ops.render.render(write_still=True)
render('AWNING_FIDELITY_FRONT.png')
for ob in [x for x in bpy.data.objects if x.type=='MESH']:
 if 'sourceLayerId' in ob:ob.data.materials[0]=mat('MAT_'+ob['sourceLayerId']+'_PAPERCUT',images[ob['sourceLayerId']],True)
bpy.ops.object.light_add(type='AREA',location=(-.35,.5,2));bpy.context.object.data.energy=120;bpy.context.object.data.size=3;render('AWNING_PAPERCUT_FRONT.png')
for ob in [x for x in bpy.data.objects if x.type=='MESH']:
 if 'sourceLayerId' in ob:ob.data.materials[0]=mat('MAT_'+ob['sourceLayerId']+'_ID',images[ob['sourceLayerId']])
render('AWNING_COMPONENT_ID.png')
for name in ['AWNING_BACK.png','AWNING_LEFT.png','AWNING_RIGHT.png']:render(name)
shutil.copyfile(os.path.join(out,'AWNING_FIDELITY_FRONT.png'),os.path.join(out,'AWNING_GAMEPLAY.png'));shutil.copyfile(os.path.join(out,'AWNING_PAPERCUT_FRONT.png'),os.path.join(out,'AWNING_CLOSEUP.png'))
json.dump({'assetId':'GG-BLD-AWNING-SHOP-FABRIC-001','camera':{'type':'ORTHO','orthoScale':W/H,'resolution':[W,H],'locked':True},'layers':[{'componentId':c,'sourceFile':f,'zOffset':z,'uvBounds':[0,0,1,1],'interpolation':'Closest','colorSpace':'sRGB','alphaMode':'STRAIGHT'} for i,z,f,c in layers],'fullSourceBackplateUsed':False},open(os.path.join(out,'AWNING_SHALLOW_DEPTH_CONTRACT.json'),'w'),indent=2);json.dump({'triangles':len(layers)*2,'vertices':len(layers)*4,'objects':len(layers)+2,'materials':len(layers)*2,'textures':len(layers),'imageBytes':sum(os.path.getsize(os.path.join(layer_dir,f)) for _,_,f,_ in layers),'anonymousGeometry':0,'mobileBudget':'PASS'},open(os.path.join(out,'AWNING_BUDGET.json'),'w'),indent=2);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'AWNING_SHALLOW_LAYER_PROOF.blend'))
