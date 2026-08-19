import bpy,json,os,sys,math
from mathutils import Vector
pkg=json.load(open(sys.argv[-3])); texture=sys.argv[-2]; root=sys.argv[-1]; out=os.path.join(root,pkg['assetId']+'@'+pkg['version']);os.makedirs(out,exist_ok=True); FLAT=False
def clear():
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 for m in list(bpy.data.materials):bpy.data.materials.remove(m)
def mat(n,c):
 m=bpy.data.materials.new(n);m.use_nodes=True;b=m.node_tree.nodes['Principled BSDF'];b.inputs['Base Color'].default_value=(*c,1);b.inputs['Roughness'].default_value=.85;return m
def traced(n,base,h,lean,w,bend,y,m):
 bx,bz=base;dx,dz=math.sin(lean),math.cos(lean);px,pz=dz,-dx;c1=(bx+dx*h*.26+bend*.20,bz+dz*h*.26);c2=(bx+dx*h*.58+bend*.68,bz+dz*h*.58);tip=(bx+dx*h+bend,bz+dz*h);p=[(bx-px*w*.40,bz-pz*w*.40),(c1[0]-px*w*.64,c1[1]-pz*w*.64),(c2[0]-px*w*.46,c2[1]-pz*w*.46),tip,(c2[0]+px*w*.30,c2[1]+pz*w*.30),(c1[0]+px*w*.57,c1[1]+pz*w*.57),(bx+px*w*.40,bz+pz*w*.40)];v=[(x,y,z) for x,z in p]+[(x,y+.016,z) for x,z in p];q=len(p);f=[tuple(range(q-1,-1,-1)),tuple(range(q,2*q))];
 if not FLAT:f += [(i,(i+1)%q,(i+1)%q+q,i+q) for i in range(q)]
 me=bpy.data.meshes.new(n+'_MESH');me.from_pydata(v,[],f);me.materials.append(m);ob=bpy.data.objects.new(n,me);bpy.context.collection.objects.link(ob)
def reference_layer():
 image=bpy.data.images.load(texture);m=bpy.data.materials.new('GG_MAT_COASTAL_TUFT_REFERENCE_COLOUR_MASS_ATLAS');m.use_nodes=True;n=m.node_tree.nodes;n.clear();o=m.node_tree.nodes.new('ShaderNodeOutputMaterial');p=n.new('ShaderNodeBsdfPrincipled');t=n.new('ShaderNodeTexImage');t.image=image;m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color']);m.node_tree.links.new(p.outputs['BSDF'],o.inputs['Surface']);bpy.ops.mesh.primitive_plane_add(size=2,location=(0,-.17,.42),rotation=(math.pi/2,0,0));ob=bpy.context.object;ob.name='GG_VEG_V3_REFERENCE_DERIVED_COLOUR_MASS_LAYER';ob.scale=(.60,.505,1);ob.data.materials.append(m)
def build(detail):
 global FLAT;FLAT=detail<=4;clear();dark=mat('GG_MAT_FOLIAGE_DARK_ATLAS',(.10,.24,.06));mid=mat('GG_MAT_FOLIAGE_MID_ATLAS',(.28,.45,.09));light=mat('GG_MAT_FOLIAGE_HIGHLIGHT_ATLAS',(.62,.65,.16));gold=mat('GG_MAT_SEED_GOLD_ATLAS',(.72,.52,.16));
 sets=[('REAR_DARK',[(-.30,.54,-.30,.08,-.04),(-.15,.66,-.12,.07,-.02),(0,.61,.03,.07,.02),(.16,.57,.20,.08,.03),(.31,.45,.40,.08,.05)],dark,.10),('MIDDLE',[(-.42,.30,-.72,.12,-.08),(-.29,.46,-.42,.10,-.05),(-.08,.52,-.12,.10,.02),(.10,.49,.20,.11,.03),(.28,.41,.48,.11,.07),(.42,.30,.72,.12,.08)],mid,.035),('FRONT',[(-.38,.17,-.80,.14,-.08),(-.20,.26,-.36,.14,-.02),(0,.27,.01,.15,.0),(.20,.26,.36,.14,.03),(.38,.17,.80,.14,.08)],mid,-.07),('HIGHLIGHT',[(-.20,.47,-.16,.065,-.01),(-.05,.56,.02,.06,.0),(.12,.46,.20,.065,.02)],light,-.11)]
 for name,a,m,y in sets:
  for i,e in enumerate(a[:detail]):traced('GG_VEG_V3_'+name+'_'+str(i+1),(e[0],.03),e[1],e[2],e[3],e[4],y,m)
 if detail>6:
  for i,(x,z) in enumerate([(-.20,.46),(.01,.56),(.19,.45)]):
   traced('GG_VEG_V3_SEED_STEM_'+str(i+1),(x,.05),z-.07,.02,.014,.001,.08,mid)
   for j in range(2):traced('GG_VEG_V3_SEED_SEGMENT_'+str(i+1)+'_'+str(j+1),(x,z+j*.045),.055,.02,.035,.003,.065,gold)
 if detail>4:reference_layer()
def stats():
 ms=[x for x in bpy.context.scene.objects if x.type=='MESH'];return {'triangles':sum(sum(max(0,len(p.vertices)-2)for p in x.data.polygons)for x in ms),'vertices':sum(len(x.data.vertices)for x in ms),'materials':len(bpy.data.materials),'objects':len(ms)}
def setup(angle=0,game=False):
 sc=bpy.context.scene
 for e in ('BLENDER_EEVEE','BLENDER_EEVEE_NEXT'):
  try:sc.render.engine=e;break
  except TypeError:pass
 sc.render.resolution_x=sc.render.resolution_y=720;sc.render.image_settings.file_format='PNG';sc.world.color=(.88,.85,.78);bpy.ops.object.light_add(type='AREA',location=(-3,-4,5));bpy.context.object.data.energy=500;bpy.context.object.data.size=5
 pos=Vector((math.sin(angle)*5,-math.cos(angle)*5,.42));cam=None;bpy.ops.object.camera_add(location=pos);cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=1.22 if not game else 1.35;cam.rotation_euler=(Vector((0,0,.42))-pos).to_track_quat('-Z','Y').to_euler();sc.camera=cam;return cam
for lod,d in [('CLOSE',99),('GAMEPLAY',5),('MAP',4)]:
 build(d);bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=os.path.join(out,pkg['assetId']+'_LOD_'+lod+'.glb'),export_format='GLB',use_selection=True);json.dump(stats(),open(os.path.join(out,pkg['assetId']+'_LOD_'+lod+'_STATS.json'),'w'),indent=2)
 if lod=='CLOSE':
  bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,pkg['assetId']+'.blend'))
  for n,a,g in [('ASSET_REVIEW_FRONT',0,False),('ASSET_REVIEW_BACK',math.pi,False),('ASSET_REVIEW_LEFT',math.pi/2,False),('ASSET_REVIEW_RIGHT',-math.pi/2,False),('ASSET_REVIEW_GAMEPLAY',-.31,True)]:c=setup(a,g);bpy.context.scene.render.filepath=os.path.join(out,n+'.png');bpy.ops.render.render(write_still=True);bpy.data.objects.remove(c,do_unlink=True)
json.dump({'assetId':pkg['assetId'],'version':pkg['version'],'source':'REAL_STEAM_DECK_BLENDER_5.2.0','method':pkg['method'],'treeExclusion':True,'reviewState':'REVIEW_CANDIDATE'},open(os.path.join(out,'BUILD_METADATA.json'),'w'),indent=2);print('GROWGO_COASTAL_TUFT_01_V3_COMPLETE')
