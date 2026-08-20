import bpy, os, sys
from mathutils import Vector
root=sys.argv[-1]; os.makedirs(root,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
for e in ('BLENDER_EEVEE','BLENDER_EEVEE_NEXT'):
 try: scene.render.engine=e; break
 except TypeError: pass
mat=bpy.data.materials.new('GG_MAT_EUC_BARK_PREFLIGHT'); mat.diffuse_color=(.33,.30,.22,1)
def path(name,points,r):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=6;c.bevel_depth=r;c.bevel_resolution=1
 s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
 for i,(co,scale) in enumerate(points):p=s.bezier_points[i];p.co=co;p.radius=scale;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 co=bpy.data.objects.new(name+'_CURVE',c);bpy.context.collection.objects.link(co);co.data.materials.append(mat)
 mesh=bpy.data.meshes.new_from_object(co.evaluated_get(bpy.context.evaluated_depsgraph_get()),depsgraph=bpy.context.evaluated_depsgraph_get());ob=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(ob);ob.data.materials.append(mat);bpy.data.objects.remove(co,do_unlink=True)
path('PREFLIGHT_TRUNK',[((0,0,0),1.15),((-.12,0,1.5),.85),((.08,0,3.1),.55)],.26)
path('PREFLIGHT_LEFT',[((.05,0,2.9),1),((-.5,0,3.65),.65),((-1.55,0,4.05),.22)],.15)
path('PREFLIGHT_RIGHT',[((.08,0,3.05),1),((.55,0,3.72),.65),((1.55,0,4.35),.22)],.15)
bpy.ops.object.camera_add(location=(0,-10,3.1));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=6;cam.rotation_euler=(Vector((0,0,2.2))-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
bpy.ops.object.light_add(type='AREA',location=(-4,-5,7));bpy.context.object.data.energy=700;bpy.context.object.data.size=6
scene.render.resolution_x=scene.render.resolution_y=720;scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(root,'EUCALYPTUS_CURVE_CARCASS_PREFLIGHT.png');bpy.ops.render.render(write_still=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=os.path.join(root,'EUCALYPTUS_CURVE_CARCASS_PREFLIGHT.glb'),export_format='GLB')
print('CURVE_CARCASS_PREFLIGHT_PASS')
