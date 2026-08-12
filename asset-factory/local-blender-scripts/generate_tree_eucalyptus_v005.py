"""Generate TREE_EUCALYPTUS_001 v005 from the approved GrowGo concept.

Semi-stylized target: 60% recognizable river-red eucalyptus, 40% clean
GrowGo game-art stylization. Blender 4.2 LTS. Review candidate only.
"""
from __future__ import annotations
import argparse, json, math, random, sys
from pathlib import Path
import bpy
from mathutils import Vector

ASSET_ID="TREE_EUCALYPTUS_001"; VERSION="v005"; STEM=f"{ASSET_ID}_{VERSION}"
FAMILY_ID="COASTAL_NATURE_FAMILY_001"; RECIPE_ID="TREE_EUCALYPTUS_RECIPE_001"; SEED=51005
PALETTE={
 "BARK_LIGHT":(.84,.70,.52,1),"BARK_MID":(.70,.43,.22,1),"BARK_ACCENT":(.52,.25,.09,1),
 "LEAF_DARK":(.055,.16,.09,1),"LEAF_MID":(.18,.31,.15,1),"LEAF_LIGHT":(.40,.48,.24,1),"NEW_GROWTH":(.67,.61,.13,1)}

# Nine groups mirror the approved top/middle/lower hierarchy and leave large sky gaps.
GROUPS=[
 (-2.35,.40,12.35,1.55,1.36,1.02),(.10,-.40,13.20,1.55,1.36,.92),(2.15,.75,12.05,1.55,1.40,1.02),
 (-3.35,-.98,10.05,1.62,1.47,1.02),(-.65,1.90,10.55,1.48,1.36,.95),(2.95,-1.38,9.85,1.65,1.50,1.02),
 (-3.25,1.55,7.75,1.48,1.36,.90),(-.35,-2.07,8.25,1.38,1.29,.88),(3.30,1.50,7.90,1.48,1.36,.90)]

# One trunk and seven clean non-radial limb systems.
LIMBS=[
 (.72,.24,[(0,0,0),(-.10,.04,1.5),(.12,.10,3.0),(-.05,.08,4.6),(.18,.04,6.15),(.04,0,7.5),(.10,-.05,9.0)]),
 (.44,.11,[(-.03,0,5.15),(-.70,.12,6.0),(-1.55,.45,6.9),(-2.35,1.0,7.45),(-3.25,1.35,7.75)]),
 (.37,.09,[(-.18,.12,6.8),(-.85,-.18,7.7),(-1.75,-.55,8.7),(-2.6,-.78,9.55),(-3.35,-.85,10.05)]),
 (.36,.08,[(-.02,.05,7.7),(-.65,.40,8.9),(-1.35,.48,10.2),(-2.0,.40,11.5),(-2.35,.35,12.35)]),
 (.34,.075,[(.08,-.02,8.55),(.10,-.15,10.0),(.05,-.28,11.5),(.10,-.35,13.20)]),
 (.40,.10,[(.12,.02,5.75),(.75,-.28,6.65),(1.55,-.65,7.6),(2.35,-1.0,8.8),(2.95,-1.20,9.85)]),
 (.36,.085,[(.20,.10,7.15),(.85,.48,8.35),(1.35,.72,9.8),(1.75,.72,11.1),(2.15,.65,12.05)]),
 (.31,.07,[(1.4,-.6,7.5),(2.15,.05,7.45),(2.75,.78,7.65),(3.30,1.30,7.90)]),
]
LOD={"CLOSE":{"sides":9,"lobes":5,"seg":14,"rings":5,"leaves":20},"GAMEPLAY":{"sides":7,"lobes":3,"seg":12,"rings":4,"leaves":14},"MAP":{"sides":5,"lobes":1,"seg":9,"rings":3,"leaves":0}}

def arguments():
 p=argparse.ArgumentParser(); p.add_argument("--output-dir",required=True); p.add_argument("--preview-dir",required=True)
 return p.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
def reset():
 bpy.ops.object.select_all(action="SELECT"); bpy.ops.object.delete(use_global=False)
 for blocks in (bpy.data.meshes,bpy.data.materials,bpy.data.cameras,bpy.data.lights):
  for block in list(blocks):
   if block.users==0: blocks.remove(block)
def material(name,color):
 m=bpy.data.materials.new(f"MAT_EUCALYPTUS_{name}_005"); m.diffuse_color=color; m.use_nodes=True
 b=m.node_tree.nodes.get("Principled BSDF"); b.inputs["Base Color"].default_value=color; b.inputs["Roughness"].default_value=.84; return m
def make_materials(): return {k:material(k,v) for k,v in PALETTE.items()}
def frame(direction):
 t=direction.normalized(); h=Vector((0,0,1)) if abs(t.z)<.9 else Vector((1,0,0)); s=t.cross(h).normalized(); u=s.cross(t).normalized(); return s,u
def tube(name,points,r0,r1,sides,mat,parent,col):
 pts=[Vector(p) for p in points]; verts=[]; faces=[]
 for i,p in enumerate(pts):
  d=pts[min(i+1,len(pts)-1)]-pts[max(i-1,0)]; s,u=frame(d); t=i/(len(pts)-1); r=r0*(1-t)+r1*t
  for j in range(sides):
   a=2*math.pi*j/sides; wobble=1+.045*math.sin(j*2.1+i*1.3); verts.append(tuple(p+wobble*r*(math.cos(a)*s+.84*math.sin(a)*u)))
 for i in range(len(pts)-1):
  for j in range(sides):
   a=i*sides+j;b=i*sides+(j+1)%sides;c=(i+1)*sides+(j+1)%sides;d=(i+1)*sides+j;faces.append((a,b,c,d))
 faces += [tuple(range(sides-1,-1,-1)),tuple((len(pts)-1)*sides+j for j in range(sides))]
 mesh=bpy.data.meshes.new(name+"_MESH");mesh.from_pydata(verts,[],faces);mesh.materials.append(mat);obj=bpy.data.objects.new(name,mesh);col.objects.link(obj);obj.parent=parent
 for p in mesh.polygons:p.use_smooth=True
 return obj
def root_flare(lod,mats,parent,col):
 specs=[(.0,1.18,.42),(1.0,.98,.36),(2.05,1.05,.38),(3.1,1.20,.42),(4.2,.92,.34),(5.25,1.02,.36)]
 for i,(a,l,w) in enumerate(specs):
  end=(math.cos(a)*l,math.sin(a)*l,-.015);tube(f"{ASSET_ID}_{lod}_ROOT_FLARE_{i}",[(0,0,.72),(end[0]*.42,end[1]*.42,.22),end],w,.035,max(5,LOD[lod]["sides"]-2),mats["BARK_LIGHT"],parent,col)
def bark_patches(lod,mats,parent,col):
 if lod=="MAP":return
 specs=[(.22,-.55,1.25,.50,1.05,0),(-.42,.18,2.25,.44,1.18,1),(.38,.32,3.45,.42,.90,0),(-.28,-.46,4.42,.38,.82,1),(.15,.40,5.45,.34,.70,0),(-.12,-.34,6.40,.28,.58,1),(.18,.24,7.22,.24,.50,0)]
 verts=[];faces=[];ids=[]
 for x,y,z,w,h,mid in specs:
  b=len(verts);verts += [(x-w/2,y,z-h/2),(x+w/2,y,z-h*.43),(x+w*.40,y,z+h/2),(x-w*.46,y,z+h*.36)];faces.append((b,b+1,b+2,b+3));ids.append(mid)
 mesh=bpy.data.meshes.new(f"{lod}_BARK_BLOCKS_MESH");mesh.from_pydata(verts,[],faces);mesh.materials.append(mats["BARK_MID"]);mesh.materials.append(mats["BARK_ACCENT"])
 for p,mid in zip(mesh.polygons,ids):p.material_index=mid
 obj=bpy.data.objects.new(f"{ASSET_ID}_{lod}_BARK_BLOCKS",mesh);col.objects.link(obj);obj.parent=parent

def add_lobed_volume(verts,faces,center,scale,segments,rings,rng):
 base=len(verts);cx,cy,cz=center;sx,sy,sz=scale
 verts.append((cx,cy,cz-sz))
 for r in range(1,rings):
  phi=-math.pi/2+math.pi*r/rings
  for j in range(segments):
   a=2*math.pi*j/segments;lob=1+.10*math.sin(a*3+r*.7)+rng.uniform(-.035,.035)
   verts.append((cx+math.cos(phi)*math.cos(a)*sx*lob,cy+math.cos(phi)*math.sin(a)*sy*lob,cz+math.sin(phi)*sz*(1+.04*math.sin(a*2))))
 top=len(verts);verts.append((cx,cy,cz+sz*.86))
 for j in range(segments):faces.append((base,base+1+(j+1)%segments,base+1+j))
 for r in range(rings-2):
  a0=base+1+r*segments;a1=a0+segments
  for j in range(segments):faces.extend([(a0+j,a0+(j+1)%segments,a1+(j+1)%segments),(a0+j,a1+(j+1)%segments,a1+j)])
 last=base+1+(rings-2)*segments
 for j in range(segments):faces.append((top,last+j,last+(j+1)%segments))
 return len(faces)
def add_leaf(verts,faces,center,length,width,direction,normal):
 c=Vector(center);n=Vector(normal).normalized()
 # One reusable spray is a three-blade fan. The blades merge at gameplay
 # distance but preserve the long, hanging river-red eucalyptus character.
 for k in (-1,0,1):
  d=(Vector(direction)+Vector((k*.12,-k*.07,abs(k)*.025))).normalized();s=d.cross(n).normalized();base=len(verts);blade_length=length*(1-.08*abs(k));blade_width=width*(1-.06*abs(k));bc=c+s*(k*width*.55)+n*(abs(k)*width*.05)
  pts=[bc-d*blade_length*.50,bc-d*blade_length*.15-s*blade_width,bc+d*blade_length*.20-s*blade_width*.78,bc+d*blade_length*.50,bc+d*blade_length*.20+s*blade_width*.78,bc-d*blade_length*.15+s*blade_width,bc+n*blade_width*.12]
  verts += [tuple(p) for p in pts]
  faces += [(base,base+1,base+6),(base+1,base+2,base+6),(base+2,base+3,base+6),(base+3,base+4,base+6),(base+4,base+5,base+6),(base+5,base,base+6)]
def foliage(lod,mats,parent,col):
 cfg=LOD[lod];rng=random.Random(SEED+{"CLOSE":1,"GAMEPLAY":2,"MAP":3}[lod]);verts=[];faces=[];mids=[]
 lobe_offsets=[(-.22,-.12,.05,.90,0),(.24,.13,.08,.74,1),(.03,-.08,-.18,.58,2),(-.08,.20,.14,.56,1),(.18,-.20,-.12,.52,0)]
 for gi,(cx,cy,cz,sx,sy,sz) in enumerate(GROUPS):
  for li in range(cfg["lobes"]):
   ox,oy,oz,ss,mid=lobe_offsets[li];before=len(faces)
   add_lobed_volume(verts,faces,(cx+ox*sx,cy+oy*sy,cz+oz*sz),(sx*ss,sy*ss,sz*ss),cfg["seg"],cfg["rings"],rng)
   mids.extend([mid]*(len(faces)-before))
  for i in range(cfg["leaves"]):
   a=2*math.pi*i/cfg["leaves"]+rng.uniform(-.16,.16);edge=.94+rng.uniform(-.06,.12)
   center=(cx+math.cos(a)*sx*edge,cy+math.sin(a)*sy*edge,cz+rng.uniform(-.72,.24)*sz)
   direction=(rng.uniform(-.18,.18),rng.uniform(-.18,.18),-1);normal=(math.cos(a),math.sin(a),.12);before=len(faces)
   add_leaf(verts,faces,center,rng.uniform(.68,.90),rng.uniform(.16,.22),direction,normal);mids.extend([(3 if i%11==0 else (2 if i%3==0 else 1))]*(len(faces)-before))
 mesh=bpy.data.meshes.new(f"{ASSET_ID}_{lod}_STYLIZED_LEAF_CLUSTERS_MESH");mesh.from_pydata(verts,[],faces)
 for key in ("LEAF_DARK","LEAF_MID","LEAF_LIGHT","NEW_GROWTH"):mesh.materials.append(mats[key])
 for p,mid in zip(mesh.polygons,mids):p.material_index=mid
 obj=bpy.data.objects.new(f"{ASSET_ID}_{lod}_STYLIZED_LEAF_CLUSTERS",mesh);col.objects.link(obj);obj.parent=parent
 for p in mesh.polygons:p.use_smooth=True
def build_lod(lod,mats):
 col=bpy.data.collections.new(f"{STEM}_LOD_{lod}");bpy.context.scene.collection.children.link(col);root=bpy.data.objects.new(f"{ASSET_ID}_LOD_{lod}_ROOT",None);col.objects.link(root)
 anchor=bpy.data.objects.new(f"{ASSET_ID}_LOD_{lod}_IDENTITY_ANCHOR",None);col.objects.link(anchor);anchor.parent=root;anchor["componentRole"]="IDENTITY_ANCHOR";anchor["assetId"]=ASSET_ID;anchor["version"]=VERSION
 limb_count=len(LIMBS) if lod!="MAP" else 6
 for i,(r0,r1,path) in enumerate(LIMBS[:limb_count]):tube(f"{ASSET_ID}_{lod}_ORGANIC_LIMB_{i}",path,r0,r1,LOD[lod]["sides"],mats["BARK_LIGHT"],root,col)
 root_flare(lod,mats,root,col);bark_patches(lod,mats,root,col);foliage(lod,mats,root,col);return col
def export_lod(out,lod,col):
 bpy.ops.object.select_all(action="DESELECT")
 for obj in col.all_objects:obj.select_set(True)
 p=out/f"{STEM}_LOD_{lod}.glb";bpy.ops.export_scene.gltf(filepath=str(p),export_format="GLB",use_selection=True,export_apply=True);return p
def camera(name,loc,target,scale):
 d=bpy.data.cameras.new(name);o=bpy.data.objects.new(name,d);bpy.context.scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat("-Z","Y").to_euler();d.type="ORTHO";d.ortho_scale=scale;return o
def setup_render():
 w=bpy.context.scene.world or bpy.data.worlds.new("WORLD");bpy.context.scene.world=w;w.use_nodes=True;w.node_tree.nodes["Background"].inputs["Color"].default_value=(.76,.84,.90,1);w.node_tree.nodes["Background"].inputs["Strength"].default_value=.72
 ld=bpy.data.lights.new("SUN","SUN");ld.energy=2.25;ld.angle=.36;l=bpy.data.objects.new("SUN",ld);bpy.context.scene.collection.objects.link(l);l.rotation_euler=(.46,-.38,-.58)
 s=bpy.context.scene;s.render.engine="BLENDER_EEVEE_NEXT";s.render.resolution_x=900;s.render.resolution_y=900;s.render.resolution_percentage=100;s.render.image_settings.file_format="PNG";s.view_settings.look="AgX - Medium High Contrast"
def render(preview,collections):
 setup_render();views={"front":((0,-25,7),(0,0,7),17),"oblique":((18,-22,15),(0,0,7),18),"side":((25,0,7),(0,0,7),17),"top":((0,0,28),(0,0,7),18),"gameplay_distance":((26,-33,23),(0,0,7),21),"close_trunk_root":((6,-10,5),(0,0,3.2),8),"close_foliage":((8,-11,12),(0,0,10.8),9),"hero":((14,-20,12),(0,0,7),17)}
 for lod,col in collections.items():col.hide_render=lod!="GAMEPLAY"
 for name,(loc,target,scale) in views.items():
  cam=camera("CAM_"+name.upper(),loc,target,scale);bpy.context.scene.camera=cam;bpy.context.scene.render.filepath=str(preview/f"{STEM}_GAMEPLAY_{name}.png");bpy.ops.render.render(write_still=True);bpy.data.objects.remove(cam,do_unlink=True)
def records(out,preview):
 meta={"assetId":ASSET_ID,"assetFamilyId":FAMILY_ID,"recipeReference":RECIPE_ID,"previousCandidateVersion":"v004","targetRevisionVersion":VERSION,"status":"PENDING_OPERATOR_REVIEW","authoredDimensionsMetres":{"height":14.0,"crownWidth":9.0,"crownDepth":7.0},"construction":{"majorCanopyGroups":9,"majorLimbSystems":7,"foliageTechnique":"reusable irregular low-poly sub-masses with restrained drooping silhouette leaves","materials":7},"protectedHistoricalVersions":["v001","v002","v003","v004"],"registered":False,"promoted":False,"published":False,"activated":False}
 auth={"assetId":ASSET_ID,"version":VERSION,"expectedBlendFilename":f"{STEM}.blend","expectedOutputs":[f"{STEM}_LOD_{x}.glb" for x in LOD],"previewDirectory":str(preview),"operatorVisualApprovalRequired":True,"status":"PENDING_OPERATOR_REVIEW"}
 man={"assetId":ASSET_ID,"version":VERSION,"manifestVersion":"1.0.0","lodOrder":["CLOSE","GAMEPLAY","MAP"],"groundAnchor":"per-LOD IDENTITY_ANCHOR at root contact","deterministicSeed":SEED}
 for n,p in (("metadata",meta),("authoring-manifest",auth),("manifest",man)):(out/f"tree-eucalyptus-v005-{n}.json").write_text(json.dumps(p,indent=2)+"\n")
def main():
 a=arguments();out=Path(a.output_dir).resolve();preview=Path(a.preview_dir).resolve();out.mkdir(parents=True,exist_ok=True);preview.mkdir(parents=True,exist_ok=True);reset();m=make_materials();cols={lod:build_lod(lod,m) for lod in LOD};bpy.context.scene["assetId"]=ASSET_ID;bpy.context.scene["version"]=VERSION;bpy.context.scene["authoredHeightMetres"]=14.0
 blend=out/f"{STEM}.blend";bpy.ops.wm.save_as_mainfile(filepath=str(blend));exports=[str(export_lod(out,lod,col)) for lod,col in cols.items()];render(preview,cols);records(out,preview);print(json.dumps({"assetId":ASSET_ID,"version":VERSION,"blend":str(blend),"exports":exports,"status":"PENDING_OPERATOR_REVIEW"},indent=2))
if __name__=="__main__":main()
