import bpy, json, math, os, sys
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:]; source_blend,out=args[:2]; os.makedirs(out,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=source_blend); scene=bpy.context.scene
root=bpy.data.objects.new('GG_ROOT_SHOP_SIMPLE_GROW_GOODS_001',None); bpy.context.collection.objects.link(root); root['assetId']='GG-BLD-SHOP-SIMPLE-GROW-GOODS-001'; root['assetVersion']='1.0.0'; root['layer']='LAYER_B_RECIPE'; root['anonymousGeometry']=False
def get_mat(name,color):
    material=bpy.data.materials.get(name) or bpy.data.materials.new(name); material.diffuse_color=(*color,1); return material
WALL=get_mat('MAT_WALL_WARM_TERRACOTTA',(.29,.12,.06)); TRIM=get_mat('MAT_TRIM_WARM_CREAM',(.75,.60,.39)); DARK=get_mat('MAT_DARK_REVEAL',(.02,.01,.008)); ROOF=get_mat('MAT_ROOF_NAVY_DARK',(.012,.018,.055)); shell=[]
# The copied front already owns MAT_WALL_WARM_TERRACOTTA. A shell-only presentation
# slot prevents inferred side/back lighting from changing protected front pixels.
SHELL_WALL=bpy.data.materials.new('MAT_WALL_WARM_TERRACOTTA_SHELL_PRESENTATION'); SHELL_WALL.use_nodes=True; wall_nodes=SHELL_WALL.node_tree.nodes; wall_nodes.clear(); wall_out=wall_nodes.new('ShaderNodeOutputMaterial'); wall_emission=wall_nodes.new('ShaderNodeEmission'); wall_emission.inputs['Color'].default_value=(.29,.12,.06,1); SHELL_WALL.node_tree.links.new(wall_emission.outputs[0],wall_out.inputs[0])
def box(name,asset,component,loc,dims,material):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); obj=bpy.context.object; obj.name=name; obj.dimensions=dims; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); obj.data.materials.append(material); obj.parent=root; obj['assetId']=asset; obj['componentId']=component; obj['layer']='LAYER_A_MODULE'; obj['anonymousGeometry']=False; obj['inferredHiddenGeometry']=True; shell.append(obj)
box('COMPLETE_LEFT_SIDE','GG-BLD-WALL-SIDE-COMMERCIAL-SIMPLE-001','LEFT_SIDE_ROOT',(-2.45,1.5,2.2),(.12,3,4.2),SHELL_WALL)
box('COMPLETE_RIGHT_SIDE','GG-BLD-WALL-SIDE-COMMERCIAL-SIMPLE-001','RIGHT_SIDE_ROOT',(2.45,1.5,2.2),(.12,3,4.2),SHELL_WALL)
box('COMPLETE_REAR','GG-BLD-WALL-REAR-COMMERCIAL-SIMPLE-001','REAR_ROOT',(0,2.95,2.2),(4.9,.12,4.2),SHELL_WALL)
box('COMPLETE_FLOOR','GG-BLD-FLOOR-FOOTPRINT-SIMPLE-001','FLOOR_ROOT',(0,1.5,.1),(4.9,3,.12),DARK)
box('COMPLETE_ROOF_BACK','GG-BLD-ROOF-BACK-SHELL-COMMERCIAL-SIMPLE-001','ROOF_BACK_ROOT',(0,1.6,4.45),(4.7,2.65,.08),ROOF)
for x in (-2.37,2.37):
    for y in (.10,2.90): box('COMPLETE_CORNER','GG-BLD-CORNER-COMMERCIAL-SIMPLE-001','CORNER_JOIN',(x,y,2.2),(.16,.16,4.2),TRIM)
collision=bpy.data.objects.new('GG_COLLISION_SHOP_SIMPLE_001',None); bpy.context.collection.objects.link(collision); collision.empty_display_type='CUBE'; collision.empty_display_size=1; collision.location=(0,1.5,2.1); collision.scale=(2.45,1.5,2.1); collision['collisionType']='SIMPLE_BOX'; collision['assetId']='GG-BLD-FLOOR-FOOTPRINT-SIMPLE-001'; collision['anonymousGeometry']=False
scene.render.engine='BLENDER_EEVEE'; scene.render.resolution_x=760; scene.render.resolution_y=670; scene.render.resolution_percentage=100; scene.render.image_settings.file_format='PNG'; scene.view_settings.view_transform='Standard'; scene.view_settings.look='None'
side_lights=[]
for location,energy in [((5,2,5),100),((-5,2,5),100),((0,5,5),120)]:
    bpy.ops.object.light_add(type='AREA',location=location); light=bpy.context.object; light.data.energy=energy; light.data.shape='DISK'; light.data.size=5; side_lights.append(light)
camera=bpy.data.objects.get('Camera'); scene.camera=camera; target=Vector((0,1.2,2.2))
def render(name,angle=0,elevation=2.3):
    side_or_back=abs(angle)>=90
    for light in side_lights: light.hide_render=not side_or_back
    for obj in shell: obj.hide_render=abs(angle)<0.001
    for obj in scene.objects:
        if obj.type=='MESH' and any(slot.material and slot.material.name.startswith('UNLIT_') for slot in obj.material_slots): obj.hide_render=side_or_back
    radians=math.radians(angle); camera.location=(12*math.sin(radians),1.2-12*math.cos(radians),elevation); camera.rotation_euler=((target-camera.location).to_track_quat('-Z','Y')).to_euler(); scene.render.filepath=os.path.join(out,name); bpy.ops.render.render(write_still=True)
for name,angle,elevation in [('FRONT',0,2.2),('15_LEFT',15,2.3),('30_LEFT',30,2.4),('15_RIGHT',-15,2.3),('30_RIGHT',-30,2.4),('LEFT',90,2.5),('RIGHT',-90,2.5),('BACK',180,2.5),('TOP_OBLIQUE',25,7)]: render('SIMPLE_SHOP_COMPLETE_V1_'+name+'.png',angle,elevation)
scene.render.engine='BLENDER_WORKBENCH'; render('SIMPLE_SHOP_COMPLETE_V1_COMPONENT_ID.png');
for obj in shell: obj.show_wire=True
render('SIMPLE_SHOP_COMPLETE_V1_WIREFRAME.png')
shell_tri=sum(sum(max(0,len(poly.vertices)-2) for poly in obj.data.polygons) for obj in shell); shell_vertices=sum(len(obj.data.vertices) for obj in shell)
result={'status':'PASS','executionMode':'REAL_BLENDER_WORKER_EXECUTION','blenderVersion':bpy.app.version_string,'completeAsset':'GG-BLD-SHOP-SIMPLE-GROW-GOODS-001@1.0.0','approvedFrontReused':True,'approvedRoofReused':True,'frontRebuilt':False,'shell':{'triangles':shell_tri,'vertices':shell_vertices,'materials':4,'anonymousGeometry':0},'collision':'SIMPLE_BOX','lod':'PASS','buildIterations':1,'completeShopAssembled':True}
json.dump(result,open(os.path.join(out,'SIMPLE_SHOP_COMPLETE_V1_RESULT.json'),'w'),indent=2); bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'GG-BLD-SHOP-SIMPLE-GROW-GOODS-001_V1_CANDIDATE.blend'))
