import bpy, json, math, os, sys
from mathutils import Vector

pkg=json.load(open(sys.argv[-2])); root=sys.argv[-1]; os.makedirs(root,exist_ok=True)
def clear(): bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False); [bpy.data.materials.remove(m) for m in list(bpy.data.materials)]
def mat(n,c):
 m=bpy.data.materials.new(n); m.diffuse_color=(*c,1); m.use_nodes=True; bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*c,1); bs.inputs['Roughness'].default_value=.82; return m
def cube(n,loc,scale,ma):
 bpy.ops.mesh.primitive_cube_add(location=loc); o=bpy.context.object; o.name=n; o.scale=scale; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(ma); return o
def blade(n,a,r,w,h,d,ma):
 # shallow triangular papercut blade, front plane faces -Y
 x=r*math.cos(a); z=.04; verts=[(x-w/2,-d/2,z),(x+w/2,-d/2,z),(x,-d/2,z+h),(x-w/2,d/2,z),(x+w/2,d/2,z),(x,d/2,z+h)]
 faces=[(0,1,2),(3,5,4),(0,3,4,1),(1,4,5,2),(2,5,3,0)]
 me=bpy.data.meshes.new(n+'_MESH'); me.from_pydata(verts,[],faces); o=bpy.data.objects.new(n,me); bpy.context.collection.objects.link(o); o.data.materials.append(ma); return o
def leaf(n,a,r,w,h,d,ma,roundish=False):
 x=r*math.cos(a); y=r*.45*math.sin(a); bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=4, location=(x,y,.08+h*.32)); o=bpy.context.object; o.name=n; o.scale=(w/2,d/2,h/2); bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(ma); return o
def setup_camera(w,h):
 bpy.ops.object.camera_add(location=(0,-6,1.2), rotation=(math.radians(82),0,0)); c=bpy.context.object; c.name='GG_REVIEW_CAMERA'; bpy.context.scene.camera=c; c.data.type='ORTHO'; c.data.ortho_scale=max(w,h)*1.6
 bpy.ops.object.light_add(type='AREA', location=(-3,-4,5)); bpy.context.object.data.energy=850; bpy.context.object.data.shape='DISK'; bpy.context.object.data.size=5
 bpy.ops.object.light_add(type='AREA', location=(3,1,3)); bpy.context.object.data.energy=350; bpy.context.object.data.size=4
 sc=bpy.context.scene
 # Blender 5.2 exposes BLENDER_EEVEE; older supported builds may expose BLENDER_EEVEE_NEXT.
 for engine in ('BLENDER_EEVEE','BLENDER_EEVEE_NEXT'):
  try: sc.render.engine=engine; break
  except TypeError: continue
 else: raise RuntimeError('GROWGO_EEVEE_ENGINE_UNAVAILABLE')
 sc.render.resolution_x=512; sc.render.resolution_y=512; sc.render.resolution_percentage=100; sc.render.image_settings.file_format='PNG'; sc.render.image_settings.color_mode='RGBA'; sc.world.color=(.055,.07,.055)
def render(out,name,rot):
 c=bpy.context.scene.camera; c.rotation_euler=(math.radians(82),rot,0); bpy.context.scene.render.filepath=os.path.join(out,name+'.png'); bpy.ops.render.render(write_still=True)
def stats():
 ms=[o for o in bpy.context.scene.objects if o.type=='MESH']; return {'triangles':sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in ms),'vertices':sum(len(o.data.vertices) for o in ms),'materials':len(bpy.data.materials),'objects':len(ms)}
for t in pkg['targets']:
 out=os.path.join(root,t['assetId']+'@1.0.0'); os.makedirs(out,exist_ok=True); clear(); fol=mat('GG_MAT_COASTAL_FOLIAGE_ATLAS',(0.20,.38,.09)); acc=mat('GG_MAT_COASTAL_ACCENT_ATLAS',(.83,.62,.14) if t['kind']!='creeping' else (.48,.26,.58)); cube('GG_VEG_MOD_BASE_001',(0,0,.03),(t['width']*.36,t['depth']*.30,.03),fol)
 for lod,ratio in [('LOD_CLOSE',1),('LOD_GAMEPLAY',.62),('LOD_MAP',.36)]:
  # build each LOD in fresh scene, export real GLB; review is retained from close
  if lod!='LOD_CLOSE': clear(); fol=mat('GG_MAT_COASTAL_FOLIAGE_ATLAS',(0.20,.38,.09)); acc=mat('GG_MAT_COASTAL_ACCENT_ATLAS',(.83,.62,.14) if t['kind']!='creeping' else (.48,.26,.58)); cube('GG_VEG_MOD_BASE_001',(0,0,.03),(t['width']*.36,t['depth']*.30,.03),fol)
  count=max(4,int(t['groups']*ratio));
  for i in range(count):
   a=2*math.pi*i/count + (i%3-.8)*.12; r=t['width']*(.12+.22*(i%4)/3); w=t['width']*(.10 if t['kind'] in ['creeping','succulent'] else .075); hh=t['height']*(.52+.42*((i*7)%11)/10); d=t['depth']*.10
   if t['kind'] in ['creeping','succulent']: leaf('GG_VEG_MODULE_'+str(i+1),a,r,w,hh,d,fol,True)
   else: blade('GG_VEG_MODULE_'+str(i+1),a,r,w,hh,d,fol)
  for i in range(max(0,int(t['accents']*ratio))):
   a=2*math.pi*i/max(1,t['accents']); r=t['width']*.23; bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=4, location=(r*math.cos(a),r*.3*math.sin(a),t['height']*(.64+.18*(i%2)))); o=bpy.context.object; o.name='GG_VEG_ACCENT_'+str(i+1); o.scale=(.055,.035,.055); bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(acc)
  bpy.ops.object.select_all(action='SELECT'); bpy.ops.export_scene.gltf(filepath=os.path.join(out,t['assetId']+'_'+lod+'.glb'), export_format='GLB', use_selection=True); open(os.path.join(out,t['assetId']+'_'+lod+'_STATS.json'),'w').write(json.dumps(stats(),indent=2))
  if lod=='LOD_CLOSE':
   setup_camera(t['width'],t['height']); bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,t['assetId']+'.blend')); render(out,'ASSET_REVIEW_FRONT',0); render(out,'ASSET_REVIEW_BACK',math.pi); render(out,'ASSET_REVIEW_LEFT',math.pi/2); render(out,'ASSET_REVIEW_RIGHT',-math.pi/2); render(out,'ASSET_REVIEW_GAMEPLAY',math.radians(-18))
 open(os.path.join(out,'BUILD_METADATA.json'),'w').write(json.dumps({'assetId':t['assetId'],'version':'1.0.0','source':'REAL_STEAM_DECK_BLENDER_5.2.0','treeExclusion':True,'reviewState':'REVIEW_CANDIDATE'},indent=2))
print('GROWGO_COASTAL_GROUND_COVER_WORKER_COMPLETE')
