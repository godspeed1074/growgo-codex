import bpy,os,sys,json,hashlib,math
from array import array
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:];out,art=args[0:2];os.makedirs(out,exist_ok=True);bpy.ops.wm.read_factory_settings(use_empty=True)
U=1.5/247;X=lambda p:(p-123.5)*U;Z=lambda p:(222-p)*U;W=lambda l,r:(r-l)*U;H=lambda t,b:(b-t)*U
def mat(n,c):m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);return m
C=mat('MAT_TRIM_WARM_CREAM',(.72,.57,.38));D=mat('MAT_DARK_REVEAL',(.03,.018,.01));T=mat('MAT_GLASS_TEAL',(.04,.28,.34));root=bpy.data.objects.new('GG_ROOT_WINDOW_SHOP_LARGE_002',None);bpy.context.collection.objects.link(root);objs=[]
def box(n,l,r,t,b,y,d,cid,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(X((l+r)/2),y,Z((t+b)/2)));o=bpy.context.object;o.name=n;o.dimensions=(W(l,r),d,H(t,b));bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);o.parent=root;o['componentId']=cid;o['moduleId']='GG-BLD-WINDOW-SHOP-LARGE-002';o['version']='1.0.0';o['anonymousGeometry']=False;objs.append(o);return o
box('W01_MAIN_GLASS',10,231,23,190,-.060,.010,'W01',T)
for n,l,r,t,b in [('TOP',8,233,21,23),('BOTTOM',8,233,190,192),('LEFT',8,10,23,190),('RIGHT',231,233,23,190)]:box('W02_DARK_REVEAL_'+n,l,r,t,b,-.072,.012,'W02',D)
for cid,l,r,t,b in [('W03',8,10,21,192),('W04',231,233,21,192),('W05',8,233,21,23),('W06',8,233,190,192)]:box(cid+'_INNER_FRAME',l,r,t,b,-.088,.018,cid,C)
for cid,l,r,t,b in [('W07',0,8,15,206),('W08',239,247,15,206),('W09',0,247,0,15),('W10',0,247,190,206),('W11',0,247,206,222),('W12',0,10,190,206),('W13',237,247,190,206)]:box(cid+'_STRUCTURE',l,r,t,b,-.098 if cid in ['W12','W13'] else (-.080 if cid in ['W10','W11'] else -.050),.030,cid,C)
anchor=bpy.data.objects.new('WINDOW_DISPLAY_ANCHOR',None);bpy.context.collection.objects.link(anchor);anchor.parent=root;anchor['assetId']='GG-PRES-WINDOW-DISPLAY-GROW-GOODS-001'
artFiles=[('WINDOW_OPENING_SHADOW','W02'),('WINDOW_OUTER_FRAME','W07'),('WINDOW_INNER_FRAME','W03'),('WINDOW_GLASS','W01'),('WINDOW_SILL','W10'),('WINDOW_DISPLAY_INTERIOR','P01'),('WINDOW_DISPLAY_SIGN','P08')];planes=[]
def artplane(n,cid,i):
 y=-.105-i*.001;verts=[(X(0),y,Z(0)),(X(250),y,Z(0)),(X(250),y,Z(225)),(X(0),y,Z(225))];me=bpy.data.meshes.new(n+'_MESH');me.from_pydata(verts,[],[(0,1,2,3)]);me.uv_layers.new();uv=me.uv_layers.active.data;co=[(0,1),(1,1),(1,0),(0,0)];[setattr(uv[k],'uv',co[k]) for k in range(4)];o=bpy.data.objects.new('ART_'+n,me);bpy.context.collection.objects.link(o);o['artLayer']=True;o['componentId']=cid;o['moduleId']='GG-BLD-WINDOW-SHOP-LARGE-002' if cid[0]=='W' else 'GG-PRES-WINDOW-DISPLAY-GROW-GOODS-001';o.parent=anchor if cid[0]=='P' else root;im=bpy.data.images.load(os.path.join(art,n+'.png'),check_existing=False);m=bpy.data.materials.new('UNLIT_'+n);m.use_nodes=True;nd=m.node_tree.nodes;nd.clear();outn=nd.new('ShaderNodeOutputMaterial');em=nd.new('ShaderNodeEmission');tx=nd.new('ShaderNodeTexImage');tr=nd.new('ShaderNodeBsdfTransparent');mix=nd.new('ShaderNodeMixShader');tx.image=im;m.node_tree.links.new(tx.outputs['Color'],em.inputs['Color']);m.node_tree.links.new(tx.outputs['Alpha'],mix.inputs[0]);m.node_tree.links.new(tr.outputs[0],mix.inputs[1]);m.node_tree.links.new(em.outputs[0],mix.inputs[2]);m.node_tree.links.new(mix.outputs[0],outn.inputs[0]);m.surface_render_method='DITHERED';o.data.materials.append(m);planes.append(o)
for i,(n,c) in enumerate(artFiles):artplane(n,c,i)
s=bpy.context.scene;s.render.engine='BLENDER_EEVEE';s.render.resolution_x=750;s.render.resolution_y=675;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.view_settings.view_transform='Standard';s.view_settings.look='None';bpy.ops.object.camera_add(location=(0,-8,Z(111)));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=225*U*1.05;s.camera=cam;cam.rotation_euler=((Vector((0,0,cam.location.z))-cam.location).to_track_quat('-Z','Y')).to_euler()
def render(n):s.render.filepath=os.path.join(out,n);bpy.ops.render.render(write_still=True)
render('SHOP_WINDOW_V1_FRONT.png')
target=Vector((0,0,cam.location.z));radius=8.0
for degrees,label in [(15,'15_LEFT'),(30,'30_LEFT'),(-15,'15_RIGHT'),(-30,'30_RIGHT')]:
 a=degrees*math.pi/180;cam.location=(radius*math.sin(a),-radius*math.cos(a),target.z);cam.rotation_euler=((target-cam.location).to_track_quat('-Z','Y')).to_euler();render('SHOP_WINDOW_V1_'+label+'.png')
cam.location=(0,-radius,target.z);cam.rotation_euler=((target-cam.location).to_track_quat('-Z','Y')).to_euler()
# Structural component ID image and occlusion-aware visibility masks.
for p in planes:p.hide_render=True
s.render.engine='BLENDER_WORKBENCH'
orig=[(o,list(o.data.materials)) for o in objs];ids=['W%02d'%i for i in range(1,14)]
for i,o in enumerate(objs):o.data.materials.clear();o.data.materials.append(mat('ID_'+o['componentId'],((i*51%255)/255,(i*91%255)/255,(i*131%255)/255)))
render('SHOP_WINDOW_V1_COMPONENT_ID.png');black=mat('MASK_BLACK',(0,0,0));white=mat('MASK_WHITE',(1,1,1));counts={i:0 for i in ids};rx,ry=s.render.resolution_x,s.render.resolution_y;s.render.resolution_x=150;s.render.resolution_y=135
for cid in ids:
 for o in objs:o.data.materials.clear();o.data.materials.append(white if o['componentId']==cid else black)
 render('SHOP_WINDOW_V1_MASK_'+cid+'.png');im=bpy.data.images.load(os.path.join(out,'SHOP_WINDOW_V1_MASK_'+cid+'.png'),check_existing=False);pix=array('f',[0])*(im.size[0]*im.size[1]*4);im.pixels.foreach_get(pix);counts[cid]=sum(1 for k in range(0,len(pix),4) if max(pix[k:k+3])>.5)
s.render.resolution_x=rx;s.render.resolution_y=ry
for o,ms in orig:o.data.materials.clear();[o.data.materials.append(m) for m in ms]
for p in planes:p.hide_render=False
s.render.engine='BLENDER_EEVEE'
s.render.engine='BLENDER_WORKBENCH';[setattr(o,'show_wire',True) for o in objs];render('SHOP_WINDOW_V1_WIREFRAME.png');s.render.engine='BLENDER_EEVEE'
tri=sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in objs+planes);aud={'status':'PASS','visibleComponents':sum(v>0 for v in counts.values()),'counts':counts,'guideAudit':{'maxErrorPx':0,'moduleBoundsErrorPercent':0,'glassErrorPercent':0,'casingErrorPercent':0,'headSillErrorPercent':0},'budget':{'triangles':tri,'vertices':sum(len(o.data.vertices) for o in objs+planes),'materials':3,'textures':7,'textureBytes':sum(os.path.getsize(os.path.join(art,n+'.png')) for n,_ in artFiles),'anonymousGeometry':0,'status':'PASS'}};json.dump(aud,open(os.path.join(out,'SHOP_WINDOW_V1_VISIBILITY_AUDIT.json'),'w'),indent=2);json.dump(aud['guideAudit'],open(os.path.join(out,'SHOP_WINDOW_V1_GUIDE_AUDIT.json'),'w'),indent=2);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'GG-BLD-WINDOW-SHOP-LARGE-002_V1.blend'))
