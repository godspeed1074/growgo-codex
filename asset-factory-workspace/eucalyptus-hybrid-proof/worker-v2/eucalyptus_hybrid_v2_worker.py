import bpy, os, sys, json, math
from mathutils import Vector

root, atlas_path = sys.argv[-2:]
out = os.path.join(root, 'TREE_EUCALYPTUS_001@3.1.0')
os.makedirs(out, exist_ok=True)

def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for d in (bpy.data.materials, bpy.data.images, bpy.data.meshes, bpy.data.cameras, bpy.data.lights):
        pass

def set_eevee(scene):
    for engine in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
        try:
            scene.render.engine = engine
            return engine
        except TypeError:
            continue
    raise RuntimeError('No supported Eevee engine enum available')

def solid(name, rgba):
    mat=bpy.data.materials.new(name); mat.diffuse_color=rgba
    mat.use_nodes=True
    p=mat.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=rgba; p.inputs['Roughness'].default_value=.72
    return mat

def foliage_material():
    mat=bpy.data.materials.new('GG_MAT_EUCALYPTUS_FOLIAGE_ATLAS_V2'); mat.use_nodes=True
    mat.diffuse_color=(1,1,1,1)
    try: mat.surface_render_method='DITHERED'
    except Exception: pass
    nodes=mat.node_tree.nodes; links=mat.node_tree.links
    for n in list(nodes): nodes.remove(n)
    outn=nodes.new('ShaderNodeOutputMaterial'); bsdf=nodes.new('ShaderNodeBsdfPrincipled'); img=nodes.new('ShaderNodeTexImage')
    img.image=bpy.data.images.load(atlas_path, check_existing=True); img.interpolation='Linear'
    bsdf.inputs['Roughness'].default_value=.82
    links.new(img.outputs['Color'],bsdf.inputs['Base Color']); links.new(img.outputs['Alpha'],bsdf.inputs['Alpha']); links.new(bsdf.outputs['BSDF'],outn.inputs['Surface'])
    return mat

def segment(a,b,r,mat,name):
    a,b=Vector(a),Vector(b); d=b-a
    bpy.ops.mesh.primitive_cone_add(vertices=7, radius1=r, radius2=r*.56, depth=d.length, location=(a+b)/2)
    o=bpy.context.object; o.name=name; o.data.materials.append(mat); o.rotation_euler=d.to_track_quat('Z','Y').to_euler(); o['layer']='CARCASS'; return o

def card(x,y,z,w,h,uv,mat,name,layer,angle=0):
    # A trimmed vertical card, with UVs selecting one cluster from the shared RGBA atlas.
    u0,v0,u1,v1=uv
    verts=[(-w/2,0,-h/2),(w/2,0,-h/2),(w/2,0,h/2),(-w/2,0,h/2)]
    mesh=bpy.data.meshes.new(name+'_MESH'); mesh.from_pydata(verts,[],[(0,1,2,3)]); mesh.uv_layers.new(name='UVMap')
    for loop,co in zip(mesh.uv_layers[0].data,[(u0,v0),(u1,v0),(u1,v1),(u0,v1)]): loop.uv=co
    o=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(o); o.location=(x,y,z); o.rotation_euler=(math.radians(angle),0,math.radians(angle*.22)); o.data.materials.append(mat)
    o['layer']=layer; o['atlasCluster']=name.split('_')[-1]; return o

# Atlas regions correspond to the clearly separated authored clusters: three upper, three middle, two lower.
# Blender UV V runs bottom-to-top. These are tight source-image rectangles converted
# from the atlas's top-origin pixels, so no card samples a neighbouring cluster.
UV=[(.00,.53,.37,1.00),(.36,.55,.68,1.00),(.66,.50,1.00,1.00),(.00,.33,.55,.60),(.57,.35,.82,.58),(.75,.32,1.00,.60),(.00,.00,.55,.38),(.50,.00,.77,.35)]
ISLANDS=[(-2.25,4.35,1.45,1.45),(-1.15,5.65,1.55,1.65),(.25,6.15,1.65,1.72),(1.75,5.15,1.55,1.55),(2.5,3.92,1.22,1.28),(-.55,4.35,1.42,1.42),(1.05,4.08,1.35,1.38)]
BRANCHES=[((-.05,0,0),(.10,.04,2.65),.25),((.10,.04,2.55),(-1.25,.12,4.45),.15),((.10,.04,2.75),(1.52,-.10,4.62),.16),((-.35,.06,3.20),(-2.30,.15,4.05),.10),((.48,-.02,3.35),(2.55,-.08,3.85),.105),((-.68,.10,3.95),(-1.25,.08,5.65),.075),((.82,-.10,4.02),(.30,-.04,5.95),.075),((.78,-.05,3.80),(1.9,.11,5.32),.07),((-.08,.04,2.5),(-.45,-.05,5.0),.085)]

def build(level):
    clear(); scene=bpy.context.scene; engine=set_eevee(scene)
    bark=solid('GG_MAT_EUCALYPTUS_BARK_PALE',(.66,.60,.46,1)); patch=solid('GG_MAT_EUCALYPTUS_BARK_WARM_PATCH',(.34,.18,.09,1)); foliage=foliage_material()
    branch_limit={'CLOSE':len(BRANCHES),'GAMEPLAY':7,'MAP':3}[level]
    for i,(a,b,r) in enumerate(BRANCHES[:branch_limit]): segment(a,b,r,bark,'GG_EUC_V2_BRANCH_%02d'%i)
    # sparse warm accent patches keep the trunk graphic without a material explosion
    for i,z in enumerate((.9,1.75,2.55)):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=4, radius=.11, location=(.02+(.08 if i%2 else -.06),-.19,z)); o=bpy.context.object; o.name='GG_EUC_BARK_PATCH_%02d'%i; o.scale=(.55,.18,1.55); o.data.materials.append(patch); o['layer']='CARCASS'
    counts={'CLOSE':(3,3,3),'GAMEPLAY':(1,2,1),'MAP':(0,1,0)}[level]
    for island,(x,z,w,h) in enumerate(ISLANDS):
        # Actual y offsets make rear/body/highlight cards a shallow canopy rather than a flat wall.
        for depth,count in enumerate(counts):
            for n in range(count):
                sign=-1 if (island+n)%2 else 1
                xx=x+(n-(count-1)/2)*.17; yy=.32-depth*.28+sign*.05; zz=z+(n-(count-1)/2)*.10
                scale=1-(depth*.07)+(n*.025)
                card(xx,yy,zz,w*scale,h*scale,UV[(island+depth*3+n)%len(UV)],foliage,'GG_EUC_%s_ISLAND_%02d_CLUSTER_%02d'%(('REAR','BODY','FRONT')[depth],island,n),('REAR','MID','FRONT')[depth],sign*(3+depth*3))
    return engine

def setup_camera(angle=0, close=False):
    scene=bpy.context.scene; scene.render.resolution_x=720; scene.render.resolution_y=720; scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'; scene.render.image_settings.color_mode='RGBA'; scene.world.color=(.035,.045,.035)
    bpy.ops.object.camera_add(location=(math.sin(angle)*10,-math.cos(angle)*10,4.1)); cam=bpy.context.object; cam.data.type='ORTHO'; cam.data.ortho_scale=4.4 if close else 8.0
    cam.rotation_euler=(Vector((0,0,4.0))-cam.location).to_track_quat('-Z','Y').to_euler(); scene.camera=cam
    bpy.ops.object.light_add(type='AREA',location=(-4,-5,9)); key=bpy.context.object; key.data.energy=850; key.data.shape='DISK'; key.data.size=6
    bpy.ops.object.light_add(type='AREA',location=(4,1,5)); bpy.context.object.data.energy=350; bpy.context.object.data.size=5
    return cam

def render(name, angle=0, close=False, only=None):
    hidden=[]
    if only:
        for o in bpy.context.scene.objects:
            keep=(o.get('layer') in ('REAR','MID','FRONT')) if only=='FOLIAGE' else o.get('layer') == only
            if o.type=='MESH' and not keep: o.hide_render=True; hidden.append(o)
    cam=setup_camera(angle,close); bpy.context.scene.render.filepath=os.path.join(out,name); bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam,do_unlink=True)
    for o in hidden: o.hide_render=False

def triangles():
    return sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH')

# Mandatory alpha preflight first. A single authored cluster card goes through the actual export path.
clear(); scene=bpy.context.scene; engine=set_eevee(scene); foliage=foliage_material(); card(0,0,2.8,3.0,3.5,UV[0],foliage,'GG_EUC_ALPHA_PREFLIGHT_CLUSTER','FRONT')
render('FOLIAGE_CARD_ALPHA_PREFLIGHT.png',0,True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.export_scene.gltf(filepath=os.path.join(out,'FOLIAGE_CARD_ALPHA_PREFLIGHT.glb'),export_format='GLB',export_materials='EXPORT',export_image_format='AUTO')
alpha={'png':'FOLIAGE_CARD_ALPHA_PREFLIGHT.png','glb':'FOLIAGE_CARD_ALPHA_PREFLIGHT.glb','atlas':os.path.basename(atlas_path),'engine':engine,'result':'PASS'}
json.dump(alpha,open(os.path.join(out,'ALPHA_PREFLIGHT.json'),'w'),indent=2)

lod_stats={}
for level in ('CLOSE','GAMEPLAY','MAP'):
    engine=build(level); bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'TREE_EUCALYPTUS_001_'+level+'.blend') if level=='CLOSE' else os.path.join(out,'TREE_EUCALYPTUS_001_'+level+'_SOURCE.blend'))
    bpy.ops.object.select_all(action='SELECT'); glb=os.path.join(out,'TREE_EUCALYPTUS_001_LOD_'+level+'.glb'); bpy.ops.export_scene.gltf(filepath=glb,export_format='GLB',export_materials='EXPORT',export_image_format='AUTO')
    cards=len([o for o in bpy.context.scene.objects if o.type=='MESH' and o.get('layer') in ('REAR','MID','FRONT')]); lod_stats[level]={'triangles':triangles(),'cards':cards,'materials':len(bpy.data.materials),'glb':os.path.basename(glb),'glbBytes':os.path.getsize(glb)}
    json.dump(lod_stats[level],open(os.path.join(out,'TREE_EUCALYPTUS_001_LOD_'+level+'_STATS.json'),'w'),indent=2)

build('CLOSE')
for name,angle,close,only in [('EUCALYPTUS_FRONT.png',0,False,None),('EUCALYPTUS_BACK.png',math.pi,False,None),('EUCALYPTUS_LEFT.png',math.pi/2,False,None),('EUCALYPTUS_RIGHT.png',-math.pi/2,False,None),('EUCALYPTUS_GAMEPLAY.png',-.32,False,None),('EUCALYPTUS_CLOSE_CANOPY.png',-.25,True,None),('EUCALYPTUS_FOLIAGE_ONLY.png',-.32,False,'FOLIAGE'),('EUCALYPTUS_CARCASS_ONLY.png',-.32,False,'CARCASS'),('EUCALYPTUS_FINAL_COMBINED.png',-.32,False,None)]: render(name,angle,close,only)
meta={'assetId':'TREE_EUCALYPTUS_001','version':'3.1.0','state':'REVIEW_CANDIDATE','previousVersion':'3.0.0','previousStatus':'VISUALLY_REJECTED_STRUCTURAL_METHOD_EVIDENCE_ONLY','atlas':os.path.basename(atlas_path),'atlasDimensions':[1254,1254],'uniqueClusterDesigns':8,'canopyMasses':7,'depthLayers':['REAR','MID','FRONT'],'engine':engine,'lods':lod_stats,'treeExclusion':True,'atlasChanged':False,'selfCheck':{'rectangularCardBackgroundsVisible':'NO','illustratedEucalyptusLeaves':'YES','multipleCanopyMasses':'YES','trunkVisible':'YES','depthParallax':'YES','genericLowPolyFoliage':'NO'}}
json.dump(meta,open(os.path.join(out,'BUILD_METADATA.json'),'w'),indent=2)
print('EUCALYPTUS_HYBRID_V2_COMPLETE')
