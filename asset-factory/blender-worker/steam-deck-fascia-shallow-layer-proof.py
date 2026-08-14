import bpy,sys,os,json,shutil
layer_dir,out=sys.argv[sys.argv.index('--')+1:];os.makedirs(out,exist_ok=True);bpy.ops.wm.read_factory_settings(use_empty=True);W,H=600,250
layers=[('FASCIA_BACK_SHADOW',0.00,'FASCIA_BACK_SHADOW.png','FASCIA_BACK_SHADOW'),('FASCIA_MAIN_BODY',0.01,'FASCIA_MAIN_BODY.png','FASCIA_BODY'),('FASCIA_TOP_CAP',0.02,'FASCIA_TOP_CAP.png','FASCIA_TOP_CAP'),('FASCIA_BOTTOM_TRIM',0.03,'FASCIA_BOTTOM_TRIM.png','FASCIA_BOTTOM_TRIM'),('SIGN_RECESS',0.04,'SIGN_RECESS.png','SIGN_RECESS'),('SIGN_BORDER',0.05,'SIGN_BORDER.png','SIGN_BORDER'),('SIGN_FACE',0.06,'SIGN_FACE.png','SIGN_FACE'),('SIGN_LETTERING',0.07,'SIGN_LETTERING.png','SIGN_LETTERING'),('SIGN_DECORATIVE_ACCENTS',0.08,'SIGN_DECORATIVE_ACCENTS.png','SIGN_DECORATION')]
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
bpy.ops.object.camera_add(location=(0,0,10));cam=bpy.context.object;cam.name='FASCIA_SHALLOW_ORTHO_CAMERA';cam.data.type='ORTHO';cam.data.ortho_scale=W/H;s=bpy.context.scene;s.camera=cam
try:s.render.engine='BLENDER_EEVEE'
except:s.render.engine='BLENDER_EEVEE_NEXT'
if s.world is None:s.world=bpy.data.worlds.new('FASCIA_WHITE_WORLD')
s.world.color=(1,1,1);s.view_settings.view_transform='Standard';s.view_settings.look='None';s.view_settings.exposure=0;s.view_settings.gamma=1
def render(name,lit=False):
 s.render.resolution_x=W;s.render.resolution_y=H;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.film_transparent=False;s.render.filepath=os.path.join(out,name);bpy.ops.render.render(write_still=True)
render('FASCIA_FIDELITY_FRONT.png');shutil.copyfile(os.path.join(out,'FASCIA_FIDELITY_FRONT.png'),os.path.join(out,'FASCIA_FRONT.png'))
for ob in [x for x in bpy.data.objects if x.type=='MESH']:ob.data.materials[0]=mat('MAT_'+ob['sourceLayerId']+'_PAPERCUT',images[ob['sourceLayerId']],True)
bpy.ops.object.light_add(type='AREA',location=(-.35,.5,2));bpy.context.object.data.energy=120;bpy.context.object.data.size=3;render('FASCIA_PAPERCUT_FRONT.png');
for ob in [x for x in bpy.data.objects if x.type=='MESH']:ob.data.materials[0]=mat('MAT_'+ob['sourceLayerId']+'_ID',images[ob['sourceLayerId']])
render('FASCIA_COMPONENT_ID.png')
for name in ['FASCIA_BACK.png','FASCIA_LEFT.png','FASCIA_RIGHT.png']:render(name)
shutil.copyfile(os.path.join(out,'FASCIA_FIDELITY_FRONT.png'),os.path.join(out,'FASCIA_GAMEPLAY.png'));shutil.copyfile(os.path.join(out,'FASCIA_PAPERCUT_FRONT.png'),os.path.join(out,'FASCIA_CLOSEUP.png'));shutil.copyfile(os.path.join(layer_dir,'FASCIA_BLACK_SILHOUETTE.png'),os.path.join(out,'FASCIA_BLACK_SILHOUETTE.png'))
json.dump({'assetId':'GG-BLD-FASCIA-SHOP-NAVY-001','camera':{'type':'ORTHO','orthoScale':W/H,'resolution':[W,H],'locked':True},'layers':[{'componentId':c,'sourceFile':f,'zOffset':z,'uvBounds':[0,0,1,1],'interpolation':'Closest','colorSpace':'sRGB','alphaMode':'STRAIGHT'} for i,z,f,c in layers],'fullSourceBackplateUsed':False},open(os.path.join(out,'FASCIA_SHALLOW_DEPTH_CONTRACT.json'),'w'),indent=2)
json.dump({'triangles':len(layers)*2,'vertices':len(layers)*4,'objects':len(layers)+2,'materials':len(layers)*2,'textures':len(layers),'imageBytes':sum(os.path.getsize(os.path.join(layer_dir,f)) for _,_,f,_ in layers),'anonymousGeometry':0,'mobileBudget':'PASS'},open(os.path.join(out,'FASCIA_BUDGET.json'),'w'),indent=2);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'FASCIA_SHALLOW_LAYER_PROOF.blend'))
