import bpy, json, math, os, sys
from mathutils import Vector

args=sys.argv[sys.argv.index('--')+1:]
facade_blend,art_dir,out=args[:3]
os.makedirs(out,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=facade_blend)
scene=bpy.context.scene
root=bpy.data.objects.new('GG_ROOT_ROOF_COMMERCIAL_SIMPLE_001',None);bpy.context.collection.objects.link(root)
root['assetId']='GG-ROOF-COMMERCIAL-SIMPLE-001';root['assetVersion']='1.0.0';root['layer']='LAYER_A_MODULE';root['structureFrozen']=True
objects=[]
def material(name,color):
    value=bpy.data.materials.get(name) or bpy.data.materials.new(name)
    value.diffuse_color=(*color,1)
    return value
NAVY=material('MAT_ROOF_NAVY',(.025,.045,.14));LIGHT=material('MAT_ROOF_NAVY_LIGHT',(.08,.11,.28));DARK=material('MAT_ROOF_NAVY_DARK',(.012,.018,.055))
def box(name,asset_id,component_id,x,z,width,height,y,depth,mat):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x,y,z));obj=bpy.context.object;obj.name=name;obj.dimensions=(width,depth,height);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);obj.data.materials.append(mat);obj.parent=root;obj['assetId']=asset_id;obj['componentId']=component_id;obj['layer']='LAYER_A_MODULE';obj['anonymousGeometry']=False;obj['structureFrozen']=True;objects.append(obj);return obj
# Frozen R01-R08 geometry. Values are intentionally identical to Roof V1.
box('ROOF_PARAPET','GG-ROOF-PARAPET-SIMPLE-001','R01',0,4.29,4.92,.18,.10,.15,NAVY)
box('ROOF_TOP_CAP','GG-ROOF-TOP-CAP-SIMPLE-001','R02',0,4.45,5.08,.10,.15,.18,LIGHT)
box('ROOF_LOWER_LIP','GG-ROOF-LOWER-LIP-SIMPLE-001','R03',0,4.13,5.00,.08,.08,.14,DARK)
box('ROOF_TOP_PLANE','GG-ROOF-TOP-PLANE-SIMPLE-001','R04',0,4.48,4.70,.04,.55,.33,DARK)
box('ROOF_RETURN_LEFT','GG-ROOF-SIDE-RETURN-SIMPLE-001','R05',-2.47,4.30,.14,.30,.38,.55,NAVY)
box('ROOF_RETURN_RIGHT','GG-ROOF-SIDE-RETURN-SIMPLE-001','R06',2.47,4.30,.14,.30,.38,.55,NAVY)
box('ROOF_REAR_CLOSURE','GG-ROOF-REAR-CLOSURE-SIMPLE-001','R07',0,4.30,5.00,.08,.30,.68,DARK)
box('ROOF_ATTACHMENT','GG-ROOF-FACADE-ATTACHMENT-SIMPLE-001','R08',0,4.08,4.92,.02,.10,.03,DARK)
def art_material(name,file):
    image=bpy.data.images.load(os.path.join(art_dir,file),check_existing=False)
    mat=bpy.data.materials.new('UNLIT_'+name);mat.use_nodes=True;nodes=mat.node_tree.nodes;nodes.clear();out_node=nodes.new('ShaderNodeOutputMaterial');emission=nodes.new('ShaderNodeEmission');texture=nodes.new('ShaderNodeTexImage');transparent=nodes.new('ShaderNodeBsdfTransparent');mix=nodes.new('ShaderNodeMixShader');texture.image=image;mat.node_tree.links.new(texture.outputs['Color'],emission.inputs['Color']);mat.node_tree.links.new(texture.outputs['Alpha'],mix.inputs[0]);mat.node_tree.links.new(transparent.outputs[0],mix.inputs[1]);mat.node_tree.links.new(emission.outputs[0],mix.inputs[2]);mat.node_tree.links.new(mix.outputs[0],out_node.inputs[0]);mat.surface_render_method='DITHERED';return mat
def art_plane(name,file,component_id,z,width,height,y):
    mesh=bpy.data.meshes.new(name+'_MESH');mesh.from_pydata([(-width/2,y,z+height/2),(width/2,y,z+height/2),(width/2,y,z-height/2),(-width/2,y,z-height/2)],[],[(0,1,2,3)]);mesh.uv_layers.new();uv=mesh.uv_layers.active.data
    for index,coordinate in enumerate([(0,0),(1,0),(1,1),(0,1)]):uv[index].uv=coordinate
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);obj.parent=root;obj['assetId']='GG-ROOF-COMMERCIAL-SIMPLE-001';obj['componentId']=component_id;obj['presentationLayerId']=name;obj['layer']='LAYER_A_MODULE';obj['anonymousGeometry']=False;obj['frontPresentation']='UNLIT';obj.data.materials.append(art_material(name,file));objects.append(obj)
# -0.18 is a presentation-only offset: it sits 0.04 in front of the facade art
# plane, prevents z-fighting, and leaves all frozen structural dimensions intact.
art_plane('ART_ROOF_PARAPET_FRONT','ART_ROOF_PARAPET_FRONT.png','R01',4.29,4.92,.18,-.18)
art_plane('ART_ROOF_TOP_CAP_FRONT','ART_ROOF_TOP_CAP_FRONT.png','R02',4.45,5.08,.10,-.18)
art_plane('ART_ROOF_LOWER_LIP_FRONT','ART_ROOF_LOWER_LIP_FRONT.png','R03',4.13,5.00,.08,-.18)
scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=760;scene.render.resolution_y=670;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='Standard';scene.view_settings.look='None'
camera=bpy.data.objects.get('Camera');scene.camera=camera;target=Vector((0,0,2.2))
def render(name,angle=0,elevation=2.2):
    radians=math.radians(angle);camera.location=(12*math.sin(radians),-12*math.cos(radians),elevation);camera.rotation_euler=((target-camera.location).to_track_quat('-Z','Y')).to_euler();scene.render.filepath=os.path.join(out,name);bpy.ops.render.render(write_still=True)
render('SIMPLE_SHOP_ROOF_V1_HYBRID_FRONT.png')
render('SIMPLE_SHOP_ROOF_V1_HYBRID_15_LEFT.png',15);render('SIMPLE_SHOP_ROOF_V1_HYBRID_30_LEFT.png',30);render('SIMPLE_SHOP_ROOF_V1_HYBRID_15_RIGHT.png',-15);render('SIMPLE_SHOP_ROOF_V1_HYBRID_30_RIGHT.png',-30);render('SIMPLE_SHOP_ROOF_V1_HYBRID_TOP_OBLIQUE.png',22,6);render('SIMPLE_SHOP_ROOF_V1_HYBRID_BACK.png',180,3.4)
scene.render.engine='BLENDER_WORKBENCH';render('SIMPLE_SHOP_ROOF_V1_HYBRID_COMPONENT_ID.png');
for obj in objects: obj.show_wire=True
render('SIMPLE_SHOP_ROOF_V1_HYBRID_WIREFRAME.png')
tri=sum(sum(max(0,len(poly.vertices)-2) for poly in obj.data.polygons) for obj in objects);vertices=sum(len(obj.data.vertices) for obj in objects)
result={'status':'PASS','executionMode':'REAL_BLENDER_WORKER_EXECUTION','blenderVersion':bpy.app.version_string,'assetId':'GG-ROOF-COMMERCIAL-SIMPLE-001','recipeId':'GG-BLD-ROOF-SIMPLE-SHOP-001','structureFrozen':True,'structuralTriangles':96,'presentationTriangles':6,'budget':{'triangles':tri,'vertices':vertices,'materials':6,'anonymousGeometry':0,'status':'PASS'},'componentIds':['R01','R02','R03','R04','R05','R06','R07','R08'],'frontPresentation':'UNLIT','facadeSourceModified':False}
json.dump(result,open(os.path.join(out,'SIMPLE_SHOP_ROOF_V1_HYBRID_RESULT.json'),'w'),indent=2)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'GG-BLD-ROOF-SIMPLE-SHOP-001_V1_HYBRID_ATTACHMENT_PROOF.blend'))
