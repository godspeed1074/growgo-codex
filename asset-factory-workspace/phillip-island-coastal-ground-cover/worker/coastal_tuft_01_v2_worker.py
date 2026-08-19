import bpy, json, math, os, sys
from mathutils import Vector

pkg=json.load(open(sys.argv[-2])); root=sys.argv[-1]; os.makedirs(root,exist_ok=True)
OUT=os.path.join(root,pkg['assetId']+'@'+pkg['version']); os.makedirs(OUT,exist_ok=True)
MAP_FLAT=False

def clear():
 bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
 for material in list(bpy.data.materials): bpy.data.materials.remove(material)
def material(name, colour):
 m=bpy.data.materials.new(name); m.use_nodes=True; shader=m.node_tree.nodes.get('Principled BSDF')
 shader.inputs['Base Color'].default_value=(*colour,1); shader.inputs['Roughness'].default_value=.88
 return m
def card(name, points, front_y, thickness, material):
 # A visible leaf is an intentionally shaped, shallow papercut silhouette — never a primitive spike.
 front=[(x,front_y,z) for x,z in points]; back=[(x,front_y+thickness,z) for x,z in points]; n=len(points)
 faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
 # Sidewalls never contribute to the primary front silhouette. Omit them for seed cards and map LOD cards.
 if not (MAP_FLAT or '_SEED_' in name): faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 mesh=bpy.data.meshes.new(name+'_MESH'); mesh.from_pydata(front+back,[],faces); mesh.materials.append(material)
 obj=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(obj); return obj
def blade(name, base, height, lean, width, bend, y, material):
 bx,bz=base; dx=math.sin(lean); dz=math.cos(lean); px=dz; pz=-dx
 c1=(bx+dx*height*.34+bend*.25,bz+dz*height*.34); c2=(bx+dx*height*.70+bend,bz+dz*height*.70); tip=(bx+dx*height+bend,bz+dz*height)
 points=[(bx-px*width*.42,bz-pz*width*.42),(c1[0]-px*width*.58,c1[1]-pz*width*.58),(c2[0]-px*width*.34,c2[1]-pz*width*.34),tip,(c2[0]+px*width*.34,c2[1]+pz*width*.34),(c1[0]+px*width*.58,c1[1]+pz*width*.58),(bx+px*width*.42,bz+pz*width*.42)]
 return card(name,points,y,.018,material)
def seed_head(name,x,z,y,gold):
 # Three tapered cutouts make the stacked wheat-like golden seed silhouette in the reference.
 for part,(offset,width,height) in enumerate([(0,.045,.075),(.047,.037,.067),(.087,.028,.052)]):
  blade(name+'_SEED_'+str(part+1),(x,z+offset),height,.04,width,.004,y-.008,gold)
def scene_setup():
 scene=bpy.context.scene
 for engine in ('BLENDER_EEVEE','BLENDER_EEVEE_NEXT'):
  try: scene.render.engine=engine; break
  except TypeError: continue
 else: raise RuntimeError('GROWGO_EEVEE_ENGINE_UNAVAILABLE')
 scene.render.resolution_x=720; scene.render.resolution_y=720; scene.render.resolution_percentage=100
 scene.render.image_settings.file_format='PNG'; scene.render.image_settings.color_mode='RGBA'
 scene.world.use_nodes=True; scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(0.88,0.855,0.78,1); scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.55
 scene.view_settings.look='AgX - Medium High Contrast'
 bpy.ops.object.light_add(type='AREA', location=(-3,-4,5)); bpy.context.object.data.energy=650; bpy.context.object.data.shape='DISK'; bpy.context.object.data.size=5
 bpy.ops.object.light_add(type='AREA', location=(3,-2,3)); bpy.context.object.data.energy=260; bpy.context.object.data.size=4
def camera_at(angle=0, gameplay=False):
 radius=5.0; target=Vector((0,0,.38)); position=Vector((math.sin(angle)*radius,-math.cos(angle)*radius,.46 if gameplay else .42))
 bpy.ops.object.camera_add(location=position); camera=bpy.context.object; camera.name='GG_REVIEW_CAMERA'; camera.data.type='ORTHO'; camera.data.ortho_scale=1.25 if not gameplay else 1.38
 camera.data.lens=58; camera.rotation_euler=(target-position).to_track_quat('-Z','Y').to_euler(); bpy.context.scene.camera=camera; return camera
def stats():
 meshes=[obj for obj in bpy.context.scene.objects if obj.type=='MESH']
 return {'triangles':sum(sum(max(0,len(poly.vertices)-2) for poly in obj.data.polygons) for obj in meshes),'vertices':sum(len(obj.data.vertices) for obj in meshes),'materials':len(bpy.data.materials),'objects':len(meshes)}
def render(name, angle=0, gameplay=False):
 camera=camera_at(angle,gameplay); bpy.context.scene.render.filepath=os.path.join(OUT,name+'.png'); bpy.ops.render.render(write_still=True); bpy.data.objects.remove(camera,do_unlink=True)
def build(detail):
 global MAP_FLAT
 MAP_FLAT=detail<=4
 clear()
 dark=material('GG_MAT_COASTAL_FOLIAGE_DARK_ATLAS',(0.12,.27,.065)); mid=material('GG_MAT_COASTAL_FOLIAGE_MID_ATLAS',(.31,.50,.11)); light=material('GG_MAT_COASTAL_FOLIAGE_LIGHT_ATLAS',(.70,.70,.22)); gold=material('GG_MAT_COASTAL_SEED_GOLD_ATLAS',(.82,.63,.22))
 # rear crown: uneven heights, bends, and colour mass, not a repeated row of blades
 rear=[(-.22,.61,-.23,.072,-.035),(-.08,.70,-.08,.070,.02),(.07,.64,.18,.067,.035),(.20,.55,.28,.070,.02),(-.34,.48,-.43,.066,-.025),(.32,.44,.48,.065,.025)]
 middle=[(-.42,.33,-.67,.105,-.08),(-.29,.48,-.38,.094,-.05),(-.17,.45,-.20,.10,.025),(-.02,.54,.03,.09,-.018),(.14,.50,.26,.098,.045),(.28,.42,.48,.10,.06),(.41,.30,.71,.10,.08),(-.10,.35,-.1,.115,.02),(.09,.34,.09,.12,-.015)]
 front=[(-.36,.15,-.72,.115,-.07),(-.27,.23,-.50,.122,-.05),(-.15,.31,-.27,.13,.02),(.0,.28,.02,.138,-.01),(.15,.31,.27,.128,.04),(.28,.23,.50,.122,.07),(.37,.15,.72,.115,.09)]
 highlights=[(-.27,.44,-.20,.068,-.02),(-.11,.52,-.06,.065,.01),(.06,.47,.17,.07,.03),(.20,.36,.42,.073,.04),(.34,.27,.66,.07,.06)]
 def emit(entries,mat,y,prefix):
  for index,(x,h,lean,width,bend) in enumerate(entries[:detail]): blade(prefix+str(index+1),(x,.035),h,lean,width,bend,y,mat)
 emit(rear,dark,.12,'GG_VEG_V2_REAR_BLADE_')
 emit(middle,mid,.045,'GG_VEG_V2_MID_BLADE_')
 emit(front,mid,-.075,'GG_VEG_V2_FRONT_LEAF_')
 emit(highlights,light,-.105,'GG_VEG_V2_HIGHLIGHT_BLADE_')
 if detail>=8:
  for index,(x,z) in enumerate([(-.18,.49),(.03,.56),(.18,.47),(-.31,.39)]):
   blade('GG_VEG_V2_SEED_STEM_'+str(index+1),(x,.06),z-.06,.03,.014,.002,.075,mid); seed_head('GG_VEG_V2_SEED_HEAD_'+str(index+1),x,z,.07,gold)
def export_lod(label, detail):
 build(detail); bpy.ops.object.select_all(action='SELECT'); bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,pkg['assetId']+'_LOD_'+label+'.glb'),export_format='GLB',use_selection=True)
 with open(os.path.join(OUT,pkg['assetId']+'_LOD_'+label+'_STATS.json'),'w') as file: json.dump(stats(),file,indent=2)

export_lod('CLOSE',99)
scene_setup(); bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,pkg['assetId']+'.blend'))
render('ASSET_REVIEW_FRONT'); render('ASSET_REVIEW_BACK',math.pi); render('ASSET_REVIEW_LEFT',math.pi/2); render('ASSET_REVIEW_RIGHT',-math.pi/2); render('ASSET_REVIEW_GAMEPLAY',math.radians(-18),True)
export_lod('GAMEPLAY',7); export_lod('MAP',4)
with open(os.path.join(OUT,'BUILD_METADATA.json'),'w') as file: json.dump({'assetId':pkg['assetId'],'version':pkg['version'],'source':'REAL_STEAM_DECK_BLENDER_5.2.0','method':pkg['method'],'sourceV1':pkg['sourceV1'],'treeExclusion':True,'reviewState':'REVIEW_CANDIDATE'},file,indent=2)
print('GROWGO_COASTAL_TUFT_01_V2_WORKER_COMPLETE')
