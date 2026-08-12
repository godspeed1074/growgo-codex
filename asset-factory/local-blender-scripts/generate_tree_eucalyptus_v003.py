"""Generate the protected GrowGo TREE_EUCALYPTUS_001 v003 production candidate.

Designed for Blender 4.2 LTS. Historical v001/v002 outputs are never touched.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ASSET_ID = "TREE_EUCALYPTUS_001"
VERSION = "v003"
STEM = f"{ASSET_ID}_{VERSION}"
FAMILY_ID = "COASTAL_NATURE_FAMILY_001"
RECIPE_ID = "TREE_EUCALYPTUS_RECIPE_001"
SEED = 31003

LOD_CONFIG = {
    "CLOSE": {"sides": 9, "leaf_count": 1250, "leaf_segments": 4, "twig_depth": 2},
    "GAMEPLAY": {"sides": 7, "leaf_count": 720, "leaf_segments": 3, "twig_depth": 1},
    "MAP": {"sides": 5, "leaf_count": 145, "leaf_segments": 2, "twig_depth": 0},
}

PALETTE = {
    "BARK_LIGHT": (0.78, 0.69, 0.55, 1.0),
    "BARK_MID": (0.60, 0.39, 0.23, 1.0),
    "BARK_DARK": (0.34, 0.20, 0.11, 1.0),
    "LEAF_DARK": (0.055, 0.16, 0.095, 1.0),
    "LEAF_MID": (0.16, 0.30, 0.17, 1.0),
    "LEAF_LIGHT": (0.34, 0.45, 0.24, 1.0),
    "NEW_GROWTH": (0.62, 0.58, 0.12, 1.0),
}

# Deliberately asymmetric, three-dimensional crown massing, metres.
CLUSTERS = [
    (-3.55, -0.35, 8.10, 1.45, 1.05, 0.85),
    (-3.00, 0.95, 9.75, 1.55, 1.10, 0.95),
    (-1.95, -1.05, 11.25, 1.45, 1.05, 0.95),
    (-1.15, 0.75, 12.65, 1.55, 1.10, 0.90),
    (0.15, -0.25, 13.45, 1.45, 1.00, 0.75),
    (1.25, 1.05, 12.15, 1.50, 1.10, 0.95),
    (2.75, -0.75, 11.15, 1.65, 1.10, 1.00),
    (3.65, 0.60, 9.75, 1.50, 1.05, 0.90),
    (2.35, 1.65, 8.60, 1.35, 0.95, 0.85),
    (0.25, 1.85, 10.25, 1.35, 1.00, 0.85),
    (-0.45, -1.80, 9.25, 1.30, 0.90, 0.80),
    (4.10, -0.05, 7.95, 1.25, 0.90, 0.80),
]

# Each path is (radius_start, radius_end, control points). Paths overlap subtly
# at forks to read as continuous organic limbs at gameplay distance.
BRANCHES = [
    (0.62, 0.27, [(0,0,0),(.12,.05,1.5),(-.05,.10,3.1),(.18,.02,4.8),(-.05,.05,6.25),(0.10,0.0,7.35)]),
    (0.40, 0.12, [(-.02,0,5.35),(-.65,-.08,6.15),(-1.25,-.25,7.15),(-2.2,-.35,7.85),(-3.55,-.35,8.10)]),
    (0.32, 0.10, [(-1.1,-.18,7.0),(-1.65,.35,8.15),(-2.35,.75,9.05),(-3.0,.95,9.75)]),
    (0.36, 0.11, [(.05,.02,6.3),(-.55,-.35,7.6),(-1.05,-.75,9.15),(-1.95,-1.05,11.25)]),
    (0.34, 0.10, [(.12,.02,7.15),(-.10,.45,8.6),(-.55,.65,10.55),(-1.15,.75,12.65)]),
    (0.30, 0.09, [(.10,0,7.25),(.35,-.15,9.0),(.22,-.20,11.25),(.15,-.25,13.45)]),
    (0.38, 0.12, [(.05,.03,5.8),(.75,.35,7.2),(1.15,.75,9.3),(1.25,1.05,12.15)]),
    (0.36, 0.11, [(.30,.02,5.45),(1.0,-.30,6.65),(1.85,-.62,8.3),(2.75,-.75,11.15)]),
    (0.31, 0.09, [(1.55,-.5,8.0),(2.35,-.1,8.65),(3.0,.35,9.25),(3.65,.60,9.75)]),
    (0.27, 0.08, [(1.0,.55,7.6),(1.55,1.0,8.05),(2.35,1.65,8.60)]),
    (0.26, 0.08, [(.15,.25,7.3),(.15,.85,8.25),(.25,1.85,10.25)]),
    (0.24, 0.07, [(-.1,-.15,6.8),(-.15,-.75,7.65),(-.45,-1.80,9.25)]),
    (0.27, 0.08, [(1.7,-.5,7.7),(2.65,-.35,7.55),(4.10,-.05,7.95)]),
]


def args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--preview-dir", required=True)
    return parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def material(name, rgba):
    mat = bpy.data.materials.new(f"MAT_EUCALYPTUS_{name}_003")
    mat.diffuse_color = rgba
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = 0.86 if "BARK" in name else 0.72
    return mat


def make_materials():
    return {name: material(name, color) for name, color in PALETTE.items()}


def safe_basis(direction):
    tangent = direction.normalized()
    helper = Vector((0, 0, 1)) if abs(tangent.z) < .92 else Vector((1, 0, 0))
    side = tangent.cross(helper).normalized()
    up = side.cross(tangent).normalized()
    return side, up


def tube_mesh(name, points, r0, r1, sides, mat, parent, collection):
    verts, faces = [], []
    vectors = [Vector(p) for p in points]
    for idx, point in enumerate(vectors):
        if idx == 0:
            direction = vectors[1] - point
        elif idx == len(vectors)-1:
            direction = point - vectors[idx-1]
        else:
            direction = vectors[idx+1] - vectors[idx-1]
        side, up = safe_basis(direction)
        t = idx / (len(vectors)-1)
        radius = r0 * (1-t) + r1 * t
        # Elliptical, mildly irregular rings make the trunk less cylindrical.
        for j in range(sides):
            a = 2*math.pi*j/sides
            irregular = 1 + 0.045*math.sin(j*2.7 + idx*1.4)
            verts.append(tuple(point + irregular*radius*(math.cos(a)*side + .88*math.sin(a)*up)))
    for i in range(len(vectors)-1):
        for j in range(sides):
            a = i*sides+j
            b = i*sides+(j+1)%sides
            c = (i+1)*sides+(j+1)%sides
            d = (i+1)*sides+j
            faces.append((a,b,c,d))
    faces.append(tuple(range(sides-1,-1,-1)))
    top = (len(vectors)-1)*sides
    faces.append(tuple(top+j for j in range(sides)))
    mesh = bpy.data.meshes.new(name+"_MESH")
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj.parent = parent
    for poly in mesh.polygons:
        poly.use_smooth = True
    return obj


def bark_patches(lod, trunk_obj, materials, collection, parent):
    if lod == "MAP":
        return
    count = 26 if lod == "CLOSE" else 13
    rng = random.Random(SEED + count)
    verts, faces, mids = [], [], []
    for i in range(count):
        z = rng.uniform(.45, 7.0)
        angle = rng.uniform(0, 2*math.pi)
        radius = .61*(1-z/16) + .035
        width = rng.uniform(.13,.28)
        height = rng.uniform(.25,.72)
        center = Vector((math.cos(angle)*radius, math.sin(angle)*radius*.88, z))
        tangent = Vector((-math.sin(angle), math.cos(angle)*.88, 0)).normalized()
        normal = Vector((math.cos(angle), math.sin(angle), 0)).normalized()
        base = len(verts)
        verts += [tuple(center - tangent*width/2 - Vector((0,0,height/2)) + normal*.012),
                  tuple(center + tangent*width/2 - Vector((0,0,height*.42)) + normal*.012),
                  tuple(center + tangent*width*.38 + Vector((0,0,height/2)) + normal*.012),
                  tuple(center - tangent*width*.42 + Vector((0,0,height*.38)) + normal*.012)]
        faces.append((base,base+1,base+2,base+3))
        mids.append(0 if i%3 else 1)
    mesh = bpy.data.meshes.new(f"{lod}_BARK_PATCHES_MESH")
    mesh.from_pydata(verts,[],faces)
    mesh.materials.append(materials["BARK_MID"])
    mesh.materials.append(materials["BARK_DARK"])
    for poly, idx in zip(mesh.polygons,mids): poly.material_index=idx
    obj=bpy.data.objects.new(f"{ASSET_ID}_{lod}_BARK_PATCHES",mesh)
    collection.objects.link(obj); obj.parent=parent


def leaf_mesh(lod, count, segments, materials, collection, parent):
    rng = random.Random(SEED + {"CLOSE":1,"GAMEPLAY":2,"MAP":3}[lod])
    verts, faces, material_ids = [], [], []
    weights = [max(.2, c[3]*c[4]) for c in CLUSTERS]
    chosen = rng.choices(CLUSTERS, weights=weights, k=count)
    for i, (cx,cy,cz,sx,sy,sz) in enumerate(chosen):
        # Ellipsoid distribution biased toward cluster surface and hanging lower edge.
        theta=rng.uniform(0,2*math.pi); radial=math.sqrt(rng.uniform(.04,.78))
        x=cx+math.cos(theta)*sx*radial
        y=cy+math.sin(theta)*sy*radial
        z=cz+rng.uniform(-sz*.75,sz*.6)-.18*radial
        length=rng.uniform(.40,.66) if lod!="MAP" else rng.uniform(.48,.74)
        width=length*rng.uniform(.27,.38)
        droop=Vector((rng.uniform(-.2,.2),rng.uniform(-.2,.2),-1)).normalized()
        # Rotate every spray around its droop axis. A fixed basis makes the
        # entire crown disappear edge-on from one orthographic direction.
        phi=rng.uniform(0,2*math.pi)
        side=Vector((math.cos(phi),math.sin(phi),rng.uniform(-.08,.08))).normalized()
        center=Vector((x,y,z))
        base=len(verts)
        # A tapered lanceolate leaf strip with a slight central fold.
        for s in range(segments+1):
            t=s/segments
            p=center+droop*(t-.45)*length
            half=width*math.sin(math.pi*t)
            fold=Vector((0,0,1))*width*.08*math.sin(math.pi*t)
            verts.extend([tuple(p-side*half+fold),tuple(p+side*half-fold)])
        for s in range(segments):
            q=base+s*2
            faces.extend([(q,q+1,q+3),(q,q+3,q+2)])
            material_ids.extend([i%4,i%4])
    mesh=bpy.data.meshes.new(f"{ASSET_ID}_{lod}_MERGED_FOLIAGE_SPRAYS_MESH")
    mesh.from_pydata(verts,[],faces)
    for key in ("LEAF_DARK","LEAF_MID","LEAF_LIGHT","NEW_GROWTH"):
        mesh.materials.append(materials[key])
    for poly, mid in zip(mesh.polygons, material_ids): poly.material_index=mid
    obj=bpy.data.objects.new(f"{ASSET_ID}_{lod}_MERGED_FOLIAGE_SPRAYS",mesh)
    collection.objects.link(obj); obj.parent=parent
    return obj


def add_secondary_twigs(lod, materials, collection, parent, sides):
    depth=LOD_CONFIG[lod]["twig_depth"]
    if depth == 0: return
    for i, c in enumerate(CLUSTERS):
        cx,cy,cz,_,_,_=c
        start=Vector((cx*.78,cy*.72,cz-.65))
        end=Vector((cx,cy,cz-.15))
        tube_mesh(f"{ASSET_ID}_{lod}_TWIG_{i:02d}",[start, (start+end)*.5+Vector((0,0,.12)),end],.075,.025,max(5,sides-2),materials["BARK_MID"],parent,collection)


def build_lod(lod, materials):
    collection=bpy.data.collections.new(f"{STEM}_LOD_{lod}")
    bpy.context.scene.collection.children.link(collection)
    root=bpy.data.objects.new(f"{ASSET_ID}_LOD_{lod}_ROOT",None)
    collection.objects.link(root)
    anchor=bpy.data.objects.new(f"{ASSET_ID}_LOD_{lod}_IDENTITY_ANCHOR",None)
    anchor.empty_display_type="PLAIN_AXES"; anchor.empty_display_size=.45
    anchor["componentRole"]="IDENTITY_ANCHOR"; anchor["assetId"]=ASSET_ID; anchor["version"]=VERSION
    collection.objects.link(anchor); anchor.parent=root
    sides=LOD_CONFIG[lod]["sides"]
    for idx,(r0,r1,points) in enumerate(BRANCHES):
        # MAP keeps only the trunk and dominant structural branches.
        if lod=="MAP" and idx not in (0,1,3,4,5,6,7,8,12): continue
        tube_mesh(f"{ASSET_ID}_{lod}_WOOD_{idx:02d}",points,r0,r1,sides,materials["BARK_LIGHT"],root,collection)
    trunk=next(obj for obj in collection.objects if obj.name.endswith("WOOD_00"))
    bark_patches(lod,trunk,materials,collection,root)
    add_secondary_twigs(lod,materials,collection,root,sides)
    leaf_mesh(lod,LOD_CONFIG[lod]["leaf_count"],LOD_CONFIG[lod]["leaf_segments"],materials,collection,root)
    return collection,root,anchor


def export_lod(output_dir,lod,collection):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in collection.all_objects: obj.select_set(True)
    path=output_dir/f"{STEM}_LOD_{lod}.glb"
    bpy.ops.export_scene.gltf(filepath=str(path),export_format="GLB",use_selection=True,export_apply=True)
    return path


def camera_at(name, location, target, ortho=17.0):
    data=bpy.data.cameras.new(name); cam=bpy.data.objects.new(name,data)
    bpy.context.scene.collection.objects.link(cam); cam.location=location
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat("-Z","Y").to_euler()
    data.type="ORTHO"; data.ortho_scale=ortho
    return cam


def setup_render(materials):
    world=bpy.context.scene.world or bpy.data.worlds.new("WORLD")
    bpy.context.scene.world=world; world.use_nodes=True
    world.node_tree.nodes["Background"].inputs["Color"].default_value=(0.78,.84,.88,1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value=.7
    light_data=bpy.data.lights.new("SUN","SUN"); light_data.energy=2.2; light_data.angle=.35
    light=bpy.data.objects.new("SUN",light_data); bpy.context.scene.collection.objects.link(light)
    light.rotation_euler=(math.radians(28),math.radians(-24),math.radians(-32))
    bpy.context.scene.render.engine="BLENDER_EEVEE_NEXT"
    bpy.context.scene.render.resolution_x=900; bpy.context.scene.render.resolution_y=900; bpy.context.scene.render.resolution_percentage=100
    bpy.context.scene.render.image_settings.file_format="PNG"
    bpy.context.scene.render.film_transparent=False
    bpy.context.scene.view_settings.look="AgX - Medium High Contrast"


def render_previews(preview_dir, lod_collections):
    setup_render(None)
    views={
        "front":((0,-24,7),(0,0,7),17),
        "side":((24,0,7),(0,0,7),17),
        "top":((0,0,27),(0,0,7),17),
        "oblique":((18,-22,15),(0,0,7),18),
        "gameplay":((24,-30,22),(0,0,7),20),
    }
    for lod,col in lod_collections.items(): col.hide_render=(lod!="GAMEPLAY")
    for name,(loc,target,scale) in views.items():
        cam=camera_at(f"CAM_{name.upper()}",loc,target,scale); bpy.context.scene.camera=cam
        bpy.context.scene.render.filepath=str(preview_dir/f"{STEM}_GAMEPLAY_{name}.png")
        bpy.ops.render.render(write_still=True)
        bpy.data.objects.remove(cam,do_unlink=True)
    for lod,col in lod_collections.items(): col.hide_render=(lod!="CLOSE")
    cam=camera_at("CAM_CLOSE",(18,-22,15),(0,0,7),18); bpy.context.scene.camera=cam
    bpy.context.scene.render.filepath=str(preview_dir/f"{STEM}_CLOSE_oblique.png"); bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam,do_unlink=True)
    for lod,col in lod_collections.items(): col.hide_render=(lod!="MAP")
    cam=camera_at("CAM_MAP",(18,-22,15),(0,0,7),18); bpy.context.scene.camera=cam
    bpy.context.scene.render.filepath=str(preview_dir/f"{STEM}_MAP_oblique.png"); bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam,do_unlink=True)


def write_records(output_dir, preview_dir):
    limits={"CLOSE":{"preferred":[8000,12000],"hardCeiling":18000},"GAMEPLAY":{"preferred":[3000,5000],"hardCeiling":8000},"MAP":{"preferred":[600,1200],"hardCeiling":2000}}
    metadata={"assetId":ASSET_ID,"assetFamilyId":FAMILY_ID,"recipeReference":RECIPE_ID,"previousRegisteredVersion":"v002","targetRevisionVersion":VERSION,"authoredDimensionsMetres":{"height":14.0,"targetCrownWidth":9.0,"targetCrownDepth":7.5},"identityContractV2":{"assetId":ASSET_ID,"category":"nature","recipeId":RECIPE_ID,"version":VERSION,"variantId":"DEFAULT","paletteId":"AU_NATIVE_GREEN_001","lodProfile":"NATURE_STANDARD_001","dependencies":[{"dependencyId":"MOD_TREE_LEAF_CLUSTER_001","category":"module","identityPolicy":"DEPENDENCY_DECLARED_ONLY"}],"identityAnchor":{"componentRole":"IDENTITY_ANCHOR","required":True},"anchorValidation":"REQUIRE_PER_LOD_EXPORTED_ANCHOR"},"geometryLimits":limits,"productionIntent":["translate approved Classic River Red Eucalyptus Version 1 concept","preserve open asymmetric crown and negative space","use merged reusable foliage sprays","author coherent fourteen metre source scale"]}
    authoring={"assetId":ASSET_ID,"familyId":FAMILY_ID,"recipeReference":RECIPE_ID,"version":VERSION,"previousRegisteredVersion":"v002","protectedHistoricalVersions":["v001","v002"],"expectedBlendFilename":f"{STEM}.blend","expectedFinalOutputs":[f"{STEM}_LOD_{lod}.glb" for lod in LOD_CONFIG],"previewDirectory":str(preview_dir),"operatorVisualApprovalRequired":True,"runtimeActivated":False,"publishingPerformed":False}
    manifest={"assetId":ASSET_ID,"version":VERSION,"manifestVersion":"1.0.0","category":"nature","lodOrder":["CLOSE","GAMEPLAY","MAP"],"groundAnchorStrategy":"per-LOD IDENTITY_ANCHOR at trunk contact Z=0","deterministicSeed":SEED}
    for name,payload in (("metadata",metadata),("authoring-manifest",authoring),("manifest",manifest)):
        (output_dir/f"tree-eucalyptus-v003-{name}.json").write_text(json.dumps(payload,indent=2)+"\n")


def main():
    options=args(); output_dir=Path(options.output_dir).resolve(); preview_dir=Path(options.preview_dir).resolve()
    output_dir.mkdir(parents=True,exist_ok=True); preview_dir.mkdir(parents=True,exist_ok=True)
    reset_scene(); materials=make_materials(); lod_collections={}
    for lod in LOD_CONFIG:
        collection,_,_=build_lod(lod,materials); lod_collections[lod]=collection
    bpy.context.scene["assetId"]=ASSET_ID; bpy.context.scene["version"]=VERSION; bpy.context.scene["authoredHeightMetres"]=14.0
    blend=output_dir/f"{STEM}.blend"; bpy.ops.wm.save_as_mainfile(filepath=str(blend))
    exported=[str(export_lod(output_dir,lod,col)) for lod,col in lod_collections.items()]
    render_previews(preview_dir,lod_collections); write_records(output_dir,preview_dir)
    print(json.dumps({"assetId":ASSET_ID,"version":VERSION,"blend":str(blend),"exports":exported,"previews":str(preview_dir)},indent=2))


if __name__ == "__main__": main()
