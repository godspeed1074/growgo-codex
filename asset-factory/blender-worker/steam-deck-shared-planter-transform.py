import bpy,json,os,sys,math
from mathutils import Matrix,Vector

args=sys.argv[sys.argv.index('--')+1:]
if len(args)!=3: raise SystemExit('usage: -- <locked-source.blend> <config.json> <output-dir>')
source,config_path,out=args;os.makedirs(out,exist_ok=True)
cfg=json.load(open(config_path))
VIEWS={'M30':-30,'M15':-15,'0':0,'P15':15,'P30':30}

def planter(o): return o.type=='MESH' and str(o.get('componentId','')).startswith('PLANTER')

def remap_world_geometry_once(o):
 # Source: X right, Y up, Z hidden depth. Presentation: X right, Y depth,
 # Z up.  Bake each WORLD-space point exactly once, then reset the object
 # transform. This is intentionally not a geometry redesign.
 old=[o.matrix_world@v.co for v in o.data.vertices]
 o.matrix_world=Matrix.Identity(4)
 for v,p in zip(o.data.vertices,old): v.co=(p.x,p.z,p.y)

def camera(name,angle):
 d=bpy.data.cameras.new(name);c=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(c)
 r=math.radians(angle);c.location=(math.sin(r)*9,math.cos(r)*9,0)
 c.rotation_euler=(Vector((0,0,0))-c.location).to_track_quat('-Z','Z').to_euler()
 c.data.type='ORTHO';c.data.ortho_scale=float(cfg.get('orthoScale',1.0));return c

def render(s,c,name):
 s.camera=c;s.render.resolution_x=189;s.render.resolution_y=261;s.render.resolution_percentage=100
 s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.film_transparent=True
 s.render.filepath=os.path.join(out,name+'.png');bpy.ops.render.render(write_still=True)

def run(one):
 global cfg
 cfg=one
 bpy.ops.wm.open_mainfile(filepath=source);s=bpy.context.scene
 ps=[o for o in s.objects if planter(o)]
 for o in s.objects:
  if o.type=='MESH' and not planter(o):o.hide_render=True
 for o in ps: remap_world_geometry_once(o)
 root=bpy.data.objects.new('PLANT_PRESENTATION_ROOT',None);s.collection.objects.link(root)
 root.location=tuple(cfg.get('rootLocation',[0,0,0]));root.scale=(float(cfg.get('scale',1)),)*3
 planter_root=bpy.data.objects.new('PLANTER_3D_ROOT',None);s.collection.objects.link(planter_root);planter_root.parent=root
 for o in ps:o.parent=planter_root
 foliage_anchor=bpy.data.objects.new('FOLIAGE_PRESENTATION_ANCHOR',None);s.collection.objects.link(foliage_anchor);foliage_anchor.location=tuple(cfg.get('foliageAnchor',[0,0,0]))
 for k,a in VIEWS.items():render(s,camera('PRESENTATION_CAMERA_'+k,a),'SOLVER_'+cfg.get('id','BASE')+'_'+k)
 def xform(o): return {'location':[round(v,8) for v in o.location],'rotation':[round(v,8) for v in o.rotation_euler],'scale':[round(v,8) for v in o.scale]}
 world_depth=max((o.dimensions.y for o in ps),default=0)
 result={'id':cfg.get('id','BASE'),'blender':bpy.app.version_string,'cameraContract':{'worldUp':'+Z','rollDegrees':0,'projection':'ORTHOGRAPHIC','orthoScale':cfg.get('orthoScale',1.0)},'transformHierarchy':{'PLANT_PRESENTATION_ROOT':xform(root),'PLANTER_3D_ROOT':xform(planter_root),'FOLIAGE_PRESENTATION_ANCHOR':xform(foliage_anchor),'CAMERA':xform(bpy.data.objects['PRESENTATION_CAMERA_0'])},'planterPhysicalDepth':round(world_depth,8),'meshChanged':False,'foliageRerendered':False,'views':list(VIEWS)}
 json.dump(result,open(os.path.join(out,'SOLVER_'+cfg.get('id','BASE')+'_WORKER.json'),'w'),indent=2);return result

all_results=[run(one) for one in cfg.get('candidates',[cfg])]
print(json.dumps(all_results,indent=2))
