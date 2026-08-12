"""GrowGo papercut correction for TREE_EUCALYPTUS_001 v004.

Blender 4.2 LTS. Creates a protected review candidate without registering,
promoting, publishing, or activating it. v001-v003 are never modified.
"""
from __future__ import annotations

import argparse
import json
import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ASSET_ID = "TREE_EUCALYPTUS_001"
VERSION = "v004"
STEM = f"{ASSET_ID}_{VERSION}"
FAMILY_ID = "COASTAL_NATURE_FAMILY_001"
RECIPE_ID = "TREE_EUCALYPTUS_RECIPE_001"
SEED = 41004

PALETTE = {
    "BARK_CREAM": (0.80, 0.70, 0.55, 1),
    "BARK_TAN": (0.62, 0.40, 0.23, 1),
    "BARK_RUST": (0.48, 0.25, 0.12, 1),
    "LEAF_DARK": (0.055, 0.16, 0.09, 1),
    "LEAF_MID": (0.17, 0.30, 0.16, 1),
    "LEAF_LIGHT": (0.38, 0.47, 0.25, 1),
    "NEW_GROWTH": (0.62, 0.59, 0.13, 1),
}

# Eleven intentional canopy islands with clear front/mid/back staggering.
MASSES = [
    (-3.45, -0.35, 8.10, 1.35, .82),
    (-2.65, 0.75, 9.65, 1.45, .90),
    (-1.65, -0.95, 11.15, 1.42, .86),
    (-.75, .65, 12.50, 1.48, .86),
    (.25, -.20, 13.42, 1.36, .76),
    (1.40, .95, 12.05, 1.48, .87),
    (2.75, -.75, 10.90, 1.58, .92),
    (3.65, .45, 9.45, 1.44, .84),
    (2.55, 1.52, 8.25, 1.30, .78),
    (.20, 1.62, 9.75, 1.35, .80),
    (-.35, -1.55, 8.72, 1.28, .75),
]

# One trunk and five expressive limb systems. The paths overlap at forks so
# the silhouette reads as a carved continuous form rather than a radial cage.
LIMBS = [
    (.72, .28, [(0,0,0),(-.10,.05,1.5),(.12,.08,3.0),(-.05,.02,4.6),(.18,.03,6.1),(.05,0,7.25)]),
    (.43, .12, [(-.02,0,5.35),(-.75,-.05,6.25),(-1.55,-.20,7.2),(-2.45,-.32,8.0),(-3.45,-.35,8.1)]),
    (.39, .11, [(-.10,.04,6.15),(-.45,.30,7.55),(-1.10,.65,9.1),(-1.65,-.15,10.25),(-1.65,-.95,11.15)]),
    (.38, .10, [(.10,.02,6.45),(.20,.10,8.0),(-.15,.42,9.8),(-.75,.65,12.50),(.25,-.20,13.42)]),
    (.43, .12, [(.06,.02,5.65),(.85,-.15,6.55),(1.55,-.38,7.65),(2.35,-.65,9.15),(2.75,-.75,10.90)]),
    (.34, .09, [(1.20,-.28,7.2),(1.80,.20,8.0),(2.55,.75,8.7),(3.65,.45,9.45)]),
]

LOD = {
    "CLOSE": {"sides": 9, "plates": 7, "outline": 14},
    "GAMEPLAY": {"sides": 7, "plates": 7, "outline": 12},
    "MAP": {"sides": 5, "plates": 4, "outline": 9},
}

def parse_args():
    p=argparse.ArgumentParser(); p.add_argument("--output-dir",required=True); p.add_argument("--preview-dir",required=True)
    return p.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])

def reset():
    bpy.ops.object.select_all(action="SELECT"); bpy.ops.object.delete(use_global=False)
    for blocks in (bpy.data.meshes,bpy.data.materials,bpy.data.cameras,bpy.data.lights):
        for block in list(blocks):
            if block.users==0: blocks.remove(block)

def make_material(name,color):
    m=bpy.data.materials.new(f"MAT_EUCALYPTUS_{name}_004"); m.diffuse_color=color; m.use_nodes=True
    b=m.node_tree.nodes.get("Principled BSDF"); b.inputs["Base Color"].default_value=color; b.inputs["Roughness"].default_value=.88
    return m

def materials(): return {k:make_material(k,v) for k,v in PALETTE.items()}

def basis(direction):
    tangent=direction.normalized(); helper=Vector((0,0,1)) if abs(tangent.z)<.9 else Vector((1,0,0))
    side=tangent.cross(helper).normalized(); up=side.cross(tangent).normalized(); return side,up

def tube(name,points,r0,r1,sides,mat,parent,col):
    pts=[Vector(p) for p in points]; verts=[]; faces=[]
    for i,p in enumerate(pts):
        d=pts[min(i+1,len(pts)-1)]-pts[max(i-1,0)]; side,up=basis(d); t=i/(len(pts)-1); r=r0*(1-t)+r1*t
        for j in range(sides):
            a=2*math.pi*j/sides; graphic=1+.035*math.sin(j*2.2+i)
            verts.append(tuple(p+graphic*r*(math.cos(a)*side+.82*math.sin(a)*up)))
    for i in range(len(pts)-1):
        for j in range(sides):
            a=i*sides+j; b=i*sides+(j+1)%sides; c=(i+1)*sides+(j+1)%sides; d=(i+1)*sides+j
            faces.append((a,b,c,d))
    faces += [tuple(range(sides-1,-1,-1)),tuple((len(pts)-1)*sides+j for j in range(sides))]
    mesh=bpy.data.meshes.new(name+"_MESH"); mesh.from_pydata(verts,[],faces); mesh.materials.append(mat)
    obj=bpy.data.objects.new(name,mesh); col.objects.link(obj); obj.parent=parent
    for p in mesh.polygons: p.use_smooth=True
    return obj

def root_flare(lod,mats,parent,col):
    sides=LOD[lod]["sides"]
    for i,(angle,length,width) in enumerate(((0.1,1.05,.38),(1.65,.85,.32),(3.0,1.0,.36),(4.55,.78,.30))):
        end=(math.cos(angle)*length,math.sin(angle)*length,-.01)
        tube(f"{ASSET_ID}_{lod}_ROOT_FLARE_{i}",[(0,0,.55),(end[0]*.45,end[1]*.45,.12),end],width,.035,max(5,sides-2),mats["BARK_CREAM"],parent,col)

def bark_blocks(lod,mats,parent,col):
    if lod=="MAP": return
    specs=[(.18,-.49,1.35,.46,.95,0),(-.42,.13,2.35,.40,1.15,1),(.37,.30,3.55,.36,.88,0),(-.22,-.42,4.65,.34,.72,1),(.10,.36,5.65,.28,.62,0)]
    verts=[]; faces=[]; ids=[]
    for x,y,z,w,h,mid in specs:
        base=len(verts); verts += [(x-w/2,y,z-h/2),(x+w/2,y,z-h*.42),(x+w*.42,y,z+h/2),(x-w*.45,y,z+h*.38)]
        faces.append((base,base+1,base+2,base+3)); ids.append(mid)
    mesh=bpy.data.meshes.new(f"{lod}_GRAPHIC_BARK_MESH"); mesh.from_pydata(verts,[],faces)
    mesh.materials.append(mats["BARK_TAN"]); mesh.materials.append(mats["BARK_RUST"])
    for p,mid in zip(mesh.polygons,ids): p.material_index=mid
    obj=bpy.data.objects.new(f"{ASSET_ID}_{lod}_GRAPHIC_BARK_BLOCKS",mesh); col.objects.link(obj); obj.parent=parent

def plate_geometry(center,rx,rz,normal,outline,rng,depth_offset,thickness=.075):
    n=Vector(normal).normalized(); vertical=Vector((0,0,1)); horizontal=vertical.cross(n)
    if horizontal.length<.1: horizontal=Vector((1,0,0))
    horizontal.normalize(); vertical=n.cross(horizontal).normalized()
    c=Vector(center)+n*depth_offset; ring=[]
    for i in range(outline):
        a=2*math.pi*i/outline; lobe=1+rng.uniform(-.10,.10)+.07*math.sin(a*3+rng.random())
        # Slightly lower-weighted ellipse produces a drooping eucalyptus mass.
        drop=-.13*rz*(1-math.cos(a))
        ring.append(c+horizontal*(math.cos(a)*rx*lobe)+vertical*(math.sin(a)*rz*lobe+drop))
    verts=[tuple(c+n*thickness/2),tuple(c-n*thickness/2)]
    verts += [tuple(v+n*thickness/2) for v in ring]
    verts += [tuple(v-n*thickness/2) for v in ring]
    faces=[]; front=2; back=2+outline
    for i in range(outline):
        j=(i+1)%outline
        faces.append((0,front+i,front+j))
        faces.append((1,back+j,back+i))
        faces.append((front+i,back+i,back+j,front+j))
    return verts,faces

def foliage_masses(lod,mats,parent,col):
    rng=random.Random(SEED+{"CLOSE":1,"GAMEPLAY":2,"MAP":3}[lod]); verts=[]; faces=[]; mids=[]
    plate_count=LOD[lod]["plates"]; outline=LOD[lod]["outline"]
    # Offset lobes form one broad graphic cluster. One or two cross-angle
    # plates provide genuine side depth without turning the mass into a ball.
    layout=[
        (-.23,.04,.84,0.00,-.10,0),
        (.24,.08,.78,.10,.00,1),
        (.02,-.19,.73,-.10,.12,2),
        (.18,-.03,.78,1.57,.02,1),
        (-.06,.34,.31,.03,.18,3),
        (-.27,-.24,.62,-1.57,-.02,0),
        (.00,.02,.72,0.00,.00,0),
    ]
    for mass_i,(cx,cy,cz,rx,rz) in enumerate(MASSES):
        angle=rng.uniform(-.28,.28)
        for p in range(plate_count):
            ox,oz,scale,angle_delta,depth,mid=layout[p]
            plate_angle=angle+angle_delta
            normal=(0,0,1) if p==6 or (lod=="MAP" and p==3) else (math.sin(plate_angle),-math.cos(plate_angle),.055)
            pc=(cx+ox*rx+rng.uniform(-.05,.05),cy+rng.uniform(-.05,.05),cz+oz*rz+rng.uniform(-.05,.05))
            pv,pf=plate_geometry(pc,rx*scale,rz*scale,normal,outline,rng,depth)
            base=len(verts); verts.extend(pv); faces.extend(tuple(base+i for i in f) for f in pf); mids.extend([mid]*len(pf))
    mesh=bpy.data.meshes.new(f"{ASSET_ID}_{lod}_LAYERED_PAPERCUT_MASSES_MESH"); mesh.from_pydata(verts,[],faces)
    for key in ("LEAF_DARK","LEAF_MID","LEAF_LIGHT","NEW_GROWTH"): mesh.materials.append(mats[key])
    for poly,mid in zip(mesh.polygons,mids): poly.material_index=mid
    obj=bpy.data.objects.new(f"{ASSET_ID}_{lod}_LAYERED_PAPERCUT_MASSES",mesh); col.objects.link(obj); obj.parent=parent

def build_lod(lod,mats):
    col=bpy.data.collections.new(f"{STEM}_LOD_{lod}"); bpy.context.scene.collection.children.link(col)
    root=bpy.data.objects.new(f"{ASSET_ID}_LOD_{lod}_ROOT",None); col.objects.link(root)
    anchor=bpy.data.objects.new(f"{ASSET_ID}_LOD_{lod}_IDENTITY_ANCHOR",None); col.objects.link(anchor); anchor.parent=root
    anchor.empty_display_type="PLAIN_AXES"; anchor["componentRole"]="IDENTITY_ANCHOR"; anchor["assetId"]=ASSET_ID; anchor["version"]=VERSION
    count=len(LIMBS) if lod!="MAP" else 5
    for i,(r0,r1,path) in enumerate(LIMBS[:count]): tube(f"{ASSET_ID}_{lod}_SCULPTURAL_LIMB_{i}",path,r0,r1,LOD[lod]["sides"],mats["BARK_CREAM"],root,col)
    root_flare(lod,mats,root,col); bark_blocks(lod,mats,root,col); foliage_masses(lod,mats,root,col)
    return col

def export_lod(out,lod,col):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in col.all_objects: obj.select_set(True)
    path=out/f"{STEM}_LOD_{lod}.glb"; bpy.ops.export_scene.gltf(filepath=str(path),export_format="GLB",use_selection=True,export_apply=True); return path

def camera(name,loc,target,scale):
    data=bpy.data.cameras.new(name); obj=bpy.data.objects.new(name,data); bpy.context.scene.collection.objects.link(obj); obj.location=loc
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat("-Z","Y").to_euler(); data.type="ORTHO"; data.ortho_scale=scale; return obj

def render_setup():
    world=bpy.context.scene.world or bpy.data.worlds.new("WORLD"); bpy.context.scene.world=world; world.use_nodes=True
    world.node_tree.nodes["Background"].inputs["Color"].default_value=(.78,.84,.88,1); world.node_tree.nodes["Background"].inputs["Strength"].default_value=.72
    ld=bpy.data.lights.new("SUN","SUN"); ld.energy=2.3; ld.angle=.38; light=bpy.data.objects.new("SUN",ld); bpy.context.scene.collection.objects.link(light); light.rotation_euler=(.45,-.38,-.55)
    s=bpy.context.scene; s.render.engine="BLENDER_EEVEE_NEXT"; s.render.resolution_x=900; s.render.resolution_y=900; s.render.resolution_percentage=100; s.render.image_settings.file_format="PNG"; s.view_settings.look="AgX - Medium High Contrast"

def render_reviews(preview,collections):
    render_setup(); views={"front":((0,-24,7),(0,0,7),17),"side":((24,0,7),(0,0,7),17),"top":((0,0,27),(0,0,7),17),"oblique":((18,-22,15),(0,0,7),18),"gameplay":((24,-30,22),(0,0,7),20),"close_detail":((8,-11,8),(0,0,6.4),11)}
    for lod,col in collections.items(): col.hide_render=lod!="GAMEPLAY"
    for name,(loc,target,scale) in views.items():
        cam=camera("CAM_"+name.upper(),loc,target,scale); bpy.context.scene.camera=cam; bpy.context.scene.render.filepath=str(preview/f"{STEM}_GAMEPLAY_{name}.png"); bpy.ops.render.render(write_still=True); bpy.data.objects.remove(cam,do_unlink=True)

def records(out,preview):
    metadata={"assetId":ASSET_ID,"assetFamilyId":FAMILY_ID,"recipeReference":RECIPE_ID,"previousCandidateVersion":"v003","targetRevisionVersion":VERSION,"status":"PENDING_OPERATOR_REVIEW","authoredHeightMetres":14.0,"visualDirection":"50 percent recognizable eucalyptus / 50 percent graphic papercut sculpture","construction":{"dominantLimbSystems":5,"majorFoliageMasses":len(MASSES),"foliageTechnique":"layered double-sided lobed papercut plates","paletteSlots":7},"identityContractV2":{"assetId":ASSET_ID,"category":"nature","recipeId":RECIPE_ID,"version":VERSION,"identityAnchor":{"componentRole":"IDENTITY_ANCHOR","required":True},"anchorValidation":"REQUIRE_PER_LOD_EXPORTED_ANCHOR"},"runtimeActivated":False,"publishingPerformed":False}
    authoring={"assetId":ASSET_ID,"version":VERSION,"protectedHistoricalVersions":["v001","v002","v003"],"expectedBlendFilename":f"{STEM}.blend","expectedOutputs":[f"{STEM}_LOD_{lod}.glb" for lod in LOD],"previewDirectory":str(preview),"operatorVisualApprovalRequired":True,"status":"PENDING_OPERATOR_REVIEW"}
    manifest={"assetId":ASSET_ID,"version":VERSION,"manifestVersion":"1.0.0","category":"nature","lodOrder":["CLOSE","GAMEPLAY","MAP"],"deterministicSeed":SEED,"registered":False,"promoted":False,"published":False,"activated":False}
    for name,payload in (("metadata",metadata),("authoring-manifest",authoring),("manifest",manifest)): (out/f"tree-eucalyptus-v004-{name}.json").write_text(json.dumps(payload,indent=2)+"\n")

def main():
    a=parse_args(); out=Path(a.output_dir).resolve(); preview=Path(a.preview_dir).resolve(); out.mkdir(parents=True,exist_ok=True); preview.mkdir(parents=True,exist_ok=True)
    reset(); mats=materials(); collections={lod:build_lod(lod,mats) for lod in LOD}; bpy.context.scene["assetId"]=ASSET_ID; bpy.context.scene["version"]=VERSION; bpy.context.scene["authoredHeightMetres"]=14.0
    blend=out/f"{STEM}.blend"; bpy.ops.wm.save_as_mainfile(filepath=str(blend)); exports=[str(export_lod(out,lod,col)) for lod,col in collections.items()]
    render_reviews(preview,collections); records(out,preview); print(json.dumps({"assetId":ASSET_ID,"version":VERSION,"blend":str(blend),"exports":exports,"status":"PENDING_OPERATOR_REVIEW"},indent=2))

if __name__=="__main__": main()
