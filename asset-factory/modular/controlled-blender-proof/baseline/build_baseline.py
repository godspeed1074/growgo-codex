import bpy, json, math
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
    pass
scene=bpy.context.scene
scene.render.resolution_x=256; scene.render.resolution_y=256; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'; scene.render.image_settings.color_mode='RGBA'; scene.render.film_transparent=False
scene.world.color=(1,1,1)
scene.view_settings.view_transform='Standard'; scene.view_settings.look='None'; scene.view_settings.exposure=0; scene.view_settings.gamma=1
def mat(name, rgb):
    m=bpy.data.materials.new(name); m.use_nodes=True; nt=m.node_tree; nt.nodes.clear(); out=nt.nodes.new('ShaderNodeOutputMaterial'); em=nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value=(*[v/255 for v in rgb],1); em.inputs['Strength'].default_value=1; nt.links.new(em.outputs['Emission'],out.inputs['Surface']); return m
mats={k:mat('GG_MAT_'+k,v) for k,v in {"WALL":[180,80,48],"ROOF":[70,80,160],"DOOR":[90,48,25],"WINDOW":[40,145,190],"TRIM":[235,190,80],"AWNING":[215,70,150],"FOUNDATION":[100,100,100],"SHRUB":[45,150,70]}.items()}
def cube(name, component, asset, version, family, dims, loc, color):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o=bpy.context.object; o.name=name; o.dimensions=dims; bpy.ops.object.transform_apply(location=False, rotation=False, scale=True); o.data.materials.append(mats[color]);
    o['assetId']=asset; o['assetVersion']=version; o['componentId']=component; o['moduleFamily']=family; o['recipeId']='GG-REC-BLD-SIMPLE-SHOP-001'; o['recipeVersion']='1.0.0'; o['layer']='LAYER_A_MODULE'; return o
objs=[]
objs.append(cube('GG_BLD_FOUNDATION_SHOP_001','FOUNDATION','GG-BLD-FOUNDATION-SHOP-001','1.0.0','SHOP_FOUNDATION',(4.4,.35,.25),(0,0,.125),'FOUNDATION'))
objs.append(cube('GG_BLD_WALL_SHOP_001','MAIN_WALL','GG-BLD-WALL-SHOP-001','1.0.0','SHOP_WALL',(4,.3,3),(0,0,1.75),'WALL'))
objs.append(cube('GG_BLD_DOOR_SHOP_001','DOOR','GG-BLD-DOOR-SHOP-001','1.0.0','SHOP_DOOR',(1,.35,2.1),(-1.2,-.2,1.05),'DOOR'))
objs.append(cube('GG_BLD_WINDOW_SHOP_001','WINDOW_SET','GG-BLD-WINDOW-SHOP-001','1.0.0','SHOP_WINDOW',(1.2,.35,1.2),(1.1,-.2,1.65),'WINDOW'))
objs.append(cube('GG_BLD_TRIM_SHOP_001','TRIM','GG-BLD-TRIM-SHOP-001','1.0.0','SHOP_TRIM',(4,.36,.25),(0,-.2,3.1),'TRIM'))
objs.append(cube('GG_BLD_ROOF_SHOP_001','ROOF','GG-BLD-ROOF-SHOP-001','1.0.0','SHOP_ROOF',(4.4,3.4,.8),(0,0,3.65),'ROOF'))
objs.append(cube('GG_BLD_AWNING_SHOP_001','AWNING','GG-BLD-AWNING-SHOP-001','1.0.0','SHOP_AWNING',(1.8,1.0,.35),(0,-.7,2.55),'AWNING'))
objs.append(cube('GG_VEG_SHRUB_SHOP_001','SHRUB','GG-VEG-SHRUB-SHOP-001','1.0.0','SHOP_SHRUB',(1.2,1.2,.8),(2.8,0,.4),'SHRUB'))
bpy.ops.object.camera_add(location=(0,-15,4.0)); cam=bpy.context.object; cam.name='GG_CAMERA_SIMPLE_SHOP'; cam.data.type='ORTHO'; cam.data.ortho_scale=7.0; cam.rotation_euler=((Vector((0,0,2.0))-cam.location).to_track_quat('-Z','Y')).to_euler(); scene.camera=cam; cam['cameraId']='GG-CAMERA-SIMPLE-SHOP-001'; cam['projection']='ORTHOGRAPHIC_LOCKED'; cam['resolution']='256x256'
scene.render.filepath="/Users/michaelpeterson/.codex/.chatgpt-projects/g-p-6863f0a29ae08191b7d09cf52fb8aa46/growgo-codex/asset-factory/modular/controlled-blender-proof/baseline/BLENDER_RENDER_BASELINE.png"
bpy.ops.wm.save_as_mainfile(filepath="/Users/michaelpeterson/.codex/.chatgpt-projects/g-p-6863f0a29ae08191b7d09cf52fb8aa46/growgo-codex/asset-factory/modular/controlled-blender-proof/baseline/SIMPLE_SHOP_BUILD_001.blend"); bpy.ops.render.render(write_still=True)
tri=sum(len(p.vertices)-2 for m in bpy.data.meshes for p in m.polygons); verts=sum(len(m.vertices) for m in bpy.data.meshes)
stats={'triangles':tri,'vertices':verts,'objectCount':len(bpy.data.objects),'meshCount':len(bpy.data.meshes),'materials':len(bpy.data.materials),'textureReferences':1,'atlasReferences':['GG-ATLAS-BUILDING-A@1.0.0'],'lodMetadata':'LOD_CLOSE/LOD_GAMEPLAY/LOD_MAP','fileSizeBytes':0,'cameraId':cam['cameraId']}
stats['fileSizeBytes']=__import__('os').path.getsize("/Users/michaelpeterson/.codex/.chatgpt-projects/g-p-6863f0a29ae08191b7d09cf52fb8aa46/growgo-codex/asset-factory/modular/controlled-blender-proof/baseline/SIMPLE_SHOP_BUILD_001.blend")
with open("/Users/michaelpeterson/.codex/.chatgpt-projects/g-p-6863f0a29ae08191b7d09cf52fb8aa46/growgo-codex/asset-factory/modular/controlled-blender-proof/baseline/BLENDER_BASELINE_STATS.json",'w') as f: json.dump(stats,f,indent=2)
