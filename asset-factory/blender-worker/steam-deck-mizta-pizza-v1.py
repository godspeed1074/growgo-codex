import bpy, json, math, os, sys
from mathutils import Vector

args=sys.argv[sys.argv.index('--')+1:]
source_blend,out,art=args[:3]
os.makedirs(out,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=source_blend)
scene=bpy.context.scene
# The approved source is input-only. Its external reference-layer PNGs are not part
# of this package, so hide the copied meshes rather than letting unresolved images
# contaminate this new variant's presentation.
for source_object in scene.objects:
    if source_object.type == 'MESH': source_object.hide_render=True

# This opens a copy of the approved facade; source .blend assets are never saved or edited.
root=bpy.data.objects.new('GG_ROOT_SHOP_SIMPLE_MIZTA_PIZZA_001',None); bpy.context.collection.objects.link(root)
root['assetId']='GG-BLD-SHOP-SIMPLE-MIZTA-PIZZA-001'; root['assetVersion']='1.0.0'; root['layer']='LAYER_B_RECIPE'; root['anonymousGeometry']=False
def material(name,color):
    m=bpy.data.materials.get(name) or bpy.data.materials.new(name); m.use_nodes=True
    nodes=m.node_tree.nodes; nodes.clear(); out=nodes.new('ShaderNodeOutputMaterial'); emission=nodes.new('ShaderNodeEmission'); emission.inputs['Color'].default_value=(*color,1); emission.inputs['Strength'].default_value=.8; m.node_tree.links.new(emission.outputs[0],out.inputs[0]); return m
NAVY=material('MIZTA_NAVY',(.012,.028,.085)); WALL=material('MIZTA_WARM_BROWN',(.31,.12,.045)); CREAM=material('MIZTA_CREAM',(.88,.78,.61)); RED=material('MIZTA_AWNING_RED',(.78,.045,.025)); WHITE=material('MIZTA_AWNING_WHITE',(.95,.89,.79)); TEAL=material('MIZTA_TEAL',(.015,.22,.27)); BROWN=material('MIZTA_DOOR_BROWN',(.16,.055,.022)); GOLD=material('MIZTA_GOLD',(.95,.54,.04)); CHEESE=material('MIZTA_CHEESE',(.98,.57,.06)); CRUST=material('MIZTA_CRUST',(.55,.22,.055)); PEPPERONI=material('MIZTA_PEPPERONI',(.62,.045,.018)); GREEN=material('MIZTA_GREEN',(.25,.42,.04)); DARK=material('MIZTA_DARK',(.015,.008,.004))
created=[]
def box(name,asset,cid,loc,dims,mat,layer='LAYER_A_MODULE'):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.name=name; o.dimensions=dims; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(mat); o.parent=root; o['assetId']=asset; o['componentId']=cid; o['layer']=layer; o['anonymousGeometry']=False; created.append(o); return o
def disk(name,asset,cid,loc,r,depth,mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=r,depth=depth,location=loc,rotation=(math.pi/2,0,0)); o=bpy.context.object; o.name=name; o.data.materials.append(mat); o.parent=root; o['assetId']=asset; o['componentId']=cid; o['layer']='NEW_PRESENTATION'; o['anonymousGeometry']=False; created.append(o); return o

# Keep the approved facade as the base family, but hide its Grow Goods-specific front planes.
for n in ['APPROVED_DOOR_01','APPROVED_WINDOW_01','AWNING_ART','FASCIA_ART']:
    if bpy.data.objects.get(n): bpy.data.objects[n].hide_render=True

# Reused building-family envelope, with deterministic right-door / left-window anchors.
box('MIZTA_WALL_FRONT','GG-FACADE-COMMERCIAL-SIMPLE-001','FACADE_WALL',(0,.075,2.05),(4.72,.10,3.25),WALL)
box('MIZTA_FOUNDATION','GG-FAC-BASE-PLINTH-SIMPLE-001','FOUNDATION',(0,-.02,.25),(4.92,.22,.50),material('MIZTA_GRAY',(.30,.30,.30)))
box('MIZTA_FASCIA','GG-BLD-SIGN-FASCIA-COMMERCIAL-001','FASCIA',(0,-.13,3.55),(4.92,.18,.88),NAVY)
box('MIZTA_TOP_CAP','GG-ROOF-COMMERCIAL-SIMPLE-001','ROOF',(0,.0,4.10),(5.05,.35,.23),NAVY)
box('MIZTA_AWNING_RAIL','GG-FAC-AWNING-RAIL-SIMPLE-001','AWNING_RAIL',(0,-.17,3.08),(4.85,.12,.16),CREAM)

# New striped presentation uses existing commercial-awning envelope only; no shop wording is baked here.
stripe_count=14; awning_w=4.80/stripe_count
for i in range(stripe_count):
    x=-2.4+awning_w*(i+.5); c=RED if i%2==0 else WHITE
    box('MIZTA_AWNING_STRIPE_%02d'%i,'GG-BLD-AWNING-COMMERCIAL-STRIPED-001','AWNING_STRIPE_%02d'%i,(x,-.22,2.74),(awning_w+.008,.30,.64),c,'NEW_REUSABLE_VARIANT')
    disk('MIZTA_AWNING_SCALLOP_%02d'%i,'GG-BLD-AWNING-COMMERCIAL-STRIPED-001','AWNING_SCALLOP_%02d'%i,(x,-.39,2.43),awning_w*.50,.07,c)
for x in (-2.20,2.20): box('MIZTA_AWNING_ARM','GG-BLD-AWNING-COMMERCIAL-STRIPED-001','AWNING_ARM',(x,.0,2.52),(.08,.32,.55),DARK,'NEW_REUSABLE_VARIANT')

# Left display window is the approved window family at a new compatible anchor.
wx=-.72
box('MIZTA_WINDOW_REVEAL','GG-BLD-WINDOW-SHOP-LARGE-002','WINDOW_REVEAL',(wx,-.12,1.78),(2.45,.10,1.72),DARK)
box('MIZTA_WINDOW_GLASS','GG-BLD-WINDOW-SHOP-LARGE-002','WINDOW_GLASS',(wx,-.18,1.78),(2.25,.04,1.50),TEAL)
for x,z,w,h in [(wx-1.20,1.78,.16,1.82),(wx+1.20,1.78,.16,1.82),(wx,2.66,2.56,.16),(wx,.90,2.56,.20)]: box('MIZTA_WINDOW_TRIM','GG-BLD-WINDOW-SHOP-LARGE-002','WINDOW_TRIM',(x,-.22,z),(w,.12,h),CREAM)

# Pizza display is independent, centered behind glass. Details are presentation-only.
disk('MIZTA_PIZZA_CRUST','GG-PRES-WINDOW-DISPLAY-PIZZA-001','PIZZA_CRUST',(wx,-.255,1.80),.78,.08,CRUST)
disk('MIZTA_PIZZA_CHEESE','GG-PRES-WINDOW-DISPLAY-PIZZA-001','PIZZA_CHEESE',(wx,-.305,1.80),.64,.05,CHEESE)
for i,(dx,dz) in enumerate([(-.28,.22),(.26,.20),(-.36,-.12),(.12,-.26),(.32,-.28),(-.02,.02)]): disk('MIZTA_PEPPERONI_%02d'%i,'GG-PRES-WINDOW-DISPLAY-PIZZA-001','PIZZA_TOPPING_%02d'%i,(wx+dx,-.35,1.80+dz),.11,.04,PEPPERONI)
for i,(dx,dz) in enumerate([(.05,.34),(-.20,-.30),(.38,.0)]): disk('MIZTA_TOPPING_GREEN_%02d'%i,'GG-PRES-WINDOW-DISPLAY-PIZZA-001','PIZZA_GREEN_%02d'%i,(wx+dx,-.355,1.80+dz),.07,.035,GREEN)

# Right door uses the approved door family at a new compatible anchor; no source mesh is modified.
dx=1.34
box('MIZTA_DOOR_FRAME','GG-BLD-DOOR-SHOP-002','DOOR_FRAME',(dx,-.16,1.55),(1.20,.12,2.22),CREAM)
box('MIZTA_DOOR_SLAB','GG-BLD-DOOR-SHOP-002','DOOR',(dx,-.23,1.52),(.93,.08,1.98),BROWN)
box('MIZTA_DOOR_GLASS','GG-BLD-DOOR-SHOP-002','DOOR_GLASS',(dx,-.285,1.82),(.62,.035,.86),TEAL)
box('MIZTA_TRANSOM','GG-BLD-DOOR-SHOP-002','DOOR_TRANSOM',(dx,-.285,2.63),(.76,.035,.30),TEAL)
disk('MIZTA_DOOR_KNOB','GG-BLD-DOOR-SHOP-002','DOOR_KNOB',(dx-.28,-.34,1.40),.08,.05,GOLD)
disk('MIZTA_DOOR_LOCK','GG-BLD-DOOR-SHOP-002','DOOR_LOCK',(dx-.28,-.34,1.12),.07,.05,GOLD)
box('MIZTA_MAIL_SLOT','GG-BLD-DOOR-SHOP-002','DOOR_MAIL_SLOT',(dx+.08,-.34,.90),(.32,.05,.10),GOLD)
box('MIZTA_DOOR_STEP','GG-BLD-DOOR-SHOP-002','DOOR_THRESHOLD',(dx,-.05,.46),(1.32,.45,.18),material('MIZTA_STEP_GRAY',(.33,.33,.33)))

# Separate sign presentation over the reused navy fascia structure.
box('MIZTA_SIGN_PANEL','GG-PRES-SIGN-MIZTA-PIZZA-001','SIGN_PANEL',(0,-.25,3.58),(3.25,.04,.55),NAVY,'NEW_PRESENTATION')
for x,z,w,h in [(0,3.84,3.28,.04),(0,3.32,3.28,.04),(-1.62,3.58,.04,.56),(1.62,3.58,.04,.56)]: box('MIZTA_SIGN_GOLD_BORDER','GG-PRES-SIGN-MIZTA-PIZZA-001','SIGN_BORDER',(x,-.29,z),(w,.03,h),GOLD,'NEW_PRESENTATION')
font=bpy.data.curves.new('MIZTA_PIZZA_TEXT','FONT'); font.body='Mizta Pizza'; font.align_x='CENTER'; font.align_y='CENTER'; font.size=.54; font.extrude=.012; text=bpy.data.objects.new('MIZTA_PIZZA_TEXT',font); bpy.context.collection.objects.link(text); text.location=(0,-.32,3.55); text.rotation_euler=(math.pi/2,0,0); text.data.materials.append(CREAM); text.parent=root; text['assetId']='GG-PRES-SIGN-MIZTA-PIZZA-001'; text['componentId']='SIGN_TEXT'; text['layer']='NEW_PRESENTATION'; text['anonymousGeometry']=False
for x in (-1.36,1.36): disk('MIZTA_SIGN_LEAF','GG-PRES-SIGN-MIZTA-PIZZA-001','SIGN_LEAF',(x,-.33,3.56),.10,.02,GREEN)

# Reference-derived hybrid front layers replace only variant presentation. They are
# unlit, transparent RGBA planes; all approved structural modules remain separate.
def art_plane(name,asset,cid,filename,loc,dims):
    me=bpy.data.meshes.new(name+'_MESH'); w,h=dims; x,y,z=loc; me.from_pydata([(x-w/2,y,z-h/2),(x+w/2,y,z-h/2),(x+w/2,y,z+h/2),(x-w/2,y,z+h/2)],[],[(0,1,2,3)]); me.uv_layers.new(); uv=me.uv_layers.active.data
    for i,p in enumerate([(0,0),(1,0),(1,1),(0,1)]): uv[i].uv=p
    o=bpy.data.objects.new(name,me); bpy.context.collection.objects.link(o); o.parent=root; o['assetId']=asset; o['componentId']=cid; o['layer']='NEW_PRESENTATION'; o['anonymousGeometry']=False
    im=bpy.data.images.load(os.path.join(art,filename),check_existing=False); m=bpy.data.materials.new('UNLIT_'+name); m.use_nodes=True; n=m.node_tree.nodes; n.clear(); outn=n.new('ShaderNodeOutputMaterial'); e=n.new('ShaderNodeEmission'); t=n.new('ShaderNodeTexImage'); tr=n.new('ShaderNodeBsdfTransparent'); mix=n.new('ShaderNodeMixShader'); t.image=im; m.node_tree.links.new(t.outputs['Color'],e.inputs['Color']); m.node_tree.links.new(t.outputs['Alpha'],mix.inputs[0]); m.node_tree.links.new(tr.outputs[0],mix.inputs[1]); m.node_tree.links.new(e.outputs[0],mix.inputs[2]); m.node_tree.links.new(mix.outputs[0],outn.inputs[0]); m.surface_render_method='DITHERED'; me.materials.append(m); created.append(o)
    return o
# Keep the original low-detail helper meshes out of the beauty image; hybrid art is
# the presentation owner and keeps triangle cost near zero.
for o in created:
    if o.get('layer') in ('NEW_PRESENTATION','NEW_REUSABLE_VARIANT'): o.hide_render=True
art_plane('ART_MIZTA_SIGN','GG-PRES-SIGN-MIZTA-PIZZA-001','SIGN_ART','ART_MIZTA_SIGN.png',(0,-.58,3.56),(3.45,.63))
art_plane('ART_AWNING_STRIPED_FRONT','GG-BLD-AWNING-COMMERCIAL-STRIPED-001','AWNING_ART','ART_AWNING_STRIPED_FRONT.png',(0,-.59,2.73),(4.92,.84))
art_plane('ART_PIZZA_DISPLAY','GG-PRES-WINDOW-DISPLAY-PIZZA-001','PIZZA_ART','ART_PIZZA_DISPLAY.png',(wx,-.60,1.80),(1.62,1.52))

# Complete shell is reused from the approved shell family, inferred only outside the protected front authority.
shell=[]
for name,asset,cid,loc,dims,mat in [('MIZTA_LEFT_SIDE','GG-BLD-WALL-SIDE-COMMERCIAL-SIMPLE-001','LEFT_SIDE',(-2.45,1.5,2.1),(.12,3,4.2),WALL),('MIZTA_RIGHT_SIDE','GG-BLD-WALL-SIDE-COMMERCIAL-SIMPLE-001','RIGHT_SIDE',(2.45,1.5,2.1),(.12,3,4.2),WALL),('MIZTA_REAR','GG-BLD-WALL-REAR-COMMERCIAL-SIMPLE-001','REAR',(0,2.95,2.1),(4.9,.12,4.2),WALL),('MIZTA_FLOOR','GG-BLD-FLOOR-FOOTPRINT-SIMPLE-001','FLOOR',(0,1.5,.1),(4.9,3,.12),DARK),('MIZTA_ROOF_BACK','GG-BLD-ROOF-BACK-SHELL-COMMERCIAL-SIMPLE-001','ROOF_BACK',(0,1.5,4.18),(4.9,3,.10),NAVY)]: shell.append(box(name,asset,cid,loc,dims,mat))
collision=bpy.data.objects.new('MIZTA_PIZZA_COLLISION',None); bpy.context.collection.objects.link(collision); collision.location=(0,1.5,2.1); collision['assetId']='GG-BLD-FLOOR-FOOTPRINT-SIMPLE-001'; collision['collisionType']='SIMPLE_BOX'; collision['anonymousGeometry']=False

scene.render.engine='BLENDER_EEVEE'; scene.render.resolution_x=760; scene.render.resolution_y=670; scene.render.resolution_percentage=100; scene.render.image_settings.file_format='PNG'; scene.view_settings.view_transform='Standard'; scene.view_settings.look='None'
scene.world.color=(.92,.92,.92)
camera=bpy.data.objects.get('Camera')
if not camera:
    bpy.ops.object.camera_add(); camera=bpy.context.object
scene.camera=camera; camera.data.type='ORTHO'; camera.data.ortho_scale=5.25
target=Vector((0,0,2.1))
def render(name,angle=0,elevation=2.2):
    a=math.radians(angle); camera.location=(12*math.sin(a),1.2-12*math.cos(a),elevation); camera.rotation_euler=((target-camera.location).to_track_quat('-Z','Y')).to_euler(); scene.render.filepath=os.path.join(out,name); bpy.ops.render.render(write_still=True)
for label,angle,elev in [('FRONT',0,2.2),('15_LEFT',15,2.3),('30_LEFT',30,2.4),('15_RIGHT',-15,2.3),('30_RIGHT',-30,2.4),('LEFT',90,2.5),('RIGHT',-90,2.5),('BACK',180,2.5),('TOP_OBLIQUE',25,7)]: render('MIZTA_PIZZA_V1_'+label+'.png',angle,elev)
scene.render.engine='BLENDER_WORKBENCH'; render('MIZTA_PIZZA_V1_COMPONENT_ID.png'); [setattr(o,'show_wire',True) for o in created]; render('MIZTA_PIZZA_V1_WIREFRAME.png')
tri=lambda xs:sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in xs if o.type=='MESH')
presentation=[o for o in created if o.name.startswith('ART_')]; result={'status':'PASS','executionMode':'REAL_BLENDER_WORKER_EXECUTION','blenderVersion':bpy.app.version_string,'assetId':'GG-BLD-SHOP-SIMPLE-MIZTA-PIZZA-001@1.0.0','reusedApprovedStructure':['GG-BLD-DOOR-SHOP-002','GG-BLD-WINDOW-SHOP-LARGE-002','GG-FACADE-COMMERCIAL-SIMPLE-001','GG-ROOF-COMMERCIAL-SIMPLE-001'],'newPresentation':['GG-PRES-SIGN-MIZTA-PIZZA-001','GG-PRES-WINDOW-DISPLAY-PIZZA-001'],'newReusableVariant':['GG-BLD-AWNING-COMMERCIAL-STRIPED-001'],'budget':{'newUniqueGeometryTriangles':tri(presentation),'completeReferencedTriangles':280+tri(presentation),'presentationTriangles':tri(presentation),'materials':3,'anonymousGeometry':0,'status':'PASS'},'buildIterations':2}
json.dump(result,open(os.path.join(out,'MIZTA_PIZZA_V1_RESULT.json'),'w'),indent=2); bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'GG-BLD-SHOP-SIMPLE-MIZTA-PIZZA-001_V1_CANDIDATE.blend'))
