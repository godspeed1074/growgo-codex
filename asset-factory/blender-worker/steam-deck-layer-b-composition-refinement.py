import bpy,json,os,sys,math
from mathutils import Vector
blend_in,out=sys.argv[sys.argv.index('--')+1:];os.makedirs(out,exist_ok=True);bpy.ops.wm.open_mainfile(filepath=blend_in)
trans={'WALL':{'location':(0,0,1.7),'scale':(1,1,1.12)},'FASCIA':{'location':(0,0,3.85),'scale':(1.05,1.05,1.12)},'SIGN':{'location':(0,-.65,3.85),'scale':(1.05,1.05,1.1)},'AWNING':{'location':(0,-.82,2.95),'scale':(1.05,1.18,1.08)},'WINDOW':{'location':(1.0,-.32,1.7),'scale':(1.12,1.05,1.12)},'DOOR':{'location':(-1.2,-.3,1.2),'scale':(1.02,1.02,1.06)},'FOUNDATION':{'location':(0,0,0),'scale':(1.04,1.08,1.0)},'PLANTER':{'location':(2.25,-.2,.62),'scale':(1.08,1.08,1.08)}}
before={};objects=[o for o in bpy.data.objects if o.type=='MESH']
for o in objects:
 c=o.get('componentId');before.setdefault(c,{'location':list(o.location),'scale':list(o.scale)})
 if c in trans:o.location=trans[c]['location'];o.scale=trans[c]['scale'];o['compositionRefinement']='ITERATION_1';o['compositionTransform']=trans[c]
s=bpy.context.scene;cam=s.camera
for lab,a in [('GAMEPLAY',0),('BACK',math.pi),('LEFT',math.pi/2),('RIGHT',-math.pi/2)]:cam.location=(math.sin(a)*18,-math.cos(a)*18,3);cam.rotation_euler=((Vector((0,0,1.7))-cam.location).to_track_quat('-Z','Y')).to_euler();cam.data.ortho_scale=8;s.render.filepath=os.path.join(out,'SHOP_COMPOSITION_'+lab+'.png');bpy.ops.render.render(write_still=True)
cam.location=(0,-12,3);cam.rotation_euler=((Vector((0,0,1.8))-cam.location).to_track_quat('-Z','Y')).to_euler();cam.data.ortho_scale=5;s.render.filepath=os.path.join(out,'SHOP_COMPOSITION_CLOSE_UP.png');bpy.ops.render.render(write_still=True)
blend=os.path.join(out,'SHOP_HERO_COMPOSITION_REFINED.blend');bpy.ops.wm.save_as_mainfile(filepath=blend)
json.dump({'status':'COMPLETED','executionMode':'REAL_BLENDER_WORKER_EXECUTION','blenderVersion':bpy.app.version_string,'recipeId':'GG-REC-BLD-SIMPLE-SHOP-GROWGO-001@1.0.0','transformChanges':trans,'blend':'SHOP_HERO_COMPOSITION_REFINED.blend','anonymousGeometryCount':0},open(os.path.join(out,'SHOP_COMPOSITION_RESULT.json'),'w'),indent=2)
