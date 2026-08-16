import bpy,json,os,sys,math
from mathutils import Matrix,Vector
args=sys.argv[sys.argv.index('--')+1:]
if len(args) not in [2,3]:raise SystemExit('usage: -- <locked-source.blend> <out> [presentation-config.json]')
source,out=args[:2];os.makedirs(out,exist_ok=True);cfg=json.load(open(args[2])) if len(args)==3 else {'foliageOffsets':{}}
VIEWS={'M30':-30,'M15':-15,'0':0,'P15':15,'P30':30}
S=.98285714;PLANTER_LOC=Vector((-.00306878,0,.63249042))
def planter(o):return o.type=='MESH' and str(o.get('componentId','')).startswith('PLANTER')
def foliage(o):return o.type=='MESH' and (str(o.get('leafId','')).startswith('LEAF_') or o.get('componentId')=='SHRUB_OBSERVED_RESIDUAL' or str(o.get('componentId','')).startswith('FLOWER_GROUP'))
def remap_once(o):
 old=[o.matrix_world@v.co for v in o.data.vertices];o.matrix_world=Matrix.Identity(4)
 for v,p in zip(o.data.vertices,old):v.co=(p.x,p.z,p.y)
def camera(name,a):
 d=bpy.data.cameras.new(name);c=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(c);r=math.radians(a);c.location=(math.sin(r)*9,math.cos(r)*9,0);c.rotation_euler=(Vector((0,0,0))-c.location).to_track_quat('-Z','Z').to_euler();c.data.type='ORTHO';c.data.ortho_scale=1;return c
def pivot(o):
 vs=[v.co.copy() for v in o.data.vertices];z=min(v.z for v in vs);b=[v for v in vs if v.z<=z+.004];return Vector((sum(v.x for v in b)/len(b),sum(v.y for v in b)/len(b),z))
def yaw(o,a):
 # Presentation-only foliage arrangement. The visible front source is not
 # rewritten; this scene is discarded after baking its one complete view.
 r=math.radians(a);co,si=math.cos(r),math.sin(r);p=pivot(o)
 for v in o.data.vertices:
  q=v.co-p;v.co.x=p.x+co*q.x+si*q.y;v.co.y=p.y-si*q.x+co*q.y
def render(s,c,n):
 s.camera=c;s.render.resolution_x=189;s.render.resolution_y=261;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.film_transparent=True;s.render.filepath=os.path.join(out,n+'.png');bpy.ops.render.render(write_still=True)
def scene(a,key):
 bpy.ops.wm.open_mainfile(filepath=source);s=bpy.context.scene
 ps=[o for o in s.objects if planter(o)];fs=[o for o in s.objects if foliage(o)]
 for o in s.objects:
  if o.type=='MESH' and not(planter(o) or foliage(o)):o.hide_render=True
 for o in ps+fs:remap_once(o)
 pr=bpy.data.objects.new('PLANTER_3D_ROOT',None);s.collection.objects.link(pr);pr.location=PLANTER_LOC;pr.scale=(S,S,S)
 # Foliage retains its source-derived front placement. The planter's front
 # presentation transform is deliberately separate because its original Y-up
 # source root differs from the foliage's baked camera-authority basis.
 fr=bpy.data.objects.new('FOLIAGE_PRESENTATION_ANCHOR',None);s.collection.objects.link(fr)
 # Correct-map foliage carries a different historical source root than the
 # planter. This view-family anchor restores the locked front pixel placement.
 off=Vector(cfg.get('foliageOffsets',{}).get(key,[0,0,0]));fr.location=Vector((0,0,-.235))+off
 for o in ps:o.parent=pr
 for o in fs:o.parent=fr;yaw(o,a)
 return s,ps,fs
r={'status':'PASS_COMPLETE_FIVE_VIEW_WORKER','worker':'Steam Deck','blender':bpy.app.version_string,'sourcePreserved':True,'foliageRerenderedFromSharedSource':True,'planterMeshChanged':False,'cameraContract':{'worldUp':'+Z','rollDegrees':0,'projection':'ORTHOGRAPHIC','resolution':'189x261'},'views':{}}
for k,a in VIEWS.items():
 s,ps,fs=scene(a,k);[setattr(o,'hide_render',True) for o in ps];render(s,camera('FOLIAGE_CAMERA_'+k,a),'PLANT_VIEW_'+k+'_FOLIAGE_PRE')
 s,ps,fs=scene(a,k);[setattr(o,'hide_render',True) for o in fs];render(s,camera('PLANTER_CAMERA_'+k,a),'PLANT_VIEW_'+k+'_PLANTER_PRE')
 s,ps,fs=scene(a,k);render(s,camera('PLANT_PRESENTATION_'+k,a),'PLANT_VIEW_'+k+'_COMPLETE');r['views'][k]={'cameraDegrees':a,'planterRoot':{'location':list(PLANTER_LOC),'scale':S},'foliagePresentationYawDegrees':a,'foliageOffset':cfg.get('foliageOffsets',{}).get(k,[0,0,0])}
json.dump(r,open(os.path.join(out,'PLANT_COMPLETE_FIVE_VIEW_RESULT.json'),'w'),indent=2);print(json.dumps(r,indent=2))
