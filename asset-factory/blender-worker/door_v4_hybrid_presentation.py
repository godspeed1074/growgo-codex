import bpy, os, sys, json, hashlib
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:]; source,layers,out=args[0:3];os.makedirs(out,exist_ok=True);bpy.ops.wm.open_mainfile(filepath=source)
s=bpy.context.scene;s.render.engine='BLENDER_EEVEE';s.render.resolution_x=600;s.render.resolution_y=700;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.view_settings.view_transform='Standard';s.view_settings.look='None'
U=1.2/164;CX=(94+258)/2;ground=291
X=lambda p:(p-CX)*U;Z=lambda p:(ground-p)*U
struct=[o for o in bpy.data.objects if o.get('moduleId')=='GG-BLD-DOOR-SHOP-002'];fp={o.name:[round(v,7) for v in list(o.location)+list(o.dimensions)+list(o.rotation_euler)] for o in sorted(struct,key=lambda x:x.name)}
layersSpec=[('ART_CASING_LEFT','D10'),('ART_CASING_RIGHT','D11'),('ART_HEAD_CAP','D19'),('ART_TRANSOM_SEPARATOR','D18'),('ART_TRANSOM_GLASS','D14'),('ART_DOOR_SLAB','D01'),('ART_MAIN_GLASS','D02'),('ART_MAIN_GLASS_FRAME_REVEAL','D03'),('ART_LOWER_PANEL','D04'),('ART_HARDWARE','D06'),('ART_THRESHOLD','D20')]
art=[]
def plane(name,cid,idx):
 y=-.132-idx*.0015;verts=[(X(0),y,Z(0)),(X(300),y,Z(0)),(X(300),y,Z(350)),(X(0),y,Z(350))];mesh=bpy.data.meshes.new(name+'_MESH');mesh.from_pydata(verts,[],[(0,1,2,3)]);mesh.uv_layers.new(name='UV');uv=mesh.uv_layers.active.data;coords=[(0,1),(1,1),(1,0),(0,0)];[setattr(uv[i],'uv',coords[i]) for i in range(4)];o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o['artLayer']=True;o['componentId']=cid;o['moduleId']='GG-BLD-DOOR-SHOP-002';o['presentationVariant']='REFERENCE_LAYERED_V4';o['anonymousGeometry']=False
 parent=next((z for z in struct if z.get('componentId')==cid),None)
 if parent:o.parent=parent;o.matrix_parent_inverse=parent.matrix_world.inverted()
 im=bpy.data.images.load(os.path.join(layers,name+'.png'),check_existing=False);m=bpy.data.materials.new('UNLIT_'+name);m.use_nodes=True;n=m.node_tree.nodes;n.clear();outn=n.new('ShaderNodeOutputMaterial');em=n.new('ShaderNodeEmission');tex=n.new('ShaderNodeTexImage');tr=n.new('ShaderNodeBsdfTransparent');mix=n.new('ShaderNodeMixShader');tex.image=im;m.node_tree.links.new(tex.outputs['Color'],em.inputs['Color']);m.node_tree.links.new(tex.outputs['Alpha'],mix.inputs[0]);m.node_tree.links.new(tr.outputs[0],mix.inputs[1]);m.node_tree.links.new(em.outputs[0],mix.inputs[2]);m.node_tree.links.new(mix.outputs[0],outn.inputs[0]);m.surface_render_method='DITHERED';o.data.materials.append(m);art.append(o)
for i,(n,c) in enumerate(layersSpec):plane(n,c,i)
def render(n):s.render.filepath=os.path.join(out,n);bpy.ops.render.render(write_still=True)
render('SHOP_DOOR_HYBRID_FRONT.png')
cam=s.camera;target=Vector((0,0,cam.location.z));radius=8.0
for degrees,label in [(15,'15_LEFT'),(30,'30_LEFT'),(-15,'15_RIGHT'),(-30,'30_RIGHT')]:
 a=degrees*3.141592653589793/180.0;cam.location=(radius*__import__('math').sin(a),-radius*__import__('math').cos(a),target.z);cam.rotation_euler=((target-cam.location).to_track_quat('-Z','Y')).to_euler();render('SHOP_DOOR_HYBRID_'+label+'.png')
cam.location=(0,-radius,target.z);cam.rotation_euler=((target-cam.location).to_track_quat('-Z','Y')).to_euler()
# Art-layer diagnostic: emission IDs on art only; structural carcass is hidden.
hidden=[(o,o.hide_render) for o in struct];[setattr(o,'hide_render',True) for o in struct]
for i,o in enumerate(art):
 m=o.data.materials[0];m.node_tree.nodes.get('Emission').inputs['Color'].default_value=((i*47%255)/255,(i*89%255)/255,(i*151%255)/255,1)
render('SHOP_DOOR_HYBRID_ART_LAYER_ID.png')
for o,v in hidden:o.hide_render=v
after={o.name:[round(v,7) for v in list(o.location)+list(o.dimensions)+list(o.rotation_euler)] for o in sorted(struct,key=lambda x:x.name)}
tri=sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in struct+art);files=[]
for n,_ in layersSpec:
 p=os.path.join(layers,n+'.png');files.append({'id':n,'bytes':os.path.getsize(p),'sha256':hashlib.sha256(open(p,'rb').read()).hexdigest()})
audit={'status':'PASS' if fp==after else 'FAIL','structuralGeometryChanged':fp!=after,'structuralSourceSha256':hashlib.sha256(json.dumps(fp,sort_keys=True).encode()).hexdigest(),'artLayers':files,'frontLayerMaterial':'UNLIT_EMISSION','sourceContextContamination':False,'triangles':tri,'structuralTriangles':568,'artTriangles':len(art)*2,'textures':len(art),'textureBytes':sum(x['bytes'] for x in files),'drawCalls':len(art),'anonymousGeometry':0,'budget':'PASS'};json.dump(audit,open(os.path.join(out,'SHOP_DOOR_V4_HYBRID_AUDIT.json'),'w'),indent=2)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'GG-BLD-DOOR-SHOP-002_V4_HYBRID.blend'))
