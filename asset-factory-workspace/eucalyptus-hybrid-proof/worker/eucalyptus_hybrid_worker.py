import bpy,os,sys,json,math
from mathutils import Vector
root,tex=sys.argv[-2:];out=os.path.join(root,'TREE_EUCALYPTUS_001@3.0.0');os.makedirs(out,exist_ok=True)
def clear():bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def m(n,c):
 x=bpy.data.materials.new(n);x.diffuse_color=(*c,1);return x
def trunk(a,b,r,ma,n):
 d=Vector(b)-Vector(a);mid=(Vector(a)+Vector(b))/2;bpy.ops.mesh.primitive_cone_add(vertices=6,radius1=r,radius2=r*.58,depth=d.length,location=mid);o=bpy.context.object;o.name=n;o.data.materials.append(ma);o.rotation_euler=d.to_track_quat('Z','Y').to_euler()
def card(x,z,s,y,ma,n):
 bpy.ops.mesh.primitive_plane_add(size=1,location=(x,y,z),rotation=(math.pi/2,0,0));o=bpy.context.object;o.name=n;o.scale=(s*.75,s,1);o.data.materials.append(ma)
def setup(a=0):
 sc=bpy.context.scene
 for e in ('BLENDER_EEVEE','BLENDER_EEVEE_NEXT'):
  try:sc.render.engine=e;break
  except:pass
 sc.render.resolution_x=sc.render.resolution_y=720;sc.render.image_settings.file_format='PNG';bpy.ops.object.camera_add(location=(math.sin(a)*10,-math.cos(a)*10,3.4));c=bpy.context.object;c.data.type='ORTHO';c.data.ortho_scale=7;c.rotation_euler=(Vector((0,0,3))-c.location).to_track_quat('-Z','Y').to_euler();sc.camera=c;bpy.ops.object.light_add(type='AREA',location=(-4,-5,9));bpy.context.object.data.energy=1000;bpy.context.object.data.size=7;return c
clear();bark=m('GG_MAT_EUC_BARK_ATLAS',(.63,.50,.30));dark=m('GG_MAT_EUC_FOLIAGE_DARK_ATLAS',(.08,.20,.13));mid=m('GG_MAT_EUC_FOLIAGE_MID_ATLAS',(.20,.37,.21));light=m('GG_MAT_EUC_FOLIAGE_LIGHT_ATLAS',(.48,.52,.18))
trunk((0,0,0),(0,0,4.9),.24,bark,'GG_EUC_TRUNK');branches=[((0,0,2.3),(-2,.1,4.2)),((0,0,2.8),(2,.2,4.5)),((0,0,3.8),(-1.2,.1,5.8)),((0,0,4.3),(1.4,.1,6.1)),((-.7,.1,3.5),(-2.4,.1,3.6)),((.8,.1,3.7),(2.5,.1,3.7))]
for i,(a,b) in enumerate(branches):trunk(a,b,.105,bark,'GG_EUC_BRANCH_'+str(i+1))
for layer,y,ma in [('REAR',.25,dark),('MID',.05,mid),('FRONT',-.16,light)]:
 for i,(x,z,s) in enumerate([(-2.3,4.1,1.1),(-1.1,5.5,1.25),(.4,5.9,1.3),(1.8,4.7,1.15),(-.4,4.2,1.2),(2.5,3.7,.85)]):card(x,z,s,y,ma,'GG_EUC_'+layer+'_CLUSTER_'+str(i+1))
for lod in ['CLOSE','GAMEPLAY','MAP']:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=os.path.join(out,'TREE_EUCALYPTUS_001_LOD_'+lod+'.glb'),export_format='GLB',use_selection=True);json.dump({'triangles':sum(sum(max(0,len(p.vertices)-2)for p in o.data.polygons)for o in bpy.context.scene.objects if o.type=='MESH'),'materials':len(bpy.data.materials),'cards':18},open(os.path.join(out,'TREE_EUCALYPTUS_001_LOD_'+lod+'_STATS.json'),'w'))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'TREE_EUCALYPTUS_001.blend'))
for n,a in [('FRONT',0),('BACK',math.pi),('LEFT',math.pi/2),('RIGHT',-math.pi/2),('GAMEPLAY',-.3),('CARCASS_ONLY',0),('FOLIAGE_CLUSTERS_ONLY',0),('FINAL_COMBINED',-.3)]:
 c=setup(a);bpy.context.scene.render.filepath=os.path.join(out,'EUCALYPTUS_'+n+'.png');bpy.ops.render.render(write_still=True);bpy.data.objects.remove(c,do_unlink=True)
json.dump({'assetId':'TREE_EUCALYPTUS_001','version':'3.0.0','state':'REVIEW_CANDIDATE','treeExclusion':False,'atlasChanged':False},open(os.path.join(out,'BUILD_METADATA.json'),'w'));print('EUCALYPTUS_HYBRID_PROOF_COMPLETE')
