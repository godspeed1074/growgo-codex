import bpy,sys,os
blend,out=sys.argv[sys.argv.index('--')+1:];bpy.ops.wm.open_mainfile(filepath=blend);s=bpy.context.scene
names=['WALL_PANEL_MAIN','WALL_PANEL_LEFT','WALL_PANEL_RIGHT','WALL_PANEL_ABOVE_DOOR','DOOR_SURROUND','WALL_FACADE_SHELL','DOOR_CALIBRATED_ARTWORK']
for n in names:
 for o in bpy.data.objects:o.hide_render=False
 for o in bpy.data.objects:
  if o.name.startswith(n):o.hide_render=True
 s.render.filepath=os.path.join(out,'HIDE_'+n+'.png');bpy.ops.render.render(write_still=True)
