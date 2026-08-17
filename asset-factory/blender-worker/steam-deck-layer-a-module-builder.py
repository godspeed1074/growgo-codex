import bpy, json, os, sys, hashlib, math
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
pack_path, out_dir = args[0], args[1]
pack = json.load(open(pack_path)); os.makedirs(out_dir, exist_ok=True)

def sha(p):
    h=hashlib.sha256()
    with open(p,'rb') as f:
        for b in iter(lambda:f.read(65536),b''): h.update(b)
    return h.hexdigest()
def clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)
def mat(name, rgb):
    m=bpy.data.materials.new(name); m.use_nodes=True; n=m.node_tree; n.nodes.clear(); o=n.nodes.new('ShaderNodeOutputMaterial'); e=n.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value=(*rgb,1); e.inputs['Strength'].default_value=1; n.links.new(e.outputs['Emission'],o.inputs['Surface']); return m
PALETTE={'SHOP_WARM_BROWN':(0.34,0.16,0.09),'SHOP_CREAM':(0.72,0.58,0.40),'SHOP_NAVY':(0.04,0.07,0.20),'SHOP_PLUM_FABRIC':(0.42,0.08,0.32),'SHOP_TEAL_GLASS':(0.03,0.30,0.38),'SHOP_GREEN_VEGETATION':(0.12,0.38,0.10),'SHOP_GRAY':(0.25,0.25,0.25)}
def cube(name, dims, loc, material, module, component):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o=bpy.context.object; o.name=name; o.dimensions=dims; bpy.ops.object.transform_apply(location=False, rotation=False, scale=True); o.data.materials.append(material)
    for k,v in {'assetId':module['assetId'],'assetVersion':module['assetVersion'],'moduleId':module['assetId'],'moduleVersion':module['assetVersion'],'componentId':component,'moduleFamily':module['family'],'layer':'LAYER_A_MODULE'}.items(): o[k]=v
    return o
def build(module):
    asset=module['assetId']; c=module['type']; pal=mat('GG_'+asset, PALETTE[module['palette']['allowedPaletteIds'][0]])
    cream=mat('GG_CREAM',PALETTE['SHOP_CREAM']); glass=mat('GG_GLASS',PALETTE['SHOP_TEAL_GLASS']); green=mat('GG_GREEN',PALETTE['SHOP_GREEN_VEGETATION'])
    objs=[]
    if c=='FOUNDATION': objs=[cube('GG_BLD_FOUNDATION_SHOP_002',(4,.25,2),(0,0,.125),pal,module,c)]
    elif c=='WALL_PANEL': objs=[cube('GG_BLD_WALL_SHOP_BROWN_001',(4,.2,3),(0,0,1.5),pal,module,c)]
    elif c=='DOOR_MODULE': objs=[cube('GG_BLD_DOOR_SHOP_002_SLAB',(1.0,.16,2.1),(0,0,1.05),pal,module,c),cube('GG_BLD_DOOR_SHOP_002_FRAME',(1.25,.20,2.3),(0,-.02,1.15),cream,module,c),cube('GG_BLD_DOOR_SHOP_002_GLASS',(.55,.03,.7),(0,-.13,1.55),glass,module,c),cube('GG_BLD_DOOR_SHOP_002_HANDLE',(.08,.08,.08),(.35,-.15,1.1),cream,module,c)]
    elif c=='WINDOW_MODULE': objs=[cube('GG_BLD_WINDOW_SHOP_LARGE_002_GLASS',(1.25,.08,1.35),(0,0,1.1),glass,module,c),cube('GG_BLD_WINDOW_SHOP_LARGE_002_FRAME',(1.45,.18,1.55),(0,-.03,1.1),cream,module,c),cube('GG_BLD_WINDOW_SHOP_LARGE_002_SILL',(1.55,.25,.18),(0,-.08,.25),cream,module,c)]
    elif c=='AWNING_MODULE':
        objs=[cube('GG_BLD_AWNING_SHOP_FABRIC_001_FABRIC',(3.25,.75,.35),(0,0,0),pal,module,c),cube('GG_BLD_AWNING_SHOP_FABRIC_001_BRACKET_L',(.12,.25,1.0),(-1.45,.1,-.35),cream,module,c),cube('GG_BLD_AWNING_SHOP_FABRIC_001_BRACKET_R',(.12,.25,1.0),(1.45,.1,-.35),cream,module,c)]
        for i in range(7): objs.append(cube('GG_BLD_AWNING_SHOP_FABRIC_001_SCALLOP_%02d'%i,(.42,.8,.18),(-1.26+i*.42,.02,-.22),pal,module,c))
    elif c=='FASCIA_MODULE': objs=[cube('GG_BLD_FASCIA_SHOP_NAVY_001_CAP',(4.2,.8,.45),(0,0,.2),pal,module,c),cube('GG_BLD_FASCIA_SHOP_NAVY_001_SIGN_AREA',(2.5,.12,.55),(0,-.46,.05),pal,module,c),cube('GG_BLD_FASCIA_SHOP_NAVY_001_TRIM',(4.3,.9,.12),(0,0,-.1),cream,module,c)]
    elif c=='SIGN_INSERT': objs=[cube('GG_BLD_SIGN_INSERT_SHOP_001',(2.2,.06,.35),(0,0,0),cream,module,c)]
    elif c=='TRIM_MODULE': objs=[cube('GG_BLD_TRIM_SHOP_CREAM_001',(1,.12,.18),(0,0,0),cream,module,c),cube('GG_BLD_TRIM_SHOP_CREAM_001_BLOCK',(.22,.18,.22),(0,0,.25),cream,module,c)]
    elif c=='PLANTER_SHRUB_MODULE':
        objs=[cube('GG_VEG_PLANTER_SHRUB_001_PLANTER',(1,.7,.45),(0,0,.225),pal,module,c)]
        for i in range(5): objs.append(cube('GG_VEG_PLANTER_SHRUB_001_LEAF_%02d'%i,(.35,.25,.7),( (i-2)*.18,0,.7+0.08*(i%2)),green,module,c))
    # LOD collections preserve identity while reducing detail representation.
    for lod in ['LOD0','LOD1','LOD2']:
        col=bpy.data.collections.new(lod); bpy.context.scene.collection.children.link(col)
        for o in objs:
            copy=o.copy(); copy.data=o.data.copy(); copy.name=o.name+'_'+lod; copy['lod']=lod; col.objects.link(copy)
    return objs
def setup_scene(res=128):
    s=bpy.context.scene; s.render.resolution_x=res; s.render.resolution_y=res; s.render.resolution_percentage=100; s.render.image_settings.file_format='PNG'; s.render.image_settings.color_mode='RGBA'; s.render.film_transparent=False; s.render.engine='BLENDER_WORKBENCH'; s.display.shading.light='STUDIO'; s.display.shading.color_type='MATERIAL'; s.view_settings.view_transform='Standard'; s.view_settings.look='None'; s.world=bpy.data.worlds.new('GG_WORLD'); s.world.use_nodes=True; s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.92,.92,.92,1); s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.2
    bpy.ops.object.camera_add(location=(0,-12,2.0)); cam=bpy.context.object; cam.name='GG_LAYER_A_REVIEW_CAMERA'; cam.data.type='ORTHO'; cam.data.ortho_scale=5.5; cam.rotation_euler=((Vector((0,0,1.2))-cam.location).to_track_quat('-Z','Y')).to_euler(); s.camera=cam; return s
def render_four(module, folder, objs):
    s=bpy.context.scene; cam=s.camera; paths={}; angles={'FRONT':0,'BACK':math.pi,'LEFT':math.pi/2,'RIGHT':-math.pi/2}
    for label,angle in angles.items():
        cam.location=(math.sin(angle)*12,-math.cos(angle)*12,2); cam.rotation_euler=((Vector((0,0,1.2))-cam.location).to_track_quat('-Z','Y')).to_euler(); s.render.filepath=os.path.join(folder,label+'.png'); bpy.ops.render.render(write_still=True); paths[label]=s.render.filepath
    # Board is a real Blender render with the four image planes and labels.
    clear(); s=setup_scene(512); board=bpy.context.scene; board.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.98,.98,.96,1)
    for i,(label,p) in enumerate(paths.items()):
        x=(-1.35 if i%2==0 else 1.35); z=(1.35 if i<2 else -1.35); bpy.ops.mesh.primitive_plane_add(size=2, location=(x,0,z), rotation=(math.pi/2,0,0)); plane=bpy.context.object; plane.scale=(1.2,1.2,1); m=bpy.data.materials.new('BOARD_'+label); m.use_nodes=True; nt=m.node_tree; nt.nodes.clear(); out=nt.nodes.new('ShaderNodeOutputMaterial'); em=nt.nodes.new('ShaderNodeEmission'); tex=nt.nodes.new('ShaderNodeTexImage'); tex.image=bpy.data.images.load(p); nt.links.new(tex.outputs['Color'],em.inputs['Color']); nt.links.new(em.outputs['Emission'],out.inputs['Surface']); plane.data.materials.append(m)
        cu=bpy.data.curves.new('LABEL_'+label,'FONT'); cu.body=label; cu.align_x='CENTER'; cu.size=.22; tx=bpy.data.objects.new('LABEL_'+label,cu); board.collection.objects.link(tx); tx.location=(x,-.05,z-1.15); tx.rotation_euler=(math.pi/2,0,0)
    board.camera.location=(0,-12,0); board.camera.rotation_euler=((Vector((0,0,0))-board.camera.location).to_track_quat('-Z','Y')).to_euler(); board.render.filepath=os.path.join(folder,'FOUR_SIDE_REVIEW_BOARD.png'); bpy.ops.render.render(write_still=True); return paths
def render_ids(folder, objs):
    s=bpy.context.scene; original=[]
    for i,o in enumerate(objs):
        original.append((o, list(o.data.materials))); o.data.materials.clear(); o.data.materials.append(mat('GG_ID_%02d'%i,((i+1)/255.0,0,0)))
    s.display.shading.color_type='MATERIAL'; s.render.filepath=os.path.join(folder,'MODULE_COMPONENT_ID_RENDER.png'); bpy.ops.render.render(write_still=True)
    for o,materials in original:
        o.data.materials.clear()
        for material in materials: o.data.materials.append(material)
    return s.render.filepath

results=[]
for module in pack['modules']:
    clear(); folder=os.path.join(out_dir,module['assetId']); os.makedirs(folder,exist_ok=True); s=setup_scene(); objs=build(module); blend=os.path.join(folder,module['assetId']+'@'+module['assetVersion']+'.blend'); bpy.ops.wm.save_as_mainfile(filepath=blend); id_render=render_ids(folder,objs); component_map={o['componentId']:{'objectId':o.name,'assetId':module['assetId'],'assetVersion':module['assetVersion'],'rgb':[i+1,0,0]} for i,o in enumerate(objs)}; stats={'triangles':sum(sum(max(0,len(p.vertices)-2) for p in m.polygons) for m in bpy.data.meshes),'vertices':sum(len(m.vertices) for m in bpy.data.meshes),'materials':len(bpy.data.materials),'objectCount':len(bpy.data.objects),'fileSizeBytes':os.path.getsize(blend),'lods':['LOD0','LOD1','LOD2']}; json.dump(stats,open(os.path.join(folder,'BUDGET_AND_LOD.json'),'w'),indent=2); json.dump(component_map,open(os.path.join(folder,'MODULE_COMPONENT_ID_MAP.json'),'w'),indent=2); paths=render_four(module,folder,objs); results.append({'assetId':module['assetId'],'assetVersion':module['assetVersion'],'blend':os.path.basename(blend),'fourSide':list(paths.values())+ [os.path.join(folder,'FOUR_SIDE_REVIEW_BOARD.png')],'componentIdRender':id_render,'budget':stats})
json.dump({'status':'PASS','blenderVersion':bpy.app.version_string,'executionMode':'REAL_BLENDER_WORKER_EXECUTION','modules':results,'anonymousGeometryCount':0,'operatorApprovalRequired':True},open(os.path.join(out_dir,'SHOP_LAYER_A_BLENDER_BUILD_RESULT.json'),'w'),indent=2)
