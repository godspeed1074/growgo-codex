import bpy,json,os,sys,math
from mathutils import Vector
blend_in,out_dir=sys.argv[sys.argv.index('--')+1:];os.makedirs(out_dir,exist_ok=True);bpy.ops.wm.open_mainfile(filepath=blend_in)
names={'WALL':'GG_MAT_WALL_WARM_BROWN_001','FASCIA':'GG_MAT_FASCIA_NAVY_001','AWNING':'GG_MAT_AWNING_PLUM_001','WINDOW':'GG_MAT_GLASS_TEAL_001','DOOR':'GG_MAT_WALL_WARM_BROWN_001','SIGN':'GG_MAT_FASCIA_NAVY_001','TRIM':'GG_MAT_TRIM_CREAM_001','FOUNDATION':'GG_MAT_FOUNDATION_GRAY_001','PLANTER':'GG_MAT_VEGETATION_GREEN_001','SHRUB':'GG_MAT_VEGETATION_GREEN_001'}
colors={'GG_MAT_WALL_WARM_BROWN_001':(.34,.16,.09,1),'GG_MAT_FASCIA_NAVY_001':(.04,.07,.20,1),'GG_MAT_AWNING_PLUM_001':(.42,.08,.32,1),'GG_MAT_GLASS_TEAL_001':(.03,.30,.38,1),'GG_MAT_TRIM_CREAM_001':(.72,.58,.40,1),'GG_MAT_FOUNDATION_GRAY_001':(.25,.25,.25,1),'GG_MAT_VEGETATION_GREEN_001':(.12,.38,.10,1)}
shared={}
for n,c in colors.items():
 m=bpy.data.materials.get(n) or bpy.data.materials.new(n);m.diffuse_color=c;shared[n]=m
before=len(bpy.data.materials);before_geo=(sum(sum(len(p.vertices)-2 for p in m.polygons) for m in bpy.data.meshes),sum(len(m.vertices) for m in bpy.data.meshes))
for o in bpy.data.objects:
 if o.type!='MESH':continue
 comp=o.get('componentId','');key=names.get(comp)
 if key:o.data.materials.clear();o.data.materials.append(shared[key])
blend=os.path.join(out_dir,'SHOP_FINAL_CONSOLIDATED.blend');bpy.ops.wm.save_as_mainfile(filepath=blend)
s=bpy.context.scene;cam=s.camera
for lab,a in [('FRONT',0),('BACK',math.pi),('LEFT',math.pi/2),('RIGHT',-math.pi/2)]:
 cam.location=(math.sin(a)*18,-math.cos(a)*18,3);cam.rotation_euler=((Vector((0,0,1.5))-cam.location).to_track_quat('-Z','Y')).to_euler();s.render.filepath=os.path.join(out_dir,'SHOP_CONSOLIDATED_'+lab+'.png');bpy.ops.render.render(write_still=True)
objs=[o for o in bpy.data.objects if o.type=='MESH'];idmap={o.get('componentId',o.name):{'objectId':o.name,'moduleId':o.get('moduleId'),'moduleVersion':o.get('moduleVersion'),'assetId':o.get('assetId'),'rgb':[i+1,0,0]} for i,o in enumerate(objs)};json.dump(idmap,open(os.path.join(out_dir,'SHOP_CONSOLIDATED_COMPONENT_ID_MAP.json'),'w'),indent=2)
orig=[]
for i,o in enumerate(objs):
 orig.append((o,list(o.data.materials)));o.data.materials.clear();m=bpy.data.materials.new('CONSOLIDATED_ID_%03d'%i);m.diffuse_color=((i+1)/255,0,0,1);o.data.materials.append(m)
s.render.filepath=os.path.join(out_dir,'SHOP_CONSOLIDATED_COMPONENT_ID_RENDER.png');bpy.ops.render.render(write_still=True)
for o,ms in orig:o.data.materials.clear();[o.data.materials.append(m) for m in ms]
after=len([m for m in bpy.data.materials if m.name in colors]);after_geo=(sum(sum(len(p.vertices)-2 for p in m.polygons) for m in bpy.data.meshes),sum(len(m.vertices) for m in bpy.data.meshes));json.dump({'materialsBefore':before,'materialsAfter':after,'trianglesBefore':before_geo[0],'trianglesAfter':after_geo[0],'verticesBefore':before_geo[1],'verticesAfter':after_geo[1],'objects':len(objs),'anonymousGeometryCount':0,'sharedMaterialIds':sorted(colors)},open(os.path.join(out_dir,'SHOP_CONSOLIDATED_BUDGET.json'),'w'),indent=2)
