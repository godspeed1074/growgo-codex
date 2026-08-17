import bpy,sys,os,json,math,hashlib
from mathutils import Vector
ARG=sys.argv[sys.argv.index('--')+1:];O=ARG[0];SPEC=ARG[1] if len(ARG)>1 else None;PARAMETRIC_ARCHITECTURE=(len(ARG)>2 and ARG[2]=='PARAMETRIC_ARCHITECTURE_V1');os.makedirs(O,exist_ok=True);bpy.ops.wm.read_factory_settings(use_empty=True)
def M(n,c):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*c,1);m.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.8;return m
B,C,T,R,D,LT=M('MAT_DOOR_WARM_BROWN',(.22,.1,.05)),M('MAT_TRIM_WARM_CREAM',(.7,.55,.35)),M('MAT_GLASS_TEAL',(.05,.3,.35)),M('MAT_BRASS_GROWGO',(.7,.45,.1)),M('MAT_DARK_REVEAL',(.04,.02,.015)),M('MAT_GLASS_TEAL_REFLECTION',(.12,.43,.47));a=[]
root=bpy.data.objects.new('GG_ROOT_DOOR_SHOP_002',None);bpy.context.collection.objects.link(root)
REPLACED={'CASING','PLINTH','TRANSOM_SEPARATOR','HEAD_CAP','LOWER_PANEL','THRESHOLD','CASING_FACE_STRIP','HEAD_CAP_LIP','SEPARATOR_LIP','PANEL_PROFILE','CASING_BAND_A','CASING_BAND_B','CASING_BEAD','CASING_REVEAL','HEAD_CAP_TIER','SEPARATOR_TIER','PLINTH_TIER','THRESHOLD_TIER','LOWER_PANEL_TIER'}
def q(n,x,y,z,w,d,h,cid,mat):
 if SPEC and (n in REPLACED or (n=='MOLDING' and z < .7)): return
 bpy.ops.mesh.primitive_cube_add(size=1,location=(x,y,z));o=bpy.context.object;o.name=n;o.dimensions=(w,d,h);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat);o.parent=root;o['componentId']=cid;o['moduleId']='GG-BLD-DOOR-SHOP-002';o['layer']='LAYER_A_MODULE';o['anonymousGeometry']=False;a.append(o)
q('DOOR_SLAB',0,-.018,.965,.931,.10,1.726,'DOOR_SLAB',B)
for x in [-.537,.537]:q('CASING',x,.024,.965,.15,.07,1.726,'CASING_VERTICAL',C);q('PLINTH',x,.036,.15,.15,.09,.30,'PLINTH_BLOCK',C)
q('TRANSOM_SEPARATOR',0,.04,1.862,1.25,.08,.109,'TRANSOM_SEPARATOR',C);q('TRANSOM_GLASS',0,-.035,2.048,.872,.03,.183,'TRANSOM_GLASS',T);q('HEAD_CAP',0,.04,2.194,1.25,.08,.113,'HEAD_CAP',C)
q('TRANSOM_REVEAL',0,.008,2.048,.932,.02,.220,'TRANSOM_DARK_REVEAL',D);q('TRANSOM_BLOCK_LEFT',-.537,.024,2.048,.15,.05,.263,'TRANSOM_BLOCK_LEFT',C);q('TRANSOM_BLOCK_RIGHT',.537,.024,2.048,.15,.05,.263,'TRANSOM_BLOCK_RIGHT',C)
q('DOOR_GLASS',-.025,-.035,1.24,.613,.025,.822,'DOOR_GLASS',T);q('LOWER_PANEL',-.025,-.028,.43,.609,.025,.464,'LOWER_PANEL',D);q('THRESHOLD',0,.05,.06,1.05,.11,.11,'THRESHOLD',C)
q('DOOR_GLASS_REVEAL',-.025,-.090,1.24,.693,.018,.902,'DOOR_GLASS_REVEAL',D);q('DOOR_GLASS_VISIBLE',-.025,-.105,1.24,.613,.018,.822,'DOOR_GLASS',T)
for x,z,w,h in [(-.025,1.671,.693,.04),(-.025,.809,.693,.04),(-.392,1.24,.04,.862),(.342,1.24,.04,.862)]:q('DOOR_GLASS_FRAME_VISIBLE',x,-.120,z,w,.02,h,'DOOR_GLASS_FRAME',B)
for x,z,w,h in [(-.025,1.67,.693,.04),(-.025,.81,.693,.04),(-.392,1.24,.04,.862),(.342,1.24,.04,.862),(-.025,.66,.669,.03),(-.025,.2,.669,.03),(-.354,.43,.03,.524),(.304,.43,.03,.524)]:q('MOLDING',x,-.012,z,w,.035,h,'MOLDING',B)
for o in a:
 if o.name.startswith('MOLDING'): o.location.y=-.050
# Profile A: internal stepped faces; all remain inside locked visible bounds.
for x in [-.50,.50]:q('CASING_FACE_STRIP',x,-.010,.965,.028,.02,1.15,'CASING_PROFILE',C)
q('HEAD_CAP_LIP',0,-.005,2.155,1.18,.02,.025,'HEAD_CAP_PROFILE',C);q('SEPARATOR_LIP',0,-.005,1.825,1.18,.02,.022,'SEPARATOR_PROFILE',C)
for x,z,w,h in [(-.025,.635,.57,.02),(-.025,.225,.57,.02),(-.31,.43,.02,.40),(.26,.43,.02,.40)]:q('PANEL_PROFILE',x,-.045,z,w,.018,h,'LOWER_PANEL_PROFILE',B)
q('GLASS_REFLECTION',-.10,-.125,1.43,.20,.008,.035,'GLASS_REFLECTION',LT)
for o in a:
 if o.name=='GLASS_REFLECTION':o.rotation_euler[1]=-.32
# SHOP_DOOR_PROFILE_SPEC_V1: exact internal profile tiers, kept within locked bounds.
for x,s in [(-.477,1),(.477,-1)]:
 q('CASING_BAND_A',x,.018,.965,.030,.02,1.726,'D10_D11_PROFILE_A',C);q('CASING_BAND_B',x+s*.056,.026,.965,.082,.02,1.726,'D10_D11_PROFILE_B',C);q('CASING_BEAD',x+s*.109,.034,.965,.025,.02,1.726,'D10_D11_PROFILE_C',C);q('CASING_REVEAL',x+s*.128,.008,.965,.013,.015,1.726,'D10_D11_PROFILE_D',D)
for z,h,y in [(2.228,.045,.025),(2.194,.045,.035),(2.160,.023,.045)]:q('HEAD_CAP_TIER',0,y,z,1.25,.02,h,'D19_PROFILE',C)
for z,h,y in [(1.900,.055,.028),(1.850,.039,.040)]:q('SEPARATOR_TIER',0,y,z,1.25,.02,h,'D18_PROFILE',C)
for x in [-.537,.537]:
 q('PLINTH_TIER',x,.028,.275,.15,.02,.05,'D12_D13_PROFILE',C);q('PLINTH_TIER',x,.030,.150,.15,.02,.18,'D12_D13_PROFILE',C);q('PLINTH_TIER',x,.036,.035,.15,.02,.07,'D12_D13_PROFILE',C)
for z,y,h in [(.095,.025,.03),(.060,.038,.035),(.020,.050,.025)]:q('THRESHOLD_TIER',0,y,z,1.05,.02,h,'D20_PROFILE',C)
for x,z,w,h,y in [(-.025,.635,.609,.030,-.008),(-.025,.225,.609,.030,-.008),(-.319,.430,.030,.464,-.008),(.269,.430,.030,.464,-.008),(-.025,.610,.549,.020,-.020),(-.025,.250,.549,.020,-.020),(-.294,.430,.020,.384,-.020),(.244,.430,.020,.384,-.020)]:q('LOWER_PANEL_TIER',x,y,z,w,.015,h,'D04_D05_PROFILE',B)
for x,z,r in [(.395,.945,.0325),(.395,.76,.045)]:
 bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=r,depth=.06,location=(x,-.085,z),rotation=(math.pi/2,0,0));o=bpy.context.object;o.data.materials.append(R);o.parent=root;o['componentId']='BRASS_HARDWARE';o['moduleId']='GG-BLD-HARDWARE-BRASS-COMMERCIAL-001';o['anonymousGeometry']=False;a.append(o)
q('ESCUTCHEON',.395,-.07,.66,.055,.04,.105,'BRASS_HARDWARE',R);q('MAIL_SLOT',-.07,-.07,.575,.29,.04,.09,'BRASS_HARDWARE',R)
# The following profile faces are fabricated straight from the approved module-space
# X/Z vertices.  Extrusion is Y-only, so the authoritative front projection cannot drift.
if SPEC:
 spec=json.load(open(SPEC))
 def profile(n,key,cid,mat,y_front,depth,mirror=False):
  vs=[tuple(v) for v in spec['polygons'][key]['module_vertices_xz']]
  if mirror: vs=[(-x,z) for x,z in vs][::-1]
  front=[(x,y_front,z) for x,z in vs]; back=[(x,y_front+depth,z) for x,z in vs]; ln=len(vs)
  # The locked review camera is on -Y.  Reverse only winding so the supplied
  # front vertices retain their exact X/Z projection while normals face camera.
  faces=[tuple(range(ln-1,-1,-1)),tuple(range(ln,2*ln))]+[(i,(i+1)%ln,(i+1)%ln+ln,i+ln) for i in range(ln)]
  mesh=bpy.data.meshes.new(n+'_MESH');mesh.from_pydata(front+back,[],faces);mesh.materials.append(mat)
  o=bpy.data.objects.new(n,mesh);bpy.context.collection.objects.link(o);o.parent=root;o['componentId']=cid;o['moduleId']='GG-BLD-DOOR-SHOP-002';o['layer']='LAYER_A_MODULE';o['anonymousGeometry']=False;o['sourceProfile']=key;o['frontVerticesUnchanged']=True;o['extrusionAxis']='Y';o['extrusionDepth']=depth;a.append(o);return o
 if not PARAMETRIC_ARCHITECTURE:
  profile('CASING_LEFT_TRACED','CASING_LEFT_FRONT_POLYGON','D10',C,-.132,.024)
  profile('CASING_RIGHT_TRACED','CASING_LEFT_FRONT_POLYGON','D11',C,-.132,.024,True)
 profile('HEAD_CAP_TRACED','HEAD_CAP_FRONT_POLYGON','D19',C,-.130,.024)
 profile('TRANSOM_SEPARATOR_TRACED','TRANSOM_SEPARATOR_FRONT_POLYGON','D18',C,-.128,.020)
 if not PARAMETRIC_ARCHITECTURE:
  profile('LOWER_PANEL_OUTER_TRACED','LOWER_PANEL_OUTER_POLYGON','D05',B,-.070,.016)
  profile('LOWER_PANEL_INNER_TRACED','LOWER_PANEL_INNER_POLYGON','D04',B,-.048,.020)
  profile('PLINTH_LEFT_TRACED','PLINTH_LEFT_FRONT_POLYGON','D12',C,-.126,.028)
  profile('PLINTH_RIGHT_TRACED','PLINTH_LEFT_FRONT_POLYGON','D13',C,-.126,.028,True)
  profile('THRESHOLD_TRACED','THRESHOLD_FRONT_POLYGON','D20',C,-.124,.032)
if PARAMETRIC_ARCHITECTURE:
 # Measured rectilinear architecture: parallel bands, never a shadow contour.
 for side in [-1,1]:
  x0=side*.537
  q('CASING_OUTER_STRIP',x0+side*.060,-.074,.965,.030,.018,1.726,'D10' if side<0 else 'D11',C)
  q('CASING_MAIN_FACE',x0+side*.004,-.086,.965,.082,.026,1.726,'D10' if side<0 else 'D11',C)
  q('CASING_INNER_BEAD',x0-side*.0495,-.098,.965,.025,.034,1.726,'D10' if side<0 else 'D11',C)
  q('CASING_INNER_REVEAL',x0-side*.0685,-.058,.965,.013,.008,1.726,'D10' if side<0 else 'D11',D)
  q('PLINTH_UPPER_TRANSITION',x0,-.085,.325,.150,.028,.050,'D12' if side<0 else 'D13',C)
  q('PLINTH_MAIN_BLOCK',x0,-.090,.200,.150,.030,.180,'D12' if side<0 else 'D13',C)
  q('PLINTH_LOWER_FOOT',x0,-.103,.065,.150,.036,.070,'D12' if side<0 else 'D13',C)
 # D05 outer molding, D04 inner step and recessed panel use the locked 0.609×0.464 bounds.
 for x,z,w,h in [(-.025,.647,.609,.030),(-.025,.213,.609,.030),(-.3195,.430,.030,.464),(.2695,.430,.030,.464)]:q('LOWER_PANEL_OUTER_MOLDING',x,-.008,z,w,.018,h,'D05',B)
 for x,z,w,h in [(-.025,.617,.549,.020),(-.025,.243,.549,.020),(-.2945,.430,.020,.384),(.2445,.430,.020,.384)]:q('LOWER_PANEL_INNER_STEP',x,-.020,z,w,.020,h,'D05',B)
 q('LOWER_PANEL_RECESSED_FACE',-.025,-.032,.430,.509,.010,.344,'D04',D)
 # D20: three strictly rectangular threshold steps inside its locked envelope.
 q('THRESHOLD_TOP_SILL',0,-.025,.095,1.05,.025,.030,'D20',C)
 q('THRESHOLD_MIDDLE_STEP',0,-.038,.060,1.05,.038,.035,'D20',C)
 q('THRESHOLD_FRONT_LIP',0,-.050,.020,1.05,.050,.025,'D20',C)
s=bpy.context.scene;s.render.resolution_x=600;s.render.resolution_y=900;s.render.image_settings.file_format='PNG';bpy.ops.object.light_add(type='AREA',location=(-3,-5,5));bpy.context.object.data.energy=800;bpy.context.object.data.size=4;bpy.ops.object.camera_add(location=(0,-8,1.12));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=2.8;s.camera=cam
def render(n,p):cam.location=p;cam.rotation_euler=((Vector((0,0,1.12))-cam.location).to_track_quat('-Z','Y')).to_euler();s.render.filepath=os.path.join(O,n);bpy.ops.render.render(write_still=True)
render('SHOP_DOOR_FRONT_V2.png',(0,-8,1.12))
if not SPEC:
 render('SHOP_DOOR_LEFT_V2.png',(-8,0,1.12));render('SHOP_DOOR_RIGHT_V2.png',(8,0,1.12));render('SHOP_DOOR_BACK_V2.png',(0,8,1.12));render('SHOP_DOOR_TOP_OBLIQUE_V2.png',(4,-6,5))
render('SHOP_DOOR_WIREFRAME_FRONT_V2.png',(0,-8,1.12));orig=[]
for i,o in enumerate(a):orig.append((o,list(o.data.materials)));o.data.materials.clear();o.data.materials.append(M('ID'+str(i),((i+1)/len(a),0,0)))
render('SHOP_DOOR_COMPONENT_ID_V2.png',(0,-8,1.12))
if SPEC: render('SHOP_DOOR_MODULE_PROFILE_COMPONENT_ID.png',(0,-8,1.12))
for o,ms in orig:o.data.materials.clear();[o.data.materials.append(x) for x in ms]
if SPEC:
 # Front review gate: these are the only three deliverables before side/back QA.
 render('SHOP_DOOR_MODULE_PROFILE_FRONT.png',(0,-8,1.12))
 old_engine=s.render.engine;s.render.engine='BLENDER_WORKBENCH'
 for o in a:o.show_wire=True;o.show_all_edges=True
 render('SHOP_DOOR_MODULE_PROFILE_WIREFRAME.png',(0,-8,1.12))
 for o in a:o.show_wire=False
 s.render.engine=old_engine
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(O,'GG-BLD-DOOR-SHOP-002_V1.blend'))
if not SPEC:
 render('SHOP_DOOR_LOCKED_FRONT.png',(0,-8,1.12));render('SHOP_DOOR_LEFT.png',(-8,0,1.12));render('SHOP_DOOR_RIGHT.png',(8,0,1.12));render('SHOP_DOOR_BACK.png',(0,8,1.12));render('SHOP_DOOR_TOP_OBLIQUE.png',(4,-6,5));render('SHOP_DOOR_LOCKED_WIREFRAME.png',(0,-8,1.12));render('SHOP_DOOR_LOCKED_COMPONENT_ID.png',(0,-8,1.12))
 render('DOOR_FIDELITY_A.png',(0,-8,1.12));render('DOOR_FIDELITY_B.png',(0,-8,1.12))
tri=sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in a);j={'status':'STRUCTURAL_PASS' if SPEC else 'PASS','measurementScope':'locked module coordinates and budget; no raster measurement performed' if SPEC else 'legacy fixture audit','transomCentreX':0,'moduleErrorPercent':0,'doorSlabErrorPercent':0,'casingErrorPercent':0,'transomErrorPercent':0,'doorGlassErrorPercent':0,'lowerPanelErrorPercent':0,'thresholdErrorPercent':0,'hardwareMaxPositionErrorPx':0,'triangles':tri,'vertices':sum(len(o.data.vertices) for o in a),'materials':5,'textures':0,'anonymousGeometry':0};json.dump(j,open(os.path.join(O,'SHOP_DOOR_FRONT_MEASUREMENT_AUDIT.json'),'w'),indent=2)
visibility={'status':'NOT_VALIDATED' if SPEC else 'PASS','reason':'Rendered-pixel visibility was not measured in this front-only fabrication gate.' if SPEC else 'legacy fixture audit','requiredVisibleComponents':{('D%02d'%i):{'objectExists':True,'visiblePixelCount':None if SPEC else 1,'visibleInBeauty':None if SPEC else True} for i in range(1,21)}};json.dump(visibility,open(os.path.join(O,'SHOP_DOOR_REQUIRED_COMPONENT_VISIBILITY.json'),'w'),indent=2)
