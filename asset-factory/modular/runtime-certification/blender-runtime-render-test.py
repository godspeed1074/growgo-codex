import bpy
bpy.ops.mesh.primitive_cube_add(size=2)
o=bpy.context.object
o.name='GG_RUNTIME_CERT_FIXTURE'
bpy.ops.object.camera_add(location=(0,-6,0))
c=bpy.context.object
c.rotation_euler=(1.5708,0,0)
bpy.context.scene.camera=c
s=bpy.context.scene
s.render.resolution_x=32
s.render.resolution_y=32
s.render.resolution_percentage=100
s.render.image_settings.file_format='PNG'
s.render.image_settings.color_mode='RGBA'
s.render.filepath="asset-factory/modular/runtime-certification/BLENDER_RUNTIME_RENDER_TEST.png"
bpy.ops.render.render(write_still=True)
