import bpy, os, sys, json, hashlib
from array import array
from mathutils import Vector

args=sys.argv[sys.argv.index('--')+1:]; source,out=args[0:2]
os.makedirs(out,exist_ok=True); bpy.ops.wm.open_mainfile(filepath=source)
s=bpy.context.scene; s.render.engine='BLENDER_EEVEE';s.render.resolution_x=600;s.render.resolution_y=700;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.view_settings.view_transform='Standard';s.view_settings.look='Medium High Contrast'
objs=[o for o in bpy.data.objects if o.get('moduleId')=='GG-BLD-DOOR-SHOP-002']
def fingerprint():
 return {o.name:{'location':[round(v,7) for v in o.location],'dimensions':[round(v,7) for v in o.dimensions],'rotation':[round(v,7) for v in o.rotation_euler],'componentId':o.get('componentId')} for o in sorted(objs,key=lambda x:x.name)}
before=fingerprint()
def get(n,c):
 m=bpy.data.materials.get(n)
 if not m:
  m=bpy.data.materials.new(n);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=.78;p.inputs['Base Color'].default_value=(*c,1);return m
base={'MAT_DOOR_WARM_BROWN':(.22,.10,.05),'MAT_TRIM_WARM_CREAM':(.70,.55,.35),'MAT_GLASS_TEAL':(.04,.29,.34),'MAT_BRASS_GROWGO':(.72,.45,.10),'MAT_DARK_REVEAL':(.035,.018,.012)}
for n,c in base.items():get(n,c)
sets={
 'A':{'TRIM_LIGHT':(.755,.610,.405),'TRIM_DARK':(.615,.485,.310),'SLAB_LIGHT':(.238,.112,.057),'SLAB_DARK':(.187,.083,.040),'GLASS_REFLECTION_TEAL':(.070,.360,.405),'BRASS_SHADOW':(.590,.350,.070)},
 'B':{'TRIM_LIGHT':(.770,.628,.425),'TRIM_DARK':(.585,.455,.285),'SLAB_LIGHT':(.246,.118,.060),'SLAB_DARK':(.176,.074,.035),'GLASS_REFLECTION_TEAL':(.080,.385,.430),'BRASS_SHADOW':(.545,.310,.055)}
}
def assign(o,m):o.data.materials.clear();o.data.materials.append(m)
def setup(v):
 for n,c in sets[v].items():get(n,c)
 M={n:bpy.data.materials[n] for n in list(base)+list(sets[v])}
 for o in objs:
  n=o.name
  # Locked geometry; material selection is the sole changed state.
  pick='MAT_DOOR_WARM_BROWN'
  if n.startswith('D01'):pick='MAT_DOOR_WARM_BROWN'
  elif n.startswith('D02_MAIN'):pick='MAT_GLASS_TEAL'
  elif n.startswith('D02_GLASS_REFLECTION'):pick='GLASS_REFLECTION_TEAL'
  elif n.startswith('D03') or n.startswith('D15_REVEAL') or n.endswith('UNDERSIDE'):pick='MAT_DARK_REVEAL'
  elif n.startswith('D04'):pick='SLAB_DARK'
  elif n.startswith('D05_PANEL_B_OUTER'):pick='SLAB_LIGHT'
  elif n.startswith('D05_PANEL_B_INNER'):pick='SLAB_DARK'
  elif n.startswith('D05_PANEL_B_FACE'):pick='SLAB_DARK'
  elif n.startswith(('D06','D07','D09')):pick='MAT_BRASS_GROWGO'
  elif n.startswith('D08'):pick='BRASS_SHADOW'
  elif n.startswith(('D10','D11')):
   pick='TRIM_LIGHT' if 'BEAD' in n else ('TRIM_DARK' if 'OUTER' in n else 'MAT_TRIM_WARM_CREAM')
  elif n.startswith(('D12','D13')):pick='TRIM_LIGHT' if 'FOOT' in n else ('TRIM_DARK' if 'PLINTH' in n else 'MAT_TRIM_WARM_CREAM')
  elif n.startswith(('D14','D16','D17')):pick='MAT_GLASS_TEAL' if n.startswith('D14') else 'MAT_TRIM_WARM_CREAM'
  elif n.startswith('D18'):pick='TRIM_LIGHT' if 'LIP' in n else 'MAT_TRIM_WARM_CREAM'
  elif n.startswith('D19'):pick='TRIM_LIGHT' if 'FACE' in n else ('TRIM_DARK' if 'LOWER_LIP' in n else 'MAT_TRIM_WARM_CREAM')
  elif n.startswith('D20'):pick='TRIM_LIGHT' if 'SILL' in n else 'TRIM_DARK'
  assign(o,M[pick])
def render(name):s.render.filepath=os.path.join(out,name);bpy.ops.render.render(write_still=True)
setup('A');render('SHOP_DOOR_V3_TONAL_A.png');setup('B');render('SHOP_DOOR_V3_TONAL_B.png');render('SHOP_DOOR_V3_TONAL_SELECTED_B.png')
# Actual visibility proof uses the selected beauty camera with every other door object occluding in black.
black=get('V3_TONAL_MASK_BLACK',(0,0,0));white=get('V3_TONAL_MASK_WHITE',(1,1,1));original=[(o,list(o.data.materials)) for o in objs];ids=['D%02d'%i for i in range(1,21)];counts={i:0 for i in ids};rx,ry=s.render.resolution_x,s.render.resolution_y;s.render.resolution_x=150;s.render.resolution_y=175
for cid in ids:
 for o in objs:assign(o,white if o.get('componentId')==cid else black)
 render('SHOP_DOOR_V3_TONAL_MASK_'+cid+'.png');im=bpy.data.images.load(os.path.join(out,'SHOP_DOOR_V3_TONAL_MASK_'+cid+'.png'),check_existing=False);pix=array('f',[0])*(im.size[0]*im.size[1]*4);im.pixels.foreach_get(pix);counts[cid]=sum(1 for i in range(0,len(pix),4) if max(pix[i:i+3])>.5)
s.render.resolution_x=rx;s.render.resolution_y=ry
for o,ms in original:o.data.materials.clear();[o.data.materials.append(m) for m in ms]
bpy.data.materials.remove(black);bpy.data.materials.remove(white)
after=fingerprint(); drift=before!=after
tri=sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in objs)
audit={'status':'PASS' if not drift else 'FAIL','geometryChanged':drift,'structuralDrift':0 if not drift else 'DETECTED','structureFingerprintSha256':hashlib.sha256(json.dumps(before,sort_keys=True).encode()).hexdigest(),'componentVisibility':{'status':'PASS' if all(v>0 for v in counts.values()) else 'FAIL','counts':counts,'meaningfulComponents':sum(v>0 for v in counts.values())},'budget':{'triangles':tri,'vertices':sum(len(o.data.vertices) for o in objs),'materials':11,'textures':0,'anonymousGeometry':0,'status':'PASS' if tri<=800 else 'FAIL'},'variants':['TONAL_A','TONAL_B'],'selected':'TONAL_B'}
json.dump(audit,open(os.path.join(out,'SHOP_DOOR_V3_TONAL_AUDIT.json'),'w'),indent=2)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'GG-BLD-DOOR-SHOP-002_V3_TONAL_B.blend'))
