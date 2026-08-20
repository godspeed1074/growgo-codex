"""Isolated V4: replaces only V2's woody carcass with converted continuous curve paths."""
import os,re
here=os.path.dirname(os.path.abspath(__file__)); v2=os.path.join(here,'eucalyptus_hybrid_v2_worker.py'); src=open(v2,encoding='utf8').read()
src=src.replace("TREE_EUCALYPTUS_001@3.1.0","TREE_EUCALYPTUS_001@3.3.0").replace("'version':'3.1.0'","'version':'3.3.0'")
src=src.replace("'previousVersion':'3.0.0'","'previousVersion':'3.2.0'").replace("'previousStatus':'VISUALLY_REJECTED_STRUCTURAL_METHOD_EVIDENCE_ONLY'","'previousStatus':'NEEDS_TARGETED_CORRECTION'")
src=src.replace("(.63,.50,.30,1)","(.33,.30,.22,1)").replace("(.34,.18,.09,1)","(.29,.14,.055,1)")
src=src.replace("img.image=bpy.data.images.load(atlas_path, check_existing=True); img.interpolation='Linear'","img.image=bpy.data.images.load(atlas_path, check_existing=True); img.interpolation='Closest'")
src=src.replace("u0,v0,u1,v1=uv","u0,v0,u1,v1=uv\n    # Half-texel safety inset prevents sampling neighbouring atlas cells.\n    pad=.004; u0+=pad; v0+=pad; u1-=pad; v1-=pad")
src=re.sub(r"BRANCHES=\[.*?\]\n\n","BRANCHES=[]\n\n",src,count=1,flags=re.S)
insert=r'''
def organic_curve(name, points, base_radius, mat):
    """A single smooth centerline converted to lightweight mesh: continuous direction, progressive taper."""
    curve=bpy.data.curves.new(name+'_CURVE','CURVE'); curve.dimensions='3D'; curve.resolution_u=4; curve.bevel_depth=base_radius; curve.bevel_resolution=1; curve.resolution_u=6
    spline=curve.splines.new('BEZIER'); spline.bezier_points.add(len(points)-1)
    for i,(co,ratio) in enumerate(points):
        p=spline.bezier_points[i]; p.co=co; p.radius=ratio; p.handle_left_type='AUTO'; p.handle_right_type='AUTO'
    curve_obj=bpy.data.objects.new(name+'_SOURCE',curve); bpy.context.collection.objects.link(curve_obj); curve_obj.data.materials.append(mat); curve_obj['layer']='CARCASS'
    # Avoid bpy.ops conversion: it depends on transient selection/context in background Blender.
    # Evaluated conversion yields a real, explicit mesh for render, metrics, and GLB export.
    depsgraph=bpy.context.evaluated_depsgraph_get(); mesh=bpy.data.meshes.new_from_object(curve_obj.evaluated_get(depsgraph),depsgraph=depsgraph)
    obj=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(obj); obj.data.materials.append(mat); obj['layer']='CARCASS'
    bpy.data.objects.remove(curve_obj,do_unlink=True); return obj

def organic_carcass(level,bark,patch):
    # Major growth paths deliberately share root/fork landmarks but are each smooth, tapered centerlines.
    paths=[
      ('GG_EUC_V4_MAIN_TRUNK',[((-.12,0,0),1.15),((-.16,.02,1.20),1.0),((.02,.03,2.48),.76),((-.02,.04,3.30),.55)],.24),
      ('GG_EUC_V4_LEFT_PRIMARY',[((-.02,.04,3.26),1),((-.40,.07,3.76),.82),((-1.12,.12,4.18),.60),((-2.22,.14,4.23),.28)],.16),
      ('GG_EUC_V4_RIGHT_PRIMARY',[((-.01,.04,3.20),1),((.44,-.04,3.70),.82),((1.32,-.09,4.25),.60),((2.43,-.10,4.00),.28)],.17),
      ('GG_EUC_V4_UPPER_LEFT',[((-.28,.05,3.52),1),((-.72,.08,4.42),.62),((-1.10,.10,5.55),.25)],.10),
      ('GG_EUC_V4_UPPER_CROWN',[((.24,.00,3.60),1),((.30,-.02,4.75),.60),((.20,-.03,5.92),.22)],.10),
      ('GG_EUC_V4_UPPER_RIGHT',[((.58,-.04,3.76),1),((1.23,-.05,4.45),.62),((1.88,.02,5.25),.25)],.09),
      ('GG_EUC_V4_LEFT_TWIG',[((-1.12,.12,4.18),1),((-1.65,.10,4.55),.50),((-2.35,.13,4.55),.18)],.06),
      ('GG_EUC_V4_RIGHT_TWIG',[((1.32,-.09,4.25),1),((1.72,-.08,4.88),.50),((2.56,-.07,5.04),.18)],.06)
    ]
    limit={'CLOSE':8,'GAMEPLAY':6,'MAP':3}[level]
    for name,pts,r in paths[:limit]: organic_curve(name,pts,r,bark)
    for i,(x,z) in enumerate(((-.17,1.0),(.03,1.8),(-.10,2.72))):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=8,ring_count=4,radius=.10,location=(x,-.20,z)); o=bpy.context.object; o.name='GG_EUC_V4_BARK_SCAR_%02d'%i; o.scale=(.6,.18,1.5); o.data.materials.append(patch); o['layer']='CARCASS'

'''
src=src.replace("def build(level):",insert+"def build(level):")
src=re.sub(r"bark=solid\('GG_MAT_EUCALYPTUS_BARK_PALE',\([^\n]+?\); patch=solid\('GG_MAT_EUCALYPTUS_BARK_WARM_PATCH',\([^\n]+?\); foliage=foliage_material\(\)", "bark=solid('GG_MAT_EUCALYPTUS_BARK_PALE',(.10,.08,.045,1)); patch=solid('GG_MAT_EUCALYPTUS_BARK_WARM_PATCH',(.25,.11,.035,1)); foliage=foliage_material(); organic_carcass(level,bark,patch)", src, count=1)
src=src.replace("if o.type=='MESH' and not keep:","if o.get('layer') and not keep:")
src=src.replace("('EUCALYPTUS_CLOSE_CANOPY.png',-.25,True,None)","('EUCALYPTUS_CLOSE_CANOPY.png',-.25,True,None),('EUCALYPTUS_CLOSE_Y_FORK.png',-.25,True,'CARCASS')")
src=src.replace("'atlasChanged':False","'atlasChanged':False,'v4Corrections':['continuous-bezier-centerlines','progressive-curve-taper','organic-fork-overlap','uv-inset-and-nearest-filter']")
exec(compile(src,v2+' [V4 transformed]','exec'),globals(),globals())
