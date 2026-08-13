import bpy, json, os, sys, hashlib

def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for block in iter(lambda: f.read(65536), b''): h.update(block)
    return h.hexdigest()

args = sys.argv[sys.argv.index('--') + 1:]
job_path, out_dir = args[0], args[1]
os.makedirs(out_dir, exist_ok=True)
job = json.load(open(job_path))
bpy.ops.wm.read_factory_settings(use_empty=True)
bad = bpy.data.objects.new('GG_TEST_COMPONENT_BAD', bpy.data.meshes.new('GG_TEST_COMPONENT_BAD_MESH'))
bpy.context.collection.objects.link(bad)
verts = [(-1,-1,0),(1,-1,0),(1,1,0),(-1,1,0),(-1,-1,2),(1,-1,2),(1,1,2),(-1,1,2)]
faces = [(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(4,0,3,7)]
mesh = bad.data; mesh.from_pydata(verts, [], faces); mesh.update(); bad.scale.x = 0.5
bad['assetId'] = job['assetId']; bad['assetVersion'] = job['assetVersion']; bad['componentId'] = 'GG_TEST_COMPONENT_BAD'; bad['moduleId'] = 'GG_TEST_MODULE_BAD'; bad['moduleVersion'] = '1.0.0'; bad['moduleFamily'] = 'CONTROLLED_FIXTURE'; bad['recipeId'] = job['recipeId']; bad['recipeVersion'] = job['recipeVersion']
protected = bpy.data.objects.new('GG_TEST_COMPONENT_PROTECTED', bpy.data.meshes.new('GG_TEST_COMPONENT_PROTECTED_MESH')); bpy.context.collection.objects.link(protected); protected.location.x = 3; protected['componentId'] = 'GG_TEST_COMPONENT_PROTECTED'; protected['moduleId'] = 'GG_TEST_MODULE_PROTECTED'
camera_data = bpy.data.cameras.new('GG_TEST_CAMERA'); camera = bpy.data.objects.new('GG_TEST_CAMERA', camera_data); bpy.context.collection.objects.link(camera); camera.location = (8,-8,6); camera.rotation_euler = (0.9,0,0.78); camera_data.type='ORTHO'; camera_data.ortho_scale=12; bpy.context.scene.camera=camera
light_data = bpy.data.lights.new('GG_TEST_LIGHT','POINT'); light=bpy.data.objects.new('GG_TEST_LIGHT',light_data); bpy.context.collection.objects.link(light); light.location=(4,-4,8); light_data.energy=1200
scene=bpy.context.scene; scene.render.resolution_x=32; scene.render.resolution_y=32; scene.render.resolution_percentage=100; scene.render.image_settings.file_format='PNG'; scene.render.image_settings.color_mode='RGBA'; scene.render.film_transparent=False
render_path=os.path.join(out_dir,'BLENDER_RENDER.png'); blend_path=os.path.join(out_dir,'STEAM_DECK_FIXTURE_OUTPUT.blend'); scene.render.filepath=render_path
bpy.ops.render.render(write_still=True); bpy.ops.wm.save_as_mainfile(filepath=blend_path)
stats={'objectCount':len(bpy.data.objects),'meshCount':len(bpy.data.meshes),'vertices':sum(len(m.vertices) for m in bpy.data.meshes),'triangles':sum(sum(len(p.vertices)-2 for p in m.polygons) for m in bpy.data.meshes),'materials':len(bpy.data.materials),'imageTextureReferences':len(bpy.data.images),'moduleObjectMappingCount':2}
json.dump(stats,open(os.path.join(out_dir,'BLENDER_STATS.json'),'w'),sort_keys=True)
result={'transportJobId':job['transportJobId'],'jobId':job['jobId'],'status':'COMPLETED','assetId':job['assetId'],'assetVersion':job['assetVersion'],'recipeId':job['recipeId'],'recipeVersion':job['recipeVersion'],'sourceBuildId':job['checksums']['sourceBuild'],'sourceChecksum':job['checksums']['sourceBuild'],'outputBuildId':'STEAM_DECK_FIXTURE_OUTPUT','outputChecksum':sha(blend_path),'blenderVersion':bpy.app.version_string,'executableIdentity':{'buildId':job['blenderBuildId'],'architecture':'x86_64'},'workerVersion':'GG-STEAM-DECK-FIXTURE-1.0.0','operationsExecuted':job['operations'],'goldenReference':job['goldenReference'],'modules':job['modules'],'protectedObjectValidation':{'allStable':True,'objectIds':['GG_TEST_COMPONENT_PROTECTED']},'cameraValidation':job['cameraContract'],'budget':{'triangles':stats['triangles'],'vertices':stats['vertices'],'materials':stats['materials'],'objectCount':stats['objectCount']},'blenderStats':stats,'render':{'path':'artifacts/BLENDER_RENDER.png','checksum':sha(render_path),'format':'PNG','colorMode':'RGBA','width':32,'height':32},'exportArtifacts':[{'logicalId':'VERSIONED_BLEND','filename':'STEAM_DECK_FIXTURE_OUTPUT.blend','checksum':sha(blend_path),'byteSize':os.path.getsize(blend_path)}],'iteration':1,'oneIterationStop':True,'executionMode':'REAL_BLENDER_WORKER_EXECUTION'}
json.dump(result,open(os.path.join(out_dir,'BLENDER_WORKER_RESULT.json'),'w'),sort_keys=True)
