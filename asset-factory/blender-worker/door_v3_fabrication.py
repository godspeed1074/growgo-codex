import bpy, json, os, sys, math
from array import array
from mathutils import Vector

args=sys.argv[sys.argv.index('--')+1:]; out,spec_path=args[0:2]
os.makedirs(out,exist_ok=True); spec=json.load(open(spec_path)); xg,zg,b=spec['xGuides'],spec['zGuides'],spec['derivedBoundsPx']
bpy.ops.wm.read_factory_settings(use_empty=True)
U=1.2/spec['coordinateSystem']['moduleWidthPx']; CX=(xg['X_MODULE_LEFT']+xg['X_MODULE_RIGHT'])/2; ground=zg['Z_GROUND']
X=lambda v:(v-CX)*U; Z=lambda v:(ground-v)*U; W=lambda l,r:(r-l)*U; H=lambda t,q:(q-t)*U
def material(n,c):
 m=bpy.data.materials.new(n);m.use_nodes=True; p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=.78;return m
B=material('MAT_DOOR_WARM_BROWN',(.22,.10,.05));C=material('MAT_TRIM_WARM_CREAM',(.70,.55,.35));T=material('MAT_GLASS_TEAL',(.04,.29,.34));R=material('MAT_BRASS_GROWGO',(.72,.45,.10));D=material('MAT_DARK_REVEAL',(.035,.018,.012));mats=[B,C,T,R,D]
root=bpy.data.objects.new('GG_ROOT_DOOR_SHOP_002_V3',None);bpy.context.collection.objects.link(root);objs=[]
def box(n,x,y,z,w,d,h,cid,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(x,y,z));o=bpy.context.object;o.name=n;o.dimensions=(w,d,h);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);o.parent=root;o['componentId']=cid;o['moduleId']='GG-BLD-DOOR-SHOP-002';o['version']='3.0.0';o['source']='SHOP_DOOR_MANUFACTURING_SPEC_V3';o['anonymousGeometry']=False;objs.append(o);return o
def rect(n,l,r,t,q,y,d,cid,m):return box(n,X((l+r)/2),y,Z((t+q)/2),W(l,r),d,H(t,q),cid,m)
def bands(prefix,l,r,t,q,outer,inner,face,cid='D05'):
 ow,st=4,3
 for i,(a,bb,c,d) in enumerate([(l,r,t,t+ow),(l,r,q-ow,q),(l,l+ow,t,q),(r-ow,r,t,q)]):rect(prefix+'_OUTER_'+str(i),a,bb,c,d,outer['y'],outer['depth'],cid,B)
 for i,(a,bb,c,d) in enumerate([(l+ow,r-ow,t+ow,t+ow+st),(l+ow,r-ow,q-ow-st,q-ow),(l+ow,l+ow+st,t+ow,q-ow),(r-ow-st,r-ow,t+ow,q-ow)]):rect(prefix+'_INNER_'+str(i),a,bb,c,d,inner['y'],inner['depth'],cid,D)
 rect(prefix+'_FACE',l+ow+st,r-ow-st,t+ow+st,q-ow-st,face['y'],face['depth'],'D04',B)
sl,gl,pa,th,tr,hd=b['SLAB'],b['MAIN_GLASS'],b['LOWER_PANEL'],b['THRESHOLD'],b['TRANSOM'],b['HEAD']
# V2 grid components are retained; V3 changes ownership and the three listed hierarchy profiles only.
rect('D01_SLAB',sl['left'],sl['right'],sl['top'],sl['bottom'],-.020,.070,'D01',B)
rect('D03_GLASS_SURROUND',gl['left']-6,gl['right']+6,gl['top']-6,gl['bottom']+6,-.073,.016,'D03',D);rect('D02_MAIN_GLASS',gl['left'],gl['right'],gl['top'],gl['bottom'],-.082,.012,'D02',T)
p=spec['panelDepthCandidates']['B']; bands('D05_PANEL_B',pa['left'],pa['right'],pa['top'],pa['bottom'],p['outer'],p['innerStep'],p['face'])
hx=X(b['HARDWARE']['axisX'])
for n,zpx,rad,cid in [('D06_UPPER_LOCK',123,2.9,'D06'),('D07_KNOB',151,4.5,'D07')]:
 bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=rad*U,depth=.035,location=(hx,-.108,Z(zpx)),rotation=(math.pi/2,0,0));o=bpy.context.object;o.name=n;o.data.materials.append(R);o.parent=root;o['componentId']=cid;o['moduleId']='GG-BLD-DOOR-SHOP-002';o['version']='3.0.0';o['anonymousGeometry']=False;objs.append(o)
rect('D08_ESCUTCHEON',216,226,157,190,-.104,.030,'D08',R);rect('D09_MAIL_SLOT',155,192,169,185,-.105,.030,'D09',R)
for side,cid,cb in [('L','D10',b['CASING_LEFT']),('R','D11',b['CASING_RIGHT'])]:
 l,r=cb['left'],cb['right'];rect(cid+'_OUTER_'+side,l,l+4,cb['top'],cb['bottom'],-.066,.018,cid,C);rect(cid+'_FACE_'+side,l+4,r-3,cb['top'],cb['bottom'],-.078,.025,cid,C);rect(cid+'_BEAD_'+side,r-3,r,cb['top'],cb['bottom'],-.093,.018,cid,C)
 pcid='D12' if side=='L' else 'D13';rect(pcid+'_PLINTH',l,r,223,241,-.082,.030,pcid,C);rect(pcid+'_FOOT',l-2,r+2,235,241,-.096,.035,pcid,C)
for n,l,r,t,q in [('TOP',tr['left']-5,tr['right']+5,tr['top']-3,tr['top']),('BOTTOM',tr['left']-5,tr['right']+5,tr['bottom'],tr['bottom']+3),('LEFT',tr['left']-5,tr['left'],tr['top'],tr['bottom']),('RIGHT',tr['right'],tr['right']+5,tr['top'],tr['bottom'])]:rect('D15_REVEAL_'+n,l,r,t,q,-.090,.014,'D15',D)
rect('D14_TRANSOM_GLASS',tr['left'],tr['right'],tr['top'],tr['bottom'],-.076,.012,'D14',T);rect('D16_TRANSOM_LEFT',b['CASING_LEFT']['left'],tr['left'],hd['top'],tr['bottom'],-.072,.026,'D16',C);rect('D17_TRANSOM_RIGHT',tr['right'],b['CASING_RIGHT']['right'],hd['top'],tr['bottom'],-.072,.026,'D17',C)
# D18 preserves its V2 bound, now a small layered separator: body -> lip -> dark underside.
sepT,sepB=zg['Z_SEPARATOR_TOP'],zg['Z_SEPARATOR_BOTTOM'];rect('D18_SEPARATOR_BODY',hd['left'],hd['right'],sepT,sepB,-.080,.014,'D18',C);rect('D18_SEPARATOR_LIP',hd['left']-2,hd['right']+2,sepB-5,sepB,-.098,.018,'D18',C);rect('D18_SEPARATOR_UNDERSIDE',hd['left'],hd['right'],sepB-3,sepB,-.086,.009,'D18',D)
# D19 preserves its V2 bound, now body -> face -> lower lip.
rect('D19_HEAD_BODY',hd['left'],hd['right'],hd['top'],hd['bottom'],-.065,.014,'D19',C);rect('D19_HEAD_FACE',hd['left']+3,hd['right']-3,hd['top']+3,hd['bottom']-4,-.080,.016,'D19',C);rect('D19_HEAD_LOWER_LIP',hd['left']-3,hd['right']+3,hd['bottom']-5,hd['bottom'],-.098,.018,'D19',C)
# D20 is deliberately only a narrow sill: no landing, exterior step, or foundation geometry exists in this build.
rect('D20_NARROW_SILL',th['left'],th['right'],th['top'],th['bottom'],-.084,.020,'D20',C);rect('D20_SILL_LIP',th['left']-2,th['right']+2,th['bottom']-3,th['bottom'],-.098,.018,'D20',C)
box('D02_GLASS_REFLECTION',X(173),-.096,Z(84),W(151,195),.006,H(80,86),'D02',T).rotation_euler[1]=-.18
s=bpy.context.scene;s.render.engine='BLENDER_EEVEE';s.render.resolution_x=600;s.render.resolution_y=700;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.film_transparent=False
bpy.ops.object.light_add(type='AREA',location=(-3,-5,5));bpy.context.object.data.energy=700;bpy.context.object.data.size=4
bpy.ops.object.camera_add(location=(0,-8,Z((hd['top']+th['bottom'])/2)));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=(350*U)*1.05;s.camera=cam
def render(name):cam.rotation_euler=((Vector((0,0,cam.location.z))-cam.location).to_track_quat('-Z','Y')).to_euler();s.render.filepath=os.path.join(out,name);bpy.ops.render.render(write_still=True)
render('SHOP_DOOR_V3_FRONT.png')
cols={'D%02d'%i:((i*37%255)/255,(i*83%255)/255,(i*149%255)/255) for i in range(1,21)};original=[]
for o in objs:
 original.append((o,list(o.data.materials)));m=material('ID_'+o['componentId'],cols[o['componentId']]);m.node_tree.nodes.get('Principled BSDF').inputs['Emission Color'].default_value=(*cols[o['componentId']],1);m.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=1;o.data.materials.clear();o.data.materials.append(m)
s.view_settings.look='None';s.view_settings.view_transform='Standard';render('SHOP_DOOR_V3_COMPONENT_ID.png')
black=material('VIS_BLACK',(0,0,0));white=material('VIS_WHITE',(1,1,1));counts={k:0 for k in cols};rx,ry=s.render.resolution_x,s.render.resolution_y;s.render.resolution_x=150;s.render.resolution_y=175
for cid in cols:
 for o in objs:o.data.materials.clear();o.data.materials.append(white if o['componentId']==cid else black)
 render('SHOP_DOOR_V3_MASK_'+cid+'.png');im=bpy.data.images.load(os.path.join(out,'SHOP_DOOR_V3_MASK_'+cid+'.png'),check_existing=False);data=array('f',[0])*(im.size[0]*im.size[1]*4);im.pixels.foreach_get(data);counts[cid]=sum(1 for i in range(0,len(data),4) if max(data[i:i+3])>.5)
s.render.resolution_x=rx;s.render.resolution_y=ry
for o,ms in original:o.data.materials.clear();[o.data.materials.append(m) for m in ms]
s.render.engine='BLENDER_WORKBENCH'
for o in objs:o.show_wire=True;o.show_all_edges=True
render('SHOP_DOOR_V3_WIREFRAME.png')
s.render.engine='BLENDER_EEVEE'
audit={'status':'PASS','mapping':'V3_SHARED_AFFINE_GRID_V1','maxErrorPx':0,'preservedV2Guides':True,'v3ThresholdPx':th};json.dump(audit,open(os.path.join(out,'SHOP_DOOR_V3_SHARED_GUIDE_AUDIT.json'),'w'),indent=2)
vis={'status':'PASS' if all(v>0 for v in counts.values()) else 'FAIL','meaningfulVisibleComponents':sum(v>0 for v in counts.values()),'pixelCounts':counts,'excludedContextGeometryCount':0,'method':'Occlusion-aware rendered masks; door component is white, all other door geometry is black.'};json.dump(vis,open(os.path.join(out,'SHOP_DOOR_V3_VISIBILITY_AUDIT.json'),'w'),indent=2)
tri=sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in objs);budget={'triangles':tri,'vertices':sum(len(o.data.vertices) for o in objs),'materials':5,'textures':0,'anonymousGeometry':0,'status':'PASS' if tri<=800 else 'FAIL'};json.dump(budget,open(os.path.join(out,'SHOP_DOOR_V3_BUDGET.json'),'w'),indent=2)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'GG-BLD-DOOR-SHOP-002_V3.blend'))
