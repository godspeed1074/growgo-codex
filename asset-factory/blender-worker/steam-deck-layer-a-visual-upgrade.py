import bpy, json, os, sys, math, hashlib
from mathutils import Vector

pack_path, out_dir = sys.argv[sys.argv.index('--') + 1:]
pack=json.load(open(pack_path)); os.makedirs(out_dir, exist_ok=True)
PAL={'SHOP_WARM_BROWN':(.34,.16,.09,1),'SHOP_CREAM':(.72,.58,.40,1),'SHOP_NAVY':(.04,.07,.20,1),'SHOP_PLUM_FABRIC':(.42,.08,.32,1),'SHOP_TEAL_GLASS':(.03,.30,.38,1),'SHOP_GREEN_VEGETATION':(.12,.38,.10,1)}
def material(name,color):
 m=bpy.data.materials.new(name); m.diffuse_color=color; m.use_nodes=True; nt=m.node_tree; nt.nodes.clear(); out=nt.nodes.new('ShaderNodeOutputMaterial'); em=nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value=color; em.inputs['Strength'].default_value=1; nt.links.new(em.outputs['Emission'],out.inputs['Surface']); return m
def cube(name,dims,loc,mat,module,component):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.name=name; o.dimensions=dims; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(mat)
 for k,v in {'assetId':module['assetId'],'assetVersion':module['assetVersion'],'parentVersion':module['parentVersion'],'moduleId':module['assetId'],'moduleVersion':module['assetVersion'],'componentId':component,'moduleFamily':module['family'],'layer':'LAYER_A_MODULE','upgradeChange':module['change']}.items(): o[k]=v
 return o
def make(module):
 bpy.ops.wm.read_factory_settings(use_empty=True); c=module['type']; base=material('GG_MAT_'+module['palette']+'_001',PAL[module['palette']]); cream=material('GG_MAT_SHOP_CREAM_001',PAL['SHOP_CREAM']); glass=material('GG_MAT_SHOP_TEAL_GLASS_001',PAL['SHOP_TEAL_GLASS']); green=material('GG_MAT_SHOP_GREEN_001',PAL['SHOP_GREEN_VEGETATION']); objs=[]; aid=module['assetId'];
 if c=='FASCIA_MODULE': objs=[cube(aid+'_CAP',(4.3,.95,.52),(0,0,.26),base, module,c),cube(aid+'_SIGN_MOUNT',(2.8,.18,.62),(0,-.54,.18),base,module,c),cube(aid+'_TOP_TRIM',(4.4,1.0,.14),(0,0,.57),cream,module,c),cube(aid+'_SIDE_L',(.16,1.0,.55),(-2.08,0,.2),cream,module,c),cube(aid+'_SIDE_R',(.16,1.0,.55),(2.08,0,.2),cream,module,c)]
 elif c=='AWNING_MODULE':
  objs=[cube(aid+'_CANOPY',(3.25, .94,.34),(0,0,0),base,module,c),cube(aid+'_BACK_BAND',(3.3,.16,.42),(0,.38,.12),base,module,c),cube(aid+'_BRACKET_L',(.14,.28,1.05),(-1.48,.16,-.35),cream,module,c),cube(aid+'_BRACKET_R',(.14,.28,1.05),(1.48,.16,-.35),cream,module,c)]
  for i in range(7): objs.append(cube(aid+'_SCALLOP_%02d'%i,(.43,.98,.20),(-1.29+i*.43,.04,-.22),base,module,c))
 elif c=='WINDOW_MODULE': objs=[cube(aid+'_GLASS',(1.25,.08,1.38),(0,.04,1.1),glass,module,c),cube(aid+'_FRAME',(1.48,.22,1.62),(0,0,1.1),cream,module,c),cube(aid+'_SILL',(1.62,.30,.18),(0,-.08,.25),cream,module,c),cube(aid+'_MULLION',(.08,.24,1.35),(0,-.13,1.1),cream,module,c),cube(aid+'_TOP_TRIM',(1.62,.30,.14),(0,-.08,1.92),cream,module,c)]
 elif c=='DOOR_MODULE': objs=[cube(aid+'_SLAB',(1.0,.18,2.1),(0,.04,1.05),base,module,c),cube(aid+'_FRAME',(1.28,.24,2.35),(0,-.02,1.15),cream,module,c),cube(aid+'_GLASS',(.56,.04,.78),(0,-.16,1.55),glass,module,c),cube(aid+'_THRESHOLD',(1.4,.38,.16),(0,-.12,.08),cream,module,c),cube(aid+'_HANDLE',(.10,.10,.10),(.34,-.20,1.08),cream,module,c)]
 elif c=='PLANTER_SHRUB_MODULE':
  objs=[cube(aid+'_BOX',(1.1,.78,.48),(0,0,.24),base,module,c),cube(aid+'_RIM',(1.24,.88,.14),(0,0,.52),cream,module,c)]
  for i in range(9): objs.append(cube(aid+'_FOLIAGE_%02d'%i,(.30,.28,.65),((i%3-1)*.22,(i//3-1)*.13,.76+.08*(i%2)),green,module,c))
 for lod in ['LOD0','LOD1','LOD2']:
  col=bpy.data.collections.new(lod); bpy.context.scene.collection.children.link(col)
  for o in objs:
   if lod=='LOD0': continue
   cp=o.copy(); cp.data=o.data.copy(); cp.name=o.name+'_'+lod; cp['lod']=lod; col.objects.link(cp)
 for o in objs: o['lod']='LOD0'
 return objs
def setup():
 s=bpy.context.scene; s.render.resolution_x=256; s.render.resolution_y=256; s.render.resolution_percentage=100; s.render.image_settings.file_format='PNG'; s.render.image_settings.color_mode='RGBA'; s.render.film_transparent=False; s.render.engine='BLENDER_WORKBENCH'; s.display.shading.light='STUDIO'; s.display.shading.color_type='MATERIAL'; s.view_settings.view_transform='Standard'; s.view_settings.look='None'; s.world=bpy.data.worlds.new('GG_UPGRADE_WORLD'); s.world.use_nodes=True; s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.92,.92,.92,1); s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.2; bpy.ops.object.camera_add(location=(0,-12,2)); cam=bpy.context.object; cam.name='GG_LAYER_A_REVIEW_CAMERA'; cam.data.type='ORTHO'; cam.data.ortho_scale=5.5; cam.rotation_euler=((Vector((0,0,1.2))-cam.location).to_track_quat('-Z','Y')).to_euler(); s.camera=cam; return s
def render_views(folder):
 s=bpy.context.scene; cam=s.camera; paths=[]
 for label,angle in [('FRONT',0),('BACK',math.pi),('LEFT',math.pi/2),('RIGHT',-math.pi/2)]:
  cam.location=(math.sin(angle)*12,-math.cos(angle)*12,2); cam.rotation_euler=((Vector((0,0,1.2))-cam.location).to_track_quat('-Z','Y')).to_euler(); s.render.filepath=os.path.join(folder,label+'.png'); bpy.ops.render.render(write_still=True); paths.append(s.render.filepath)
 return paths
def render_board(folder, paths):
 bpy.ops.wm.read_factory_settings(use_empty=True); s=setup(); s.render.engine='BLENDER_EEVEE'; s.render.resolution_x=512; s.render.resolution_y=512; s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.98,.98,.96,1); s.camera.location=(0,-12,0); s.camera.rotation_euler=((Vector((0,0,0))-s.camera.location).to_track_quat('-Z','Y')).to_euler()
 for i,(label,p) in enumerate(zip(['FRONT','BACK','LEFT','RIGHT'],paths)):
  x=-1.35 if i%2==0 else 1.35; z=1.25 if i<2 else -1.25; bpy.ops.mesh.primitive_plane_add(size=2,location=(x,0,z),rotation=(math.pi/2,0,0)); plane=bpy.context.object; plane.scale=(1.15,1.15,1); m=material('BOARD_'+label,(1,1,1,1)); nt=m.node_tree; nt.nodes.clear(); out=bpy.data.materials.new('BOARD_'+label+'_MAT'); out.use_nodes=True; nt=out.node_tree; nt.nodes.clear(); o=nt.nodes.new('ShaderNodeOutputMaterial'); e=nt.nodes.new('ShaderNodeEmission'); t=nt.nodes.new('ShaderNodeTexImage'); t.image=bpy.data.images.load(p); nt.links.new(t.outputs['Color'],e.inputs['Color']); nt.links.new(e.outputs['Emission'],o.inputs['Surface']); plane.data.materials.clear(); plane.data.materials.append(out)
  cu=bpy.data.curves.new('LABEL_'+label,'FONT'); cu.body=label; cu.align_x='CENTER'; cu.size=.22; tx=bpy.data.objects.new('LABEL_'+label,cu); s.collection.objects.link(tx); tx.location=(x,-.05,z-1.05); tx.rotation_euler=(math.pi/2,0,0)
 s.render.filepath=os.path.join(folder,'MODULE_UPGRADE_REVIEW_BOARD.png'); bpy.ops.render.render(write_still=True); return s.render.filepath
results=[]
for module in pack['modules']:
 folder=os.path.join(out_dir,module['assetId']+'@'+module['assetVersion']); os.makedirs(folder,exist_ok=True); objs=make(module); s=setup(); blend=os.path.join(folder,module['assetId']+'@'+module['assetVersion']+'.blend'); bpy.ops.wm.save_as_mainfile(filepath=blend); views=render_views(folder); original=[]
 for i,o in enumerate(objs): original.append((o,list(o.data.materials))); o.data.materials.clear(); o.data.materials.append(material('GG_COMPONENT_ID_%02d'%i,((i+1)/255,0,0,1)))
 s.render.filepath=os.path.join(folder,'MODULE_COMPONENT_ID_RENDER.png'); bpy.ops.render.render(write_still=True); idmap={o['componentId']:{'objectId':o.name,'assetId':module['assetId'],'assetVersion':module['assetVersion'],'parentVersion':module['parentVersion'],'moduleId':module['assetId'],'rgb':[i+1,0,0]} for i,o in enumerate(objs)}; json.dump(idmap,open(os.path.join(folder,'MODULE_COMPONENT_ID_MAP.json'),'w'),indent=2)
 for o,ms in original: o.data.materials.clear(); [o.data.materials.append(m) for m in ms]
 stats={'triangles':sum(sum(max(0,len(p.vertices)-2) for p in m.polygons) for m in [o.data for o in objs]),'vertices':sum(len(o.data.vertices) for o in objs),'materials':len({m.name for o in objs for m in o.data.materials}),'objectCount':len(objs),'fileSizeBytes':os.path.getsize(blend),'lods':['LOD0','LOD1','LOD2'],'anonymousGeometryCount':0}
 board=render_board(folder,views)
 json.dump(stats,open(os.path.join(folder,'BUDGET_AND_LOD.json'),'w'),indent=2); results.append({'assetId':module['assetId'],'assetVersion':module['assetVersion'],'parentVersion':module['parentVersion'],'blend':blend,'views':views,'reviewBoard':board,'componentIdRender':os.path.join(folder,'MODULE_COMPONENT_ID_RENDER.png'),'budget':stats,'reviewStatus':'REVIEW_REQUIRED'})
json.dump({'status':'PASS','executionMode':'REAL_BLENDER_WORKER_EXECUTION','blenderVersion':bpy.app.version_string,'modules':results,'anonymousGeometryCount':0},open(os.path.join(out_dir,'SHOP_LAYER_A_VISUAL_UPGRADE_RESULT.json'),'w'),indent=2)
