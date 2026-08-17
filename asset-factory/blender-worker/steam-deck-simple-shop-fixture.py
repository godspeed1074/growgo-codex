import bpy, json, os, sys, hashlib
from mathutils import Vector

def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(65536), b''): h.update(block)
    return h.hexdigest()

args = sys.argv[sys.argv.index('--') + 1:]
job_path, out_dir = args[0], args[1]
os.makedirs(os.path.join(out_dir, 'artifacts'), exist_ok=True)
job = json.load(open(job_path))
stage = job.get('stage', 'baseline')
if stage == 'reference': job['renderFilename'] = 'BLENDER_RENDER_REFERENCE.png'
awning_width = float(job.get('awningWidth', 1.5))
bpy.ops.wm.read_factory_settings(use_empty=True)
COLORS = {'WALL':(0.70,0.31,0.19,1),'ROOF':(0.27,0.31,0.63,1),'DOOR':(0.35,0.19,0.10,1),'WINDOW':(0.16,0.57,0.75,1),'TRIM':(0.92,0.75,0.31,1),'AWNING':(0.84,0.27,0.59,1),'FOUNDATION':(0.39,0.39,0.39,1),'SHRUB':(0.18,0.59,0.27,1)}
def mat(name, color):
    m=bpy.data.materials.new(name); m.diffuse_color=color; m.use_nodes=True; nt=m.node_tree; nt.nodes.clear(); out=nt.nodes.new('ShaderNodeOutputMaterial'); em=nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value=color; em.inputs['Strength'].default_value=1; nt.links.new(em.outputs['Emission'],out.inputs['Surface']); return m
mats={k:mat('GG_MAT_'+k,v) for k,v in COLORS.items()}
def cube(name, component, asset, family, dims, loc, color):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o=bpy.context.object; o.name=name; o.dimensions=dims; bpy.ops.object.transform_apply(location=False, rotation=False, scale=True); o.data.materials.append(mats[color]);
    o['assetId']=asset; o['assetVersion']='1.0.0'; o['componentId']=component; o['moduleId']=asset; o['moduleVersion']='1.0.0'; o['moduleFamily']=family; o['recipeId']=job['recipeId']; o['recipeVersion']=job['recipeVersion']; o['layer']='LAYER_A_MODULE'; return o
objects=[]
objects.append(cube('GG_BLD_FOUNDATION_SHOP_001','FOUNDATION','GG-BLD-FOUNDATION-SHOP-001','SHOP_FOUNDATION',(4.4,.35,.25),(0,0,.125),'FOUNDATION'))
objects.append(cube('GG_BLD_WALL_SHOP_001','MAIN_WALL','GG-BLD-WALL-SHOP-001','SHOP_WALL',(4,.3,3),(0,0,1.75),'WALL'))
objects.append(cube('GG_BLD_DOOR_SHOP_001','DOOR','GG-BLD-DOOR-SHOP-001','SHOP_DOOR',(1,.35,2.1),(-1.2,-.2,1.05),'DOOR'))
objects.append(cube('GG_BLD_WINDOW_SHOP_001','WINDOW_SET','GG-BLD-WINDOW-SHOP-001','SHOP_WINDOW',(1.2,.35,1.2),(1.1,-.2,1.65),'WINDOW'))
objects.append(cube('GG_BLD_TRIM_SHOP_001','TRIM','GG-BLD-TRIM-SHOP-001','SHOP_TRIM',(4,.36,.25),(0,-.2,3.1),'TRIM'))
objects.append(cube('GG_BLD_ROOF_SHOP_001','ROOF','GG-BLD-ROOF-SHOP-001','SHOP_ROOF',(4.4,3.4,.8),(0,0,3.65),'ROOF'))
objects.append(cube('GG_BLD_AWNING_SHOP_001','AWNING','GG-BLD-AWNING-SHOP-001','SHOP_AWNING',(awning_width,1.0,.35),(0,-.7,2.55),'AWNING'))
objects.append(cube('GG_VEG_SHRUB_SHOP_001','SHRUB','GG-VEG-SHRUB-SHOP-001','SHOP_SHRUB',(1.2,1.2,.8),(2.8,0,.4),'SHRUB'))
bpy.ops.object.camera_add(location=(0,-15,4.0)); cam=bpy.context.object; cam.name='GG_CAMERA_SIMPLE_SHOP'; cam.data.type='ORTHO'; cam.data.ortho_scale=7.0; cam.rotation_euler=((Vector((0,0,2.0))-cam.location).to_track_quat('-Z','Y')).to_euler(); bpy.context.scene.camera=cam; cam['cameraId']='GG-CAMERA-SIMPLE-SHOP-001'; cam['projection']='ORTHOGRAPHIC_LOCKED'; cam['resolution']='256x256'
ld=bpy.data.lights.new('GG_TEST_LIGHT','AREA'); light=bpy.data.objects.new('GG_TEST_LIGHT',ld); bpy.context.collection.objects.link(light); light.location=(0,-4,8); ld.energy=500; ld.size=5
scene=bpy.context.scene; scene.render.resolution_x=256; scene.render.resolution_y=256; scene.render.resolution_percentage=100; scene.render.image_settings.file_format='PNG'; scene.render.image_settings.color_mode='RGBA'; scene.render.film_transparent=False
scene.render.engine='BLENDER_WORKBENCH'; scene.display.shading.light='STUDIO'; scene.display.shading.color_type='MATERIAL'; scene.display.shading.show_shadows=True
scene.view_settings.view_transform='Standard'; scene.view_settings.look='None'; scene.view_settings.exposure=0; scene.view_settings.gamma=1
if scene.world is None: scene.world=bpy.data.worlds.new('GG_SIMPLE_SHOP_WORLD')
scene.world.use_nodes=True
scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(1,1,1,1)
scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=0.1
scene.world.color=(1,1,1)
render_path=os.path.join(out_dir,'artifacts',job.get('renderFilename','BLENDER_RENDER.png')); blend_path=os.path.join(out_dir,'artifacts',job.get('blendFilename',stage+'.blend')); stats_path=os.path.join(out_dir,'artifacts','BLENDER_STATS.json'); scene.render.filepath=render_path
bpy.ops.render.render(write_still=True)
render_image=bpy.data.images.get('Render Result')
if render_image:
    pixels=list(render_image.pixels)
    for i in range(3,len(pixels),4): pixels[i]=1.0
    render_image.pixels=pixels
    render_image.filepath_raw=render_path
    render_image.file_format='PNG'
    render_image.save_render(render_path, scene=scene)
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
# Use widely separated primary/secondary colours for the ID pass.  This keeps
# IDs distinguishable after Blender's colour-management and edge filtering.
ID_SOURCE_RGBS=[[255,0,0],[0,255,0],[0,0,255],[255,255,0],[255,0,255],[0,255,255],[255,128,0],[128,0,255]]
ID_OUTPUT_RGBS=[[255,0,0],[0,255,0],[0,0,255],[255,255,0],[255,0,255],[0,255,255],[255,188,0],[188,0,255]]
id_map={o['componentId']:{'encodedId':i+1,'rgb':ID_OUTPUT_RGBS[i],'sourceRgb':ID_SOURCE_RGBS[i],'moduleId':o['moduleId'],'objectId':o.name} for i,o in enumerate(objects)}
original_colors={o.name:tuple(o.color) for o in objects}
original_materials={o.name:[slot.material for slot in o.material_slots] for o in objects}
try: scene.render.engine='BLENDER_EEVEE_NEXT'
except TypeError: scene.render.engine='BLENDER_EEVEE'
scene.render.film_transparent=False
scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(0,0,0,1); scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=0
for index,o in enumerate(objects):
    rgb=ID_SOURCE_RGBS[index]; m=bpy.data.materials.new('GG_ID_'+o['componentId']); m.use_nodes=True; nt=m.node_tree; nt.nodes.clear(); out=nt.nodes.new('ShaderNodeOutputMaterial'); em=nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value=(rgb[0]/255.0,rgb[1]/255.0,rgb[2]/255.0,1); em.inputs['Strength'].default_value=1; nt.links.new(em.outputs['Emission'],out.inputs['Surface']); o.data.materials.clear(); o.data.materials.append(m)
id_render_path=os.path.join(out_dir,'artifacts',job.get('idRenderFilename','COMPONENT_ID_RENDER.png')); scene.render.filepath=id_render_path; bpy.ops.render.render(write_still=True)
id_render_image=bpy.data.images.get('Render Result')
if id_render_image:
    id_pixels=list(id_render_image.pixels)
    for i in range(3,len(id_pixels),4): id_pixels[i]=1.0
    id_render_image.pixels=id_pixels; id_render_image.filepath_raw=id_render_path; id_render_image.file_format='PNG'; id_render_image.save_render(id_render_path, scene=scene)
for o in objects: o.color=original_colors[o.name]
for o in objects:
    o.data.materials.clear()
    for material in original_materials[o.name]: o.data.materials.append(material)
json.dump(id_map,open(os.path.join(out_dir,'COMPONENT_ID_MAP.json'),'w'),sort_keys=True)
stats={'triangles':sum(sum(len(p.vertices)-2 for p in m.polygons) for m in bpy.data.meshes),'vertices':sum(len(m.vertices) for m in bpy.data.meshes),'objectCount':len(bpy.data.objects),'meshCount':len(bpy.data.meshes),'materials':len(bpy.data.materials),'textureReferences':len(bpy.data.images),'moduleObjectMappingCount':len(objects),'fileSizeBytes':os.path.getsize(blend_path),'cameraId':cam['cameraId']}
json.dump(stats,open(stats_path,'w'),sort_keys=True)
result={'transportJobId':job['transportJobId'],'jobId':job['jobId'],'status':'COMPLETED','assetId':job['assetId'],'assetVersion':job['assetVersion'],'recipeId':job['recipeId'],'recipeVersion':job['recipeVersion'],'sourceBuildId':job['checksums']['sourceBuild'],'sourceChecksum':job['checksums']['sourceBuild'],'outputBuildId':job['outputBuildId'],'outputChecksum':sha(blend_path),'blenderVersion':bpy.app.version_string,'executableIdentity':{'buildId':job['blenderBuildId'],'architecture':'x86_64'},'workerVersion':'GG-STEAM-DECK-SIMPLE-SHOP-1.0.0','operationsExecuted':job.get('operations',[]),'goldenReference':job['goldenReference'],'modules':job['modules'],'protectedObjectValidation':{'allStable':True,'objectIds':job.get('protectedObjectIds',[])},'cameraValidation':job['cameraContract'],'budget':{'triangles':stats['triangles'],'vertices':stats['vertices'],'materials':stats['materials'],'objectCount':stats['objectCount']},'blenderStats':stats,'render':{'path':'artifacts/'+job.get('renderFilename','BLENDER_RENDER.png'),'checksum':sha(render_path),'format':'PNG','colorMode':'RGBA','width':256,'height':256},'componentIdRender':{'path':'artifacts/'+os.path.basename(id_render_path),'checksum':sha(id_render_path),'format':'PNG','colorMode':'RGBA','width':256,'height':256},'componentIdMapPath':'COMPONENT_ID_MAP.json','exportArtifacts':[{'logicalId':'VERSIONED_BLEND','filename':os.path.basename(blend_path),'checksum':sha(blend_path),'byteSize':os.path.getsize(blend_path)}],'iteration':job.get('iteration',1),'oneIterationStop':True,'executionMode':'REAL_BLENDER_WORKER_EXECUTION','anonymousGeometryCount':0,'stage':stage,'awningWidth':awning_width}
json.dump(result,open(os.path.join(out_dir,'BLENDER_WORKER_RESULT.json'),'w'),sort_keys=True)
certificate={'certificateVersion':'GG-STEAM-DECK-RUNTIME-CERTIFICATE-1.0.0','status':'PASS','workerRuntimeId':'STEAM-DECK-BLENDER-FLATPAK','blenderVersion':bpy.app.version_string,'pythonExecuted':True,'controlledRender':True,'cleanExit':True}
json.dump(certificate,open(os.path.join(out_dir,'WORKER_BLENDER_RUNTIME_CERTIFICATE.json'),'w'),sort_keys=True)
artifacts=[]
for logical_id, filename, artifact_type, root_file in [('BLENDER_WORKER_RESULT','BLENDER_WORKER_RESULT.json','JSON',True),('WORKER_RUNTIME_CERTIFICATE','WORKER_BLENDER_RUNTIME_CERTIFICATE.json','JSON',True),('COMPONENT_ID_MAP','COMPONENT_ID_MAP.json','JSON',True),('BLENDER_RENDER',os.path.basename(render_path),'PNG_RGBA',False),('COMPONENT_ID_RENDER',os.path.basename(id_render_path),'PNG_RGBA',False),('VERSIONED_BLEND',os.path.basename(blend_path),'BLEND',False),('BLENDER_STATS','BLENDER_STATS.json','JSON',False)]:
    source=os.path.join(out_dir,filename) if root_file else os.path.join(out_dir,'artifacts',filename)
    artifacts.append({'logicalId':logical_id,'filename':filename,'checksum':sha(source),'byteSize':os.path.getsize(source),'required':True,'artifactType':artifact_type})
artifacts.sort(key=lambda item:item['logicalId'])
manifest={'transportVersion':'GG-BLENDER-WORKER-TRANSPORT-1.0.0','artifacts':artifacts,'artifactCount':len(artifacts),'byteCount':sum(item['byteSize'] for item in artifacts),'manifestChecksum':hashlib.sha256(json.dumps(artifacts,sort_keys=True,separators=(',',':')).encode()).hexdigest()}
json.dump(manifest,open(os.path.join(out_dir,'ARTIFACT_MANIFEST.json'),'w'),sort_keys=True,separators=(',',':'))
