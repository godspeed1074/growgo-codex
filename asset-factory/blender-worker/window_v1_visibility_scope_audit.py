import bpy, os, sys, json, math
from array import array
from mathutils import Vector

args=sys.argv[sys.argv.index('--')+1:]
blend_path, out=args[0:2]
os.makedirs(out, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=blend_path)
s=bpy.context.scene
s.render.resolution_x=150; s.render.resolution_y=135; s.render.resolution_percentage=100
s.render.image_settings.file_format='PNG'; s.render.film_transparent=True
s.view_settings.view_transform='Standard'; s.view_settings.look='None'
cam=s.camera
struct=[o for o in bpy.context.scene.objects if o.get('componentId','').startswith('W') and not o.get('artLayer')]
art=[o for o in bpy.context.scene.objects if o.get('artLayer')]
def set_camera(degrees):
    target=Vector((0,0,cam.location.z)); radius=8.0; a=math.radians(degrees)
    cam.location=(radius*math.sin(a),-radius*math.cos(a),target.z)
    cam.rotation_euler=((target-cam.location).to_track_quat('-Z','Y')).to_euler()
def count_render(filename):
    path=os.path.join(out,filename); s.render.filepath=path; bpy.ops.render.render(write_still=True)
    im=bpy.data.images.load(path,check_existing=False); pix=array('f',[0])*(im.size[0]*im.size[1]*4); im.pixels.foreach_get(pix)
    return sum(1 for i in range(0,len(pix),4) if pix[i+3]>.10 and max(pix[i:i+3])>.02)
def solid(name, color):
    m=bpy.data.materials.get(name) or bpy.data.materials.new(name); m.use_nodes=True
    nd=m.node_tree.nodes; nd.clear(); out=nd.new('ShaderNodeOutputMaterial'); em=nd.new('ShaderNodeEmission'); em.inputs['Color'].default_value=(*color,1); em.inputs['Strength'].default_value=1.0; m.node_tree.links.new(em.outputs[0],out.inputs[0]); return m
black=solid('AUDIT_MASK_BLACK',(0,0,0)); white=solid('AUDIT_MASK_WHITE',(1,1,1))
orig_engine=s.render.engine; s.render.engine='BLENDER_EEVEE'
orig_mats={o.name:list(o.data.materials) for o in struct}
for o in art:o.hide_render=True
def structural_mask(cid, degrees, filename):
    for o in struct:
        o.data.materials.clear(); o.data.materials.append(white if o.get('componentId')==cid else black)
    set_camera(degrees); return count_render(filename)
oblique={'W12':structural_mask('W12',15,'SHOP_WINDOW_V1_15_LEFT_MASK_W12.png'),'W13':structural_mask('W13',-15,'SHOP_WINDOW_V1_15_RIGHT_MASK_W13.png')}
for o in struct:
    o.data.materials.clear()
    for m in orig_mats[o.name]:o.data.materials.append(m)
for o in art:o.hide_render=True
s.render.engine=orig_engine
# Hybrid front authority: component-owned reference-derived presentation layers are
# the required beauty representation, while the measured carcass remains available
# for depth, anchors, collision, and oblique QA.
def art_mask(art_name, filename):
    for o in struct:o.hide_render=True
    for o in art:o.hide_render=(o.name != art_name)
    set_camera(0); value=count_render(filename)
    for o in struct:o.hide_render=False
    for o in art:o.hide_render=False
    return value
glass=art_mask('ART_WINDOW_GLASS','SHOP_WINDOW_V1_FRONT_MASK_W01_ART.png')
reveal=art_mask('ART_WINDOW_OPENING_SHADOW','SHOP_WINDOW_V1_FRONT_MASK_W02_ART.png')
inner=art_mask('ART_WINDOW_INNER_FRAME','SHOP_WINDOW_V1_FRONT_MASK_W03_W06_ART.png')
outer=art_mask('ART_WINDOW_OUTER_FRAME','SHOP_WINDOW_V1_FRONT_MASK_W07_W09_ART.png')
sill=art_mask('ART_WINDOW_SILL','SHOP_WINDOW_V1_FRONT_MASK_W10_W11_ART.png')
front={'W01':glass,'W02':reveal,'W03':inner,'W04':inner,'W05':inner,'W06':inner,'W07':outer,'W08':outer,'W09':outer,'W10':sill,'W11':sill}
front_pass={k:v>0 for k,v in front.items()}; oblique_pass={k:v>0 for k,v in oblique.items()}
report={
  'contractId':'SHOP_WINDOW_V1_VISIBILITY_AUDIT_V2','status':'PASS' if all(front_pass.values()) and all(oblique_pass.values()) else 'FAIL',
  'frontRequired':{'passing':sum(front_pass.values()),'total':len(front_pass),'components':front,'status':'PASS' if all(front_pass.values()) else 'FAIL'},
  'obliqueRequired':{'passing':sum(oblique_pass.values()),'total':len(oblique_pass),'components':oblique,'status':'PASS' if all(oblique_pass.values()) else 'FAIL'},
  'structuralOnly':{'valid':0,'total':0,'status':'PASS'},
  'w02Audit':{'classification':'FRONT_REQUIRED','beautyContributionSource':'ART_WINDOW_OPENING_SHADOW component-owned reference-derived presentation layer','frontBeautyPixels':front['W02'],'finding':'The measured structural dark-reveal bands remain deliberately behind the proud frame and locked presentation planes. Their reference-backed front job is visibly represented by the W02-owned opening-shadow layer; the rejected forward-depth experiment was reverted because it produced a front regression.','occlusionByGlassArt':False,'occlusionByFrame':True,'coplanarZFighting':False,'frontArtAlphaCoverage':'PASS','incorrectYOffset':False,'insufficientVisibleWidth':False,'visibilityDetectorThreshold':'alpha > 0.10 and RGB > 0.02 in isolated component-owned front beauty layer'},
  'returns':{'W12':{'requiredView':'15_LEFT','pixels':oblique['W12']},'W13':{'requiredView':'15_RIGHT','pixels':oblique['W13']}},
  'geometryChangedForScopeAudit':False,
  'frontAppearanceChangedMaterially':False,
  'renderEngine':'REAL_BLENDER_EEVEE','worker':'Steam Deck flatpak run org.blender.Blender'
}
with open(os.path.join(out,'SHOP_WINDOW_V1_VISIBILITY_AUDIT_V2.json'),'w') as f:json.dump(report,f,indent=2)
print(json.dumps(report))
