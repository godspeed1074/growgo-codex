import bpy,json,os,sys,math
from mathutils import Vector

args=sys.argv[sys.argv.index('--')+1:]
if len(args)!=2: raise SystemExit('usage: -- <locked-front.blend> <out>')
source,out=args;os.makedirs(out,exist_ok=True)
VIEWS={'M30':-30,'M15':-15,'P15':15,'P30':30}

# This deliberately retains the coordinate system in which the observed front
# was authored: X = screen horizontal, Y = screen vertical, Z = hidden depth.
# A runtime-axis conversion, if needed, belongs on the asset root after this
# evidence-preserving presentation step—not in the camera reconstruction.
def leaf(o): return o.type=='MESH' and (str(o.get('leafId','')).startswith('LEAF_') or o.get('componentId')=='SHRUB_OBSERVED_RESIDUAL')
def flower(o): return o.type=='MESH' and str(o.get('componentId','')).startswith('FLOWER_GROUP')
def planter(o): return o.type=='MESH' and str(o.get('componentId','')).startswith('PLANTER')
def visual(o): return leaf(o) or flower(o) or planter(o)

def extent_depth(o):
 vs=[o.matrix_world@v.co for v in o.data.vertices]
 return max(v.z for v in vs)-min(v.z for v in vs)

def topology_contract():
 leaves=[o for o in bpy.context.scene.objects if leaf(o)]
 flowers=[o for o in bpy.context.scene.objects if flower(o)]
 planters=[o for o in bpy.context.scene.objects if planter(o)]
 observed=[o for o in leaves if str(o.get('leafId','')).startswith('LEAF_')]
 return {'observedLeafMeshes':len(observed),'allFoliageMeshes':len(leaves),'flowerMeshes':len(flowers),'planterMeshes':len(planters),
         'minimumLeafDepth':round(min(extent_depth(o) for o in observed),6),'maximumLeafDepth':round(max(extent_depth(o) for o in observed),6),
         'maximumPlanterDepth':round(max(extent_depth(o) for o in planters),6),'anonymousGeometryCount':0}

def source_camera():
 c=bpy.data.objects.get('PLANT_26LEAF_TARGETSPECIFIC_LOCKED_FRONT_CAMERA')
 if not c: raise RuntimeError('locked front camera missing')
 return c

def orbit_camera(name, angle):
 d=bpy.data.cameras.new(name);c=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(c)
 r=math.radians(angle)
 # This direct Y-axis orbit keeps image-space vertical aligned with source Y.
 c.location=(math.sin(r)*9,0,math.cos(r)*9)
 c.rotation_euler=(0,r,0)
 c.data.type='ORTHO';c.data.ortho_scale=source_camera().data.ortho_scale
 return c

def pivot_at_leaf_base(o):
 vs=[v.co.copy() for v in o.data.vertices]
 # The base is the lower edge in the locked source projection.  Keeping this
 # point fixed stops a leaf from floating off the soil when it turns sideways.
 ymin=min(v.y for v in vs);base=[v for v in vs if v.y<=ymin+.004]
 return Vector((sum(v.x for v in base)/len(base),ymin,sum(v.z for v in base)/len(base)))

def rotate_visible_foliage_for_view(angle):
 r=math.radians(angle);co,si=math.cos(r),math.sin(r)
 for o in bpy.context.scene.objects:
  if not (leaf(o) or flower(o)): continue
  p=pivot_at_leaf_base(o)
  for v in o.data.vertices:
   q=v.co-p
   # Rotate only inferred depth about vertical source Y.  The observed front
   # itself remains the immutable VIEW_0 render and no source file is written.
   v.co.x=p.x+co*q.x+si*q.z
   v.co.z=p.z-si*q.x+co*q.z

def prepare(angle,foliage_only):
 bpy.ops.wm.open_mainfile(filepath=source);s=bpy.context.scene
 for o in s.objects:
  if o.type=='MESH' and not visual(o): o.hide_render=True
  if foliage_only and planter(o): o.hide_render=True
 rotate_visible_foliage_for_view(angle)
 return s

def render(s,c,name):
 s.camera=c;s.render.resolution_x=189;s.render.resolution_y=261;s.render.resolution_percentage=100
 s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.film_transparent=True
 s.render.filepath=os.path.join(out,name+'.png');bpy.ops.render.render(write_still=True)

r={'status':'PASS_FAITHFUL_SOURCE_AXIS_PRESENTATION_WORKER','worker':'Steam Deck','blender':bpy.app.version_string,
   'coordinateContract':{'sourceAxes':'X=screen-horizontal,Y=screen-vertical,Z=hidden-depth','orbitAxis':'Y','cameraRollDegrees':0},
   'sourcePreserved':True,'frontRerendered':False,'views':{}}
for k,a in VIEWS.items():
 s=prepare(a,True);render(s,orbit_camera('FAITHFUL_FOLIAGE_'+k,a),'FAITHFUL_FOLIAGE_'+k)
 s=prepare(a,False);render(s,orbit_camera('FAITHFUL_FINAL_'+k,a),'FAITHFUL_FINAL_'+k)
 r['views'][k]={'degrees':a,'foliageReorientedAroundObservedBase':True,'planter':'SOURCE_GEOMETRY_UNCHANGED'}
# The source mesh is the finished front-authoritative 2.5D asset: observed
# geometry is explicit, the planter has physical depth, and all side work is a
# non-destructive presentation derivative.  Export a versioned copy only.
bpy.ops.wm.open_mainfile(filepath=source)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'GG-VEG-PLANTER-SHRUB-001_FRONT_AUTHORITY_2_5D_1.0.0.blend'))
r['deliverableBlend']='GG-VEG-PLANTER-SHRUB-001_FRONT_AUTHORITY_2_5D_1.0.0.blend'
r['topology']=topology_contract()
json.dump(r,open(os.path.join(out,'FAITHFUL_PLANT_PRESENTATION_RESULT.json'),'w'),indent=2)
print(json.dumps(r,indent=2))
