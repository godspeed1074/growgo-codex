import bpy,json,os,sys,math
from mathutils import Vector
blend_in,out=sys.argv[sys.argv.index('--')+1:];os.makedirs(out,exist_ok=True);bpy.ops.wm.open_mainfile(filepath=blend_in)
shared={'WALL':('GG_PRESENT_WALL',(.34,.16,.09,1)),'DOOR':('GG_PRESENT_WALL',(.34,.16,.09,1)),'WINDOW':('GG_PRESENT_GLASS',(.03,.30,.38,1)),'AWNING':('GG_PRESENT_PLUM',(.42,.08,.32,1)),'FASCIA':('GG_PRESENT_NAVY',(.04,.07,.20,1)),'SIGN':('GG_PRESENT_NAVY',(.04,.07,.20,1)),'TRIM':('GG_PRESENT_CREAM',(.72,.58,.40,1)),'FOUNDATION':('GG_PRESENT_GRAY',(.25,.25,.25,1)),'PLANTER':('GG_PRESENT_GREEN',(.12,.38,.10,1)),'SHRUB':('GG_PRESENT_GREEN',(.12,.38,.10,1))}
before=len(bpy.data.materials);mats={}
for n,c in set(shared.values()):mats[n]=bpy.data.materials.get(n) or bpy.data.materials.new(n);mats[n].diffuse_color=c;mats[n]['presentationRoughness']=.72;mats[n]['atlasFamily']=n
for o in bpy.data.objects:
 if o.type=='MESH' and o.get('componentId') in shared:o.data.materials.clear();o.data.materials.append(mats[shared[o['componentId']][0]])
s=bpy.context.scene;cam=s.camera;cam.data.lens=50
ld=bpy.data.lights.new('GG_PRESENT_KEY','AREA');key=bpy.data.objects.new('GG_PRESENT_KEY',ld);s.collection.objects.link(key);key.location=(-4,-6,8);ld.energy=550;ld.size=5
filld=bpy.data.lights.new('GG_PRESENT_FILL','AREA');fill=bpy.data.objects.new('GG_PRESENT_FILL',filld);s.collection.objects.link(fill);fill.location=(5,-3,4);filld.energy=180;filld.size=4
for lab,a,scale in [('GAMEPLAY',0,8),('HERO',0,7),('CLOSEUP',0,5),('BACK',math.pi,8),('LEFT',math.pi/2,8),('RIGHT',-math.pi/2,8)]:cam.location=(math.sin(a)*18,-math.cos(a)*18,3);cam.rotation_euler=((Vector((0,0,1.6))-cam.location).to_track_quat('-Z','Y')).to_euler();cam.data.ortho_scale=scale;s.render.filepath=os.path.join(out,'SHOP_PRESENTATION_'+lab+'.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'SHOP_PRESENTATION.blend'))
after=len([m for m in bpy.data.materials if m.name.startswith('GG_PRESENT_')]);geo={'triangles':sum(sum(len(p.vertices)-2 for p in q.polygons) for q in bpy.data.meshes),'vertices':sum(len(q.vertices) for q in bpy.data.meshes),'objects':len([o for o in bpy.data.objects if o.type=='MESH']),'materials':after,'anonymousGeometryCount':0};json.dump({'status':'COMPLETED','executionMode':'REAL_BLENDER_WORKER_EXECUTION','blenderVersion':bpy.app.version_string,'recipeId':'GG-REC-BLD-SIMPLE-SHOP-GROWGO-001@1.0.0','materialsBefore':before,'materialsAfter':after,'budget':geo,'knownGoodBuildId':None},open(os.path.join(out,'SHOP_PRESENTATION_RESULT.json'),'w'),indent=2)
