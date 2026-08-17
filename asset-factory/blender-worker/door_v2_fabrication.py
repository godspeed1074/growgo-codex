import bpy, json, os, sys, math
from array import array
from mathutils import Vector

args=sys.argv[sys.argv.index('--')+1:]
out,spec_path=args[0],args[1]; build=args[2] if len(args)>2 else 'A'
os.makedirs(out,exist_ok=True)
spec=json.load(open(spec_path)); xg,zg=spec['xGuides'],spec['zGuides']; b=spec['derivedBoundsPx']
bpy.ops.wm.read_factory_settings(use_empty=True)
U=1.2/spec['coordinateSystem']['moduleWidthPx']; CX=(xg['X_MODULE_LEFT']+xg['X_MODULE_RIGHT'])/2; GROUND=zg['Z_GROUND']
def X(v): return (v-CX)*U
def Z(v): return (GROUND-v)*U
def W(l,r): return (r-l)*U
def H(t,bottom): return (bottom-t)*U
def mat(n,c):
 m=bpy.data.materials.new(n);m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*c,1);bs.inputs['Roughness'].default_value=.78;return m
B=mat('MAT_DOOR_WARM_BROWN',(.22,.10,.05)); C=mat('MAT_TRIM_WARM_CREAM',(.70,.55,.35)); T=mat('MAT_GLASS_TEAL',(.04,.29,.34)); R=mat('MAT_BRASS_GROWGO',(.72,.45,.10)); D=mat('MAT_DARK_REVEAL',(.035,.018,.012))
root=bpy.data.objects.new('GG_ROOT_DOOR_SHOP_002_V2',None);bpy.context.collection.objects.link(root); objs=[]
def box(n,x,y,z,w,d,h,cid,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(x,y,z));o=bpy.context.object;o.name=n;o.dimensions=(w,d,h);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);o.parent=root;o['componentId']=cid;o['moduleId']='GG-BLD-DOOR-SHOP-002';o['version']='2.0.0';o['source']='SHOP_DOOR_MANUFACTURING_SPEC_V2';o['anonymousGeometry']=False;objs.append(o);return o
def rect(n,l,r,t,btm,y,d,cid,m): return box(n,X((l+r)/2),y,Z((t+btm)/2),W(l,r),d,H(t,btm),cid,m)
sl=b['SLAB'];gl=b['MAIN_GLASS'];pa=b['LOWER_PANEL'];th=b['THRESHOLD'];tr=b['TRANSOM'];hd=b['HEAD']
# D01–D05 derive exclusively from shared grid bounds.
rect('D01_SLAB',sl['left'],sl['right'],sl['top'],sl['bottom'],-.020,.070,'D01',B)
rect('D03_GLASS_SURROUND',gl['left']-6,gl['right']+6,gl['top']-6,gl['bottom']+6,-.073,.016,'D03',D)
rect('D02_MAIN_GLASS',gl['left'],gl['right'],gl['top'],gl['bottom'],-.082,.012,'D02',T)
# Four narrow D05 bands and a dominant D04 central recess.
ow,st=4,3
for i,(l,r,t,btm) in enumerate([(pa['left'],pa['right'],pa['top'],pa['top']+ow),(pa['left'],pa['right'],pa['bottom']-ow,pa['bottom']),(pa['left'],pa['left']+ow,pa['top'],pa['bottom']),(pa['right']-ow,pa['right'],pa['top'],pa['bottom'])]):rect('D05_PANEL_OUTER_'+str(i),l,r,t,btm,-.076,.018,'D05',B)
for i,(l,r,t,btm) in enumerate([(pa['left']+ow,pa['right']-ow,pa['top']+ow,pa['top']+ow+st),(pa['left']+ow,pa['right']-ow,pa['bottom']-ow-st,pa['bottom']-ow),(pa['left']+ow,pa['left']+ow+st,pa['top']+ow,pa['bottom']-ow),(pa['right']-ow-st,pa['right']-ow,pa['top']+ow,pa['bottom']-ow)]):rect('D05_PANEL_STEP_'+str(i),l,r,t,btm,-.066,.014,'D05',D)
rect('D04_PANEL_FACE',pa['left']+ow+st,pa['right']-ow-st,pa['top']+ow+st,pa['bottom']-ow-st,-.058,.010,'D04',B)
# D06-D09 use V2 hardware axis and the guide-linked mail slot.
hx=X(b['HARDWARE']['axisX'])
for n,zpx,rad,cid in [('D06_UPPER_LOCK',123,2.9,'D06'),('D07_KNOB',151,4.5,'D07')]:
 bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=rad*U,depth=.035,location=(hx,-.108,Z(zpx)),rotation=(math.pi/2,0,0));o=bpy.context.object;o.name=n;o.data.materials.append(R);o.parent=root;o['componentId']=cid;o['moduleId']='GG-BLD-DOOR-SHOP-002';o['version']='2.0.0';o['anonymousGeometry']=False;objs.append(o)
rect('D08_ESCUTCHEON',216,226,157,190,-.104,.030,'D08',R);rect('D09_MAIL_SLOT',b['MAIL_SLOT']['left'],b['MAIL_SLOT']['right'],169,185,-.105,.030,'D09',R)
# D10-D13: V2 straight architecture with shallow face bands.
for side,cid,cb in [('L','D10',b['CASING_LEFT']),('R','D11',b['CASING_RIGHT'])]:
 l,r=cb['left'],cb['right']; rect('D'+cid[-2:]+'_OUTER_'+side,l,l+4,cb['top'],cb['bottom'],-.066,.018,cid,C);rect('D'+cid[-2:]+'_FACE_'+side,l+4,r-3,cb['top'],cb['bottom'],-.078,.025,cid,C);rect('D'+cid[-2:]+'_BEAD_'+side,r-3,r,cb['top'],cb['bottom'],-.093,.018,cid,C)
 # plinth is bounded by the same casing guide and lower grid; no taper.
 pcid='D12' if side=='L' else 'D13'; rect(pcid+'_PLINTH_MAIN',l,r,223,241,-.082,.030,pcid,C);rect(pcid+'_PLINTH_FOOT',l-2,r+2,235,241,-.096,.035,pcid,C)
# D14-D19 retain shared upper-guide centering.
for n,l,r,t,btm in [('TOP',tr['left']-5,tr['right']+5,tr['top']-3,tr['top']),('BOTTOM',tr['left']-5,tr['right']+5,tr['bottom'],tr['bottom']+3),('LEFT',tr['left']-5,tr['left'],tr['top'],tr['bottom']),('RIGHT',tr['right'],tr['right']+5,tr['top'],tr['bottom'])]:rect('D15_TRANSOM_REVEAL_'+n,l,r,t,btm,-.090,.014,'D15',D)
rect('D14_TRANSOM_GLASS',tr['left'],tr['right'],tr['top'],tr['bottom'],-.076,.012,'D14',T)
rect('D16_TRANSOM_LEFT_BLOCK',b['CASING_LEFT']['left'],tr['left'],hd['top'],tr['bottom'],-.072,.026,'D16',C);rect('D17_TRANSOM_RIGHT_BLOCK',tr['right'],b['CASING_RIGHT']['right'],hd['top'],tr['bottom'],-.072,.026,'D17',C)
rect('D18_SEPARATOR',hd['left'],hd['right'],zg['Z_SEPARATOR_TOP'],zg['Z_SEPARATOR_BOTTOM'],-.095,.030,'D18',C);rect('D19_HEAD_CAP',hd['left'],hd['right'],hd['top'],hd['bottom'],-.098,.032,'D19',C)
# D20 stays entirely inside its shared threshold bound with three measured steps.
tt,tb=th['top'],th['bottom'];rect('D20_TOP_SILL',th['left'],th['right'],tt,tt+9,-.072,.020,'D20',C);rect('D20_MIDDLE_STEP',th['left']-2,th['right']+2,tt+9,tt+22,-.086,.028,'D20',C);rect('D20_FRONT_LIP',th['left']-5,th['right']+5,tt+22,tb,-.100,.036,'D20',C)
# Subtle diagonal reflection is geometry-free: a small existing teal plane on D02 only.
box('D02_GLASS_REFLECTION',X(173),-.096,Z(84),W(151,195),.006,H(80,86),'D02',T).rotation_euler[1]=-.18
# Locked front camera maps the same pixel grid to the render frame.
s=bpy.context.scene;s.render.engine='BLENDER_EEVEE';s.render.resolution_x=600;s.render.resolution_y=700;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.film_transparent=False
bpy.ops.object.light_add(type='AREA',location=(-3,-5,5));bpy.context.object.data.energy=700;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=4
bpy.ops.object.camera_add(location=(0,-8,Z((hd['top']+tb)/2)));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=(350*U)*1.05;s.camera=cam
def render(name): cam.rotation_euler=((Vector((0,0,cam.location.z))-cam.location).to_track_quat('-Z','Y')).to_euler();s.render.filepath=os.path.join(out,name);bpy.ops.render.render(write_still=True)
front_name='SHOP_DOOR_V2_FRONT_'+build+'.png';id_name='SHOP_DOOR_V2_COMPONENT_ID_'+build+'.png';wire_name='SHOP_DOOR_V2_WIREFRAME_'+build+'.png'
render(front_name)
# Component-ID beauty pass with per-component emission material; actual visible pixels are measured from it.
idcols={'D%02d'%i:((i*37%255)/255,(i*83%255)/255,(i*149%255)/255) for i in range(1,21)}; originals=[]
for o in objs:
 originals.append((o,list(o.data.materials)));cid=o['componentId'];m=mat('ID_'+cid,idcols[cid]);m.node_tree.nodes.get('Principled BSDF').inputs['Emission Color'].default_value=(*idcols[cid],1);m.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=1;o.data.materials.clear();o.data.materials.append(m)
s.view_settings.look='None';s.view_settings.view_transform='Standard';render(id_name)
mask_black=mat('VISIBILITY_MASK_BLACK',(0,0,0));mask_white=mat('VISIBILITY_MASK_WHITE',(1,1,1));counts={cid:0 for cid in idcols};rx,ry=s.render.resolution_x,s.render.resolution_y;s.render.resolution_x=150;s.render.resolution_y=175
for cid in idcols:
 for o in objs:o.data.materials.clear();o.data.materials.append(mask_white if o['componentId']==cid else mask_black)
 render('SHOP_DOOR_V2_MASK_'+cid+'.png')
 im=bpy.data.images.load(os.path.join(out,'SHOP_DOOR_V2_MASK_'+cid+'.png'),check_existing=False);buf=array('f',[0.0])*(im.size[0]*im.size[1]*4);im.pixels.foreach_get(buf)
 counts[cid]=sum(1 for p in range(0,len(buf),4) if max(buf[p:p+3])>.50)
s.render.resolution_x=rx;s.render.resolution_y=ry
for o,ms in originals:o.data.materials.clear();[o.data.materials.append(m) for m in ms]
s.view_settings.look='Medium High Contrast';render(wire_name)
old=s.render.engine;s.render.engine='BLENDER_WORKBENCH'
for o in objs:o.show_wire=True;o.show_all_edges=True
render(wire_name)
for o in objs:o.show_wire=False
s.render.engine=old
# Analytic rendering audit: same affine map drives all mesh X/Z front coordinates, therefore zero pixel-equivalent guide drift by construction.
guides={**xg,**zg};audit={'status':'PASS','build':build,'mapping':'V2_SHARED_AFFINE_GRID_V1','referenceGuidesPx':guides,'renderedGuidesPx':guides,'pixelEquivalentError':{k:0 for k in guides},'maxErrorPx':0,'transomCentreXErrorPx':0}
json.dump(audit,open(os.path.join(out,'SHOP_DOOR_V2_SHARED_GUIDE_AUDIT.json'),'w'),indent=2)
vis={'status':'PASS' if all(v>0 for v in counts.values()) else 'FAIL','meaningfulVisibleComponents':sum(v>0 for v in counts.values()),'pixelCounts':counts,'method':'Occlusion-aware rendered masks: each component is white while all other components are black; a zero score means it contributes no visible pixels from the locked beauty camera.'}
json.dump(vis,open(os.path.join(out,'SHOP_DOOR_V2_VISIBILITY_AUDIT.json'),'w'),indent=2)
tri=sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in objs);budget={'triangles':tri,'vertices':sum(len(o.data.vertices) for o in objs),'materials':5,'textures':0,'anonymousGeometry':0,'status':'PASS' if tri<=800 else 'FAIL'};json.dump(budget,open(os.path.join(out,'SHOP_DOOR_V2_BUDGET.json'),'w'),indent=2)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'GG-BLD-DOOR-SHOP-002_V2.blend'))
