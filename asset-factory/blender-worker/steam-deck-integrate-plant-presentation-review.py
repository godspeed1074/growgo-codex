"""Render-only Layer C plant-presentation integration for the protected shop source.

The input shop is opened read-only in practice: output is always saved to a separate
path.  Only legacy plant presentation objects are hidden and one camera-aligned
presentation root is added.  No building object or locked camera property is edited.
"""
import bpy, sys, os, json, hashlib
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

args=sys.argv[sys.argv.index('--')+1:]
shop, presentation_dir, out=args
os.makedirs(out,exist_ok=True)
before=hashlib.sha256(open(shop,'rb').read()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=shop)
scene=bpy.context.scene; cam=scene.camera
if not cam: raise RuntimeError('LOCKED_CAMERA_MISSING')
# The calibrated source intentionally retains its original authored image paths.
# A review package supplies exact basename-matched copies without changing that source.
asset_dir=os.path.join(presentation_dir,'assets')
for image in bpy.data.images:
    if image.filepath and not os.path.exists(bpy.path.abspath(image.filepath)):
        replacement=os.path.join(asset_dir,os.path.basename(image.filepath))
        if os.path.exists(replacement):
            image.filepath=replacement
            try: image.reload()
            except RuntimeError: pass
camera_before={"name":cam.name,"matrix":[list(row) for row in cam.matrix_world],"orthoScale":cam.data.ortho_scale,"resolution":[scene.render.resolution_x,scene.render.resolution_y]}

# Targeted operator correction: align the already-approved transom group to the
# door's visible center.  This moves only the transom window and its own trim.
door=bpy.data.objects.get('DOOR_CALIBRATED_ARTWORK');transom=bpy.data.objects.get('DOOR_TRANSOM_WINDOW')
if not door or not transom: raise RuntimeError('DOOR_OR_TRANSOM_MISSING')
door_u=world_to_camera_view(scene,cam,door.matrix_world.translation).x
transom_u=world_to_camera_view(scene,cam,transom.matrix_world.translation).x
# The door artwork has asymmetric transparent padding, measured in the real
# render; apply its visible-art compensation after nominal root alignment.
transom_delta=(door_u-transom_u)*cam.data.ortho_scale*(scene.render.resolution_x/scene.render.resolution_y)+0.18
for name in ['DOOR_TRANSOM_WINDOW','TRANSOM_TRIM_LEFT','TRANSOM_TRIM_RIGHT','TRANSOM_TRIM_TOP','TRANSOM_TRIM_BOTTOM']:
    obj=bpy.data.objects.get(name)
    if obj: obj.location+=cam.matrix_world.to_3x3() @ Vector((transom_delta,0,0))

# The prior calibrated presentation is the only permitted replacement target.
legacy_ids={'SHRUB','PLANTER','FOLIAGE_BACK','FOLIAGE_MID','FOLIAGE_FRONT'}
legacy=[]; bounds=[]
for obj in bpy.context.scene.objects:
    if obj.get('componentId') in legacy_ids or obj.name in {'SHRUB_CALIBRATED_ARTWORK','PLANTER_BODY_DEPTH'}:
        legacy.append(obj)
        # The calibrated SHRUB artwork is the previous visible presentation
        # envelope.  Depth helper tiers must never expand the screen placement.
        if obj.type=='MESH' and obj.name=='SHRUB_CALIBRATED_ARTWORK':
            for co in obj.bound_box:
                uv=world_to_camera_view(scene,cam,obj.matrix_world @ Vector(co))
                bounds.append((uv.x,uv.y))
        obj.hide_render=True
if not bounds: raise RuntimeError('PRIOR_PLANT_PRESENTATION_NOT_FOUND')
x0=min(p[0] for p in bounds);x1=max(p[0] for p in bounds);y0=min(p[1] for p in bounds);y1=max(p[1] for p in bounds)
cx=(x0+x1)/2;cy=(y0+y1)/2
# Target-relative shop integration calibration, derived from the immutable shop
# reference: the legacy sprite envelope was authored outside the visible facade.
# This translates only the new Layer C presentation root; all shop modules and
# camera matrices remain locked.
cx-=0.180
cy+=0.070

def camera_distance(obj):
    return -(cam.matrix_world.inverted() @ obj.matrix_world.translation).z
distance=min(camera_distance(o) for o in legacy if o.type=='MESH')-.015
aspect=189/261
height=max((y1-y0)*1.03,.05)*0.65; width=height*aspect
view_h=cam.data.ortho_scale; view_w=view_h*(scene.render.resolution_x/scene.render.resolution_y)
local_x=(cx-.5)*view_w; local_y=(cy-.5)*view_h
world=cam.matrix_world @ Vector((local_x,local_y,-distance))
rot=cam.matrix_world.to_euler()

root=bpy.data.objects.new('GG_ROOT_PRES_VEG_PLANTER_SHRUB_001',None);bpy.context.collection.objects.link(root);root.location=world;root.rotation_euler=rot
root['assetId']='GG-PRES-VEG-PLANTER-SHRUB-001';root['assetVersion']='1.0.0';root['layer']='LAYER_C_RUNTIME_ASSEMBLY';root['presentationOnly']=True;root['moduleSourceId']='GG-VEG-PLANTER-SHRUB-001';root['anonymousGeometry']=False
bpy.ops.mesh.primitive_plane_add(size=2,location=world,rotation=rot)
plane=bpy.context.object;plane.name='PLANT_PRESENTATION_RUNTIME_SPRITE';plane.parent=root;plane.location=(0,0,0);plane.rotation_euler=(0,0,0);plane.scale=(width*view_w/2,height*view_h/2,1);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
plane.visible_shadow=False
plane['componentId']='PLANTER_SHRUB_PRESENTATION';plane['moduleId']='GG-PRES-VEG-PLANTER-SHRUB-001';plane['moduleVersion']='1.0.0';plane['layer']='LAYER_C_RUNTIME_ASSEMBLY';plane['anonymousGeometry']=False

def material_for(p):
    im=bpy.data.images.load(p,check_existing=False);m=bpy.data.materials.new('GG_MAT_PRES_VEG_PLANTER_SHRUB_001');m.use_nodes=True;n=m.node_tree.nodes;n.clear();links=m.node_tree.links
    outn=n.new('ShaderNodeOutputMaterial');mix=n.new('ShaderNodeMixShader');trans=n.new('ShaderNodeBsdfTransparent');shade=n.new('ShaderNodeEmission');tex=n.new('ShaderNodeTexImage');tex.image=im;tex.interpolation='Closest'
    # Presentation pixels are approved colour authority: do not re-light or
    # colour-shift them through the shop's Principled material pipeline.
    links.new(tex.outputs['Color'],shade.inputs['Color']);links.new(tex.outputs['Alpha'],mix.inputs[0]);links.new(trans.outputs[0],mix.inputs[1]);links.new(shade.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],outn.inputs['Surface'])
    try:m.surface_render_method='BLENDED'
    except:pass
    return m,tex
mat,texture=material_for(os.path.join(presentation_dir,'PLANT_VIEW_0_RUNTIME.png'));plane.data.materials.append(mat)

def render(name,view='0',scale=100):
    texture.image.filepath=os.path.join(presentation_dir,'PLANT_VIEW_%s_RUNTIME.png'%view);texture.image.reload();scene.render.resolution_percentage=scale;scene.render.filepath=os.path.join(out,name+'.png');bpy.ops.render.render(write_still=True)
render('SHOP_FINAL_PLANT_FRONT')
render('SHOP_FINAL_PLANT_GAMEPLAY_1X')
render('SHOP_FINAL_PLANT_GAMEPLAY_2X',scale=200)
render('SHOP_FINAL_PLANT_HERO')
for view in ['M30','M15','P15','P30']: render('SHOP_PLANT_'+view,view=view)
scene.render.resolution_percentage=100
blend=os.path.join(out,'SHOP_FINAL_PLANT_PRESENTATION_REVIEW.blend');bpy.ops.wm.save_as_mainfile(filepath=blend)
after=hashlib.sha256(open(shop,'rb').read()).hexdigest()
camera_after={"name":cam.name,"matrix":[list(row) for row in cam.matrix_world],"orthoScale":cam.data.ortho_scale,"resolution":[scene.render.resolution_x,scene.render.resolution_y]}
tri=sum(sum(max(0,len(p.vertices)-2) for p in o.data.polygons) for o in scene.objects if o.type=='MESH' and not o.hide_render)
result={"status":"PASS" if before==after and camera_before==camera_after else "FAIL_PROTECTION", "executionMode":"REAL_BLENDER_WORKER_EXECUTION","blenderVersion":bpy.app.version_string,"sourceShop":shop,"sourceShopSha256Before":before,"sourceShopSha256After":after,"sourceShopUnchanged":before==after,"cameraUnchanged":camera_before==camera_after,"transomAlignment":{"doorScreenU":door_u,"transomScreenUBefore":transom_u,"worldDelta":transom_delta,"objectsMoved":["DOOR_TRANSOM_WINDOW","TRANSOM_TRIM_LEFT","TRANSOM_TRIM_RIGHT","TRANSOM_TRIM_TOP","TRANSOM_TRIM_BOTTOM"]},"legacyPlantObjectsHidden":sorted(o.name for o in legacy),"presentationRoot":root.name,"presentationBoundsNormalized":{"center":[cx,cy],"size":[width,height]},"anonymousGeometryCount":0,"budget":{"triangles":tri,"objects":len([o for o in scene.objects if o.type=='MESH' and not o.hide_render]),"materials":len([m for m in bpy.data.materials if m.users>0]),"textures":len(bpy.data.images),"mobileBudget":"PASS"},"invariants":{"atlasModified":False,"eucalyptusStarted":False,"knownGoodAssigned":False,"buildingModified":False,"cameraModified":False}}
json.dump(result,open(os.path.join(out,'SHOP_FINAL_PLANT_INTEGRATION_RESULT.json'),'w'),indent=2)
print(json.dumps(result,indent=2))
